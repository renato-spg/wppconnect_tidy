import dayjs from "dayjs";

// 🔧 Configuração do pool com MariaDB
import { pool } from "../config/database.js"; // Lembre-se de adicionar a extensão .js para arquivos locais

const today = dayjs().format("YYYY-MM-DD");
const todayStart = `${today} 00:00:00`;

export async function gerarRelatorio() {
  const conn = await pool.getConnection();

  const totalUsers = await conn.query(`SELECT COUNT(*) AS total FROM users`);
  console.log("totalUsers:", totalUsers);

  const clientesPorLoja = await conn.query(`
    SELECT s.title AS loja, COUNT(u.id) AS total
    FROM store s
    LEFT JOIN users u ON u.email = s.id
    GROUP BY s.id, s.title
    ORDER BY s.title
  `);

  console.log("clientesPorLoja:", clientesPorLoja);

  const cadastradosHoje = await conn.query(
    `
    SELECT COUNT(*) AS total FROM users
    WHERE DATE(created_at) = ?
  `,
    [today]
  );
  console.log("cadastradosHoje:", cadastradosHoje);

  const clientesHojePorLoja = await conn.query(
    `
    SELECT s.title AS loja, COUNT(u.id) AS total
    FROM store s
    LEFT JOIN users u ON u.email = s.id AND DATE(u.created_at) = ?
    GROUP BY s.id, s.title
    ORDER BY s.title
  `,
    [today]
  );

  console.log("clientesHojePorLoja:", clientesHojePorLoja);

  const subQueryDebug = await conn.query(
    `
    SELECT u.email, DATE(u.created_at) AS dia, COUNT(*) AS daily_count
    FROM users u
    WHERE u.created_at < ?
    GROUP BY u.email, DATE(u.created_at)
  `,
    [todayStart]
  );
  console.log("subQueryDebug:", subQueryDebug);

  const picoPorLoja = await conn.query(
    `
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
  `,
    [todayStart]
  );
  console.log("picoPorLoja:", picoPorLoja);

  const lojasComDesempenho = clientesHojePorLoja.map((lojaHoje) => {
    const pico = picoPorLoja.find((p) => p.loja === lojaHoje.loja) || {
      meta: 0,
    };
    const totalHoje = Number(lojaHoje.total) || 0;
    const meta = Number(pico.meta) || 0;
    console.log(
      "totalHoje:",
      totalHoje,
      "| meta:",
      meta,
      "| loja:",
      lojaHoje.loja
    );
    const bateuMeta = totalHoje >= meta;
    return {
      loja: lojaHoje.loja,
      total: totalHoje,
      meta,
      bateuMeta,
    };
  });
  console.log("lojasComDesempenho:", lojasComDesempenho);

  conn.release();

  return {
    totalGeral: totalUsers[0].total,
    clientesPorLoja,
    cadastradosHoje: cadastradosHoje[0].total,
    clientesHojePorLoja: lojasComDesempenho,
    lojasComDesempenho,
  };
}
