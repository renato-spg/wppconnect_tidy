const { createCanvas, loadImage } = require("canvas");
const fs = require("fs").promises;
const path = require("path");

import { fileURLToPath } from "url"; // Importe 'fileURLToPath' para converter a URL em caminho
// Definições necessárias para simular __dirname no ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export async function drawLoyaltyCard(point, phrase = "") {
  const width = 600;
  const height = 390;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Fundo
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Container com borda azul
  const container = {
    x: 0,
    y: 0,
    width,
    height,
    radius: 16,
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
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#4A90E2";
  ctx.stroke();

  // Texto centralizado
  ctx.fillStyle = "#000";
  ctx.textAlign = "center";

  // Título bíblico
  ctx.font = "bold 18px Arial";
  ctx.fillText('"CONSAGRE AO SENHOR TUDO O QUE VOCÊ FAZ,', width / 2, 40);
  ctx.fillText('E OS SEUS PLANOS SERÃO BEM SUCEDIDOS"', width / 2, 65);

  // Frase customizada
  if (phrase && phrase.trim() !== "") {
    ctx.font = "italic 16px Arial";
    ctx.fillText(phrase, width / 2, 90);
  }

  // Frase explicativa
  ctx.font = "16px Arial";
  ctx.fillText("Nas compras acima de R$20,00 ganhe um selo", width / 2, 130);
  ctx.fillText(
    "Complete 5 compras e ganhe R$30,00 em produtos",
    width / 2,
    155
  );

  // Polvo
  try {
    const imagePath = path.resolve(__dirname, "img/polvo.jpg");
    const image = await loadImage(imagePath);
    ctx.drawImage(image, width / 2 - 50, 175, 100, 100);
  } catch (err) {
    console.warn("Imagem polvo.jpg não encontrada. Pulando...");
  }

  // Texto menor
  ctx.fillStyle = "#666";
  ctx.font = "14px Arial";
  ctx.fillText("(Válido 1 marcação por dia)", width / 2, 285);

  // Caixinhas
  const boxSize = 50;
  const spacing = 20;
  const total = 5;
  const startX = (width - (boxSize * total + spacing * (total - 1))) / 2;
  const y = 310;

  for (let i = 0; i < total; i++) {
    const x = startX + i * (boxSize + spacing);
    ctx.beginPath();
    ctx.roundRect(x, y, boxSize, boxSize, 8);
    ctx.fillStyle = i < point ? "gold" : "#fff";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#000";
    ctx.stroke();
  }

  // Salvar imagem
  const fileName = `loyalty_card_${point}.png`;
  const filePath = path.resolve(__dirname, "img", fileName);
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  const buffer = canvas.toBuffer("image/png");
  await fs.writeFile(filePath, buffer);

  console.log(`✅ Cartão gerado em: ${filePath}`);
  return buffer;
}

drawLoyaltyCard(4);

