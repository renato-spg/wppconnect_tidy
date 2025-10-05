const makeWASocket = require("@whiskeysockets/baileys").default;
const { useMultiFileAuthState } = require("@whiskeysockets/baileys");
const qrcode = require("qrcode-terminal"); // <- biblioteca pra mostrar o QR

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("session");
  const sock = makeWASocket({ auth: state });

  sock.ev.on("creds.update", saveCreds);

  // Evento para mostrar QR Code no terminal
  sock.ev.on("connection.update", (update) => {
    const { connection, qr } = update;
    if (qr) {
      console.log("📲 Escaneie o QR abaixo para conectar:");
      qrcode.generate(qr, { small: true }); // mostra QR no terminal
    }
    if (connection === "open") {
      console.log("✅ Bot conectado com sucesso!");
    }
    if (connection === "close") {
      console.log("❌ Conexão fechada, tentando reconectar...");
      startBot(); // tenta reconectar
    }
  });

  // Receber mensagens
  sock.ev.on("messages.upsert", (m) => {
    const msg = m.messages[0];
    if (!msg.key.fromMe && msg.message?.conversation === "Oi") {
      sock.sendMessage(msg.key.remoteJid, { text: "Fala aí 👋" });
    }
  });
}

startBot();
