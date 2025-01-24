async function cadastrarUsuario(nome, email, senha) {
    try {
        const response = await fetch('http://localhost:3000/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nome, email, senha })
        });
        const data = await response.json();
        if (data.error) {
            console.error('Erro ao cadastrar:', data.error);
            alert(`Erro ao cadastrar: ${data.error}`);
        } else {
            alert('E-mail de confirmação enviado. Verifique sua caixa de entrada.');
            window.location.href = 'index.html'; 
        }
    } catch (error) {
        console.error('Erro na requisição:', error);
        alert('Erro ao se conectar ao servidor. Verifique sua conexão.');
    }
}

async function loginUsuario(email, senha) {
    try {
        const response = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, senha }),
        });
        const data = await response.json();
        console.log("Resposta do servidor:", data);

        if (data.apiKey && data.userId) {
            localStorage.setItem('apiKey', data.apiKey);
            localStorage.setItem('userId', data.userId); 

            console.log("API Key e User ID armazenados:", data.apiKey, data.userId);

            document.getElementById('inputScreen').style.display = 'none';
            document.querySelector('.container').style.display = 'none';
            document.querySelector('.userHome').style.display = 'flex';

        } else {
            console.error('Erro ao realizar login:', data.message || data.error);
            alert('Erro no login. Verifique suas credenciais.');
        }
    } catch (error) {
        console.error('Erro ao se conectar ao servidor:', error);
        alert('Erro ao se conectar ao servidor.');
    }
}

// PÁGINA "Criar Questão"
async function criarQuestao(modulosSelecionados) {
    const apiKey = localStorage.getItem('apiKey');

    const pergunta = document.getElementById('textQuest').value.trim();
    const opcao_a = document.querySelector('.question input[name="A"]').value.trim();
    const opcao_b = document.querySelector('.question input[name="B"]').value.trim();
    const opcao_c = document.querySelector('.question input[name="C"]').value.trim();
    const opcao_d = document.querySelector('.question input[name="D"]').value.trim();
    const opcao_e = document.querySelector('.question input[name="E"]').value.trim();
    const resposta_correta = obterRespostaCorreta();
    const explicacao = document.querySelector('.explication-text').value.trim();

    const respostasIncorretas = ['opcao_a', 'opcao_b', 'opcao_c', 'opcao_d', 'opcao_e'].filter(
        (opcao) => opcao !== resposta_correta
    );

    if (!pergunta) {
        alert('O campo "Pergunta" é obrigatório.');
        return;
    }
    if (!opcao_a || !opcao_b || !opcao_c || !opcao_d || !opcao_e) {
        alert('Todas as opções de resposta (A, B, C, D, E) devem ser preenchidas.');
        return;
    }
    if (!resposta_correta) {
        alert('Selecione a resposta correta.');
        return;
    }
    if (!modulosSelecionados || modulosSelecionados.length === 0) {
        return;
    }

    const payload = {
        pergunta,
        opcao_a,
        opcao_b,
        opcao_c,
        opcao_d,
        opcao_e,
        resposta_correta,
        respostas_incorretas: respostasIncorretas, 
        explicacao,
        modulos: modulosSelecionados.map((modulo) => modulo.id) 
    };

    try {

        const response = await fetch(`http://localhost:3000/questoes/${modulosSelecionados[0].id}/questoes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao criar questão.');
        }

        const data = await response.json();
        alert('Questão criada com sucesso!');
        document.querySelector('.create-question').style.display = 'none';
        document.querySelector('.userHome').style.display = 'flex';

        console.log('Resposta do servidor:', data);

        document.getElementById('textQuest').value = '';
        document.querySelectorAll('.question input[type="text"]').forEach(input => input.value = '');
        document.querySelector('.explication-text').value = '';
        document.querySelectorAll('.question input[type="checkbox"]').forEach(checkbox => checkbox.checked = false);
        document.querySelector('.categoria').innerHTML = '';
    } catch (error) {
        console.error(error);
        alert(`Erro ao criar questão: ${error.message}`);
    }
}


// PÁGINA "Home" & "Todos os Testes"
const API_BASE_URL = 'http://localhost:3000/simulados';


async function carregarTestes(apiKey) {
    try {
        const response = await fetch(API_BASE_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey
            }
        });
        
        if (response.status === 401) {
            alert('Sessão expirada. Por favor, faça login novamente.');
            window.location.href = '/index.html';
            return null;
        }

        if (!response.ok) {
            throw new Error('Erro ao carregar os dados dos testes');
        }

        const data = await response.json();
        // console.log('Dados recebidos da API:', data); 
        return data;
    } catch (error) {
        console.error('Erro ao carregar testes:', error);
        return null;
    }
}
