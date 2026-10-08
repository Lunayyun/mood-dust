/**
 * MOOD DUST — Frontend Local Storage Module
 * AI Generated: Robust localStorage wrapper with error handling
 * 
 * Data Structure:
 * {
 *   "YYYY-MM-DD": {
 *     date: "YYYY-MM-DD",           // 日期（主键）
 *     mood: "calm|happy|melancholy|anxious|hopeful|tired|grateful|inspired",
 *     content: "日记内容...",        // 正文内容
 *     ai_sentence: "AI生成的诗意句子", // AI生成内容
 *     image_paths: ["path1", "path2"], // 图片路径数组
 *     updated_at: "ISO8601 timestamp"  // 更新时间
 *   }
 * }
 */

class MoodStorage {
    /**
     * 构造函数
     * @param {string} storageKey - localStorage 存储键名，默认为 'mood_dust_data'
     */
    constructor(storageKey = 'mood_dust_data') {
        this.STORAGE_KEY = storageKey;
        this.DIARY_VERSION = '1.0'; // 数据格式版本号
        this.MOOD_VALUES = ['calm', 'happy', 'melancholy', 'anxious', 'hopeful', 'tired', 'grateful', 'inspired'];
        
        // 初始化存储
        this._initStorage();
    }

    /**
     * 初始化存储，确保数据结构存在
     * @private
     */
    _initStorage() {
        try {
            const existing = localStorage.getItem(this.STORAGE_KEY);
            if (!existing) {
                // 创建初始数据结构
                const initialData = {
                    version: this.DIARY_VERSION,
                    diaries: {}
                };
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(initialData));
            } else {
                // 检查版本兼容性
                this._checkVersion();
            }
        } catch (error) {
            console.error('[MoodStorage] Failed to initialize storage:', error);
            throw new Error('存储初始化失败: ' + error.message);
        }
    }

    /**
     * 检查数据版本兼容性
     * @private
     */
    _checkVersion() {
        try {
            const data = JSON.parse(localStorage.getItem(this.STORAGE_KEY));
            if (data.version !== this.DIARY_VERSION) {
                console.warn(`[MoodStorage] Data version mismatch: expected ${this.DIARY_VERSION}, got ${data.version}`);
                // 可以在这里添加数据迁移逻辑
            }
        } catch (error) {
            console.error('[MoodStorage] Version check failed:', error);
        }
    }

    /**
     * 获取所有存储数据
     * @returns {Object} 包含 version 和 diaries 的对象
     * @private
     */
    _getAllData() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (!data) {
                return { version: this.DIARY_VERSION, diaries: {} };
            }
            return JSON.parse(data);
        } catch (error) {
            console.error('[MoodStorage] Failed to get all data:', error);
            return { version: this.DIARY_VERSION, diaries: {} };
        }
    }

    /**
     * 保存所有数据
     * @param {Object} data - 完整数据对象
     * @returns {boolean} 是否保存成功
     * @private
     */
    _saveAllData(data) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('[MoodStorage] Failed to save all data:', error);
            return false;
        }
    }

    /**
     * 验证日期格式是否正确
     * @param {string} dateStr - YYYY-MM-DD 格式的日期字符串
     * @returns {boolean} 是否有效
     * @private
     */
    _validateDate(dateStr) {
        const regex = /^\d{4}-\d{2}-\d{2}$/;
        if (!regex.test(dateStr)) {
            return false;
        }
        
        const date = new Date(dateStr);
        const parts = dateStr.split('-');
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        
        return date.getFullYear() === year && 
               date.getMonth() === month && 
               date.getDate() === day;
    }

    /**
     * 验证心情值是否有效
     * @param {string} mood - 心情值
     * @returns {boolean} 是否有效
     * @private
     */
    _validateMood(mood) {
        return this.MOOD_VALUES.includes(mood);
    }

    /**
     * 保存日记
     * @param {Object} diary - 日记对象
     * @param {string} diary.date - 日期（YYYY-MM-DD）
     * @param {string} [diary.mood] - 心情值
     * @param {string} [diary.content] - 正文内容
     * @param {string} [diary.ai_sentence] - AI生成句子
     * @param {string[]} [diary.image_paths] - 图片路径数组
     * @returns {boolean} 是否保存成功
     */
    saveDiary(diary) {
        try {
            // 验证日期
            if (!diary.date || !this._validateDate(diary.date)) {
                throw new Error('无效的日期格式，应为 YYYY-MM-DD');
            }

            // 验证心情（如果提供）
            if (diary.mood && !this._validateMood(diary.mood)) {
                throw new Error('无效的心情值');
            }

            // 获取现有数据
            const data = this._getAllData();

            // 创建日记记录
            const diaryRecord = {
                date: diary.date,
                mood: diary.mood || null,
                content: diary.content || '',
                ai_sentence: diary.ai_sentence || '',
                image_paths: diary.image_paths || [],
                updated_at: new Date().toISOString()
            };

            // 保存到 diaries 对象
            data.diaries[diary.date] = diaryRecord;

            // 保存到 localStorage
            const success = this._saveAllData(data);
            
            if (success) {
                console.log(`[MoodStorage] Diary saved for ${diary.date}`);
            }
            
            return success;
        } catch (error) {
            console.error('[MoodStorage] Failed to save diary:', error);
            throw error;
        }
    }

    /**
     * 获取指定日期的日记
     * @param {string} date - 日期（YYYY-MM-DD）
     * @returns {Object|null} 日记对象或 null（不存在时）
     */
    getDiary(date) {
        try {
            // 验证日期格式
            if (!date || !this._validateDate(date)) {
                throw new Error('无效的日期格式，应为 YYYY-MM-DD');
            }

            const data = this._getAllData();
            return data.diaries[date] || null;
        } catch (error) {
            console.error('[MoodStorage] Failed to get diary:', error);
            throw error;
        }
    }

    /**
     * 删除指定日期的日记
     * @param {string} date - 日期（YYYY-MM-DD）
     * @returns {boolean} 是否删除成功（不存在也返回 true）
     */
    deleteDiary(date) {
        try {
            // 验证日期格式
            if (!date || !this._validateDate(date)) {
                throw new Error('无效的日期格式，应为 YYYY-MM-DD');
            }

            const data = this._getAllData();
            
            if (data.diaries[date]) {
                delete data.diaries[date];
                const success = this._saveAllData(data);
                
                if (success) {
                    console.log(`[MoodStorage] Diary deleted for ${date}`);
                }
                
                return success;
            }
            
            // 如果不存在，也算成功
            return true;
        } catch (error) {
            console.error('[MoodStorage] Failed to delete diary:', error);
            throw error;
        }
    }

    /**
     * 判断指定日期是否有日记
     * @param {string} date - 日期（YYYY-MM-DD）
     * @returns {boolean} 是否存在日记
     */
    hasDiary(date) {
        try {
            // 验证日期格式
            if (!date || !this._validateDate(date)) {
                throw new Error('无效的日期格式，应为 YYYY-MM-DD');
            }

            const data = this._getAllData();
            return !!data.diaries[date];
        } catch (error) {
            console.error('[MoodStorage] Failed to check diary existence:', error);
            throw error;
        }
    }

    /**
     * 获取所有日记列表（带分页支持）
     * @param {number} [page=1] - 页码
     * @param {number} [pageSize=10] - 每页条数
     * @returns {Object} { data: Array, total: number, page: number, pageSize: number }
     */
    getAllDiaries(page = 1, pageSize = 10) {
        try {
            const data = this._getAllData();
            const diaries = Object.values(data.diaries);
            
            // 按日期降序排序
            diaries.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            // 分页处理
            const total = diaries.length;
            const start = (page - 1) * pageSize;
            const end = start + pageSize;
            const paginatedData = diaries.slice(start, end);
            
            return {
                data: paginatedData,
                total: total,
                page: page,
                pageSize: pageSize,
                totalPages: Math.ceil(total / pageSize)
            };
        } catch (error) {
            console.error('[MoodStorage] Failed to get all diaries:', error);
            throw error;
        }
    }

    /**
     * 获取指定月份的日记列表
     * @param {number} year - 年份
     * @param {number} month - 月份（1-12）
     * @returns {Object[]} 该月份的日记数组
     */
    getDiariesByMonth(year, month) {
        try {
            if (!year || !month || month < 1 || month > 12) {
                throw new Error('无效的年份或月份');
            }

            const data = this._getAllData();
            const diaries = Object.values(data.diaries);
            
            // 过滤指定月份的日记
            const filtered = diaries.filter(diary => {
                const d = new Date(diary.date);
                return d.getFullYear() === year && d.getMonth() + 1 === month;
            });
            
            // 按日期升序排序
            filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
            
            return filtered;
        } catch (error) {
            console.error('[MoodStorage] Failed to get diaries by month:', error);
            throw error;
        }
    }

    /**
     * 清空所有数据（危险操作）
     * @returns {boolean} 是否清空成功
     */
    clearAll() {
        try {
            const initialData = {
                version: this.DIARY_VERSION,
                diaries: {}
            };
            const success = this._saveAllData(initialData);
            
            if (success) {
                console.log('[MoodStorage] All data cleared');
            }
            
            return success;
        } catch (error) {
            console.error('[MoodStorage] Failed to clear all data:', error);
            throw error;
        }
    }

    /**
     * 获取存储状态信息
     * @returns {Object} 存储状态
     */
    getStorageInfo() {
        try {
            const data = this._getAllData();
            const diaryCount = Object.keys(data.diaries).length;
            
            // 计算存储占用大小
            const rawData = localStorage.getItem(this.STORAGE_KEY);
            const sizeInBytes = rawData ? new Blob([rawData]).size : 0;
            
            return {
                version: data.version,
                diaryCount: diaryCount,
                sizeInBytes: sizeInBytes,
                sizeInKB: (sizeInBytes / 1024).toFixed(2),
                lastUpdated: diaryCount > 0 ? 
                    Object.values(data.diaries).reduce((latest, d) => 
                        d.updated_at > latest ? d.updated_at : latest, '') : null
            };
        } catch (error) {
            console.error('[MoodStorage] Failed to get storage info:', error);
            throw error;
        }
    }

    /**
     * 导出所有数据（用于备份）
     * @returns {string} JSON 字符串
     */
    exportData() {
        try {
            const data = this._getAllData();
            return JSON.stringify(data, null, 2);
        } catch (error) {
            console.error('[MoodStorage] Failed to export data:', error);
            throw error;
        }
    }

    /**
     * 导入数据（用于恢复备份）
     * @param {string} jsonString - JSON 字符串
     * @returns {boolean} 是否导入成功
     */
    importData(jsonString) {
        try {
            const importedData = JSON.parse(jsonString);
            
            // 验证数据结构
            if (!importedData.version || !importedData.diaries) {
                throw new Error('无效的数据格式');
            }

            const success = this._saveAllData(importedData);
            
            if (success) {
                console.log('[MoodStorage] Data imported successfully');
            }
            
            return success;
        } catch (error) {
            console.error('[MoodStorage] Failed to import data:', error);
            throw error;
        }
    }
}

// 创建单例实例供全局使用
const moodStorage = new MoodStorage();

// 导出模块（支持 CommonJS 和全局变量）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MoodStorage, moodStorage };
} else if (typeof window !== 'undefined') {
    window.MoodStorage = MoodStorage;
    window.moodStorage = moodStorage;
}
