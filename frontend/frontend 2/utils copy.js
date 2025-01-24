// Função para carregar os detalhes do teste
export async function carregarDetalhesDoTeste(simuladoId, apiKey) {
    try {
        const response = await fetch(`http://localhost:3000/simulados/${simuladoId}/detalhes`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
            },
        });

        if (!response.ok) {
            throw new Error(`Erro ao carregar os detalhes do teste. Status: ${response.status}`);
        }

        const teste = await response.json();

        // Log detalhado para depuração
        console.log('Detalhes do teste carregados:', teste);

        // Atualizar o cabeçalho com título e porcentagem de acerto
        const headerTitulo = document.querySelector('header h1');
        const headerPorcentagem = document.querySelector('header p');
        if (headerTitulo) {
            headerTitulo.textContent = teste.titulo || 'Título não disponível';
        }
        if (headerPorcentagem) {
            headerPorcentagem.textContent = `${teste.porcentagemAcerto || '0%'} de acerto`;
        }

        // Atualizar criador
        const creatorInfo = document.querySelector('.creator-info p');
        if (creatorInfo) {
            creatorInfo.innerHTML = `<strong>Criado por:</strong> ${teste.criador || 'Desconhecido'}`;
        }

        // Atualizar tópicos abordados
        const topicsInfo = document.querySelector('.topics p');
        if (topicsInfo) {
            topicsInfo.textContent = teste.modulos?.join(', ') || 'Nenhum tópico encontrado.';
        }

        // Verificar se a função atualizarDesempenho existe antes de usá-la
        if (typeof atualizarDesempenho === 'function') {
            atualizarDesempenho(teste.desempenho || {});
        } else {
            console.error('Função atualizarDesempenho não está definida.');
        }

        return teste;
    } catch (error) {
        console.error('Erro ao carregar detalhes do teste:', error);
        alert('Erro ao carregar detalhes do teste. Tente novamente.');
    }
}

export function atualizarDesempenho(desempenho) {
    const acertoGeral = document.querySelector('.performance-item:nth-child(1) h3');
    const totalResolucoes = document.querySelector('.performance-item:nth-child(2) h3');
    const minhaMaiorPontuacao = document.querySelector('.performance-item:nth-child(3) h3');
    const maiorPontuacao = document.querySelector('.performance-item:nth-child(4) h3');

    if (acertoGeral) {
        acertoGeral.textContent = desempenho.acertoGeral || '13%';
    }
    if (totalResolucoes) {
        totalResolucoes.textContent = desempenho.totalResolucoes || '9 tentativas';
    }
    if (minhaMaiorPontuacao) {
        minhaMaiorPontuacao.textContent = desempenho.minhaMaiorPontuacao
            ? `${desempenho.minhaMaiorPontuacao} questões`
            : '8 questões';
    }
    if (maiorPontuacao) {
        maiorPontuacao.textContent = desempenho.maiorPontuacao
            ? `${desempenho.maiorPontuacao} questões`
            : '4 questões';
    }
}
