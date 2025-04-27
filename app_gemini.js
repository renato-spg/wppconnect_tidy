const fs = require('fs');
const path = require('path');
const wppconnect = require('@wppconnect-team/wppconnect');
const axios = require("axios");
const { log } = require('console');
const banco = require("./banco.js");
const { exec } = require('child_process');
//const API_KEY = "AIzaSyATOLKBbBUIK5g3e4tQKOsMpFDOmgDB7VI";
const API_KEY = "AIzaSyB1FTwSk0iVRq-ENe62wIE5yg03rcECiuQ";
const { GoogleGenerativeAI } = require("@google/generative-ai");
const gTTS = require('gtts');
//const player = require('play-sound')({ player: 'C:\\Program Files (x86)\\Windows Media Player\\wmplayer.exe' });
const player = require('play-sound')({ player: 'C:\\Program Files\\VideoLAN\\VLC\\vlc.exe' });
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
//const WebSocket = require('ws');
//const wss = new WebSocket.Server({ port: 3001 });
const date = new Date();
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Banco de dados em memória
/*let contacts = [];
let messages = {};*/
banco.db = [];
const contacts = [
    //{ id: 1, name: "Alice", phone: "123-456-78923", descriptionNow: "Está ai?" },
];
const conversations = {
    /*1: [
        { from: "me", text: "Olá, Alice!", date: "20:33" },
        { from: "Alice", text: "Oi! Tudo bem?", date: "20:34" },
    ]*/
};

const newTreinamento = `
    "Você é um chatbot da loja Natal Açai. Seu foco é atender pedidos de forma eficiente e amigável. Você identifica se a conversa envolve açaí ou hambúrguer, sempre mantenha sua identidade como assistente virtual, pronta pra completar o pedido da maneira mais eficiente possivel
    Estabelecimento: O estabelecimento fica na rua conquista 129, rosário 1
    Funções principais:
    Apresentação: Se a pessoa já começar falando ex: açai e especificando você não se apresenta
    e sim já começa o atendimento ai na hora, mas caso contrario se a pessoa apresentar
    vc se apresenta também, Se apresente como um assistente virtual da loja, pronto para atender, mas seja breve e direto, mas antes de qualquer coisa, pergunte a pessoa se ela quer fazer um pedido ou quer tratar outros assuntos, se a pessoa não deixar explicito que é um pedido então e outros assuntos então toda mensagem vc ignora
    Pedido anotado: Ao concluir com o pedido anotado, caso a pessoa fale alguma coisa responda ela gentilmente, caso ela queira alguma informação, ou sobre o pedido, e caso ela queira alterar alguma coisa ela consegue alterar, e vc altera pra pessoa, ficando 1 so pedido, mas com a alteração que a pessoa deseja
    Finalização pedido: caso a pessoa pergunte quanto ficou vc, calcula, tudo que ela pediu, + taxa de entrega se caso for cobrado dela de acordo com o bairro dela e quando for finalizar o pedido calcule tudo até a taxa de entrega e fale pra pessoa confirmando as informações dela, e o preço total pra ela confirmar ai quando ela confirmar vc fala: pedido anotado, caso ela pergunte quanto tempo vai demorar, vc fala: Sou uma assistente virtual e já avisei do pedido, mandaremos o mais rápido possivel
    Regras absolutas: Se a pessoa falar sobre açai de 300ml, 500ml, 700ml, 1L, ou marmita de açai se ela pedir que quer um desses açai falando qual é o tamanho mas não falar o tipo que é, AÇAI DIA A DIA, AÇAI CAPRICHADO, SUPER AÇAI, então vc pergunte qual dos 3 ela quer, se é do AÇAI DIA A DIA, AÇAI CAPRICHADO, SUPER AÇAI, e já fala o preço de cada um de acordo com o tamanho que ela quer, NÃO FALE QUAL O SABOR DO AÇAI É
    Sim pergunte qual das 3 opções a pessoa quer, e fale o preço de cada uma, que é AÇAI DIA A DIA, AÇAI CAPRICHADO, SUPER AÇAI
    Importante: Quando você perguntar a pessoa deseja finalizar o pedido, analise a mensagem dela e veja, tudo bem, pode ser, algo assim, analise se for mensagem assim que parece boa, então a pessoa aceitou
    Importante não esqueça: Se a pessoa perguntar se tem taxa de entrega você fala, se não for pro rosario 1 então a taxa é de 6 reais
    Pedidos: Identifique o tamanho e o tipo de açaí (Dia a Dia, Caprichado, Super) ou o hambúrguer solicitado. Sempre forneça preços e detalhes com precisão, se ela perguntar sobre marmita de açai temos ela, ou ela perguntar sobre marmita fala que tem marmita de açai 750ml, ela vem todos os ingredientes completos do super açai, ou seja cardapio dela é igual ao do super açai.
    Regras de entrega: Frete grátis no Rosário 1; outros bairros têm taxa de R$ 6. Confirme endereço, bairro e referência, fale pro cliente que é de suma importancia isso
    Caso a pessoa fale "Rosário" pergunte se e é Rosário 1, Rosário 2, ou Rosário 3
    Pagamento: Aceitamos Pix, cartão, dinheiro , (exceto alimentação)
    Pergunte sobre troco se necessário.
    Cardápio: Caso a pessoa queira o cardápio mande pra ela falando: enviando cardápio
    Horário de funcionamento: Segunda a domingo, das 10h às 23h.
    Finalização do pedido: Após confirmar, diga 'pedido anotado' e também fale Natal açai agradece pela preferencia sem as aspas, sem acento fale exatamente assim e conclua o atendimento, mas após o cliente fazer pedido qualquer pergunta que o cliente perguntar, responda ele, lembrando que ele já fez o pedido enttão não faça novamente um novo pedido pra ele.
    Regras especiais: Ignorar conversas irrelevantes e encaminhar ao atendente humano após 10 perguntas seguidas sem resolução. Responda sempre de forma curta, clara e sem emojis."
    Abaixo tem o cardapio açai caso eles pergunte sobre se vende lanche ou hamburguer ou macarrão na chapa ou refri fala que paramos de vender mas temos açai
    cardápio do açai:
    Tamanhos disponíveis: 300ml 500ml 700ml 750ml (marmita) 1 litro
    🍧 Açaí Dia a Dia:
    1. 300ml - R$14
    2. 500ml - R$16
    3. 700ml - R$19
    4. 1 litro - R$29
    (Banana - Granola - Leite em pó - Leite condensado - Cobertura de chocolate - paçoca - disquete)
    🍧 Açaí Caprichado:
    5. 300ml - R$17
    6. 500ml - R$20
    7. 700ml - R$25
    8. 1 litro - R$37
    (Banana - Morango - Disquete - Leite condensado - Cobertura de chocolate - Gotas de chocolate - Granola - Leite em pó)
    🍧 Super Açaí:
    9. 300ml - R$16
    10. 500ml - R$19
    11. 700ml - R$23
    12. 1 litro - R$36
    (Banana - Morango - Óreo - Leite condensado - Cobertura de chocolate - Bis 8 - Leite em pó)
    🍹 Vitamina de Açaí:
    13. 300ml - R$12
    14. 500ml - R$14
    15. 700ml - R$16
    (Banana - Granola - Leite em pó (em camada ou batido) - Leite condensado)
`;
let startTime = Date.now();
//console.log(`[start] startTime registrado: ${startTime}`);

let globalClient = null;
let dataSystem = [];
console.log("Iniciando criação de sessão WPPConnect...");
wppconnect
    .create({
        session: 'botacai',
        useStealth: true,
        autoClose: false,
        waitForLogin: true,
        waitForTimeout: 15000,
        browserArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        useChrome: false,
        timeout: 120000,
        puppeteerOptions: { protocolTimeout: 120000 },
        debug: true,
        catchQR: (base64Qr, asciiQR) => {
            console.log('QR Capturado. Exibindo ASCII QR:');
            console.log(asciiQR);
            var matches = base64Qr.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/), response = {};
            if (matches.length !== 3) {
                return new Error('Invalid input string');
            }
            response.type = matches[1];
            response.data = new Buffer.from(matches[2], 'base64');
            var imageBuffer = response;
            require('fs').writeFile(
                'out.png',
                imageBuffer['data'],
                'binary',
                function (err) {
                    if (err != null) {
                        console.log(err);
                    }
                }
            );
        },

        statusFind: (statusSession) => {
            console.log('Status da sessão:', statusSession); // Aqui você vê o status da sessão
        },
        onReady: () => {
            console.log('Sessão do WhatsApp pronta!');
        },
        onStateChange: (state) => {
            console.log('Estado da conexão:', state);
            if (state === 'CONNECTED') {
                console.log('Conexão bem-sucedida!');
            }
        },
        onIncomingCall: (call) => {
            const sender = call.peerJid.split('@')[0];
            const callType = call.isVideo ? 'chamada de vídeo' : 'chamada de voz';
            console.log(`Ligação recebida de ${sender} (${callType})`);
            // Responde automaticamente à ligação
            globalClient.sendText(call.peerJid, `Sou uma assistente virtual, não interpreto ligação, poderia escrever?`);
        },
       /* onMessage: (message) => {
            console.log('[onMessage]', message.body);
            // Aqui você pode processar a mensagem, por exemplo, respondendo de acordo com o conteúdo
            if (message.body.toLowerCase() === 'oi') {
                client.sendText(message.from, 'Olá! Como posso te ajudar?');
            }
        },*/
        logQR: false,
    })
    .then((client) => {
        client.onStateChange((state) => {
            console.log('State changed:', state);
            if (state === 'CONFLICT' || state === 'UNPAIRED' || state === 'UNLAUNCHED') {
                console.log('Estado problemático detectado:', state);
            }
        });
        globalClient = client;

       
     startTime = Date.now();
        console.log(`[start] startTime registrado: ${startTime}`);
        
        
            // Quando uma mensagem for recebida
            client.onMessage(async (message) => {
               // console.log('[onMessage]', message.body);
             /*   if (message.body.toLowerCase() === 'oi') {
                    globalClient.sendText(message.from, 'Olá! Como posso te ajudar?');
                }*/
                   


                    try {
                        if (!message) {
                            console.log("[onMessage] Mensagem nula ou indefinida.");
                            return;
                        }
                      //  console.log(`[onMessage] Mensagem: ${JSON.stringify(message)}`);
                      if (message.from === 'status@broadcast') {
                        //console.log("[onMessage] Mensagem de status, ignorando.");
                        return;
                    }
                    if (message.isGroupMsg) {
                       // console.log("[onMessage] Mensagem de grupo, ignorando.");
                        return;
                    }
                    if (message.timestamp * 1000 < startTime) {
                        console.log("[onMessage] Mensagem antiga, ignorando:", message.body);
                        return;
                    }
        
                    if (message.type !== 'chat') {
                        console.log("[onMessage] Mensagem de mídia detectada.");
                        globalClient.sendText(message.from, "Sou uma assistente virtual, poderia escrever?");
                        return;
                    }

                    console.log("[onMessage] Nova mensagem recebida!");

                    const phone = message.sender.id;
                    console.log(`[onMessage] Telefone do remetente: ${phone}`);
        
                    const blackList = JSON.parse(fs.readFileSync(filePath));
                    console.log(`[onMessage] Lista negra carregada: ${blackList}`);
        
                    if (blackList.includes(phone)) {
                        console.log("[onMessage] Número bloqueado, ignorando.");
                        return;
                    }
        
                    if (message.type === 'ptt' || message.type === 'audio') {
                        console.log("[onMessage] Mensagem de áudio recebida.");
                        globalClient.sendText(message.from, "Sou uma assistente virtual, não interpreto audio, poderia escrever?");
                        return;
                    }
                    const closed = isOperatingHours();
            
                    console.log(`[onMessage] Estabelecimento aberto? ${closed}`);
        
                    let newUser = false;
                    const userCadaster = banco.db.find(number => number.num === message.from);
                    if (!userCadaster) {
                        console.log("[onMessage] Usuário novo, cadastrando...");
                        const texto = "Cliente: " + message.sender.pushname + " Salvo no sistema, caso não seja um cliente remova ele";
                        setSound(texto, message.sender.pushname);
                        newUser = true;
                        banco.db.push({ num: message.from, historico: [], name: message.sender.pushname });
        
                        let descriptionNow = message.body || "";
                        const contact = {
                            id: contacts.length + 1,
                            name: message.sender.pushname,
                            phone: message.sender.id,
                            descriptionNow: descriptionNow
                        };
                        contacts.push(contact);
                        console.log(`[onMessage] Novo contato salvo: ${JSON.stringify(contact)}`);
                    } else {
                        console.log("[onMessage] Usuário já existente.");
                        setSound("cliente " + message.sender.pushname, message.sender.pushname);
                    }
        
                    const contact = contacts.find(c => c.phone === message.sender.id);
                    console.log(`[onMessage] Contato encontrado: ${JSON.stringify(contact)}`);
                    const contactId = contact?.id;
                    let text = "";
        
                    if (contactId) {
                        if (!conversations[contactId]) conversations[contactId] = [];
                        const hour = new Date().getHours();
                        const minute = new Date().getMinutes();
                        const getDate = `${hour}:${minute}`;
        
                        if (!(message.body)) {
                            console.log("[onMessage] Mensagem vazia, pedindo reenvio.");
                            setSound("Cliente " + message.sender.pushname + ", não conseguir compreender mensagem", message.sender.pushname);
                            text = "Sou uma assistente virtual, Não compreendi sua mensagem poderia falar novamente?";
                            globalClient.sendText(message.from, text);
                            return;
                        } else {
                            text = message.body;
                        }
                        conversations[contactId].push({ from: message.sender.pushname, text: text, date: getDate });
                        console.log(`[onMessage] Conversa atualizada: ${JSON.stringify(conversations[contactId])}`);
                    }
        
                    let historico = banco.db.find(num => num.num === message.from);
                    if (!historico) {
                        console.log("[onMessage] Criando novo histórico.");
                        historico = { num: message.from, historico: [] };
                        banco.db.push(historico);
                    }
                    historico.historico.push("historico do cliente: " + message.sender.pushname + " :" + text);
                    console.log(`[onMessage] Histórico atualizado: ${JSON.stringify(historico)}`);
        
                    if (historico.historico.length >= 2) {
                        const bol = historico.historico[historico.historico.length - 2] == historico.historico[historico.historico.length - 1];
                        if (bol) {
                            console.log("[onMessage] Mensagem repetida, ignorando.");
                            return;
                        }
                    }
        
                    let audio = "Se estiver aberto o estabelecimento e a pessoa mandou audio, então pessoa mandou audio então fale pra ela, do jeito que vc quiser falar com gentileza pra ela escrever e deixe explicitamente que você é uma assistente virtual pronto pra atender ela, se ela continuar mandando audio não fale nada, mas se ela escrever vc pode atender ela normalmente sempre focando em finalizar o pedido";
                    if (message.type !== 'ptt') {
                        audio = "";
                    }
        
                    console.log("[onMessage] Preparando chamada IA...");
                    const genAI = new GoogleGenerativeAI(API_KEY);
                    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
                    let isClosed = "";
                    if (closed) {
                        if (dataSystem.includes("inativo")) {
                            isClosed = "fale pro cliente que não estamos funcionando hoje, agradeça o cliente pela preferencia";
                        }
                    } else {
                        isClosed = "O estabelecimento está fechado, fale pro cliente isso de maneira educada";
                    }
        
                    const prompt = `
                        ${newTreinamento}
                        Histórico de conversas ${historico.historico}\n\n
                        Cliente está falando atenda ele conforme dito acima, foque em finalizar o pedido : ele falou: ${text}\n${isClosed}
                    `;
                    console.log("[onMessage] Prompt IA montado");
        
                    const result = await model.generateContent(prompt);
                    console.log(`[onMessage] Resposta IA: ${result.response.text()}`);
        
                    if (contactId) {
                        if (!conversations[contactId]) conversations[contactId] = [];
                        const hour = new Date().getHours();
                        const minute = new Date().getMinutes();
                        const getDate = `${hour}:${minute}`;
                        conversations[contactId].push({ from: "me_ia", text: result.response.text(), date: getDate });
                        console.log(`[onMessage] Conversa IA salva: ${JSON.stringify(conversations[contactId])}`);
                    }
        
                    if (result.response.text().toLowerCase().includes("enviando cardapio") || result.response.text().toLowerCase().includes("enviando cardápio")) {
                        console.log("[onMessage] IA pediu para enviar cardápio.");
                        sendImages(message.from);
                    }
        
                    if (result.response.text().toLowerCase().includes("pedido anotado")) {
                        console.log("[onMessage] IA reconheceu pedido anotado.");
                        const newPrompt = `
                            Histórico de conversas ${historico.historico}\n\n
                            O cliente ${message.sender.pushname} resuma pra mim em poucas palavras qual o pedido dele, sem enrolação, faça um resumo colocando as coisas mais importantes do pedido na fala, em ordem seja formal e direto, seja direta mesmo só quero a informação
                        `;
                        const resultPedido = await model.generateContent(newPrompt);
                        const pedido_cliente = resultPedido.response.text();
                        console.log(`[onMessage] Pedido resumido: ${pedido_cliente}`);
        
                        globalClient.sendText("5531986775428@c.us", "Pedido do cliente: \n\n" + pedido_cliente);
                        globalClient.sendText("557374006739@c.us", "Pedido do cliente: \n\n" + pedido_cliente);
                        globalClient.sendText("5531982122547@c.us", "Pedido do cliente: \n\n" + pedido_cliente);
                        setSound(pedido_cliente, message.sender.pushname);
                    }
        
                    historico.historico.push("assistent virtual: " + message.from, result.response.text());
                    console.log("[onMessage] Histórico finalizado");
        
                    globalClient.sendText(message.from, result.response.text());
        
                    if (newUser) {
                        if (message.from !== "557374006739@c.us") globalClient.sendText("557374006739@c.us", "Novo Cliente!!!! salvo no sistema -> " + message.sender.pushname);
                        if (message.from !== "5531982122547@c.us") globalClient.sendText("5531982122547@c.us", "Novo Cliente!!!! salvo no sistema -> " + message.sender.pushname);
                        if (message.from !== "5531986775428@c.us") globalClient.sendText("5531986775428@c.us", "Novo Cliente!!!! salvo no sistema -> " + message.sender.pushname);
                    }
        
                    console.log("[onMessage] Mensagem tratada com sucesso!");
        
                } catch (err) {
                    console.error("[onMessage] Erro ao processar mensagem:", err);
                }
            }).catch((err) => {
                console.error("[onMessage] Erro no onMessage:", err);
            });
        
            });
    
            console.log('Cliente pronto para uso!');
        
       // start(client);
  

function setSoundFromAudioFile(audioFilePath) {
    exec(`"C:\\Program Files\\VideoLAN\\VLC\\vlc.exe" ${audioFilePath}`, (err) => {
        if (err) {
            console.error(`Erro ao reproduzir o áudio: ${err}`);
        } else {
            console.log('Áudio reproduzido com sucesso!');
        }
    });
}

function setSound(texto, name) {
    const gtts = new gTTS(texto, 'pt');
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const safeName = name.replace(/\s+/g, '_');
    const dirPath = path.join(__dirname, 'clientes'); // Caminho absoluto para a pasta 'clientes'
    const arquivoAudio = path.join(dirPath, `cliente_${safeName}_.ogg`);

    // Verifica se o diretório 'clientes' existe, se não, cria
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }

    // Salva o arquivo de áudio
    gtts.save(arquivoAudio, (err) => {
        if (err) {
            throw new Error(err);
        }
        console.log(`Arquivo de áudio salvo como ${arquivoAudio}`);

        // Caminho para o VLC
        const vlcPath = '"C:\\Program Files\\VideoLAN\\VLC\\vlc.exe"';
        const vlcCommand = `${vlcPath} --play-and-exit "${arquivoAudio}"`;

        // Executa o comando VLC para tocar o áudio
        exec(vlcCommand, (error, stdout, stderr) => {
            if (error) {
                console.error(`Erro ao reproduzir o áudio: ${error.message}`);
                return;
            }
            console.log('Áudio reproduzido com sucesso!');
        });
    });
}
const filePath = "blackList.json";

function initializeFile() {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify([]));
    }
}

initializeFile();

function addToBlackList(number) {}

app.post('/addToBlacklist', (req, res) => {
    const { number } = req.body;
    let message = "";
    if (!number) {
        message = 'Número não fornecido';
        return res.json({ type: 'blacklist', message: message });
    }
    const blackList = JSON.parse(fs.readFileSync(filePath));
    if (blackList.includes(number)) {
        message = 'Número já na blacklist.';
        return res.json({ type: 'blacklist', message: message });
    }
    blackList.push(number);
    fs.writeFileSync(filePath, JSON.stringify(blackList, null, 2));
    message = "Foi adicionado à blacklist";
    res.json({ type: 'blacklist', message: message });
});

app.get('/getContacts', (req, res) => {
    const blackList = JSON.parse(fs.readFileSync(filePath));
    const filteredContacts = contacts.filter(contact => !blackList.includes(contact.phone) && contact.name);
    res.json({ type: 'contacts', data: filteredContacts });
});

app.post('/system', (req, res) => {
    const { system } = req.body;
    let message = "";
    if (system) {
        dataSystem = [""];
        message = "Sistema ativo com sucesso";
    } else {
        dataSystem = ["inativo"];
        message = "Sistema inativo com sucesso";
    }
    res.json({ type: "system", message: message });
});

app.post('/addContact', (req, res) => {
    const { name, phone } = req.body;
    let message = "Contato criado com sucesso";
    const contact = {
        id: contacts.length + 1,
        name: name,
        phone: "55" + phone + "@c.us",
        descriptionNow: "Contato criado"
    };
    contacts.push(contact);
    res.json({ type: "addContact", message: message });
});

async function sendImages(phone) {
    try {
        const imagePath1 = './src/new_acai.jpg';
        const caption1 = 'Nosso cardápio!!!';
        const result1 = await globalClient.sendImage(
            phone,
            imagePath1,
            'image_name1',
            caption1
        );
        console.log('Primeira imagem enviada com sucesso:', result1);
    } catch (erro) {
        message = "Erro ao enviar";
        console.error('Erro ao enviar imagem:', erro);
    }
}

app.post('/sendMenu', (req, res) => {
    const { phone } = req.body;
    let message = "Enviado com sucesso";
    sendImages(phone);
    res.json({ type: "menu", message: message });
});

app.post('/getMessages', (req, res) => {
    const { contactId } = req.body;
    const messages = conversations[contactId] || [];
    res.json({ type: 'messages', contactId, data: messages });
});

app.post('/sendMessage', (req, res) => {
    const { contactId, text } = req.body;
    const contact = contacts.find(c => c.id === parseInt(contactId));
    if (contact && globalClient) {
        const hour = new Date().getHours();
        const minute = new Date().getMinutes();
        const getDate = `${hour}:${minute}`;
        globalClient.sendText(contact.phone, text)
            .then(() => {
                if (!conversations[contactId]) conversations[contactId] = [];
                conversations[contactId].push({ from: 'me', text: text, date: getDate });
                res.json({ type: 'messageSent', success: true, message: text, date: getDate });
                const historico = banco.db.find(num => num.num === contactId);
                if (!historico) {
                    historico = { num: message.from, historico: [] };
                    banco.db.push(historico);
                }
                historico.historico.push("Atendente da loja respondeu o cliente assim o: " + text);
            })
            .catch((err) => {
                console.error('Erro ao enviar mensagem:', err);
                res.status(500).json({ success: false, error: err.message, type: 'messageSent', message: text, date: getDate });
            });
    } else {
        res.json({ type: 'messageSent', success: false, error: 'Contato não encontrado', date: getDate });
    }
});

const port = 3001;
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});

const header = {
    "Authorization": "Bearer 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",
    "Content-Type": "application/json"
};

const isOperatingHours = () => {
    const now = new Date();
    const hours = now.getHours();
    console.log("hours", hours);
    var bol = hours >= 10 && hours <= 23;
    return bol;
};
