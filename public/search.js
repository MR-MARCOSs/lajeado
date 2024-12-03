document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('input');
    input.addEventListener('input', pesquisar); // Chama a função pesquisar a cada tecla digitada

    // Chama a função pesquisar inicialmente para exibir todos os resultados
    pesquisar();
});



function pesquisar() {
    const section = document.getElementById("container");
    const campoPesquisa = document.getElementById("input").value.toLowerCase();

    let resultados = "";

    if (!campoPesquisa || campoPesquisa.trim() === "") {  // Verifica se o campo está vazio ou contém apenas espaços em branco
        // Exibe todos os resultados se o campo de pesquisa estiver vazio
        dados.forEach(item => {
            resultados += criarBox(item);
        });

    } else {
        // Filtra os dados com base no texto pesquisado
        const dadosFiltrados = dados.filter(dado => {
            const titulo = dado.titulo.toLowerCase();
            const tags = dado.tags.toLowerCase();
            return titulo.includes(campoPesquisa) || tags.includes(campoPesquisa);
        });

        if (dadosFiltrados.length === 0) {
            resultados = "<p>Nada foi encontrado</p>";
        } else {
            dadosFiltrados.forEach(item => {
                resultados += criarBox(item);
            });
        }
    }

    section.innerHTML = resultados;
}


function criarBox(item) {
    return `
        <div class="box">
            <h2>${item.titulo}</h2>
            <br><br>
            <div class="small-box">
                <a href="${item.link}" id="carta">Carta de Serviço</a>
                <br>
                <button><a href="./solicitacao_page">Solicitar</a></button>
            </div>
        </div>
        <br>
    `;
}