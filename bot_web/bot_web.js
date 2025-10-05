const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const fs = require("fs");
const path = require("path");
const qrcode = require("qrcode-terminal");



let client = null;
let latestQRCode = null;
let permitirQRCode = 0;
let loggedIn = false;

async function startWPP() {
  client = new Client({
    authStrategy: new LocalAuth({ clientId: "fidelidadebot" }),
    puppeteer: {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      // No Windows não precisa do executablePath se estiver com Chrome instalado
    },
  });

  client.on("qr", (qr) => {
    permitirQRCode += 1;
    latestQRCode = qr;

    console.log(`\n[${permitirQRCode}/10] Conecte-se com o QR Code abaixo:\n`);
    qrcode.generate(qr, { small: true });

    loggedIn = false;
  });

  client.on("ready", async () => {
    console.log("✅ Cliente pronto!");
    loggedIn = true;

    // Aguarda 10 segundos
    await new Promise((resolve) => setTimeout(resolve, 10000));

    const numero = "5531986775428"; // <-- Substitua por um número real de teste
    let chatId = numero + "@c.us";

    let isValid = await client.isRegisteredUser(chatId);
    if (!isValid) {
      console.log("❌ Número inválido ou não está no WhatsApp");

      console.log("tentando sem o 9");
      chatId = "553186775428" + "@c.us";
      isValid = await client.isRegisteredUser(chatId);

      if (!isValid) {
        console.log("MESMO TIRANDO O 9 NN DEU");
      } else {
        console.log("deu tirando o 9");
      }

      return;
    } else {
      console.log("numero deu com o 9, tentando sem o 9");

      chatId = "553186775428" + "@c.us";

      isValid = await client.isRegisteredUser(chatId);

      if (!isValid) {
        console.log("Nn deu sem o 9");
      } else {
        console.log("Deu com o 9");
      }
    }

    console.log("✅ Número existe, enviando mensagens...");

    try {
      await client.sendMessage(chatId, "Mensagem de teste usando algo bom");

      const imagePath = path.resolve(__dirname, "polvo.jpg");
      if (fs.existsSync(imagePath)) {
        const media = MessageMedia.fromFilePath(imagePath);
        await client.sendMessage(chatId, media);
        console.log("✅ Imagem enviada com sucesso");
      } else {
        console.log("⚠️ Imagem não encontrada em:", imagePath);
      }
    } catch (err) {
      console.error("Erro ao enviar:", err);
    }
  });

  client.on("auth_failure", (msg) => {
    console.error("❌ Falha na autenticação:", msg);
  });

  client.on("disconnected", (reason) => {
    console.log("⚠️ Cliente desconectado:", reason);
    loggedIn = false;
  });

  client.initialize();
}
startWPP();
