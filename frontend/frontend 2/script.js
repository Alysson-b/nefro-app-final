function toggleExpand(element) {
    const questionItem = element.parentElement; // Acessa a questão principal
    const expandedContent = questionItem.nextElementSibling; // Seleciona o conteúdo para expandir

    questionItem.classList.toggle('expanded'); // Adiciona a classe 'expanded' para girar a seta

    if (expandedContent.style.maxHeight) {
        expandedContent.style.maxHeight = null;
        expandedContent.style.opacity = 0;
    } else {
        expandedContent.style.maxHeight = expandedContent.scrollHeight + 'px';
        expandedContent.style.opacity = 1;
    }
}

// Função editar texto
document.getElementById('edit-icon').addEventListener('click', function() {
    const nomeTeste = document.getElementById('nome-teste');
    const isEditable = nomeTeste.contentEditable === "true";

    nomeTeste.contentEditable = !isEditable;
    nomeTeste.focus();
    this.textContent = isEditable ? 'edit' : '✔️'; // Troca ícone entre editar e confirmar
});

// Função Pop-up
// const testsButton = document.querySelector('.tests-button');
// const popupQuestion = document.getElementById('popup');

// testsButton.addEventListener('click', () => {
//     popupQuestion.style.display = 'flex'; 
// });

// popupQuestion.addEventListener('click', (e) => {
//     if (e.target === popupQuestion) {
//         popupQuestion.style.display = 'none'; 
//     }
// });

document.getElementById('generateQuestionsBtn').addEventListener('click', function () {
    const tagSelect = document.getElementById('tagSelect');
    const questionCountInput = document.getElementById('questionCount');
    const questionContainer = document.querySelector('.question-list'); // Div onde as questões serão adicionadas

    const selectedTag = tagSelect.options[tagSelect.selectedIndex].text; // Texto da tag selecionada
    const questionCount = parseInt(questionCountInput.value, 10);

    // Verificar se os inputs são válidos
    if (!selectedTag || isNaN(questionCount) || questionCount <= 0) {
        alert('Por favor, selecione uma tag válida e insira um número de questões maior que zero.');
        return;
    }

    // Verificar se a tag já existe na lista
    const existingItem = Array.from(questionContainer.children).find(item => {
        const title = item.querySelector('.question-title');
        return title && title.textContent === selectedTag; // Comparar o título da tag
    });

    if (existingItem) {
        // Atualizar a quantidade de questões se a tag já existir
        const description = existingItem.querySelector('p');
        description.textContent = `${questionCount} questõe${questionCount > 1 ? 's' : ''}`;
    } else {
        // Criar a div para a nova questão se ela ainda não existir
        const questionItem = document.createElement('div');
        questionItem.classList.add('question-item'); // Adiciona a classe para estilização

        const questionData = document.createElement('div');
        questionData.classList.add('question-data');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.classList.add('custom-checkbox');

        const questionInfo = document.createElement('div');
        questionInfo.classList.add('question-info');

        const questionTitle = document.createElement('h3');
        questionTitle.classList.add('question-title');
        questionTitle.textContent = selectedTag;

        const questionDescription = document.createElement('p');
        questionDescription.textContent = `${questionCount} questõe${questionCount > 1 ? 's' : ''}`;

        // Construir os elementos na hierarquia correta
        questionInfo.appendChild(questionTitle);
        questionInfo.appendChild(questionDescription);
        questionData.appendChild(checkbox);
        questionData.appendChild(questionInfo);
        questionItem.appendChild(questionData);

        // Adicionar o novo item ao container
        questionContainer.appendChild(questionItem);
    }
});


// Função para mudar imagem
const editIcon = document.getElementById('edit-icon-img');
const imageUpload = document.getElementById('imageUpload');
const testImage = document.getElementById('testImage');

editIcon.addEventListener('click', function() {
    imageUpload.click(); 
});

imageUpload.addEventListener('change', function(event) {
    const file = event.target.files[0]; 

    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            testImage.src = e.target.result; 
            testImage.style.borderRadius = "10px";
        }

        reader.readAsDataURL(file); 
    } else {
        alert('Por favor, selecione um arquivo de imagem válido.');
    }
});

