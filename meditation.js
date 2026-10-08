(function() {
    'use strict';

    // ============================================
    // MOOD MAP (matching main page)
    // ============================================
    const moodMap = {
        meditation: { symbol: '◈', name: 'Meditation', icon: 'https://lazyman.yixiaai.com/files/494450/1d86cb1d-554b-410c-8880-c259482e13d9.png', calmness: 5, energy: 1 },
        isolate: { symbol: '◉', name: 'Isolate', icon: 'https://lazyman.yixiaai.com/files/494450/70fca6f8-435b-4138-bae3-7bd41ea28f8f.png', calmness: 3, energy: 2 },
        confident: { symbol: '✦', name: 'I got it', icon: 'https://api.iconify.design/ic/baseline-wb-sunny.svg?color=%23333333', calmness: 4, energy: 4 },
        peaceful: { symbol: '', name: 'Peaceful', icon: 'https://lazyman.yixiaai.com/files/494450/8bede4d4-3727-44af-8ced-c94a8c25c7d2.png', calmness: 5, energy: 1 },
        reading: { symbol: '◐', name: 'Reading', icon: 'https://lazyman.yixiaai.com/files/494450/5bf62baa-97c6-4678-9f8d-ca1fe4f5271d.png', calmness: 4, energy: 2 },
        thinking: { symbol: '◑', name: 'Thinking', icon: 'https://lazyman.yixiaai.com/files/494450/bfaec81e-dff2-463b-8a60-9ab7a31c88b3.png', calmness: 3, energy: 3 },
        happy: { symbol: '✧', name: 'Happy', icon: 'https://lazyman.yixiaai.com/files/494450/99a7fad7-87c7-4b35-b47f-c6a24c09c7a6.png', calmness: 3, energy: 5 },
        sad: { symbol: '◒', name: 'Sad', icon: 'https://lazyman.yixiaai.com/files/494450/51c2121c-8c5f-4d80-814a-5764ca387807.png', calmness: 2, energy: 2 }
    };

    // ============================================
    // PRACTICE LIBRARY
    // ============================================
    const practices = [
        {
            id: 'deep-breathing',
            title: 'Deep Breathing',
            icon: 'wind',
            duration: '5 min',
            mood: ['sad', 'thinking', 'isolate'],
            description: 'A calming 4-7-8 breathing technique to center your mind',
            type: 'breathing',
            pattern: 'inhale',
            guidance: 'Close your eyes. Inhale slowly through your nose for 4 counts. Hold for 7 counts. Exhale through your mouth for 8 counts. Let each breath carry away the weight of the day.',
            music: 'https://lazyman.yixiaai.com/files/494790/43161dd8-e23d-417a-9092-939a70fd6f70.mp3', // Deep Meditation
            steps: [
                'Sit comfortably with your spine straight',
                'Close your eyes and relax your shoulders',
                'Breathe in through your nose for 4 seconds',
                'Hold gently for 7 seconds',
                'Release through your mouth for 8 seconds',
                'Repeat this cycle 4 times'
            ]
        },
        {
            id: 'box-breathing',
            title: 'Box Breathing',
            icon: 'square',
            duration: '3 min',
            mood: ['happy', 'confident'],
            description: 'A grounding technique used by Navy SEALs for focus',
            type: 'breathing',
            pattern: 'box',
            guidance: 'Visualize a square. Breathe in along the first edge, hold along the second, exhale along the third, and hold again along the fourth. Each side of the square is 4 seconds.',
            music: 'https://lazyman.yixiaai.com/files/494790/76d824bb-7a8a-4e66-99c1-ca9f132499ec.mp3', // Monda Meditation
            steps: [
                'Imagine a perfect square before you',
                'Inhale for 4 counts — move up the left edge',
                'Hold for 4 counts — travel across the top',
                'Exhale for 4 counts — move down the right edge',
                'Hold for 4 counts — travel across the bottom',
                'Continue for 3-5 complete squares'
            ]
        },
        {
            id: 'body-scan',
            title: 'Body Scan Meditation',
            icon: 'scan',
            duration: '10 min',
            mood: ['sad', 'isolate', 'thinking'],
            description: 'Progressive relaxation from head to toe',
            type: 'meditation',
            guidance: 'Lie back or sit comfortably. Starting from the crown of your head, slowly bring awareness to each part of your body. Notice sensations without judgment — tension, warmth, tingling. Let each area soften as you breathe into it.',
            music: 'https://lazyman.yixiaai.com/files/494790/56e89d34-2a82-44db-9172-2174b8e8b082.mp3', // Mountain Meditation
            steps: [
                'Lie down or sit in a comfortable position',
                'Bring awareness to the crown of your head',
                'Slowly move down: forehead, eyes, jaw',
                'Continue: neck, shoulders, chest',
                'Notice arms, hands, each finger',
                'Scan: belly, hips, legs, feet',
                'Rest in full body awareness'
            ]
        },
        {
            id: 'loving-kindness',
            title: 'Loving Kindness',
            icon: 'heart',
            duration: '8 min',
            mood: ['sad', 'peaceful', 'meditation'],
            description: 'Cultivate compassion for yourself and others',
            type: 'meditation',
            guidance: 'Silently repeat: "May I be happy. May I be healthy. May I be safe. May I live with ease." Then extend these wishes to a loved one, then to all beings. Feel the warmth of compassion expanding with each repetition.',
            music: 'https://lazyman.yixiaai.com/files/494790/62150d7a-e3f4-4f45-8fcb-9d08b3df3cc2.mp3', // Atlas Meditative
            steps: [
                'Sit with hands resting on your lap',
                'Direct kindness to yourself first',
                'Repeat: "May I be happy, healthy, safe"',
                'Think of someone you love dearly',
                'Extend the same wishes to them',
                'Now extend to all living beings',
                'Rest in the feeling of connection'
            ]
        },
        {
            id: 'ocean-waves',
            title: 'Ocean Waves Relaxation',
            icon: 'wave',
            duration: '5 min',
            mood: ['sad', 'thinking', 'peaceful'],
            description: 'Visualize the rhythm of the ocean to find peace',
            type: 'relaxation',
            guidance: 'Imagine yourself standing on a quiet beach at dusk. The waves roll in with ancient rhythm — each one carrying away a worry. The sand is warm beneath your feet. The horizon glows with the last light. With each wave, you feel lighter.',
            music: 'https://lazyman.yixiaai.com/files/494790/ca16f6ba-9388-4b60-8505-09695afec595.mp3', // Leberch 523576
            visualType: 'wave'
        },
        {
            id: 'forest-walk',
            title: 'Forest Walk',
            icon: 'tree',
            duration: '7 min',
            mood: ['happy', 'confident', 'reading'],
            description: 'A guided visualization through a peaceful forest',
            type: 'relaxation',
            guidance: 'Picture yourself walking along a mossy path through an ancient forest. Sunlight filters through the canopy in golden shafts. You hear birds calling from hidden branches. The air smells of pine and damp earth. Each step takes you deeper into stillness.',
            music: 'https://lazyman.yixiaai.com/files/494790/bb2e045c-2794-46f1-9995-596ea0ad011a.mp3', // Leberch 510292
            visualType: 'forest'
        },
        {
            id: 'candle-flame',
            title: 'Candle Flame Gazing',
            icon: 'flame',
            duration: '5 min',
            mood: ['thinking', 'isolate', 'meditation'],
            description: 'Focus on a single point of light to calm the mind',
            type: 'meditation',
            guidance: 'Imagine a single candle flame dancing in the darkness. Watch it without trying to control it. When your mind wanders — and it will — gently return your gaze to the flame. Let it be the only thing that exists in this moment.',
            music: 'https://lazyman.yixiaai.com/files/494790/3e8b0db1-c4d8-43e4-8d29-3f022f5987b9.mp3', // Leberch 513747
            steps: [
                'Close your eyes and picture a candle',
                'Focus on the dancing flame',
                'When thoughts arise, return to the flame',
                'Notice the colors: blue at the base, gold at the top',
                'Let the flame fill your awareness',
                'When ready, gently open your eyes'
            ]
        },
        {
            id: 'cloud-watching',
            title: 'Cloud Watching',
            icon: 'cloud',
            duration: '6 min',
            mood: ['happy', 'peaceful', 'confident'],
            description: 'Let thoughts drift by like clouds in the sky',
            type: 'relaxation',
            guidance: 'Lie back in your mind\'s eye on a hill of soft grass. The sky above is vast and blue. Watch clouds drift across — some large, some wispy. Your thoughts are those clouds. Don\'t hold them. Don\'t push them away. Just watch them pass.',
            music: 'https://lazyman.yixiaai.com/files/494790/29f6f294-d3f4-49a9-a19c-f41c6b20beb5.mp3', // Leberch 509071
            visualType: 'cloud'
        }
    ];

    // ============================================
    // MOOD MESSAGES FOR RECOMMENDATION
    // ============================================
    const moodMessages = {
        sad: "The rain inside you is real. Let this practice be an umbrella — not to stop the rain, but to walk through it with grace.",
        thinking: "Your mind is a garden at night. This practice will help you tend to what grows there.",
        isolate: "Sometimes solitude is the soil where the deepest roots grow. This practice honors your need for space.",
        meditation: "You've already begun the journey inward. This practice is a companion for the path ahead.",
        peaceful: "The lake of your mind is calm today. Let this practice ripple outward gently.",
        happy: "Joy is a light that deserves to be tended. This practice will help you carry it forward.",
        confident: "You are standing tall. This practice will help you find stillness at the summit.",
        reading: "Words have taken you to another world. This practice will help you return to yourself."
    };

    // ============================================
    // AMBIENT MUSIC OPTIONS (for Timed Meditation)
    // ============================================
    const ambientMusic = [
        { id: 'deep-meditation', label: 'Deep Meditation', url: 'https://lazyman.yixiaai.com/files/494790/43161dd8-e23d-417a-9092-939a70fd6f70.mp3' },
        { id: 'monda-meditation', label: 'Monda Meditation', url: 'https://lazyman.yixiaai.com/files/494790/76d824bb-7a8a-4e66-99c1-ca9f132499ec.mp3' },
        { id: 'mountain-bg', label: 'Mountain Breeze', url: 'https://lazyman.yixiaai.com/files/494790/56e89d34-2a82-44db-9172-2174b8e8b082.mp3' },
        { id: 'atlas-meditative', label: 'Atlas Meditative', url: 'https://lazyman.yixiaai.com/files/494790/62150d7a-e3f4-4f45-8fcb-9d08b3df3cc2.mp3' },
        { id: 'leberch-523576', label: 'Leberch 523576', url: 'https://lazyman.yixiaai.com/files/494790/ca16f6ba-9388-4b60-8505-09695afec595.mp3' },
        { id: 'leberch-510292', label: 'Leberch 510292', url: 'https://lazyman.yixiaai.com/files/494790/bb2e045c-2794-46f1-9995-596ea0ad011a.mp3' },
        { id: 'leberch-513747', label: 'Leberch 513747', url: 'https://lazyman.yixiaai.com/files/494790/3e8b0db1-c4d8-43e4-8d29-3f022f5987b9.mp3' },
        { id: 'leberch-509071', label: 'Leberch 509071', url: 'https://lazyman.yixiaai.com/files/494790/29f6f294-d3f4-49a9-a19c-f41c6b20beb5.mp3' }
    ];

    // ============================================
    // STATE
    // ============================================
    let state = {
        currentMood: null,
        moodHistory: [],
        activePractice: null,
        isPlaying: false,
        timer: null,
        elapsed: 0,
        totalDuration: 0,
        breathingPhase: 0,
        breathingInterval: null,
        rainEnabled: true,
        rainSoundVolume: 0.3,
        timedMinutes: 5,
        timedElapsed: 0,
        timedIsRunning: false,
        timedTimer: null,
        timedMusicUrl: null
    };

    // Rain audio variables
    let rainAudio = null;
    let isRainSoundPlaying = false;

    // ============================================
    // DOM ELEMENTS
    // ============================================
    const elements = {
        currentMoodIcon: document.getElementById('currentMoodIcon'),
        currentMoodName: document.getElementById('currentMoodName'),
        moodMessage: document.getElementById('moodMessage'),
        moodStatsGrid: document.getElementById('moodStatsGrid'),
        practiceTitle: document.getElementById('practiceTitle'),
        practiceDuration: document.getElementById('practiceDuration'),
        practiceGuidance: document.getElementById('practiceGuidance'),
        practiceCard: document.getElementById('practiceCard'),
        startPracticeBtn: document.getElementById('startPracticeBtn'),
        playerSection: document.getElementById('playerSection'),
        playerTitle: document.getElementById('playerTitle'),
        closePlayerBtn: document.getElementById('closePlayerBtn'),
        breathingGuide: document.getElementById('breathingGuide'),
        breathingRing: document.getElementById('breathingRing'),
        breathingText: document.getElementById('breathingText'),
        breathingInstruction: document.getElementById('breathingInstruction'),
        meditationGuide: document.getElementById('meditationGuide'),
        meditationText: document.getElementById('meditationText'),
        meditationSteps: document.getElementById('meditationSteps'),
        relaxationGuide: document.getElementById('relaxationGuide'),
        relaxationText: document.getElementById('relaxationText'),
        musicLabel: document.getElementById('musicLabel'),
        progressFill: document.getElementById('progressFill'),
        timeDisplay: document.getElementById('timeDisplay'),
        playPauseBtn: document.getElementById('playPauseBtn'),
        resetBtn: document.getElementById('resetBtn'),
        practicesGrid: document.getElementById('practicesGrid'),
        pageRainToggle: null,
        vibeMixerToggle: document.getElementById('vibeMixerToggle'),
        vibeMixerPanel: document.getElementById('vibeMixerPanel'),
        rainSoundSlider: document.getElementById('rainSoundSlider'),
        meditationAudio: document.getElementById('meditationAudio'),
        timedAudio: document.getElementById('timedAudio'),
        miniAudio: document.getElementById('miniAudio'),
        // Timed meditation elements
        timedDisplay: document.getElementById('timedDisplay'),
        timedStartBtn: document.getElementById('timedStartBtn'),
        timedResetBtn: document.getElementById('timedResetBtn'),
        timedMusicLabel: document.getElementById('timedMusicLabel')
    };

    // ============================================
    // LOAD MOOD DATA FROM LOCALSTORAGE + API
    // ============================================
    async function loadMoodData() {
        try {
            // 1. Get current mood from real-time localStorage key (set by main page)
            const currentMoodData = localStorage.getItem('mood_dust_current_mood');
            if (currentMoodData) {
                const parsed = JSON.parse(currentMoodData);
                state.currentMood = parsed.mood;
            }

            // 2. Get this month's mood stats from diary data
            const rawData = localStorage.getItem('mood_dust_data');
            if (!rawData) return;

            const allData = JSON.parse(rawData);
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            const monthEntries = [];
            const diaries = allData.diaries || allData;
            Object.keys(diaries).forEach(dateKey => {
                const entry = diaries[dateKey];
                if (entry && entry.mood) {
                    // Parse dateKey directly to avoid timezone issues
                    // dateKey format: YYYY-MM-DD
                    const parts = dateKey.split('-');
                    if (parts.length === 3) {
                        const entryYear = parseInt(parts[0]);
                        const entryMonth = parseInt(parts[1]) - 1; // JS months are 0-indexed

                        if (entryMonth === currentMonth && entryYear === currentYear) {
                            monthEntries.push({
                                date: dateKey,
                                mood: entry.mood,
                                timestamp: new Date(entryYear, entryMonth, parseInt(parts[2]))
                            });
                        }
                    }
                }
            });

            state.moodHistory = monthEntries;

            // 3. 尝试从后端API同步数据
            if (window.DiaryAPI && localStorage.getItem('mood_dust_logged_in') === 'true') {
                const result = await DiaryAPI.getMoodHistory(currentYear, currentMonth);
                if (result.success && result.data && result.data.length > 0) {
                    // 合并后端数据
                    const apiEntries = result.data.map(e => ({
                        date: e.date,
                        mood: e.mood,
                        timestamp: new Date(e.date)
                    }));
                    state.moodHistory = apiEntries;
                }
            }
        } catch (e) {
            console.warn('Failed to load mood data:', e);
        }
    }

    // ============================================
    // RENDER CURRENT MOOD
    // ============================================
    function renderCurrentMood() {
        if (!state.currentMood || !moodMap[state.currentMood]) {
            elements.currentMoodName.textContent = 'No mood logged yet';
            elements.moodMessage.textContent = 'Start your journey by logging your mood in the journal.';
            return;
        }

        const mood = moodMap[state.currentMood];
        elements.currentMoodIcon.src = mood.icon;
        elements.currentMoodName.textContent = mood.name;
        elements.moodMessage.textContent = moodMessages[state.currentMood] || 'Breathe. You are exactly where you need to be.';
    }

    // ============================================
    // RENDER MOOD STATS (Matches main page Monthly Mood)
    // ============================================
    function renderMoodStats() {
        if (state.moodHistory.length === 0) {
            elements.moodStatsGrid.innerHTML = '<div class="stat-item" style="grid-column: 1/-1;"><span class="stat-name">No entries this month</span></div>';
            return;
        }

        // Count moods
        const moodCounts = {};
        state.moodHistory.forEach(entry => {
            moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
        });

        // Find most frequent mood (same as main page Monthly Mood)
        const sorted = Object.entries(moodCounts).sort((a, b) => b[1] - a[1]);
        const [topMoodKey, topCount] = sorted[0];
        const topMood = moodMap[topMoodKey];

        let html = '';
        
        // Show most frequent mood prominently
        if (topMood) {
            html += `
                <div class="stat-item">
                    <img class="stat-icon" src="${topMood.icon}" alt="${topMood.name}">
                    <span class="stat-count">${topCount}</span>
                    <span class="stat-name">${topMood.name}</span>
                </div>
            `;
        }

        elements.moodStatsGrid.innerHTML = html;
    }

    // ============================================
    // RECOMMEND PRACTICE
    // ============================================
    function recommendPractice() {
        if (!state.currentMood) {
            return practices[0];
        }

        let bestPractice = null;
        let bestScore = -1;

        practices.forEach(practice => {
            let score = 0;

            if (practice.mood.includes(state.currentMood)) {
                score += 10;
            }

            score += Math.random() * 5;

            if (score > bestScore) {
                bestScore = score;
                bestPractice = practice;
            }
        });

        return bestPractice || practices[0];
    }

    // ============================================
    // RENDER RECOMMENDED PRACTICE
    // ============================================
    function renderRecommendedPractice() {
        const practice = recommendPractice();
        state.activePractice = practice;

        elements.practiceTitle.textContent = practice.title;
        elements.practiceDuration.textContent = practice.duration;
        elements.practiceGuidance.textContent = practice.guidance;
    }

    // ============================================
    // RENDER PRACTICE LIBRARY
    // ============================================
    function renderPracticeLibrary() {
        let html = '';
        practices.forEach(practice => {
            const moodNames = practice.mood.map(m => moodMap[m]?.name || m).join(', ');
            html += `
                <div class="practice-item" data-id="${practice.id}">
                    <div class="item-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M12 6v6l4 2"/>
                        </svg>
                    </div>
                    <div class="item-title">${practice.title}</div>
                    <div class="item-desc">${practice.description}</div>
                    <div class="item-meta">
                        <span class="item-duration">${practice.duration}</span>
                        <span class="item-mood">${moodNames}</span>
                    </div>
                    <div class="item-mini-player" data-id="${practice.id}">
                        <button class="mini-play-btn" data-music="${practice.music || ''}" data-title="${practice.title}">
                            <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" class="play-icon">
                                <polygon points="5,3 19,12 5,21"/>
                            </svg>
                        </button>
                        <span class="mini-music-title">${practice.music ? 'Listen' : ''}</span>
                    </div>
                </div>
            `;
        });

        elements.practicesGrid.innerHTML = html;

        document.querySelectorAll('.practice-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.item-mini-player') || e.target.closest('.mini-play-btn')) return;
                const practiceId = item.dataset.id;
                const practice = practices.find(p => p.id === practiceId);
                if (practice) {
                    state.activePractice = practice;
                    startPractice();
                }
            });
        });

        document.querySelectorAll('.mini-play-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const musicUrl = btn.dataset.music;
                const title = btn.dataset.title;
                toggleMiniPlayer(btn, musicUrl, title);
            });
        });
    }

    // Mini player state tracker
    let activeMiniBtn = null;

    function toggleMiniPlayer(btn, musicUrl, title) {
        // Stop all other mini player first
        if (activeMiniBtn && activeMiniBtn !== btn) {
            activeMiniBtn.classList.remove('playing');
            activeMiniBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none" class="play-icon"><polygon points="5,3 19,12 5,21"/></svg>`;
            const siblingTitle = activeMiniBtn.parentElement.querySelector('.mini-music-title');
            if (siblingTitle) siblingTitle.textContent = 'Listen';
        }
        // Stop mini audio
        if (elements.miniAudio) {
            elements.miniAudio.pause();
        }

        if (btn.classList.contains('playing')) {
            btn.classList.remove('playing');
            btn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none" class="play-icon"><polygon points="5,3 19,12 5,21"/></svg>`;
            const siblingTitle = btn.parentElement.querySelector('.mini-music-title');
            if (siblingTitle) siblingTitle.textContent = 'Listen';
            activeMiniBtn = null;
            return;
        }

        btn.classList.add('playing');
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none" class="pause-icon"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;
        const siblingTitle = btn.parentElement.querySelector('.mini-music-title');
        if (siblingTitle) siblingTitle.textContent = title;

        if (musicUrl) {
            elements.miniAudio.src = musicUrl;
            elements.miniAudio.load();
            elements.miniAudio.play().catch(err => console.warn('Mini player audio error:', err));
        }

        activeMiniBtn = btn;

        // Auto-reset when audio ends
        elements.miniAudio.onended = () => {
            btn.classList.remove('playing');
            btn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none" class="play-icon"><polygon points="5,3 19,12 5,21"/></svg>`;
            if (siblingTitle) siblingTitle.textContent = 'Listen';
            activeMiniBtn = null;
        };
    }

    // ============================================
    // START PRACTICE
    // ============================================
    function startPractice() {
        const practice = state.activePractice;
        if (!practice) return;

        elements.playerTitle.textContent = practice.title;
        elements.playerSection.classList.remove('hidden');

        stopAudio();

        if (practice.music) {
            elements.meditationAudio.src = practice.music;
            elements.meditationAudio.load();
            
            // 获取新文件名对应的标题
            const audioTitles = {
                '43161dd8-e23d-417a-9092-939a70fd6f70.mp3': 'Deep Meditation',
                '76d824bb-7a8a-4e66-99c1-ca9f132499ec.mp3': 'Monda Meditation',
                '56e89d34-2a82-44db-9172-2174b8e8b082.mp3': 'Mountain Breeze',
                '62150d7a-e3f4-4f45-8fcb-9d08b3df3cc2.mp3': 'Atlas Meditative',
                'ca16f6ba-9388-4b60-8505-09695afec595.mp3': 'Leberch 523576',
                'bb2e045c-2794-46f1-9995-596ea0ad011a.mp3': 'Leberch 510292',
                '3e8b0db1-c4d8-43e4-8d29-3f022f5987b9.mp3': 'Leberch 513747',
                '29f6f294-d3f4-49a9-a19c-f41c6b20beb5.mp3': 'Leberch 509071'
            };
            const fileName = practice.music.split('/').pop();
            elements.musicLabel.textContent = audioTitles[fileName] || practice.title + ' Music';
            elements.musicLabel.style.display = 'block';
        }

        elements.breathingGuide.classList.add('hidden');
        elements.meditationGuide.classList.add('hidden');
        elements.relaxationGuide.classList.add('hidden');

        const durationParts = practice.duration.split(' ');
        const minutes = parseInt(durationParts[0]);
        state.totalDuration = minutes * 60;
        state.elapsed = 0;
        state.isPlaying = false;

        updateProgress();

        if (practice.type === 'breathing') {
            elements.breathingGuide.classList.remove('hidden');
            elements.breathingInstruction.textContent = practice.guidance;
            if (practice.pattern === 'box') {
                startBoxBreathing();
            } else {
                startDeepBreathing();
            }
        } else if (practice.type === 'meditation') {
            elements.meditationGuide.classList.remove('hidden');
            elements.meditationText.textContent = practice.guidance;

            let stepsHtml = '';
            practice.steps.forEach((step, i) => {
                stepsHtml += `
                    <div class="step-item" data-step="${i}">
                        <div class="step-number">${i + 1}</div>
                        <div class="step-text">${step}</div>
                    </div>
                `;
            });
            elements.meditationSteps.innerHTML = stepsHtml;
        } else if (practice.type === 'relaxation') {
            elements.relaxationGuide.classList.remove('hidden');
            elements.relaxationText.textContent = practice.guidance;
        }

        elements.playerSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Auto-start playback on user interaction (click on practice card)
        state.isPlaying = true;
        playAudio();
        updatePlayPauseButton();
    }

    // Update play/pause button icon
    function updatePlayPauseButton() {
        if (elements.playPauseBtn) {
            if (state.isPlaying) {
                elements.playPauseBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
                        <rect x="6" y="4" width="4" height="16"/>
                        <rect x="14" y="4" width="4" height="16"/>
                    </svg>
                `;
            } else {
                elements.playPauseBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
                        <polygon points="5,3 19,12 5,21"/>
                    </svg>
                `;
            }
        }
    }

    // ============================================
    // AUDIO CONTROLS
    // ============================================
    function playAudio() {
        if (elements.meditationAudio && elements.meditationAudio.src) {
            elements.meditationAudio.play().catch(err => {
                console.warn('Audio play failed:', err);
            });
        }
    }

    function pauseAudio() {
        if (elements.meditationAudio) {
            elements.meditationAudio.pause();
        }
    }

    function stopAudio() {
        if (elements.meditationAudio) {
            elements.meditationAudio.pause();
            elements.meditationAudio.currentTime = 0;
        }
        state.isPlaying = false;
        // Reset play button to play icon
        if (elements.playPauseBtn) {
            elements.playPauseBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <polygon points="5,3 19,12 5,21"/>
                </svg>
            `;
        }
    }

    function togglePlayPause() {
        // Must have an audio source loaded
        if (!elements.meditationAudio || !elements.meditationAudio.src) {
            return;
        }

        if (state.isPlaying) {
            // Currently playing -> Pause
            state.isPlaying = false;
            clearInterval(state.timer);
            pauseAudio();

            elements.playPauseBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <polygon points="5,3 19,12 5,21"/>
                </svg>
            `;
        } else {
            // Currently paused -> Play
            state.isPlaying = true;

            elements.playPauseBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <rect x="6" y="4" width="4" height="16"/>
                    <rect x="14" y="4" width="4" height="16"/>
                </svg>
            `;

            playAudio();

            state.timer = setInterval(() => {
                state.elapsed++;
                updateProgress();

                if (state.elapsed >= state.totalDuration) {
                    clearInterval(state.timer);
                    state.isPlaying = false;
                    pauseAudio();
                    elements.playPauseBtn.innerHTML = `
                        <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
                            <polygon points="5,3 19,12 5,21"/>
                        </svg>
                    `;
                }
            }, 1000);
        }
    }

    function resetPractice() {
        state.elapsed = 0;
        state.isPlaying = false;
        clearInterval(state.timer);
        stopAudio();
        updateProgress();

        const practice = state.activePractice;
        if (practice && practice.type === 'breathing') {
            clearTimeout(state.breathingInterval);
            if (practice.pattern === 'box') {
                startBoxBreathing();
            } else {
                startDeepBreathing();
            }
        }

        elements.playPauseBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <polygon points="5,3 19,12 5,21"/>
            </svg>
        `;
    }

    // ============================================
    // DEEP BREATHING (4-7-8)
    // ============================================
    function startDeepBreathing() {
        const phases = [
            { text: 'Breathe In', class: 'inhale', duration: 4000 },
            { text: 'Hold', class: '', duration: 7000 },
            { text: 'Breathe Out', class: 'exhale', duration: 8000 }
        ];

        let phaseIndex = 0;

        function runPhase() {
            const phase = phases[phaseIndex];
            elements.breathingText.textContent = phase.text;
            elements.breathingRing.className = 'circle-ring ' + phase.class;

            phaseIndex = (phaseIndex + 1) % phases.length;
            state.breathingInterval = setTimeout(runPhase, phase.duration);
        }

        runPhase();
    }

    // ============================================
    // BOX BREATHING (4-4-4-4)
    // ============================================
    function startBoxBreathing() {
        const phases = [
            { text: 'Breathe In', class: 'inhale', duration: 4000 },
            { text: 'Hold', class: '', duration: 4000 },
            { text: 'Breathe Out', class: 'exhale', duration: 4000 },
            { text: 'Hold', class: '', duration: 4000 }
        ];

        let phaseIndex = 0;

        function runPhase() {
            const phase = phases[phaseIndex];
            elements.breathingText.textContent = phase.text;
            elements.breathingRing.className = 'circle-ring ' + phase.class;

            phaseIndex = (phaseIndex + 1) % phases.length;
            state.breathingInterval = setTimeout(runPhase, phase.duration);
        }

        runPhase();
    }

    // ============================================
    // PLAYER CONTROLS
    // ============================================
    function updateProgress() {
        const progress = state.totalDuration > 0 ? (state.elapsed / state.totalDuration) * 100 : 0;
        elements.progressFill.style.width = progress + '%';

        const mins = Math.floor(state.elapsed / 60);
        const secs = state.elapsed % 60;
        elements.timeDisplay.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // ============================================
    // TIMED MEDITATION
    // ============================================
    function updateTimedDisplay() {
        const mins = Math.floor(state.timedMinutes - state.timedElapsed / 60);
        const secs = state.timedMinutes * 60 - state.timedElapsed;
        const displayMins = Math.max(0, Math.floor(secs / 60));
        const displaySecs = Math.max(0, secs % 60);
        elements.timedDisplay.textContent = `${displayMins}:${displaySecs.toString().padStart(2, '0')}`;
    }

    function startTimedMeditation() {
        if (state.timedIsRunning) {
            // Pause
            state.timedIsRunning = false;
            clearInterval(state.timedTimer);
            elements.timedStartBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <polygon points="5,3 19,12 5,21"/>
                </svg>
                Resume
            `;
            // Stop audio
            if (elements.timedAudio) {
                elements.timedAudio.pause();
            }
            return;
        }

        // Start / Resume
        state.timedIsRunning = true;
        elements.timedStartBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <rect x="6" y="4" width="4" height="16"/>
                <rect x="14" y="4" width="4" height="16"/>
            </svg>
            Pause
        `;

        // Load ambient music if selected
        if (state.timedMusicUrl) {
            elements.timedAudio.src = state.timedMusicUrl;
            elements.timedAudio.load();
            elements.timedAudio.play().catch(err => {
                console.warn('Timed meditation audio failed:', err);
            });
        }

        state.timedTimer = setInterval(() => {
            state.timedElapsed++;
            updateTimedDisplay();

            if (state.timedElapsed >= state.timedMinutes * 60) {
                clearInterval(state.timedTimer);
                state.timedIsRunning = false;
                if (elements.timedAudio) {
                    elements.timedAudio.pause();
                }
                elements.timedStartBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
                        <polygon points="5,3 19,12 5,21"/>
                    </svg>
                    Start
                `;
                elements.timedMusicLabel.textContent = 'Session complete ✦';
            }
        }, 1000);
    }

    function resetTimedMeditation() {
        clearInterval(state.timedTimer);
        state.timedIsRunning = false;
        state.timedElapsed = 0;
        updateTimedDisplay();

        elements.timedStartBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <polygon points="5,3 19,12 5,21"/>
            </svg>
            Start
        `;

        if (elements.timedAudio) {
            elements.timedAudio.pause();
            elements.timedAudio.currentTime = 0;
        }

        elements.timedMusicLabel.textContent = 'Select ambient music';
    }

    function renderMusicSelector() {
        let html = '';
        ambientMusic.forEach(music => {
            const isActive = state.timedMusicUrl === music.url ? ' active' : '';
            html += `<button class="music-option${isActive}" data-url="${music.url}">${music.label}</button>`;
        });

        const musicContainer = document.createElement('div');
        musicContainer.className = 'timed-music-selector';
        musicContainer.id = 'timedMusicSelector';
        musicContainer.innerHTML = html;

        const label = elements.timedMusicLabel;
        if (label && !label.nextSibling) {
            label.parentNode.insertBefore(musicContainer, label.nextSibling);
        }

        document.querySelectorAll('.music-option').forEach(btn => {
            btn.addEventListener('click', () => {
                state.timedMusicUrl = btn.dataset.url;
                document.querySelectorAll('.music-option').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const musicName = btn.textContent;
                elements.timedMusicLabel.textContent = musicName;
            });
        });
    }

    // ============================================
    // RAIN EFFECT
    // ============================================
    function initRain() {
        const canvas = document.getElementById('rainCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const drops = [];
        const dropCount = 100;

        for (let i = 0; i < dropCount; i++) {
            drops.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                length: Math.random() * 20 + 10,
                speed: Math.random() * 3 + 2,
                opacity: Math.random() * 0.3 + 0.1
            });
        }

        function animate() {
            if (!state.rainEnabled) {
                requestAnimationFrame(animate);
                return;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            drops.forEach(drop => {
                ctx.beginPath();
                ctx.moveTo(drop.x, drop.y);
                ctx.lineTo(drop.x, drop.y + drop.length);
                ctx.strokeStyle = `rgba(160, 200, 160, ${drop.opacity})`;
                ctx.lineWidth = 1;
                ctx.stroke();

                drop.y += drop.speed;
                if (drop.y > canvas.height) {
                    drop.y = -drop.length;
                    drop.x = Math.random() * canvas.width;
                }
            });

            requestAnimationFrame(animate);
        }

        animate();

        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
    }

    // ============================================
    // RAIN SOUND MANAGEMENT (Synced with Home Page)
    // ============================================
    const RAIN_VOLUME_KEY = 'mood_dust_rain_volume';
    const RAIN_PLAYING_KEY = 'mood_dust_rain_playing';

    function initRainSound() {
        // Read state from localStorage (synced with home page)
        const savedVolume = localStorage.getItem(RAIN_VOLUME_KEY);
        const savedPlaying = localStorage.getItem(RAIN_PLAYING_KEY);
        
        // Only restore volume if explicitly saved, default to 0 (off)
        state.rainSoundVolume = savedVolume !== null ? parseFloat(savedVolume) : 0;
        
        // Set slider to saved volume
        if (elements.rainSoundSlider) {
            elements.rainSoundSlider.value = state.rainSoundVolume * 100;
        }

        // Only start rain if it was explicitly playing AND volume > 0
        if (savedPlaying === 'true' && state.rainSoundVolume > 0) {
            startRainSound();
        }
    }

    function startRainSound() {
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
        localStorage.setItem(RAIN_PLAYING_KEY, 'true');
    }

    function stopRainSound() {
        if (rainAudio) {
            rainAudio.pause();
            rainAudio.currentTime = 0;
        }
        isRainSoundPlaying = false;
        localStorage.setItem(RAIN_PLAYING_KEY, 'false');
    }

    function updateRainSoundVolume() {
        // Update slider
        if (elements.rainSoundSlider) {
            elements.rainSoundSlider.value = state.rainSoundVolume * 100;
        }

        localStorage.setItem(RAIN_VOLUME_KEY, state.rainSoundVolume.toString());
        
        // If volume is 0, completely stop and mute the rain
        if (state.rainSoundVolume === 0) {
            if (rainAudio) {
                rainAudio.volume = 0;  // Mute first to ensure silence
                rainAudio.pause();
                rainAudio.currentTime = 0;
            }
            isRainSoundPlaying = false;
            localStorage.setItem(RAIN_PLAYING_KEY, 'false');
            return;
        }
        
        // Set volume on existing audio
        if (rainAudio) {
            rainAudio.volume = state.rainSoundVolume;
        }
        
        // If not playing, start
        if (!isRainSoundPlaying) {
            startRainSound();
        }
    }

    function bindRainSoundEvents() {
        // Toggle panel
        if (elements.vibeMixerToggle && elements.vibeMixerPanel) {
            elements.vibeMixerToggle.addEventListener('click', () => {
                elements.vibeMixerPanel.classList.toggle('show');
            });

            // Close panel when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.vibe-mixer') && elements.vibeMixerPanel.classList.contains('show')) {
                    elements.vibeMixerPanel.classList.remove('show');
                }
            });
        }

        // Volume slider
        if (elements.rainSoundSlider) {
            elements.rainSoundSlider.addEventListener('input', (e) => {
                state.rainSoundVolume = parseInt(e.target.value) / 100;
                updateRainSoundVolume();
            });
        }
    }

    // ============================================
    // MOOD CHART
    // ============================================
    function renderMoodChart() {
        const canvas = elements.moodChart;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        if (state.moodHistory.length === 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.font = '14px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('No mood data yet', width / 2, height / 2);
            return;
        }

        const moodValues = {
            meditation: 5, isolate: 3, confident: 4, peaceful: 5,
            reading: 4, thinking: 3, happy: 5, sad: 1
        };

        const last7 = state.moodHistory.slice(-7).reverse();

        if (last7.length < 2) {
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.font = '14px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Log more moods to see your journey', width / 2, height / 2);
            return;
        }

        const padding = 40;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;

        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            const y = padding + (chartHeight / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }

        const stepX = chartWidth / (last7.length - 1);

        ctx.beginPath();
        ctx.strokeStyle = 'rgba(160, 200, 160, 0.6)';
        ctx.lineWidth = 2;

        last7.forEach((entry, i) => {
            const x = padding + stepX * i;
            const value = moodValues[entry.mood] || 3;
            const y = padding + chartHeight - (value / 5) * chartHeight;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }

            ctx.fillStyle = 'rgba(160, 200, 160, 0.8)';
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.font = '10px Inter, sans-serif';
            ctx.textAlign = 'center';
            const date = new Date(entry.date);
            ctx.fillText(`${date.getMonth() + 1}/${date.getDate()}`, x, height - 10);
        });

        ctx.stroke();
    }

    // ============================================
    // EVENT BINDINGS
    // ============================================
    function bindEvents() {
        // Start practice button
        elements.startPracticeBtn.addEventListener('click', startPractice);

        // Close player
        elements.closePlayerBtn.addEventListener('click', () => {
            elements.playerSection.classList.add('hidden');
            clearInterval(state.timer);
            clearTimeout(state.breathingInterval);
            state.isPlaying = false;
            stopAudio();
        });

        // Play/Pause
        elements.playPauseBtn.addEventListener('click', togglePlayPause);

        // Reset
        elements.resetBtn.addEventListener('click', resetPractice);

        // Timed meditation: preset buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.timedMinutes = parseInt(btn.dataset.minutes);
                state.timedElapsed = 0;
                resetTimedMeditation();
            });
        });

        // Timed meditation: start button
        elements.timedStartBtn.addEventListener('click', startTimedMeditation);

        // Timed meditation: reset button
        elements.timedResetBtn.addEventListener('click', resetTimedMeditation);
    }

    // ============================================
    // INIT
    // ============================================
    function init() {
        loadMoodData();
        renderCurrentMood();
        renderMoodStats();
        renderRecommendedPractice();
        renderPracticeLibrary();
        // renderMoodChart(); // Removed - Mood Journey section deleted
        initRain();
        updateTimedDisplay();
        renderMusicSelector();
        initRainSound();  // Sync rain sound with home page
        bindEvents();
        bindRainSoundEvents();  // Bind rain sound controls
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
