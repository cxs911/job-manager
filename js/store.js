/* ============================================
   全局状态管理 (v2 - 新增赛道分类)
   ============================================ */

const store = Vue.reactive({
    // 数据
    jobs: [],
    events: [],
    notes: [],
    tags: [],
    resumes: [],
    categories: [],

    // 状态
    loaded: false,
    loading: false,
    searchKeyword: '',
    selectedStatus: '',
    selectedTags: [],
    selectedPriority: '',
    selectedCategoryId: null,

    // 页面标题
    pageTitle: '仪表盘',
    pageIcon: 'fa-chart-pie',

    async init() {
        if (this.loaded) return;
        this.loading = true;
        try {
            await db.open();
            const [jobs, events, notes, tags, resumes, categories] = await Promise.all([
                db.getAllJobs(),
                db.getAllEvents(),
                db.getAllNotes(),
                db.getAllTags(),
                db.getAllResumes(),
                db.getAllCategories()
            ]);
            this.jobs = jobs;
            this.events = events;
            this.notes = notes;
            this.tags = tags;
            this.resumes = resumes;
            this.categories = categories;
            this.loaded = true;
        } catch (e) {
            console.error('Failed to load data:', e);
            window._toast('数据加载失败', 'error');
        } finally {
            this.loading = false;
        }
    },

    // ======================== Categories ========================
    getCategory(id) {
        return this.categories.find(c => c.id === Number(id));
    },

    getCategoryByName(name) {
        return this.categories.find(c => c.name === name);
    },

    getCategoryColor(id) {
        const cat = this.getCategory(id);
        return cat ? cat.color : '#94a3b8';
    },

    getCategoryName(id) {
        const cat = this.getCategory(id);
        return cat ? cat.name : '未分类';
    },

    async updateCategory(id, updates) {
        const updated = await db.updateCategory(id, updates);
        const idx = this.categories.findIndex(c => c.id === Number(id));
        if (idx >= 0) this.categories[idx] = updated;
        return updated;
    },

    async setCategoryDefaultResume(categoryId, resumeId) {
        return this.updateCategory(categoryId, { defaultResumeId: resumeId ? Number(resumeId) : null });
    },

    getCategoryJobCount(categoryId) {
        return this.jobs.filter(j => {
            if (categoryId === null) return !j.categoryId;
            return j.categoryId === Number(categoryId);
        }).length;
    },

    getCategoryStats(categoryId) {
        const catJobs = this.jobs.filter(j => j.categoryId === Number(categoryId));
        const total = catJobs.length;
        const applied = catJobs.filter(j => j.status === 'applied' || j.status === 'interviewing' || j.status === 'offer' || j.status === 'rejected').length;
        const interviewing = catJobs.filter(j => j.status === 'interviewing' || j.status === 'offer').length;
        const offer = catJobs.filter(j => j.status === 'offer').length;
        return { total, applied, interviewing, offer };
    },

    // ======================== Jobs ========================
    async addJob(job) {
        const newJob = await db.addJob(job);
        this.jobs.push(newJob);
        return newJob;
    },

    async updateJob(id, updates) {
        const updated = await db.updateJob(id, updates);
        const idx = this.jobs.findIndex(j => j.id === id);
        if (idx >= 0) this.jobs[idx] = updated;
        return updated;
    },

    async deleteJob(id) {
        await db.deleteJob(id);
        this.jobs = this.jobs.filter(j => j.id !== id);
        this.events = this.events.filter(e => e.jobId !== id);
        this.notes = this.notes.filter(n => n.jobId !== id);
    },

    async deleteJobs(ids) {
        await db.deleteJobs(ids);
        this.jobs = this.jobs.filter(j => !ids.includes(j.id));
        this.events = this.events.filter(e => !ids.includes(e.jobId));
        this.notes = this.notes.filter(n => !ids.includes(n.jobId));
    },

    async batchSetCategory(ids, categoryId) {
        for (const id of ids) {
            await this.updateJob(id, { categoryId: categoryId ? Number(categoryId) : null });
        }
    },

    getJob(id) {
        return this.jobs.find(j => j.id === Number(id));
    },

    getFilteredJobs(filters = {}) {
        let list = [...this.jobs];
        const { status, keyword, tags, priority, city, minSalary, maxSalary, categoryId } = filters;

        if (status) list = list.filter(j => j.status === status);
        if (categoryId !== undefined && categoryId !== null && categoryId !== '') {
            const catId = Number(categoryId);
            list = list.filter(j => j.categoryId === catId);
        }
        if (keyword) {
            const kw = keyword.toLowerCase();
            list = list.filter(j =>
                (j.company && j.company.toLowerCase().includes(kw)) ||
                (j.title && j.title.toLowerCase().includes(kw)) ||
                (j.jd && j.jd.toLowerCase().includes(kw))
            );
        }
        if (tags && tags.length > 0) {
            list = list.filter(j => j.tags && tags.some(t => j.tags.includes(t)));
        }
        if (priority) list = list.filter(j => j.priority === priority);
        if (city) {
            const c = city.toLowerCase();
            list = list.filter(j => j.city && j.city.toLowerCase().includes(c));
        }
        if (minSalary) list = list.filter(j => j.salaryMin && j.salaryMin >= Number(minSalary));
        if (maxSalary) list = list.filter(j => j.salaryMax && j.salaryMax <= Number(maxSalary));

        // Sort: high priority first, then by updatedAt desc
        list.sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            const pa = priorityOrder[a.priority] ?? 1;
            const pb = priorityOrder[b.priority] ?? 1;
            if (pa !== pb) return pa - pb;
            return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
        });

        return list;
    },

    getStatusCount(status) {
        return this.jobs.filter(j => j.status === status).length;
    },

    // ======================== Events ========================
    async addEvent(event) {
        const newEvent = await db.addEvent(event);
        this.events.push(newEvent);
        return newEvent;
    },

    async updateEvent(id, updates) {
        const updated = await db.updateEvent(id, updates);
        const idx = this.events.findIndex(e => e.id === id);
        if (idx >= 0) this.events[idx] = updated;
        return updated;
    },

    async deleteEvent(id) {
        await db.deleteEvent(id);
        this.events = this.events.filter(e => e.id !== id);
    },

    getEventsByJob(jobId) {
        return this.events
            .filter(e => e.jobId === Number(jobId))
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    },

    getRecentEvents(days = 7) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        return this.events
            .filter(e => new Date(e.date) >= cutoff)
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 20);
    },

    // ======================== Notes ========================
    async addNote(note) {
        const newNote = await db.addNote(note);
        this.notes.push(newNote);
        return newNote;
    },

    async updateNote(id, updates) {
        const updated = await db.updateNote(id, updates);
        const idx = this.notes.findIndex(n => n.id === id);
        if (idx >= 0) this.notes[idx] = updated;
        return updated;
    },

    async deleteNote(id) {
        await db.deleteNote(id);
        this.notes = this.notes.filter(n => n.id !== id);
    },

    getNotesByJob(jobId) {
        return this.notes
            .filter(n => n.jobId === Number(jobId))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    getCompaniesWithNotes(categoryId) {
        const filtered = categoryId ? this.notes.filter(n => n.categoryId === Number(categoryId)) : this.notes;
        const map = {};
        filtered.forEach(n => {
            if (!map[n.company]) map[n.company] = { company: n.company, count: 0, notes: [] };
            map[n.company].count++;
            map[n.company].notes.push(n);
        });
        return Object.values(map).sort((a, b) => a.company.localeCompare(b.company, 'zh'));
    },

    getNotesByCompany(company) {
        return this.notes.filter(n => n.company === company)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    // ======================== Tags ========================
    async addTag(tag) {
        await db.addTag(tag);
        this.tags.push(tag);
    },

    async deleteTag(name) {
        await db.deleteTag(name);
        this.tags = this.tags.filter(t => t.name !== name);
        this.jobs.forEach(j => {
            if (j.tags && j.tags.includes(name)) {
                j.tags = j.tags.filter(t => t !== name);
                db.updateJob(j.id, { tags: j.tags });
            }
        });
    },

    async updateTag(name, updates) {
        const updated = await db.updateTag(name, updates);
        const idx = this.tags.findIndex(t => t.name === name);
        if (idx >= 0) this.tags[idx] = updated;
        return updated;
    },

    getTagCount(name) {
        return this.jobs.filter(j => j.tags && j.tags.includes(name)).length;
    },

    // ======================== Resumes ========================
    async addResume(resume) {
        const newResume = await db.addResume(resume);
        this.resumes.push(newResume);
        return newResume;
    },

    async updateResume(id, updates) {
        const updated = await db.updateResume(id, updates);
        const idx = this.resumes.findIndex(r => r.id === id);
        if (idx >= 0) this.resumes[idx] = updated;
        return updated;
    },

    async deleteResume(id) {
        await db.deleteResume(id);
        this.resumes = this.resumes.filter(r => r.id !== id);
        // Also clear this resume from any category defaults
        for (const cat of this.categories) {
            if (cat.defaultResumeId === Number(id)) {
                await this.updateCategory(cat.id, { defaultResumeId: null });
            }
        }
    },

    getResumesByCategory(categoryId) {
        return this.resumes.filter(r => r.categoryIds && r.categoryIds.includes(Number(categoryId)));
    },

    // Find default resume for a category
    getDefaultResumeId(categoryId) {
        const cat = this.getCategory(categoryId);
        return cat ? cat.defaultResumeId : null;
    },

    getResumeName(id) {
        const r = this.resumes.find(r => r.id === Number(id));
        return r ? r.name : '';
    },

    // ======================== Stats ========================
    getStats() {
        return {
            total: this.jobs.length,
            pending: this.getStatusCount('pending'),
            applied: this.getStatusCount('applied'),
            interviewing: this.getStatusCount('interviewing'),
            offer: this.getStatusCount('offer'),
            rejected: this.getStatusCount('rejected')
        };
    },

    getFunnelData() {
        const total = this.jobs.length;
        const applied = this.getStatusCount('applied') + this.getStatusCount('interviewing') + this.getStatusCount('offer') + this.getStatusCount('rejected');
        const interviewing = this.getStatusCount('interviewing') + this.getStatusCount('offer');
        const offer = this.getStatusCount('offer');

        return {
            labels: ['总职位', '已投递', '面试中', 'Offer'],
            values: [total, applied, interviewing, offer],
            rates: [
                total ? '100%' : '-',
                total ? (applied / total * 100).toFixed(0) + '%' : '-',
                applied ? (interviewing / applied * 100).toFixed(0) + '%' : '-',
                interviewing ? (offer / interviewing * 100).toFixed(0) + '%' : '-'
            ]
        };
    },

    // Per-category funnel data for dashboard
    getCategoryFunnelData(categoryId) {
        const catJobs = this.jobs.filter(j => j.categoryId === Number(categoryId));
        const total = catJobs.length;
        const applied = catJobs.filter(j => j.status === 'applied' || j.status === 'interviewing' || j.status === 'offer' || j.status === 'rejected').length;
        const interviewing = catJobs.filter(j => j.status === 'interviewing' || j.status === 'offer').length;
        const offer = catJobs.filter(j => j.status === 'offer').length;
        return {
            total, applied, interviewing, offer,
            appliedRate: total ? (applied / total * 100).toFixed(0) : 0,
            interviewRate: applied ? (interviewing / applied * 100).toFixed(0) : 0,
            offerRate: interviewing ? (offer / interviewing * 100).toFixed(0) : 0
        };
    },

    getDailyTrend(days = 30) {
        const dates = {};
        const now = new Date();
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const key = d.toISOString().slice(0, 10);
            dates[key] = 0;
        }
        this.events.filter(e => e.type === 'applied' || e.type === '投递').forEach(e => {
            const key = e.date.slice(0, 10);
            if (dates[key] !== undefined) dates[key]++;
        });
        return {
            labels: Object.keys(dates),
            values: Object.values(dates)
        };
    },

    // Status label helper
    getStatusLabel(status) {
        const map = {
            pending: '待投递',
            applied: '已投递',
            interviewing: '面试中',
            offer: 'Offer',
            rejected: '已挂',
            archived: '已归档'
        };
        return map[status] || status;
    },

    getStatusFromEventType(type) {
        const map = {
            '收藏': 'pending',
            '投递': 'applied',
            '简历筛选': 'applied',
            '笔试': 'interviewing',
            '一面': 'interviewing',
            '二面': 'interviewing',
            '三面': 'interviewing',
            '终面': 'interviewing',
            'HR面': 'interviewing',
            'OC': 'interviewing',
            'Offer': 'offer',
            '拒信': 'rejected',
            '其他': 'interviewing'
        };
        return map[type] || 'interviewing';
    },

    getPriorityLabel(p) {
        const map = { high: '高', medium: '中', low: '低' };
        return map[p] || p;
    },

    setPageMeta(title, icon) {
        this.pageTitle = title;
        this.pageIcon = icon;
    }
});
