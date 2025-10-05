const { pool } = require('../config/database');
const dayjs = require('dayjs');

async function buscarAniversariantesValidos() {
  const conn = await pool.getConnection();
  const hoje = dayjs().format('MM-DD'); // Formato atual: MM-DD

  // Ajustando para garantir que a data no banco seja comparada corretamente
  console.log('Data de hoje:', hoje);

  const rows = await conn.query(`
    SELECT id, name, whatsapp, birthday
    FROM users
    WHERE DATE_FORMAT(STR_TO_DATE(birthday, '%d/%m/%Y'), '%m-%d') = ?
    AND (last_birthday_msg IS NULL OR last_birthday_msg <> CURDATE())
  `, [hoje]);

  console.log('Resultado da consulta:', rows);

  conn.release();
  return rows;
}

async function init() {
  console.log('⏰ Iniciando tarefa agendada às 7:30...');

  console.log('⏰ Verificando aniversariantes...');

  const aniversariantes = await buscarAniversariantesValidos();

  console.log('Aniversariantes encontrados:', aniversariantes);

  if (aniversariantes.length === 0) {
    console.log('Nenhum aniversariante para hoje.');
    return;
  }

  console.log(`🎉 Encontrados ${aniversariantes.length} aniversariantes.`);
}

init();








  async function enviarMensagens(client, aniversariantes) {
    const conn = await pool.getConnection();
 // console.log('Aniversariantes:', aniversariantes);
 // console.log(aniversariantes[0]);

  if(aniversariantes.length === 0) {
    console.log('Nenhum aniversariante encontrado.');   
    return;
    }else {
      console.log('Aniversariantes encontrados:', aniversariantes);
    }
  
  
    for (const user of aniversariantes) {
      const mensagem = `🎉 Olá ${user.nome}, feliz aniversário! Tudo de bom pra você! 🥳`;
      const numero = user.whatsapp; // ex: 5599999999999
  console.log(`Número: ${numero}`);
  console.log(`Mensagem: ${mensagem}`);
  
  
      try {
        console.log(`Enviando para ${user.name} (${numero})`);
      //  await client.sendText(`${numero}@c.us`, mensagem);
  
        await conn.query(
          'UPDATE users SET last_birthday_msg = CURDATE() WHERE id = ?',
          [user.id]
        );
  
        console.log(`✅ Mensagem enviada para ${user.nome}`);
      } catch (err) {
        console.error(`❌ Erro ao enviar para ${user.nome}:`, err);
      }
  
      await new Promise(resolve => setTimeout(resolve, 1000)); // espera 1s
    }
  
    conn.release();
  }
  
