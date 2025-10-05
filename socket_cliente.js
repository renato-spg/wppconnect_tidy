const { io } = require("socket.io-client");

// Conectando ao servidor Socket.IO
const socket = io("http://localhost:3001"); // sem transports

socket.on("connect", () => {
  console.log("Conectado ao servidor! ID:", socket.id);

  // Enviando evento de teste
  socket.emit("pingar", { msg: "Olá servidor!" });
});

socket.on("pong", (data) => {
  console.log("Recebi do servidor:", data);
});

// Para capturar qualquer outro evento
socket.onAny((event, data) => {
  console.log("Evento recebido:", event, data);
});
