//import configServer from "./config/server.js";
import { server, io } from "./config/server.js";

//import wppService from "./services/wppService.js";

import { startWPPConnect, restartSessions } from "./services/wppService.js";

import {
  setupSocket,
  getSocketMap,
  getStoreName,
  getSessionName,
} from "./sockets/socketHandler.js";

import "./email/agendar.js";

// Configura os eventos do Socket.IO

setupSocket(io);

//restartSessions(io, getSocketMap(), getStoreName(), getSessionName());
// Inicia o WPPConnect

// Inicia o servidor na porta 3001

server.listen(3001, () => {
  console.log("Servidor Socket.IO rodando na porta 3001");
});
