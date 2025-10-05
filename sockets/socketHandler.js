import {
  addUser,
  getUsers,
  updateUser,
  deleteUser,
  updateData,
  getData,
  getCustomizations,
} from "../services/userService.js"; // Adicionado .js

import {
  logoutWPP,
  getLatestQRCode,
  getClient,
  getClients,
  startWPPConnect,
} from "../services/wppService.js"; // Adicionado .js

import { drawLoyaltyCard } from "../canva/canva.js"; // Adicionado .js

import path from "path";
import fs from "fs/promises"; // Importação padrão para a versão Promise do FS
import e from "cors"; // Exportação padrão do módulo 'cors'
import PQueue from "p-queue"; // Exportação padrão do módulo 'p-queue'
const queue = new PQueue({ concurrency: 1 }); // apenas 1 tarefa por vez

let getSocket = null;
export const socketMap = new Map();
export let storeName = null;
export let sessionName = null;

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

// Verifica se o número existe e pode receber mensagens
function verifyNumberExists(numero, storeName, data) {
  let normalized = numero.replace(/\D/g, "");
  if (!normalized.startsWith("55")) normalized = `55${normalized}`;
  const jid = `${normalized}@s.whatsapp.net`;

  socketMap.get("whatsapp_api").emit("add-user-whatsapp-api", {
    sessionName: storeName,
    whatsapp: jid,
    data,
  });
}

// Delay
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Lógica completa de validação e envio
async function numberReallyExists(sock, numero, point, phrase) {
  try {
    let normalizedNumber = numero.replace(/\D/g, "");
    const myNumber = normalizedNumber;
    if (!normalizedNumber.startsWith("55"))
      normalizedNumber = `55${normalizedNumber}`;
    const fullNumber = `${normalizedNumber}@s.whatsapp.net`;

    console.log(`Verificando número: ${fullNumber}`);

    const result = await drawLoyaltySendMessage(
      sock,
      fullNumber,
      point,
      phrase,
      myNumber
    );

    if (result.success) {
      console.log("Mensagem enviada com sucesso!");
      return true;
    } else {
      console.log(`Erro ao enviar mensagem: ${result.message}`);
      return false;
    }
  } catch (error) {
    console.error(
      "Erro ao verificar número ou enviar mensagem:",
      error.message
    );
    return false;
  }
}
("");
// Envio de imagem + legenda
async function drawLoyaltySendMessage(sock, jid, point, phrase, myNumber) {
  console.log(
    `Iniciando drawLoyaltySendMessage para número: ${jid}, point: ${point} com muyNumber como: ${myNumber}`
  );

  let filePath;
  try {
    const { buffer, filePath: generatedFilePath } = await drawLoyaltyCard(
      point,
      phrase
    );
    filePath = generatedFilePath;
    console.log(`Imagem gerada para point ${point}`);
  } catch (error) {
    console.error("Erro ao gerar imagem:", error);
    return { success: false, message: "Erro ao gerar imagem" };
  }

  try {
    await fs.access(filePath);
    console.log(`Arquivo ${filePath} encontrado.`);
  } catch (error) {
    console.error(`Arquivo ${filePath} não encontrado:`, error);
    return { success: false, message: "Arquivo de imagem não encontrado" };
  }

  try {
    const buffer = await fs.readFile(filePath); // agora é Buffer real
    const media = {
      image: buffer,
      caption: phrase,
      mimetype: "image/png",
    };

    // Envia imagem sem o 9 se necessário
    if (myNumber.length > 10 && myNumber.charAt(2) === "9") {
      console.log(`Enviando imagem para sem 9 ${myNumber}`);
      const numberSem9 = `55${myNumber.substring(0, 2)}${myNumber.substring(
        3
      )}@s.whatsapp.net`;
      await sock.sendMessage(numberSem9, media);
      console.log(`Imagem enviada com sucesso para sem o 9 ${myNumber}`);
    }

    const delay = Math.floor(Math.random() * 4000) + 3000;
    await sleep(delay);

    console.log(`Enviando imagem para ${jid}`);
    await sock.sendMessage(jid, media);
    console.log(`Imagem enviada com sucesso para ${jid}`);

    return { success: true, message: "Imagem enviada com sucesso" };
  } catch (error) {
    console.error("Erro ao enviar imagem:", error.message);
    return {
      success: false,
      message: `Erro ao enviar imagem: ${error.message}`,
    };
  }
}

async function gerarCarteirinha(point) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();

  await page.goto(`http://localhost/carteirinha.html?point=${point}`, {
    waitUntil: "networkidle2",
  });
  await page.waitForSelector("#container");

  const container = await page.$("#container");
  await container.screenshot({ path: "screenshot-test.png" });

  await browser.close();
  return fs.readFileSync("screenshot-test.png");
}
const requiredFieldsByCategory = {
  whatsapp: ["c1", "c2", "c3", "c4", "c5"],
  buttons: ["note", "register", "assistance"],
  store: ["id", "title"],
};

function validateCategoryFields(category, data) {
  const required = requiredFieldsByCategory[category];
  if (!required) return { valid: false, message: "Categoria inválida!" };

  const hasEmpty = required.some((field) => !data[field]?.trim());
  if (hasEmpty) {
    return { valid: false, message: "Preencha todos os campos obrigatórios!" };
  }

  return { valid: true };
}
function getEvents(socket) {
  socket.on("hidden_", ({ success, msg, sessionName }) => {
    const sock = socketMap.get(sessionName);

    sock.emit("hidden", { success: success, msg: msg });
  });

  socket.on("qrCode_", ({ qrcode, rest, sessionName }) => {
    const sock = socketMap.get(sessionName);

    sock.emit("qrCode", { qrcode: qrcode, rest });
  });

  socket.on("success_", ({ message, sessionName }) => {
    const sock = socketMap.get(sessionName);

    sock.emit("success", { message: message });
  });

  socket.on("status_", ({ message, sessionName }) => {
    const sock = socketMap.get(sessionName);

    sock.emit("success", { message: message });
  });

  socket.on("error_", ({ message, sessionName }) => {
    const sock = socketMap.get(sessionName);

    sock.emit("error", { message: message });
  });
}
export function setupSocket(io) {
  io.on("connection", async (socket) => {
    const getStoreName = String(socket.handshake.query.getStoreName).trim();
    const getSessionName = String(socket.handshake.query.getSessionName).trim();

    console.log("storeName socketHandler " + getStoreName);

    storeName = getStoreName;

    sessionName = getSessionName;

    console.log("sessionName socketHandler " + getSessionName);

    socketMap.set(getStoreName, socket);

    socket.storeName = getStoreName;

    console.log("Adicionando socketMap:", {
      key: getStoreName,
      hasKey: socketMap.has(getStoreName),
    });

    console.log("Cliente conectado no socket!");

    /*const client = getClients()[getSessionName];

    if (client) {
      console.log("Conectado ao cliente do " + getSessionName);
      socket.emit("success", { message: "Usuário conectado!" });
    } else {
      console.log("Error sessão não encontrada: " + getSessionName);
    }*/

    getEvents(socket);

    socket.on("get-data", async ({ store_id }) => {
      const customizations = await getCustomizations(store_id);

      if (typeof customizations !== "string") {
        socket.emit("get-data-json", { ...customizations });
        console.log("Enviando dados:", customizations);
      } else {
        console.log("Error ao criar", customizations);
        //socket.emit('error_verify', 'Erro ao obter dados!');
      }
    });

    /* socket.on('get-data', async (category) => {

const data = await getData(category)
      if (typeof data !== "string") {
        socket.emit('get-data-json', { ...data });
        console.log('Enviando dados:', data);
      }else {
        console.log('Error ao criar', data);
        //socket.emit('error_verify', 'Erro ao obter dados!');
      }
        

     /* } else {
        socket.emit('error_verify', 'Erro ao obter dados!');
      }*/

    //})

    socket.on("update-data", async ({ storeName, category, data }) => {
      // Verifica se todos os campos obrigatórios estão preenchidos
      // Se algum campo estiver vazio, emite um erro e retorna
      console.log(category);

      console.log(data);

      /* const validation = validateCategoryFields(category, data);
      if (!validation.valid) {
        socket.emit("error_verify", validation.message);
        console.log(validation.message);
        return;
      }*/

      const updated = await updateData(category, data);

      /*if(updated && updated.error){
        socket.emit('error_verify', updated.error);
        console.log('Error ao atualizar dados:', updated.error);
        return;
      }*/

      console.log("ARRIVED UPDATED");

      console.log(updated);

      socketMap.get(storeName).emit("updated-data", updated);

      /*   console.log('Error ao atualizar dados');
        socket.emit('updated-data', 'Erro ao atualizar os dados!');*/
    });

    socket.on(
      "sendMessage",
      async ({ storeName, number, point, phrase, sessionName }) => {
        /*const verify = isValidWhatsappNumber(client, number)

      if(verify){*/
        queue.add(async () => {
          const client = getClients()[sessionName];

          if (!number || number.trim().length === 0) {
         } else {
            if (!client) {
              socketMap
                .get(storeName)
                .emit("error_verify", "AVISE ADMINISTRADOR CONECTAR O QRCODE!");
              return;
            }

            if (client) {
              const numberExist = await numberReallyExists(
                client,
                number,
                point,
                phrase
              );
              if (!numberExist) {
                socketMap
                  .get(storeName)
                  .emit("error_verify", "Algo deu errado tente novamente!");
                return;
              }
            }
          }
        });

        /* }else{

       client.emit("errorNumber", {message:""})
      }*/
      }
    );

    socket.on(
      "response-add-user",
      async ({ message, success, client, sessionName, data }) => {
        console.log("aqui response-add-user");

        console.log("response", {
          message,
          success,
          client,
          sessionName,
          data,
        });

        if (!client) {
          socketMap
            .get(sessionName)
            .emit("error_verify", "AVISE ADMINISTRADOR QRCODE!");
          return;
        }

        if (!success) {
          socketMap
            .get(sessionName)
            .emit("error_verify", "Número inválido ou não existe no WhatsApp!");
        } else {
          const newUser = await addUser(data);

          if (newUser && newUser.response) {
            socketMap.get(data.storeName).emit("user-added", newUser.message);
          } else if (newUser && !newUser.response) {
            socketMap.get(data.storeName).emit("error_verify", newUser.message);
            return;
          }
        }
      }
    );
    socket.on("add-user", async (data) => {
      console.log("acionando add-user");

      queue.add(async () => {
        if (!data.whatsapp || data.whatsapp.trim().length === 0) {
        } else {
          const required = [
            "name",
            "surname",
            "cpf",
            "birthday",
            "whatsapp",
            "store",
            "sessionName",
            "storeName",
          ];
          const hasEmpty = required.some((field) => !data[field]?.trim());

          if (hasEmpty) {
            socketMap
              .get(data.storeName)
              .emit("error_verify", "Preencha todos os campos!");
            return;
          }
        }

        //const client = getClients()[data.sessionName];

        if (!data.whatsapp || data.whatsapp.trim().length === 0) {
        } else {
          verifyNumberExists(data.whatsapp, data.storeName, data);
        }
      });
    });

    socket.on("get-users", async ({ storeName, cpf }) => {
      const result = await getUsers(cpf);

      if (typeof result === "string") {
        socketMap.get(storeName).emit("get-error", { message: result });
      } else {
        socketMap.get(storeName).emit("get-data", { ...result });
      }
    });

    socket.on("update-user", async ({ storeName, id, sessionName }) => {
      const client = getClients()[sessionName];
      if (!client) {
        socketMap
          .get(storeName)
          .emit("error_verify", "AVISE ADMINISTRADOR, CONECTAR QRCODE!");
        return;
      }
      console.log("cpf: " + id + " sessionName: " + sessionName);

      const updated = await updateUser(id);
      if (typeof updated === "string") {
        console.log("error: " + updated);

        socketMap.get(storeName).emit("updated-error", { message: updated }); //: \n'+updated });
      } else {
        console.log("success no user");
        socketMap.get(storeName).emit("updated-successfully", { ...updated });
      }
    });

    socket.on("pedir_qrcode", async ({ session, store }) => {
      const sock = socketMap.get("whatsapp_api");

      sock.emit("start_session", { sessionName: session });
    });
    socket.on("delete-user", async ({ storeName, id }) => {
      const success = await deleteUser(id);
      if (!success) {
        socketMap
          .get(storeName)
          .emit("error", { message: "Usuário não encontrado" });
      } else {
        socketMap.get(storeName).emit("user-deleted", { id });
      }
    });

    socket.on("liberar-qrcode", () => {
      if (!getClient()) {
        const latestQRCode = getLatestQRCode();
        if (latestQRCode) {
          socket.emit("status", { message: "Gerando outro QR Code..." });
          io.emit("qrCode", { qrcode: latestQRCode });
          socket.emit("status", { message: "QR Code gerado com sucesso" });
        } else {
          socket.emit("status", {
            message: "Erro ao gerar QR Code, aguarde...",
          });
        }
      } else {
        socket.emit("status", { message: "Usuário já logado" });
      }
    });

    socket.on("request-new-qrcode", () => {
      if (!getClient()) {
        const latestQRCode = getLatestQRCode();
        if (latestQRCode) {
          socket.emit("qrCode", { qrcode: latestQRCode });
        } else {
          socket.emit("error", {
            message: "QR Code não disponível. Tente novamente.",
          });
        }
      } else {
        socket.emit("success", {
          message: "Já está logado, QR Code não necessário.",
        });
      }
    });

    // socket.on("logout", (storeName) => logoutWPP(socketMap.get(storeName), io));

    socket.on("disconnect", () => {
      console.log("Cliente desconectado! (" + storeName + ")");
      socketMap.delete(socket.storeName); // remove do Map
    });
  });
}

// Exporta a função de configuração

export const getSocketMap = () => socketMap;
export const getStoreName = () => storeName;
export const getSessionName = () => sessionName;
