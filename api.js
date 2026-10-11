/**
 * MOOD DUST API 服务层
 * ====================
 * 封装所有后端 API 调用
 * 保留 localStorage 作为本地缓存
 */

const API_BASE = '/api';

function isStaticPages() {
    return window.location.hostname.endsWith('github.io');
}

function localAuthHash(value) {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i++) {
        hash ^= value.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16);
}

function localAuthToken(username) {
    return `local-${localAuthHash(`${username}:${Date.now()}:${Math.random()}`)}`;
}

function getLocalUsers() {
    try {
        return JSON.parse(localStorage.getItem('mood_dust_users') || '{}');
    } catch (e) {
        return {};
    }
}

function setLocalSession(username) {
    localStorage.setItem('mood_dust_token', localAuthToken(username));
    localStorage.setItem('mood_dust_user', username);
    localStorage.setItem('mood_dust_user_id', localAuthHash(username));
    localStorage.setItem('mood_dust_logged_in', 'true');
}

async function readApiResponse(res) {
    const type = res.headers.get('content-type') || '';
    if (!type.includes('application/json')) {
        return {
            success: false,
            error: isStaticPages()
                ? 'GitHub Pages is running in static mode. Please deploy the Flask backend to enable login.'
                : `Server returned HTTP ${res.status}`
        };
    }
    return await res.json();
}

// 获取 token
function getToken() {
    return localStorage.getItem('mood_dust_token');
}

// 获取请求头
function getHeaders() {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json'
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

// ==================== 认证 API ====================

const AuthAPI = {
    async register(username, password) {
        if (isStaticPages()) {
            const users = getLocalUsers();
            const normalizedUsername = username.trim();
            if (users[normalizedUsername]) {
                return { success: false, error: 'Username already exists.' };
            }
            users[normalizedUsername] = {
                password: localAuthHash(password),
                createdAt: new Date().toISOString()
            };
            localStorage.setItem('mood_dust_users', JSON.stringify(users));
            setLocalSession(normalizedUsername);
            return {
                success: true,
                data: {
                    username: normalizedUsername,
                    user_id: localAuthHash(normalizedUsername),
                    token: getToken()
                }
            };
        }
        try {
            const res = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await readApiResponse(res);
            if (data.success) {
                localStorage.setItem('mood_dust_token', data.data.token);
                localStorage.setItem('mood_dust_user', data.data.username);
                localStorage.setItem('mood_dust_user_id', data.data.user_id);
                localStorage.setItem('mood_dust_logged_in', 'true');
            }
            return data;
        } catch (e) {
            console.error('Register error:', e);
            return { success: false, error: e.message };
        }
    },

    async login(username, password) {
        if (isStaticPages()) {
            const normalizedUsername = username.trim();
            const user = getLocalUsers()[normalizedUsername];
            if (!user || user.password !== localAuthHash(password)) {
                return { success: false, error: 'Incorrect username or password.' };
            }
            setLocalSession(normalizedUsername);
            return {
                success: true,
                data: {
                    username: normalizedUsername,
                    user_id: localAuthHash(normalizedUsername),
                    token: getToken()
                }
            };
        }
        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await readApiResponse(res);
            if (data.success) {
                localStorage.setItem('mood_dust_token', data.data.token);
                localStorage.setItem('mood_dust_user', data.data.username);
                localStorage.setItem('mood_dust_user_id', data.data.user_id);
                localStorage.setItem('mood_dust_logged_in', 'true');
            }
            return data;
        } catch (e) {
            console.error('Login error:', e);
            return { success: false, error: e.message };
        }
    },

    async verify() {
        const token = getToken();
        if (!token) return { success: false };
        if (isStaticPages()) {
            return {
                success: localStorage.getItem('mood_dust_logged_in') === 'true' &&
                    token.startsWith('local-'),
                data: { username: localStorage.getItem('mood_dust_user') }
            };
        }
        try {
            const res = await fetch(`${API_BASE}/auth/verify`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ token })
            });
            return await res.json();
        } catch (e) {
            return { success: false, error: e.message };
        }
    },

    logout() {
        localStorage.removeItem('mood_dust_token');
        localStorage.removeItem('mood_dust_user');
        localStorage.removeItem('mood_dust_user_id');
        localStorage.setItem('mood_dust_logged_in', 'false');
    },

    isLoggedIn() {
        return localStorage.getItem('mood_dust_logged_in') === 'true';
    },

    getCurrentUser() {
        return localStorage.getItem('mood_dust_user');
    }
};

// ==================== 日记 API ====================

const DiaryAPI = {
    async getDiaries(page = 1, pageSize = 50, year = null, month = null) {
        try {
            let url = `${API_BASE}/diary/?page=${page}&page_size=${pageSize}`;
            if (year && month) {
                url += `&year=${year}&month=${month}`;
            }
            const res = await fetch(url, { headers: getHeaders() });
            const data = await res.json();
            if (data.success) {
                // 同步到本地缓存
                this.syncToLocalCache(data.data.diaries);
            }
            return data;
        } catch (e) {
            console.error('Get diaries error:', e);
            // 返回本地缓存
            return { success: true, data: this.getFromLocalCache() };
        }
    },

    async getDiaryByDate(date) {
        try {
            const res = await fetch(`${API_BASE}/diary/${date}`, { headers: getHeaders() });
            const data = await res.json();
            return data;
        } catch (e) {
            console.error('Get diary by date error:', e);
            // 返回本地缓存
            const cached = this.getFromLocalCache();
            const found = cached.find(d => d.date === date);
            return { success: true, data: found || null };
        }
    },

    async saveDiary(date, mood, content, aiSentence = '', imagePaths = []) {
        try {
            const res = await fetch(`${API_BASE}/diary/`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ date, mood, content, ai_sentence: aiSentence, image_paths: imagePaths })
            });
            const data = await res.json();
            if (data.success) {
                // 同步到本地缓存
                this.syncDiaryToLocalCache(data.data);
            }
            return data;
        } catch (e) {
            console.error('Save diary error:', e);
            // 保存到本地缓存
            const localData = {
                date, mood, content, ai_sentence: aiSentence,
                image_paths: imagePaths,
                updated_at: new Date().toISOString()
            };
            this.syncDiaryToLocalCache(localData);
            return { success: true, data: localData };
        }
    },

    async deleteDiary(date) {
        try {
            const res = await fetch(`${API_BASE}/diary/${date}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            const data = await res.json();
            if (data.success) {
                // 从本地缓存删除
                this.removeFromLocalCache(date);
            }
            return data;
        } catch (e) {
            console.error('Delete diary error:', e);
            return { success: false, error: e.message };
        }
    },

    async getMoodStats(year, month) {
        try {
            const res = await fetch(`${API_BASE}/diary/stats?year=${year}&month=${month}`, { headers: getHeaders() });
            return await res.json();
        } catch (e) {
            console.error('Get mood stats error:', e);
            // 计算本地缓存
            return { success: true, data: this.calculateLocalStats(year, month) };
        }
    },

    async getMoodHistory(year, month) {
        try {
            const res = await fetch(`${API_BASE}/diary/history?year=${year}&month=${month}`, { headers: getHeaders() });
            return await res.json();
        } catch (e) {
            console.error('Get mood history error:', e);
            return { success: true, data: [] };
        }
    },

    // 本地缓存操作
    syncToLocalCache(diaries) {
        localStorage.setItem('mood_dust_data', JSON.stringify({ diaries }));
    },

    syncDiaryToLocalCache(diary) {
        const raw = localStorage.getItem('mood_dust_data');
        const data = raw ? JSON.parse(raw) : { diaries: {} };
        data.diaries[diary.date] = diary;
        localStorage.setItem('mood_dust_data', JSON.stringify(data));
    },

    removeFromLocalCache(date) {
        const raw = localStorage.getItem('mood_dust_data');
        if (!raw) return;
        const data = JSON.parse(raw);
        delete data.diaries[date];
        localStorage.setItem('mood_dust_data', JSON.stringify(data));
    },

    getFromLocalCache() {
        const raw = localStorage.getItem('mood_dust_data');
        if (!raw) return [];
        const data = JSON.parse(raw);
        return Object.values(data.diaries || {});
    },

    calculateLocalStats(year, month) {
        const diaries = this.getFromLocalCache();
        const monthStr = `${year}-${String(month).padStart(2, '0')}`;
        const monthDiaries = diaries.filter(d => d.date && d.date.startsWith(monthStr));

        const moodCounts = {};
        monthDiaries.forEach(d => {
            if (d.mood) {
                moodCounts[d.mood] = (moodCounts[d.mood] || 0) + 1;
            }
        });

        const topMood = Object.keys(moodCounts).sort((a, b) => moodCounts[b] - moodCounts[a])[0];

        return {
            month: monthStr,
            total_entries: monthDiaries.length,
            top_mood: topMood,
            top_count: topMood ? moodCounts[topMood] : 0,
            mood_counts: moodCounts
        };
    }
};

// ==================== 社区 API ====================

const CommunityAPI = {
    async getPosts(page = 1, pageSize = 10, tag = null, sort = 'newest', search = '') {
        try {
            let url = `${API_BASE}/community/posts?page=${page}&page_size=${pageSize}&sort=${sort}`;
            if (tag) url += `&tag=${tag}`;
            if (search) url += `&search=${encodeURIComponent(search)}`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.success) {
                localStorage.setItem('mood_dust_community', JSON.stringify(data.data.posts));
            }
            return data;
        } catch (e) {
            console.error('Get posts error:', e);
            const cached = localStorage.getItem('mood_dust_community');
            return { success: true, data: { posts: cached ? JSON.parse(cached) : [] } };
        }
    },

    async createPost(content, isAnonymous = false, tags = []) {
        try {
            const res = await fetch(`${API_BASE}/community/posts`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ content, is_anonymous: isAnonymous, tags })
            });
            return await res.json();
        } catch (e) {
            console.error('Create post error:', e);
            return { success: false, error: e.message };
        }
    },

    async deletePost(postId) {
        try {
            const res = await fetch(`${API_BASE}/community/posts/${postId}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            return await res.json();
        } catch (e) {
            console.error('Delete post error:', e);
            return { success: false, error: e.message };
        }
    },

    async toggleLike(postId) {
        try {
            const res = await fetch(`${API_BASE}/community/posts/${postId}/like`, {
                method: 'POST',
                headers: getHeaders()
            });
            return await res.json();
        } catch (e) {
            console.error('Toggle like error:', e);
            return { success: false, error: e.message };
        }
    },

    async toggleFavorite(postId) {
        try {
            const res = await fetch(`${API_BASE}/community/posts/${postId}/favorite`, {
                method: 'POST',
                headers: getHeaders()
            });
            return await res.json();
        } catch (e) {
            return { success: false, error: e.message };
        }
    },

    async reportPost(postId, reason = 'Other') {
        try {
            const res = await fetch(`${API_BASE}/community/posts/${postId}/report`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ reason })
            });
            return await res.json();
        } catch (e) {
            return { success: false, error: e.message };
        }
    },

    async getComments(postId) {
        try {
            const res = await fetch(`${API_BASE}/community/posts/${postId}/comments`);
            return await res.json();
        } catch (e) {
            console.error('Get comments error:', e);
            return { success: true, data: [] };
        }
    },

    async addComment(postId, content, isAnonymous = false, replyTo = null) {
        try {
            const res = await fetch(`${API_BASE}/community/posts/${postId}/comments`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ content, is_anonymous: isAnonymous, reply_to: replyTo })
            });
            return await res.json();
        } catch (e) {
            console.error('Add comment error:', e);
            return { success: false, error: e.message };
        }
    },

    async getPopularTags(limit = 10) {
        try {
            const res = await fetch(`${API_BASE}/community/tags/popular?limit=${limit}`);
            return await res.json();
        } catch (e) {
            console.error('Get popular tags error:', e);
            return { success: true, data: [] };
        }
    },

    async checkLikeStatus(postId) {
        try {
            const res = await fetch(`${API_BASE}/community/check-like/${postId}`, { headers: getHeaders() });
            return await res.json();
        } catch (e) {
            return { success: true, data: { liked: false } };
        }
    }
};

// ==================== 语录 API ====================

const QuoteAPI = {
    async getDailyQuote() {
        try {
            const res = await fetch(`${API_BASE}/daily-quote`);
            const data = await res.json();
            return data;
        } catch (e) {
            console.error('Get daily quote error:', e);
            const defaultQuotes = [
                '行到水穷处，坐看云起时。',
                '明月松间照，清泉石上流。',
                '海内存知己，天涯若比邻。'
            ];
            return { success: true, data: { quote: defaultQuotes[Math.floor(Math.random() * defaultQuotes.length)] } };
        }
    }
};

// ==================== 账号管理 API ====================

const AccountAPI = {
    async getResources(page = 1, pageSize = 10, filters = {}) {
        try {
            let url = `${API_BASE}/account/resources?page=${page}&page_size=${pageSize}`;
            Object.keys(filters).forEach(key => {
                if (filters[key]) {
                    url += `&${key}=${encodeURIComponent(filters[key])}`;
                }
            });
            const res = await fetch(url);
            return await res.json();
        } catch (e) {
            console.error('Get resources error:', e);
            return { success: false, error: e.message };
        }
    },

    async getResourceDetail(id) {
        try {
            const res = await fetch(`${API_BASE}/account/resources/${id}`);
            return await res.json();
        } catch (e) {
            console.error('Get resource detail error:', e);
            return { success: false, error: e.message };
        }
    },

    async createResource(data) {
        try {
            const res = await fetch(`${API_BASE}/account/resources`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            return await res.json();
        } catch (e) {
            console.error('Create resource error:', e);
            return { success: false, error: e.message };
        }
    },

    async updateResource(id, data) {
        try {
            const res = await fetch(`${API_BASE}/account/resources/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            return await res.json();
        } catch (e) {
            console.error('Update resource error:', e);
            return { success: false, error: e.message };
        }
    },

    async deleteResource(id) {
        try {
            const res = await fetch(`${API_BASE}/account/resources/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            return await res.json();
        } catch (e) {
            console.error('Delete resource error:', e);
            return { success: false, error: e.message };
        }
    },

    async getStats() {
        try {
            const res = await fetch(`${API_BASE}/account/resources/stats`);
            return await res.json();
        } catch (e) {
            console.error('Get stats error:', e);
            return { success: false, error: e.message };
        }
    },

    async getRenewalList(days = 30) {
        try {
            const res = await fetch(`${API_BASE}/account/resources/renewal?days=${days}`);
            return await res.json();
        } catch (e) {
            console.error('Get renewal list error:', e);
            return { success: false, error: e.message };
        }
    },

    async uploadAttachment(formData) {
        try {
            const res = await fetch(`${API_BASE}/account/attachments`, {
                method: 'POST',
                body: formData
            });
            return await res.json();
        } catch (e) {
            console.error('Upload attachment error:', e);
            return { success: false, error: e.message };
        }
    },

    async getAttachments(resourceId = null, billingRecordId = null) {
        try {
            let url = `${API_BASE}/account/attachments`;
            if (resourceId) url += `?resource_id=${resourceId}`;
            else if (billingRecordId) url += `?billing_record_id=${billingRecordId}`;
            const res = await fetch(url);
            return await res.json();
        } catch (e) {
            console.error('Get attachments error:', e);
            return { success: false, error: e.message };
        }
    },

    async downloadAttachment(id) {
        try {
            const res = await fetch(`${API_BASE}/account/attachments/${id}`);
            return res;
        } catch (e) {
            console.error('Download attachment error:', e);
            return null;
        }
    },

    async deleteAttachment(id) {
        try {
            const res = await fetch(`${API_BASE}/account/attachments/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            return await res.json();
        } catch (e) {
            console.error('Delete attachment error:', e);
            return { success: false, error: e.message };
        }
    },

    async getOptions() {
        try {
            const res = await fetch(`${API_BASE}/account/options`);
            return await res.json();
        } catch (e) {
            console.error('Get options error:', e);
            return { success: false, error: e.message };
        }
    }
};

// 导出到全局
window.AuthAPI = AuthAPI;
window.DiaryAPI = DiaryAPI;
window.CommunityAPI = CommunityAPI;
window.QuoteAPI = QuoteAPI;
window.AccountAPI = AccountAPI;
