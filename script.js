let data;
let currentLevel = 'subjects';
let currentSubject, currentChapter;
const subjectList = document.getElementById('subject-list');
const chapterList = document.getElementById('chapter-list');
const backBtn = document.getElementById('back-btn');

fetch('data.json')
    .then(response => response.json())
    .then(jsonData => {
        data = jsonData;
        displaySubjects();
    })
    .catch(error => console.error('Error fetching data:', error));

    function displaySubjects() {
        subjectList.innerHTML = '';
        backBtn.classList.add('hidden');
        data.subjects.forEach((subject, index) => {
            const button = document.createElement('button');
            button.textContent = subject.name;
            button.addEventListener('click', () => displayChapters(index));
            subjectList.appendChild(button);
        });
    }

    function displayChapters(subjectIndex) {
        chapterList.innerHTML = '';
        subjectList.classList.add('hidden'); // Now works because subjectList is global
        chapterList.classList.remove('hidden');
        backBtn.classList.remove('hidden');
        backBtn.querySelector('button').onclick = () => {
            chapterList.classList.add('hidden');
            subjectList.classList.remove('hidden');
            displaySubjects();
        };
        data.subjects[subjectIndex].chapters.forEach((chapter, index) => {
            const button = document.createElement('button');
            button.textContent = chapter.title;
            // Add click handler for chapter options
            chapterList.appendChild(button);
        });
    }


function showOptions(subjectIndex, chapterIndex) {
    currentLevel = 'options';
    currentChapter = chapterIndex;
    const content = document.getElementById('content');
    const options = document.getElementById('options');
    const backBtn = document.getElementById('back-btn');
    chapterList.classList.add('hidden');
    content.classList.remove('hidden');
    options.innerHTML = `
        <button onclick="showPdf()">Read Lesson</button>
        <button onclick="showVideo()">Watch Video</button>
        <button onclick="showQuiz()">Take Quiz</button>
    `;
    backBtn.querySelector('button').onclick = () => {
        content.classList.add('hidden');
        chapterList.classList.remove('hidden');
    };
}

function showPdf() {
    currentLevel = 'content';
    const pdfViewer = document.getElementById('pdf-viewer');
    const pdfFrame = document.getElementById('pdf-frame');
    const backBtn = document.getElementById('back-btn');
    options.classList.add('hidden');
    pdfViewer.classList.remove('hidden');
    pdfFrame.src = data.subjects[currentSubject].chapters[currentChapter].pdf;
    backBtn.querySelector('button').onclick = () => {
        pdfViewer.classList.add('hidden');
        options.classList.remove('hidden');
    };
}

function showVideo() {
    currentLevel = 'content';
    const videoPlayer = document.getElementById('video-player');
    const video = document.getElementById('video');
    const backBtn = document.getElementById('back-btn');
    options.classList.add('hidden');
    videoPlayer.classList.remove('hidden');
    video.src = data.subjects[currentSubject].chapters[currentChapter].video;
    backBtn.querySelector('button').onclick = () => {
        videoPlayer.classList.add('hidden');
        options.classList.remove('hidden');
        video.pause();
    };
}

function showQuiz() {
    currentLevel = 'content';
    const quizDiv = document.getElementById('quiz');
    const backBtn = document.getElementById('back-btn');
    options.classList.add('hidden');
    quizDiv.classList.remove('hidden');
    quizDiv.innerHTML = '';
    const quiz = data.subjects[currentSubject].chapters[currentChapter].quiz;
    quiz.forEach((q, index) => {
        const qDiv = document.createElement('div');
        qDiv.innerHTML = `<p>${q.question}</p>`;
        q.options.forEach(option => {
            qDiv.innerHTML += `
                <label><input type="radio" name="q${index}" value="${option}"> ${option}</label>
            `;
        });
        quizDiv.appendChild(qDiv);
    });
    const submitBtn = document.createElement('button');
    submitBtn.textContent = 'Submit';
    submitBtn.addEventListener('click', checkQuiz);
    quizDiv.appendChild(submitBtn);
    backBtn.querySelector('button').onclick = () => {
        quizDiv.classList.add('hidden');
        options.classList.remove('hidden');
    };
}

function checkQuiz() {
    const quiz = data.subjects[currentSubject].chapters[currentChapter].quiz;
    let score = 0;
    quiz.forEach((q, index) => {
        const selected = document.querySelector(`input[name="q${index}"]:checked`);
        if (selected && selected.value === q.answer) score++;
    });
    const quizDiv = document.getElementById('quiz');
    quizDiv.innerHTML = `<p>Your Score: ${score}/${quiz.length}</p>`;
    const backBtn = document.createElement('button');
    backBtn.textContent = 'Back to Options';
    backBtn.addEventListener('click', () => {
        quizDiv.classList.add('hidden');
        options.classList.remove('hidden');
    });
    quizDiv.appendChild(backBtn);
}