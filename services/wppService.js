import path from "path";
import fs from "fs";
import { exec } from "child_process";
import pino from "pino";
import qrcodeTerminal from "qrcode-terminal"; // Para mostrar QR no terminal
import QRCode from "qrcode";
// O import do Baileys já estava OK, mas vou deixá-lo fora do IIFE para simplificar o uso:
import baileys, {
  default as makeWASocket,
  DisconnectReason,
  Browsers,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";

import { fileURLToPath } from "url"; // Importe 'fileURLToPath' para converter a URL em caminho
// Definições necessárias para simular __dirname no ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// O bloco async/IIFE pode ser removido, a menos que você precise de um escopo isolado
// (a desestruturação já está feita acima)
/*
(async () => {
  // ...
})();
*/

const logger = pino({ level: "silent" }); // pino não precisa de new
export let sock = null;
export let latestQRCode = null;
let loggedIn = false;
let permitirQRCode = 0;
export let clients = {}; // sessões ativas do WhatsApp

// Nota: Você estava importando "qrcode-terminal" duas vezes. Simplifiquei para apenas uma.
// O pacote "qrcode" (o qual você importou como `QRCode`) também pode ser usado
// para gerar o QR code no terminal se você preferir, mas mantive o qrcodeTerminal
// porque ele é geralmente mais simples para essa finalidade.
const sessoesEmProcesso = new Set();
const qrcodeEnviado = new Set();
function cleanOldKeys(sessionPath, keep = 5) {
  console.log("🧹 Limpando arquivos antigos...");

  const types = ["pre-key-", "sender-key-", "session-"];
  const authPath = path.join(sessionPath, "auth_info");

  if (!fs.existsSync(authPath)) return;

  const ONE_DAY = 24 * 60 * 60 * 1000; // 1 dia em ms
  const now = Date.now();

  types.forEach((type) => {
    const files = fs
      .readdirSync(authPath)
      .filter((f) => f.startsWith(type))
      .map((f) => {
        const filePath = path.join(authPath, f);
        const fileTime = fs.statSync(filePath).mtime.getTime();
        return { name: f, time: fileTime };
      })
      // filtra arquivos com mais de 1 dia
      .filter((file) => now - file.time > ONE_DAY)
      // ordena do mais recente para o mais antigo
      .sort((a, b) => b.time - a.time);

    // mantém os 'keep' mais recentes, deleta o resto
    const toDelete = files.slice(keep);
    toDelete.forEach((file) => {
      try {
        fs.unlinkSync(path.join(authPath, file.name));
        console.log(`🗑️ Arquivo deletado: ${file.name}`);
      } catch (err) {
        console.error(`❌ Erro ao deletar ${file.name}:`, err.message);
      }
    });
  });
}

// Exemplo de uso: roda a limpeza a cada 24h
function scheduleDailyCleanup(sessionPath, keep = 5) {
  // roda uma vez ao iniciar
  cleanOldKeys(sessionPath, keep);

  // agenda para rodar a cada 24h
  setInterval(() => {
    cleanOldKeys(sessionPath, keep);
  }, 24 * 60 * 60 * 1000); // 24h em ms
}

function ensureSessionFolder(sessionPath) {
  if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath, { recursive: true });
  }
}

export function listarSessoesSalvas() {
  console.log("path como" + path.join(__dirname, "tokens"));

  const pastaTokens = path.join(__dirname, "tokens");

  if (!fs.existsSync(pastaTokens)) {
    return [];
  }

  // Lista todas as pastas de sessão
  return fs.readdirSync(pastaTokens).filter((sessao) => {
    const pastaSessao = path.join(pastaTokens, sessao);

    // Aqui você pode criar uma flag quando a sessão der 401
    // Ex: criar um arquivo "revogada.txt" dentro da pasta
    const flagRevogada = path.join(pastaSessao, "revogada.txt");

    // Se existe a flag, não retorna essa sessão
    if (fs.existsSync(flagRevogada)) {
      console.log(`Ignorando sessão ${sessao} (revogada).`);
      return false;
    }

    return fs.lstatSync(pastaSessao).isDirectory();
  });
}

function sendSock(success, msg, sock, storeName) {
  if (!sock) {
    console.error("❌ Socket não encontrado para:", storeName);
  } else {
    console.log("✅ Enviando hide para o socket:", sock.id);
    sock.emit("hidden", { success: success, msg: msg });
  }
}

export async function startWPPConnect(
  sessionName,
  io,
  getSocketMap,
  storeName
) {
  if (sessoesEmProcesso.has(sessionName)) {
    throw new Error("Sessão já em inicialização.");
  }

  console.log("storeName: " + storeName);

  if (getSocketMap.get(storeName)) {
    console.log("socketMap: com dados");
  } else {
    console.log("socketMap: sem  dados");
  }

  const sessionPath = path.join(__dirname, "tokens", sessionName);

  sessoesEmProcesso.add(sessionName);
  ensureSessionFolder(sessionPath);

  console.log("📂 Caminho da sessão:", sessionPath);

  const { state, saveCreds } = await useMultiFileAuthState(
    path.join(sessionPath, "auth_info")
  );
  const { version } = await fetchLatestBaileysVersion();
  console.log("📦 Versão usada no socket:", version);
  return new Promise((resolve, reject) => {
    const client = makeWASocket({
      version,
      logger, // <-- habilita logs completos
      auth: state,
      browser: Browsers.ubuntu("Chrome"),
      syncFullHistory: false,
      connectTimeoutMs: 10000,
      keepAliveIntervalMs: 15000, // antes estava 30000
      generateHighQualityLinkPreview: false,
      printQRInTerminal: false,
      getMessage: async (key) => ({ conversation: "" }),
      /*  getMessage: async (key) => {
        try {
          const msg = await client.store.loadMessage(key.remoteJid, key.id);
          return msg || { conversation: "" }; // garante que Baileys processe
        } catch {
          return { conversation: "" };
        }
      },*/
    });

    // Remover listeners internos desnecessários
    client.ev.removeAllListeners("status.update"); // atualizações de status
    client.ev.removeAllListeners("status-receipt.update"); // recibos de status
    client.ev.removeAllListeners("chats.update"); // atualizações de chats
    client.ev.removeAllListeners("chats.upsert"); // criação de chats
    client.ev.removeAllListeners("chats.set"); // sincronização completa de chats
    client.ev.removeAllListeners("contacts.update"); // atualizações de contatos
    client.ev.removeAllListeners("contacts.upsert"); // criação de contatos
    client.ev.removeAllListeners("contacts.set"); // sincronização completa de contatos
    client.ev.removeAllListeners("presence.update"); // presença online/offline
    client.ev.removeAllListeners("messages.reaction"); // reações a mensagens
    client.ev.removeAllListeners("messages.revoke"); // mensagens apagadas
    client.ev.removeAllListeners("groups.update"); // mudanças em grupos
    client.ev.removeAllListeners("groups.upsert"); // criação de grupos
    client.ev.removeAllListeners("groups.set"); // sincronização completa de grupos

    /*store.bind(client.ev);
    store.messages = {}; // Garante que o store não acumule mensagens*/
    clients[sessionName] = client; // 🔥 salva instância global

    let timeoutId = setTimeout(() => {
      console.log(`⏰ Tempo esgotado para sessão ${sessionName}`);
      qrcodeEnviado.delete(sessionName);
      sessoesEmProcesso.delete(sessionName);

      try {
        client.end?.();
      } catch (e) {}

      reject(new Error("Tempo limite atingido (máx 2 minutos)."));
    }, 2 * 60 * 1000); // 2 minutos

    client.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;
      const reason = lastDisconnect?.error?.output?.statusCode;

      console.log("STATUS CONEXÃO:", connection);

      if (lastDisconnect?.error) {
        console.error("ERRO DE CONEXÃO:", lastDisconnect.error);
      }

      console.log(
        `🔍 Atualização de conexão para ${sessionName}:`,
        JSON.stringify(update, null, 2)
      );

      if (qr && !qrcodeEnviado.has(sessionName) && !state?.creds?.registered) {
        qrcodeEnviado.add(sessionName);

        console.log(`📲 QRCode gerado para sessão ${sessionName}`);

        latestQRCode = await QRCode.toDataURL(qr);

        sessoesEmProcesso.delete(sessionName);
        const rest = `2 minutos para se conectar conecte-se quanto antes`;

        console.log("Buscando no socketMap:", {
          key: storeName,
          hasKey: getSocketMap.has(storeName),
        });

        const sock = getSocketMap.get(storeName);

        if (!sock) {
          console.error("❌ Socket não encontrado para:", storeName);
        } else {
          console.log("✅ Enviando QR Code para socket:", sock.id);
          sock.emit("qrCode", { qrcode: latestQRCode, rest });
        }

        resolve({ success: true, qrcode: latestQRCode });
      }

      if (connection === "open") {
        console.log(`✅ Sessão ${sessionName} conectada com sucesso!`);

        const sock = clients[sessionName];

        if (!sock) {
          console.error("❌ Sessão não encontrada:", sessionName);
          return;
        }

        loggedIn = true;

        const sockSocket = getSocketMap.get(storeName);
        sendSock(true, "", sockSocket, storeName);

        getSocketMap
          .get(storeName)
          .emit("success", { message: "Conectado com sucesso!" });
        getSocketMap.get(storeName).emit("status", { message: "" });

        console.log("🔹 Conexão aberta, sincronizando histórico...");
        //  sock.presenceSubscribe(jid); // ativa presença
        clearTimeout(timeoutId);
        qrcodeEnviado.delete(sessionName);
        sessoesEmProcesso.delete(sessionName);

        scheduleDailyCleanup(sessionPath, 5);

        const revogadaFile = path.join(sessionPath, "revogada.txt");
        if (fs.existsSync(revogadaFile)) {
          fs.unlinkSync(revogadaFile);
          const authInfoPath = path.join(sessionPath, "auth_info");
          if (fs.existsSync(authInfoPath)) {
            fs.rmSync(authInfoPath, { recursive: true, force: true });
          }
          console.log(
            `✅ Sessão ${sessionName} limpa e removida da lista de revogadas`
          );
        }
        resolve({ success: true, storeName, qrcode: null });
      }

      if (connection === "close") {
        console.log(`⚠️ Sessão ${sessionName} desconectada`);

        const sockClose = clients[sessionName];

        if (!sockClose) {
          console.error("❌ Sessão não encontrada:", sessionName);
          return;
        }

        const sock = getSocketMap.get(storeName);

        // wsSend(ws, { type: "hide", pedidoId });
        console.log("Motivo desconexão:", reason);

        // Limpar o cliente da lista para evitar conflitos
        delete clients[sessionName];

        if (reason === 515) {
          console.log(
            `🔄 Erro 515 detectado. Tentando reconectar sessão ${sessionName}...`
          );
          try {
            // Aguarda um pequeno intervalo para garantir que o servidor esteja pronto
            await new Promise((resolve) => setTimeout(resolve, 2000));
            // Reinicia a sessão
            const result = await startWPPConnect(
              sessionName,
              io,
              getSocketMap,
              storeName
            );
            resolve(result);
          } catch (err) {
            sendSock(
              false,
              "Error ao conectar, entre em contato com o administrador",
              sock,
              storeName
            );
            loggedIn = false;
            getSocketMap
              .get(storeName)
              .emit("status", { message: "Desconectado: " + reason });

            console.error(`❌ Erro ao reconectar: ${err.message}`);
            reject(
              new Error(`Erro ao reconectar após erro 515: ${err.message}`)
            );
          }
        } else if (reason === 401) {
          sendSock(
            false,
            "Error ao conectar, entre em contato com o administrador",
            sock,
            storeName
          );
          loggedIn = false;
          getSocketMap
            .get(storeName)
            .emit("status", { message: "Desconectado: " + reason });

          console.log(
            `⚠️ Sessão ${sessionName} revogada (401). Limpando credenciais...`
          );
          const revogadaFile = path.join(sessionPath, "revogada.txt");
          fs.writeFileSync(revogadaFile, "Sessão revogada ou expirada");
          const authInfoPath = path.join(sessionPath, "auth_info");
          if (fs.existsSync(authInfoPath)) {
            fs.rmSync(authInfoPath, { recursive: true, force: true });
          }
          reject(new Error("Sessão revogada ou expirada (401)."));
        } else if (reason === DisconnectReason.badSession) {
          sendSock(
            false,
            "Error ao conectar, entre em contato com o administrador",
            sock,
            storeName
          );
          console.log(`⚠️ Sessão inválida detectada. Limpando credenciais...`);
          const authInfoPath = path.join(sessionPath, "auth_info");
          if (fs.existsSync(authInfoPath)) {
            fs.rmSync(authInfoPath, { recursive: true, force: true });
          }
          reject(new Error("Sessão inválida. Credenciais limpas."));
        } else {
          sendSock(
            false,
            "Error ao conectar, entre em contato com o administrador",
            sock,
            storeName
          );
          loggedIn = false;
          getSocketMap
            .get(storeName)
            .emit("status", { message: "Desconectado: " + reason });

          console.error(
            `❌ Erro desconhecido na sessão:`,
            JSON.stringify(lastDisconnect)
          );
          reject(
            new Error(`Erro na sessão: ${JSON.stringify(lastDisconnect)}`)
          );
        }
      }
    });

    client.ev.on("contacts.upsert", (update) => {
      console.log("🚫 Atualização de contatos ignorada!");
      // não faz nada
    });

    client.ev.on("chats.set", (chats) => {
      console.log("🚫 Sincronização de chats bloqueada!");
      // não faz nada
    });
    client.ev.on("messages.sync", async (syncEvent) => {
      console.log("🚫 Sincronização de mensagens bloqueada!");
      // simplesmente não faz nada com esse evento
    });
    client.ev.on("creds.update", saveCreds);

    client.ev.on("error", (err) => {
      clearTimeout(timeoutId);
      sessoesEmProcesso.delete(sessionName);
      reject(new Error("Erro interno: " + err.message));
    });
  });
}

export async function logoutWPP(socket, io) {
  if (!sock) {
    console.log("Cliente não está logado.");
    socket.emit("status", { message: "Nenhum cliente logado." });
    return;
  }

  try {
    await sock.logout();
    sock = null;
    loggedIn = false;
    latestQRCode = null;

    const lockPath =
      "/var/www/fidelidadebot/tokens/fidelidadebot/SingletonLock";
    socket.emit("status", { message: "Fazendo Logout. Aguarde..." });

    exec(`rm -f "${lockPath}"`, (err) => {
      if (err) {
        console.error("Erro ao remover o arquivo de lock:", err);
        socket.emit("error", { message: "Erro ao remover arquivo de lock." });
      } else {
        socket.emit("status", { message: "Reiniciando sessão aguarde..." });
        console.log("Arquivo de lock removido");
        setTimeout(() => {
          exec("pm2 restart index", (err, stdout, stderr) => {
            if (err) {
              console.error("Erro ao reiniciar via PM2:", err);
            } else {
              console.log("✅ PM2 reiniciado com sucesso:", stdout);
            }
          });
        }, 2000);
      }
    });
  } catch (error) {
    console.error("Erro ao fazer logout:", error);
    socket.emit("error", { message: "Erro ao fazer logout." });
  }
}
export async function restartSessions(
  io,
  getSocketMap,
  getStoreName,
  getSessionName
) {
  const sessoes = listarSessoesSalvas();

  console.log("🔄 Restaurando sessões salvas:", sessoes);

  for (const clienteId of sessoes) {
    try {
      await startWPPConnect(clienteId, io, getSocketMap, getStoreName);
      console.log(`✅ Sessão ${clienteId} carregada com sucesso`);
    } catch (err) {
      console.error(`❌ Falha ao carregar sessão ${clienteId}:`, err.message);
    }
  }
}

export const getClient = () => sock;
export const getClients = () => clients;
export const getLatestQRCode = () => latestQRCode;
