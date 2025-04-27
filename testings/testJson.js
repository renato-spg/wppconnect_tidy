// Importa a biblioteca nativa 'fs' (file system) para ler e escrever arquivos
const fs = require('fs');

const filePath = './data.json';

const novoConteudo = {
    note: 'ANOTAR',
    register: 'REGISTRARRRSSS',
    assistance: "Celulares, Assistência Especializada\ne Acessórios"
  };


  //update(novoConteudo)

  const data = getData()

  if(data){
    console.log(data);
  }



  function getData() {

    // Verifica se o arquivo existe
    if (fs.existsSync(filePath)) {
        // Lê o conteúdo do arquivo JSON
        const conteudo = fs.readFileSync(filePath, 'utf-8');
    
        // Transforma o texto em objeto JavaScript
        const objeto = JSON.parse(conteudo);
    
        // Retorna o objeto lido do arquivo
        return objeto[0];
      } else {
        // Se o arquivo não existir, cria um novo com o conteúdo inicial
        fs.writeFileSync(filePath, JSON.stringify([novoConteudo], null, 2), 'utf8');
        return null;
      }
  }

  function update(data){
    if (fs.existsSync(filePath)) {
        // Lê o conteúdo atual do arquivo JSON
        const conteudoAtual = fs.readFileSync(filePath, 'utf-8');
    
        // Transforma o texto em objeto JavaScript
        const objetoAtual = JSON.parse(conteudoAtual);
      
        // Atualiza os campos com os novos dados
        if (Array.isArray(objetoAtual) && objetoAtual.length > 0) {
            objetoAtual[0].note = data.note;
            objetoAtual[0].register = data.register;
            objetoAtual[0].assistance = data.assistance;
        } else {
            console.error('O arquivo JSON não contém um array válido.');
            return;
        }
      
        // Salva novamente o objeto modificado no arquivo
        fs.writeFileSync(filePath, JSON.stringify(objetoAtual, null, 2), 'utf-8');
        console.log('Arquivo atualizado com sucesso!');
      }
      else {
        // Se o arquivo não existir, cria um novo com o conteúdo inicial
        fs.writeFileSync(filePath, JSON.stringify([data], null, 2), 'utf8');

        console.log('Arquivo criado com sucesso!');
  }
}

 


