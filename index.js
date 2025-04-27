const { server, io } = require('./config/server');
const { startWPPConnect } = require('./services/wppService');
const { setupSocket } = require('./sockets/socketHandler');

// Configura os eventos do Socket.IO
setupSocket(io);

// Inicia o WPPConnect
startWPPConnect(io);

// Inicia o servidor na porta 3001
server.listen(3001, () => {
  console.log('Servidor Socket.IO rodando na porta 3001');
});