/*const { createCanvas } = require('canvas');
const fs = require('fs');

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  const lines = [];

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;

    if (testWidth > maxWidth && i > 0) {
      lines.push(line);
      line = words[i] + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line);

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x, y + i * lineHeight);
  }

  return lines.length * lineHeight;
}

// Frases para cada estágio do cartão (índice 0 para 1 marcação, etc.)
const frasesPorEstagio = [
  'Comece sua jornada! Após 5 compras, ganhe R$ 30 em produtos. 💸',
  'Boa! Faltam só 4 marcações para sua recompensa. 🛒',
  'Metade do caminho! Continue acumulando. 🔥',
  'Tá quase! Só mais 2 compras para ganhar. 🎯',
  'Última marcação! Próxima compra vale prêmio! 🎁',
];

 ALTER TABLE data ADD COLUMN message_email TEXT default "Volte sempre";

function drawLoyaltyCard(filledSlots) {
  const width = 420;
  const height = 450;
  const padding = 30;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Fundo com sombra
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.2)';
  ctx.shadowBlur = 15;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 5;
  ctx.fillRect(0, 0, width, height);
  ctx.shadowColor = 'transparent';

  // Borda externa
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, width - 4, height - 4);

  // Título
  ctx.font = 'bold 26px "Segoe UI Symbol"';
  ctx.fillStyle = '#333';
  ctx.textAlign = 'center';
  ctx.fillText('🎉 MEU CARTÃO FIDELIDADE 🎉', width / 2, padding);

  // Slots
  const slotSize = 50;
  const slotSpacing = 12;
  const startX = (width - (5 * slotSize + 4 * slotSpacing)) / 2;
  const startY = padding + 40;

  for (let i = 0; i < 5; i++) {
    const x = startX + i * (slotSize + slotSpacing);
    const y = startY;

    ctx.beginPath();
    const radius = 8;
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + slotSize - radius, y);
    ctx.quadraticCurveTo(x + slotSize, y, x + slotSize, y + radius);
    ctx.lineTo(x + slotSize, y + slotSize - radius);
    ctx.quadraticCurveTo(x + slotSize, y + slotSize, x + slotSize - radius, y + slotSize);
    ctx.lineTo(x + radius, y + slotSize);
    ctx.quadraticCurveTo(x, y + slotSize, x, y + slotSize - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#555';
    ctx.stroke();

    if (i < filledSlots) {
      ctx.fillStyle = '#d4af37';
      ctx.fill();

      ctx.font = '28px "Segoe UI Symbol"';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('✔', x + slotSize / 2, y + slotSize / 1.5);
    }
  }

  // Mensagem personalizada conforme progresso
  const mensagem = frasesPorEstagio[filledSlots - 1] || 'Continue acumulando e ganhe recompensas! 🎉';

  ctx.font = '18px "Segoe UI Symbol"';
  ctx.fillStyle = '#333';
  ctx.textAlign = 'center';
  const maxWidth = width - 2 * padding;
  const lineHeight = 26;
  const textY = startY + slotSize + 50;

  wrapText(ctx, mensagem, width / 2, textY, maxWidth, lineHeight);

  // Observação
  ctx.font = 'bold 16px "Segoe UI Symbol"';
  ctx.fillStyle = '#c0392b';
  ctx.fillText('Obs: Válido 1 marcação por dia.', width / 2, textY + 70);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`loyalty_card_${filledSlots}.png`, buffer);
  console.log(`Cartão com ${filledSlots} marcações gerado!`);
}

// Gerar cartões de 1 a 5 marcações
for (let i = 1; i <= 5; i++) {
  drawLoyaltyCard(i);
}*/
const {drawLoyaltyCard} = require('./canva/canva');
 drawLoyaltyCard(5, "Teste de frase personalizada para o cartão fidelidade!")

//console.log(file);

