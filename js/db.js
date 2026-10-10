/* ============================================
   数据库层 - IndexedDB 封装 (v2)
   新增：赛道分类(Categories) 存储
   ============================================ */

const DB_NAME = 'JobManagerDB';
const DB_VERSION = 2;
const STORES = {
    JOBS: 'jobs',
    EVENTS: 'timelineEvents',
    NOTES: 'interviewNotes',
    TAGS: 'tags',
    RESUMES: 'resumes',
    CATEGORIES: 'categories'
};

// 预设标签
const DEFAULT_TAGS = [
    { name: '前端', color: '#3b82f6' },
    { name: '后端', color: '#10b981' },
    { name: '大厂', color: '#8b5cf6' },
    { name: '国企', color: '#ec4899' },
    { name: '双休', color: '#14b8a6' },
    { name: '远程', color: '#f59e0b' },
    { name: '异地', color: '#f97316' }
];

// 固定4大分类初始数据
const DEFAULT_CATEGORIES = [
    { id: 1, name: '技术', color: '#3b82f6', sort: 1, defaultResumeId: null, remark: '前端/后端/测试/数据/算法' },
    { id: 2, name: '产品', color: '#9333ea', sort: 2, defaultResumeId: null, remark: '产品经理/产品助理/B端/C端' },
    { id: 3, name: '运营', color: '#10b981', sort: 3, defaultResumeId: null, remark: '用户运营/内容运营/新媒体/社区' },
    { id: 4, name: '售前', color: '#f97316', sort: 4, defaultResumeId: null, remark: '解决方案/交付/技术支持/咨询' }
];

// Deep clone to strip Vue reactive proxies before storing in IndexedDB
function toPlain(obj) {
    return JSON.parse(JSON.stringify(obj));
}

const db = {
    _instance: null,

    async open() {
        if (this._instance) return this._instance;
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                const oldVersion = e.oldVersion;

                // ---- Jobs store ----
                if (!db.objectStoreNames.contains(STORES.JOBS)) {
                    const jobStore = db.createObjectStore(STORES.JOBS, { keyPath: 'id', autoIncrement: true });
                    jobStore.createIndex('status', 'status', { unique: false });
                    jobStore.createIndex('company', 'company', { unique: false });
                    jobStore.createIndex('categoryId', 'categoryId', { unique: false });
                    jobStore.createIndex('createdAt', 'createdAt', { unique: false });
                    jobStore.createIndex('updatedAt', 'updatedAt', { unique: false });
                } else if (oldVersion < 2) {
                    // v1→v2: add categoryId index
                    const jobStore = e.target.transaction.objectStore(STORES.JOBS);
                    if (!jobStore.indexNames.contains('categoryId')) {
                        jobStore.createIndex('categoryId', 'categoryId', { unique: false });
                    }
                }

                // ---- Events store ----
                if (!db.objectStoreNames.contains(STORES.EVENTS)) {
                    const eventStore = db.createObjectStore(STORES.EVENTS, { keyPath: 'id', autoIncrement: true });
                    eventStore.createIndex('jobId', 'jobId', { unique: false });
                    eventStore.createIndex('date', 'date', { unique: false });
                }

                // ---- Notes store ----
                if (!db.objectStoreNames.contains(STORES.NOTES)) {
                    const noteStore = db.createObjectStore(STORES.NOTES, { keyPath: 'id', autoIncrement: true });
                    noteStore.createIndex('jobId', 'jobId', { unique: false });
                    noteStore.createIndex('company', 'company', { unique: false });
                    noteStore.createIndex('categoryId', 'categoryId', { unique: false });
                } else if (oldVersion < 2) {
                    const noteStore = e.target.transaction.objectStore(STORES.NOTES);
                    if (!noteStore.indexNames.contains('categoryId')) {
                        noteStore.createIndex('categoryId', 'categoryId', { unique: false });
                    }
                }

                // ---- Tags store ----
                if (!db.objectStoreNames.contains(STORES.TAGS)) {
                    db.createObjectStore(STORES.TAGS, { keyPath: 'name' });
                }

                // ---- Resumes store ----
                if (!db.objectStoreNames.contains(STORES.RESUMES)) {
                    db.createObjectStore(STORES.RESUMES, { keyPath: 'id', autoIncrement: true });
                }

                // ---- Categories store (new in v2) ----
                if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
                    const catStore = db.createObjectStore(STORES.CATEGORIES, { keyPath: 'id' });
                    catStore.createIndex('sort', 'sort', { unique: false });
                    // Insert default categories
                    DEFAULT_CATEGORIES.forEach(c => catStore.put(c));
                }
            };
            request.onsuccess = (e) => {
                this._instance = e.target.result;
                resolve(this._instance);
            };
            request.onerror = (e) => reject(e.target.error);
        });
    },

    _getStore(storeName, mode = 'readonly') {
        const tx = this._instance.transaction(storeName, mode);
        return tx.objectStore(storeName);
    },

    // ======================== Jobs ========================
    async getAllJobs() {
        const store = this._getStore(STORES.JOBS);
        return new Promise((resolve, reject) => {
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => reject(req.error);
        });
    },

    async getJobsByCategory(categoryId) {
        const store = this._getStore(STORES.JOBS);
        const index = store.index('categoryId');
        return new Promise((resolve, reject) => {
            const req = categoryId ? index.getAll(Number(categoryId)) : index.getAll(IDBKeyRange.only(null));
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => reject(req.error);
        });
    },

    async getJob(id) {
        const store = this._getStore(STORES.JOBS);
        return new Promise((resolve, reject) => {
            const req = store.get(Number(id));
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    },

    async addJob(job) {
        const store = this._getStore(STORES.JOBS, 'readwrite');
        const data = toPlain({
            ...job,
            categoryId: job.categoryId || null,
            resumeBindId: job.resumeBindId || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        return new Promise((resolve, reject) => {
            const req = store.add(data);
            req.onsuccess = () => resolve({ ...data, id: req.result });
            req.onerror = () => reject(req.error);
        });
    },

    async updateJob(id, updates) {
        const store = this._getStore(STORES.JOBS, 'readwrite');
        return new Promise((resolve, reject) => {
            const getReq = store.get(Number(id));
            getReq.onsuccess = () => {
                const existing = getReq.result;
                if (!existing) { reject(new Error('Job not found')); return; }
                const updated = toPlain({ ...existing, ...updates, updatedAt: new Date().toISOString() });
                const putReq = store.put(updated);
                putReq.onsuccess = () => resolve(updated);
                putReq.onerror = () => reject(putReq.error);
            };
            getReq.onerror = () => reject(getReq.error);
        });
    },

    async deleteJob(id) {
        const jobId = Number(id);
        const d = this._instance;
        const tx = d.transaction([STORES.JOBS, STORES.EVENTS, STORES.NOTES], 'readwrite');
        tx.objectStore(STORES.JOBS).delete(jobId);
        const eventIndex = tx.objectStore(STORES.EVENTS).index('jobId');
        eventIndex.openCursor(IDBKeyRange.only(jobId)).onsuccess = (e) => {
            const cursor = e.target.result;
            if (cursor) { cursor.delete(); cursor.continue(); }
        };
        const noteIndex = tx.objectStore(STORES.NOTES).index('jobId');
        noteIndex.openCursor(IDBKeyRange.only(jobId)).onsuccess = (e) => {
            const cursor = e.target.result;
            if (cursor) { cursor.delete(); cursor.continue(); }
        };
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },

    async deleteJobs(ids) {
        const d = this._instance;
        const tx = d.transaction([STORES.JOBS], 'readwrite');
        const jobStore = tx.objectStore(STORES.JOBS);
        ids.forEach(id => jobStore.delete(Number(id)));
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },

    // ======================== Timeline Events ========================
    async getEventsByJob(jobId) {
        const store = this._getStore(STORES.EVENTS);
        const index = store.index('jobId');
        return new Promise((resolve, reject) => {
            const req = index.getAll(IDBKeyRange.only(Number(jobId)));
            req.onsuccess = () => resolve((req.result || []).sort((a, b) =>
                new Date(b.date) - new Date(a.date)
            ));
            req.onerror = () => reject(req.error);
        });
    },

    async getAllEvents() {
        const store = this._getStore(STORES.EVENTS);
        return new Promise((resolve, reject) => {
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => reject(req.error);
        });
    },

    async addEvent(event) {
        const store = this._getStore(STORES.EVENTS, 'readwrite');
        const data = toPlain({ ...event, jobId: Number(event.jobId) });
        return new Promise((resolve, reject) => {
            const req = store.add(data);
            req.onsuccess = () => resolve({ ...data, id: req.result });
            req.onerror = () => reject(req.error);
        });
    },

    async updateEvent(id, updates) {
        const store = this._getStore(STORES.EVENTS, 'readwrite');
        return new Promise((resolve, reject) => {
            const getReq = store.get(Number(id));
            getReq.onsuccess = () => {
                const existing = getReq.result;
                if (!existing) { reject(new Error('Event not found')); return; }
                const updated = toPlain({ ...existing, ...updates });
                const putReq = store.put(updated);
                putReq.onsuccess = () => resolve(updated);
                putReq.onerror = () => reject(putReq.error);
            };
        });
    },

    async deleteEvent(id) {
        const store = this._getStore(STORES.EVENTS, 'readwrite');
        return new Promise((resolve, reject) => {
            const req = store.delete(Number(id));
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    },

    // ======================== Interview Notes ========================
    async getNotesByJob(jobId) {
        const store = this._getStore(STORES.NOTES);
        const index = store.index('jobId');
        return new Promise((resolve, reject) => {
            const req = index.getAll(IDBKeyRange.only(Number(jobId)));
            req.onsuccess = () => resolve((req.result || []).sort((a, b) =>
                new Date(b.createdAt) - new Date(a.createdAt)
            ));
            req.onerror = () => reject(req.error);
        });
    },

    async getAllNotes() {
        const store = this._getStore(STORES.NOTES);
        return new Promise((resolve, reject) => {
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => reject(req.error);
        });
    },

    async getNotesByCompany(company) {
        const store = this._getStore(STORES.NOTES);
        const index = store.index('company');
        return new Promise((resolve, reject) => {
            const req = index.getAll(company);
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => reject(req.error);
        });
    },

    async addNote(note) {
        const store = this._getStore(STORES.NOTES, 'readwrite');
        const data = toPlain({
            ...note,
            jobId: Number(note.jobId),
            categoryId: note.categoryId || null,
            createdAt: new Date().toISOString()
        });
        return new Promise((resolve, reject) => {
            const req = store.add(data);
            req.onsuccess = () => resolve({ ...data, id: req.result });
            req.onerror = () => reject(req.error);
        });
    },

    async updateNote(id, updates) {
        const store = this._getStore(STORES.NOTES, 'readwrite');
        return new Promise((resolve, reject) => {
            const getReq = store.get(Number(id));
            getReq.onsuccess = () => {
                const existing = getReq.result;
                if (!existing) { reject(new Error('Note not found')); return; }
                const updated = toPlain({ ...existing, ...updates });
                const putReq = store.put(updated);
                putReq.onsuccess = () => resolve(updated);
                putReq.onerror = () => reject(putReq.error);
            };
        });
    },

    async deleteNote(id) {
        const store = this._getStore(STORES.NOTES, 'readwrite');
        return new Promise((resolve, reject) => {
            const req = store.delete(Number(id));
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    },

    // ======================== Tags ========================
    async getAllTags() {
        const store = this._getStore(STORES.TAGS);
        return new Promise((resolve, reject) => {
            const req = store.getAll();
            req.onsuccess = () => {
                const tags = req.result || [];
                if (tags.length === 0) {
                    this.initDefaultTags().then(() => {
                        const req2 = store.getAll();
                        req2.onsuccess = () => resolve(req2.result || []);
                        req2.onerror = () => reject(req2.error);
                    });
                } else {
                    resolve(tags);
                }
            };
            req.onerror = () => reject(req.error);
        });
    },

    async initDefaultTags() {
        const store = this._getStore(STORES.TAGS, 'readwrite');
        const promises = DEFAULT_TAGS.map(tag => new Promise((resolve, reject) => {
            const req = store.put(tag);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        }));
        await Promise.all(promises);
    },

    async addTag(tag) {
        const store = this._getStore(STORES.TAGS, 'readwrite');
        const data = toPlain(tag);
        return new Promise((resolve, reject) => {
            const req = store.put(data);
            req.onsuccess = () => resolve(data);
            req.onerror = () => {
                if (req.error && req.error.name === 'ConstraintError') {
                    reject(new Error('标签已存在'));
                } else {
                    reject(req.error);
                }
            };
        });
    },

    async deleteTag(name) {
        const store = this._getStore(STORES.TAGS, 'readwrite');
        return new Promise((resolve, reject) => {
            const req = store.delete(name);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    },

    async updateTag(name, updates) {
        const store = this._getStore(STORES.TAGS, 'readwrite');
        return new Promise((resolve, reject) => {
            const getReq = store.get(name);
            getReq.onsuccess = () => {
                const existing = getReq.result;
                if (!existing) { reject(new Error('Tag not found')); return; }
                const updated = toPlain({ ...existing, ...updates });
                const putReq = store.put(updated);
                putReq.onsuccess = () => resolve(updated);
                putReq.onerror = () => reject(putReq.error);
            };
        });
    },

    // ======================== Resumes ========================
    async getAllResumes() {
        const store = this._getStore(STORES.RESUMES);
        return new Promise((resolve, reject) => {
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => reject(req.error);
        });
    },

    async addResume(resume) {
        const store = this._getStore(STORES.RESUMES, 'readwrite');
        const data = toPlain({
            ...resume,
            categoryIds: resume.categoryIds || [],
            createdAt: new Date().toISOString()
        });
        return new Promise((resolve, reject) => {
            const req = store.add(data);
            req.onsuccess = () => resolve({ ...data, id: req.result });
            req.onerror = () => reject(req.error);
        });
    },

    async updateResume(id, updates) {
        const store = this._getStore(STORES.RESUMES, 'readwrite');
        return new Promise((resolve, reject) => {
            const getReq = store.get(Number(id));
            getReq.onsuccess = () => {
                const existing = getReq.result;
                if (!existing) { reject(new Error('Resume not found')); return; }
                const updated = toPlain({ ...existing, ...updates });
                const putReq = store.put(updated);
                putReq.onsuccess = () => resolve(updated);
                putReq.onerror = () => reject(putReq.error);
            };
        });
    },

    async deleteResume(id) {
        const store = this._getStore(STORES.RESUMES, 'readwrite');
        return new Promise((resolve, reject) => {
            const req = store.delete(Number(id));
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    },

    // ======================== Categories ========================
    async getAllCategories() {
        const store = this._getStore(STORES.CATEGORIES);
        return new Promise((resolve, reject) => {
            const req = store.getAll();
            req.onsuccess = () => {
                const result = req.result || [];
                resolve(result.sort((a, b) => a.sort - b.sort));
            };
            req.onerror = () => reject(req.error);
        });
    },

    async getCategory(id) {
        const store = this._getStore(STORES.CATEGORIES);
        return new Promise((resolve, reject) => {
            const req = store.get(Number(id));
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    },

    async updateCategory(id, updates) {
        const store = this._getStore(STORES.CATEGORIES, 'readwrite');
        return new Promise((resolve, reject) => {
            const getReq = store.get(Number(id));
            getReq.onsuccess = () => {
                const existing = getReq.result;
                if (!existing) {
                    // If not found, this is likely old data; try inserting
                    const data = toPlain({ id: Number(id), ...updates });
                    const putReq = store.put(data);
                    putReq.onsuccess = () => resolve(data);
                    putReq.onerror = () => reject(putReq.error);
                    return;
                }
                const updated = toPlain({ ...existing, ...updates });
                const putReq = store.put(updated);
                putReq.onsuccess = () => resolve(updated);
                putReq.onerror = () => reject(putReq.error);
            };
            getReq.onerror = () => reject(getReq.error);
        });
    },

    // ======================== Export / Import ========================
    async exportAll() {
        const jobs = await this.getAllJobs();
        const events = await this.getAllEvents();
        const notes = await this.getAllNotes();
        const tags = await this.getAllTags();
        const resumes = await this.getAllResumes();
        const categories = await this.getAllCategories();
        return {
            version: 2,
            exportedAt: new Date().toISOString(),
            data: { jobs, events, notes, tags, resumes, categories }
        };
    },

    async importAll(data) {
        const d = this._instance;
        const clearTx = d.transaction(Object.values(STORES), 'readwrite');
        Object.values(STORES).forEach(name => {
            clearTx.objectStore(name).clear();
        });
        await new Promise((resolve, reject) => {
            clearTx.oncomplete = () => resolve();
            clearTx.onerror = () => reject(clearTx.error);
        });

        const { jobs = [], events = [], notes = [], tags = [], resumes = [], categories = [] } = data;
        const tx = d.transaction(Object.values(STORES), 'readwrite');
        const jobStore = tx.objectStore(STORES.JOBS);
        const eventStore = tx.objectStore(STORES.EVENTS);
        const noteStore = tx.objectStore(STORES.NOTES);
        const tagStore = tx.objectStore(STORES.TAGS);
        const resumeStore = tx.objectStore(STORES.RESUMES);
        const catStore = tx.objectStore(STORES.CATEGORIES);

        jobs.forEach(j => jobStore.put(toPlain(j)));
        events.forEach(e => eventStore.put(toPlain(e)));
        notes.forEach(n => noteStore.put(toPlain(n)));
        tags.forEach(t => tagStore.put(toPlain(t)));
        resumes.forEach(r => resumeStore.put(toPlain(r)));

        // If imported data has categories, use them; otherwise re-insert defaults
        if (categories && categories.length > 0) {
            categories.forEach(c => catStore.put(toPlain(c)));
        } else {
            DEFAULT_CATEGORIES.forEach(c => catStore.put({ ...c }));
        }

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }
};
