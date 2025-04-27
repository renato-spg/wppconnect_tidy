const { addUser, getUsers, updateUser, deleteUser, updateData, getData } = require('../services/userService');
const { logoutWPP, getLatestQRCode, getClient } = require('../services/wppService');
const {drawLoyaltyCard} = require('../canva/canva');
const path = require('path');


/*async function isValidWhatsappNumber(client, number) {
  try {
    const result = await client.checkNumberStatus(`55${number}@c.us`);
    
    if (result.numberExists) {
      return { exists: true, valid: true };
    } else {
      return { exists: false, message:"Número valido, mas não se encontra no whatsapp"}; // válido, mas não está no WhatsApp
    }
  } catch (error) {
    console.error('Erro na verificação:', error);
    return { exists: false, valid: false }; // número mal formatado
  }
}*/
function setupSocket(io) {
  io.on('connection', async (socket) => {
    console.log('Cliente conectado!');

    const client = getClient();
    if (client) {
      socket.emit('success', { message: 'Usuário conectado!' });
    }

    socket.on('get-data', async () => {

const data = await getData()
      if (typeof data !== "string") {
        socket.emit('get-data-json', { ...data });
        console.log('Enviando dados:', data);
      }else {
        console.log('Error ao criar', data);
      }
        

     /* } else {
        socket.emit('error_verify', 'Erro ao obter dados!');
      }*/

    })



    socket.on('update-data', async (data) => {
      // Verifica se todos os campos obrigatórios estão preenchidos
      // Se algum campo estiver vazio, emite um erro e retorna
      const required = ['note', 'register', 'assistance'];
      const hasEmpty = required.some((field) => !data[field]?.trim());
      if (hasEmpty) {
        socket.emit('error_verify', 'Preencha todos os campos!');
        return; 
      }
      const updated = await updateData(data);

      if (typeof updated !== "string") {  

        console.log('Dados atualizados:', updated);

        io.emit('updated-data', { ...updated });
      }
      else {
        console.log('Error ao atualizar dados');
        socket.emit('error_verify', 'Erro ao atualizar os dados!');

      }
    });


    socket.on('sendMessage', async ({number, point, phrase}) => {
      
      /*const verify = isValidWhatsappNumber(client, number)

      if(verify){*/
      const client = getClient();

      if (client) {

        await drawLoyaltyCard(point,phrase)

        const fileName = `loyalty_card_${point}.png`;
        const filePath = path.resolve(__dirname, '../canva/img', fileName);
      
        await client.sendImage(`55${number}@c.us`,
           filePath, 'cartao',
           phrase)
          .then((result) => {
            socket.emit('sent', 'Cartão fidelidade enviado com sucesso 😎');
          })
          .catch((error) => {
            console.error('Erro ao enviar imagem:', error);
            socket.emit('sent', 'Erro ao enviar cartão fidelidade');
          });
      } else {
        console.error('Cliente não está logado.');
      }

     /* }else{

       client.emit("errorNumber", {message:""})
      }*/

     
    

    });

    socket.on('add-user', async (data) => {
      const required = ['name', 'surname', 'cpf', 'birthday', 'email', 'whatsapp'];
      const hasEmpty = required.some((field) => !data[field]?.trim());

      if (hasEmpty) {
        socket.emit('error_verify', 'Preencha todos os campos!');
        return;
      }

      const newUser = await addUser(data);
      if (newUser) {
        socket.emit('user-added', newUser);
      } else {
        socket.emit('error_server', "Error ao adicionar usuario");
      }
    });

    socket.on('get-users', async (cpf) => {
      const result = await getUsers(cpf);

      if(typeof result === "string"){
        socket.emit('get-error', {message:result});
    
      }else{
        socket.emit('get-data', {...result});
      }
  
    });

    socket.on('update-user', async ({id}) => {
      const updated = await updateUser(id);
      if (typeof updated === "string") {
        socket.emit('updated-error', { message: 'Usuário não encontrado: \n'+updated });
      } else {
        socket.emit('updated-successfully', {...updated});
      }
    });

    socket.on('delete-user', async (id) => {
      const success = await deleteUser(id);
      if (!success) {
        socket.emit('error', { message: 'Usuário não encontrado' });
      } else {
        socket.emit('user-deleted', { id });
      }
    });

    socket.on('liberar-qrcode', () => {
      if (!getClient()) {
        const latestQRCode = getLatestQRCode();
        if (latestQRCode) {
          socket.emit('status', { message: 'Gerando outro QR Code...' });
          io.emit('qrCode', { qrcode: latestQRCode });
          socket.emit('status', { message: 'QR Code gerado com sucesso' });
        } else {
          socket.emit('status', { message: 'Erro ao gerar QR Code, aguarde...' });
        }
      } else {
        socket.emit('status', { message: 'Usuário já logado' });
      }
    });

    socket.on('request-new-qrcode', () => {
      if (!getClient()) {
        const latestQRCode = getLatestQRCode();
        if (latestQRCode) {
          socket.emit('qrCode', { qrcode: latestQRCode });
        } else {
          socket.emit('error', { message: 'QR Code não disponível. Tente novamente.' });
        }
      } else {
        socket.emit('success', { message: 'Já está logado, QR Code não necessário.' });
      }
    });

    socket.on('logout', () => logoutWPP(socket,io));

    socket.on('disconnect', () => {
      console.log('Cliente desconectado!');
    });
  });
}

// Exporta a função de configuração
module.exports = { setupSocket };