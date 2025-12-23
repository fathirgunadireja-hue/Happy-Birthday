// Shared JavaScript utilities

// Set active navbar link
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.navbar-menu a').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
});

// Sound helper
function playClickSound() {
    const sound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-select-click-1109.mp3');
    sound.volume = 0.5;
    sound.play().catch(() => {});
}

function playSuccessSound() {
    const sound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3');
    sound.volume = 0.5;
    sound.play().catch(() => {});
}

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Add animation on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animation = 'fadeIn 0.6s ease forwards';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe cards helper
function observeAnimatedElements(root = document) {
    root.querySelectorAll('.card, .gallery-item, .level-card, .message-card, .timeline-content, .stat-card, .stat-box').forEach(el => {
        observer.observe(el);
    });
}

// Initial observe
observeAnimatedElements(document);

// Helper: convert Google Drive 'view' to direct 'download' URL
function normalizeMusicUrl(u) {
    if (!u) return u;
    const m = u.match(/drive\.google\.com\/file\/d\/([^/]+)/);
    return m ? `https://drive.google.com/uc?export=download&id=${m[1]}` : u;
}

// Matikan fallback otomatis yang berputar
function handleAudioError(failedId, musicData, savedMuted) {
    console.warn('Audio gagal untuk lagu:', failedId);
    // Tidak ada fallback otomatis
}

function attemptPlay() {
    // Tidak digunakan lagi
}

// ===== PERSISTENT MUSIC PLAYER =====
function initializeMusicPlayer() {
    const musicData = {
        1: 'music/Cristina Perri - AThousandYears.mp3',
        2: 'music/Give Me Your Forever.mp3',
        3: 'music/you.mp3'
    };

    // Buat audio player
    if (!window.globalAudioPlayer) {
        window.globalAudioPlayer = new Audio();
        window.globalAudioPlayer.volume = 0.5;
        window.globalAudioPlayer.preload = 'auto';
        // Hapus pengaturan crossOrigin untuk sumber lokal
    }

    // Pastikan selectedSong valid, fallback ke "1"
    let songId = localStorage.getItem('selectedSong') || '1';
    if (!musicData[songId]) songId = '1';
    localStorage.setItem('selectedSong', songId);

    const savedMuted = localStorage.getItem('musicMuted');
    const savedCurrentTime = localStorage.getItem('musicCurrentTime');
    const savedUrl = localStorage.getItem('musicUrl');
    // Sinkronkan status mute dengan yang tersimpan
    window.globalAudioPlayer.muted = savedMuted === 'true';

    // Set sumber sederhana ke file lokal
    const url = musicData[songId];
    // Encode untuk keamanan path (spasi, karakter khusus) saat dihosting
    const encodedUrl = url ? encodeURI(url) : url;
    if (encodedUrl && (savedUrl !== encodedUrl)) {
        window.globalAudioPlayer.src = encodedUrl;
        window.globalAudioPlayer.load();
        localStorage.setItem('musicUrl', encodedUrl);

        if (savedCurrentTime && savedUrl === encodedUrl) {
            window.globalAudioPlayer.currentTime = parseFloat(savedCurrentTime);
        } else {
            window.globalAudioPlayer.currentTime = 0;
            localStorage.removeItem('musicCurrentTime');
        }

        window.globalAudioPlayer.addEventListener('canplay', () => {
            if (window.globalAudioPlayer && window.globalAudioPlayer.muted !== true) {
                window.globalAudioPlayer.play().catch(() => {});
            }
        }, { once: true });
    }

    updateMusicButtonsUI();
}

// Ubah lagu saat tombol .music-btn diklik
document.addEventListener('click', (e) => {
    const btn = e.target.closest('.music-btn');
    if (!btn || !btn.dataset.song) return;
    playClickSound();
    localStorage.setItem('selectedSong', btn.dataset.song);
    initializeMusicPlayer();
    updateMusicButtonsUI();
});

function updateMusicButtonsUI() {
    const musicBtns = document.querySelectorAll('.music-btn');
    const currentSong = localStorage.getItem('selectedSong');
    
    musicBtns.forEach(btn => {
        if (btn.dataset.song === currentSong) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// Bind UI controls for music (mute, progress, time)
function bindMusicUI() {
    if (window.__musicUIBound) return;
    window.__musicUIBound = true;

    const muteBtn = document.getElementById('muteBtn');
    const progressBar = document.getElementById('progressBar');
    const musicTime = document.getElementById('musicTime');
    const musicProgress = document.querySelector('.music-progress');

    function updateMuteIcon() {
        const isMuted = localStorage.getItem('musicMuted') === 'true';
        if (muteBtn) muteBtn.innerHTML = isMuted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
        if (window.globalAudioPlayer) window.globalAudioPlayer.muted = isMuted;
    }

    if (muteBtn) {
        muteBtn.addEventListener('click', function() {
            const isMuted = localStorage.getItem('musicMuted') === 'true';
            localStorage.setItem('musicMuted', (!isMuted).toString());
            updateMuteIcon();
            if (window.globalAudioPlayer && isMuted) {
                // was muted -> now unmuted
                window.globalAudioPlayer.play().catch(() => {});
            }
        });
        updateMuteIcon();
    }

    if (window.globalAudioPlayer) {
        window.globalAudioPlayer.addEventListener('timeupdate', function() {
            if (!progressBar || !musicTime) return;
            if (this.duration) {
                const percent = (this.currentTime / this.duration) * 100;
                progressBar.style.width = percent + '%';
                const minutes = Math.floor(this.currentTime / 60);
                const seconds = Math.floor(this.currentTime % 60);
                musicTime.textContent = minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
            }
        });
    }

    if (musicProgress) {
        musicProgress.addEventListener('click', function(e) {
            if (window.globalAudioPlayer && window.globalAudioPlayer.duration) {
                const rect = this.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                window.globalAudioPlayer.currentTime = percent * window.globalAudioPlayer.duration;
            }
        });
    }
}

// Save music position every second
setInterval(() => {
    if (window.globalAudioPlayer && window.globalAudioPlayer.src) {
        localStorage.setItem('musicCurrentTime', window.globalAudioPlayer.currentTime);
    }
}, 1000);

// Initialize music player on DOM ready
document.addEventListener('DOMContentLoaded', function() {
    initializeMusicPlayer();
    bindMusicUI();
});

// ===== Simple SPA Loader (keeps audio alive) =====
(function setupSPA(){
    const spaView = document.getElementById('spaView');
    const home = document.querySelector('.homepage-container');
    if (!spaView || !home) return; // aktif hanya di index.html

    // Data untuk halaman yang dapat dimuat dinamis
    const pageScripts = {
        'gallery.html': initGalleryPage,
        'messages.html': initMessagesPage,
        'game.html': initGamePage,
        'timeline.html': initTimelinePage
    };

    async function navigateTo(url){
        try {
            const res = await fetch(url, { cache: 'no-store' });
            if (!res.ok) throw new Error('HTTP '+res.status);
            const html = await res.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // Ambil konten utama: prioritas .container jika ada
            const body = doc.body;
            const main = doc.querySelector('.container') || body;

            // Buang elemen yang dobel/tidak perlu di shell
            main.querySelectorAll('.music-player, nav.navbar, footer, script').forEach(n => n.remove());

            spaView.innerHTML = '';
            // Pindahkan anak-anak utama ke spaView
            Array.from(main.children).forEach(ch => spaView.appendChild(ch));

            // Tampilkan SPA, sembunyikan home
            home.style.display = 'none';
            spaView.style.display = '';

            // Observe animasi untuk konten baru
            observeAnimatedElements(spaView);
            bindMusicUI();

            // Jalankan script halaman jika ada
            const initFunc = pageScripts[url];
            if (initFunc && typeof initFunc === 'function') {
                setTimeout(() => initFunc(), 100); // delay kecil agar DOM siap
            }

            // Push state agar tombol back berfungsi
            history.pushState({ spa: true, url }, '', '#'+url);
        } catch (err) {
            console.warn('SPA load gagal, fallback ke navigasi normal:', err);
            window.location.href = url; // fallback jika fetch gagal (misal file://)
        }
    }

    // Intersep klik pada kartu navigasi (homepage) dan navbar
    document.addEventListener('click', function(e){
        const cardLink = e.target.closest('a.nav-card') || e.target.closest('nav a[href]');
        if (!cardLink) return;
        let href = cardLink.getAttribute('href') || '';
        
        // Handle hash routing (#/page.html -> page.html, #/home -> home)
        if (href.startsWith('#/')) {
            href = href.substring(2);
            // Handle #/home -> go back to homepage
            if (href === 'home') {
                e.preventDefault();
                spaView.style.display = 'none';
                home.style.display = '';
                history.pushState({}, '', '/');
                return;
            }
        } else if (href.startsWith('#')) {
            return; // Biarkan anchor links normal
        }
        
        if (!href.endsWith('.html')) return;
        e.preventDefault();
        navigateTo(href);
    });

    // Back: jika user bersihkan hash/manually back ke awal
    window.addEventListener('popstate', function(){
        if (!location.hash) {
            spaView.style.display = 'none';
            home.style.display = '';
        }
    });
})();

// ===== PAGE INITIALIZERS =====

function initGalleryPage() {
    const memoryData = [
        {
            id: 1,
            title: "Wisuda Bersama",
            date: "15 Juni 2019",
            emoji: "🎓",
            description: "Hari kelulusan kita yang tak terlupakan. Aku masih ingat bagaimana kebahagiaan di mata kamu saat itu."
        },
        {
            id: 2,
            title: "Fajar di Pantai",
            date: "23 Agustus 2020",
            emoji: "🌅",
            description: "Menonton fajar bersama dengan tangan yang saling bergenggam. Itu adalah momen paling romantis."
        },
        {
            id: 3,
            title: "Perayaan Ulang Tahun Pertama",
            date: "12 Desember 2021",
            emoji: "🎂",
            description: "Kue pertama yang kita rayakan bersama. Setiap lilin yang aku tiup adalah doa untuk kita bisa selamanya bersama."
        },
        {
            id: 4,
            title: "Petualangan ke Bali",
            date: "7 Februari 2022",
            emoji: "✈️",
            description: "Liburan pertama kita ke pulau yang indah. Setiap pantai yang kita kunjungi lebih bermakna karena kamu."
        },
        {
            id: 5,
            title: "Momen Intim Kita",
            date: "14 Februari 2023",
            emoji: "💑",
            description: "Hari Valentine yang penuh dengan cinta dan kehangatan. Kamu adalah rumah bagiku."
        },
        {
            id: 6,
            title: "Pesta Kejutan",
            date: "20 Mei 2023",
            emoji: "🎪",
            description: "Kejutan pesta yang aku rencanakan. Melihat kebahagiaan di wajahmu adalah saat-saat terbaik."
        },
        {
            id: 7,
            title: "Makan Malam Romantis",
            date: "8 Agustus 2023",
            emoji: "🍽️",
            description: "Malam yang penuh dengan percakapan bermakna. Momen-momen sederhana dengan kamu adalah yang terbaik."
        },
        {
            id: 8,
            title: "Konser Musik Bersama",
            date: "16 November 2023",
            emoji: "🎭",
            description: "Merasakan musik yang sama dengan jantung yang berdetak berirama sama."
        },
        {
            id: 9,
            title: "Piknik di Taman Bunga",
            date: "22 Maret 2024",
            emoji: "🌸",
            description: "Dikelilingi oleh bunga-bunga indah, tapi yang paling indah adalah senyummu."
        }
    ];

    const modal = document.getElementById('modal');
    const modalClose = document.querySelector('.modal-close');
    const galleryItems = document.querySelectorAll('.gallery-item');

    if (!modal || !modalClose || galleryItems.length === 0) return;

    galleryItems.forEach(item => {
        item.addEventListener('click', function() {
            const id = parseInt(this.dataset.id);
            const memory = memoryData.find(m => m.id === id);
            if (!memory) return;

            document.getElementById('modalImage').textContent = memory.emoji;
            document.getElementById('modalTitle').textContent = memory.title;
            document.getElementById('modalDate').textContent = memory.date;
            document.getElementById('modalDescription').textContent = memory.description;
            document.getElementById('likeCount').textContent = '0';

            modal.classList.add('active');
        });
    });

    modalClose.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });

    const likeBtn = document.getElementById('likeBtn');
    if (likeBtn) {
        likeBtn.addEventListener('click', function() {
            const count = parseInt(document.getElementById('likeCount').textContent);
            document.getElementById('likeCount').textContent = count + 1;
            this.style.background = 'linear-gradient(to right, var(--pink-secondary), var(--pink-dark))';
        });
    }
}

function initMessagesPage() {
    // Delegasi event untuk pesan sudah ada di shared.js
    console.log('Messages page initialized');
}

function initGamePage() {
    // Game State Management
    const gameState = {
        currentLevel: 1,
        score: 0,
        hearts: 0,
        maxHearts: 20,
        maxScore: 500,
        completedLevels: [1],
        memoryPairsFound: 0,
        quizAnswers: 0,
    };

    const gameData = {
        levels: [
            {
                id: 1,
                title: "Puzzle Kenangan",
                icon: "🧩",
                type: "memory",
                pairs: [
                    { id: 1, emoji: "❤️" },
                    { id: 2, emoji: "🎂" },
                    { id: 3, emoji: "🌟" },
                    { id: 4, emoji: "💖" }
                ]
            },
            {
                id: 2,
                title: "Quiz Cinta",
                icon: "❓",
                type: "quiz",
                questions: [
                    { question: "Warna favoritku?", options: ["Pink", "Biru", "Hijau", "Ungu"], correct: 0 },
                    { question: "Makanan favorit?", options: ["Sushi", "Pizza", "Ice Cream", "Rendang"], correct: 2 },
                    { question: "Dimana kita pertama ketemu?", options: ["Kafe", "Kampus", "Taman", "Konser"], correct: 1 }
                ]
            },
            {
                id: 3,
                title: "Bonus Stage",
                icon: "🎁",
                type: "collect",
                count: 5
            },
            {
                id: 4,
                title: "Pesan Terakhir",
                icon: "💌",
                type: "messages",
                messages: [
                    { title: "Pesan 1", text: "Aku cinta kamu selamanya!" },
                    { title: "Pesan 2", text: "Terima kasih sudah ada untukku!" },
                    { title: "Pesan 3", text: "Selamat Ulang Tahun Sayang! 💖" }
                ]
            }
        ]
    };

    // DOM Elements
    const DOM = {
        levelDisplay: document.getElementById('level'),
        scoreDisplay: document.getElementById('score'),
        heartsDisplay: document.getElementById('hearts'),
        levelProgress: document.getElementById('levelProgress'),
        scoreProgress: document.getElementById('scoreProgress'),
        heartsProgress: document.getElementById('heartsProgress'),
        gameContent: document.getElementById('gameContent'),
        prevBtn: document.getElementById('prevBtn'),
        nextBtn: document.getElementById('nextBtn'),
        hintBtn: document.getElementById('hintBtn'),
        popup: document.getElementById('popup'),
        popupIcon: document.getElementById('popupIcon'),
        popupTitle: document.getElementById('popupTitle'),
        popupText: document.getElementById('popupText'),
        popupBtn: document.getElementById('popupBtn'),
        clickSound: document.getElementById('clickSound'),
        successSound: document.getElementById('successSound')
    };

    function updateStats() {
        if (!DOM.levelDisplay) return;
        DOM.levelDisplay.textContent = gameState.currentLevel;
        DOM.scoreDisplay.textContent = gameState.score;
        DOM.heartsDisplay.textContent = gameState.hearts;
        
        DOM.levelProgress.style.width = `${(gameState.currentLevel / 4) * 100}%`;
        DOM.scoreProgress.style.width = `${Math.min((gameState.score / gameState.maxScore) * 100, 100)}%`;
        DOM.heartsProgress.style.width = `${Math.min((gameState.hearts / gameState.maxHearts) * 100, 100)}%`;
        
        document.querySelectorAll('.level-card').forEach(card => {
            const level = parseInt(card.dataset.level);
            card.classList.remove('active', 'completed', 'locked');
            
            if (gameState.completedLevels.includes(level)) {
                card.classList.add('completed');
            } else if (level === gameState.currentLevel) {
                card.classList.add('active');
            } else {
                card.classList.add('locked');
            }
        });
        
        if (DOM.prevBtn) DOM.prevBtn.disabled = gameState.currentLevel === 1;
        if (DOM.nextBtn) DOM.nextBtn.disabled = !gameState.completedLevels.includes(gameState.currentLevel) || gameState.currentLevel === 4;
    }

    function addScore(points) {
        gameState.score += points;
        if (gameState.score > gameState.maxScore) gameState.score = gameState.maxScore;
        gameState.hearts++;
        if (gameState.hearts > gameState.maxHearts) gameState.hearts = gameState.maxHearts;
        updateStats();
        playGameSound('success');
    }

    function playGameSound(soundName) {
        try {
            if (soundName === 'click') {
                if (DOM.clickSound) {
                    DOM.clickSound.currentTime = 0;
                    DOM.clickSound.play().catch(() => {});
                }
            } else if (soundName === 'success') {
                if (DOM.successSound) {
                    DOM.successSound.currentTime = 0;
                    DOM.successSound.play().catch(() => {});
                }
            }
        } catch (e) {
            console.log("Sound error");
        }
    }

    function showPopup(icon, title, text) {
        if (!DOM.popup) return;
        DOM.popupIcon.textContent = icon;
        DOM.popupTitle.textContent = title;
        DOM.popupText.textContent = text;
        DOM.popup.classList.add('active');
        playGameSound('success');
    }

    function showWarning(title, text) {
        if (!DOM.popup) return;
        DOM.popupIcon.textContent = '⚠️';
        DOM.popupTitle.textContent = title;
        DOM.popupText.textContent = text;
        DOM.popup.classList.add('active');
        playGameSound('click');
    }

    function loadLevel(levelId) {
        const level = gameData.levels.find(l => l.id === levelId);
        if (!level) return;
        
        gameState.currentLevel = levelId;
        updateStats();
        
        let content = '';
        
        switch(level.type) {
            case 'memory':
                content = `
                    <h2 class="content-title">${level.title} 🧩</h2>
                    <p style="text-align: center; margin-bottom: 30px;">Temukan pasangan emoji! ${gameState.memoryPairsFound}/4</p>
                    <div class="memory-game" id="memoryGame">
                        ${[...level.pairs, ...level.pairs]
                            .sort(() => Math.random() - 0.5)
                            .map((pair, index) => `
                                <div class="memory-card" data-id="${pair.id}" data-index="${index}">
                                    <div class="memory-card-front">?</div>
                                    <div class="memory-card-back">${pair.emoji}</div>
                                </div>
                            `).join('')}
                    </div>
                `;
                break;
                
            case 'quiz':
                const currentQuestion = level.questions[gameState.quizAnswers] || level.questions[0];
                content = `
                    <h2 class="content-title">${level.title} ❓</h2>
                    <p style="text-align: center; margin-bottom: 30px;">${gameState.quizAnswers}/${level.questions.length}</p>
                    <div class="quiz-container">
                        <div class="quiz-question">
                            <h3 style="margin-bottom: 15px; color: var(--pink-secondary);">${currentQuestion.question}</h3>
                        </div>
                        <div class="quiz-options" id="quizOptions">
                            ${currentQuestion.options.map((option, index) => `
                                <div class="quiz-option" data-answer="${index}">${option}</div>
                            `).join('')}
                        </div>
                    </div>
                `;
                break;
                
            case 'collect':
                content = `
                    <h2 class="content-title">${level.title} 🎁</h2>
                    <p style="text-align: center; margin-bottom: 30px;">Kumpulkan semua hadiah! ${gameState.collectiblesFound || 0}/${level.count}</p>
                    <div style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap;">
                        ${Array.from({length: level.count}, (_, i) => `
                            <div style="width: 80px; height: 80px; background: linear-gradient(135deg, var(--pink-light), var(--blue-light)); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; cursor: pointer; transition: all 0.3s;" class="collectible-item" data-index="${i}">
                                ${i < (gameState.collectiblesFound || 0) ? '🎁' : '?'}
                            </div>
                        `).join('')}
                    </div>
                `;
                break;
                
            case 'messages':
                content = `
                    <h2 class="content-title">${level.title} 💌</h2>
                    <p style="text-align: center; margin-bottom: 30px;">Buka pesan! ${gameState.messagesOpened || 0}/${level.messages.length}</p>
                    <div style="max-width: 600px; margin: 0 auto;">
                        ${level.messages.map((msg, index) => `
                            <div style="background: var(--pink-light); padding: 20px; margin-bottom: 15px; border-radius: 15px; cursor: pointer; transition: all 0.3s;" class="message-item" data-index="${index}">
                                <h3 style="color: var(--pink-secondary); margin-bottom: 10px;">${msg.title}</h3>
                                <p style="color: var(--text-secondary);">${msg.text}</p>
                            </div>
                        `).join('')}
                    </div>
                `;
                break;
        }
        
        if (DOM.gameContent) {
            DOM.gameContent.innerHTML = content;
            setupLevelInteractions(level);
        }
    }

    function setupLevelInteractions(level) {
        switch(level.type) {
            case 'memory':
                setupMemoryGame();
                break;
            case 'quiz':
                setupQuizGame();
                break;
            case 'collect':
                setupCollectGame();
                break;
            case 'messages':
                setupMessagesGame();
                break;
        }
    }

    function setupMemoryGame() {
        let flippedCards = [];
        let canFlip = true;
        
        document.querySelectorAll('.memory-card').forEach(card => {
            card.addEventListener('click', () => {
                if (!canFlip || card.classList.contains('flipped') || flippedCards.length >= 2) return;
                
                playGameSound('click');
                card.classList.add('flipped');
                flippedCards.push(card);
                
                if (flippedCards.length === 2) {
                    canFlip = false;
                    const id1 = flippedCards[0].dataset.id;
                    const id2 = flippedCards[1].dataset.id;
                    
                    if (id1 === id2) {
                        setTimeout(() => {
                            flippedCards.forEach(c => c.style.visibility = 'hidden');
                            gameState.memoryPairsFound++;
                            addScore(25);
                            
                            if (gameState.memoryPairsFound >= 4) {
                                completeLevel();
                            }
                            
                            flippedCards = [];
                            canFlip = true;
                        }, 500);
                    } else {
                        setTimeout(() => {
                            flippedCards.forEach(c => c.classList.remove('flipped'));
                            flippedCards = [];
                            canFlip = true;
                        }, 1000);
                    }
                }
            });
        });
    }

    function setupQuizGame() {
        document.querySelectorAll('.quiz-option').forEach(option => {
            option.addEventListener('click', function() {
                const answer = parseInt(this.dataset.answer);
                const level = gameData.levels.find(l => l.id === gameState.currentLevel);
                const currentQuestion = level.questions[gameState.quizAnswers];
                
                playGameSound('click');
                
                if (answer === currentQuestion.correct) {
                    this.classList.add('correct');
                    gameState.quizAnswers++;
                    addScore(50);
                    
                    if (gameState.quizAnswers >= level.questions.length) {
                        setTimeout(() => completeLevel(), 1000);
                    } else {
                        setTimeout(() => loadLevel(gameState.currentLevel), 1500);
                    }
                } else {
                    this.classList.add('wrong');
                }
                
                document.querySelectorAll('.quiz-option').forEach(opt => {
                    opt.style.pointerEvents = 'none';
                });
            });
        });
    }

    function setupCollectGame() {
        document.querySelectorAll('.collectible-item').forEach((item, index) => {
            item.addEventListener('click', function() {
                if (this.textContent === '🎁') return;
                
                playGameSound('click');
                this.textContent = '🎁';
                gameState.collectiblesFound = (gameState.collectiblesFound || 0) + 1;
                addScore(30);
                
                const level = gameData.levels.find(l => l.id === gameState.currentLevel);
                if (gameState.collectiblesFound >= level.count) {
                    setTimeout(() => completeLevel(), 500);
                }
            });
        });
    }

    function setupMessagesGame() {
        document.querySelectorAll('.message-item').forEach(item => {
            item.addEventListener('click', function() {
                playGameSound('click');
                this.style.background = 'var(--yellow)';
                gameState.messagesOpened = (gameState.messagesOpened || 0) + 1;
                addScore(40);
                
                const level = gameData.levels.find(l => l.id === gameState.currentLevel);
                if (gameState.messagesOpened >= level.messages.length) {
                    setTimeout(() => completeLevel(), 1000);
                }
            });
        });
    }

    function completeLevel() {
        if (!gameState.completedLevels.includes(gameState.currentLevel)) {
            gameState.completedLevels.push(gameState.currentLevel);
        }
        
        if (gameState.currentLevel === 1) gameState.memoryPairsFound = 0;
        if (gameState.currentLevel === 2) gameState.quizAnswers = 0;
        if (gameState.currentLevel === 3) gameState.collectiblesFound = 0;
        if (gameState.currentLevel === 4) gameState.messagesOpened = 0;
        
        const rewards = [0, 50, 100, 150, 200];
        showPopup("🎉", "Level Selesai!", `Selamat! +${rewards[gameState.currentLevel]} Poin Cinta!`);
        
        if (gameState.completedLevels.length === 4) {
            setTimeout(() => {
                showPopup("🏆", "SELAMAT!", "Kamu menyelesaikan semua level! Cinta kita abadi selamanya! 💖");
            }, 2000);
        }
        
        updateStats();
    }

    // Event Listeners Setup
    if (DOM.prevBtn) {
        DOM.prevBtn.addEventListener('click', () => {
            if (gameState.currentLevel > 1) {
                playGameSound('click');
                loadLevel(gameState.currentLevel - 1);
            }
        });
    }

    if (DOM.nextBtn) {
        DOM.nextBtn.addEventListener('click', () => {
            if (!gameState.completedLevels.includes(gameState.currentLevel)) {
                // Level belum diselesaikan
                const warnings = [
                    { icon: "🚫", title: "Belum Selesai!", text: "Kamu mau kabur? Selesaikan level ini dulu! 😤" },
                    { icon: "😤", title: "Jangan Lari!", text: "Kita belum selesai bersenang-senang! Finish ini level! 💪" },
                    { icon: "⏰", title: "Tunggu Dulu!", text: "Kamu harus selesaikan level " + gameState.currentLevel + " dulu sebelum lanjut! 😠" },
                    { icon: "💔", title: "Sayang Nih!", text: "Jangan skipkan level ini... Aku pengen lihat kamu menang! 🥺" }
                ];
                const warning = warnings[Math.floor(Math.random() * warnings.length)];
                showWarning(warning.title, warning.text);
            } else if (gameState.currentLevel < 4) {
                playGameSound('click');
                loadLevel(gameState.currentLevel + 1);
            }
        });
    }

    if (DOM.hintBtn) {
        DOM.hintBtn.addEventListener('click', () => {
            playGameSound('click');
            const hints = [
                { icon: "💡", title: "Petunjuk", text: "Coba klik lebih cermat!" },
                { icon: "🤔", title: "Hmm...", text: "Jangan menyerah sekarang!" },
                { icon: "💪", title: "Kamu Bisa!", text: "Aku percaya padamu!" },
                { icon: "⏰", title: "Semangat!", text: "Waktu terus berjalan..." },
                { icon: "🎯", title: "Fokus!", text: "Kamu sudah dekat!" }
            ];
            const hint = hints[Math.floor(Math.random() * hints.length)];
            showPopup(hint.icon, hint.title, hint.text);
        });
    }

    if (DOM.popupBtn) {
        DOM.popupBtn.addEventListener('click', () => {
            playGameSound('click');
            if (DOM.popup) DOM.popup.classList.remove('active');
            if (gameState.currentLevel < 4 && gameState.completedLevels.includes(gameState.currentLevel)) {
                loadLevel(gameState.currentLevel + 1);
            }
        });
    }

    if (DOM.popup) {
        DOM.popup.addEventListener('click', (e) => {
            if (e.target === DOM.popup) {
                DOM.popup.classList.remove('active');
            }
        });
    }

    document.querySelectorAll('.level-card').forEach(card => {
        card.addEventListener('click', function() {
            const level = parseInt(this.dataset.level);
            const isLocked = !gameState.completedLevels.includes(level - 1) && level > 1;
            
            if (isLocked) {
                // Level belum unlock - show funny warning
                const warnings = [
                    { icon: "🔐", title: "Wah Wah Wah!", text: "Level ini masih terkunci! Selesaikan level " + (level - 1) + " dulu dong! 😤" },
                    { icon: "🚫", title: "Jangan Curang!", text: "Gak boleh lompat level! Nanti aku marah sama kamu! 😠" },
                    { icon: "⏳", title: "Sabaran Dulu!", text: "Kamu mau ngincar level " + level + "? Selesaikan level " + (level - 1) + " dulu lah! 💔" },
                    { icon: "😤", title: "Tengsin Nih!", text: "Sepertinya kamu coba curang... Level " + (level - 1) + " belum diselesaikan! 😡" },
                    { icon: "🛑", title: "STOP!", text: "Aku tahu kamu ingin cepat, tapi aturannya aturan! Lanjutkan level " + (level - 1) + "! 🤨" },
                    { icon: "💔", title: "Sakit Hati Nih!", text: "Kamu berani skip level? Kamu gak benar-benar ingin hadiah akhirnya ya? 😞" }
                ];
                const warning = warnings[Math.floor(Math.random() * warnings.length)];
                showWarning(warning.title, warning.text);
            } else if (level <= gameState.currentLevel || gameState.completedLevels.includes(level - 1)) {
                playGameSound('click');
                loadLevel(level);
            }
        });
    });

    // Initialize Game
    updateStats();
    loadLevel(1);
    setTimeout(() => {
        showPopup("🎮", "Selamat Datang!", "Selesaikan semua level untuk hadiah spesial! 💖");
    }, 500);
}

function initTimelinePage() {
    // Timeline logic bisa ditambahkan nanti
    console.log('Timeline page initialized');
}

// Delegasi interaksi tombol pesan (like/balas) agar tetap jalan di SPA
document.addEventListener('click', function(e){
    const act = e.target.closest('.message-action-btn');
    if (!act) return;
    playClickSound();
    act.classList.toggle('active');
});

// Unlock audio playback on first user interaction (autoplay policy bypass)
if (!window.__audioUnlockBound) {
    window.__audioUnlockBound = true;
    const unlock = () => {
        try {
            if (window.globalAudioPlayer) {
                // Hanya play jika tidak di-mute oleh pengguna
                if (!window.globalAudioPlayer.muted) {
                    window.globalAudioPlayer.play().catch(() => {});
                }
            }
        } finally {
            window.removeEventListener('pointerdown', unlock);
            window.removeEventListener('keydown', unlock);
            window.removeEventListener('touchstart', unlock);
        }
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true });
}
