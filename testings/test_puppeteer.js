/*const puppeteer = require('puppeteer');

(async () => {
  const point = 3; // Altere esse valor para testar de 1 a 5

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  

  await page.goto(`http://127.0.0.1:5500/testings/testhtml.html?point=${point}`, { waitUntil: 'networkidle2' });

  await page.waitForSelector('#container'); // aguarda a div das caixinhas

  const container = await page.$('#container');

  await container.screenshot({ path: 'screenshot-test.png' });

  await browser.close(); // fecha tudo (para teste)

  console.log('Screenshot salva como screenshot-test.png');
})();*/
const { createCanvas } = require("canvas");
const puppeteer = require("puppeteer");
//const fs = require('fs').promises;
const fs = require("fs").promises;
const path = require("path");

drawLoyaltyCard(3, "Teste de frase")
  .then((buffer) => {
    // Aqui você pode fazer o que quiser com o buffer da imagem
    console.log("Imagem gerada com sucesso!");
  })
  .catch((error) => {
    console.error("Erro ao gerar a imagem:", error);
  });

async function drawLoyaltyCard(point, phrase) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.goto(
    `http://handsoftlife.com.br/carteirinha.html?point=${point}`,
    {
      waitUntil: "networkidle2",
    }
  );

  await page.waitForSelector("#container");
  const container = await page.$("#container");

  const fileName = `loyalty_card_${point}.png`;
  const filePath = path.resolve(__dirname, "img", fileName);

  // Garante que a pasta 'img' existe
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  // Tira o screenshot e salva no caminho correto
  await container.screenshot({ path: filePath });

  await browser.close();

  console.log(`Cartão com ${point} marcações gerado em: ${filePath}`);
  return fs.readFile(filePath); // Retorna buffer
}
