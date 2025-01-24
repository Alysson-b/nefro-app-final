// BUSCAR DETALHES DO TESTE
async function buscarDetalhesTeste(testId) {
    const apiKey = localStorage.getItem('apiKey'); 
    if (!apiKey) {
        alert('API Key não encontrada. Por favor, faça login novamente.');
        window.location.href = '/index.html#login';
        return;
    }

    const url = `http://localhost:3000/simulados/${testId}/detalhes`;
    const resposta = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey 
        }
    });

    if (!resposta.ok) {
        throw new Error('Erro ao buscar os detalhes do teste.');
    }

    return await resposta.json();
}

// ATUALIZAR HTML COM OS DADOS DO TESTE
function atualizarHTML(dados) {
    document.querySelector('header h1').textContent = dados.titulo;
    document.querySelector('header p').textContent = `${dados.porcentagemAcerto} de acerto`;
    document.querySelector('.creator-info p').textContent = `Criado por: ${dados.criador}`;

    const topicsElement = document.querySelector('.topics p');
    if (dados.modulos && dados.modulos.length > 0) {
        topicsElement.innerHTML = dados.modulos.map(modulo => `<li>${modulo}</li>`).join('');
    } else {
        topicsElement.textContent = 'Sem módulos disponíveis.';
    }

    const itensDesempenho = document.querySelectorAll('.performance-item h3');
    itensDesempenho[0].textContent = `${dados.porcentagemAcerto}`;
    itensDesempenho[1].textContent = `${dados.totalResolucoes} tentativas`;
    itensDesempenho[2].textContent = `${dados.minhaMaiorPontuacao} Questões`;
    itensDesempenho[3].textContent = `${dados.maiorPontuacao} Questões`;
}


// CONFIGURAR BOTÃO "COMEÇAR"
function configurarBotaoComecar(testId, questoes) {
    const basePath = window.location.pathname.split('/').slice(0, -1).join('/');
    const questaoPath = `${basePath}/questao.html`;

    const primeiraQuestaoId = questoes.length > 0 ? questoes[0] : null;

    if (!primeiraQuestaoId) {
        alert('Nenhuma questão encontrada para este teste.');
        return;
    }

    document.querySelector('.start-button').addEventListener('click', () => {
        window.location.href = `${questaoPath}?testId=${testId}&questionId=${primeiraQuestaoId}`;
    });
}




// INICIALIZAR A PÁGINA
async function inicializarPagina() {
    try {
        const testId = obterTestId();
        if (!testId) {
            alert('Teste não encontrado!');
            window.location.href = '/index.html#userHome';
            return;
        }

        const dadosTeste = await buscarDetalhesTeste(testId);

        // Atualizar HTML e configurar o botão "Começar"
        atualizarHTML(dadosTeste);
        configurarBotaoComecar(testId, dadosTeste.questoes);

        // Salvar IDs das questões no localStorage
        salvarIdsQuestoes(dadosTeste);
    } catch (erro) {
        console.error(erro);
        alert('Erro ao carregar os detalhes do teste.');
    }
}

inicializarPagina();

// OBTER TEST ID
function obterTestId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}






// Salvar IDs das questões no localStorage
function salvarIdsQuestoes(dados) {
    if (dados.questoes && Array.isArray(dados.questoes)) {
        localStorage.setItem('idsQuestoes', JSON.stringify(dados.questoes));
    } else {
        console.error('Nenhuma questão encontrada para o teste.');
    }
}
