document.addEventListener("DOMContentLoaded", () => {
    // Simulação de dados do usuário obtidos do token ou do backend
    const userData = {
      nome: "Jonas da Silva",
      cpf: "054.544.060-23",
    };
  
    // Preenchendo os campos automaticamente
    document.getElementById("nome").value = userData.nome;
    document.getElementById("cpf").value = userData.cpf;
  
    // Manipulação do formulário
    const form = document.getElementById("appointment-form");
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
  
      const formData = new FormData();
      formData.append("userId", 1); // Simulando userId
      formData.append("doc1", document.getElementById("doc1").files[0]);
      formData.append("doc2", document.getElementById("doc2").files[0]);
  
      try {
        const response = await fetch("http://localhost:3000/uploadDocuments", {
          method: "POST",
          body: formData,
        });
  
        if (response.ok) {
          alert("Documentos enviados com sucesso!");
        } else {
          alert("Erro ao enviar os documentos.");
        }
      } catch (error) {
        console.error("Erro:", error);
        alert("Erro ao conectar ao servidor.");
      }
    });
  });
  