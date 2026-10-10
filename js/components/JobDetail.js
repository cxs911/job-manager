/* ============================================
   职位详情页组件 (v2 - 赛道标签)
   ============================================ */
const JobDetail = {
    props: {
        jobId: { type: [String, Number], required: true }
    },
    setup(props) {
        const store = window.store;
        const events = Vue.ref([]);
        const notes = Vue.ref([]);
        const showEventForm = Vue.ref(false);
        const showNoteForm = Vue.ref(false);
        const editingNote = Vue.ref(null);
        const eventForm = Vue.ref(getDefaultEventForm());
        const noteForm = Vue.ref(getDefaultNoteForm());

        function getDefaultEventForm() {
            return {
                type: '投递',
                date: new Date().toISOString().slice(0, 10),
                note: ''
            };
        }

        function getDefaultNoteForm() {
            return {
                round: '',
                question: '',
                answer: '',
                review: ''
            };
        }

        const job = Vue.computed(() => store.getJob(props.jobId));

        async function loadData() {
            if (!job.value) return;
            events.value = store.getEventsByJob(props.jobId);
            notes.value = store.getNotesByJob(props.jobId);
            const title = job.value.company + ' - ' + job.value.title;
            store.setPageMeta(title, 'fa-briefcase');
        }

        Vue.watch(() => props.jobId, loadData);
        Vue.onMounted(loadData);
        Vue.watch(() => store.events.length, loadData);
        Vue.watch(() => store.notes.length, loadData);

        function formatDate(d) {
            if (!d) return '-';
            const date = new Date(d);
            return date.toLocaleDateString('zh-CN') + ' ' + date.toTimeString().slice(0, 5);
        }

        function formatSalary(job) {
            if (!job) return '-';
            if (job.salaryMin && job.salaryMax) return job.salaryMin + ' - ' + job.salaryMax + ' K';
            if (job.salaryMin) return job.salaryMin + 'K起';
            if (job.salaryMax) return '~' + job.salaryMax + 'K';
            return '-';
        }

        // Event functions
        async function addEvent() {
            if (!eventForm.value.type) return;
            const data = {
                jobId: Number(props.jobId),
                type: eventForm.value.type,
                date: eventForm.value.date,
                note: eventForm.value.note.trim()
            };
            await store.addEvent(data);

            const newStatus = store.getStatusFromEventType(data.type);
            if (newStatus && job.value && job.value.status !== newStatus) {
                await store.updateJob(props.jobId, { status: newStatus });
            }

            eventForm.value = getDefaultEventForm();
            showEventForm.value = false;
            window._toast('进度事件已添加', 'success');
        }

        async function deleteEvent(id) {
            if (!confirm('确定删除此事件？')) return;
            await store.deleteEvent(id);
            window._toast('已删除', 'success');
        }

        function getEventIcon(type) {
            const icons = {
                '收藏': 'fa-star', '投递': 'fa-paper-plane', '简历筛选': 'fa-filter',
                '笔试': 'fa-pen', '一面': 'fa-user', '二面': 'fa-users',
                '三面': 'fa-users', '终面': 'fa-flag', 'HR面': 'fa-handshake',
                'OC': 'fa-phone', 'Offer': 'fa-trophy', '拒信': 'fa-times-circle', '其他': 'fa-dot-circle'
            };
            return icons[type] || 'fa-dot-circle';
        }

        function getEventColor(type) {
            const colors = {
                '收藏': '#9ca3af', '投递': '#3b82f6', '简历筛选': '#6366f1',
                '笔试': '#8b5cf6', '一面': '#f59e0b', '二面': '#f97316',
                '三面': '#ef4444', '终面': '#dc2626', 'HR面': '#ec4899',
                'OC': '#14b8a6', 'Offer': '#10b981', '拒信': '#6b7280', '其他': '#94a3b8'
            };
            return colors[type] || '#94a3b8';
        }

        function getEventDotClass(type) { return 'dot-' + store.getStatusFromEventType(type); }

        // Note functions
        function openAddNote() {
            editingNote.value = null;
            noteForm.value = getDefaultNoteForm();
            showNoteForm.value = true;
        }

        function openEditNote(note) {
            editingNote.value = note;
            noteForm.value = {
                round: note.round || '',
                question: note.question || '',
                answer: note.answer || '',
                review: note.review || ''
            };
            showNoteForm.value = true;
        }

        async function saveNote() {
            if (!noteForm.value.question.trim()) {
                window._toast('请输入题目内容', 'warning');
                return;
            }
            const data = {
                jobId: Number(props.jobId),
                company: job.value.company,
                title: job.value.title,
                categoryId: job.value.categoryId || null,
                round: noteForm.value.round.trim(),
                question: noteForm.value.question.trim(),
                answer: noteForm.value.answer.trim(),
                review: noteForm.value.review.trim()
            };

            if (editingNote.value) {
                await store.updateNote(editingNote.value.id, data);
                window._toast('面经已更新', 'success');
            } else {
                await store.addNote(data);
                window._toast('面经已添加', 'success');
            }
            showNoteForm.value = false;
        }

        async function deleteNote(id) {
            if (!confirm('确定删除此面经记录？')) return;
            await store.deleteNote(id);
            window._toast('已删除', 'success');
        }

        async function changeStatus(newStatus) {
            await store.updateJob(props.jobId, { status: newStatus });
            window._toast('状态已更新为「' + store.getStatusLabel(newStatus) + '」', 'success');
        }

        function editJob() {
            Vue.emitter.emit('open-job-form', { ...job.value });
        }

        async function deleteCurrentJob() {
            if (!confirm('确定删除「' + job.value.company + ' - ' + job.value.title + '」？此操作不可撤销。')) return;
            await store.deleteJob(props.jobId);
            window._toast('已删除', 'success');
            window.router.push('/jobs');
        }

        function goBack() {
            window.router.push('/jobs');
        }

        function showTagColor(tag) {
            const t = store.tags.find(t => t.name === tag);
            return t ? t.color : '#6b7280';
        }

        function formatDateShort(d) {
            if (!d) return '';
            return new Date(d).toLocaleDateString('zh-CN');
        }

        return {
            job, events, notes, showEventForm, showNoteForm, eventForm, noteForm, editingNote,
            store, formatDate, formatSalary,
            addEvent, deleteEvent, getEventIcon, getEventColor, getEventDotClass,
            openAddNote, openEditNote, saveNote, deleteNote,
            changeStatus, editJob, deleteCurrentJob, goBack, showTagColor, formatDateShort
        };
    },
    template: `
        <div v-if="job">
            <!-- 顶部信息栏 -->
            <div class="detail-header">
                <div>
                    <button class="btn btn-ghost btn-sm mb-2" @click="goBack">
                        <i class="fas fa-arrow-left"></i> 返回列表
                    </button>
                    <div class="detail-title">{{ job.company }} <span style="font-weight: 400; font-size: 1rem; color: var(--text-secondary);">/ {{ job.title }}</span></div>
                    <div style="display: flex; align-items: center; gap: 10px; margin-top: 6px; flex-wrap: wrap;">
                        <span class="status-badge" :class="'status-' + job.status">
                            <span class="status-dot" :class="'dot-' + job.status"></span>
                            {{ store.getStatusLabel(job.status) }}
                        </span>
                        <!-- 赛道标签 -->
                        <span class="tag-label" v-if="job.categoryId"
                            :style="{ background: store.getCategoryColor(job.categoryId) + '20', color: store.getCategoryColor(job.categoryId), fontSize: '0.82rem', padding: '3px 10px' }">
                            <i class="fas fa-circle" style="font-size: 0.5rem; margin-right: 4px;"></i>
                            {{ store.getCategoryName(job.categoryId) }} 赛道
                        </span>
                        <span v-if="job.channel" style="font-size: 0.82rem; color: var(--text-secondary);">
                            <i class="fas fa-route"></i> {{ job.channel }}
                        </span>
                        <span v-if="job.priority === 'high'" class="priority-high">高优先级</span>
                    </div>
                </div>
                <div class="detail-actions">
                    <button class="btn btn-sm" @click="editJob"><i class="fas fa-edit"></i> 编辑</button>
                    <select class="filter-select" @change="changeStatus($event.target.value)" style="height: 32px;" v-if="job.status !== 'offer' && job.status !== 'rejected'">
                        <option value="">切换状态...</option>
                        <option value="pending">待投递</option>
                        <option value="applied">已投递</option>
                        <option value="interviewing">面试中</option>
                        <option value="offer">Offer</option>
                        <option value="rejected">已挂</option>
                    </select>
                    <button class="btn btn-sm btn-danger" @click="deleteCurrentJob"><i class="fas fa-trash"></i> 删除</button>
                </div>
            </div>

            <div class="detail-grid">
                <!-- 左侧：基本信息 -->
                <div class="detail-section">
                    <div class="section-header">
                        <span><i class="fas fa-info-circle"></i> 基本信息</span>
                    </div>
                    <div class="section-body">
                        <div class="info-grid">
                            <div class="info-item">
                                <span class="info-label">公司名称</span>
                                <span class="info-value">{{ job.company }}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">岗位名称</span>
                                <span class="info-value">{{ job.title }}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">岗位赛道</span>
                                <span class="info-value" v-if="job.categoryId">
                                    <span class="tag-label" :style="{ background: store.getCategoryColor(job.categoryId) + '20', color: store.getCategoryColor(job.categoryId) }">
                                        {{ store.getCategoryName(job.categoryId) }}
                                    </span>
                                </span>
                                <span class="info-value" v-else style="color: var(--text-muted);">未分类</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">工作地点</span>
                                <span class="info-value">{{ job.city || '-' }}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">薪资范围</span>
                                <span class="info-value">{{ formatSalary(job) }}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">投递渠道</span>
                                <span class="info-value">{{ job.channel || '-' }}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">优先级</span>
                                <span class="info-value">{{ store.getPriorityLabel(job.priority) }}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">绑定简历</span>
                                <span class="info-value" v-if="job.resumeBindId">{{ store.getResumeName(job.resumeBindId) || '-' }}</span>
                                <span class="info-value" v-else style="color:var(--text-muted);">-</span>
                            </div>
                            <div class="info-item" style="grid-column: 1 / -1;">
                                <span class="info-label">创建时间</span>
                                <span class="info-value" style="font-size: 0.82rem;">{{ formatDate(job.createdAt) }}</span>
                            </div>
                        </div>

                        <div v-if="job.tags && job.tags.length > 0" style="margin-top: 16px;">
                            <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 6px;">标签</div>
                            <div>
                                <span class="tag-label" v-for="tag in job.tags" :key="tag"
                                    :style="{ background: showTagColor(tag) + '20', color: showTagColor(tag) }">
                                    {{ tag }}
                                </span>
                            </div>
                        </div>

                        <div v-if="job.url" style="margin-top: 16px;">
                            <a :href="job.url" target="_blank" class="btn btn-sm">
                                <i class="fas fa-external-link"></i> 查看岗位链接
                            </a>
                        </div>

                        <div v-if="job.jd" style="margin-top: 16px;">
                            <div style="font-size: 0.85rem; font-weight: 600; margin-bottom: 8px;">
                                <i class="fas fa-file-lines"></i> JD原文
                            </div>
                            <div style="background: var(--bg); padding: 12px; border-radius: var(--radius); font-size: 0.82rem; white-space: pre-wrap; max-height: 300px; overflow-y: auto; color: var(--text-secondary);">
                                {{ job.jd }}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 右侧：时间线 + 面试笔记 -->
                <div>
                    <!-- 进度时间线 -->
                    <div class="detail-section" style="margin-bottom: 20px;">
                        <div class="section-header">
                            <span><i class="fas fa-timeline"></i> 投递进度时间线</span>
                            <button class="btn btn-sm btn-primary" @click="showEventForm = !showEventForm">
                                <i class="fas fa-plus"></i> 添加事件
                            </button>
                        </div>
                        <div class="section-body">
                            <div v-if="showEventForm" style="margin-bottom: 16px; padding: 14px; background: var(--bg); border-radius: var(--radius); border: 1px solid var(--border);">
                                <div class="form-row" style="margin-bottom: 10px;">
                                    <div class="form-group" style="margin-bottom: 0;">
                                        <label style="font-size: 0.8rem;">事件类型</label>
                                        <select class="form-control" v-model="eventForm.type" style="height: 34px;">
                                            <option value="投递">投递</option>
                                            <option value="简历筛选">简历筛选</option>
                                            <option value="笔试">笔试</option>
                                            <option value="一面">一面</option>
                                            <option value="二面">二面</option>
                                            <option value="三面">三面</option>
                                            <option value="终面">终面</option>
                                            <option value="HR面">HR面</option>
                                            <option value="OC">OC</option>
                                            <option value="Offer">Offer</option>
                                            <option value="拒信">拒信</option>
                                            <option value="其他">其他</option>
                                        </select>
                                    </div>
                                    <div class="form-group" style="margin-bottom: 0;">
                                        <label style="font-size: 0.8rem;">日期</label>
                                        <input type="date" class="form-control" v-model="eventForm.date" style="height: 34px;" />
                                    </div>
                                </div>
                                <div class="form-group" style="margin-bottom: 8px;">
                                    <label style="font-size: 0.8rem;">备注</label>
                                    <textarea class="form-control" v-model="eventForm.note" rows="2" placeholder="面试感受、题目方向..."></textarea>
                                </div>
                                <div style="display: flex; gap: 8px;">
                                    <button class="btn btn-primary btn-sm" @click="addEvent"><i class="fas fa-check"></i> 确认添加</button>
                                    <button class="btn btn-sm" @click="showEventForm = false">取消</button>
                                </div>
                            </div>

                            <div class="timeline-detail" v-if="events.length > 0">
                                <div class="tl-event" v-for="evt in events" :key="evt.id">
                                    <div class="tl-event-dot" :style="{ borderColor: getEventColor(evt.type), color: getEventColor(evt.type) }">
                                        <i class="fas" :class="getEventIcon(evt.type)" style="font-size: 0.5rem;"></i>
                                    </div>
                                    <div class="tl-event-date">{{ formatDate(evt.date) }}</div>
                                    <div class="tl-event-title">{{ evt.type }}</div>
                                    <div class="tl-event-note" v-if="evt.note">{{ evt.note }}</div>
                                    <div class="tl-event-actions">
                                        <button class="btn-icon" title="删除" @click="deleteEvent(evt.id)"><i class="fas fa-times" style="font-size: 0.7rem;"></i></button>
                                    </div>
                                </div>
                            </div>
                            <div class="empty-state" v-else style="padding: 24px;">
                                <div class="empty-icon"><i class="fas fa-timeline"></i></div>
                                <div class="empty-text">暂无进度记录</div>
                                <button class="btn btn-primary btn-sm" @click="showEventForm = true">
                                    <i class="fas fa-plus"></i> 记录第一个进度
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- 面试笔记 -->
                    <div class="detail-section">
                        <div class="section-header">
                            <span><i class="fas fa-book-open"></i> 面试记录</span>
                            <button class="btn btn-sm btn-primary" @click="openAddNote">
                                <i class="fas fa-plus"></i> 新增笔记
                            </button>
                        </div>
                        <div class="section-body">
                            <div v-if="showNoteForm" style="margin-bottom: 16px; padding: 14px; background: var(--bg); border-radius: var(--radius); border: 1px solid var(--border);">
                                <div class="form-group" style="margin-bottom: 8px;">
                                    <label style="font-size: 0.8rem;">面试轮次</label>
                                    <input class="form-control" v-model="noteForm.round" placeholder="如：一面" style="height: 34px;" />
                                </div>
                                <div class="form-group" style="margin-bottom: 8px;">
                                    <label style="font-size: 0.8rem;">题目内容 <span class="required">*</span></label>
                                    <textarea class="form-control" v-model="noteForm.question" rows="3" placeholder="面试题目/问题描述..."></textarea>
                                </div>
                                <div class="form-group" style="margin-bottom: 8px;">
                                    <label style="font-size: 0.8rem;">我的回答</label>
                                    <textarea class="form-control" v-model="noteForm.answer" rows="3" placeholder="你的回答要点..."></textarea>
                                </div>
                                <div class="form-group" style="margin-bottom: 8px;">
                                    <label style="font-size: 0.8rem;">复盘总结</label>
                                    <textarea class="form-control" v-model="noteForm.review" rows="2" placeholder="反思与改进..."></textarea>
                                </div>
                                <div style="display: flex; gap: 8px;">
                                    <button class="btn btn-primary btn-sm" @click="saveNote"><i class="fas fa-check"></i> 保存</button>
                                    <button class="btn btn-sm" @click="showNoteForm = false">取消</button>
                                </div>
                            </div>

                            <div v-if="notes.length > 0">
                                <div class="note-item" v-for="n in notes" :key="n.id">
                                    <div class="note-header">
                                        <span class="note-round">
                                            <i class="fas fa-comment"></i>
                                            {{ n.round || '面试笔记' }}
                                        </span>
                                        <div class="note-actions">
                                            <button class="btn-icon" title="编辑" @click="openEditNote(n)"><i class="fas fa-edit"></i></button>
                                            <button class="btn-icon" title="删除" @click="deleteNote(n.id)"><i class="fas fa-trash"></i></button>
                                        </div>
                                    </div>
                                    <div class="note-question"><strong>题目：</strong>{{ n.question }}</div>
                                    <div class="note-answer" v-if="n.answer"><strong>回答：</strong>{{ n.answer }}</div>
                                    <div class="note-review" v-if="n.review"><i class="fas fa-lightbulb"></i> {{ n.review }}</div>
                                </div>
                            </div>
                            <div class="empty-state" v-else style="padding: 24px;">
                                <div class="empty-icon"><i class="fas fa-book"></i></div>
                                <div class="empty-text">暂无面试笔记</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="empty-state" v-else style="min-height: 300px;">
            <div class="empty-icon"><i class="fas fa-spinner fa-spin"></i></div>
            <div class="empty-text">加载中...</div>
        </div>
    `
};
