// let totalQuestoes = null

document.querySelector('.back-arrow').addEventListener('click', () => {
    const simuladoId = new URLSearchParams(window.location.search).get('id');
    window.location.href = `testdetails.html?id=${simuladoId}`;
});

// BUSCAR DADOS DA QUESTÃO
async function buscarDadosQuestao(questaoId) {
    const apiKey = localStorage.getItem('apiKey');
    const url = `http://localhost:3000/questoes/${questaoId}`;

    try {
        const resposta = await fetch(url, {
            headers: { 'X-API-KEY': apiKey },
        });

        if (!resposta.ok) {
            if (resposta.status === 404) {
                console.error("Questão não encontrada no servidor:", questionId);
                throw new Error('Questão não encontrada no servidor.');
            }
            console.error("Erro ao buscar os dados da questão. Status:", resposta.status);
            throw new Error('Erro ao buscar os dados da questão.');
        }

        const dados = await resposta.json();

        if (!dados || typeof dados !== 'object' || !dados.pergunta || !dados.opcao_a || !dados.opcao_b) {
            console.error("Resposta inválida da API:", dados);
            throw new Error('Dados da questão estão inválidos ou incompletos.');
        }

        console.log('Dados retornados pela API:', dados);
        return dados;
    } catch (erro) {
        console.error('Erro em buscarDadosQuestao:', erro.message);
        throw erro;
    }
}

// OBTENÇÃO DOS PARÂMETROS DA URL
function obterIdsDaUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const testId = urlParams.get('testId');
    const questionId = urlParams.get('questionId');

    console.log("Test ID:", testId, "Question ID:", questionId);

    if (!testId || !questionId) {
        console.error('Parâmetros testId ou questionId ausentes ou inválidos.');
        return null;
    }

    return { testId, questionId };
}

// INICIALIZAR A PÁGINA
async function inicializarPagina() {
    const ids = obterIdsDaUrl();

    if (!ids) {
        alert('Erro ao carregar a questão. Redirecionando para os detalhes do teste.');
        redirecionarParaDetalhes(new URLSearchParams(window.location.search).get('testId'));
        return;
    }

    try {
        const { questionId, testId } = ids;
        const dadosQuestao = await buscarDadosQuestao(questionId);
        atualizarHTML(dadosQuestao);

        configurarNavegacao();
    } catch (erro) {
        console.error('Erro ao carregar a questão:', erro.message);
        alert('Erro ao carregar a questão. Redirecionando para os detalhes do teste.');
        redirecionarParaDetalhes(ids.testId);
    }
}

function atualizarHTML(dados) {
    if (!dados || !dados.pergunta || !dados.opcao_a || !dados.opcao_b) {
        console.error('Os dados da questão são inválidos:', dados);
        throw new Error('Erro ao atualizar o HTML: Dados da questão inválidos.');
    }

    document.querySelector('.question-number h2').textContent = `Questão`;
    document.querySelector('.question-body p').textContent = dados.pergunta;

    const containerRespostas = document.querySelector('.answers');

    containerRespostas.innerHTML = '';

    const respostas = [
        { letra: 'A', texto: dados.opcao_a },
        { letra: 'B', texto: dados.opcao_b },
        { letra: 'C', texto: dados.opcao_c },
        { letra: 'D', texto: dados.opcao_d },
        { letra: 'E', texto: dados.opcao_e },
    ];

    respostas.forEach((resposta) => {
        if (resposta.texto) {
            const opcaoHTML = `
                <div class="answer">
                    <button class="option-button" data-option="${resposta.letra}">${resposta.letra}</button>
                    <p>${resposta.texto}</p>
                </div>
            `;
            containerRespostas.insertAdjacentHTML('beforeend', opcaoHTML);
        }
    });
}

// REDIRECIONAR PARA DETALHES DO TESTE
function redirecionarParaDetalhes(testId) {
    const basePath = window.location.pathname.split('/').slice(0, -1).join('/');
    const testDetailsPath = `${basePath}/testdetails.html?id=${testId}`;
    window.location.href = testDetailsPath;
}

function configurarNavegacao() {
    const prevButton = document.querySelector('.prev-button');
    const nextButton = document.querySelector('.next-button');

    const idsQuestoes = JSON.parse(localStorage.getItem('idsQuestoes'));
    const currentQuestionId = new URLSearchParams(window.location.search).get('questionId');

    if (!idsQuestoes || !currentQuestionId) {
        console.error('IDs de questões ou ID da questão atual não encontrados.');
        return;
    }

    const currentIndex = idsQuestoes.indexOf(currentQuestionId);

    if (currentIndex > 0) {
        prevButton.addEventListener('click', () => {
            const prevQuestionId = idsQuestoes[currentIndex - 1];
            redirecionarParaQuestao(prevQuestionId);
        });
        prevButton.disabled = false;
        prevButton.classList.remove('disabled');
    } else {
        prevButton.disabled = true;
        prevButton.classList.add('disabled');
    }

    if (currentIndex < idsQuestoes.length - 1) {
        nextButton.addEventListener('click', () => {
            const nextQuestionId = idsQuestoes[currentIndex + 1];
            redirecionarParaQuestao(nextQuestionId);
        });
        nextButton.disabled = false;
        nextButton.classList.remove('disabled');
    } else {
        nextButton.disabled = true;
        nextButton.classList.add('disabled');
    }
}

function redirecionarParaQuestao(questionId) {
    const testId = new URLSearchParams(window.location.search).get('testId');
    // Adicione uma flag para indicar que é uma navegação interna
    window.location.href = `questao.html?testId=${testId}&questionId=${questionId}&navegacaoInterna=true`;
}

inicializarPagina();
configurarNavegacao();



async function configurarGabaritoButton(submitButtonClicked = false) {
    const gabaritoButton = document.querySelector('.question-button');
    const popupContainer = document.getElementById('popup-gabarito');
    const explanationContent = popupContainer?.querySelector('.explanation-content');

    if (!gabaritoButton) {
        console.error("Erro: Botão do gabarito não encontrado. Verifique a classe '.question-button' no HTML.");
        return;
    }

    if (!popupContainer || !explanationContent) {
        console.error("Erro: Popup do gabarito ou conteúdo não encontrado no HTML. Verifique a estrutura.");
        return;
    }

    // Caso o botão "Responder" ainda não tenha sido clicado, o botão "Gabarito" permanece desabilitado
    if (!submitButtonClicked) {
        gabaritoButton.disabled = true;
        gabaritoButton.style.opacity = '0.5';
        gabaritoButton.style.cursor = 'not-allowed';
        console.log("Botão de gabarito desabilitado. Aguarde o clique no botão 'Responder'.");
        return;
    }

    // Habilitar o botão de gabarito após clique no botão "Responder"
    gabaritoButton.disabled = false;
    gabaritoButton.style.opacity = '1';
    gabaritoButton.style.cursor = 'pointer';

    gabaritoButton.addEventListener('click', async () => {
        try {
            const questionId = new URLSearchParams(window.location.search).get('questionId');
            const dadosQuestao = await buscarDadosQuestao(questionId);
            const explicacao = dadosQuestao?.explicacao;

            if (!explicacao) {
                console.error("Explicação não encontrada nos dados da questão.");
                return;
            }

            explanationContent.querySelector('p').innerText = explicacao;
            popupContainer.style.display = 'block';
            explanationContent.style.display = 'block';
            console.log("Gabarito exibido com sucesso.");
        } catch (erro) {
            console.error("Erro ao exibir o gabarito:", erro.message);
        }
    });

    popupContainer.addEventListener("click", (e) => {
        if (e.target === popupContainer) {
            popupContainer.style.display = "none";
            explanationContent.style.display = "none";
            console.log("Popup do gabarito fechado ao clicar fora.");
        }
    });

    console.log("Botão de gabarito configurado com sucesso.");
}











// Função para validar a presença do Attempt ID no LocalStorage
function validarAttemptId() {
    const attemptId = localStorage.getItem('attemptId');
    if (!attemptId) {
        console.error('Attempt ID não encontrado no localStorage.');
        alert('Erro ao carregar o teste. Tente reiniciar o teste.');
        window.location.href = '/testes.html'; // Redireciona para a página inicial de testes
        return null;
    }
    return attemptId;
}

async function configurarSelecaoResposta() {
    const containerRespostas = document.querySelector('.answers');
    const submitButton = document.querySelector('.submit-button');
    const gabaritoButton = document.querySelector('.question-button');
    const questionId = new URLSearchParams(window.location.search).get('questionId');
    const testId = new URLSearchParams(window.location.search).get('testId');
    let selectedAnswer = null;

    // Desabilitar o botão Gabarito inicialmente
    gabaritoButton.disabled = true;
    gabaritoButton.style.opacity = "0.5";
    gabaritoButton.style.cursor = "not-allowed";

    const attemptId = validarAttemptId(); // Garantir que o Attempt ID esteja carregado
    if (!attemptId) return; // Se não houver Attempt ID, a função não prossegue

    const progresso = JSON.parse(localStorage.getItem('progressoTeste')) || {};
    const progressoAtual = progresso[testId]?.[questionId];

    if (progressoAtual) {
        const respostaSelecionada = progressoAtual.resposta;

        await exibirResultado(respostaSelecionada, questionId);

        const botoes = document.querySelectorAll('.option-button');
        botoes.forEach((botao) => {
            botao.disabled = true;
            botao.style.pointerEvents = 'none';
        });

        submitButton.disabled = true;
        submitButton.style.backgroundColor = '#ccc';
        submitButton.style.color = '#999';

        gabaritoButton.disabled = false; // Habilitar o botão Gabarito
        gabaritoButton.style.opacity = "1";
        gabaritoButton.style.cursor = "pointer";
        await configurarGabaritoButton();

        console.log("Questão já respondida. Feedback exibido.");
        return;
    }

    containerRespostas.addEventListener('click', (event) => {
        const target = event.target;

        if (target.classList.contains('option-button')) {
            const opcoes = containerRespostas.querySelectorAll('.option-button');
            const textos = containerRespostas.querySelectorAll('.answer p');

            opcoes.forEach((btn) => {
                btn.style.backgroundColor = '';
                btn.style.color = '';
            });

            textos.forEach((texto) => {
                texto.style.color = '';
            });

            target.style.backgroundColor = 'blue';
            target.style.color = 'white';

            const parent = target.parentNode;
            const textoSelecionado = parent.querySelector('p');
            textoSelecionado.style.color = 'blue';

            submitButton.disabled = false;
            submitButton.style.backgroundColor = '#FF9600';
            submitButton.style.color = 'white';

            selectedAnswer = target.getAttribute('data-option');
            console.log(`Resposta selecionada: ${selectedAnswer}`);
        }
    });

    submitButton.addEventListener('click', async () => {
        if (!selectedAnswer) {
            alert('Selecione uma resposta antes de clicar em "Responder".');
            return;
        }
    
        console.log(`Resposta selecionada: ${selectedAnswer}`);
    
        const questionId = new URLSearchParams(window.location.search).get('questionId');
        const testId = new URLSearchParams(window.location.search).get('testId');
        const attemptId = localStorage.getItem('attemptId');
    
        if (!attemptId || !questionId || !testId) {
            alert('Dados do teste estão incompletos. Tente recarregar a página.');
            console.error('Attempt ID, Test ID ou Question ID não estão definidos.', {
                attemptId,
                testId,
                questionId,
            });
            return;
        }
    
        const respostaMapeada = selectedAnswer.toUpperCase(); // Certifique-se de que é um formato válido (e.g., "A", "B", "C")
        console.log('Dados da requisição:', {
            attempt_id: attemptId,
            questao_id: questionId,
            resposta: respostaMapeada,
        });
    
        try {
            const response = await fetch(`http://localhost:3000/simulados/${testId}/responder`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-KEY': localStorage.getItem('apiKey'),
                },
                body: JSON.stringify({
                    attempt_id: attemptId,
                    questao_id: questionId,
                    resposta: respostaMapeada, // Enviar no formato correto
                }),
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Erro ao enviar a resposta:', errorData);
                alert(`Erro ao enviar a resposta: ${errorData.error || 'Verifique os logs do servidor.'}`);
                return;
            }
    
            const resultado = await response.json();
            console.log('Resposta enviada com sucesso:', resultado);
    
            salvarProgressoLocal(testId, questionId, selectedAnswer, resultado.resposta.correta);
    
            // Exibir feedback visual
            await exibirResultado(selectedAnswer, questionId);
    
            // Desabilitar o botão "Responder"
            submitButton.disabled = true;
            submitButton.style.backgroundColor = '#ccc';
            submitButton.style.color = '#999';
        } catch (erro) {
            console.error('Erro ao enviar a resposta:', erro.message);
            alert('Erro ao salvar a resposta. Por favor, tente novamente.');
        }
    });
                
    
    }




    
configurarSelecaoResposta();


function salvarProgressoLocal(testId, questionId, resposta, correta) {
    let progresso = JSON.parse(localStorage.getItem('progressoTeste')) || {};
    progresso[testId] = progresso[testId] || {};
    progresso[testId][questionId] = { resposta, correta };
    localStorage.setItem('progressoTeste', JSON.stringify(progresso));
    
    console.log(`Progresso salvo no Local Storage:`, progresso);
    alert('Progresso salvo com sucesso!');
}

async function exibirResultado(respostaSelecionada, questaoId) {
    const botoes = document.querySelectorAll('.option-button');

    try {
        const dadosQuestao = await buscarDadosQuestao(questaoId);
        const respostaCorreta = dadosQuestao?.resposta_correta; 

        if (!respostaCorreta) {
            console.error("A resposta correta não foi encontrada nos dados da questão.");
            return;
        }

        botoes.forEach((botao) => {
            const opcao = botao.getAttribute('data-option'); 

            if (opcao && `opcao_${opcao.toLowerCase()}` === respostaCorreta) {
                botao.style.backgroundColor = '#00C851'; 
                botao.style.color = 'white';
            }

            if (opcao && `opcao_${respostaSelecionada?.toLowerCase()}` !== respostaCorreta && opcao === respostaSelecionada) {
                botao.style.backgroundColor = '#FF4444'; 
                botao.style.color = 'white';
            }

            botao.disabled = true;
            botao.style.pointerEvents = 'none';
        });

        console.log(`Resposta correta: ${respostaCorreta}`);
        console.log(`Resposta selecionada: ${respostaSelecionada}`);
    } catch (erro) {
        console.error('Erro ao exibir o resultado:', erro.message);
        alert('Erro ao carregar os detalhes da questão. Tente novamente.');
    }
}

















function salvarProgressoNoBackend(testId) {
    const urlParams = new URLSearchParams(window.location.search);
    const navegacaoInterna = urlParams.get('navegacaoInterna') === 'true';

    if (navegacaoInterna) {
        console.log('Navegação interna, não salvar progresso');
        return;
    }

    const progressoParaSalvar = prepararProgressoParaSalvar(testId);

    fetch(`http://localhost:3000/simulados/${testId}/progresso`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': localStorage.getItem('apiKey'),
        },
        body: JSON.stringify(progressoParaSalvar)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro ao salvar progresso');
        }
        return response.json();
    })
    .then(data => {
        console.log('Progresso salvo no backend:', data);
    })
    .catch(error => {
        console.error('Erro:', error);
    });
}


// async function salvarProgressoNoBanco() {
//     const testId = new URLSearchParams(window.location.search).get('testId');
//     const progresso = JSON.parse(localStorage.getItem('progressoTeste')) || {};

//     if (!progresso[testId]) {
//         console.log("Nenhum progresso encontrado para salvar.");
//         return;
//     }

//     try {
//         const response = await fetch(`http://localhost:3000/simulados/${testId}/progresso`, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'X-API-KEY': localStorage.getItem('apiKey'),
//         },
//             body: JSON.stringify({
//                 test_id: testId,
//                 progresso: progresso[testId],
//             }),
//         });

//         if (!response.ok) {
//             throw new Error("Erro ao salvar o progresso no banco de dados.");
//         }

//         console.log("Progresso salvo no banco de dados com sucesso.");
//     } catch (erro) {
//         console.error("Erro ao salvar progresso no banco de dados:", erro.message);
//     }
// }

// window.addEventListener("beforeunload", (e) => {
//     salvarProgressoNoBanco();
//     e.preventDefault();
// });


// async function carregarProgressoDoBanco() {
//     const testId = new URLSearchParams(window.location.search).get('testId');

//     try {
//         const response = await fetch(`http://localhost:3000/simulados/${testId}/progresso`, {
//             method: 'GET',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'X-API-KEY': localStorage.getItem('apiKey'),
//         },
//         });

//         if (!response.ok) {
//             throw new Error("Erro ao carregar o progresso do banco de dados.");
//         }

//         const progresso = await response.json();

//         // Salvar o progresso no localStorage para sincronizar
//         localStorage.setItem('progressoTeste', JSON.stringify({ [testId]: progresso }));
//         console.log("Progresso carregado do banco de dados:", progresso);

//         // Retomar o teste
//         retomarProgresso(progresso);
//     } catch (erro) {
//         console.error("Erro ao carregar progresso do banco de dados:", erro.message);
//     }
// }

// function retomarProgresso(progresso) {
//     const testId = new URLSearchParams(window.location.search).get('testId');
//     const progressoAtual = progresso[testId];

//     if (!progressoAtual) {
//         console.log("Nenhum progresso para retomar.");
//         return;
//     }

//     Object.keys(progressoAtual).forEach((questionId) => {
//         const resposta = progressoAtual[questionId].resposta;

//         exibirResultado(resposta, questionId);

//         const botoes = document.querySelectorAll('.option-button');
//         botoes.forEach((botao) => {
//             botao.disabled = true;
//             botao.style.pointerEvents = 'none';
//         });
//     });

//     console.log("Progresso retomado com sucesso.");
// }

// window.addEventListener("load", carregarProgressoDoBanco);


function prepararProgressoParaSalvar(testId) {
    const progresso = JSON.parse(localStorage.getItem('progressoTeste')) || {};
    const respostasTest = progresso[testId] || {};
    
    const respostas = Object.entries(respostasTest).map(([questao_id, dados]) => ({
        questao_id,
        resposta: dados.resposta,
        correta: dados.correta
    }));

    return {
        ultimaQuestao: Object.keys(respostasTest).pop(),
        respostas
    };
}


async function carregarProgressoDoBackend(testId) {
    try {
        const response = await fetch(`http://localhost:3000/simulados/${testId}/progresso`, {
            method: 'GET',
            headers: {
                'X-API-KEY': localStorage.getItem('apiKey'),
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar progresso');
        }

        const progresso = await response.json();
        
        // Restaurar progresso no localStorage
        localStorage.setItem('progressoTeste', JSON.stringify({
            [testId]: progresso.respostas.reduce((acc, resposta) => {
                acc[resposta.questao_id] = {
                    resposta: resposta.resposta,
                    correta: resposta.correta
                };
                return acc;
            }, {})
        }));

        // Retornar a última questão para continuar o teste
        return progresso.ultima_questao;
    } catch (error) {
        console.error('Erro ao carregar progresso:', error);
        return null;
    }
}







// const progressoTeste = JSON.parse(localStorage.getItem('progressoTeste')) || {};
// if (Object.keys(progressoTeste).length === totalQuestoes) {
//     await finalizarTeste(testId);
// }


// async function finalizarTeste(testId) {
//     const attemptId = localStorage.getItem('attemptId');
//     const progressoTeste = JSON.parse(localStorage.getItem('progressoTeste')) || {};
//     const respostasCorretas = Object.values(progressoTeste).filter(q => q.correta).length;
//     const respostasIncorretas = Object.values(progressoTeste).filter(q => !q.correta).length;
//     const totalQuestoes = Object.keys(progressoTeste).length;
//     const acerto = ((respostasCorretas / totalQuestoes) * 100).toFixed(2);

//     try {
//         const response = await fetch(`http://localhost:3000/simulados/${testId}/finalizar`, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'X-API-KEY': localStorage.getItem('apiKey'),
//             },
//             body: JSON.stringify({
//                 attempt_id: attemptId,
//                 correctAnswers: respostasCorretas,
//                 totalQuestions: totalQuestoes,
//                 score: respostasCorretas,
//             }),
//         });

//         if (!response.ok) {
//             throw new Error('Erro ao finalizar o teste');
//         }

//         const resultado = await response.json();

//         // Limpar progresso local
//         localStorage.removeItem('progressoTeste');
//         localStorage.removeItem('attemptId');
//         localStorage.removeItem('idsQuestoes');

//         // Exibir resultado
//         exibirResultadoFinal(acerto, respostasCorretas, respostasIncorretas);
//     } catch (error) {
//         console.error('Erro:', error);
//         alert('Erro ao finalizar o teste. Tente novamente.');
//     }
// }

const resultadoContainer = document.getElementById('resultado-final');
    if (resultadoContainer) {
        resultadoContainer.innerHTML = `
            <h2>Resultado do Teste</h2>
            <p>Aproveitamento: ${acerto}%</p>
            <p>Respostas Corretas: ${respostasCorretas}</p>
            <p>Respostas Incorretas: ${respostasIncorretas}</p>
        `;
        resultadoContainer.style.display = 'block';
    } else {
        console.error('Element with ID "resultado-final" not found in the DOM.');
    }