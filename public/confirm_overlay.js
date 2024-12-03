function exibirOverlayConfirmacao(mensagem) {
    // Cria os elementos do overlay
    const overlay = document.createElement('div');
    overlay.classList.add('overlay');
  
    const mensagemContainer = document.createElement('div');
    mensagemContainer.classList.add('mensagem-container');
    mensagemContainer.textContent = mensagem;
  
    const botoesContainer = document.createElement('div');
    botoesContainer.classList.add('botao-container');
  
    const botaoConfirmar = document.createElement('button');
    botaoConfirmar.classList.add('botao');
    botaoConfirmar.textContent = 'Confirmar';
    botaoConfirmar.addEventListener('click',   
   () => {
      // Lógica para quando o usuário confirma
      console.log('Usuário confirmou');
      removerOverlay();
    });
  
    botoesContainer.appendChild(botaoConfirmar);
  
    overlay.appendChild(mensagemContainer);
    overlay.appendChild(botoesContainer);
  
    // Adiciona o overlay ao corpo do documento
    document.body.appendChild(overlay);
  
    // Função para remover o overlay
    function removerOverlay() {
      document.body.removeChild(overlay);
    }
  }