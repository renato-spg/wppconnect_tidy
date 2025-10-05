const { createCanvas, loadImage } = require("canvas");
const fs = require("fs").promises;
const path = require("path");

import { fileURLToPath } from "url"; // Importe 'fileURLToPath' para converter a URL em caminho
// Definições necessárias para simular __dirname no ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
//drawLoyaltyCard(1, "");
export async function drawLoyaltyCard(point, phrase = "") {
  const width = 2400; // Aumentado para máximo impacto
  const height = 1560; // Aumentado para máximo impacto
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Fundo
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Container com borda azul
  const container = {
    x: 20,
    y: 20,
    width: width - 40,
    height: height - 40,
    radius: 60, // Raio maior para proporção
  };
  ctx.beginPath();
  ctx.moveTo(container.x + container.radius, container.y);
  ctx.lineTo(container.x + container.width - container.radius, container.y);
  ctx.quadraticCurveTo(
    container.x + container.width,
    container.y,
    container.x + container.width,
    container.y + container.radius
  );
  ctx.lineTo(
    container.x + container.width,
    container.y + container.height - container.radius
  );
  ctx.quadraticCurveTo(
    container.x + container.width,
    container.y + container.height,
    container.x + container.width - container.radius,
    container.y + container.height
  );
  ctx.lineTo(container.x + container.radius, container.y + container.height);
  ctx.quadraticCurveTo(
    container.x,
    container.y + container.height,
    container.x,
    container.y + container.height - container.radius
  );
  ctx.lineTo(container.x, container.y + container.radius);
  ctx.quadraticCurveTo(
    container.x,
    container.y,
    container.x + container.radius,
    container.y
  );
  ctx.closePath();
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.lineWidth = 16; // Borda mais grossa
  ctx.strokeStyle = "#4A90E2";
  ctx.stroke();

  // Texto centralizado
  ctx.fillStyle = "#000";
  ctx.textAlign = "center";

  // Título bíblico
  ctx.font = "bold 92px Arial"; // Fonte colossal
  ctx.fillText('"CONSAGRE AO SENHOR TUDO O QUE VOCÊ FAZ,', width / 2, 150);
  ctx.fillText('E OS SEUS PLANOS SERÃO BEM SUCEDIDOS"', width / 2, 250);
  // Frase customizada (descomente se necessário)
  /*
  if (phrase && phrase.trim() !== "") {
    ctx.font = "italic 70px Arial"; // Fonte colossal
    ctx.fillText(phrase, width / 2, 310);
  }
  */

  // Frase explicativa
  ctx.font = "95px Arial"; // Fonte colossal
  ctx.fillText(
    "Nas compras acima de R$20,00 ganhe uma marcação",
    width / 2,
    380
  );
  ctx.font = "110px Arial"; // Fonte colossal
  ctx.fillText("Complete 5 compras e ganhe", width / 2, 500);
  ctx.font = "110px Arial"; // Fonte colossal
  ctx.fillText("R$30,00 em produtos", width / 2, 620);

  // Polvo
  try {
    const imagePath = path.resolve(__dirname, "img", "polvo.jpg");
    console.log(`Tentando carregar imagem: ${imagePath}`);
    await fs.access(imagePath, fs.constants.F_OK); // Verificar se a imagem existe
    const image = await loadImage(imagePath);
    ctx.drawImage(image, width / 2 - 200, 650, 550, 550); // Imagem gigante
  } catch (err) {
    console.warn(
      `Imagem polvo.jpg não encontrada em ${path.resolve(
        __dirname,
        "img",
        "polvo.jpg"
      )}. Pulando...`,
      err
    );
  }

  // Texto menor
  ctx.fillStyle = "#666";
  ctx.font = "100px Arial"; // Fonte grande mesmo para texto "menor"
  ctx.fillText("(Válido 1 marcação por dia)", width / 2, 1200);

  // Caixinhas
  const boxSize = 250; // Caixas gigantes
  const spacing = 40; // Espaçamento mínimo ajustado
  const total = 5;
  const startX = (width - (boxSize * total + spacing * (total - 1))) / 2;
  const y = 1270; // Ajustado para novo layout
  for (let i = 0; i < total; i++) {
    const x = startX + i * (boxSize + spacing);
    ctx.beginPath();
    ctx.roundRect(x, y, boxSize, boxSize, 30); // Raio maior
    ctx.fillStyle = i < point ? "gold" : "#fff";
    ctx.fill();
    ctx.lineWidth = 8; // Borda mais grossa
    ctx.strokeStyle = "#000";
    ctx.stroke();
  }

  // Salvar imagem
  const fileName = `loyalty_card_${point}.png`;
  const filePath = path.resolve(__dirname, "img", fileName);
  console.log(`Salvando imagem em: ${filePath}`);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const buffer = canvas.toBuffer("image/png");
  await fs.writeFile(filePath, buffer);
  console.log(`✅ Cartão gerado em: ${filePath}`);

  return { buffer, filePath }; // Retornar o buffer e o caminho
}
