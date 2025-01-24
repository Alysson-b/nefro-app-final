const questions = {
    questoes: "",
    respostas: ["", "", "", "", ""],
    correta: null,
    explicaçao: "",
    imagem: ""
}

const textArea = document.getElementById('textQuest')
const questionInput = document.querySelectorAll('.input-question input')
const questionSaveBtn = document.querySelector('.saveBtn button')
const explicationText = document.querySelector('.explication-text')
const switchCheck = document.querySelectorAll('.switch input')
const divError = document.getElementById('msgError')


const btnGabarito = document.querySelector('.gab-btn1')
const btnImagen = document.querySelector('.gab-btn2')
const modal = document.querySelector('.modal')
// const overlay = document.querySelector('.overlay')
const uploadImg = document.querySelector('.uploadImg')
const editQuestion = document.querySelector(".edit-questao")
const filterQuestion = document.querySelector('.filter-question')
const divQuestions = document.querySelector('.questions')
const subSection = document.querySelector(".subSection")
const questionContainer = document.querySelector(".questionContainer")

const overlayAdm = document.querySelector('.overlay');


function Questao() {
    questions.questoes = textArea.value
    questionInput.forEach((input, index) => {
        questions.respostas[index] = input.value
    });
    questions.explicaçao = explicationText.value

}

function respostaCorreta() {
    switchCheck.forEach((switch_, index)  => {
        switch_.addEventListener('change', ()=>{
            if(switch_.checked){
                questions.correta= index

                switchCheck.forEach((restSwitch, restIndex) => {
                    if(restIndex !== index) restSwitch.checked = false
                })
            }else{
                questions.correta = null
            }
        })
    })
}

function validQuestion() {
    if(questions.questoes.trim() === ''){
        messageError('Por favor, insira o enuciado da questão.')
        return false
    }
    if(questions.respostas.some( correta => correta.trim() === "")){
        messageError('Preencha todas as opções de respostas.')
        return false
    }
    if(questions.correta === null){
        messageError('Selecione a reposta correta.')
        return false
    }
    return true
}

function messageError(message, isSuccess = false){
    divError.textContent = message;
    divError.style.display = 'block'
    setTimeout(() => {
        divError.style.display = 'none'
        if(!isSuccess) returnToScreen()
    }, 3000)
}

function returnToScreen() {
    editQuestion.style.display = 'flex';
    divQuestions.style.display = 'flex';
    filterQuestion.style.display = 'flex';
    questionContainer.style.display = 'flex';
    subSection.style.display = 'none';
}


questionSaveBtn.addEventListener('click', () =>{
    Questao()
    if(validQuestion()){
        console.log('pergunta salva:', questions)

        messageError('pergunta salva com sucesso')
    }
})

respostaCorreta();

btnGabarito.addEventListener('click', function(event){
    event.preventDefault()

    editQuestion.style.display = 'none'
    divQuestions.style.display = 'none'
    filterQuestion.style.display = 'none'
    questionContainer.style.display = 'none'
    subSection.style.display = 'flex'


})

function togglePopup() {
    const isVisible = modal.style.display === 'flex';
    modal.style.display = isVisible ? 'none' : 'flex';
    overlay.style.display = isVisible ? 'none' : 'block';
}

modal.addEventListener('click', function(event){
    if(event.target === modal || event.target.classList.contains('overlay')) {
        togglePopup()
    }
})


function showLoading() {
    document.getElementById('loadingSpinner').style.display = 'block';
}

function hideLoading() {
    document.getElementById('loadingSpinner').style.display = 'none';
}

function toggleModal() {
    const modal = document.querySelector('.modalCreate');
    modal.classList.toggle('show');
}

document.querySelector('.icon-tests').addEventListener('click', function() {
    document.querySelector('.userHome').style.display = 'none';
    document.querySelector('.all-tests').style.display = 'flex';
});

// REDIRECIONAR PARA NOVO TESTE
document.querySelector('.newTest').addEventListener('click', function() {
    window.location.href = 'frontend/frontend%202/fazer_teste.html';
});
// REDIRECIONAR PARA NOVA QUESTÃO
document.querySelector('.newQuestion').addEventListener('click', function() {

    document.querySelector('.userHome').style.display = 'none';
    document.querySelector('.all-tests').style.display = 'none';

    document.querySelector('.create-question').style.display = 'flex';
});



btnImagen.addEventListener("click", () => {
    // Cria um input do tipo "file" dinamicamente
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*"; // Apenas arquivos de imagem
    fileInput.click(); // Simula o clique para abrir o seletor de arquivos

    // Aguarda o usuário selecionar uma imagem
    fileInput.addEventListener("change", (event) => {
        const file = event.target.files[0]; // Obtém o arquivo selecionado

        if (file) {
            const reader = new FileReader();

            // Converte o arquivo de imagem em base64 para armazenar
            reader.onload = (e) => {
                questions.imagem = e.target.result; // Salva a imagem no objeto `questions`
                alert("Imagem carregada e armazenada com sucesso!");
            };

            reader.readAsDataURL(file); // Lê o arquivo como base64
        }
    });
});



uploadImg.addEventListener("click", () => {
    if (!questions.imagem) {
        alert("Nenhuma imagem foi carregada ainda!");
        return;
    }

    // Limpa o conteúdo anterior do modal
    modal.innerHTML = "";

    // Cria o elemento de imagem e adiciona ao modal
    const imgPreview = document.createElement("img");
    imgPreview.src = questions.imagem; // Usa a imagem armazenada
    imgPreview.alt = "Imagem da questão";
    imgPreview.style.maxWidth = "80%";
    imgPreview.style.margin = "10px auto";
    imgPreview.style.display = "block";

    modal.appendChild(imgPreview);

    // Exibe o modal
    togglePopup();
});
