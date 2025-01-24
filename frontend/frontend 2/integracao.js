document.addEventListener("DOMContentLoaded", function() {

async function fetchModules() {
    const apiKey = localStorage.getItem("apiKey");

    try {
        const response = await fetch("http://localhost:3000/modulos/todos", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey
            }
        });

        if (response.ok) {
            const modules = await response.json();
            console.log("Tags carregadas:", questions);
            displayModules(modulos);
        } else {
            console.error("Erro ao buscar tags");
        }
    } catch (error) {
        console.error("Erro ao conectar com o servidor:", error);
    }
}

// function displayModules(questions) {
//     const questionListContainer = document.querySelector(".question-list");
//     questionListContainer.innerHTML = "";

//     modules.forEach(question => {
//         const truncatedText = question.pergunta ? question.pergunta.slice(0, 10) + "..." : "Tag não disponível";
//         const questionItem = document.createElement("div");
//         moduleItem.classList.add("question-item");

//         questionItem.innerHTML = `
//             <div class="question-data">
//                 <input type="checkbox" class="custom-checkbox" data-question-id="${question.id}">
//                 <div class="question-info">
//                     <h3 class="question-title">${truncatedText}</h3>
//                     <p>${question. || 0}% de acerto</p>
//                 </div>
//             </div>
//         `;

//         questionListContainer.appendChild(questionItem);
//     });

//     console.log("Questões exibidas na interface");
// }

// fetchModules();

document.querySelector(".save-button").addEventListener("click", async function() {
    console.log("Botão Salvar clicado");

    const apiKey = localStorage.getItem("apiKey");
    const titulo = document.getElementById("nome-teste").innerText.trim();
    const descricao = document.getElementById("descricao-teste").value.trim();

    if (!titulo || !descricao) {
        alert("Por favor, preencha todos os campos obrigatórios.");
        return;
    }

    try {
        const testeId = await createTest(apiKey, titulo, descricao);

        if (testeId) {

            const selectedQuestions = getSelectedQuestions();
            if (selectedQuestions.length > 0) {
                await addRandomQuestions(testeId, selectedQuestions);
            } else {
                alert("Por favor, selecione pelo menos uma questão para adicionar ao teste.");
            }
        }
    } catch (error) {
        console.error("Erro ao processar a criação do teste e a adição de questões:", error);
    }
});


async function createTest(apiKey, titulo, descricao) {
    try {
        const payload = { titulo, descricao };
        const response = await fetch("http://localhost:3000/simulados", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const data = await response.json();
            const testeId = data[0]?.id || data.id;
            console.log("Teste criado com sucesso, ID:", testeId);
            alert("Teste criado com sucesso!");
            
            return testeId;
        } else {
            const errorData = await response.json();
            console.error("Erro ao criar teste:", errorData.error);
            alert("Erro ao criar teste: " + errorData.error);
            return null;
        }
    } catch (error) {
        console.error("Erro ao conectar com o servidor:", error);
        alert("Erro ao conectar com o servidor. Verifique sua conexão.");
        return null;
    }
}

function getSelectedQuestions() {
    const selectedQuestions = [];
    document.querySelectorAll(".question-checkbox:checked").forEach(checkbox => {
        selectedQuestions.push(checkbox.getAttribute("data-question-id"));
    });
    return selectedQuestions;
}


async function addRandomQuestions() {
    const moduleId = document.getElementById("module-select").value;
    const quantity = document.getElementById("quantity-input").value;
  
    if (!moduleId || !quantity) {
      alert("Selecione um módulo e informe a quantidade de questões.");
      return;
    }
  
    try {
      const response = await fetch(`/api/simulados/${testId}/questoes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': localStorage.getItem('apiKey'),
        },
        body: JSON.stringify({ quantidade: quantity, idModulo: moduleId }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        alert(`Erro: ${errorData.error}`);
      } else {
        const { questoes } = await response.json();
        alert(`${questoes.length} questões aleatórias adicionadas com sucesso!`);
      }
    } catch (error) {
      alert('Erro ao conectar com o servidor. Verifique sua conexão.');
    }
  }
  
  document.getElementById("add-random-questions").addEventListener("click", addRandomQuestions);
        
document.getElementById("search-input").addEventListener("input", function() {
    const searchValue = this.value.toLowerCase();
    const questions = document.querySelectorAll(".question-item");

    questions.forEach(function(question) {
        const questionText = question.querySelector('h3').textContent.toLowerCase();
        question.style.display = questionText.includes(searchValue) ? 'block' : 'none';
    });
});
});


// ------------------------------------------------------- INTEGRAÇÃO ---------------------------------------------------------


// // NAVEGAÇÃO
// function configurarNavegacao(questoes, apiKey) {
//     let questaoAtualIndex = 0;

//     const prevButton = document.querySelector('.prev-button');
//     const nextButton = document.querySelector('.next-button');

//     prevButton.addEventListener('click', () => {
//         if (questaoAtualIndex > 0) {
//             questaoAtualIndex--;
//             carregarQuestao(questoes[questaoAtualIndex].id_questao, apiKey);
//         }
//     });

//     nextButton.addEventListener('click', () => {
//         if (questaoAtualIndex < questoes.length - 1) {
//             questaoAtualIndex++;
//             carregarQuestao(questoes[questaoAtualIndex].id_questao, apiKey);
//         } else {
//             finalizarTeste();
//         }
//     });
// }

// // ENVIO DA RESPOSTA
// function configurarSelecaoResposta() {
//     const answerButtons = document.querySelectorAll('.option-button');

//     answerButtons.forEach(button => {
//         button.addEventListener('click', () => {
//             answerButtons.forEach(btn => btn.parentElement.classList.remove('selected'));
//             button.parentElement.classList.add('selected');
//         });
//     });

//     const submitButton = document.querySelector('.submit-button');
//     submitButton.addEventListener('click', () => {
//         const respostaSelecionada = document.querySelector('.answers .selected button').textContent.trim();
//         salvarResposta(respostaSelecionada);
//     });
// }

// async function salvarResposta(respostaSelecionada) {
//     const apiKey = localStorage.getItem('apiKey');
//     const questaoId = document.querySelector('.question-body').getAttribute('data-id');

//     try {
//         const response = await fetch(`http://localhost:3000/respostas`, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'x-api-key': apiKey,
//             },
//             body: JSON.stringify({
//                 questao_id: questaoId,
//                 resposta: respostaSelecionada,
//             }),
//         });

//         if (!response.ok) {
//             throw new Error('Erro ao salvar a resposta.');
//         }

//         console.log('Resposta salva com sucesso.');
//     } catch (error) {
//         console.error('Erro ao salvar a resposta:', error);
//     }
// }   


// // FINALIZANDO O TESTE
// function finalizarTeste() {
//     if (confirm('Você deseja finalizar o teste?')) {
//         // window.location.href = `http://127.0.0.1:5500/frontend/frontend%202/resultados.html`;
//         window.location.href = `/index.html#userHome`;
//     }
// }
