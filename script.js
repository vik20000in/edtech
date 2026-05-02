let data;
let subjectsData = {}; // Cache for loaded subject files
let history = [{ type: 'main_menu' }];
let autoSpeakEnabled = false;
let appVideoFullscreenEnabled = false;
const APP_VERSION = '20260502-quiz20-1';

function withCacheBuster(path) {
    if (!path) return path;
    return path + (path.indexOf('?') === -1 ? '?' : '&') + 'v=' + APP_VERSION;
}

function loadData() {
    fetch(withCacheBuster('data.json'), { cache: 'no-store' })
        .then(response => response.json())
        .then(json => {
            data = json;
            render();
        })
        .catch(error => console.error('Error loading data:', error));
}

// New: Load subject data from its file if not already loaded
function loadSubjectData(subjectName, callback) {
    const subjectMeta = data.subjects.find(s => s.name === subjectName);
    if (!subjectMeta) {
        console.error('Subject not found:', subjectName);
        return;
    }
    if (subjectsData[subjectName]) {
        callback(subjectsData[subjectName]);
        return;
    }
    fetch(withCacheBuster(subjectMeta.file), { cache: 'no-store' })
        .then(response => response.json())
        .then(subjectJson => {
            subjectsData[subjectName] = subjectJson;
            callback(subjectJson);
        })
        .catch(error => console.error('Error loading subject data:', error));
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
    const fullscreenButton = document.getElementById('fullscreen-video-button');
    const currentState = history[history.length - 1];

    exitAppVideoFullscreen();
    content.innerHTML = ''; // Clear previous content
    fullscreenButton.classList.toggle('visible', currentState.type === 'video');

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
        } else if (currentState.type === 'quiz') {
            loadQuiz(currentState.subject, currentState.chapter);
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
    loadSubjectData(subjectName, subjectData => {
        const content = document.getElementById('content');
        content.innerHTML = `<h2>${subjectName}</h2><div class="menu"></div>`;
        const menu = content.querySelector('.menu');
        subjectData.chapters.forEach(chapter => {
            const button = document.createElement('button');
            button.className = 'menu-item';
            button.textContent = chapter.name;
            button.onclick = () => selectChapter(subjectName, chapter.name);
            menu.appendChild(button);
        });
        const firstItem = menu.querySelector('.menu-item');
        if (firstItem) firstItem.focus();
    });
}

function selectChapter(subjectName, chapterName) {
    history.push({ type: 'chapter_menu', subject: subjectName, chapter: chapterName });
    render();
}

function renderChapterMenu(subjectName, chapterName) {
    loadSubjectData(subjectName, subjectData => {
        const content = document.getElementById('content');
        const chapter = subjectData.chapters.find(c => c.name === chapterName);
        content.innerHTML = `<h2>${chapterName}</h2><div class="menu"></div>`;
        const menu = content.querySelector('.menu');

        chapter.lessons.forEach(lesson => {
            const button = document.createElement('button');
            button.className = 'menu-item';
            button.textContent = lesson.title;
            button.onclick = () => selectLesson(subjectName, chapterName, lesson.title);
            menu.appendChild(button);
        });

        if (chapter.qa || chapter.qa_pdf) {
            const qaButton = document.createElement('button');
            qaButton.className = 'menu-item';
            qaButton.textContent = 'Q&A';
            qaButton.onclick = () => selectQA(subjectName, chapterName);
            menu.appendChild(qaButton);
        }
        if (chapter.quiz) {
            const quizButton = document.createElement('button');
            quizButton.className = 'menu-item quiz-menu-item';
            quizButton.textContent = 'Quiz Test';
            quizButton.onclick = () => selectQuiz(subjectName, chapterName);
            menu.appendChild(quizButton);
        }
        const firstItem = menu.querySelector('.menu-item');
        if (firstItem) firstItem.focus();
    });
}

function selectLesson(subjectName, chapterName, lessonTitle) {
    history.push({ type: 'video', subject: subjectName, chapter: chapterName, lesson: lessonTitle });
    render();
}

function selectQA(subjectName, chapterName) {
    loadSubjectData(subjectName, subjectData => {
        const chapter = subjectData.chapters.find(c => c.name === chapterName);

        // Check if chapter has HTML Q&A
        if (chapter.qa && chapter.qa.type === 'html') {
            history.push({ type: 'html', subject: subjectName, chapter: chapterName });
        } 
        // Fallback to PDF
        else if (chapter.qa_pdf) {
            history.push({ type: 'pdf', subject: subjectName, chapter: chapterName });
        }
        render();
    });
}

function selectQuiz(subjectName, chapterName) {
    history.push({ type: 'quiz', subject: subjectName, chapter: chapterName });
    render();
}

function renderVideo(subjectName, chapterName, lessonTitle) {
    loadSubjectData(subjectName, subjectData => {
        const content = document.getElementById('content');
        const chapter = subjectData.chapters.find(c => c.name === chapterName);
        const lesson = chapter.lessons.find(l => l.title === lessonTitle);

        if (lesson.type === 'youtube') {
            content.innerHTML = `
                <section class="video-page">
                    <h2>${lessonTitle}</h2>
                    <p class="video-help">Use the top-right Full Screen button, or scroll down to use YouTube's own full screen option.</p>
                    <div class="video-container" id="active-video-container">
                        <button id="exit-video-fullscreen" class="exit-video-fullscreen" type="button">Exit Full Screen</button>
                        <iframe
                            id="active-video-frame"
                            src="${formatYouTubeUrl(lesson.url)}"
                            title="${lessonTitle}"
                            frameborder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                            allowfullscreen
                            webkitallowfullscreen
                            mozallowfullscreen>
                        </iframe>
                    </div>
                </section>
            `;
        } else if (lesson.type === 'local') {
            content.innerHTML = `
                <section class="video-page">
                    <h2>${lessonTitle}</h2>
                    <div class="video-container" id="active-video-container">
                        <button id="exit-video-fullscreen" class="exit-video-fullscreen" type="button">Exit Full Screen</button>
                        <video id="active-video-frame" controls><source src="${lesson.path}" type="video/mp4">Your browser does not support the video tag.</video>
                    </div>
                </section>
            `;
        }

        const exitButton = document.getElementById('exit-video-fullscreen');
        if (exitButton) {
            exitButton.addEventListener('click', exitAppVideoFullscreen);
        }
    });
}

function openVideoFullscreen() {
    const videoContainer = document.getElementById('active-video-container');
    const target = videoContainer;

    if (!target) return;

    if (isNativeFullscreenActive()) {
        exitNativeFullscreen();
        return;
    }

    if (appVideoFullscreenEnabled) {
        exitAppVideoFullscreen();
        return;
    }

    const requestFullscreen = target.requestFullscreen ||
        target.webkitRequestFullscreen ||
        target.mozRequestFullScreen ||
        target.msRequestFullscreen;

    if (requestFullscreen) {
        try {
            const fullscreenResult = requestFullscreen.call(target);
            if (fullscreenResult && typeof fullscreenResult.catch === 'function') {
                fullscreenResult.catch(enterAppVideoFullscreen);
            }
            setTimeout(function () {
                if (!isNativeFullscreenActive()) {
                    enterAppVideoFullscreen();
                }
            }, 600);
        } catch (error) {
            enterAppVideoFullscreen();
        }
    } else {
        enterAppVideoFullscreen();
    }
}

function enterAppVideoFullscreen() {
    const videoContainer = document.getElementById('active-video-container');
    const fullscreenButton = document.getElementById('fullscreen-video-button');
    const exitButton = document.getElementById('exit-video-fullscreen');

    if (!videoContainer) return;

    appVideoFullscreenEnabled = true;
    document.body.classList.add('video-fullscreen-mode');
    videoContainer.classList.add('fullscreen-fallback');
    if (fullscreenButton) fullscreenButton.textContent = 'Exit Full Screen';
    if (exitButton) exitButton.focus();
    videoContainer.scrollIntoView(false);
}

function exitAppVideoFullscreen() {
    const videoContainer = document.getElementById('active-video-container');
    const fullscreenButton = document.getElementById('fullscreen-video-button');

    appVideoFullscreenEnabled = false;
    document.body.classList.remove('video-fullscreen-mode');
    if (videoContainer) videoContainer.classList.remove('fullscreen-fallback');
    if (fullscreenButton) fullscreenButton.textContent = 'Full Screen';
}

function isNativeFullscreenActive() {
    return document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement;
}

function exitNativeFullscreen() {
    const exitFullscreen = document.exitFullscreen ||
        document.webkitExitFullscreen ||
        document.mozCancelFullScreen ||
        document.msExitFullscreen;

    if (exitFullscreen) {
        exitFullscreen.call(document);
    }
}

function onNativeFullscreenChange() {
    const fullscreenButton = document.getElementById('fullscreen-video-button');
    if (fullscreenButton) {
        fullscreenButton.textContent = isNativeFullscreenActive() ? 'Exit Full Screen' : 'Full Screen';
    }
}

function renderPDF(subjectName, chapterName) {
    loadSubjectData(subjectName, subjectData => {
        const content = document.getElementById('content');
        const chapter = subjectData.chapters.find(c => c.name === chapterName);
        content.innerHTML = `<h2>Q&A for ${chapterName}</h2><div class="pdf-container"><embed src="${chapter.qa_pdf}" type="application/pdf"></div>`;
    });
}

async function loadQA(subjectName, chapterName) {
    loadSubjectData(subjectName, async subjectData => {
        const content = document.getElementById('content');
        const chapter = subjectData.chapters.find(c => c.name === chapterName);

        content.innerHTML = `
            <div class="qa-wrapper">
                <div class="qa-header">
                    <h2>${chapterName}</h2>                   
                </div>
                <div class="qa-navigation">
                    <button id="prev-question" disabled>Previous</button>
                    <select id="page-dropdown"></select>
                    <button id="next-question">Next</button>
                    <button id="speak-current" title="Speak Current Q&A">🔊 Speak</button>
                    <button id="toggle-auto-speak" title="Auto Speak Q&A">🔈 Auto Speak: <span id="auto-speak-status">Off</span></button>
                </div>
                <div id="qa-section" class="qa-content"></div>
            </div>
        `;

        try {
            const response = await fetch(withCacheBuster(chapter.qa.path), { cache: 'no-store' });
            if (!response.ok) throw new Error('Failed to load Q&A');
            const html = await response.text();
            const qaContainer = document.querySelector('#qa-section');
            qaContainer.innerHTML = html;
            initializePaging();
        } catch (error) {
            console.error('Error loading Q&A:', error);
            content.innerHTML = `
                <div class="qa-error">
                    <h2>Error Loading Q&A</h2>
                    <p>Failed to load Q&A content for ${chapterName}</p>
                </div>
            `;
        }
    });
}

async function loadQuiz(subjectName, chapterName) {
    loadSubjectData(subjectName, async subjectData => {
        const content = document.getElementById('content');
        const chapter = subjectData.chapters.find(c => c.name === chapterName);

        content.innerHTML = `
            <div class="quiz-wrapper">
                <div class="quiz-header">
                    <h2>${chapterName} - Quiz Test</h2>
                    <p>20 multiple choice questions. Select one answer for each question.</p>
                </div>
                <div id="quiz-section" class="quiz-content">Loading quiz...</div>
            </div>
        `;

        try {
            const response = await fetch(withCacheBuster(chapter.quiz.path), { cache: 'no-store' });
            if (!response.ok) throw new Error('Failed to load quiz');
            const quizData = await response.json();
            initializeQuiz(quizData);
        } catch (error) {
            console.error('Error loading quiz:', error);
            content.innerHTML = `
                <div class="qa-error">
                    <h2>Error Loading Quiz</h2>
                    <p>Failed to load quiz content for ${chapterName}</p>
                </div>
            `;
        }
    });
}

function escapeHTML(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function initializeQuiz(quizData) {
    const quizSection = document.getElementById('quiz-section');
    const questions = quizData.questions || [];
    let currentQuestionIndex = 0;
    const selectedAnswers = new Array(questions.length).fill(null);
    let submitted = false;

    function getScore() {
        return questions.reduce((score, question, index) => {
            return score + (selectedAnswers[index] === question.answer ? 1 : 0);
        }, 0);
    }

    function renderQuizQuestion() {
        const question = questions[currentQuestionIndex];
        const selectedAnswer = selectedAnswers[currentQuestionIndex];
        const optionsHtml = question.options.map((option, index) => {
            let optionClass = 'quiz-option';
            if (submitted && index === question.answer) optionClass += ' correct';
            if (submitted && selectedAnswer === index && selectedAnswer !== question.answer) optionClass += ' incorrect';
            if (!submitted && selectedAnswer === index) optionClass += ' selected';
            return `
                <button class="${optionClass}" data-option-index="${index}" ${submitted ? 'disabled' : ''}>
                    <span class="quiz-option-label">${String.fromCharCode(65 + index)}.</span>
                    ${escapeHTML(option)}
                </button>
            `;
        }).join('');
        const answeredCount = selectedAnswers.filter(answer => answer !== null).length;
        const resultHtml = submitted ? `
            <div class="quiz-result">
                Score: ${getScore()} / ${questions.length}
            </div>
            <div class="quiz-explanation">
                <strong>Explanation:</strong> ${escapeHTML(question.explanation || '')}
            </div>
        ` : '';

        quizSection.innerHTML = `
            <div class="quiz-progress">Question ${currentQuestionIndex + 1} of ${questions.length} | Answered: ${answeredCount}/${questions.length}</div>
            <div class="quiz-question-card">
                <div class="quiz-question-text">${escapeHTML(question.question)}</div>
                <div class="quiz-options">${optionsHtml}</div>
                ${resultHtml}
            </div>
            <div class="quiz-navigation">
                <button id="prev-quiz-question" ${currentQuestionIndex === 0 ? 'disabled' : ''}>Previous</button>
                <button id="next-quiz-question" ${currentQuestionIndex === questions.length - 1 ? 'disabled' : ''}>Next</button>
                <button id="submit-quiz" ${submitted ? 'disabled' : ''}>Submit Test</button>
                <button id="restart-quiz">Restart</button>
            </div>
        `;

        document.querySelectorAll('.quiz-option').forEach(button => {
            button.addEventListener('click', () => {
                selectedAnswers[currentQuestionIndex] = parseInt(button.getAttribute('data-option-index'), 10);
                renderQuizQuestion();
            });
        });

        document.getElementById('prev-quiz-question').addEventListener('click', () => {
            if (currentQuestionIndex > 0) {
                currentQuestionIndex--;
                renderQuizQuestion();
            }
        });

        document.getElementById('next-quiz-question').addEventListener('click', () => {
            if (currentQuestionIndex < questions.length - 1) {
                currentQuestionIndex++;
                renderQuizQuestion();
            }
        });

        document.getElementById('submit-quiz').addEventListener('click', () => {
            submitted = true;
            renderQuizQuestion();
        });

        document.getElementById('restart-quiz').addEventListener('click', () => {
            selectedAnswers.fill(null);
            currentQuestionIndex = 0;
            submitted = false;
            renderQuizQuestion();
        });
    }

    if (!questions.length) {
        quizSection.innerHTML = '<div class="qa-error"><h2>No Quiz Questions Found</h2></div>';
        return;
    }

    renderQuizQuestion();
}

function speakText(text) {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);

    // Try to select an Indian English or Hindi voice
    const voices = window.speechSynthesis.getVoices();
    const indianVoice = voices.find(v =>
        v.lang === 'en-IN' || v.lang === 'hi-IN' ||
        v.name.toLowerCase().includes('india')
    );
    if (indianVoice) {
        utter.voice = indianVoice;
    }

    window.speechSynthesis.speak(utter);
}

function getCurrentQA() {
    const questions = document.querySelectorAll('.qa-item');
    const currentIndex = parseInt(document.getElementById('page-dropdown').value, 10);
    const current = questions[currentIndex];
    if (!current) return '';
    const questionElement = current.querySelector('.question');
    const answerElement = current.querySelector('.answer');
    const q = questionElement ? questionElement.innerText : '';
    const a = answerElement ? answerElement.innerText : '';
    return `${q} ${a}`;
}

function initializePaging() {
    const questions = document.querySelectorAll('.qa-item');
    let currentQuestionIndex = 0;

    const prevButton = document.getElementById('prev-question');
    const nextButton = document.getElementById('next-question');
    const pageDropdown = document.getElementById('page-dropdown');
    const speakCurrentBtn = document.getElementById('speak-current');
    const toggleAutoSpeakBtn = document.getElementById('toggle-auto-speak');
    const autoSpeakStatus = document.getElementById('auto-speak-status');

    // Populate dropdown
    pageDropdown.innerHTML = '';
    questions.forEach((_, idx) => {
        const option = document.createElement('option');
        option.value = idx;
        option.textContent = `Page ${idx + 1} of ${questions.length}`;
        pageDropdown.appendChild(option);
    });

    // Add speak button to each question if not present
    questions.forEach(q => {
        if (!q.querySelector('.speak-this')) {
            const btn = document.createElement('button');
            btn.className = 'speak-this';
            btn.title = 'Speak this Q&A';
            btn.textContent = '🔊';
            btn.addEventListener('click', () => {
                const questionElement = q.querySelector('.question');
                const answerElement = q.querySelector('.answer');
                const qText = questionElement ? questionElement.innerText : '';
                const aText = answerElement ? answerElement.innerText : '';
                speakText(`${qText} ${aText}`);
            });
            q.appendChild(btn);
        }
    });

    function updateQuestionVisibility() {
        questions.forEach((question, index) => {
            question.style.display = index === currentQuestionIndex ? 'block' : 'none';
        });
        prevButton.disabled = currentQuestionIndex === 0;
        nextButton.disabled = currentQuestionIndex === questions.length - 1;
        pageDropdown.value = currentQuestionIndex;

        if (autoSpeakEnabled) {
            setTimeout(() => speakText(getCurrentQA()), 300);
        }
    }

    prevButton.addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            updateQuestionVisibility();
        }
    });

    nextButton.addEventListener('click', () => {
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            updateQuestionVisibility();
        }
    });

    pageDropdown.addEventListener('change', (e) => {
        currentQuestionIndex = parseInt(e.target.value, 10);
        updateQuestionVisibility();
    });

    speakCurrentBtn.addEventListener('click', () => {
        speakText(getCurrentQA());
    });

    toggleAutoSpeakBtn.addEventListener('click', () => {
        autoSpeakEnabled = !autoSpeakEnabled;
        autoSpeakStatus.textContent = autoSpeakEnabled ? 'On' : 'Off';
        if (autoSpeakEnabled) speakText(getCurrentQA());
    });

    updateQuestionVisibility();
}

function formatYouTubeUrl(url) {
    let formattedUrl = url;

    // Handle youtu.be format
    if (url.includes('youtu.be')) {
        const videoId = url.split('youtu.be/')[1].split('?')[0];
        formattedUrl = `https://www.youtube.com/embed/${videoId}`;
    }
    // Handle youtube.com format
    else if (url.includes('youtube.com')) {
        if (url.includes('embed')) {
            formattedUrl = url; // Already in embed format
        } else {
            const videoId = url.split('v=')[1].split('&')[0];
            formattedUrl = `https://www.youtube.com/embed/${videoId}`;
        }
    }

    if (formattedUrl.includes('youtube.com/embed') && !formattedUrl.includes('fs=')) {
        formattedUrl += formattedUrl.includes('?') ? '&fs=1&rel=0' : '?fs=1&rel=0';
    }

    return formattedUrl;
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

document.getElementById('fullscreen-video-button').addEventListener('click', openVideoFullscreen);
document.addEventListener('fullscreenchange', onNativeFullscreenChange);
document.addEventListener('webkitfullscreenchange', onNativeFullscreenChange);
document.addEventListener('mozfullscreenchange', onNativeFullscreenChange);
document.addEventListener('MSFullscreenChange', onNativeFullscreenChange);

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