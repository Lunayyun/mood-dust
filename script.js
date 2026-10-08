(function() {
    'use strict';

    // Elements
    const elements = {
        greetingTime: document.getElementById('greetingTime'),
        dateBadge: document.getElementById('dateBadge'),
        dailyQuote: document.getElementById('dailyQuote'),
        quoteCard: document.querySelector('.quote-card'),
        moodSelector: document.getElementById('moodSelector'),
        selectedMoodSymbol: document.getElementById('selectedMoodSymbol'),
        selectedMoodText: document.getElementById('selectedMoodText'),
        diaryContent: document.getElementById('diaryContent'),
        keywordInput: document.getElementById('keywordInput'),
        generatePoetry: document.getElementById('generatePoetry'),
        poetryResult: document.getElementById('poetryResult'),
        imageDropZone: document.getElementById('imageDropZone'),
        imageInput: document.getElementById('imageInput'),
        imagePreview: document.getElementById('imagePreview'),
        saveDiary: document.getElementById('saveDiary'),
        editAgain: document.getElementById('editAgain'),
        layoutBtn: document.getElementById('layoutBtn'),
        calendarMini: document.getElementById('calendarMini'),
        currentMonthSmall: document.getElementById('currentMonthSmall'),
        prevMonthSmall: document.getElementById('prevMonthSmall'),
        nextMonthSmall: document.getElementById('nextMonthSmall'),
        statusMessage: document.getElementById('statusMessage'),
        fontSwitcher: document.getElementById('fontSwitcher'),
        vibeMixerToggle: document.getElementById('vibeMixerToggle'),
        vibeMixerPanel: document.getElementById('vibeMixerPanel'),
        // Login elements
        loginScreen: document.getElementById('loginScreen'),
        loginForm: document.getElementById('loginForm'),
        loginUsername: document.getElementById('loginUsername'),
        loginPassword: document.getElementById('loginPassword'),
        registerForm: document.getElementById('registerForm'),
        registerUsername: document.getElementById('registerUsername'),
        registerPassword: document.getElementById('registerPassword'),
        registerConfirmPassword: document.getElementById('registerConfirmPassword'),
        showRegisterBtn: document.getElementById('showRegisterBtn'),
        showLoginBtn: document.getElementById('showLoginBtn'),
        appContainer: document.getElementById('appContainer'),
        // Layout studio elements
        layoutStudio: document.getElementById('layoutStudio'),
        layoutStudioClose: document.getElementById('layoutStudioClose'),
        layoutCard: document.getElementById('layoutCard'),
        layoutCardImage: document.getElementById('layoutCardImage'),
        layoutCardDate: document.getElementById('layoutCardDate'),
        layoutCardText: document.getElementById('layoutCardText'),
        layoutCardUser: document.getElementById('layoutCardUser'),
        layoutCardMood: document.getElementById('layoutCardMood'),
        layoutExportBtn: document.getElementById('layoutExportBtn'),
        layoutCardContent: document.getElementById('layoutCardContent'),
        addMoodCardBtn: document.getElementById('addMoodCardBtn'),
        addPoetryCardBtn: document.getElementById('addPoetryCardBtn'),
        fontSizeDecrease: document.getElementById('fontSizeDecrease'),
        fontSizeIncrease: document.getElementById('fontSizeIncrease'),
        fontSizeValue: document.getElementById('fontSizeValue'),
        rainSoundSlider: document.getElementById('rainSoundSlider'),
        moodStatsGrid: document.getElementById('moodStatsGrid'),
    };

    // State
    const state = {
        currentDate: new Date(),
        currentMonth: new Date(),
        selectedDate: new Date(),
        selectedMood: 'meditation',
        selectedFont: 'serif',
        uploadedImages: [],
        diaries: {},
        autoSaveTimer: null,
        isEditing: true,
        currentUser: null,
        layoutTemplate: 'overlay',
        cardImageSize: { width: 400, height: 560 },
        textPositions: {
            date: { x: 0, y: 0 },
            text: { x: 0, y: 0 }
        },
        rainSoundVolume: 0.15,
        rainSoundEnabled: true,
        whiteNoiseVolume: 0.3,
    };

    // Auth keys
    const LOGIN_KEY = 'mood_dust_logged_in';
    const USER_KEY = 'mood_dust_user';
    const USERS_KEY = 'mood_dust_users';

    // Quotes array - 6 inspirational quotes
    const quotes = [
        'Do Not Go Gentle into That Good Night.',
        'Free to sway and thrive.',
        'Things in themselves, myself being myself.',
        'The absurd is the essential concept and the first truth.',
        'Bask to the full and soak up the abundance of the world.',
        'I am rooted, but I flow.'
    ];

    // Mood Mapping - Cyber Zen symbols with icons
    const moodMap = {
        meditation: { symbol: '◈', name: 'Meditation', icon: 'https://lazyman.yixiaai.com/files/494450/1d86cb1d-554b-410c-8880-c259482e13d9.png' },
        isolate: { symbol: '◉', name: 'Isolate', icon: 'https://lazyman.yixiaai.com/files/494450/70fca6f8-435b-4138-bae3-7bd41ea28f8f.png' },
        confident: { symbol: '✦', name: 'I got it', icon: 'https://api.iconify.design/ic/baseline-wb-sunny.svg?color=%23333333' },
        peaceful: { symbol: '◊', name: 'Peaceful', icon: 'https://lazyman.yixiaai.com/files/494450/8bede4d4-3727-44af-8ced-c94a8c25c7d2.png' },
        reading: { symbol: '◐', name: 'Reading', icon: 'https://lazyman.yixiaai.com/files/494450/5bf62baa-97c6-4678-9f8d-ca1fe4f5271d.png' },
        thinking: { symbol: '◑', name: 'Thinking', icon: 'https://lazyman.yixiaai.com/files/494450/bfaec81e-dff2-463b-8a60-9ab7a31c88b3.png' },
        happy: { symbol: '✧', name: 'Happy', icon: 'https://lazyman.yixiaai.com/files/494450/99a7fad7-87c7-4b35-b47f-c6a24c09c7a6.png' },
        sad: { symbol: '◒', name: 'Sad', icon: 'https://lazyman.yixiaai.com/files/494450/51c2121c-8c5f-4d80-814a-5764ca387807.png' }
    };

    // Font configurations
    const fontConfigs = {
        serif: { class: '', name: 'Serif' },
        sans: { class: 'font-sans', name: 'Sans' },
        mono: { class: 'font-mono', name: 'Mono' }
    };

    // AI Poetry Fragments in English
    const poetryByTheme = {
        "sunset": [
            "The sun dissolves like a golden tablet into the molten sea, and for one suspended hour the world holds its breath between what has been and what will never again be the same."
        ],
        "wind": [
            "The wind moves through the tall grass with the patience of something that has nowhere to go, carrying the scent of rain from counties away, whispering the names of everyone you have ever loved and lost."
        ],
        "love": [
            "Love is not a fire but the long, slow archaeology of two people uncovering each other's buried cities, layer by tender layer, until the past becomes habitable again."
        ],
        "rain": [
            "Rain falls on the roof with the persistence of memory, each drop a small door opening and closing in the dark, while somewhere a river remembers the mountain it once was."
        ],
        "stars": [
            "The stars are not above us but within the deep folds of distance, light that left its source before we had language for longing, arriving now like a letter written to no one in particular."
        ],
        "moon": [
            "The moon hangs in the black oak like a discarded earring, pale and listening, pouring its silver into the creek where frogs rehearse their ancient, unanswered prayers."
        ],
        "flowers": [
            "A single peony opens in the dusk with the gravity of a cathedral door swinging inward, revealing the brief, unbearable architecture of beauty that knows its own expiration."
        ],
        "spring": [
            "Spring arrives not as a season but as a condition of the heart, the green so sudden it seems like a mistake, the lilacs offering their purple testimony to the jury of the air."
        ],
        "autumn": [
            "Autumn strips the trees to their essential loneliness, and the leaves fall with the dignity of small deaths, each one a hand releasing its final hold on the branch of the known world."
        ],
        "winter": [
            "Winter is the mind's long solitude made visible, the snow erasing all distinction between path and field, teaching us finally that the world does not require our footprints to continue."
        ],
        "summer": [
            "Summer is a bright wound in the calendar, the days so heavy with light they bend toward evening like wheat toward the scythe, and the crickets fill the darkness with their dry, incessant rosaries."
        ],
        "sea": [
            "The sea does not belong to the shore but to the dark tonnage of what it conceals, each wave a brief confession that dissolves on the tongue of the beach before it can be fully understood."
        ],
        "mountains": [
            "Mountains are the earth's way of thinking about eternity, their peaks disappearing into cloud like questions too large for the mouth, their silence a kind of answer we are not yet ready to hear."
        ],
        "home": [
            "Home is the place where your shadow finally matches your body, where the floorboards know your weight and the walls have absorbed enough of your voice to speak back in dreams."
        ],
        "dreams": [
            "Dreams are the mind's nocturnal emigration, crossing borders without papers, smuggling the contraband of desire through the customs of sleep into a country that vanishes at dawn."
        ],
        "time": [
            "Time is not a river but a room we keep entering and leaving, full of furniture we did not choose, where the clocks measure not duration but the distance between who we were and who we are becoming."
        ],
        "memories": [
            "Memory is the only garden that grows in two directions at once, its roots reaching down into the dark soil of what happened while its branches flower with the perfume of what we needed to believe."
        ],
        "future": [
            "The future is a door that opens only from the inside, yet we spend our lives knocking, not understanding that the handle has been in our hand all along, cold and trembling."
        ],
        "hope": [
            "Hope is the small, persistent weed that cracks the pavement of despair, not because it is stronger than stone but because it has nowhere else to grow and refuses, against all evidence, to die."
        ],
        "poem": [
            "A poem is a door left slightly ajar in the house of language, inviting the reader to step through into rooms they did not know existed, rooms where silence speaks and shadows have names."
        ],
        "poetry": [
            "Poetry is the art of saying what cannot be said, of turning the lead of everyday speech into the gold of something that lingers in the throat like a half-remembered song."
        ],
        "writing": [
            "Writing is the mind's way of talking to itself in the dark, leaving footprints on the page so that we might find our way back to the thoughts that felt too fragile to hold."
        ],
        "words": [
            "Words are not just signs but seeds; when planted in the soil of silence, they grow into forests of meaning we could never have imagined when we first spoke them."
        ],
        "silence": [
            "Silence is not the absence of sound but the presence of something too vast to be spoken, a space where the world exhales and we finally hear what it has been trying to tell us."
        ],
        "forest": [
            "The forest is a cathedral made of wood and leaf, where sunlight filters through the canopy like scattered prayer, and the trees stand witness to centuries of quiet mysteries."
        ],
        "river": [
            "A river is time made liquid, flowing always forward yet returning to itself, carrying the stories of mountains and meadows to the sea where they dissolve into something larger."
        ],
        "light": [
            "Light is not just illumination but a kind of mercy, revealing the world in all its broken beauty, turning shadows into shapes we can finally name and understand."
        ],
        "shadow": [
            "Shadows are the world's secret language, telling us more about what is there than the light ever can, for they show us the edges where one thing ends and another begins."
        ],
        "fire": [
            "Fire is both destruction and birth, consuming the old to make way for the new, its dance a reminder that even in burning there is a kind of grace."
        ],
        "peace": [
            "Peace is not the absence of conflict but the presence of something deeper, a stillness that resides beneath the surface of all our restless striving, always waiting to be remembered."
        ],
        "joy": [
            "Joy is a sudden light in the heart, a bird that alights on the branch of ordinary days and stays just long enough to remind us why we keep going."
        ],
        "sorrow": [
            "Sorrow is not an enemy but a teacher, showing us the depth of what we can love and lose, and in that loss, the measure of how fully we have lived."
        ],
        "beauty": [
            "Beauty is the world's way of whispering that there is more to life than meets the eye, a fleeting glimpse of something eternal in the midst of what is passing."
        ],
        "night": [
            "Night is not an ending but a beginning, the dark a canvas where stars write their ancient stories and the moon paints the world in silver."
        ],
        "morning": [
            "Morning is the world taking a breath, the light soft and tentative at first, then growing bold as it touches the edges of things and makes them new again."
        ],
        "music": [
            "Music is the sound of the soul speaking in a language older than words, rhythm and melody weaving together to express what the heart cannot say."
        ],
        "art": [
            "Art is the bridge between the seen and the unseen, turning the raw material of experience into something that outlives the artist and speaks to generations yet unborn."
        ],
        "nature": [
            "Nature is the original poem, written in leaves and stone and water, each line a lesson in patience, resilience, and the quiet magic of being alive."
        ]
    };

    // Initialize
    function init() {
        initAuth();
        updateGreeting();
        updateDateBadge();
        initDailyQuote();
        loadDiaries();
        renderCalendarMini();
        renderMoodStats();
        bindEvents();
        initImageUpload();
        loadTodayDiary();
        initFontSwitcher();
        initAutoSave();
        initVibeMixer();
        initLayoutStudio();
        initRainSound();
        initNavigation();
    }

    // ========== NAVIGATION (关闭雨声进入冥想页面) ==========

    function initNavigation() {
        // 点击冥想链接时关闭雨声
        const navMeditation = document.getElementById('navMeditation');
        if (navMeditation) {
            navMeditation.addEventListener('click', (e) => {
                // 关闭雨声
                stopRainSound();
                // 保存雨声状态到 localStorage，让冥想页面知道
                localStorage.setItem('mood_dust_rain_playing', 'false');
            });
        }
    }

    // ========== AUTHENTICATION ==========

    function initAuth() {
        // Check if already logged in (先检查本地localStorage)
        const isLoggedIn = localStorage.getItem(LOGIN_KEY) === 'true';
        const savedUser = localStorage.getItem(USER_KEY);

        if (isLoggedIn && savedUser) {
            state.currentUser = savedUser;
            showApp();
            // 后台验证token
            verifyTokenAsync();
        }

        // Login form handler
        if (elements.loginForm) {
            elements.loginForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                const username = elements.loginUsername.value.trim();
                const password = elements.loginPassword.value.trim();

                if (!username || !password) {
                    showStatusMessage('Please enter username and password');
                    return;
                }

                // 调用后端API登录
                const result = await AuthAPI.login(username, password);

                if (result.success) {
                    state.currentUser = result.data.username;
                    showApp();
                    showStatusMessage('Welcome back, ' + username);
                } else {
                    showStatusMessage(result.error || 'Login failed');
                }
            });
        }

        // Register form handler
        if (elements.registerForm) {
            elements.registerForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                const username = elements.registerUsername.value.trim();
                const password = elements.registerPassword.value.trim();
                const confirmPassword = elements.registerConfirmPassword.value.trim();

                if (!username || !password || !confirmPassword) {
                    showStatusMessage('Please fill in all fields');
                    return;
                }

                if (password !== confirmPassword) {
                    showStatusMessage('Passwords do not match');
                    return;
                }

                if (password.length < 4) {
                    showStatusMessage('Password must be at least 4 characters');
                    return;
                }

                // 调用后端API注册
                const result = await AuthAPI.register(username, password);

                if (result.success) {
                    state.currentUser = result.data.username;
                    showStatusMessage('Account created successfully');
                    showApp();
                } else {
                    showStatusMessage(result.error || 'Registration failed');
                }
            });
        }

        // Toggle between login and register forms
        if (elements.showRegisterBtn) {
            elements.showRegisterBtn.addEventListener('click', () => {
                elements.loginForm.classList.add('hidden');
                elements.registerForm.classList.remove('hidden');
            });
        }

        if (elements.showLoginBtn) {
            elements.showLoginBtn.addEventListener('click', () => {
                elements.registerForm.classList.add('hidden');
                elements.loginForm.classList.remove('hidden');
            });
        }
    }

    // 后台验证token
    async function verifyTokenAsync() {
        if (!window.AuthAPI) return;
        const result = await AuthAPI.verify();
        if (!result.success) {
            // token无效，清除登录状态
            AuthAPI.logout();
            showLogin();
        }
    }

    // Simple hash function for password
    function simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(16);
    }

    function getUsers() {
        try {
            return JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
        } catch (e) {
            return {};
        }
    }

    function saveUsers(users) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    function showApp() {
        if (elements.loginScreen) {
            elements.loginScreen.classList.add('hidden');
        }
        if (elements.appContainer) {
            elements.appContainer.classList.add('logged-in');
        }
        addUserDisplay();
    }

    function showLogin() {
        if (elements.loginScreen) {
            elements.loginScreen.classList.remove('hidden');
        }
        if (elements.appContainer) {
            elements.appContainer.classList.remove('logged-in');
        }
    }

    function logout() {
        localStorage.removeItem(LOGIN_KEY);
        localStorage.removeItem(USER_KEY);
        state.currentUser = null;
        showLogin();
        if (elements.loginUsername) elements.loginUsername.value = '';
        if (elements.loginPassword) elements.loginPassword.value = '';
        if (elements.registerUsername) elements.registerUsername.value = '';
        if (elements.registerPassword) elements.registerPassword.value = '';
        if (elements.registerConfirmPassword) elements.registerConfirmPassword.value = '';
        // Reset to login form
        if (elements.registerForm && elements.loginForm) {
            elements.registerForm.classList.add('hidden');
            elements.loginForm.classList.remove('hidden');
        }
    }

    function addUserDisplay() {
        const sidebarHeader = document.querySelector('.sidebar-header');
        if (!sidebarHeader || sidebarHeader.querySelector('.user-display')) return;

        const userDisplay = document.createElement('div');
        userDisplay.className = 'user-display';
        userDisplay.innerHTML = `
            <div class="user-avatar">${(state.currentUser || 'U').charAt(0).toUpperCase()}</div>
            <span class="user-name">${state.currentUser || 'User'}</span>
            <button class="logout-btn" id="logoutBtn">Exit</button>
        `;
        sidebarHeader.appendChild(userDisplay);

        const logoutBtn = userDisplay.querySelector('#logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logout);
        }
    }

    // ========== DAILY QUOTE ==========

    function initDailyQuote() {
        const defaultQuote = quotes[5];
        elements.dailyQuote.textContent = defaultQuote;

        if (elements.quoteCard) {
            elements.quoteCard.addEventListener('click', () => {
                const currentQuote = elements.dailyQuote.textContent;
                let newQuote;
                do {
                    newQuote = quotes[Math.floor(Math.random() * quotes.length)];
                } while (newQuote === currentQuote && quotes.length > 1);

                elements.dailyQuote.style.opacity = '0';
                elements.dailyQuote.style.transition = 'opacity 0.3s ease';

                setTimeout(() => {
                    elements.dailyQuote.textContent = newQuote;
                    elements.dailyQuote.style.opacity = '1';
                }, 300);
            });
            elements.quoteCard.style.cursor = 'pointer';
        }
    }

    // ========== GREETING & DATE ==========

    function updateGreeting() {
        const hour = new Date().getHours();
        let greeting = 'Good morning';
        if (hour >= 12 && hour < 18) {
            greeting = 'Good afternoon';
        } else if (hour >= 18) {
            greeting = 'Good evening';
        }
        elements.greetingTime.textContent = greeting;
    }

    function updateDateBadge() {
        const date = new Date();
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        elements.dateBadge.textContent = `${monthNames[date.getMonth()]} ${date.getDate()}, ${dayNames[date.getDay()]}`;
    }

    // ========== DIARIES ==========

    function loadDiaries() {
        try {
            const result = moodStorage.getAllDiaries();
            state.diaries = {};
            result.data.forEach(diary => {
                state.diaries[diary.date] = diary;
            });
        } catch (e) {
            console.warn('moodStorage failed, using direct localStorage:', e);
            try {
                const raw = localStorage.getItem('mood_dust_data');
                if (raw) {
                    const data = JSON.parse(raw);
                    state.diaries = data.diaries || {};
                }
            } catch (err) {
                console.warn('Failed to load from localStorage:', err);
                state.diaries = {};
            }
        }
    }

    function loadTodayDiary() {
        const today = new Date();
        const dateKey = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());
        loadDiaryForDate(dateKey);
    }

    function loadDiaryForDate(dateKey) {
        const diary = state.diaries[dateKey];

        if (diary) {
            state.selectedMood = diary.mood || 'peaceful';
            updateMoodDisplay();
            elements.diaryContent.value = diary.content || '';

            state.uploadedImages = [];
            if (diary.image_paths && diary.image_paths.length > 0) {
                try {
                    const imageStore = JSON.parse(localStorage.getItem('mood_dust_images') || '{}');
                    diary.image_paths.forEach(imgId => {
                        if (imageStore[imgId]) {
                            state.uploadedImages.push({
                                id: imgId,
                                url: imageStore[imgId]
                            });
                        }
                    });
                } catch (e) {
                    console.warn('Failed to restore images:', e);
                }
            }
            renderImagePreview();
            showStatusMessage(`Loaded: ${dateKey}`);
        } else {
            state.selectedMood = 'peaceful';
            elements.diaryContent.value = '';
            state.uploadedImages = [];
            renderImagePreview();
            updateMoodDisplay();
        }
    }

    function formatDateKey(year, month, day) {
        const m = String(month + 1).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        return `${year}-${m}-${d}`;
    }

    // ========== CALENDAR ==========

    function renderCalendarMini() {
        const year = state.currentMonth.getFullYear();
        const month = state.currentMonth.getMonth();

        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        elements.currentMonthSmall.textContent = `${monthNames[month]} ${year}`;

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDay = firstDay.getDay();
        const daysInMonth = lastDay.getDate();
        const today = new Date();

        let html = '<div class="calendar-weekdays">';
        const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        weekdays.forEach(day => {
            html += `<span class="calendar-weekday">${day}</span>`;
        });
        html += '</div>';

        html += '<div class="calendar-days">';

        const prevMonth = new Date(year, month, 0);
        const prevDays = prevMonth.getDate();
        for (let i = startDay - 1; i >= 0; i--) {
            html += `<div class="calendar-day other-month">${prevDays - i}</div>`;
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateKey = formatDateKey(year, month, day);
            const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
            const isSelected = state.selectedDate.getFullYear() === year &&
                             state.selectedDate.getMonth() === month &&
                             state.selectedDate.getDate() === day;
            const hasEntry = !!state.diaries[dateKey];

            let classes = 'calendar-day';
            if (isToday) classes += ' today';
            if (isSelected) classes += ' selected';
            if (hasEntry) classes += ' has-entry';

            html += `<div class="${classes}" data-year="${year}" data-month="${month}" data-day="${day}">${day}</div>`;
        }

        const remainingDays = 42 - (startDay + daysInMonth);
        for (let day = 1; day <= remainingDays; day++) {
            html += `<div class="calendar-day other-month">${day}</div>`;
        }

        html += '</div>';
        elements.calendarMini.innerHTML = html;

        bindCalendarEvents();
    }

    // Render monthly mood statistics
    function renderMoodStats() {
        if (!elements.moodStatsGrid) return;

        const year = state.currentMonth.getFullYear();
        const month = state.currentMonth.getMonth();

        // Count moods for the current month
        const moodCounts = {};
        
        for (let day = 1; day <= 31; day++) {
            const dateKey = formatDateKey(year, month, day);
            if (state.diaries[dateKey] && state.diaries[dateKey].mood) {
                const mood = state.diaries[dateKey].mood;
                moodCounts[mood] = (moodCounts[mood] || 0) + 1;
            }
        }

        // Build stats grid
        let html = '';
        
        // Show all moods, even those with 0 count
        const allMoods = Object.keys(moodMap);
        allMoods.forEach(moodKey => {
            const mood = moodMap[moodKey];
            const count = moodCounts[moodKey] || 0;
            
            html += `
                <div class="stat-item" title="${mood.name}: ${count} times">
                    <img class="stat-icon" src="${mood.icon}" alt="${mood.name}">
                    <span class="stat-count">${count}</span>
                    <span class="stat-label">${mood.name}</span>
                </div>
            `;
        });

        elements.moodStatsGrid.innerHTML = html;
    }

    function bindCalendarEvents() {
        const days = elements.calendarMini.querySelectorAll('.calendar-day:not(.other-month)');
        days.forEach(day => {
            day.addEventListener('click', () => {
                const year = parseInt(day.dataset.year);
                const month = parseInt(day.dataset.month);
                const dayNum = parseInt(day.dataset.day);

                state.selectedDate = new Date(year, month, dayNum);
                renderCalendarMini();
                const dateKey = formatDateKey(year, month, dayNum);
                loadDiaryForDate(dateKey);
            });
        });
    }

    // ========== MOOD ==========

    function updateMoodDisplay() {
        const mood = moodMap[state.selectedMood];
        if (!mood) return;

        elements.selectedMoodSymbol.src = mood.icon;
        elements.selectedMoodSymbol.alt = mood.name;
        elements.selectedMoodText.textContent = mood.name;

        const cards = elements.moodSelector.querySelectorAll('.mood-card');
        cards.forEach(card => {
            if (card.dataset.mood === state.selectedMood) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });

        // Save current mood to localStorage for meditation page to read in real-time
        localStorage.setItem('mood_dust_current_mood', JSON.stringify({
            mood: state.selectedMood,
            timestamp: Date.now()
        }));
    }

    // ========== FONT SWITCHER ==========

    function initFontSwitcher() {
        if (!elements.fontSwitcher) return;

        const fontBtns = elements.fontSwitcher.querySelectorAll('.font-btn');
        fontBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const font = btn.dataset.font;
                state.selectedFont = font;

                fontBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                elements.diaryContent.classList.remove('font-sans', 'font-mono');
                if (fontConfigs[font].class) {
                    elements.diaryContent.classList.add(fontConfigs[font].class);
                }

                localStorage.setItem('mood_dust_font', font);
            });
        });

        const savedFont = localStorage.getItem('mood_dust_font');
        if (savedFont && fontConfigs[savedFont]) {
            const btn = elements.fontSwitcher.querySelector(`[data-font="${savedFont}"]`);
            if (btn) btn.click();
        }
    }

    // ========== AUTO SAVE ==========

    function initAutoSave() {
        elements.diaryContent.addEventListener('input', () => {
            if (state.autoSaveTimer) {
                clearTimeout(state.autoSaveTimer);
            }
            state.autoSaveTimer = setTimeout(() => {
                autoSaveDraft();
            }, 3000);
        });
    }

    function autoSaveDraft() {
        const content = elements.diaryContent.value.trim();
        if (!content) return;

        const dateKey = formatDateKey(
            state.selectedDate.getFullYear(),
            state.selectedDate.getMonth(),
            state.selectedDate.getDate()
        );

        try {
            const draft = {
                date: dateKey,
                mood: state.selectedMood,
                content: content,
                image_paths: state.uploadedImages.map(img => img.id),
                updated_at: new Date().toISOString()
            };

            const drafts = JSON.parse(localStorage.getItem('mood_dust_drafts') || '{}');
            drafts[dateKey] = draft;
            localStorage.setItem('mood_dust_drafts', JSON.stringify(drafts));

            showStatusMessage('Auto-saved');
        } catch (e) {
            console.warn('Auto-save failed:', e);
        }
    }

    // ========== VIBE MIXER ==========

    function initVibeMixer() {
        if (!elements.vibeMixerToggle || !elements.vibeMixerPanel) return;

        const mixer = document.querySelector('.vibe-mixer');
        const panel = elements.vibeMixerPanel;
        const toggle = elements.vibeMixerToggle;
        if (!mixer || !panel || !toggle) return;

        let hideTimer = null;

        function clearHideTimer() {
            if (hideTimer) {
                clearTimeout(hideTimer);
                hideTimer = null;
            }
        }

        function scheduleHide() {
            clearHideTimer();
            hideTimer = setTimeout(() => {
                // Check if mouse is over toggle or panel using relatedTarget
                panel.classList.remove('show');
            }, 300);
        }

        function cancelHide() {
            clearHideTimer();
            panel.classList.add('show');
        }

        // Toggle button hover
        toggle.addEventListener('mouseenter', cancelHide);
        toggle.addEventListener('mouseleave', scheduleHide);

        // Panel hover
        panel.addEventListener('mouseenter', cancelHide);
        panel.addEventListener('mouseleave', scheduleHide);

        document.getElementById('rainAmountSlider')?.addEventListener('input', (e) => {
            window.rainAmount = e.target.value / 100;
        });

        document.getElementById('rainSoundSlider')?.addEventListener('input', (e) => {
            state.rainSoundVolume = e.target.value / 100;
            // 当音量为 0 时关闭雨声
            if (state.rainSoundVolume === 0) {
                stopRainSound();
            } else {
                // 如果雨声未播放且音量大于 0，则启动
                if (!isRainSoundPlaying) {
                    startRainSound();
                }
                updateRainSoundVolume();
            }
        });
    }

    // ========== EDIT AGAIN & LAYOUT ==========

    function initEditAndLayout() {
        if (elements.editAgain) {
            elements.editAgain.addEventListener('click', () => {
                if (!state.isEditing) {
                    enableEditing();
                }
            });
        }

        if (elements.layoutBtn) {
            elements.layoutBtn.addEventListener('click', () => {
                openLayoutStudio();
            });
        }
    }

    function enableEditing() {
        state.isEditing = true;
        elements.diaryContent.readOnly = false;
        elements.diaryContent.style.opacity = '1';
        elements.editAgain.classList.add('active');
        showStatusMessage('Editing enabled');
    }

    function disableEditing() {
        state.isEditing = false;
        elements.diaryContent.readOnly = true;
        elements.diaryContent.style.opacity = '0.7';
        elements.editAgain.classList.remove('active');
    }

    // ========== LAYOUT STUDIO ==========

    function initLayoutStudio() {
        if (elements.layoutStudioClose) {
            elements.layoutStudioClose.addEventListener('click', closeLayoutStudio);
        }

        if (elements.layoutExportBtn) {
            elements.layoutExportBtn.addEventListener('click', exportLayoutCard);
        }
        if (elements.addMoodCardBtn) {
            elements.addMoodCardBtn.addEventListener('click', addMoodCard);
        }
        if (elements.addPoetryCardBtn) {
            elements.addPoetryCardBtn.addEventListener('click', addPoetryCard);
        }

        const templateBtns = document.querySelectorAll('.layout-template-btn');
        templateBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                templateBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.layoutTemplate = btn.dataset.template;
                updateLayoutPreview();
            });
        });

        // Font size controls
        if (elements.fontSizeIncrease) {
            elements.fontSizeIncrease.addEventListener('click', () => {
                adjustFontSize(2);
            });
        }
        if (elements.fontSizeDecrease) {
            elements.fontSizeDecrease.addEventListener('click', () => {
                adjustFontSize(-2);
            });
        }

        initTextDragging();
    }

    let currentFontSize = 18;

    function adjustFontSize(delta) {
        const minSize = 12;
        const maxSize = 36;
        
        currentFontSize = Math.max(minSize, Math.min(maxSize, currentFontSize + delta));
        elements.fontSizeValue.textContent = currentFontSize + 'px';
        
        // Update all text elements in layout card
        const textElements = elements.layoutCardContent.querySelectorAll('.layout-card-text');
        textElements.forEach(el => {
            el.style.fontSize = currentFontSize + 'px';
        });
    }

    function initTextDragging() {
        const draggableElements = [
            { el: elements.layoutCardDate, key: 'date' },
            { el: elements.layoutCardText, key: 'text' }
        ];

        draggableElements.forEach(item => {
            if (!item.el) return;

            let isDragging = false;
            let startX, startY, initialLeft, initialTop;

            item.el.addEventListener('mousedown', function(e) {
                isDragging = true;
                item.el.classList.add('dragging');

                const rect = item.el.getBoundingClientRect();
                const parentRect = item.el.offsetParent.getBoundingClientRect();

                startX = e.clientX;
                startY = e.clientY;
                initialLeft = rect.left - parentRect.left;
                initialTop = rect.top - parentRect.top;

                item.el.style.position = 'absolute';
                item.el.style.left = initialLeft + 'px';
                item.el.style.top = initialTop + 'px';
                item.el.style.width = rect.width + 'px';

                e.preventDefault();
            });

            document.addEventListener('mousemove', function(e) {
                if (!isDragging) return;

                const dx = e.clientX - startX;
                const dy = e.clientY - startY;

                let newLeft = initialLeft + dx;
                let newTop = initialTop + dy;

                const parentRect = item.el.offsetParent.getBoundingClientRect();
                const elRect = item.el.getBoundingClientRect();

                newLeft = Math.max(0, Math.min(newLeft, parentRect.width - elRect.width));
                newTop = Math.max(0, Math.min(newTop, parentRect.height - elRect.height));

                item.el.style.left = newLeft + 'px';
                item.el.style.top = newTop + 'px';

                state.textPositions[item.key] = { x: newLeft, y: newTop };
            });

            document.addEventListener('mouseup', function() {
                if (isDragging) {
                    isDragging = false;
                    item.el.classList.remove('dragging');
                }
            });
        });
    }

    function openLayoutStudio() {
        updateLayoutPreview();
        elements.layoutStudio.classList.add('active');
    }

    function closeLayoutStudio() {
        elements.layoutStudio.classList.remove('active');
    }

    function updateLayoutPreview() {
        const dateKey = formatDateKey(
            state.selectedDate.getFullYear(),
            state.selectedDate.getMonth(),
            state.selectedDate.getDate()
        );

        const content = elements.diaryContent.value.trim() || 'Your thoughts will appear here...';
        const mood = moodMap[state.selectedMood] || moodMap.peaceful;

        elements.layoutCardDate.textContent = dateKey;
        elements.layoutCardText.textContent = content;
        elements.layoutCardUser.textContent = state.currentUser || 'Anonymous';
        elements.layoutCardMood.textContent = mood.symbol;

        // Reset card mode
        elements.layoutCard.classList.remove('split-mode');

        // Reset text positions to default (flow layout)
        elements.layoutCardDate.style.position = 'relative';
        elements.layoutCardDate.style.left = 'auto';
        elements.layoutCardDate.style.top = 'auto';
        elements.layoutCardDate.style.width = 'auto';

        elements.layoutCardText.style.position = 'relative';
        elements.layoutCardText.style.left = 'auto';
        elements.layoutCardText.style.top = 'auto';
        elements.layoutCardText.style.width = 'auto';

        state.textPositions = { date: { x: 0, y: 0 }, text: { x: 0, y: 0 } };

        // Apply font class
        elements.layoutCardText.classList.remove('font-sans', 'font-mono');
        if (fontConfigs[state.selectedFont].class) {
            elements.layoutCardText.classList.add(fontConfigs[state.selectedFont].class);
        }

        // Handle image - adapt card size to image orientation
        if (state.uploadedImages.length > 0) {
            const img = new Image();
            img.onload = function() {
                const isLandscape = img.width > img.height;
                const card = elements.layoutCard;

                if (isLandscape) {
                    // Landscape: wider card
                    card.style.width = '560px';
                    card.style.height = '400px';
                    state.cardImageSize = { width: 560, height: 400 };
                } else {
                    // Portrait: taller card (default)
                    card.style.width = '400px';
                    card.style.height = '560px';
                    state.cardImageSize = { width: 400, height: 560 };
                }

                elements.layoutCardImage.src = state.uploadedImages[0].url;
                elements.layoutCardImage.style.display = 'block';

                if (state.layoutTemplate === 'overlay') {
                    elements.layoutCardImage.style.opacity = '0.3';
                    elements.layoutCardImage.style.width = '100%';
                    elements.layoutCardImage.style.height = '100%';
                    elements.layoutCardImage.style.position = 'absolute';
                    elements.layoutCardImage.style.borderRadius = '0';
                } else if (state.layoutTemplate === 'split') {
                    elements.layoutCard.classList.add('split-mode');
                    elements.layoutCardImage.style.opacity = '1';
                    elements.layoutCardImage.style.height = '50%';
                    elements.layoutCardImage.style.width = '100%';
                    elements.layoutCardImage.style.position = 'relative';
                    elements.layoutCardImage.style.borderRadius = 'var(--radius-lg) var(--radius-lg) 0 0';
                }
            };
            img.src = state.uploadedImages[0].url;
        } else {
            elements.layoutCardImage.style.display = 'none';
            elements.layoutCard.style.width = '400px';
            elements.layoutCard.style.height = '560px';
            state.cardImageSize = { width: 400, height: 560 };
        }
    }

    function exportLayoutCard() {
        const dateKey = formatDateKey(
            state.selectedDate.getFullYear(),
            state.selectedDate.getMonth(),
            state.selectedDate.getDate()
        );

        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const size = state.cardImageSize;

            canvas.width = size.width * 2;
            canvas.height = size.height * 2;
            ctx.scale(2, 2);

            // Background
            ctx.fillStyle = '#1a1f1a';
            ctx.fillRect(0, 0, size.width, size.height);

            // Draw image if exists
            if (state.uploadedImages.length > 0 && state.layoutTemplate !== 'minimal') {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = function() {
                    if (state.layoutTemplate === 'split') {
                        ctx.drawImage(img, 0, 0, size.width, size.height * 0.5);
                        // Draw white background for text area
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, size.height * 0.5, size.width, size.height * 0.5);
                    } else {
                        ctx.globalAlpha = 0.3;
                        ctx.drawImage(img, 0, 0, size.width, size.height);
                        ctx.globalAlpha = 1;
                    }
                    drawTextAndExport(ctx, size, dateKey, canvas);
                };
                img.src = state.uploadedImages[0].url;
            } else {
                drawTextAndExport(ctx, size, dateKey, canvas);
            }
        } catch (e) {
            console.error('Export failed:', e);
            showStatusMessage('Export failed');
        }
    }

    function drawTextAndExport(ctx, size, dateKey, canvas) {
        const padding = 32;
        const content = elements.diaryContent.value.trim() || 'Your thoughts...';
        const mood = moodMap[state.selectedMood] || moodMap.peaceful;

        // Get dragged positions (relative to card content area)
        const datePos = state.textPositions.date;
        const textPos = state.textPositions.text;

        // Calculate content area offset (padding inside card)
        const contentPadding = 32;

        // Date position - use dragged position if set, otherwise default
        let dateX, dateY;
        if (datePos.x !== 0 || datePos.y !== 0) {
            dateX = contentPadding + datePos.x;
            dateY = contentPadding + datePos.y + 15;
        } else {
            dateX = padding;
            dateY = padding + 15;
        }

        // Date
        ctx.font = '11px Inter, sans-serif';
        if (state.layoutTemplate === 'split') {
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
        } else {
            ctx.fillStyle = 'rgba(255,255,255,0.35)';
        }
        ctx.fillText(dateKey, dateX, dateY);

        // Content position - use dragged position if set, otherwise default
        let textX, textY;
        if (textPos.x !== 0 || textPos.y !== 0) {
            textX = contentPadding + textPos.x;
            textY = contentPadding + textPos.y + 20;
        } else {
            textX = padding;
            textY = padding + 60;

            // Adjust text position for split layout
            if (state.layoutTemplate === 'split' && state.uploadedImages.length > 0) {
                textY = size.height * 0.5 + 40;
            }
        }

        // Content - word wrap
        ctx.font = '16px Cormorant Garamond, Georgia, serif';
        if (state.layoutTemplate === 'split') {
            ctx.fillStyle = '#1a1a1a';
        } else {
            ctx.fillStyle = 'rgba(255,255,255,0.92)';
        }

        const maxWidth = size.width - padding * 2;
        const lineHeight = 28;
        let y = textY;

        const words = content.split(' ');
        let line = '';

        words.forEach(word => {
            const testLine = line + word + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && line !== '') {
                ctx.fillText(line, textX, y);
                line = word + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        });
        ctx.fillText(line, textX, y);

        // Footer line
        const footerY = size.height - padding - 20;
        if (state.layoutTemplate === 'split') {
            ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        } else {
            ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        }
        ctx.beginPath();
        ctx.moveTo(padding, footerY);
        ctx.lineTo(size.width - padding, footerY);
        ctx.stroke();

        // Username at bottom right
        ctx.font = '12px Inter, sans-serif';
        if (state.layoutTemplate === 'split') {
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
        } else {
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
        }
        const userText = state.currentUser || 'Anonymous';
        const userMetrics = ctx.measureText(userText);
        ctx.fillText(userText, size.width - padding - userMetrics.width, footerY + 20);

        // Mood symbol at bottom left
        ctx.font = '16px serif';
        if (state.layoutTemplate === 'split') {
            ctx.fillStyle = '#4a7c59';
        } else {
            ctx.fillStyle = 'rgba(160, 200, 160, 0.8)';
        }
        ctx.fillText(mood.symbol, padding, footerY + 20);

        // Export
        const link = document.createElement('a');
        link.download = `mood-dust-${dateKey}-${state.currentUser || 'user'}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        showStatusMessage('Exported successfully');
    }

    function addMoodCard() {
        const mood = moodMap[state.selectedMood] || moodMap.peaceful;

        const wrapper = document.createElement('div');
        wrapper.className = 'layout-card-item';
        wrapper.style.position = 'relative';
        wrapper.style.marginTop = '12px';

        const moodDiv = document.createElement('div');
        moodDiv.className = 'layout-card-text mood-card-text';
        moodDiv.style.fontStyle = 'italic';
        moodDiv.style.display = 'flex';
        moodDiv.style.alignItems = 'center';
        moodDiv.style.gap = '8px';

        const moodIcon = document.createElement('img');
        moodIcon.className = 'mood-icon';
        moodIcon.src = mood.icon;
        moodIcon.alt = mood.name;
        moodIcon.style.width = '24px';
        moodIcon.style.height = '24px';
        moodIcon.style.filter = 'brightness(0) invert(1)';

        const moodText = document.createElement('span');
        moodText.textContent = mood.name;

        moodDiv.appendChild(moodIcon);
        moodDiv.appendChild(moodText);

        const removeBtn = document.createElement('button');
        removeBtn.className = 'card-remove-btn';
        removeBtn.innerHTML = '×';
        removeBtn.title = 'Remove';
        removeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (confirm('Remove this mood card?')) {
                wrapper.remove();
                showStatusMessage('Mood card removed');
            }
        });

        wrapper.appendChild(moodDiv);
        wrapper.appendChild(removeBtn);
        elements.layoutCardContent.appendChild(wrapper);
        showStatusMessage('Mood card added');
    }

    function addPoetryCard() {
        const poetry = elements.poetryResult?.textContent?.trim();
        if (!poetry || poetry === 'Generating...') {
            showStatusMessage('Please generate poetry first in the main page');
            return;
        }

        const wrapper = document.createElement('div');
        wrapper.className = 'layout-card-item';
        wrapper.style.position = 'relative';
        wrapper.style.marginTop = '12px';

        const poetryDiv = document.createElement('div');
        poetryDiv.className = 'layout-card-text poetry-card-text';
        poetryDiv.textContent = poetry;
        poetryDiv.style.fontStyle = 'italic';
        poetryDiv.style.opacity = '0.85';
        poetryDiv.style.overflow = 'visible';
        poetryDiv.style.maxHeight = 'none';

        const removeBtn = document.createElement('button');
        removeBtn.className = 'card-remove-btn';
        removeBtn.innerHTML = '×';
        removeBtn.title = 'Remove';
        removeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (confirm('Remove this poetry card?')) {
                wrapper.remove();
                showStatusMessage('Poetry card removed');
            }
        });

        wrapper.appendChild(poetryDiv);
        wrapper.appendChild(removeBtn);
        elements.layoutCardContent.appendChild(wrapper);
        showStatusMessage('Poetry card added');
    }

    function isChinese(text) {
            const chineseRegex = /[\u4e00-\u9fa5]/;
            return chineseRegex.test(text);
        }

        async function generatePoetryForCard(keyword) {
            const isChineseKeyword = isChinese(keyword);
            const outputLanguage = isChineseKeyword ? 'Chinese' : 'English';
            const systemPrompt = isChineseKeyword 
                ? `你是一位诗意助手，擅长创作富有哲理和意境的中文诗歌。你的风格融合了东方古典诗词与现代诗意，语言优美含蓄。重要规则：用户提供的中文关键词 ${keyword} 必须原样出现在你的诗中。在输出前，请验证关键词确实存在于诗中，如果没有，请重新生成。关键词应作为诗歌的核心主题。`
                : 'You are a poetic assistant who writes deeply meaningful, evocative poetry in English. Your style is reminiscent of Mary Oliver, Rilke, and T.S. Eliot. Write single sentences or short paragraphs that are rich in imagery and philosophical depth. CRITICAL RULE: The user\'s keyword MUST appear VERBATIM in your response. Before outputting, VERIFY that the keyword is present in your poem. If not, REGENERATE until it is.';
            
            const userPrompt = isChineseKeyword 
                ? `请写一句包含关键词 ${keyword} 的诗意中文句子。关键词 ${keyword} 必须原样出现在句子中，作为核心意象。语言要优美含蓄，富有画面感和哲理。`
                : `Write a poetic sentence where "${keyword}" is the CENTRAL subject. The word "${keyword}" MUST appear EXACTLY as written. Make it deeply evocative with rich imagery.`;

            try {
                const response = await fetch('/api/poetry', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        messages: [{
                            role: 'system',
                            content: systemPrompt
                        }, {
                            role: 'user',
                            content: userPrompt
                        }],
                    })
                });

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const data = await response.json();
            let poetry = data.choices[0].message.content.trim();

            // Verify the keyword is included in the generated poetry
            const keywordLower = keyword.toLowerCase();
            const poetryLower = poetry.toLowerCase();
            
            if (!poetryLower.includes(keywordLower)) {
                console.warn('Generated poetry does not contain keyword, using fallback');
                throw new Error('Keyword not found in response');
            }

            return poetry;
        } catch (error) {
            console.warn('AI API failed or keyword not found, using local poetry:', error);
            // Use local poetry that matches the keyword, or fallback to random
            const keywordLower = keyword.toLowerCase();
            
            // Priority 1: Exact match
            if (poetryByTheme[keywordLower]) {
                return poetryByTheme[keywordLower][0];
            }
            
            // Priority 2: Partial match
            let foundTheme = null;
            for (let theme in poetryByTheme) {
                if (keywordLower.includes(theme) || theme.includes(keywordLower)) {
                    foundTheme = theme;
                    break;
                }
            }
            if (foundTheme) {
                return poetryByTheme[foundTheme][0];
            }
            
            // Priority 3: Semantic similarity match
            const relatedThemes = findRelatedThemes(keywordLower);
            if (relatedThemes.length > 0) {
                const randomTheme = relatedThemes[Math.floor(Math.random() * relatedThemes.length)];
                return poetryByTheme[randomTheme][0];
            }
            
            // Final fallback: random poetry
            const allPoetry = [];
            for (let theme in poetryByTheme) {
                allPoetry.push(...poetryByTheme[theme]);
            }
            return allPoetry[Math.floor(Math.random() * allPoetry.length)];
        }
    }

    function bindEvents() {
        const moodCards = elements.moodSelector.querySelectorAll('.mood-card');
        moodCards.forEach(card => {
            card.addEventListener('click', () => {
                state.selectedMood = card.dataset.mood;
                updateMoodDisplay();
            });
        });

        elements.generatePoetry.addEventListener('click', generatePoetryByKeyword);
        elements.saveDiary.addEventListener('click', saveDiary);

        elements.prevMonthSmall.addEventListener('click', () => {
            state.currentMonth.setMonth(state.currentMonth.getMonth() - 1);
            renderCalendarMini();
            renderMoodStats();
        });

        elements.nextMonthSmall.addEventListener('click', () => {
            state.currentMonth.setMonth(state.currentMonth.getMonth() + 1);
            renderCalendarMini();
            renderMoodStats();
        });

        const firstMood = elements.moodSelector.querySelector('.mood-card');
        if (firstMood) {
            firstMood.classList.add('active');
        }

        initEditAndLayout();
        initLayoutStudio();
    }

    // ========== POETRY ==========

    function generatePoetryByKeyword() {
        const keyword = elements.keywordInput.value.trim();
        if (!keyword) {
            showStatusMessage('Please enter a keyword');
            return;
        }

        // Always call AI API for dynamic poetry generation
        generateAIPoetry(keyword);
    }

    async function generateAIPoetry(keyword) {
        elements.poetryResult.textContent = 'Generating...';
        elements.poetryResult.classList.remove('hidden');

        const isChineseKeyword = isChinese(keyword);
        const systemPrompt = isChineseKeyword 
            ? `你是一位诗意助手，擅长创作富有哲理和意境的中文诗歌。你的风格融合了东方古典诗词与现代诗意，语言优美含蓄。重要规则：用户提供的中文关键词 ${keyword} 必须原样出现在你的诗中。在输出前，请验证关键词确实存在于诗中，如果没有，请重新生成。关键词应作为诗歌的核心主题。`
            : 'You are a poetic assistant who writes deeply meaningful, evocative poetry in English. Your style is reminiscent of Mary Oliver, Rilke, and T.S. Eliot. Write single sentences or short paragraphs that are rich in imagery and philosophical depth. CRITICAL RULE: The user\'s keyword MUST appear VERBATIM in your response. Before outputting, VERIFY that the keyword is present in your poem. If not, REGENERATE until it is.';
        
        const userPrompt = isChineseKeyword 
            ? `请写一句包含关键词 ${keyword} 的诗意中文句子。关键词 ${keyword} 必须原样出现在句子中，作为核心意象。语言要优美含蓄，富有画面感和哲理。`
            : `Write a poetic sentence where "${keyword}" is the CENTRAL and EXPLICIT subject. The word "${keyword}" MUST appear EXACTLY as written. Make it unique and profound, directly ABOUT "${keyword}".`;

        try {
            const response = await fetch('/api/poetry', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: [{
                        role: 'system',
                        content: systemPrompt
                    }, {
                        role: 'user',
                        content: userPrompt
                    }],
                })
            });

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const data = await response.json();
            let poetry = data.choices[0].message.content.trim();

            // Verify the keyword is included in the generated poetry
            const keywordLower = keyword.toLowerCase();
            const poetryLower = poetry.toLowerCase();
            
            if (!poetryLower.includes(keywordLower)) {
                console.warn('Generated poetry does not contain keyword, using fallback');
                throw new Error('Keyword not found in response');
            }

            elements.poetryResult.textContent = poetry;
            elements.poetryResult.classList.remove('hidden');
            showStatusMessage('Poetry generated');
        } catch (error) {
            console.warn('AI API failed or keyword not found:', error);
            // Use local poetry ONLY if exact match exists
            let poetry = '';
            const keywordLower = keyword.toLowerCase();
            
            // Priority 1: Exact match only
            if (poetryByTheme[keywordLower]) {
                poetry = poetryByTheme[keywordLower][0];
                elements.poetryResult.textContent = poetry;
                elements.poetryResult.classList.remove('hidden');
                showStatusMessage('Poetry from local library (exact match)');
            } else {
                // No match found - inform user
                elements.poetryResult.textContent = 'Unable to generate poetry for this keyword. Please try a different keyword or ensure the API is accessible.';
                elements.poetryResult.classList.remove('hidden');
                showStatusMessage('Failed to generate poetry');
            }
        }
    }

    function adjustFontSizeToFit(element, text) {
        const maxFontSize = 20; // Maximum font size in pixels
        const minFontSize = 12; // Minimum font size in pixels
        const maxLines = 4; // Maximum number of lines before ellipsis
        
        // Calculate base font size based on text length
        const textLength = text.length;
        const avgCharsPerLine = 30; // Average characters per line for readable text
        const estimatedLines = Math.ceil(textLength / avgCharsPerLine);
        
        // Calculate font size based on number of lines
        let fontSize = maxFontSize;
        if (estimatedLines > 1) {
            fontSize = Math.max(minFontSize, maxFontSize - (estimatedLines - 1) * 2);
        }
        
        // Apply font size
        element.style.fontSize = fontSize + 'px';
        
        // Add ellipsis if text is too long
        if (textLength > 200) {
            element.style.overflow = 'hidden';
            element.style.textOverflow = 'ellipsis';
            element.style.display = '-webkit-box';
            element.style.WebkitLineClamp = maxLines;
            element.style.WebkitBoxOrient = 'vertical';
            showStatusMessage('Content truncated, please use shorter text');
        }
    }

    function findRelatedThemes(keyword) {
        const themeKeywords = {
            'sunset': ['sun', 'sunlight', 'dusk', 'evening', 'horizon', 'golden', 'orange'],
            'sunrise': ['sun', 'dawn', 'morning', 'light'],
            'wind': ['breeze', 'air', 'blow', 'gust'],
            'love': ['heart', 'romance', 'affection', 'passion'],
            'rain': ['water', 'storm', 'shower', 'wet'],
            'stars': ['starlight', 'night sky', 'constellation'],
            'moon': ['lunar', 'silver', 'night'],
            'flowers': ['flower', 'bloom', 'petal', 'garden'],
            'spring': ['bloom', 'green', 'fresh', 'new'],
            'autumn': ['fall', 'leaves', 'orange', 'harvest'],
            'winter': ['snow', 'cold', 'white', 'frost'],
            'summer': ['hot', 'heat', 'bright', 'warm'],
            'sea': ['ocean', 'water', 'wave', 'blue'],
            'mountains': ['mountain', 'hill', 'peak', 'climb'],
            'home': ['house', 'family', 'comfort', 'safe'],
            'dreams': ['dream', 'sleep', 'nightmare', 'vision'],
            'time': ['clock', 'moment', 'past', 'future'],
            'memories': ['memory', 'remember', 'past', 'recall'],
            'future': ['tomorrow', 'hope', 'dream'],
            'hope': ['wish', 'believe', 'optimism'],
            'poem': ['poetry', 'verse', 'rhyme', 'writing'],
            'poetry': ['poem', 'verse', 'literature', 'writing'],
            'writing': ['write', 'words', 'story', 'poem'],
            'words': ['language', 'speech', 'text', 'write'],
            'silence': ['quiet', 'still', 'peace', 'calm'],
            'forest': ['woods', 'trees', 'nature', 'green'],
            'river': ['water', 'flow', 'stream', 'current'],
            'light': ['bright', 'sun', 'illuminate', 'glow'],
            'shadow': ['dark', 'shade', 'silhouette'],
            'fire': ['flame', 'heat', 'burn', 'warm'],
            'peace': ['calm', 'quiet', 'still', 'serene'],
            'joy': ['happy', 'happiness', 'delight', 'pleasure'],
            'sorrow': ['sad', 'sadness', 'grief', 'mourn'],
            'beauty': ['beautiful', 'pretty', 'lovely', 'grace'],
            'night': ['dark', 'evening', 'moon', 'stars'],
            'morning': ['dawn', 'sunrise', 'early', 'fresh'],
            'music': ['sound', 'melody', 'song', 'harmony'],
            'art': ['paint', 'create', 'beauty', 'expression'],
            'nature': ['earth', 'world', 'environment', 'outdoor']
        };
        
        const related = [];
        for (let theme in themeKeywords) {
            if (poetryByTheme[theme]) {
                const keywords = themeKeywords[theme];
                if (keywords.some(k => keyword.includes(k) || k.includes(keyword))) {
                    related.push(theme);
                }
            }
        }
        return related;
    }

    // ========== SAVE DIARY ==========

    async function saveDiary() {
        const content = elements.diaryContent.value.trim();
        if (!content && state.uploadedImages.length === 0) {
            showStatusMessage('Please write something or add images');
            return;
        }

        const dateKey = formatDateKey(
            state.selectedDate.getFullYear(),
            state.selectedDate.getMonth(),
            state.selectedDate.getDate()
        );

        try {
            // 保存图片到本地
            const imageStore = JSON.parse(localStorage.getItem('mood_dust_images') || '{}');
            state.uploadedImages.forEach(img => {
                imageStore[img.id] = img.url;
            });
            localStorage.setItem('mood_dust_images', JSON.stringify(imageStore));

            const diaryData = {
                date: dateKey,
                mood: state.selectedMood,
                content: content,
                ai_sentence: '',
                image_paths: state.uploadedImages.map(img => img.id),
                updated_at: new Date().toISOString()
            };

            // 保存到本地缓存
            let allData;
            try {
                const existing = localStorage.getItem('mood_dust_data');
                allData = existing ? JSON.parse(existing) : { version: '1.0', diaries: {} };
            } catch (e) {
                allData = { version: '1.0', diaries: {} };
            }

            allData.diaries[dateKey] = diaryData;
            localStorage.setItem('mood_dust_data', JSON.stringify(allData));

            state.diaries[dateKey] = diaryData;

            const drafts = JSON.parse(localStorage.getItem('mood_dust_drafts') || '{}');
            delete drafts[dateKey];
            localStorage.setItem('mood_dust_drafts', JSON.stringify(drafts));

            // 同时调用后端API同步（如果已登录）
            if (window.DiaryAPI && AuthAPI && AuthAPI.isLoggedIn()) {
                await DiaryAPI.saveDiary(dateKey, state.selectedMood, content, '', state.uploadedImages.map(img => img.id));
            }

            renderCalendarMini();
            renderMoodStats();
            showStatusMessage('Saved successfully');
        } catch (e) {
            console.error('Failed to save diary:', e);
            showStatusMessage('Save failed: ' + e.message);
        }
    }

    // ========== IMAGE UPLOAD ==========

    function initImageUpload() {
        const dropZone = elements.imageDropZone;
        const fileInput = elements.imageInput;

        dropZone.addEventListener('click', () => fileInput.click());

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            handleImageFiles(files);
        });

        fileInput.addEventListener('change', (e) => {
            const files = e.target.files;
            handleImageFiles(files);
        });
    }

    function handleImageFiles(files) {
        if (!files || files.length === 0) return;

        Array.from(files).forEach(file => {
            if (!file.type.startsWith('image/')) return;
            if (state.uploadedImages.length >= 4) {
                showStatusMessage('Maximum 4 images allowed');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const imageData = {
                    id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    url: e.target.result
                };

                state.uploadedImages.push(imageData);
                renderImagePreview();
            };
            reader.readAsDataURL(file);
        });
    }

    function renderImagePreview() {
        if (state.uploadedImages.length === 0) {
            elements.imagePreview.classList.add('hidden');
            return;
        }

        elements.imagePreview.classList.remove('hidden');

        let html = '';
        state.uploadedImages.forEach(img => {
            html += `
                <div class="image-preview-item" data-id="${img.id}">
                    <img src="${img.url}" alt="Uploaded image">
                    <button class="image-remove-btn" data-id="${img.id}">×</button>
                </div>
            `;
        });

        elements.imagePreview.innerHTML = html;

        const removeBtns = elements.imagePreview.querySelectorAll('.image-remove-btn');
        removeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                state.uploadedImages = state.uploadedImages.filter(img => img.id !== id);
                renderImagePreview();
            });
        });
    }

    // ========== STATUS MESSAGE ==========

    function showStatusMessage(message) {
        elements.statusMessage.textContent = message;
        elements.statusMessage.classList.add('show');

        setTimeout(() => {
            elements.statusMessage.classList.remove('show');
        }, 2500);
    }

    // ========== RAIN SOUND (SINGLE SOURCE) ==========

    let rainAudio = null;
    let isRainSoundPlaying = false;

    function initRainSound() {
        // Read saved state from localStorage
        const savedVolume = localStorage.getItem('mood_dust_rain_volume');
        const savedPlaying = localStorage.getItem('mood_dust_rain_playing');
        
        if (savedVolume !== null) {
            state.rainSoundVolume = parseFloat(savedVolume);
        }

        // Create sound toggle button
        const soundToggle = document.createElement('button');
        soundToggle.id = 'soundToggle';
        soundToggle.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M12 1v6m0 6v6m4.22-10.22l4.24-4.24M6.34 6.34L2.1 2.1m17.8 17.8l-4.24-4.24M6.34 17.66l-4.24 4.24M23 12h-6m-6 0H1m20.24-4.24l-4.24 4.24M6.34 6.34l-4.24-4.24"/>
            </svg>
        `;
        document.body.appendChild(soundToggle);

        soundToggle.addEventListener('click', () => {
            if (isRainSoundPlaying) {
                stopRainSound();
                soundToggle.classList.remove('active');
            } else {
                startRainSound();
                soundToggle.classList.add('active');
            }
        });

        // Check if user has saved preferences
        const hasSavedPrefs = savedVolume !== null || savedPlaying !== null;
        
        // Auto-play rain sound: 
        // - If user has saved playing state and it was playing
        // - OR if user has no saved preferences (first time visit), play with default volume
        const shouldPlay = (savedPlaying === 'true' && state.rainSoundVolume > 0) || 
                          (!hasSavedPrefs && state.rainSoundVolume > 0);
        
        if (shouldPlay) {
            startRainSound();
            soundToggle.classList.add('active');
        }
    }

    function startRainSound() {
        localStorage.setItem('mood_dust_rain_playing', 'true');
        
        // Create single audio element - ONLY one source
        if (!rainAudio) {
            rainAudio = new Audio('https://lazyman.yixiaai.com/files/494617/d86da007-4234-482b-847f-991e1dd629c6.mp3');
            rainAudio.loop = true;
            rainAudio.crossOrigin = 'anonymous';
            rainAudio.volume = state.rainSoundVolume;
        }

        rainAudio.play().catch(err => {
            console.warn('Rain audio play failed:', err);
        });
        isRainSoundPlaying = true;
    }

    function stopRainSound() {
        localStorage.setItem('mood_dust_rain_playing', 'false');
        localStorage.setItem('mood_dust_rain_volume', state.rainSoundVolume.toString());
        
        if (rainAudio) {
            rainAudio.pause();
            rainAudio.currentTime = 0;
        }
        isRainSoundPlaying = false;
    }

    function updateRainSoundVolume() {
        localStorage.setItem('mood_dust_rain_volume', state.rainSoundVolume.toString());
        
        if (rainAudio) {
            rainAudio.volume = state.rainSoundVolume;
        }
        
        // Volume 0 = stop completely, no residual sound
        if (state.rainSoundVolume === 0) {
            stopRainSound();
            return;
        }
        
        // Volume > 0 and not playing = start
        if (!isRainSoundPlaying) {
            startRainSound();
        }
    }

    // Initialize
    init();
})();
