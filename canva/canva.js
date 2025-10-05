import { createCanvas, loadImage } from "canvas";
import fs from "fs/promises"; // Importa a versão de promises do File System
import path from "path";
//drawLoyaltyCard(1, "");

import { fileURLToPath } from "url"; // Importe 'fileURLToPath' para converter a URL em caminho
// Definições necessárias para simular __dirname no ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function drawLoyaltyCard(point, phrase = "") {
  const width = 1200; // Aumentado de 600
  const height = 780; // Aumentado de 390
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Fundo
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Container com borda azul
  const container = {
    x: 10,
    y: 10,
    width: width - 20,
    height: height - 20,
    radius: 30, // Aumentado para proporção
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
  ctx.lineWidth = 8; // Aumentado para proporção
  ctx.strokeStyle = "#4A90E2";
  ctx.stroke();

  // Texto centralizado
  ctx.fillStyle = "#000";
  ctx.textAlign = "center";

  // Título bíblico
  ctx.font = "bold 36px Arial"; // Aumentado de 18px
  ctx.fillText('"CONSAGRE AO SENHOR TUDO O QUE VOCÊ FAZ,', width / 2, 80);
  ctx.fillText('E OS SEUS PLANOS SERÃO BEM SUCEDIDOS"', width / 2, 120);

  // Frase customizada (descomente se necessário)
  /*
  if (phrase && phrase.trim() !== "") {
    ctx.font = "italic 32px Arial"; // Aumentado de 16px
    ctx.fillText(phrase, width / 2, 160);
  }
  */

  // Frase explicativa
  ctx.font = "32px Arial"; // Aumentado de 16px
  ctx.fillText("Nas compras acima de R$20,00 ganhe um selo", width / 2, 200);
  ctx.fillText(
    "Complete 5 compras e ganhe R$30,00 em produtos",
    width / 2,
    240
  );

  // Polvo
  try {
    const imagePath = path.resolve(__dirname, "img", "polvo.jpg");
    console.log(`Tentando carregar imagem: ${imagePath}`);
    await fs.access(imagePath, fs.constants.F_OK); // Verificar se a imagem existe
    const image = await loadImage(imagePath);
    ctx.drawImage(image, width / 2 - 100, 280, 200, 200); // Aumentado de 100x100
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
  ctx.font = "28px Arial"; // Aumentado de 14px
  ctx.fillText("(Válido 1 marcação por dia)", width / 2, 510);

  // Caixinhas
  const boxSize = 100; // Aumentado de 50
  const spacing = 30; // Aumentado de 20 para proporção
  const total = 5;
  const startX = (width - (boxSize * total + spacing * (total - 1))) / 2;
  const y = 560; // Ajustado para novo layout
  for (let i = 0; i < total; i++) {
    const x = startX + i * (boxSize + spacing);
    ctx.beginPath();
    ctx.roundRect(x, y, boxSize, boxSize, 16); // Aumentado raio
    ctx.fillStyle = i < point ? "gold" : "#fff";
    ctx.fill();
    ctx.lineWidth = 4; // Aumentado para proporção
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
