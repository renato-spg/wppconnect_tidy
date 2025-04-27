const fs = require('fs');
const http = require('http');
const socketIo = require('socket.io');
const wppconnect = require('@wppconnect-team/wppconnect');

// Criação do servidor HTTP e Socket.IO
const server = http.createServer();
const io = socketIo(server, {
  cors: {
    origin: "*", // Permitir conexões de qualquer origem
  }
});

let latestQRCode = null;
let client = null; // Variável para armazenar o cliente WPPConnect
let loggedIn = false; // Controle de login (se o usuário está logado)

async function startWPPConnect() {
  try {
    // Cria a sessão do WPPConnect
    client = await wppconnect.create({
      session: 'fidelidadebot',
      autoClose: false,
      browserArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: '/snap/bin/chromium', // Caminho para o Chromium
      useChrome: false,
      debug: true,
      catchQR: (base64Qr, asciiQR) => {
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
        if (status === 'CONNECTED') {
          loggedIn = true;  // Atualiza a variável para "logado"
          io.emit('success', { message: 'Conectado com sucesso!' });  // Envia para o cliente
        }
      },
    });
    console.log('WPPConnect iniciado com sucesso!');
  } catch (error) {
    console.error('Erro ao iniciar WPPConnect:', error);
  }
}

// Evento de conexão com o cliente via Socket.IO
io.on('connection', (socket) => {
  console.log('Cliente conectado!');

  // Envia o QR code gerado para o cliente logo após a conexão, caso não esteja logado
  if (latestQRCode && !loggedIn) {
    socket.emit('qrCode', { qrcode: latestQRCode });
  }

  // Recebe a solicitação de um novo QR Code
  socket.on('request-new-qrcode', () => {
    if (!loggedIn) {
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
  socket.on('logout', () => {
    if (client) {
      console.log('Deslogando...');
      client.logout(); // Desloga o cliente
      loggedIn = false; // Marca como deslogado
      latestQRCode = null; // Limpa o QR Code antigo
      startWPPConnect(); // Recomeça o processo de login (gerando um novo QR Code)
      socket.emit('qrCode', { qrcode: latestQRCode }); // Envia o novo QR Code gerado
    }
  });

  // Quando o cliente se desconectar
  socket.on('disconnect', () => {
    console.log('Cliente desconectado!');
  });
});

// Inicia o servidor Socket.IO na porta 3000
server.listen(3000, () => {
  console.log('Servidor Socket.IO rodando na porta 3000');
});

// Inicia o WPPConnect
startWPPConnect();
