const buttons = document.querySelectorAll('.solicitarButton');

// Adicionamos um evento de clique a cada botão
buttons.forEach((button) => {
    button.addEventListener('click', () => {
        // Redireciona para outra página ou executa alguma lógica
        window.location.href = './servico_page';
    });
});