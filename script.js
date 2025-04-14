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

function toggleScrollButtons(visible) {
    const scrollUp = document.getElementById('scroll-up');
    const scrollDown = document.getElementById('scroll-down');
    if (visible) {
        scrollUp.classList.add('visible');
        scrollDown.classList.add('visible');
    } else {
        scrollUp.classList.remove('visible');
        scrollDown.classList.remove('visible');
    }
}

function render() {
    const content = document.getElementById('content');
    const backButton = document.getElementById('back-button');
    const currentState = history[history.length - 1];

    content.innerHTML = ''; // Clear previous content

    if (currentState.type === 'main_menu') {
        backButton.style.display = 'none';
        renderMainMenu();
        toggleScrollButtons(false); // Hide scroll buttons
    } else {
        backButton.style.display = 'block';
        if (currentState.type === 'subject_menu') {
            renderSubjectMenu(currentState.subject);
            toggleScrollButtons(false); // Hide scroll buttons
        } else if (currentState.type === 'chapter_menu') {
            renderChapterMenu(currentState.subject, currentState.chapter);
            toggleScrollButtons(false); // Hide scroll buttons
        } else if (currentState.type === 'video') {
            renderVideo(currentState.subject, currentState.chapter, currentState.lesson);
            toggleScrollButtons(false); // Hide scroll buttons
        } else if (currentState.type === 'pdf') {
            renderPDF(currentState.subject, currentState.chapter);
            toggleScrollButtons(false); // Hide scroll buttons
        } else if (currentState.type === 'html') {
            loadQA(currentState.subject, currentState.chapter);
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
    const subject = data.subjects.find(s => s.name === subjectName);
    const chapter = subject.chapters.find(c => c.name === chapterName);

    // Check if chapter has HTML Q&A
    if (chapter.qa && chapter.qa.type === 'html') {
        history.push({ type: 'html', subject: subjectName, chapter: chapterName });
    } 
    // Fallback to PDF
    else if (chapter.qa_pdf) {
        history.push({ type: 'pdf', subject: subjectName, chapter: chapterName });
    }
    render();
}

function renderVideo(subjectName, chapterName, lessonTitle) {
    const content = document.getElementById('content');
    const subject = data.subjects.find(s => s.name === subjectName);
    const chapter = subject.chapters.find(c => c.name === chapterName);
    const lesson = chapter.lessons.find(l => l.title === lessonTitle);

    if (lesson.type === 'youtube') {
        content.innerHTML = `<h2>${lessonTitle}</h2><div class="video-container"><iframe src="${formatYouTubeUrl(lesson.url)}" frameborder="0" allowfullscreen></iframe></div>`;
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

async function loadQA(subjectName, chapterName) {
    try {
        const content = document.getElementById('content');
        const subject = data.subjects.find(s => s.name === subjectName);
        const chapter = subject.chapters.find(c => c.name === chapterName);

        // Create HTML structure with better styling
        content.innerHTML = `
            <div class="qa-wrapper">
                <div class="qa-header">
                    <h2>${chapterName}</h2>
                    <p class="qa-subtitle">Questions and Answers</p>
                </div>
                <div id="qa-section" class="qa-content"></div>
            </div>
        `;

        const response = await fetch(chapter.qa.path);
        if (!response.ok) throw new Error('Failed to load Q&A');
        const html = await response.text();
        
        const qaContainer = document.querySelector('#qa-section');
        qaContainer.innerHTML = html;

        // Show scroll buttons
        toggleScrollButtons(true);
    } catch (error) {
        console.error('Error loading Q&A:', error);
        content.innerHTML = `
            <div class="qa-error">
                <h2>Error Loading Q&A</h2>
                <p>Failed to load Q&A content for ${chapterName}</p>
            </div>
        `;

        // Hide scroll buttons
        toggleScrollButtons(false);
    }
}

function formatYouTubeUrl(url) {
    // Handle youtu.be format
    if (url.includes('youtu.be')) {
        const videoId = url.split('youtu.be/')[1].split('?')[0];
        return `https://www.youtube.com/embed/${videoId}`;
    }
    // Handle youtube.com format
    else if (url.includes('youtube.com')) {
        if (url.includes('embed')) {
            return url; // Already in embed format
        }
        const videoId = url.split('v=')[1].split('&')[0];
        return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
}

// Use this function when loading video URLs
function loadVideo(lesson) {
    const formattedUrl = formatYouTubeUrl(lesson.url);
    // Your existing code to display the video
    const iframe = document.createElement('iframe');
    iframe.src = formattedUrl;
    // ...rest of your video loading code
}

document.getElementById('back-button').addEventListener('click', () => {
    if (history.length > 1) {
        history.pop();
        render();
    }
});

document.getElementById('scroll-up').addEventListener('click', () => {
    const content = document.querySelector('.qa-wrapper');
    if (content) {
        content.scrollBy({ top: -100, behavior: 'smooth' }); // Scroll up by 100px
    }
});

document.getElementById('scroll-down').addEventListener('click', () => {
    const content = document.querySelector('.qa-wrapper');
    if (content) {
        content.scrollBy({ top: 100, behavior: 'smooth' }); // Scroll down by 100px
    }
});

loadData();