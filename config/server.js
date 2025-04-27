const fs = require('fs');
const https = require('https');
const socketIo = require('socket.io');

// Carrega certificados SSL
/*const privateKey = fs.readFileSync('/etc/letsencrypt/live/handsoftlife.com.br/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/handsoftlife.com.br/cert.pem', 'utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/handsoftlife.com.br/chain.pem', 'utf8');

const credentials = { key: privateKey, cert: certificate, ca: ca };*/

// Cria o servidor HTTPS
const server = https.createServer(
 //   credentials,
     (req, res) => {
  res.writeHead(200);
  res.end('Secure server is running');
});

// Configura o Socket.IO
const io = socketIo(server, {
  cors: {
    origin: '*', // Permite conexões de qualquer origem
  },
});

// Exporta o servidor e o io para uso em outros arquivos
module.exports = { server, io };