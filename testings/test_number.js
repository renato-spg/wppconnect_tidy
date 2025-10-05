async function simulateSend(numero) {
    // Função fake pra simular envio
    async function fakeSendText(id, message, options) {
      console.log(`Simulando envio para: ${id} com mensagem: ${message}`);
      // Retorna um objeto simulado como se tivesse enviado
      return { id: Math.random().toString(36).substring(7) }; 
    }
  
    console.log(`Enviando mensagem para número: ${numero}`);
    let sendResult = await fakeSendText(`55${numero}@c.us`, "Mensagem de teste", { quotedMessageId: '' });
  
    if (sendResult && sendResult.id) {
      console.log('Mensagem enviada com sucesso!, pronto pra enviar outra');
  
      if (numero.length > 10 && numero.charAt(2) === '9') {
        console.log("Número maior que 10 e '9' na posição 2, enviando versão sem o 9...");
  
        let numeroSem9 = `${numero.substring(0, 2)}${numero.substring(3)}`; // Remove o 9
        sendResult = await fakeSendText(`55${numeroSem9}@c.us`, `Mensagem de teste sem 9\n\n ${numeroSem9}`, { quotedMessageId: '' });
  
        if (sendResult && sendResult.id) {
          console.log('2ª Mensagem enviada com sucesso!');
        }
      }
      return true;
    }
    
    return false;
  }
  
  // Exemplo de uso:
  //simulateSend('31986775428'); // Número com '9' depois do DDD (11)
  simulateSend("3186775428");  // Número sem o '9' depois do DDD
  