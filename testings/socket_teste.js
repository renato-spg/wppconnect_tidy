const fs = require('fs');
const https = require('https');
const socketIo = require('socket.io');

// Caminhos para os arquivos de certificado
const privateKey = fs.readFileSync('/etc/letsencrypt/live/handsoftlife.com.br/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/handsoftlife.com.br/cert.pem', 'utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/handsoftlife.com.br/chain.pem', 'utf8');

// Configurar o servidor HTTPS
const credentials = { key: privateKey, cert: certificate, ca: ca };

const server = https.createServer(credentials, (req, res) => {
  res.writeHead(200);
  res.end('Secure server is running');
});

// Configurar o Socket.IO
const io = socketIo(server);

io.on('connection', (socket) => {
  console.log('A new client has connected');
  socket.on('disconnect', () => {
    console.log('A client has disconnected');
  });
});

// Iniciar o servidor na porta 443 (HTTPS padrão)
server.listen(3000, () => {
  console.log('Server is running on https://yourdomain.com');
});
