import fs from "fs";
import http from "http";
import { Server } from "socket.io";

// Carrega certificados SSL
/*const privateKey = fs.readFileSync(
  "/etc/letsencrypt/live/polvocell.com.br/privkey.pem",
  "utf8"
);
const certificate = fs.readFileSync(
  "/etc/letsencrypt/live/polvocell.com.br/cert.pem",
  "utf8"
);
const ca = fs.readFileSync(
  "/etc/letsencrypt/live/polvocell.com.br/chain.pem",
  "utf8"
);

const credentials = {
  key: fs.readFileSync("/etc/letsencrypt/live/polvocell.com.br/privkey.pem"),
  cert: fs.readFileSync("/etc/letsencrypt/live/polvocell.com.br/fullchain.pem"),
};
*/
// Cria o servidor HTTPS
export const server = http.createServer(
  //  credentials,
  (req, res) => {
    res.writeHead(200);
    res.end("Secure server is running");
  }
);

// Configura o Socket.IO
export const io = new Server(server, {
  cors: {
    origin: "*", // Permite conexões de qualquer origem
  },
  allowEIO3: true, // <<< Isso permite compatibilidade com clientes Socket.IO v2/v3 (Android)
});

// Exporta o servidor e o io para uso em outros arquivos
