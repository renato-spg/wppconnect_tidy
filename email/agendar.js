import cron from "node-cron";
import { pool } from "../config/database.js";
import { gerarRelatorio } from "./gerar_relatorio.js"; // ajuste conforme seu caminho
import { gerarTemplateHTML } from "./gerar_template_HTML.js";
import { enviarEmailHTML } from "./enviarEmailHtml.js"; // ajuste conforme seu caminho

import {
  logoutWPP,
  getLatestQRCode,
  getClient,
  getClients,
} from "../services/wppService.js";
import dayjs from "dayjs";
const run = async () => {
  try {
    console.log("📊 Gerando relatório...");
    const dados = await gerarRelatorio();
    console.log("📄 Gerando template HTML...");
    const html = gerarTemplateHTML(dados);
    console.log("📧 Enviando e-mail...");
    await enviarEmailHTML(html);
    console.log("✅ Relatório gerado e enviado com sucesso!");
  } catch (err) {
    console.error("❌ Erro ao gerar ou enviar relatório:", err);
  }
};

const dataInicio = new Date("2025-08-09");

async function buscarAniversariantesValidos() {
  const conn = await pool.getConnection();
  const hoje = dayjs().format("MM-DD"); // Formato atual: MM-DD

  // Ajustando para garantir que a data no banco seja comparada corretamente
  console.log("Data de hoje:", hoje);

  const rows = await conn.query(
    `
    SELECT id, name, whatsapp, birthday
    FROM users
    WHERE DATE_FORMAT(STR_TO_DATE(birthday, '%d/%m/%Y'), '%m-%d') = ?
    AND (last_birthday_msg IS NULL OR last_birthday_msg <> CURDATE())
  `,
    [hoje]
  );

  /*for (const user of rows) {
    await conn.query(`
      UPDATE users
      SET last_birthday_msg = CURDATE()
      WHERE id = ?
    `, [user.id]);
  }*/

  console.log("Resultado da consulta:", rows);

  conn.release();
  return rows;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function enviarMensagens(client, aniversariantes) {
  const conn = await pool.getConnection();

  for (const user of aniversariantes) {
    const mensagem = `🎉 Olá ${user.name}, feliz aniversário! Tudo de bom pra você! 🥳\n\nEstamos hoje com desconto 20% para você`;
    const numero = user.whatsapp; // ex: 5599999999999

    try {
      console.log(`Enviando para ${user.name} (${numero})`);

      const numeroSem9 = `${numero.substring(0, 2)}${numero.substring(3)}`;

      // primeira tentativa
      await client.sendMessage(`${numeroSem9}@s.whatsapp.net`, {
        text: mensagem,
      });

      await new Promise((resolve) => setTimeout(resolve, 2000));

      // segunda tentativa
      await client.sendMessage(`${numero}@s.whatsapp.net`, { text: mensagem });

      console.log(`✅ Mensagem enviada para ${user.name}`);
    } catch (err) {
      console.error(`❌ Erro ao enviar para ${user.name}:`, err);
    }

    await new Promise((resolve) => setTimeout(resolve, 1000)); // espera 1s
  }

  conn.release();
}

cron.schedule(
  "0 30 7 * * *",
  async () => {
    const hoje = new Date();

    if (hoje >= dataInicio) {
      // if (true) {
      const client = getClient();
      if (!client) {
        console.log("❌ Cliente Baileys não está logado.");
        return;
      }

      console.log("⏰ Iniciando tarefa agendada às 7:30...");

      console.log("⏰ Verificando aniversariantes...");

      const aniversariantes = await buscarAniversariantesValidos();

      if (aniversariantes.length === 0) {
        console.log("Nenhum aniversariante para hoje.");
        return;
      }

      console.log(`🎯 Encontrados ${aniversariantes.length} aniversariantes.`);

      await enviarMensagens(client, aniversariantes);
    } else {
      console.log(
        "📅 Ainda não chegou o dia de iniciar. Hoje é:",
        hoje.toLocaleDateString()
      );
    }
  },
  {
    timezone: "America/Sao_Paulo",
  }
);
const interval = 20 * 1000; // 20 segundos

/*setInterval(async () => {
  const hoje = new Date();

  // if (hoje >= dataInicio) {
  if (true) {
    const client = getClient();
    if (!client) {
      console.log('❌ Cliente WPPConnect não está logado.');
      return;
    }

    console.log('⏰ Iniciando tarefa agendada às 7:30...');
    console.log('⏰ Verificando aniversariantes...');

    const aniversariantes = await buscarAniversariantesValidos();

    if (aniversariantes.length === 0) {
      console.log('Nenhum aniversariante para hoje.');
      return;
    }

    console.log(`🎯 Encontrados ${aniversariantes.length} aniversariantes.`);
    await enviarMensagens(client, aniversariantes);

  } else {
    console.log('📅 Ainda não chegou o dia de iniciar. Hoje é:', hoje.toLocaleDateString());
  }
}, interval);*/

// Agendar para rodar todo dia às 23:00 (horário de Brasília)
/*cron.schedule('0 42 15 * * *', () => {
  const hoje = new Date();

  if (hoje >= dataInicio) {
    console.log('⏰ Iniciando tarefa agendada às 19:30...');
    run();
  } else {
    console.log('📅 Ainda não chegou o dia de iniciar. Hoje é:', hoje.toLocaleDateString());
  }
}, {
  timezone: 'America/Sao_Paulo'
});*/

console.log(typeof gerarRelatorio); // deve imprimir 'function'
console.log("🚀 Agendador iniciado, aguardando 19:30...");
//run();
