import { pool } from "../config/database.js"; // Lembre-se da extensão .js
import dayjs from "dayjs";
import { register } from "module";
import path from "path";
import fs from "fs/promises"; // Recomendado para operações assíncronas

import { fileURLToPath } from "url"; // Importe 'fileURLToPath' para converter a URL em caminho

// Definições necessárias para simular __dirname no ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.resolve(__dirname, "data.json"); // Caminho absoluto correto

const newContent = {
  note: "ANOTAR",
  register: "REGISTRAR",
  assistance: "Celulares, Assistência Especializada\ne Acessórios",
};

export async function getCustomizations(storeId) {
  let conn;
  try {
    conn = await pool.getConnection();

    console.log("getCustomizations storeId: " + storeId);

    const rows = await conn.query(
      `
      SELECT
        (SELECT JSON_OBJECT('c1', c1, 'c2', c2, 'c3', c3, 'c4', c4, 'c5', c5)
         FROM whatsapp_customizations LIMIT 1) AS whatsapp,

        (SELECT JSON_OBJECT('id',id,'title', title)
         FROM store WHERE id = ? LIMIT 1) AS store,
         
 
        
        (SELECT JSON_OBJECT('assistance', assistance, 'note', note, 'register', register)
         FROM button_customizations LIMIT 1) AS buttons
    `,
      [storeId]
    );

    /* if(rows.length === 0) {
      console.log("rows.length === 0");
      return "Vazio";
    }else{

      console.log("rows.length > 0");
      console.log(rows[0]);

    return rows[0]; // mariaDB sempre retorna um array com um objeto
    }*/

    const result = {
      whatsapp: rows[0].whatsapp || { c1: "", c2: "", c3: "", c4: "", c5: "" }, // Se vazio, retorna null
      store: rows[0].store || { id: "", title: "" }, // Se vazio, retorna um objeto vazio
      buttons: rows[0].buttons || { note: "", assistance: "", register: "" }, // Se vazio, retorna null
    };

    return result;
  } catch (err) {
    console.error(err);
    return null;
  } finally {
    if (conn) conn.release();
  }
}

export async function getData(category) {
  let conn;
  try {
    conn = await pool.getConnection();

    if (category === "whatsapp") {
      const rows = await conn.query(
        "SELECT * FROM whatsapp_customizations LIMIT 1"
      );
      return rows[0] || null;
    }

    if (category === "store") {
      const rows = await conn.query("SELECT * FROM store");
      return rows[0] || null;
    }

    if (category === "buttons") {
      const rows = await conn.query(
        "SELECT * FROM button_customizations LIMIT 1"
      );
      return rows[0] || null;
    }

    // Se a categoria for inválida
    return "Categoria inválida";
  } catch (err) {
    console.error("Erro ao buscar dados:", err);
    return err.toString();
  } finally {
    if (conn) conn.release();
  }
}

export async function updateData(category, data) {
  let conn;
  try {
    conn = await pool.getConnection();

    if (category === "whatsapp") {
      console.log("WHATSAPP init");

      const rows = await conn.query(
        "SELECT id FROM whatsapp_customizations LIMIT 1"
      );

      console.log(rows);

      if (rows.length === 0) {
        console.log("WHATSAPP row null");

        await conn.query(
          `INSERT INTO whatsapp_customizations (c1, c2, c3, c4, c5) VALUES (?, ?, ?, ?, ?)`,
          [data.c1, data.c2, data.c3, data.c4, data.c5]
        );
        console.log("WhatsApp inserido");
        return {
          category: "whatsapp",
          message: "WhatsApp inserido",
          data: data,
        };
      } else {
        console.log("WHATSAPP row not null");
        console.log(rows);
        // console.log("id: "+row.id);

        await conn.query(
          `UPDATE whatsapp_customizations SET c1 = ?, c2 = ?, c3 = ?, c4 = ?, c5 = ?`,
          [data.c1, data.c2, data.c3, data.c4, data.c5]
        );
        console.log("WhatsApp atualizado");
        return {
          category: "whatsapp",
          message: "WhatsApp atualizado",
          data: data,
        };
      }
    }

    if (category === "store") {
      const row = await conn.query("SELECT id FROM store WHERE id = ?", [
        data.id,
      ]);
      console.log("row: " + row);
      if (row.length === 0) {
        await conn.query(`INSERT INTO store (id,title) VALUES (?,?)`, [
          data.id,
          data.title,
        ]);
        console.log("Inserido loja " + data.title);
        return {
          category: "store",
          message: "Inserido loja " + data.title,
          data: data,
        };
      } else {
        await conn.query(`UPDATE store SET title = ? WHERE id = ?`, [
          data.title,
          data.id,
        ]);
        console.log("Atualizado loja " + data.title);
        return {
          category: "store",
          message: "loja atualizada: " + data.title,
          data: data,
        };
        /* console.log("Nome da loja Já cadastrado: "+data.title);
        return {error_store:"Nome da loja já cadastrado: "+data.title};*/
      }
    }

    if (category === "buttons") {
      const row = await conn.query(
        "SELECT id FROM button_customizations LIMIT 1"
      );
      if (row.length === 0) {
        await conn.query(
          `INSERT INTO button_customizations (assistance, note, register) VALUES (?, ?, ?)`,
          [data.assistance, data.note, data.register]
        );
        console.log("Botões inseridos");
        return { category: "buttons", message: "Botões inseridos", data: data };
      } else {
        await conn.query(
          `UPDATE button_customizations SET assistance = ?, note = ?, register = ?`,
          [data.assistance, data.note, data.register]
        );
        console.log("Botões atualizados");
        return {
          category: "buttons",
          message: "Botões atualizados",
          data: data,
        };
      }
    }
  } catch (err) {
    console.error("Erro no upsert:", err);
    return { error: err.toString() };
  } finally {
    if (conn) conn.release();
  }
}
async function buscarAniversariantesValidos(cpf) {
  const conn = await pool.getConnection();
  const hoje = dayjs().format("MM-DD");

  const rows = await conn.query(
    `
    SELECT id, name, whatsapp, birthday
    FROM users
    WHERE DATE_FORMAT(STR_TO_DATE(birthday, '%d/%m/%Y'), '%m-%d') = ?
    AND (last_birthday_msg IS NULL OR last_birthday_msg <> CURDATE())
    AND cpf = ?
  `,
    [hoje, cpf]
  );

  conn.release();
  return rows;
}

export async function addUser(user) {
  let conn;
  try {
    conn = await pool.getConnection();

    let result = await conn.query("SELECT * FROM users WHERE cpf = ?", [
      user.cpf,
    ]);

    if (result.length > 0) {
      return { message: "CPF já cadastrado", response: false };
    }

    await conn.query(
      "INSERT INTO users(name, surname, cpf, birthday, email, whatsapp, point) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        user.name,
        user.surname,
        user.cpf,
        user.birthday,
        user.hash,
        user.whatsapp,
        0,
      ]
    );

    // AGORA usando await corretamente
    try {
      const aniversariantes = await buscarAniversariantesValidos(user.cpf);
      if (aniversariantes.length > 0) {
        console.log("Aniversariantes encontrados:", aniversariantes);
        return { message: "Mostre um atendente essa mensagem", response: true };
      } else {
        console.log("Nenhum aniversariante encontrado para hoje.");
        return { message: "Criado com sucesso", response: true };
      }
    } catch (error) {
      console.error("Erro ao buscar aniversariantes:", error);
      return { message: "Criado com sucesso", response: true };
    }
  } catch (err) {
    console.error("Erro ao adicionar usuário:", err);
    return null;
  } finally {
    if (conn) conn.release();
  }
}

// Busca usuários (todos ou por CPF)
export async function getUsers(cpf = null) {
  let conn;
  try {
    conn = await pool.getConnection();
    if (cpf) {
      const all = await conn.query("SELECT * FROM users");

      console.log(JSON.stringify(all, null, 2));

      const result = await conn.query("SELECT * FROM users WHERE cpf = ?", [
        cpf,
      ]);

      console.log("quanto retornado de user: " + result.length);

      if (result.length > 0) {
        const today = new Date().toISOString().split("T")[0]; // Data no formato 'YYYY-MM-DD'

        // Se a data da última ação for igual à data de hoje, bloqueia a ação
        const lastDate = result[0].last_action_date
          ? new Date(result[0].last_action_date).toISOString().split("T")[0]
          : null;

        // Compara strings
        if (lastDate === today) {
          return "Você já realizou esta ação hoje. Tente novamente amanhã";
        }
        // Caso contrário, realiza a ação e atualiza a data da última ação
        await conn.query(
          "UPDATE users SET last_action_date = ? WHERE cpf = ?",
          [today, cpf]
        );

        return result[0];
      } else {
        // Nenhum resultado encontrado
        return "Usuário não encontrado";
      }
    } else {
      //return "Nenhum CPF fornecido";
      return "Usuário não encontrado";
    }

    /* } else {
      const result = await conn.query('SELECT * FROM users');
      return result[0].length ? result[0] : 'Banco vazio';
    }*/
  } catch (err) {
    console.error("Erro ao buscar usuários:", err);
    //return `error: ${err.toString()}`
    //return `error: ${err.toString()}`
    return "Tente novamente";
  } finally {
    if (conn) conn.release();
  }
}

// Atualiza um usuário (com incremento de pontos)
export async function updateUser(cpf) {
  let conn;
  try {
    conn = await pool.getConnection();
    const fields = [];
    const values = [];
    /*  for (const key in updates) {
      fields.push(`${key} = ?`);
      values.push(updates[key]);
    }
  */
    fields.push("point = ?");
    const user = await getUsers(cpf);
    if (typeof user === "string") return user; //'Usuário não encontrado: cpf: '+cpf;

    let newPoint = 0;

    let point = parseInt(user.point);

    if (user.point == 5) {
      newPoint = 1;
    } else {
      newPoint = point + 1;
    }

    /* console.log(newPoint);
    console.log("cpf: "+cpf);
    console.log("userpoint: "+user.point);*/

    values.push(`${newPoint}`);

    values.push(cpf);

    const result = await conn.query(
      `UPDATE users SET ${fields.join(", ")} WHERE cpf = ?`,
      values
    );

    if (result.affectedRows) {
      user.point = `${newPoint}`;
      return user;
    } else {
      return "Houve um problema em atualizar point";
    }
  } catch (err) {
    console.error("error catch update:\n" + err.toString());
    return `Error: ${err.toString()}`;
  } finally {
    if (conn) conn.release();
  }
}

// Deleta um usuário
export async function deleteUser(id) {
  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query("DELETE FROM users WHERE id = ?", [id]);
    return result.affectedRows > 0;
  } catch (err) {
    console.error("Erro ao deletar usuário:", err);
    return false;
  } finally {
    if (conn) conn.release();
  }
}

// Exporta todas as funções
