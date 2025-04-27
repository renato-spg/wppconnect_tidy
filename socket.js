const fs = require('fs');
const https = require('https');
const socketIo = require('socket.io');
const wppconnect = require('@wppconnect-team/wppconnect');
const { exec } = require('child_process');
const mariadb = require('mariadb');
const { log } = require('console');

const path = './db.json';

const pool = mariadb.createPool({
  host: 'localhost', // ou IP do servidor
  user: 'root',
  password: 'uey#keikduey##keyznking',
  database: 'card',
  connectionLimit: 5
});

// Criação do servidor HTTP e Socket.IO

// Criação do servidor HTTP e Socket.IO
const privateKey = fs.readFileSync('/etc/letsencrypt/live/handsoftlife.com.br/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/handsoftlife.com.br/cert.pem', 'utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/handsoftlife.com.br/chain.pem', 'utf8');

let permitirQRCode = 1;

// Configurar o servidor HTTPS
const credentials = { key: privateKey, cert: certificate, ca: ca };

const server = https.createServer(
  credentials,
   (req, res) => {
  res.writeHead(200);
  res.end('Secure server is running');
});

async function addUser(user) {
  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query(
      'INSERT INTO users(name, surname, cpf, birthday,email,whatsapp,point) VALUES (?, ?, ?, ?,?,?,?)',
      [user.name, user.surname, user.cpf, user.birthday,user.email,user.whatsapp,0]
    );
    return "Criado com sucesso";//{ id: result.insertId, ...user }; 
  } catch (err) {
    console.error('Erro ao adicionar usuário:', err);
    return null;
  } finally {
    if (conn) conn.release();
  }
}

async function updateUser_(id, updates){

console.log("id: "+id);

  console.log("updates");
  console.log(updates);
  
  let conn;

  try{

    conn = await pool.getConnection();


    const fields = [];
    const values = [];

   
    for(const key in updates){
      fields.push(`${key} = ?`)
      
    

values.push(updates[key])
    }

    fields.push("point = ?")

  //pegar e colocar +1
  
    


  console.log("CPF INFORMADO FOI: "+id);
  
   
console.log("updates vindo como : "+updates["cpf"]);

    const userPointArray = await getUsers(updates["cpf"])


  
    
    if(!userPointArray){

      console.log(`VEIO ERRADO ALGUMA COISAAAAAAAAAAAA`);
      return "Algo deu errado"
     }
   

     let userPoint = userPointArray.point

    if(userPoint){


    

console.log(`User point antes ${userPoint}`);


      userPoint = `${(userPoint+1)}`

      console.log(`User point depois ${userPoint}`);

      values.push(userPoint)

    
    values.push(updates["cpf"])

      const result = await conn.query(`update users set ${fields.join(", ")} WHERE cpf = ?`,values);

      if (result.affectedRows === 0) return null;


 return "Sucesso atualizar point"
    }else{

       return "Houve um problema em atualizar point"
    }

   
  }catch(err){
console.log("Error ao atualizar o usuario", err);
return null;
  }finally{
    if (conn) conn.release();
  }

}

// Função para buscar usuários (todos ou por id)
async function getUsers(id = null) {
  let conn;
  try {
    conn = await pool.getConnection();

  

    if (id) {
      console.log("CPF informado:", id);  // Verificando o CPF informado
      const result = await conn.query('SELECT * FROM users WHERE cpf = ?', [id]);


      console.log("teste with one");
  
      console.log(result[0]);

      console.log("com point");

      console.log(result[0].point);
  

      console.log("teste sem");
  
      console.log(result);
 
     
      if (result[0].length === 0) {
        console.log("Usuário não encontrado");
        return null;
      }

  
      return result[0];
    } else {
      const result = await conn.query('SELECT * FROM users');
      console.log("sem id");
      console.log("teste with one");
  
      console.log(result[0]);
  
      console.log("teste with two");
  
      console.log(result[0][0]);
  
      console.log("teste sem");
  
      console.log(result);

      if (result[0].length === 0) {
        console.log("Banco vazio");
        return "Banco vazio";
      }

      return result[0];
      
    
    }
  } catch (err) {
    console.error('Erro ao buscar usuários:', err);
    return null;
  } finally {
    if (conn) conn.release();
  }
}

// Atualizar usuário
async function updateUser(id, updates) {
  let conn;
  try {
    conn = await pool.getConnection();
    const fields = [];
    const values = [];
    for (const key in updates) {
      fields.push(`${key} = ?`);
      values.push(updates[key]);
    }
    values.push(id);

    const result = await conn.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    if (result.affectedRows === 0) return null;

    const updatedUser = await conn.query('SELECT * FROM users WHERE id = ?', [id]);
    return updatedUser[0];
  } catch (err) {
    console.error('Erro ao atualizar usuário:', err);
    return null;
  } finally {
    if (conn) conn.release();
  }
}

// Remover usuário
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


const io = socketIo(server, {
  cors: {
    origin: "*", // Permitir conexões de qualquer origem
  }
});

let latestQRCode = null;
let client = null; // Variável para armazenar o cliente WPPConnect
let loggedIn = false; // Controle de login (se o usuário está logado)

async function startWPPConnect() {

  if(client){
    console.log('Sessão já ativa!');
    io.emit('status', {message:'conexão ja ativa'})
    return;
  }

  try {
    // Cria a sessão do WPPConnect
    client = await wppconnect.create({
      session: 'fidelidadebot',
      headless : true,
      autoClose: false,
      browserArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: '/snap/bin/chromium', // Caminho para o Chromium
      useChrome: false,
      debug: true,
      catchQR: (base64Qr, asciiQR) => {
        io.emit('status', {message:'QRCODE aguardando conectar'})
        if (permitirQRCode ==10) {
          console.log('Acabou tempo de espera. Aperte gerar qrcode');
          io.emit('status', {message:'Acabou tempo de espera. Aperte gerar qrcode'})
          io.emit('hidden')
          return; // Ignora o QR code
        }else{
          permitirQRCode  = permitirQRCode+1;
        }

        io.emit('status', {message:'limite qrcode: '+permitirQRCode})
        
        
        console.log('Novo QR code gerado:');
        console.log(asciiQR);
        latestQRCode = base64Qr;
        const matches = base64Qr.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const imageBuffer = Buffer.from(matches[2], 'base64');
          fs.writeFile('out.png', imageBuffer, 'binary', (err) => {
            if (err) {
              console.error('Erro ao salvar QR code:', err);
            } else {
              console.log('QR code salvo como out.png');
            }
          });
        }

     

        // Envia o QR Code via Socket.IO para os clientes conectados
        io.emit('qrCode', { qrcode: base64Qr });
        loggedIn = false; // Marcar como não logado, pois ainda precisa ler o QR Code
        
      },
      logQR: false,
      statusFind: (status) => {
        console.log('Status do WPPConnect:', status);
        const connectedStatuses = ['inChat', 'CONNECTED', 'isLogged'];

  if (connectedStatuses.includes(status)) {
    console.log('Usuário logado!');
    loggedIn = true;
    io.emit('success', { message: 'Conectado com sucesso!' });
    io.emit('status', { message: '' });
  }
      },
    }).then(async (client) => {

      const clientInfo = await client.getHostDevice();

      console.log('📱 Número logado:', clientInfo.wid.user);        // Ex: 5511988889999
  console.log('👤 Nome no WhatsApp:', clientInfo.pushname);     // Ex: Renato

    });
    console.log('WPPConnect iniciado com sucesso!');
  } catch (error) {
    console.error('Erro ao iniciar WPPConnect:', error);
  }
}

const LIMITE_TEMPO_QR = 6* 1000; // 30 minutos em milissegundos

// Evento de conexão com o cliente via Socket.IO
io.on('connection', (socket) => {
  console.log('Cliente conectado!');


  if(client){
    //console.log('Cliente logado');
    loggedIn = true;
    io.emit('success', { message: 'Usuário conectado!' });
    
  }else{

  
  // Envia o QR code gerado para o cliente logo após a conexão, caso não esteja logado
 /* if (latestQRCode && !client) {
    socket.emit('qrCode', { qrcode: latestQRCode });
  }*/
}

socket.on('add-user', async (data) => {

  const required = ['name', 'surname','cpf',  'birthday', 'email',  'whatsapp'];

  const hasEmpty = required.some(field => !data[field]?.trim());

  console.log('required');

  console.log(required);

  console.log('hasEmpty');

  console.log(hasEmpty);

  console.log('DATA');

  console.log(data);

  if (hasEmpty){
    console.log('Preencha todos os campos!');
    return socket.emit('error', { message: 'Preencha todos os campos!' });
  } 

  const newUser = await addUser(data);

  if (newUser) {

    socket.emit('user-added', newUser);
    console.log(newUser);
  } else {

    socket.emit('error', { message: 'Erro ao adicionar usuário.' });
    console.log('Erro ao adicionar usuário.');

  }
});

socket.on('get-users', async (id = null) => {
  const result = await getUsers(id);
  console.log(result);
  
  socket.emit('users-data', result);
});

socket.on('update-user', async ({ id, updates }) => {
  const updated = await updateUser_(id, updates);
  if (!updated) return socket.emit('error', { message: 'Usuário não encontrado' });
  console.log(updated);
  socket.emit('user-updated', updated);
});

socket.on('delete-user', async (id) => {
  const success = await deleteUser(id);
  if (!success) return socket.emit('error', { message: 'Usuário não encontrado' });
  socket.emit('user-deleted', { id });
});

socket.on('liberar-qrcode', () => {

  if(!client){


    if(latestQRCode){

    
  
  permitirQRCode = 1;
  console.log('QR Code liberado para geração');
  socket.emit('status', {message:'Gerando outro QRCODE....'})
  io.emit('qrCode', { latestQRCode });
  socket.emit('status', {message:'QRCODE gerado com sucesso'})

    }else{
      console.log('QR Code latestQRCode null');
      socket.emit('status', {message:'Error gerar qrcode, aguarde um momento....'})
    }
  }else{

    socket.emit('status', {message:'Usuário já logado'})
  }
 /* setTimeout(() => {
    permitirQRCode = 1;
    console.log('QR Code bloqueado automaticamente após 5 minutos');
    if(!client){
      socket.emit('status', {message:'QR Code bloqueado automaticamente após 5 minutos\nAperte gerar outro!'})
    }
    
  },3 * 60 * 1000);*/
});

  // Recebe a solicitação de um novo QR Code
  socket.on('request-new-qrcode', () => {
    if (!client) {
      console.log('Solicitação de novo QR Code recebida');
      // Se o cliente não estiver logado, envia o QR Code gerado
      if (latestQRCode) {
        socket.emit('qrCode', { qrcode: latestQRCode });
      } else {
        socket.emit('error', { message: 'QR Code não disponível. Tente novamente.' });
      }
    } else {
      socket.emit('success', { message: 'Já está logado, QR Code não necessário.' });
    }
  });

  // Recebe a solicitação de deslogar e gerar um novo QR Code
  socket.on('logout', async () => {
  if (client) {
    console.log('Deslogando...');

    try {
      // Tenta realizar o logout e fechar a sessão
      await client.logout();
      await client.close(); // Aguarda o navegador fechar

      loggedIn = false;
      latestQRCode = null;

      // Caminho para o arquivo de lock
      const lockPath = '/var/www/fidelidadebot/tokens/fidelidadebot/SingletonLock';

      // Envia a mensagem de sucesso
      socket.emit('status', { message: 'Fazendo Logout. Aguarde...' });

      // Remove o arquivo de lock antes de reiniciar a sessão
      exec(`rm -f "${lockPath}"`, (err) => {
        if (err) {
          console.error('Erro ao remover o arquivo de lock:', err);
          socket.emit('error', { message: 'Erro ao remover arquivo de lock.' });
        } else {
          socket.emit('status', { message: 'Reiniciando sessão aguarde...' });
          
          console.log('Arquivo de lock removido');

          // Aguarda 2 segundos antes de reiniciar a sessão
          setTimeout(() => {
            startWPPConnect(); // Reinicia a sessão WPPConnect após remover o lock
          }, 2000);
        }
      });

    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      socket.emit('error', { message: 'Erro ao fazer logout. Tente novamente.' });
    }
  } else {
    console.log('Cliente não está logado.');
    socket.emit('status', { message: 'Nenhum cliente logado. Não é possível realizar o logout.' });
  }
});

  // Quando o cliente se desconectar
  socket.on('disconnect', () => {
    console.log('Cliente desconectado!');
  });
});

// Inicia o servidor Socket.IO na porta 3000
server.listen(3001, () => {
  console.log('Servidor Socket.IO rodando na porta 3001');
});

// Inicia o WPPConnect
startWPPConnect();
