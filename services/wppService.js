const wppconnect = require('@wppconnect-team/wppconnect');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

let client = null;
let latestQRCode = null;
let loggedIn = false;
let permitirQRCode = 0;

async function startWPPConnect(io) {
 /* if (client && client.status !== 'desconnectedMobile') {
    console.log('Sessão já ativa!');
    io.emit('status', { message: 'Conexão já ativa' });
    return;
  } else {
    console.log('Sessão desconectada');
    io.emit('status', { message: 'Conexão desconectada ou status de mobile desativado' });
  }*/
  try {
    client = await wppconnect.create({
      session: 'fidelidadebot',
      headless: true,
      autoClose: false,
      browserArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: '/snap/bin/chromium',
      useChrome: false,
      debug: true,
      puppeteerOptions: {
        args: ['--no-sandbox']
      },
      catchQR: (base64Qr, asciiQR) => {
        if (permitirQRCode >= 10) {
          console.log('Acabou tempo de espera. Aperte gerar QR Code');
          io.emit('status', { message: 'Acabou tempo de espera. Aperte gerar QR Code' });
          io.emit('hidden', "Aperte gerar QR Code");
          return;
        }
        permitirQRCode += 1;

        console.log('Novo QR Code gerado:', asciiQR);

        latestQRCode = base64Qr;

        const matches = base64Qr.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

        if (matches && matches.length === 3) {
          const imageBuffer = Buffer.from(matches[2], 'base64');
          fs.writeFile('out.png', imageBuffer, 'binary', (err) => {
            if (err) console.error('Erro ao salvar QR Code:', err);
            else console.log('QR Code salvo como out.png');
          });
        }

        let rest = `${permitirQRCode}/10`

        console.log(rest);



        io.emit('qrCode', { "qrcode": base64Qr, "rest" : rest});

        loggedIn = false;
      },
      logQR: false,
      statusFind: (status) => {
        console.log('Status do WPPConnect:', status);
        const connectedStatuses = ['inChat', 'CONNECTED', 'isLogged'];
        if (connectedStatuses.includes(status)) {
          console.log('Usuário logado!');
          loggedIn = true;
          io.emit('success', { message: 'Conectado com sucesso!' });
          io.emit('status', { message: '' });
        }
      },
    });

    if(!client) {
      console.error('Erro ao criar cliente WPPConnect!');
      io.emit('error', { message: 'Erro ao criar cliente WPPConnect!' });
      return;
    }
    const clientInfo = await client.getHostDevice();
    console.log('📱 Número logado:', clientInfo.wid.user);
    console.log('👤 Nome no WhatsApp:', clientInfo.pushname);
    console.log('WPPConnect iniciado com sucesso!');
  } catch (error) {
    console.error('Erro ao iniciar WPPConnect:', error);
  }
}

async function logoutWPP(socket,io) {
  if (!client) {
    console.log('Cliente não está logado.');
    socket.emit('status', { message: 'Nenhum cliente logado.' });
    return;
  }

  try {
    await client.logout();
    await client.close();
    loggedIn = false;
    latestQRCode = null;

    const lockPath = '/var/www/fidelidadebot/tokens/fidelidadebot/SingletonLock';
    socket.emit('status', { message: 'Fazendo Logout. Aguarde...' });

    exec(`rm -f "${lockPath}"`, (err) => {
      if (err) {
        console.error('Erro ao remover o arquivo de lock:', err);
        socket.emit('error', { message: 'Erro ao remover arquivo de lock.' });
      } else {
        socket.emit('status', { message: 'Reiniciando sessão aguarde...' });
        console.log('Arquivo de lock removido');
        setTimeout(() => startWPPConnect(io), 2000);
      }
    });
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    socket.emit('error', { message: 'Erro ao fazer logout.' });
  }
}

// Exporta funções e variáveis
module.exports = { startWPPConnect, logoutWPP, getLatestQRCode: () => latestQRCode, getClient: () => client };