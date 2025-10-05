/*const nodemailer = require('nodemailer');

async function enviarEmailHTML(html) {
    const testAccount = await nodemailer.createTestAccount();
  
    const transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  
    const info = await transporter.sendMail({
      from: 'Relatório Diário <no-reply@relatorios.com>',
      to: 'teste@email.com',
      subject: '📊 Relatório Diário - Clientes',
      html
    });
  
    console.log('📧 Email de teste enviado. Veja em:', nodemailer.getTestMessageUrl(info));
  }*/

import nodemailer from "nodemailer";

export async function enviarEmailHTML(html) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "renatosoares09876@gmail.com", // Seu e-mail Gmail real
      pass: "qbxtyxwhkitjhphy", // A senha de app gerada
    },
  });

  // setInterval(async() => {
  const info = await transporter.sendMail({
    from: "Relatório Diário <renatosoares09876@gmail.com>",
    to: "polvocellfidelidade@outlook.com",
    subject: "📊 Relatório Diário - Clientes",
    html,
    // "teste": "teste",
  });
  // }, 1000 * 30);

  // console.log('📧 Email enviado com sucesso:', "Descomentar depois")//info.messageId);
}
