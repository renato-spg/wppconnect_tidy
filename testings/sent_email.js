const mariadb = require('mariadb');
const nodemailer = require('nodemailer');
const dayjs = require('dayjs');

const user = 'root';
const password = '';
const backupFile = 'backup.sql';

// 🔧 Configuração do pool com MariaDB
const pool = mariadb.createPool({
  host: '127.0.0.1',
  user: 'root',
  password: '',
  database: 'test',
  connectionLimit: 10 // aumentar limite se necessário
});

if(pool === null){
  console.error('❌ Erro ao conectar ao banco de dados');
  process.exit(1);
}else{
  console.log('✅ Conexão com o banco de dados estabelecida com sucesso');
}
const today = dayjs().format('YYYY-MM-DD');
const todayStart = `${today} 00:00:00`;

async function gerarRelatorio() {
  const conn = await pool.getConnection();

  const totalUsers = await conn.query(`SELECT COUNT(*) AS total FROM users`);
  console.log('totalUsers:', totalUsers);

  const clientesPorLoja = await conn.query(`
    SELECT s.title AS loja, COUNT(u.id) AS total
    FROM store s
    LEFT JOIN users u ON u.email = s.id
    GROUP BY s.id, s.title
    ORDER BY s.title
  `);
  console.log('clientesPorLoja:', clientesPorLoja);

  const cadastradosHoje = await conn.query(`
    SELECT COUNT(*) AS total FROM users
    WHERE DATE(created_at) = ?
  `, [today]);
  console.log('cadastradosHoje:', cadastradosHoje);

  const clientesHojePorLoja = await conn.query(`
    SELECT s.title AS loja, COUNT(u.id) AS total
    FROM store s
    LEFT JOIN users u ON u.email = s.id AND DATE(u.created_at) = ?
    GROUP BY s.id, s.title
    ORDER BY s.title
  `, [today]);
  console.log('clientesHojePorLoja:', clientesHojePorLoja);

  const subQueryDebug = await conn.query(`
    SELECT u.email, DATE(u.created_at) AS dia, COUNT(*) AS daily_count
    FROM users u
    WHERE u.created_at < ?
    GROUP BY u.email, DATE(u.created_at)
  `, [todayStart]);
  console.log('subQueryDebug:', subQueryDebug);

  const picoPorLoja = await conn.query(`
    SELECT s.title AS loja, COALESCE(MAX(sub.daily_count), 0) AS meta
    FROM store s
    LEFT JOIN (
      SELECT u.email, DATE(u.created_at) AS dia, COUNT(*) AS daily_count
      FROM users u
      WHERE u.created_at < ?
      GROUP BY u.email, DATE(u.created_at)
    ) AS sub ON sub.email = s.id
    GROUP BY s.id, s.title
    ORDER BY s.title
  `, [todayStart]);
  console.log('picoPorLoja:', picoPorLoja);

  const lojasComDesempenho = clientesHojePorLoja.map(lojaHoje => {
    const pico = picoPorLoja.find(p => p.loja === lojaHoje.loja) || { meta: 0 };
    const totalHoje = Number(lojaHoje.total) || 0;
    const meta = Number(pico.meta) || 0;
    console.log('totalHoje:', totalHoje, '| meta:', meta, '| loja:', lojaHoje.loja);
    const bateuMeta = totalHoje >= meta;
    return {
      loja: lojaHoje.loja,
      total: totalHoje,
      meta,
      bateuMeta
    };
  });
  console.log('lojasComDesempenho:', lojasComDesempenho);

  conn.release();

  return {
    totalGeral: totalUsers[0].total,
    clientesPorLoja,
    cadastradosHoje: cadastradosHoje[0].total,
    clientesHojePorLoja: lojasComDesempenho,
    lojasComDesempenho
  };
}

function gerarTemplateHTML(dados) {
  const dataHoje = dayjs().format('DD/MM/YYYY');

  const table = (title, rows, extraHeaders = [], extraColsFn = null) => `
    <h2 style="color: #333">${title}</h2>
    <table style="border-collapse: collapse; width: 100%; margin-bottom: 20px;">
      <thead>
        <tr style="background-color: #f2f2f2;">
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Loja</th>
          ${extraHeaders.map(h => `<th style="border: 1px solid #ddd; padding: 8px; text-align: left;">${h}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${rows.map(r => `
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">${r.loja}</td>
            ${extraColsFn ? extraColsFn(r) : ''}
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  console.log('dados antes do HTML:', dados);

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <h1 style="color: #4CAF50;">📊 Relatório Diário - ${dataHoje}</h1>
      <p><strong>Total geral de clientes:</strong> ${dados.totalGeral}</p>
      
      ${table('Clientes por Loja', dados.clientesPorLoja, ['Total'],
        r => `<td style="border: 1px solid #ddd; padding: 8px;">
                ${isNaN(Number(r.total)) || r.total === 0 ? '0' : Math.round(Number(r.total))}
              </td>`
      )}

      <p><strong>Total cadastrados hoje:</strong> ${dados.cadastradosHoje}</p>

      ${table('Clientes cadastrados hoje por loja (comparado ao maior dia anterior)', dados.clientesHojePorLoja,
        ['Total', 'Meta', 'Meta batida?'],
        r => `
          <td style="border: 1px solid #ddd; padding: 8px;">
            ${isNaN(Number(r.total)) || r.total === 0 ? '0' : Math.round(Number(r.total))}
          </td>
          <td style="border: 1px solid #ddd; padding: 8px;">${Number(r.meta) || '–'}</td>
          <td style="border: 1px solid #ddd; padding: 8px; color: ${r.bateuMeta ? 'green' : 'red'};">
            ${r.bateuMeta ? '✅ Sim' : '❌ Não'}
          </td>
        `
      )}

      ${table('Maior número de cadastros anteriores por loja', dados.lojasComDesempenho,
        ['Meta'],
        r => `
          <td style="border: 1px solid #ddd; padding: 8px;">${Number(r.meta) || '–'}</td>
        `
      )}
    </div>
  `;
}

async function enviarEmailHTML(html) {
  const testAccount = await nodemailer.createTestAccount();

  const transporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  });

  const info = await transporter.sendMail({
    from: 'Relatório Diário <no-reply@relatorios.com>',
    to: 'teste@email.com',
    subject: '📊 Relatório Diário - Clientes',
    html
  });

  console.log('📧 Email de teste enviado. Veja em:', nodemailer.getTestMessageUrl(info));
}

const run = (async () => {
  try {
    const dados = await gerarRelatorio();
    const html = gerarTemplateHTML(dados);
    await enviarEmailHTML(html);
  } catch (err) {
    console.error('❌ Erro ao gerar ou enviar relatório:', err);
  }
});
//run()
const { exec } = require('child_process');
function backupMySQL() {
  const command = `mysqldump -u ${user} -p${password} --all-databases > ${backupFile}`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Erro ao fazer backup: ${error.message}`);
      return;
    }
    console.log(`Backup salvo como: ${backupFile}`);
  });
}

//backupMySQL();
// 
// 
run()