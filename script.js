let data;
let history = [{ type: 'main_menu' }];

function loadData() {
    fetch('data.json')
        .then(response => response.json())
        .then(json => {
            data = json;
            render();
        })
        .catch(error => console.error('Error loading data:', error));
}

function render() {
    const content = document.getElementById('content');
    const backButton = document.getElementById('back-button');
    const currentState = history[history.length - 1];

    content.innerHTML = ''; // Clear previous content

    if (currentState.type === 'main_menu') {
        backButton.style.display = 'none';
        renderMainMenu();
    } else {
        backButton.style.display = 'block';
        if (currentState.type === 'subject_menu') {
            renderSubjectMenu(currentState.subject);
        } else if (currentState.type === 'chapter_menu') {
            renderChapterMenu(currentState.subject, currentState.chapter);
        } else if (currentState.type === 'video') {
            renderVideo(currentState.subject, currentState.chapter, currentState.lesson);
        } else if (currentState.type === 'pdf') {
            renderPDF(currentState.subject, currentState.chapter);
        }
    }
}

function renderMainMenu() {
    const content = document.getElementById('content');
    content.innerHTML = '<h2>Select a Subject</h2><div class="menu"></div>';
    const menu = content.querySelector('.menu');
    data.subjects.forEach(subject => {
        const button = document.createElement('button');
        button.className = 'menu-item';
        button.textContent = subject.name;
        button.onclick = () => selectSubject(subject.name);
        menu.appendChild(button);
    });
    // Auto-focus the first item
    const firstItem = menu.querySelector('.menu-item');
    if (firstItem) firstItem.focus();
}

function selectSubject(subjectName) {
    history.push({ type: 'subject_menu', subject: subjectName });
    render();
}

function renderSubjectMenu(subjectName) {
    const content = document.getElementById('content');
    const subject = data.subjects.find(s => s.name === subjectName);
    content.innerHTML = `<h2>${subjectName}</h2><div class="menu"></div>`;
    const menu = content.querySelector('.menu');
    subject.chapters.forEach(chapter => {
        const button = document.createElement('button');
        button.className = 'menu-item';
        button.textContent = chapter.name;
        button.onclick = () => selectChapter(subjectName, chapter.name);
        menu.appendChild(button);
    });
    const firstItem = menu.querySelector('.menu-item');
    if (firstItem) firstItem.focus();
}

function selectChapter(subjectName, chapterName) {
    history.push({ type: 'chapter_menu', subject: subjectName, chapter: chapterName });
    render();
}

function renderChapterMenu(subjectName, chapterName) {
    const content = document.getElementById('content');
    const subject = data.subjects.find(s => s.name === subjectName);
    const chapter = subject.chapters.find(c => c.name === chapterName);
    content.innerHTML = `<h2>${chapterName}</h2><div class="menu"></div>`;
    const menu = content.querySelector('.menu');

    chapter.lessons.forEach(lesson => {
        const button = document.createElement('button');
        button.className = 'menu-item';
        button.textContent = lesson.title;
        button.onclick = () => selectLesson(subjectName, chapterName, lesson.title);
        menu.appendChild(button);
    });

    const qaButton = document.createElement('button');
    qaButton.className = 'menu-item';
    qaButton.textContent = 'Q&A';
    qaButton.onclick = () => selectQA(subjectName, chapterName);
    menu.appendChild(qaButton);
    const firstItem = menu.querySelector('.menu-item');
    if (firstItem) firstItem.focus();
}

function selectLesson(subjectName, chapterName, lessonTitle) {
    history.push({ type: 'video', subject: subjectName, chapter: chapterName, lesson: lessonTitle });
    render();
}

function selectQA(subjectName, chapterName) {
    history.push({ type: 'pdf', subject: subjectName, chapter: chapterName });
    render();
}

function renderVideo(subjectName, chapterName, lessonTitle) {
    const content = document.getElementById('content');
    const subject = data.subjects.find(s => s.name === subjectName);
    const chapter = subject.chapters.find(c => c.name === chapterName);
    const lesson = chapter.lessons.find(l => l.title === lessonTitle);

    if (lesson.type === 'youtube') {
        content.innerHTML = `<h2>${lessonTitle}</h2><div class="video-container"><iframe src="${lesson.url}" frameborder="0" allowfullscreen></iframe></div>`;
    } else if (lesson.type === 'local') {
        content.innerHTML = `<h2>${lessonTitle}</h2><div class="video-container"><video controls><source src="${lesson.path}" type="video/mp4">Your browser does not support the video tag.</video></div>`;
    }
}

function renderPDF(subjectName, chapterName) {
    const content = document.getElementById('content');
    const subject = data.subjects.find(s => s.name === subjectName);
    const chapter = subject.chapters.find(c => c.name === chapterName);
    content.innerHTML = `<h2>Q&A for ${chapterName}</h2><div class="pdf-container"><embed src="${chapter.qa_pdf}" type="application/pdf"></div>`;
}

document.getElementById('back-button').addEventListener('click', () => {
    if (history.length > 1) {
        history.pop();
        render();
    }
});

loadData();