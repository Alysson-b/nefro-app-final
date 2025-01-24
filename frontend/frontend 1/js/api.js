    // CHAMANDO FUNÇÕES DE LOGIN & CADASTRO

    document.querySelector('#form-Regist').addEventListener('submit', (e) => {
        e.preventDefault();
        const nome = document.querySelector('#name').value.trim();
        const email = document.querySelector('#Email').value.trim();
        const senha = document.querySelector('#senha').value.trim();
        
        if (nome === '' || email === '' || senha === '') {
            alert('Por favor, preencha todos os campos antes de continuar.');
            return;
        }
        
        cadastrarUsuario(nome, email, senha);
    });
    
    document.querySelector('#form').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.querySelector('#inputEmail').value.trim();
        const senha = document.querySelector('#inputPass').value.trim();
        
        if (email === '' || senha === '') {
            alert('Por favor, preencha seu e-mail e senha.');
            return;
        }
        
        loginUsuario(email, senha);
        showScreen("home")
        console.log('Dados recebidos da API:', simulados);

    });
    
    
        // PÁGINA "Criar Questão"

    function obterRespostaCorreta() {
        const checkbox = document.querySelector('.question input[type="checkbox"]:checked');
        if (checkbox) {
            return `opcao_${checkbox.value.toLowerCase()}`;
        }
        return null; 
    }
    
    document.getElementById('searchModulo').addEventListener('keyup', async (e) => {
        const searchTerm = e.target.value.trim();
        const apiKey = localStorage.getItem('apiKey');
    
        if (searchTerm === '') {
            document.getElementById('moduloSugestoes').innerHTML = ''; // Limpa sugestões
            return;
        }
    
        try {
            const response = await fetch(`http://localhost:3000/modulos/search?search=${searchTerm}`, {
                headers: {
                    'x-api-key': apiKey,
                    'Content-Type': 'application/json'
                }
            });
    
            if (!response.ok) throw new Error('Erro ao buscar módulos.');
    
            const modulos = await response.json();
            const suggestionsContainer = document.getElementById('moduloSugestoes');
            suggestionsContainer.innerHTML = '';
    
            modulos.forEach((modulo) => {
                const li = document.createElement('li');
                li.textContent = modulo.nome;
                li.dataset.id = modulo.id;
                li.addEventListener('click', () => adicionarModulo(modulo));
                suggestionsContainer.appendChild(li);
            });
        } catch (error) {
            console.error(error);
        }
    });
    
    const modulosSelecionados = [];
    

    function adicionarModulo(modulo) {
        if (modulosSelecionados.length >= 3) {
            alert('Você pode selecionar no máximo 3 módulos.');
            return;
        }
    
        if (modulosSelecionados.some((m) => m.id === modulo.id)) {
            alert('Esse módulo já foi selecionado.');
            return;
        }
    
        modulosSelecionados.push(modulo);
    
        const categoriaContainer = document.querySelector('.categoria');
        categoriaContainer.innerHTML = ''; // Limpa categorias fixas (se necessário)
    
        modulosSelecionados.forEach((modulo) => {
            const group = document.createElement('div');
            group.classList.add('group');
            group.innerHTML = `
                <p>${modulo.nome} <span class="remove-modulo" data-id="${modulo.id}"><i class='bx bx-x'></i></span></p>
            `;
            categoriaContainer.appendChild(group);
    
            // Adicionar funcionalidade de remoção
            const removeButton = group.querySelector('.remove-modulo');
            removeButton.addEventListener('click', () => {
                modulosSelecionados.splice(modulosSelecionados.findIndex((m) => m.id === modulo.id), 1);
                group.remove();
            });
        });
    }
    

        // PÁGINAS "Home" & "Todos os testes"
                    

async function carregarTestes(apiKey) {
    try {
        const response = await fetch('http://localhost:3000/simulados', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
            },
        });

        if (!response.ok) {
            console.error(`Erro na requisição: ${response.status}`);
            return null;
        }

        const dados = await response.json();
        console.log('Dados carregados com sucesso:', dados);
        return dados;
    } catch (error) {
        console.error('Erro ao carregar os testes:', error);
        return null;
    }
}

async function initializePage() {
    const apiKey = localStorage.getItem('apiKey');
    if (!apiKey) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const simulados = await carregarTestes(apiKey);
        if (!simulados) {
            console.error('Erro ao carregar os dados dos testes');
            return;
        }

        console.log('Dados recebidos da API:', simulados);

        if (document.querySelector('.userHome')) {
            exibirUltimoTeste(simulados.ultimoTeste, '.homeTests .last-teste');
            exibirTodosOsTestes(simulados.testesDisponiveis, '#testes-disponiveis');
        }

        if (document.querySelector('.all-tests')) {
            exibirMeusTestes(simulados.meusTestes, '#feitos-por-mim .all-histor');
            exibirTodosOsTestes(simulados.testesDisponiveis, '#todos-os-testes .all-histor');
        }
    } catch (error) {
        console.error('Erro ao inicializar a página:', error);
    }
}


function exibirUltimoTeste(teste, containerSelector) {
    const containerUltimoTeste = document.querySelector(containerSelector);
    if (!containerUltimoTeste) {
        console.error(`Container não encontrado para o seletor: ${containerSelector}`);
        return;
    }

    if (teste) {
        const tituloLimitado = limitarTexto(teste.titulo, 12);
        const modulosHTML = limitarModulos(teste.modulos, 3); 

        containerUltimoTeste.innerHTML = `
            <div class="prime-teste">
                <h2>${tituloLimitado || 'Título não disponível'}</h2>
                <p>${teste.descricao || 'Descrição não disponível'}</p>
            </div>
            <div class="image-teste">
                <img src="${teste.imagem_url || 'https://provafacilnaweb.com.br/wp-content/uploads/2020/11/leitor-de-gabarito-de-provas-o-que-e-e-como-funciona-3-2048x1365-1.jpg'}" alt="Imagem do Teste ${teste.titulo}">
            </div>
        `;

        containerUltimoTeste.addEventListener('click', () => {
            window.location.href = `/frontend/frontend 2/testdetails.html?id=${teste.id}`;
        });
    } else {
        containerUltimoTeste.innerHTML = `
            <div class="prime-teste">
                <h2>Nenhum teste recente encontrado</h2>
                <p>Realize um teste para que ele apareça aqui.</p>
            </div>
        `;
    }
}

function exibirTodosOsTestes(testes, containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) {
        console.error('Container não encontrado:', containerSelector);
        return;
    }

    container.innerHTML = ''; 

    if (!testes || testes.length === 0) {
        container.innerHTML = '<p>Nenhum teste disponível no momento.</p>';
        return;
    }

    testes.forEach((teste) => {
        const testeElement = document.createElement('div');
        testeElement.classList.add('boxHome');

        const tituloLimitado = limitarTexto(teste.titulo, 12);
        const modulosHTML = limitarModulos(teste.modulos, 3);

        testeElement.innerHTML = `
            <div class="imgCurso">
                <img src="${teste.imagem_url || 'https://provafacilnaweb.com.br/wp-content/uploads/2020/11/leitor-de-gabarito-de-provas-o-que-e-e-como-funciona-3-2048x1365-1.jpg'}" alt="Imagem do Teste ${teste.titulo}">
            </div>
            <div class="boxHomeTexts">
                <h2>${tituloLimitado}</h2>
                <div class="boxHomePorcetagem">
                    <p>${teste.porcentagemAcerto || '0%'} de acerto</p>
                </div>
                <div class="boxHomeTags">${modulosHTML}</div>
            </div>
            <div class="iconHeart">
                <span><i class="fa-solid fa-heart ${teste.favorite ? 'select' : ''}" data-value="${teste.id}"></i></span>
            </div>
        `;

        testeElement.addEventListener('click', () => {
            window.location.href = `/frontend/frontend 2/testdetails.html?id=${teste.id}`;
        });

        container.appendChild(testeElement);
    });

    console.log(`Testes exibidos em ${containerSelector}`);
}

function exibirMeusTestes(testes, containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) {
        console.error(`Container não encontrado para o seletor: ${containerSelector}`);
        return;
    }

    container.innerHTML = ''; 

    if (!testes || testes.length === 0) {
        container.innerHTML = '<p>Nenhum teste criado por você no momento.</p>';
        return;
    }

    testes.forEach((teste) => {
        const testeElement = document.createElement('div');
        testeElement.classList.add('historicos');

        const tituloLimitado = limitarTexto(teste.titulo, 12);
        const modulosHTML = limitarModulos(teste.modulos, 3);

        testeElement.innerHTML = `
            <div class="imgCurso">
                <img src="${teste.imagem_url || 'https://provafacilnaweb.com.br/wp-content/uploads/2020/11/leitor-de-gabarito-de-provas-o-que-e-e-como-funciona-3-2048x1365-1.jpg'}" alt="Imagem do Teste ${teste.titulo}">
            </div>
            <div class="texts">
                <h2>${tituloLimitado}</h2>
                <div class="porcetagem">
                    <p>${teste.porcentagemAcerto || '0%'} de acerto</p>
                </div>
                <div class="boxHomeTags">${modulosHTML}</div>
            </div>
            <div class="iconHeart">
                <span><i class="fa-solid fa-heart ${teste.favorite ? 'select' : ''}" data-value="${teste.id}"></i></span>
            </div>
        `;

        testeElement.addEventListener('click', () => {
            window.location.href = `/frontend/frontend 2/testdetails.html?id=${teste.id}`;
        });

        container.appendChild(testeElement);
    });
}

function limitarModulos(modulos, limite) {
    if (!modulos || modulos.length === 0) return '<span class="tag">Sem módulos</span>';
    const modulosLimitados = modulos.slice(0, limite);
    const reticencias = modulos.length > limite ? '...' : '';
    return modulosLimitados.map(modulo => `<span class="tag">${modulo}</span>`).join('') + reticencias;
}

function limitarTexto(texto, limite) {
    if (!texto) return '';
    return texto.length > limite ? texto.substring(0, limite) + '...' : texto;
}



function renderStars(rating = 0) {
    let starsHTML = '';
    for (let i = 1; i <= 5; i++) {
        starsHTML += `<span><i class="fa-solid fa-star ${i <= rating ? 'select' : ''}" data-value="${i}"></i></span>`;
    }
    return starsHTML;
}

function aplicarFuncionalidadeEstrelasECoracoes() {

    const starsRating = document.querySelectorAll('.fa-star');
    starsRating.forEach((star) => {
        star.addEventListener('click', function () {
            const ratingContainer = this.closest('.stars');
            const starValue = parseInt(this.getAttribute('data-value'), 10);
            ratingContainer.querySelectorAll('.fa-star').forEach((s, index) => {
                s.classList.toggle('select', index < starValue);
            });
            console.log(`Estrelas selecionadas: ${starValue}`);
        });
    });

    const heartRating = document.querySelectorAll('.fa-heart');
    heartRating.forEach((heart) => {
        heart.addEventListener('click', function () {
            const isFavorited = this.classList.contains('select');
            this.classList.toggle('select'); 
            console.log(`Coração clicado. Favorito: ${!isFavorited}`);
        });
    });
}

    // Termina AQUI  
    
function toggleModal() {
    const modal = document.querySelector('.modalCreate');
    if (modal) {
        modal.classList.toggle('active'); 
    } else {
        console.error("Elemento 'modalCreate' não encontrado.");
    }
}
    
    
document.addEventListener('DOMContentLoaded', () => {
    const creationIcon = document.querySelector('.creationIcon');
    if (creationIcon) {
        creationIcon.addEventListener('click', toggleModal);
    }
    initializePage();
});

async function carregarDesempenhoUsuario(apiKey) {
    try {
        // Fazendo a requisição para a API
        const response = await fetch(`http://localhost:3000/usuarios/desempenho`, {

            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
            },
        });
        

        // Verificando o sucesso da requisição
        if (!response.ok) {
            throw new Error(`Erro ao carregar desempenho do usuário. Status: ${response.status}`);
        }

        // Obtendo os dados da API
        const desempenho = await response.json();
        console.log('Dados de desempenho carregados:', desempenho);

        // Atualizando os elementos HTML com os dados da API
        document.querySelector('.rendimento .porcentagem').textContent = desempenho.rendimento || '0%';
        document.querySelector('.totalDeQuestoes .porcentagem').textContent = `${desempenho.totalQuestions || 0} Questões`;
        document.querySelector('.totalAcertos .porcentagem').textContent = `${desempenho.totalCorrectAnswers || 0} Questões`;
        document.querySelector('.totalErros .porcentagem').textContent = `${desempenho.totalErrors || 0} Questões`;

    } catch (error) {
        console.error('Erro ao carregar desempenho do usuário:', error.message);
        alert('Erro ao carregar o desempenho do usuário. Tente novamente.');
    }
}

// Chamando a função ao carregar a página
document.addEventListener('DOMContentLoaded', async () => {
    const apiKey = localStorage.getItem('apiKey');
    if (!apiKey) {
        console.error('API Key ausente. Usuário não autenticado.');
        return;
    }

    // Carrega o desempenho do usuário ao carregar a página
    await carregarDesempenhoUsuario(apiKey);
});
