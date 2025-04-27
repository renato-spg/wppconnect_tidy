const { pool } = require('../config/database');

const fs = require('fs');
const fs_ = require('fs').promises; // Use o fs.promises para operações assíncronas
const path = require('path');
const filePath = path.resolve(__dirname, 'data.json'); // Caminho absoluto correto

const newContent = {
  note: 'ANOTAR',
  register: 'REGISTRAR',
  assistance: "Celulares, Assistência Especializada\ne Acessórios"
};
async function updateData(data) {
  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query(
      'update data set note = ?, register = ?, assistance = ?',
      [data.note, data.register, data.assistance]
    );
    if(result.affectedRows){
      console.log('Alterado com sucesso');
    return data;
    }else{

      const res = addData(data)
  
      if(res){
        console.log('Criado com sucesso');
        return data;
      }else{
        console.log('Erro ao criar data:');
        return "Erro ao criar data in updateData:";
      }
      
    }
  } catch (err) {
    console.log('Erro ao adicionar usuário:', err);
    return `error: ${err.toString()}`
  } finally {
    if (conn) conn.release();
  }
}
async function addData(data = null) {
  let conn;
  try {
    
    conn = await pool.getConnection();


    let newValue = newContent;

    if(data)
      newValue = data
    

    const result = await conn.query(
      'INSERT INTO data (note,register,assistance) values(?,?,?)',
      [newValue.note, newValue.register, newValue.assistance]
    );
    if (result.affectedRows) {
      console.log('Criado com sucesso');
      return newValue;
    }
    else { 
      console.log('Erro ao criar data:');
      return null;
    }
  } catch (err) {
    console.error('Erro ao adicionar usuários:', err);
    return null;
  } finally {
    if (conn) conn.release();
  }

}
async function getData() {
  let conn;
  try {
    conn = await pool.getConnection();
   
      const result = await conn.query('SELECT * FROM data');

      if (result.length > 0) {
        return result[0]
      } else {
      
       const res = addData()
  
        if(res){
          console.log('Criado com sucesso');
          return newContent;
        }else{
          console.log('Erro ao criar data:');
          return "Erro ao criar data:";
        }

      }
   
    
   /* } else {
      const result = await conn.query('SELECT * FROM users');
      return result[0].length ? result[0] : 'Banco vazio';
    }*/
  } catch (err) {
    console.error('Erro ao buscar usuários:', err);
    return `error: ${err.toString()}`
  } finally {
    if (conn) conn.release();
  }
}


async function addUser(user) {
  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query(
      'INSERT INTO users(name, surname, cpf, birthday, email, whatsapp, point) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [user.name, user.surname, user.cpf, user.birthday, user.email, user.whatsapp, 0]
    );
    return 'Criado com sucesso';
  } catch (err) {
    console.error('Erro ao adicionar usuário:', err);
    return null;
  } finally {
    if (conn) conn.release();
  }
}

// Busca usuários (todos ou por CPF)
async function getUsers(cpf = null) {
  let conn;
  try {
    conn = await pool.getConnection();
    if (cpf) {
      const result = await conn.query('SELECT * FROM users WHERE cpf = ?', [cpf]);

      if (result.length > 0) {
        return result[0]
      } else {
        // Nenhum resultado encontrado
    return "CPF não encontrado";
      }
    }else{
      return "Error inesperado";
    }
    
   /* } else {
      const result = await conn.query('SELECT * FROM users');
      return result[0].length ? result[0] : 'Banco vazio';
    }*/
  } catch (err) {
    console.error('Erro ao buscar usuários:', err);
    return `error: ${err.toString()}`
  } finally {
    if (conn) conn.release();
  }
}

// Atualiza um usuário (com incremento de pontos)
async function updateUser(cpf) {
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
    fields.push('point = ?');
    const user = await getUsers(cpf);
    if (typeof user === "string") return 'Usuário não encontrado: cpf: '+cpf;

    let newPoint = 0

    let point = parseInt(user.point)

    if(user.point == 5){
   newPoint = 1;
    }else{
     newPoint = point + 1
    }

   /* console.log(newPoint);
    console.log("cpf: "+cpf);
    console.log("userpoint: "+user.point);*/
    
    

    values.push(`${newPoint}`);

    values.push(cpf);

    const result = await conn.query(`UPDATE users SET ${fields.join(', ')} WHERE cpf = ?`, values);


    if(result.affectedRows){
      user.point = `${newPoint}`
      return user;
    }else{
return 'Houve um problema em atualizar point'
    }
  
  } catch (err) {
    console.error("error catch update:\n"+err.toString());
  return `Error: ${err.toString()}`
  } finally {
    if (conn) conn.release();
  }
}

// Deleta um usuário
async function deleteUser(id) {
  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows > 0;
  } catch (err) {
    console.error('Erro ao deletar usuário:', err);
    return false;
  } finally {
    if (conn) conn.release();
  }
}

// Exporta todas as funções
module.exports = { addUser, getUsers, updateUser, deleteUser, updateData, getData };