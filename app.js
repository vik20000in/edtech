// Global variables
let data;
let state = {
    level: 'subjects',        // Current navigation level
    subjectIndex: null,       // Selected subject index
    chapterIndex: null,       // Selected chapter index
    option: null,             // Selected option (PDF, Video, Quiz)
    quizQuestionIndex: null,  // Current quiz question
    quizAnswers: []           // User's quiz answers
};
let focusedIndex = 0;         // Index of the currently focused item

// Load JSON data
fetch('data.json')
    .then(response => response.json())
    .then(json => {
        data = json;
        showSubjects();
    })
    .catch(error => console.error('Error loading data:', error));

// Display list of subjects
function showSubjects() {
    state.level = 'subjects';
    state.subjectIndex = null;
    state.chapterIndex = null;
    state.option = null;
    focusedIndex = 0;
    const main = document.getElementById('main');
    main.innerHTML = '<h1>Select a Subject</h1>';
    const list = document.createElement('div');
    data.subjects.forEach((subject, index) => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.textContent = subject.name;
        item.dataset.index = index;
        list.appendChild(item);
    });
    main.appendChild(list);
    updateFocus();
}

// Display chapters for a subject
function showChapters(subjectIndex) {
    state.level = 'chapters';
    state.subjectIndex = subjectIndex;
    focusedIndex = 0;
    const main = document.getElementById('main');
    main.innerHTML = `<h1>${data.subjects[subjectIndex].name} - Chapters</h1>`;
    const list = document.createElement('div');
    data.subjects[subjectIndex].chapters.forEach((chapter, index) => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.textContent = chapter.name;
        item.dataset.index = index;
        list.appendChild(item);
    });
    main.appendChild(list);
    addBackButton(() => showSubjects());
    updateFocus();
}

// Display options (PDF, Video, Quiz) for a chapter
function showOptions(subjectIndex, chapterIndex) {
    state.level = 'options';
    state.chapterIndex = chapterIndex;
    focusedIndex = 0;
    const main = document.getElementById('main');
    main.innerHTML = `<h1>${data.subjects[subjectIndex].chapters[chapterIndex].name}</h1>`;
    const options = ['Read PDF', 'Watch Video', 'Take Quiz'];
    const list = document.createElement('div');
    options.forEach((option) => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.textContent = option;
        list.appendChild(item);
    });
    main.appendChild(list);
    addBackButton(() => showChapters(subjectIndex));
    updateFocus();
}

// Display PDF
function showPDF(subjectIndex, chapterIndex) {
    const chapter = data.subjects[subjectIndex].chapters[chapterIndex];
    const main = document.getElementById('main');
    main.innerHTML = `<h1>${chapter.name} - PDF</h1><iframe src="${chapter.pdf_url}" width="100%" height="600px"></iframe>`;
    addBackButton(() => showOptions(subjectIndex, chapterIndex));
}

// Display Video
function showVideo(subjectIndex, chapterIndex) {
    const chapter = data.subjects[subjectIndex].chapters[chapterIndex];
    const main = document.getElementById('main');
    main.innerHTML = `<h1>${chapter.name} - Video</h1><video controls src="${chapter.video_url}" width="80%"></video>`;
    addBackButton(() => showOptions(subjectIndex, chapterIndex));
}

// Start Quiz
function showQuiz(subjectIndex, chapterIndex) {
    state.level = 'quiz';
    state.quizQuestionIndex = 0;
    state.quizAnswers = [];
    showQuizQuestion(subjectIndex, chapterIndex, 0);
}

// Display a quiz question
function showQuizQuestion(subjectIndex, chapterIndex, questionIndex) {
    const chapter = data.subjects[subjectIndex].chapters[chapterIndex];
    const question = chapter.quiz[questionIndex];
    const main = document.getElementById('main');
    main.innerHTML = `<h1>Quiz - Question ${questionIndex + 1}</h1><p>${question.question}</p>`;
    const list = document.createElement('div');
    question.options.forEach((option, index) => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.textContent = option;
        item.dataset.index = index;
        list.appendChild(item);
    });
    main.appendChild(list);
    addBackButton(() => showOptions(subjectIndex, chapterIndex));
    focusedIndex = 0;
    updateFocus();
}

// Display quiz results
function showQuizResult(subjectIndex, chapterIndex) {
    const chapter = data.subjects[subjectIndex].chapters[chapterIndex];
    let score = 0;
    chapter.quiz.forEach((question, index) => {
        if (state.quizAnswers[index] === question.correct_answer) {
            score++;
        }
    });
    const main = document.getElementById('main');
    main.innerHTML = `<h1>Quiz Result</h1><p>You scored ${score} out of ${chapter.quiz.length}</p>`;
    addBackButton(() => showOptions(subjectIndex, chapterIndex));
}

// Update focus highlighting
function updateFocus() {
    const items = document.querySelectorAll('.list-item');
    items.forEach((item, index) => {
        item.classList.toggle('focused', index === focusedIndex);
    });
}

// Add a back button
function addBackButton(onClick) {
    const main = document.getElementById('main');
    const backButton = document.createElement('button');
    backButton.textContent = 'Back';
    backButton.onclick = onClick;
    main.appendChild(backButton);
}

// Handle keyboard navigation
document.addEventListener('keydown', (event) => {
    const items = document.querySelectorAll('.list-item');
    if (!items.length) return;

    if (event.key === 'ArrowDown') {
        focusedIndex = (focusedIndex + 1) % items.length;
        updateFocus();
    } else if (event.key === 'ArrowUp') {
        focusedIndex = (focusedIndex - 1 + items.length) % items.length;
        updateFocus();
    } else if (event.key === 'Enter') {
        if (state.level === 'subjects') {
            state.subjectIndex = parseInt(items[focusedIndex].dataset.index);
            showChapters(state.subjectIndex);
        } else if (state.level === 'chapters') {
            state.chapterIndex = parseInt(items[focusedIndex].dataset.index);
            showOptions(state.subjectIndex, state.chapterIndex);
        } else if (state.level === 'options') {
            const option = items[focusedIndex].textContent;
            if (option === 'Read PDF') {
                showPDF(state.subjectIndex, state.chapterIndex);
            } else if (option === 'Watch Video') {
                showVideo(state.subjectIndex, state.chapterIndex);
            } else if (option === 'Take Quiz') {
                showQuiz(state.subjectIndex, state.chapterIndex);
            }
        } else if (state.level === 'quiz') {
            const selectedOption = parseInt(items[focusedIndex].dataset.index);
            state.quizAnswers.push(selectedOption);
            const chapter = data.subjects[state.subjectIndex].chapters[state.chapterIndex];
            if (state.quizQuestionIndex + 1 < chapter.quiz.length) {
                state.quizQuestionIndex++;
                showQuizQuestion(state.subjectIndex, state.chapterIndex, state.quizQuestionIndex);
            } else {
                showQuizResult(state.subjectIndex, state.chapterIndex);
            }
        }
    }
});