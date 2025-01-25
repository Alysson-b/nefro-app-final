document.addEventListener("DOMContentLoaded", function() {

    // BUSCAR MÓDULOS
    async function buscarModulos() {
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
                const modulos = await response.json();
                const selectTag = document.getElementById("tagSelect");
                selectTag.innerHTML = '<option value="">Selecione uma Tag</option>';
                modulos.forEach(modulo => {
                    const option = document.createElement("option");
                    option.value = modulo.id;
                    option.textContent = modulo.nome;
                    selectTag.appendChild(option);
                });
            } else {
                console.error("Erro ao buscar módulos");
            }
        } catch (error) {
            console.error("Erro ao conectar com o servidor:", error);
        }
    }
    
    // GERAR QUESTÕES ALEATÓRIAS
    async function gerarQuestoesAleatorias() {
        const idModulo = document.getElementById("tagSelect")?.value;
        const quantidade = parseInt(document.getElementById("questionCount")?.value);
    
        if (!idModulo || !quantidade) {
            alert("Selecione uma tag e defina a quantidade de questões.");
            return;
        }
    
        try {
            const response = await fetch("http://localhost:3000/questoes/todas", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": localStorage.getItem("apiKey")
                }
            });
    
            if (response.ok) {
                const todasQuestoes = await response.json();
                const questoesFiltradas = todasQuestoes.filter(q => q.id_modulo === idModulo);
    
                if (questoesFiltradas.length === 0) {
                    alert("Nenhuma questão disponível para o módulo selecionado.");
                    return;
                }
    
                const quantidadeAjustada = Math.min(quantidade, questoesFiltradas.length);
    
                const questoesAleatorias = [];
                const indicesUsados = new Set();
    
                while (questoesAleatorias.length < quantidadeAjustada) {
                    const index = Math.floor(Math.random() * questoesFiltradas.length);
                    if (!indicesUsados.has(index)) {
                        indicesUsados.add(index);
                        questoesAleatorias.push(questoesFiltradas[index]);
                    }
                }
    
                atualizarListaQuestoes(questoesAleatorias);
            } else {
                alert("Erro ao buscar questões: Não foi possível listar as questões.");
            }
        } catch (error) {
            alert("Erro ao conectar com o servidor.");
            console.error(error);
        }
    }
    
    // FUNÇÃO PARA EMBARALHAR ARRAY
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    // ATUALIZAR LISTA DE QUESTÕES
    function atualizarListaQuestoes(questoes) {
        const listaQuestoes = document.querySelector(".question-list");
        listaQuestoes.innerHTML = ""; 
    
        if (questoes.length === 0) {
            alert("Nenhuma questão disponível para o módulo selecionado.");
            return;
        }
    
        questoesGeradas = questoes; 
    
        questoes.forEach((questao, index) => {
            const item = document.createElement("div");
            item.classList.add("question-item");
            item.innerHTML = `
                <div class="question-data">
                    <input type="checkbox" class="custom-checkbox" data-question-id="${questao.id}" checked>
                    <div class="question-info">
                        <h3 class="question-title">${index + 1}. ${questao.pergunta}</h3>
                    </div>
                </div>
            `;
            listaQuestoes.appendChild(item);
        });
    }
    
    // SALVAR TESTE
    async function salvarTeste() {
        const apiKey = localStorage.getItem("apiKey");
        const tituloElemento = document.getElementById("nome-teste");
        const descricaoElemento = document.querySelector("textarea");
    
        const titulo = tituloElemento?.innerText?.trim();
        const descricao = descricaoElemento?.value?.trim();
    
        if (!titulo || !descricao) {
            alert("Por favor, preencha todos os campos obrigatórios.");
            return;
        }
    
        const questoesSelecionadas = Array.from(document.querySelectorAll(".custom-checkbox:checked"))
            .map(checkbox => checkbox.dataset.questionId);
    
        if (questoesSelecionadas.length === 0) {
            alert("Nenhuma questão foi selecionada. Por favor, selecione questões antes de salvar o teste.");
            return;
        }
    
        try {
            const testeId = await criarTeste(apiKey, titulo, descricao);
            if (testeId) {
                await salvarQuestoesNoTeste(testeId, questoesSelecionadas);
            }
        } catch (error) {
            console.error("Erro ao salvar o teste:", error);
        }
    }
    
    // CRIAR TESTE
    async function criarTeste(apiKey, titulo, descricao) {
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
                alert("Teste criado com sucesso!");
                return data.id || data[0]?.id;
            } else {
                const errorData = await response.json();
                alert("Erro ao criar teste: " + errorData.error);
                return null;
            }
        } catch (error) {
            alert("Erro ao conectar com o servidor.");
            return null;
        }
    }
    
    // LISTA TEMPORÁRIA DE QUESTÕES GERADAS
    let questoesGeradas = [];
    
    // SALVAR QUESTÕES NO TESTE
    async function salvarQuestoesNoTeste(testId, questoesSelecionadas) {
        try {
            const payload = { questoes: questoesSelecionadas };
    
            const response = await fetch(`http://localhost:3000/simulados/${testId}/questoes`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": localStorage.getItem("apiKey")
                },
                body: JSON.stringify(payload)
            });
    
            if (response.ok) {
                alert("Questões adicionadas ao teste com sucesso!");
            } else {
                const errorData = await response.json();
                alert(`Erro ao salvar questões no teste: ${errorData.error}`);
            }
        } catch (error) {
            alert("Erro ao conectar com o servidor.");
        }
    }
    
    // EVENTOS
    document.querySelector(".save-button")?.addEventListener("click", salvarTeste);
    document.getElementById("generateQuestionsBtn")?.addEventListener("click", gerarQuestoesAleatorias);
    
    // INICIALIZAR
    buscarModulos();
    
    });
    