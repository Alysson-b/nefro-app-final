import { carregarDetalhesDoTeste, atualizarDesempenho } from './utils.js';


// Adiciona evento ao carregar a página
document.addEventListener('DOMContentLoaded', async () => {
    const apiKey = localStorage.getItem('apiKey');
    const simuladoId = new URLSearchParams(window.location.search).get('id');

    if (!apiKey || !simuladoId) {
        alert('Erro: Informações de autenticação ou ID do teste ausentes.');
        window.location.href = '/login.html';
        return;
    }

    try {
        // Carrega detalhes do teste
        const detalhesTeste = await carregarDetalhesDoTeste(simuladoId, apiKey);

        // Verifica progresso ou inicia nova tentativa
        const progresso = await verificarOuIniciarTentativa(simuladoId, apiKey);

        // Configura o botão "Começar"
        configurarBotaoComecar(simuladoId, progresso?.ultimaQuestao || null);
    } catch (error) {
        console.error('Erro ao inicializar detalhes do teste:', error);
    }
});

// Função para carregar os detalhes do teste
// async function carregarDetalhesDoTeste(simuladoId, apiKey) {
//     try {
//         const response = await fetch(`http://localhost:3000/simulados/${simuladoId}/detalhes`, {
//             method: 'GET',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'x-api-key': apiKey,
//             },
//         });

//         if (!response.ok) {
//             throw new Error(`Erro ao carregar os detalhes do teste. Status: ${response.status}`);
//         }

//         const teste = await response.json();

//         // Log detalhado para depuração
//         console.log('Detalhes do teste carregados:', teste);

//         // Atualizar o cabeçalho com título e porcentagem de acerto
//         const headerTitulo = document.querySelector('header h1');
//         const headerPorcentagem = document.querySelector('header p');
//         if (headerTitulo) {
//             headerTitulo.textContent = teste.titulo || 'Título não disponível';
//         }
//         if (headerPorcentagem) {
//             headerPorcentagem.textContent = `${teste.porcentagemAcerto || '0%'} de acerto`;
//         }

//         // Atualizar criador
//         const creatorInfo = document.querySelector('.creator-info p');
//         if (creatorInfo) {
//             creatorInfo.innerHTML = `<strong>Criado por:</strong> ${teste.criador || 'Desconhecido'}`;
//         }

//         // Atualizar tópicos abordados
//         const topicsInfo = document.querySelector('.topics p');
//         if (topicsInfo) {
//             topicsInfo.textContent = teste.modulos?.join(', ') || 'Nenhum tópico encontrado.';
//         }

//         // Atualizar desempenho
//         atualizarDesempenho(teste.desempenho || {});

//         return teste;
//     } catch (error) {
//         console.error('Erro ao carregar detalhes do teste:', error);
//         alert('Erro ao carregar detalhes do teste. Tente novamente.');
//     }
// }

// function atualizarDesempenho(desempenho) {
//     // Atualizar acerto geral
//     const acertoGeral = document.querySelector('.performance-item:nth-child(1) h3');
//     if (acertoGeral) {
//         acertoGeral.textContent = `${desempenho.porcentagemAcerto || 0}%`;
//     }

//     // Atualizar total de resoluções
//     const totalResolucao = document.querySelector('.performance-item:nth-child(2) h3');
//     if (totalResolucao) {
//         totalResolucao.textContent = `${desempenho.totalResolucao || 0} tentativas`;
//     }

//     // Atualizar minha maior pontuação
//     const minhaMaiorPontuacao = document.querySelector('.performance-item:nth-child(3) h3');
//     if (minhaMaiorPontuacao) {
//         minhaMaiorPontuacao.textContent = `${desempenho.minhaMaiorPontuacao || 0} questões`;
//     }

//     // Atualizar maior pontuação geral
//     const maiorPontuacao = document.querySelector('.performance-item:nth-child(4) h3');
//     if (maiorPontuacao) {
//         maiorPontuacao.textContent = `${desempenho.maiorPontuacao || 0} questões`;
//     }
// }


// Função para verificar progresso ou iniciar nova tentativa
async function verificarOuIniciarTentativa(simuladoId, apiKey) {
    try {
        const response = await fetch(`http://localhost:3000/simulados/${simuladoId}/progresso`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
            },
        });

        if (response.ok) {
            const progresso = await response.json();
            console.log('Progresso encontrado:', progresso);
            return progresso;
        } else if (response.status === 404) {
            const novaTentativa = await iniciarNovaTentativa(simuladoId, apiKey);
            console.log('Nova tentativa iniciada:', novaTentativa);
            return novaTentativa;
        } else {
            throw new Error('Erro ao verificar ou iniciar tentativa.');
        }
    } catch (error) {
        console.error('Erro ao verificar ou iniciar tentativa:', error);
    }
}

// Função para iniciar uma nova tentativa
async function iniciarNovaTentativa(simuladoId, apiKey) {
    try {
        const response = await fetch(`http://localhost:3000/simulados/${simuladoId}/iniciar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
            },
        });

        if (!response.ok) {
            throw new Error(`Erro ao iniciar nova tentativa. Status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Erro ao iniciar nova tentativa:', error);
    }
}

// Função para configurar o botão "Começar"
function configurarBotaoComecar(simuladoId, ultimaQuestaoId) {
    const startButton = document.querySelector('.start-button');
    if (startButton) {
        startButton.addEventListener('click', () => {
            const destino = ultimaQuestaoId
                ? `questao.html?id=${simuladoId}&questao=${ultimaQuestaoId}`
                : `questao.html?id=${simuladoId}`;
            window.location.href = destino;
        });
    }
}
