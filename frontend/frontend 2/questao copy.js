import { carregarDetalhesDoTeste } from './utils.js';

let questoes = [];
let questaoAtualIndex = 0;
let progressoLocal = JSON.parse(localStorage.getItem('progresso')) || {};
const apiKey = localStorage.getItem('apiKey'); 
const urlParams = new URLSearchParams(window.location.search);
const simuladoId = urlParams.get('id');

const questionBody = document.querySelector('.question-body p');
const answersContainer = document.querySelector('.answers');
const questionCounter = document.querySelector('.question-number h2');
// const submitButton = document.querySelector('.submit-button');
const prevButton = document.querySelector('.prev-button');
const nextButton = document.querySelector('.next-button');

const userId = localStorage.getItem('userId');
if (!userId) {
    console.error('Erro: userId não encontrado no localStorage.');
    alert('Erro ao carregar o usuário. Por favor, faça login novamente.');
    window.location.href = '/login.html'; 
    throw new Error('Usuário não autenticado.');
}


let currentQuestionId = null; 
let selectedAnswer = null;
let attemptId = localStorage.getItem('attemptId'); 



// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
const API_BASE_URL = "http://localhost:3000";

let respostaCorretaGlobal = null; 

let currentQuestionIndex = 0;
let totalQuestions = 0;

let explicacaoGlobal = null;

document.querySelectorAll('.answer').forEach(answer => {
    answer.addEventListener('click', event => {
        const elemento = event.currentTarget;
        const letra = elemento.querySelector('.option-button').getAttribute('data-option');
        selecionarAlternativa(elemento, letra);
    });
});


document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('Iniciando carregamento do teste...');

        await new Promise(resolve => setTimeout(resolve, 100));

        configurarPopupGabarito();

        if (!simuladoId) {
            throw new Error('ID do teste ausente.');
        }

        if (!apiKey) {
            throw new Error('API Key ausente. Por favor, configure a chave no localStorage.');
        }

        const botaoProximo = document.querySelector(".next-button");
        const botaoAnterior = document.querySelector(".prev-button");
        const botaoResponder = document.querySelector(".submit-button");

        desabilitarBotaoGabarito();

        if (!botaoProximo || !botaoAnterior || !botaoResponder) {
            throw new Error("Um ou mais botões essenciais não foram encontrados no DOM.");
        }

        // Adicionar eventos aos botões de navegação
        // botaoProximo.addEventListener("click", navegarProximaQuestao);
        // botaoAnterior.addEventListener("click", navegarQuestaoAnterior);

        botaoResponder.addEventListener("click", async () => {
            if (!selectedAnswer) {
                alert("Por favor, selecione uma alternativa.");
                return;
            }

            const respostaSalva = await salvarResposta(selectedAnswer);

            if (respostaSalva) {
                alert("Resposta salva com sucesso.");
                desabilitarBotaoResponder();
                desabilitarSelecaoAlternativas();

                const questaoAtual = await carregarQuestao(currentQuestionId);
                if (questaoAtual && questaoAtual.explicacao) {
                    habilitarBotaoGabarito(questaoAtual.explicacao);
                }
            }
        });

        console.log('Inicializando tentativa do teste...');
        const response = await fetch(`${API_BASE_URL}/simulados/${simuladoId}/iniciar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
            },
            body: JSON.stringify({ user_id: userId })
        });

        if (!response.ok) {
            throw new Error(`Erro ao iniciar tentativa. Status: ${response.status}`);
        }

        const attemptData = await response.json();
        console.log('Tentativa inicializada:', attemptData);

        attemptId = attemptData.attempt.id;
        localStorage.setItem('attemptId', attemptId);
        console.log('Attempt ID salvo no localStorage:', attemptId);

        const teste = await carregarDetalhesDoTeste(simuladoId, apiKey);

        if (teste && teste.questoes && teste.questoes.length > 0) {
            questoes = teste.questoes;
            totalQuestions = teste.questoes.length;
            currentQuestionIndex = 0;
            await carregarQuestao(questoes[currentQuestionIndex]);
        } else {
            alert('Nenhuma questão encontrada para este teste.');
        }
    } catch (error) {
        console.error('Erro na inicialização:', error);
        alert('Erro na inicialização. Tente novamente.');
    }
});
async function carregarQuestao(questaoId) {
    try {
        if (!questaoId) {
            throw new Error("ID da questão não fornecido.");
        }

        console.log(`Carregando questão com ID: ${questaoId}`);

        const response = await fetch(`${API_BASE_URL}/questoes/${questaoId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
            },
        });

        if (!response.ok) {
            throw new Error(`Erro ao carregar questão. Status: ${response.status}`);
        }

        const questao = await response.json();
        console.log("Questão carregada:", questao);

        const questionBody = document.querySelector(".question-body p");
        if (!questionBody) {
            throw new Error("Elemento .question-body p não encontrado no DOM.");
        }
        questionBody.textContent = questao.pergunta || "Enunciado não disponível";

        renderizarAlternativas(questao);

        // Atualiza o ID da questão atual
        currentQuestionId = questao.id;
        console.log("currentQuestionId definido para:", currentQuestionId);

        // Atribuir resposta correta globalmente
        respostaCorretaGlobal = questao.resposta_correta;

        habilitarBotaoGabarito(questao.explicacao);
    } catch (error) {
        console.error("Erro ao carregar questão:", error.message);
        alert("Erro ao carregar questão. Tente novamente.");
    }
}



function renderizarAlternativas(questao) {
    const answersContainer = document.querySelector(".answers");
    answersContainer.innerHTML = ""; 

    const alternativas = [
        { letra: "A", texto: questao.opcao_a },
        { letra: "B", texto: questao.opcao_b },
        { letra: "C", texto: questao.opcao_c },
        { letra: "D", texto: questao.opcao_d },
        { letra: "E", texto: questao.opcao_e },
    ];

    alternativas.forEach((opcao) => {
        if (opcao.texto) {
            const answerDiv = document.createElement("div");
            answerDiv.classList.add("answer");

            const button = document.createElement("button");
            button.classList.add("option-button");
            button.setAttribute("data-opcao", opcao.letra);
            button.textContent = opcao.letra;

            const text = document.createElement("p");
            text.textContent = opcao.texto;

            answerDiv.addEventListener("click", () => {
                selecionarAlternativa(answerDiv, opcao.letra);
            });

            answerDiv.appendChild(button);
            answerDiv.appendChild(text);
            answersContainer.appendChild(answerDiv);
        }
    });

    configurarSelecaoResposta();
}

function selecionarAlternativa(elemento, letra) {
    const botoes = document.querySelectorAll('.answer');
    botoes.forEach(botao => botao.classList.remove('selected'));

    elemento.classList.add('selected');
    selectedAnswer = `opcao_${letra.toLowerCase()}`; // Atualiza a variável com a opção selecionada

    console.log("Resposta selecionada:", selectedAnswer);

    const submitButton = document.querySelector('.submit-button');
    submitButton.disabled = false;
    submitButton.style.backgroundColor = '#FF9600';
    submitButton.style.color = '#FFFFFF';
}



function configurarPopupGabarito() {
    const botaoGabarito = document.querySelector(".question-button");
    const popupGabarito = document.getElementById("popup-gabarito");

    if (!botaoGabarito || !popupGabarito) {
        console.warn("Botão ou popup do gabarito não encontrado no DOM.");
        return;
    }

    console.log("Configuração do popup de gabarito iniciada.");

    // Garantir que o botão "Gabarito" comece desabilitado
    desabilitarBotaoGabarito();

    // Evento para abrir o popup apenas se o botão estiver habilitado
    botaoGabarito.addEventListener("click", () => {
        if (botaoGabarito.disabled) {
            alert("Responda a questão antes de acessar o gabarito.");
            return;
        }

        // Exibir o popup com a explicação global
        exibirGabarito(explicacaoGlobal);
    });

    // Evento para fechar o popup ao clicar fora
    popupGabarito.addEventListener("click", (e) => {
        if (e.target === popupGabarito) {
            popupGabarito.style.display = "none"; // Fecha o popup
        }
    });
}

function desabilitarBotaoGabarito() {
    const botaoGabarito = document.querySelector(".question-button");
    if (botaoGabarito) {
        botaoGabarito.disabled = true; // Botão desabilitado
        botaoGabarito.style.opacity = "0.5";
        botaoGabarito.style.cursor = "not-allowed";
    }
}

function habilitarBotaoGabarito(explicacao) {
    const botaoGabarito = document.querySelector(".question-button");
    if (botaoGabarito) {
        botaoGabarito.disabled = false; // Botão habilitado
        botaoGabarito.style.opacity = "1";
        botaoGabarito.style.cursor = "pointer";

        // Atualizar a explicação global
        explicacaoGlobal = explicacao; // Armazena a explicação na variável global
    }
}

function exibirGabarito(explicacao) {
    const popupGabarito = document.getElementById("popup-gabarito");
    const explanationContent = popupGabarito.querySelector(".explanation-content p");

    if (!popupGabarito || !explanationContent) {
        console.error("Erro: Elementos do pop-up de gabarito não encontrados.");
        return;
    }

    // Atualizar o texto do popup
    explanationContent.textContent = explicacao || "Nenhuma explicação disponível.";

    // Exibir o popup
    popupGabarito.style.display = "flex";
}



function configurarSelecaoResposta() {
    const buttons = document.querySelectorAll('.option-button');
    const submitButton = document.querySelector('.submit-button');

    buttons.forEach((button) => {
        button.addEventListener('click', () => {
            buttons.forEach((btn) => btn.classList.remove('selected'));
            
            button.classList.add('selected');

            submitButton.disabled = false;
            submitButton.style.backgroundColor = '#FF9600';
            submitButton.style.color = '#FFFFFF';

            selectedAnswer = button.getAttribute('data-opcao');
            console.log(`Resposta selecionada: ${selectedAnswer}`);
        });
    });
}// Lógica para o botão "Responder"
// Exibe resultado e corrige erros na atribuição de IDs
function exibirResultado(questaoId, respostaSelecionada) {
    const questao = progressoLocal[questaoId];

    if (!questao) {
        alert("Erro ao recuperar informações da questão.");
        return;
    }

    const botoes = document.querySelectorAll(".option-button");
    botoes.forEach((botao) => {
        const letra = botao.getAttribute('data-option') || botao.textContent.trim();
        const opcaoSelecionada = `opcao_${letra.toLowerCase()}`;
        const opcaoCorreta = questao.resposta_correta;

        if (opcaoSelecionada === opcaoCorreta) {
            botao.style.backgroundColor = "#00C851"; // Verde para correta
            botao.style.color = "#ffffff";
        } else if (opcaoSelecionada === respostaSelecionada) {
            botao.style.backgroundColor = "#FF4444"; // Vermelho para errada
            botao.style.color = "#ffffff";
        }

        botao.disabled = true;
        botao.style.cursor = "not-allowed";
    });
}
async function salvarResposta(respostaSelecionada) {
    try {
        const attemptId = localStorage.getItem("attemptId");

        console.log("Attempt ID:", attemptId);
        console.log("Current Question ID:", currentQuestionId);
        console.log("Resposta Selecionada:", respostaSelecionada);

        // Validações de dados obrigatórios
        if (!attemptId) {
            throw new Error("Attempt ID ausente ou inválido.");
        }
        if (!currentQuestionId) {
            throw new Error("ID da questão ausente ou inválido.");
        }
        if (!respostaSelecionada) {
            throw new Error("Resposta não selecionada.");
        }

        // Payload para envio
        const payload = {
            attempt_id: attemptId,
            questao_id: currentQuestionId,
            resposta: respostaSelecionada,
        };

        console.log("Payload enviado:", payload);

        // Requisição para salvar a resposta
        const response = await fetch(`${API_BASE_URL}/simulados/${simuladoId}/responder`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorResponse = await response.json();
            console.error("Erro da API:", errorResponse);
            throw new Error(`Erro ao salvar resposta: ${errorResponse.error || response.statusText}`);
        }

        const data = await response.json();
        console.log("Resposta salva com sucesso:", data);

        // Salvar progresso local
        salvarProgressoLocal(currentQuestionId, respostaSelecionada);

        // Verificar resposta correta
        if (data.correctAnswer) {
            const isCorrect = respostaSelecionada === data.correctAnswer;
            console.log(isCorrect ? "Resposta correta!" : "Resposta incorreta!");
        }

        return true;
    } catch (error) {
        console.error("Erro ao salvar resposta:", error.message);
        alert(error.message || "Erro ao processar a resposta. Tente novamente.");
        return false;
    }
}

// Garantindo que os IDs sejam configurados corretamente
document.querySelector(".submit-button").addEventListener("click", async () => {
    try {
        if (!selectedAnswer) {
            alert("Por favor, selecione uma alternativa.");
            return;
        }

        const currentQuestionId = questoes[currentQuestionIndex]?.id_questao;
        if (!currentQuestionId) {
            alert("Erro ao identificar a questão atual. Tente novamente.");
            return;
        }

        exibirResultado(currentQuestionId, selectedAnswer);

        const respostaSalva = await salvarResposta(selectedAnswer);

        if (!respostaSalva) {
            alert("Erro ao salvar a resposta. Tente novamente.");
            return;
        }

        const answerButtons = document.querySelectorAll(".option-button");
        answerButtons.forEach((button) => {
            button.disabled = true;
            button.style.cursor = "not-allowed";
        });

        const submitButton = document.querySelector(".submit-button");
        submitButton.disabled = true;
        submitButton.style.backgroundColor = "#F5F5F5";
        submitButton.style.color = "#858585";

        if (currentQuestionIndex === questoes.length - 1) {
            console.log("Finalizando o teste...");
            exibirPopupFinalizacao();
            await finalizarTeste();
        } else {
            navegarProximaQuestao();
        }
    } catch (error) {
        console.error("Erro ao processar resposta:", error.message);
        alert("Erro ao processar a resposta. Tente novamente.");
    }
});

function exibirPopupFinalizacao() {
    const popupDiv = document.createElement("div");
    popupDiv.textContent = "Parabéns! Você concluiu o teste. Salvando os dados...";
    popupDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        padding: 20px;
        background-color: #4CAF50;
        color: white;
        font-size: 1.5rem;
        border-radius: 5px;
        text-align: center;
        z-index: 9999;
    `;
    document.body.appendChild(popupDiv);

    setTimeout(() => {
        popupDiv.remove();
    }, 3000);
}

async function finalizarTeste() {
    try {
        const response = await fetch(`${API_BASE_URL}/simulados/${simuladoId}/finalizar`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
            },
            body: JSON.stringify({ attempt_id: attemptId }),
        });

        if (!response.ok) {
            throw new Error(`Erro ao finalizar teste. Status: ${response.status}`);
        }

        const result = await response.json();
        alert(result.message || "Teste finalizado com sucesso!");

        // Redirecionar após a finalização
        window.location.href = `/detalhes-teste.html?id=${simuladoId}`;
    } catch (error) {
        console.error("Erro ao finalizar teste:", error.message);
        alert("Erro ao finalizar teste. Tente novamente.");
    }
}

function salvarProgressoLocal(questaoId, respostaSelecionada) {
    const progresso = JSON.parse(localStorage.getItem("progresso")) || {};
    progresso[questaoId] = respostaSelecionada; // Atualiza a resposta da questão atual
    localStorage.setItem("progresso", JSON.stringify(progresso)); // Salva o progresso atualizado
    console.log("Progresso salvo no Local Storage:", progresso);
}


// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-














// function verificarProgressoLocal(questaoId) {
//     const progresso = JSON.parse(localStorage.getItem("progresso")) || {};

//     if (progresso[questaoId]) {
//         // Se a questão já foi respondida
//         const respostaSalva = progresso[questaoId];
//         console.log(`Progresso encontrado para a questão ${questaoId}: ${respostaSalva}`);

//         // Marca a alternativa respondida como selecionada
//         const alternativaSelecionada = document.querySelector(
//             `.option-button[data-opcao="${respostaSalva.replace("opcao_", "").toUpperCase()}"]`
//         );

//         if (alternativaSelecionada) {
//             alternativaSelecionada.classList.add("selected");
//         }

//         // Desabilita o botão "Responder" e as alternativas
//         desabilitarBotaoResponder();
//         desabilitarSelecaoAlternativas();
//     } else {
//         // Se a questão ainda não foi respondida
//         console.log(`Nenhum progresso encontrado para a questão ${questaoId}`);
//         restaurarEstadoAlternativas();
//     }
// }




// Atualiza o estado dos botões e verifica a finalização
function atualizarEstadoBotoes() {
    const botaoProximo = document.querySelector(".next-button");
    const botaoAnterior = document.querySelector(".prev-button");

    if (botaoProximo) {
        botaoProximo.disabled = currentQuestionIndex >= questoes.length - 1;
        botaoProximo.style.opacity = botaoProximo.disabled ? "0.5" : "1";
    }

    if (botaoAnterior) {
        botaoAnterior.disabled = currentQuestionIndex <= 0;
        botaoAnterior.style.opacity = botaoAnterior.disabled ? "0.5" : "1";
    }

    // Verifica se é a última questão para exibir alerta de finalização
    if (currentQuestionIndex === questoes.length - 1) {
        console.log("Última questão alcançada.");
    }
}

const botaoResponder = document.querySelector(".submit-button");
botaoResponder.disabled = true;

// Ao selecionar uma alternativa, habilitar o botão
document.querySelectorAll('.answer').forEach(answer => {
    answer.addEventListener('click', () => {
        botaoResponder.disabled = false;
    });
});



// Navegação para próxima questão
function navegarProximaQuestao() {
    try {
        if (!questoes || questoes.length === 0) {
            console.error("Nenhuma questão disponível para navegação.");
            return;
        }

        if (currentQuestionIndex < questoes.length - 1) {
            currentQuestionIndex++;
            carregarQuestao(questoes[currentQuestionIndex]);
            atualizarEstadoBotoes(); // Atualiza os botões após a navegação
        } else {
            alert("Você já está na última questão.");
        }
    } catch (error) {
        console.error("Erro ao navegar para a próxima questão:", error.message);
        alert("Erro ao navegar para a próxima questão. Tente novamente.");
    }
}

// Navegação para questão anterior
function navegarQuestaoAnterior() {
    try {
        if (!questoes || questoes.length === 0) {
            console.error("Nenhuma questão disponível para navegação.");
            return;
        }

        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            carregarQuestao(questoes[currentQuestionIndex]);
            atualizarEstadoBotoes(); // Atualiza os botões após a navegação
        } else {
            alert("Você já está na primeira questão.");
        }
    } catch (error) {
        console.error("Erro ao navegar para a questão anterior:", error.message);
        alert("Erro ao navegar para a questão anterior. Tente novamente.");
    }
}

// Inicializa os botões de navegação
const botaoProximo = document.querySelector(".next-button");
const botaoAnterior = document.querySelector(".prev-button");

if (botaoProximo) botaoProximo.addEventListener("click", navegarProximaQuestao);
if (botaoAnterior) botaoAnterior.addEventListener("click", navegarQuestaoAnterior);


// // -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-





// // -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-







function desabilitarSelecaoAlternativas() {
    const botoes = document.querySelectorAll('.answer');
    botoes.forEach(botao => {
        botao.classList.add('disabled'); // Adicione uma classe para estilo (opcional)
        botao.style.pointerEvents = 'none'; // Impede interações
    });
}
function desabilitarBotaoResponder() {
    const submitButton = document.querySelector('.submit-button');
    if (submitButton) {
        submitButton.disabled = true; // Desativa o botão
        submitButton.style.opacity = '0.5'; // Ajuste visual
        submitButton.style.cursor = 'not-allowed';
        submitButton.style.backgroundColor = '#ccc'; // Cor desabilitada
        submitButton.style.color = '#666';
    }
}


// // -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-


document.querySelector('.back-arrow').addEventListener('click', () => {
    const simuladoId = new URLSearchParams(window.location.search).get('id');
    window.location.href = `testdetails.html?id=${simuladoId}`;
});


