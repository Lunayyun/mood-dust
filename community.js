(function() {
    'use strict';

    // ============================================
    // DATA LAYER (localStorage based)
    // ============================================
    const STORAGE_KEY = 'mood_dust_community';

    function getPosts() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        } catch {
            return [];
        }
    }

    function savePosts(posts) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    }

    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    }

    function timeAgo(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return 'just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    }

    // ============================================
    // USER IDENTITY (from main page authentication)
    // ============================================
    function getCurrentUser() {
        // Matches the USER_KEY in script.js: 'mood_dust_user'
        return localStorage.getItem('mood_dust_user') || null;
    }

    function getDisplayName() {
        const user = getCurrentUser();
        return user || 'Guest';
    }

    // ============================================
    // STATE
    // ============================================
    let state = {
        isAnonymous: false,  // Default to real name
        tags: [],
        posts: [],
        activeFilter: null,
        sortOrder: 'newest',
        replyToComment: null
    };

    // ============================================
    // DOM ELEMENTS
    // ============================================
    const elements = {
        anonSwitch: document.getElementById('anonSwitch'),
        anonToggle: document.getElementById('anonToggle'),
        postTextarea: document.getElementById('postTextarea'),
        submitBtn: document.getElementById('submitBtn'),
        tagInput: document.getElementById('tagInput'),
        tagPreview: document.getElementById('tagPreview'),
        tagFilterBar: document.getElementById('tagFilterBar'),
        tagFilterList: document.getElementById('tagFilterList'),
        feedList: document.getElementById('feedList'),
        feedEmpty: document.getElementById('feedEmpty'),
        feedSort: document.getElementById('feedSort'),
        communitySearch: document.getElementById('communitySearch'),
        vibeMixerToggle: document.getElementById('vibeMixerToggle'),
        vibeMixerPanel: document.getElementById('vibeMixerPanel'),
        rainSoundSlider: document.getElementById('rainSoundSlider'),
        quickTagsList: document.getElementById('quickTagsList')
    };

    function normalizePost(post) {
        return {
            ...post,
            id: String(post.id),
            tags: Array.isArray(post.tags) ? post.tags : [],
            comments: Array.isArray(post.comments) ? post.comments : [],
            likes_count: Number(post.likes_count || 0),
            comments_count: Number(post.comments_count || 0),
            liked: Boolean(post.liked),
            favorited: Boolean(post.favorited),
            timestamp: post.timestamp ? new Date(post.timestamp).getTime() : Date.now()
        };
    }

    function showFeedback(message, isError = false) {
        let feedback = document.getElementById('communityFeedback');
        if (!feedback) {
            feedback = document.createElement('div');
            feedback.id = 'communityFeedback';
            feedback.style.cssText = 'position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:100;padding:10px 16px;border:1px solid rgba(255,255,255,.15);border-radius:8px;background:rgba(12,16,12,.92);color:#fff;font-size:13px;';
            document.body.appendChild(feedback);
        }
        feedback.textContent = message;
        feedback.style.borderColor = isError ? 'rgba(230,120,120,.65)' : 'rgba(160,200,160,.65)';
        clearTimeout(feedback._timer);
        feedback._timer = setTimeout(() => feedback.remove(), 3200);
    }

    function requireLogin() {
        if (!localStorage.getItem('mood_dust_token')) {
            showFeedback('Please log in to use this feature.', true);
            return false;
        }
        return true;
    }

    // Rain audio variables
    let rainAudio = null;
    let rainSoundVolume = 0.3;

    // ============================================
    // RAIN CANVAS (Background)
    // ============================================
    function initRain() {
        const canvas = document.getElementById('rainCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const drops = [];
        const dropCount = 80;

        for (let i = 0; i < dropCount; i++) {
            drops.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                length: Math.random() * 15 + 8,
                speed: Math.random() * 2 + 1,
                opacity: Math.random() * 0.2 + 0.05
            });
        }

        function animate() {
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
    // ANONYMOUS TOGGLE
    // ============================================
    function toggleAnonymous() {
        state.isAnonymous = !state.isAnonymous;
        elements.anonSwitch.classList.toggle('active', state.isAnonymous);
    }

    // ============================================
    // TAG MANAGEMENT (Composer)
    // ============================================
    function addTag(tag) {
        tag = tag.trim().toLowerCase().replace(/\s+/g, '-');
        if (tag && !state.tags.includes(tag) && state.tags.length < 5) {
            state.tags.push(tag);
            renderTagPreview();
        }
    }

    function removeTag(tag) {
        state.tags = state.tags.filter(t => t !== tag);
        renderTagPreview();
    }

    function renderTagPreview() {
        elements.tagPreview.innerHTML = state.tags.map(tag => `
            <span class="tag-chip">
                #${tag}
                <span class="tag-chip-remove" data-tag="${tag}">×</span>
            </span>
        `).join('');

        // Bind remove events
        elements.tagPreview.querySelectorAll('.tag-chip-remove').forEach(btn => {
            btn.addEventListener('click', () => removeTag(btn.dataset.tag));
        });

        // Update quick tags state
        renderQuickTags();
    }

    // ============================================
    // QUICK TAGS (Popular Tags for Easy Adding)
    // ============================================
    const DEFAULT_QUICK_TAGS = ['mindfulness', 'peace', 'meditation', 'nature', 'mood', 'growth', 'gratitude', 'reflection', 'rain', 'calm'];

    function getQuickTags() {
        // Get popular tags from posts, fallback to defaults
        const popular = getPopularTags();
        if (popular.length > 0) {
            return popular.slice(0, 8);
        }
        return DEFAULT_QUICK_TAGS;
    }

    function renderQuickTags() {
        if (!elements.quickTagsList) return;

        const quickTags = getQuickTags();
        elements.quickTagsList.innerHTML = quickTags.map(tag => {
            const isAdded = state.tags.includes(tag);
            return `<button class="quick-tag${isAdded ? ' added' : ''}" data-tag="${tag}">#${tag}</button>`;
        }).join('');

        // Bind click events
        elements.quickTagsList.querySelectorAll('.quick-tag').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!btn.classList.contains('added')) {
                    addTag(btn.dataset.tag);
                }
            });
        });
    }

    // ============================================
    // TAG FILTER (Popular Tags)
    // ============================================
    function getPopularTags() {
        const tagCounts = {};
        state.posts.forEach(post => {
            post.tags.forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        });

        return Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 12)
            .map(([tag]) => tag);
    }

    function renderTagFilters() {
        const tags = getPopularTags();
        if (tags.length === 0) {
            elements.tagFilterBar.style.display = 'none';
            return;
        }

        elements.tagFilterBar.style.display = 'block';
        let html = '<button class="filter-tag' + (!state.activeFilter ? ' active' : '') + '" data-tag="">All</button>';
        tags.forEach(tag => {
            const isActive = state.activeFilter === tag ? ' active' : '';
            html += `<button class="filter-tag${isActive}" data-tag="${tag}">#${tag}</button>`;
        });

        elements.tagFilterList.innerHTML = html;

        // Bind click events
        elements.tagFilterList.querySelectorAll('.filter-tag').forEach(btn => {
            btn.addEventListener('click', () => {
                state.activeFilter = btn.dataset.tag || null;
                renderFeed();
            });
        });
    }

    // ============================================
    // POST CREATION
    // ============================================
    async function createPost() {
        const content = elements.postTextarea.value.trim();
        if (!content) return;
        if (!requireLogin()) return;
        elements.submitBtn.disabled = true;
        const result = await CommunityAPI.createPost(content, state.isAnonymous, state.tags);
        if (!result.success) {
            showFeedback(result.error || 'Unable to publish post.', true);
            updateSubmitBtn();
            return;
        }
        state.posts.unshift(normalizePost(result.data));
        savePosts(state.posts);
        showFeedback('Post published.');

        // Reset composer
        elements.postTextarea.value = '';
        state.tags = [];
        renderTagPreview();
        updateSubmitBtn();
        renderTagFilters();
        renderFeed();
    }

    function updateSubmitBtn() {
        const hasContent = elements.postTextarea.value.trim().length > 0;
        elements.submitBtn.disabled = !hasContent;
    }

    // ============================================
    // LIKES
    // ============================================
    async function toggleLike(postId) {
        const post = state.posts.find(p => p.id === postId);
        if (!post) return;
        if (!requireLogin()) return;
        const result = await CommunityAPI.toggleLike(postId);
        if (!result.success) {
            showFeedback(result.error || 'Unable to update like.', true);
            return;
        }
        post.liked = result.data.liked;
        post.likes_count = result.data.likes_count;
        savePosts(state.posts);
        renderFeed();
    }

    // ============================================
    // DELETE POST (Author only)
    // ============================================
    async function deletePost(postId) {
        if (!requireLogin() || !confirm('Delete this post?')) return;
        const result = await CommunityAPI.deletePost(postId);
        if (!result.success) {
            showFeedback(result.error || 'Unable to delete post.', true);
            return;
        }

        state.posts = state.posts.filter(p => p.id !== postId);
        savePosts(state.posts);
        renderTagFilters();
        renderFeed();
    }

    function canDeletePost(post) {
        const currentUserId = localStorage.getItem('mood_dust_user_id');
        return Boolean(currentUserId && String(post.user_id) === String(currentUserId));
    }

    // ============================================
    // FEED RENDERING
    // ============================================
    async function addComment(postId, content, replyToCommentId = null) {
        const post = state.posts.find(p => p.id === postId);
        if (!post || !content.trim()) return;
        if (!requireLogin()) return;
        const result = await CommunityAPI.addComment(postId, content.trim(), state.isAnonymous, replyToCommentId);
        if (!result.success) {
            showFeedback(result.error || 'Unable to add comment.', true);
            return;
        }
        post.comments_count += 1;
        post.comments = post.comments || [];
        if (replyToCommentId) {
            const parent = post.comments.find(comment => String(comment.id) === String(replyToCommentId));
            if (parent) {
                parent.replies = parent.replies || [];
                parent.replies.push(result.data);
            }
        } else {
            post.comments.push(result.data);
        }
        state.replyToComment = null;
        savePosts(state.posts);
        renderFeed();
    }

    function toggleComments(postId) {
        const section = document.querySelector(`.comments-section[data-post-id="${postId}"]`);
        if (section) {
            section.classList.toggle('expanded');
        }
    }

    // ============================================
    // FEED RENDERING
    // ============================================
    function getSortedPosts() {
        let posts = [...state.posts];

        // Filter by tag
        if (state.activeFilter) {
            posts = posts.filter(post => post.tags.includes(state.activeFilter));
        }

        // Sort
        if (state.sortOrder === 'popular') {
            posts.sort((a, b) => b.likes_count - a.likes_count);
        } else {
            posts.sort((a, b) => b.timestamp - a.timestamp);
        }

        return posts;
    }

    function renderFeed() {
        const posts = getSortedPosts();

        if (posts.length === 0) {
            elements.feedList.innerHTML = '';
            elements.feedEmpty.style.display = 'block';
            return;
        }

        elements.feedEmpty.style.display = 'none';

        elements.feedList.innerHTML = posts.map(post => {
            const isLiked = post.liked;
            const likeCount = post.likes_count;
            const commentCount = post.comments_count || post.comments.reduce((sum, c) => sum + 1 + (c.replies || []).length, 0);
            const isOwner = canDeletePost(post);

            return `
                <article class="post-card" data-post-id="${post.id}">
                    <!-- Post Header -->
                    <div class="post-header">
                        <div class="post-author">
                            <div class="post-avatar ${post.isAnonymous ? 'anon' : ''}">
                                ${post.isAnonymous ? '○' : '◈'}
                            </div>
                            <div class="post-author-info">
                                <span class="post-author-name ${post.isAnonymous ? 'anon' : ''}">
                                    ${post.isAnonymous ? 'Anonymous' : post.author}
                                </span>
                                <span class="post-time">${timeAgo(post.timestamp)}</span>
                            </div>
                        </div>
                        ${isOwner ? `
                            <button class="post-delete-btn" data-post-id="${post.id}" title="Delete post">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14">
                                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                </svg>
                            </button>
                        ` : ''}
                        <button class="post-report-btn" data-report-post-id="${post.id}" title="Report post">!</button>
                    </div>

                    <!-- Post Content -->
                    <div class="post-content">${escapeHtml(post.content)}</div>

                    <!-- Post Tags -->
                    ${post.tags.length > 0 ? `
                        <div class="post-tags">
                            ${post.tags.map(tag => `<span class="post-tag" data-tag="${escapeHtml(tag)}">#${escapeHtml(tag)}</span>`).join('')}
                        </div>
                    ` : ''}

                    <!-- Post Actions -->
                    <div class="post-actions">
                        <button class="post-action-btn like-btn ${isLiked ? 'liked' : ''}" data-post-id="${post.id}">
                            <svg viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.5">
                                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                            </svg>
                            <span>${likeCount}</span>
                        </button>
                        <button class="post-action-btn comment-toggle-btn" data-post-id="${post.id}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                            </svg>
                            <span>${commentCount}</span>
                        </button>
                        <button class="post-action-btn favorite-btn ${post.favorited ? 'liked' : ''}" data-post-id="${post.id}">
                            <span>${post.favorited ? 'Saved' : 'Save'}</span>
                        </button>
                    </div>

                    <!-- Comments Section -->
                    <div class="comments-section" data-post-id="${post.id}">
                        <div class="comments-list">
                            ${(post.comments || []).map(comment => renderComment(comment)).join('')}
                        </div>
                        <div class="comment-input-area">
                            <input type="text" class="comment-input" placeholder="Write a reply..." data-post-id="${post.id}">
                            <button class="comment-submit" data-post-id="${post.id}">Send</button>
                        </div>
                    </div>
                </article>
            `;
        }).join('');

        // Bind events
        bindPostEvents();
    }

    function renderComment(comment, depth = 0) {
        const repliesHtml = (comment.replies || []).map(reply => renderComment(reply, depth + 1)).join('');

        return `
            <div class="comment-item" data-comment-id="${comment.id}">
                <div class="comment-header">
                    <div class="comment-avatar ${comment.isAnonymous ? 'anon' : ''}">
                        ${comment.isAnonymous ? '○' : '◈'}
                    </div>
                    <span class="comment-author ${comment.isAnonymous ? 'anon' : ''}">
                        ${comment.isAnonymous ? 'Anonymous' : comment.author}
                    </span>
                    <span class="comment-time">${timeAgo(comment.timestamp)}</span>
                </div>
                <div class="comment-content">${escapeHtml(comment.content)}</div>
                ${depth === 0 ? `
                    <button class="comment-reply-btn" data-comment-id="${comment.id}">Reply</button>
                ` : ''}
                ${repliesHtml ? `<div class="comment-replies">${repliesHtml}</div>` : ''}
            </div>
        `;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ============================================
    // EVENT BINDING
    // ============================================
    function bindPostEvents() {
        // Like buttons
        document.querySelectorAll('.like-btn').forEach(btn => {
            btn.addEventListener('click', () => toggleLike(btn.dataset.postId));
        });

        // Post delete buttons
        document.querySelectorAll('.post-delete-btn').forEach(btn => {
            btn.addEventListener('click', () => deletePost(btn.dataset.postId));
        });

        // Comment toggle buttons
        document.querySelectorAll('.comment-toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => toggleComments(btn.dataset.postId));
        });

        // Comment submit buttons
        document.querySelectorAll('.comment-submit').forEach(btn => {
            btn.addEventListener('click', () => {
                const input = btn.parentElement.querySelector('.comment-input');
                if (input && input.value.trim()) {
                    addComment(btn.dataset.postId, input.value.trim(), state.replyToComment);
                }
            });
        });

        // Comment input - Enter to submit
        document.querySelectorAll('.comment-input').forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && input.value.trim()) {
                    const submitBtn = input.parentElement.querySelector('.comment-submit');
                    if (submitBtn) {
                        addComment(submitBtn.dataset.postId, input.value.trim(), state.replyToComment);
                    }
                }
            });
        });

        // Comment reply buttons
        document.querySelectorAll('.comment-reply-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const postId = btn.closest('.post-card').dataset.postId;
                const commentId = btn.dataset.commentId;
                state.replyToComment = commentId;
                const input = document.querySelector(`.comment-input[data-post-id="${postId}"]`);
                if (input) {
                    input.focus();
                    input.placeholder = 'Reply to comment...';
                }
            });
        });

        // Post tags (click to filter)
        document.querySelectorAll('.post-tag').forEach(tag => {
            tag.addEventListener('click', () => {
                state.activeFilter = tag.dataset.tag;
                renderTagFilters();
                renderFeed();
            });
        });

        document.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!requireLogin()) return;
                const result = await CommunityAPI.toggleFavorite(btn.dataset.postId);
                if (!result.success) {
                    showFeedback(result.error || 'Unable to save post.', true);
                    return;
                }
                const post = state.posts.find(item => String(item.id) === String(btn.dataset.postId));
                if (post) post.favorited = result.data.favorited;
                savePosts(state.posts);
                renderFeed();
            });
        });

        document.querySelectorAll('.post-report-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!requireLogin()) return;
                const reason = prompt('Reason for reporting this post:', 'Other');
                if (reason === null) return;
                const result = await CommunityAPI.reportPost(btn.dataset.reportPostId, reason);
                showFeedback(result.success ? 'Report submitted.' : (result.error || 'Unable to report post.'), !result.success);
            });
        });
    }

    function bindEvents() {
        // Anonymous toggle
        elements.anonToggle.addEventListener('click', toggleAnonymous);

        // Textarea input
        elements.postTextarea.addEventListener('input', updateSubmitBtn);

        // Tag input (Enter to add)
        elements.tagInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addTag(elements.tagInput.value);
                elements.tagInput.value = '';
            }
        });

        // Submit button
        elements.submitBtn.addEventListener('click', createPost);

        // Sort buttons
        elements.feedSort.querySelectorAll('.sort-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                state.sortOrder = btn.dataset.sort;
                elements.feedSort.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                loadPosts();
            });
        });

        if (elements.communitySearch) {
            let timer;
            elements.communitySearch.addEventListener('input', () => {
                clearTimeout(timer);
                timer = setTimeout(loadPosts, 250);
            });
        }
    }

    async function loadPosts() {
        const result = await CommunityAPI.getPosts(
            1,
            50,
            state.activeFilter,
            state.sortOrder === 'popular' ? 'likes' : 'newest',
            elements.communitySearch ? elements.communitySearch.value.trim() : ''
        );
        if (!result.success) {
            showFeedback(result.error || 'Unable to load community posts.', true);
            return;
        }
        state.posts = (result.data.posts || []).map(normalizePost);
        savePosts(state.posts);
        renderTagFilters();
        renderFeed();
    }

    // ============================================
    // SEED DEMO DATA (only if empty)
    // ============================================
    function seedDemoData() {
        if (state.posts.length > 0) return;

        const demoPosts = [
            {
                id: generateId(),
                content: 'Today I sat under the old oak tree and watched the clouds drift by. There\'s something beautiful about how they change shape without trying to be anything other than what they are. Reminds me to just be.',
                tags: ['mindfulness', 'nature', 'peace'],
                isAnonymous: true,
                author: 'Anonymous',
                timestamp: Date.now() - 3600000 * 2,
                likes: ['user_demo1', 'user_demo2'],
                comments: [
                    {
                        id: generateId(),
                        content: 'Beautiful reflection. Clouds are the best teachers.',
                        isAnonymous: false,
                        author: 'Zen Seeker',
                        timestamp: Date.now() - 3600000,
                        replies: [
                            {
                                id: generateId(),
                                content: 'Thank you for sharing this. I needed to hear this today.',
                                isAnonymous: true,
                                author: 'Anonymous',
                                timestamp: Date.now() - 1800000,
                                replies: []
                            }
                        ]
                    }
                ]
            },
            {
                id: generateId(),
                content: 'Started my meditation practice today. Only 5 minutes, but those 5 minutes felt like an eternity of calm. Small steps.',
                tags: ['meditation', 'beginner', 'growth'],
                isAnonymous: false,
                author: 'Zen Seeker',
                timestamp: Date.now() - 3600000 * 8,
                likes: ['user_demo1'],
                comments: []
            },
            {
                id: generateId(),
                content: 'The rain outside matches my mood today - gentle, steady, unbothered. Sometimes melancholy is its own kind of peace.',
                tags: ['rain', 'mood', 'peace'],
                isAnonymous: true,
                author: 'Anonymous',
                timestamp: Date.now() - 3600000 * 24,
                likes: ['user_demo1', 'user_demo2', 'user_demo3'],
                comments: [
                    {
                        id: generateId(),
                        content: 'Rain days are the best meditation days.',
                        isAnonymous: false,
                        author: 'Zen Seeker',
                        timestamp: Date.now() - 3600000 * 20,
                        replies: []
                    }
                ]
            }
        ];

        state.posts = demoPosts;
        savePosts(state.posts);
    }

    // ============================================
    // RAIN SOUND MANAGEMENT
    // ============================================
    const RAIN_VOLUME_KEY = 'mood_dust_rain_volume';
    const RAIN_PLAYING_KEY = 'mood_dust_rain_playing';
    let isRainSoundPlaying = false;

    function initRainSound() {
        // Restore from localStorage
        const savedVolume = localStorage.getItem(RAIN_VOLUME_KEY);
        const savedPlaying = localStorage.getItem(RAIN_PLAYING_KEY);
        
        rainSoundVolume = savedVolume !== null ? parseFloat(savedVolume) : 0.15;
        
        if (elements.rainSoundSlider) {
            elements.rainSoundSlider.value = rainSoundVolume * 100;
        }

        // Start rain if it was playing OR if no saved prefs (first visit)
        const hasSavedPrefs = savedVolume !== null || savedPlaying !== null;
        const shouldPlay = (savedPlaying === 'true' && rainSoundVolume > 0) || 
                          (!hasSavedPrefs && rainSoundVolume > 0);
        
        if (shouldPlay) {
            startRainAudio();
        }
    }

    function startRainAudio() {
        if (!rainAudio) {
            rainAudio = new Audio('https://lazyman.yixiaai.com/files/494617/d86da007-4234-482b-847f-991e1dd629c6.mp3');
            rainAudio.loop = true;
            rainAudio.crossOrigin = 'anonymous';
            rainAudio.volume = rainSoundVolume;
        }

        rainAudio.play().catch(() => {});
        isRainSoundPlaying = true;
        localStorage.setItem(RAIN_PLAYING_KEY, 'true');
    }

    function stopRainAudio() {
        if (rainAudio) {
            rainAudio.pause();
            rainAudio.currentTime = 0;
        }
        isRainSoundPlaying = false;
        localStorage.setItem(RAIN_PLAYING_KEY, 'false');
    }

    function updateRainSoundVolume() {
        if (rainAudio) {
            rainAudio.volume = rainSoundVolume;
        }
        localStorage.setItem(RAIN_VOLUME_KEY, rainSoundVolume.toString());

        if (rainSoundVolume === 0) {
            stopRainAudio();
        } else if (!isRainSoundPlaying) {
            startRainAudio();
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
                rainSoundVolume = parseInt(e.target.value) / 100;
                updateRainSoundVolume();
            });
        }
    }

    // ============================================
    // INIT
    // ============================================
    function init() {
        state.posts = getPosts().map(normalizePost);

        // Init anon switch state (default ON = anonymous)
        elements.anonSwitch.classList.toggle('active', state.isAnonymous);

        initRain();
        initRainSound();
        renderQuickTags();
        renderTagFilters();
        renderFeed();
        bindEvents();
        bindRainSoundEvents();
        loadPosts();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
