/* ============================================
   职位列表组件 (v2 - 新增赛道筛选与标签)
   ============================================ */
const JobList = {
    props: {
        filterStatus: { type: String, default: '' },
        filterCategoryId: { type: [String, Number], default: '' }
    },
    emits: ['add-job'],
    setup(props) {
        const viewMode = Vue.ref('table');
        const selectedIds = Vue.ref([]);
        const statusFilter = Vue.ref(props.filterStatus || '');
        const categoryFilter = Vue.ref(props.filterCategoryId !== undefined && props.filterCategoryId !== '' ? String(props.filterCategoryId) : '');
        const tagFilter = Vue.ref([]);
        const priorityFilter = Vue.ref('');
        const citySearch = Vue.ref('');
        const batchTargetCategory = Vue.ref('');

        // Page title
        Vue.onMounted(() => {
            const catId = categoryFilter.value;
            if (catId && catId !== '') {
                const catName = catId === 'null' ? '未分类' : store.getCategoryName(Number(catId));
                store.setPageMeta(catName + ' 赛道', 'fa-layer-group');
            } else {
                const statusNames = {
                    '': '全部职位',
                    pending: '待投递',
                    applied: '已投递',
                    interviewing: '面试中',
                    offer: 'Offer',
                    rejected: '已结束'
                };
                const icons = {
                    '': 'fa-list', pending: 'fa-inbox', applied: 'fa-paper-plane',
                    interviewing: 'fa-comments', offer: 'fa-trophy', rejected: 'fa-archive'
                };
                store.setPageMeta(statusNames[statusFilter.value] || '全部职位', icons[statusFilter.value] || 'fa-list');
            }
        });

        // Watch for route changes to update filters
        Vue.watch(() => props.filterStatus, (val) => {
            statusFilter.value = val || '';
        });
        Vue.watch(() => props.filterCategoryId, (val) => {
            categoryFilter.value = (val !== undefined && val !== '') ? String(val) : '';
        });

        const filteredJobs = Vue.computed(() => {
            const f = {
                status: statusFilter.value || undefined,
                categoryId: categoryFilter.value !== '' ? categoryFilter.value : undefined,
                keyword: store.searchKeyword || undefined,
                tags: tagFilter.value.length > 0 ? tagFilter.value : undefined,
                priority: priorityFilter.value || undefined,
                city: citySearch.value || undefined
            };
            return store.getFilteredJobs(f);
        });

        const hasSelection = Vue.computed(() => selectedIds.value.length > 0);

        function toggleSelect(id) {
            const idx = selectedIds.value.indexOf(id);
            if (idx >= 0) selectedIds.value.splice(idx, 1);
            else selectedIds.value.push(id);
        }

        function toggleSelectAll() {
            if (selectedIds.value.length === filteredJobs.value.length) {
                selectedIds.value = [];
            } else {
                selectedIds.value = filteredJobs.value.map(j => j.id);
            }
        }

        function isSelected(id) {
            return selectedIds.value.includes(id);
        }

        async function batchDelete() {
            if (!confirm('确定删除选中的 ' + selectedIds.value.length + ' 个职位？')) return;
            await store.deleteJobs([...selectedIds.value]);
            selectedIds.value = [];
            window._toast('删除成功', 'success');
        }

        async function batchStatus(newStatus) {
            for (const id of selectedIds.value) {
                await store.updateJob(id, { status: newStatus });
            }
            window._toast('状态已更新', 'success');
            selectedIds.value = [];
        }

        async function batchCategory() {
            if (!batchTargetCategory.value) { window._toast('请选择目标赛道', 'warning'); return; }
            const catId = batchTargetCategory.value === 'null' ? null : Number(batchTargetCategory.value);
            await store.batchSetCategory([...selectedIds.value], catId);
            window._toast('赛道已批量更新', 'success');
            selectedIds.value = [];
            batchTargetCategory.value = '';
        }

        function viewJob(id) {
            window.router.push('/job/' + id);
        }

        function quickStatus(job, status, e) {
            e.stopPropagation();
            store.updateJob(job.id, { status });
            window._toast('状态已更新为「' + store.getStatusLabel(status) + '」', 'success');
        }

        function editJob(job, e) {
            e.stopPropagation();
            Vue.emitter.emit('open-job-form', { ...job });
        }

        async function deleteJob(job, e) {
            e.stopPropagation();
            if (!confirm('确定删除「' + job.company + ' - ' + job.title + '」？')) return;
            await store.deleteJob(job.id);
            window._toast('已删除', 'success');
        }

        function getStatusNextActions(status) {
            const actions = {
                pending: [{ status: 'applied', label: '标记已投递' }],
                applied: [{ status: 'interviewing', label: '有面试' }, { status: 'rejected', label: '已挂' }],
                interviewing: [{ status: 'offer', label: '拿Offer' }, { status: 'rejected', label: '已挂' }]
            };
            return actions[status] || [];
        }

        function getStatusDot(status) { return 'dot-' + status; }

        function formatDate(d) {
            if (!d) return '-';
            return new Date(d).toLocaleDateString('zh-CN');
        }

        function formatSalary(job) {
            if (job.salaryMin && job.salaryMax) return job.salaryMin + '-' + job.salaryMax + 'K';
            if (job.salaryMin) return job.salaryMin + 'K起';
            if (job.salaryMax) return '~' + job.salaryMax + 'K';
            return '-';
        }

        function showTagColor(tag) {
            const t = store.tags.find(t => t.name === tag);
            return t ? t.color : '#6b7280';
        }

        return {
            viewMode, selectedIds, statusFilter, categoryFilter, tagFilter, priorityFilter,
            citySearch, batchTargetCategory, store, filteredJobs, hasSelection,
            toggleSelect, toggleSelectAll, isSelected, batchDelete, batchStatus, batchCategory,
            viewJob, quickStatus, editJob, deleteJob, getStatusNextActions,
            getStatusDot, formatDate, formatSalary, showTagColor
        };
    },
    template: `
        <div>
            <!-- 工具栏 -->
            <div class="list-toolbar">
                <div class="filter-group">
                    <select class="filter-select" v-model="statusFilter">
                        <option value="">全部状态</option>
                        <option value="pending">待投递</option>
                        <option value="applied">已投递</option>
                        <option value="interviewing">面试中</option>
                        <option value="offer">Offer</option>
                        <option value="rejected">已挂</option>
                    </select>
                    <select class="filter-select" v-model="categoryFilter">
                        <option value="">全部赛道</option>
                        <option v-for="cat in store.categories" :key="cat.id" :value="String(cat.id)">
                            {{ cat.name }}
                        </option>
                        <option value="null">未分类</option>
                    </select>
                    <select class="filter-select" v-model="priorityFilter">
                        <option value="">全部优先级</option>
                        <option value="high">高优先级</option>
                        <option value="medium">中优先级</option>
                        <option value="low">低优先级</option>
                    </select>
                    <input class="filter-select" v-model="citySearch" placeholder="城市" style="width: 90px;" />
                </div>
                <div class="toolbar-right">
                    <div class="view-toggle">
                        <button :class="{ active: viewMode === 'table' }" @click="viewMode = 'table'" title="表格视图">
                            <i class="fas fa-table"></i>
                        </button>
                        <button :class="{ active: viewMode === 'card' }" @click="viewMode = 'card'" title="卡片视图">
                            <i class="fas fa-th-large"></i>
                        </button>
                    </div>
                    <button class="btn btn-primary btn-sm" @click="$emit('add-job')">
                        <i class="fas fa-plus"></i> 新增
                    </button>
                </div>
            </div>

            <!-- 批量操作栏 -->
            <div class="batch-bar" v-if="hasSelection">
                <i class="fas fa-check-circle"></i>
                已选择 <strong>{{ selectedIds.length }}</strong> 个职位
                <div style="margin-left: auto; display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                    <select class="filter-select" @change="batchStatus($event.target.value)" style="height: 30px; font-size: 0.8rem;">
                        <option value="">批量改状态</option>
                        <option value="pending">待投递</option>
                        <option value="applied">已投递</option>
                        <option value="interviewing">面试中</option>
                        <option value="offer">Offer</option>
                        <option value="rejected">已挂</option>
                    </select>
                    <div style="display: flex; gap: 4px; align-items: center;">
                        <select class="filter-select" v-model="batchTargetCategory" style="height: 30px; font-size: 0.8rem;">
                            <option value="">修改赛道</option>
                            <option v-for="cat in store.categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                            <option value="null">未分类</option>
                        </select>
                        <button class="btn btn-sm btn-primary" @click="batchCategory" style="font-size: 0.75rem;">执行</button>
                    </div>
                    <button class="btn btn-sm btn-danger" @click="batchDelete">
                        <i class="fas fa-trash"></i> 删除
                    </button>
                    <button class="btn btn-sm" @click="selectedIds = []">取消</button>
                </div>
            </div>

            <!-- 表格视图 -->
            <div class="card" v-if="viewMode === 'table'">
                <div class="table-wrap">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th class="checkbox-cell" v-if="filteredJobs.length > 0">
                                    <input type="checkbox" @change="toggleSelectAll" :checked="selectedIds.length === filteredJobs.length && filteredJobs.length > 0" />
                                </th>
                                <th>赛道</th>
                                <th>公司</th>
                                <th>岗位</th>
                                <th>地点</th>
                                <th>薪资</th>
                                <th>状态</th>
                                <th>优先级</th>
                                <th>更新</th>
                                <th style="width: 80px;">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="job in filteredJobs" :key="job.id" class="cursor-pointer" @click="viewJob(job.id)">
                                <td class="checkbox-cell" @click.stop>
                                    <input type="checkbox" :checked="isSelected(job.id)" @change="toggleSelect(job.id)" />
                                </td>
                                <td>
                                    <span class="tag-label" v-if="job.categoryId"
                                        :style="{ background: store.getCategoryColor(job.categoryId) + '20', color: store.getCategoryColor(job.categoryId) }">
                                        <i class="fas fa-circle" style="font-size: 0.5rem; margin-right: 3px;"></i>
                                        {{ store.getCategoryName(job.categoryId) }}
                                    </span>
                                    <span class="tag-label" v-else style="background:#f3f4f6;color:#94a3b8;">
                                        未分类
                                    </span>
                                </td>
                                <td>
                                    <div class="job-company">{{ job.company }}</div>
                                </td>
                                <td>
                                    <div class="job-title">{{ job.title }}</div>
                                </td>
                                <td><span class="text-muted">{{ job.city || '-' }}</span></td>
                                <td><span class="text-muted">{{ formatSalary(job) }}</span></td>
                                <td>
                                    <span class="status-badge" :class="'status-' + job.status">
                                        <span class="status-dot" :class="getStatusDot(job.status)"></span>
                                        {{ store.getStatusLabel(job.status) }}
                                    </span>
                                </td>
                                <td>
                                    <span v-if="job.priority === 'high'" class="priority-high">高</span>
                                    <span v-else class="text-muted">{{ store.getPriorityLabel(job.priority) }}</span>
                                </td>
                                <td><span class="text-muted" style="font-size: 0.78rem;">{{ formatDate(job.updatedAt) }}</span></td>
                                <td @click.stop>
                                    <div class="row-actions">
                                        <button class="btn-icon" title="编辑" @click="editJob(job, $event)"><i class="fas fa-edit"></i></button>
                                        <button class="btn-icon" title="删除" @click="deleteJob(job, $event)"><i class="fas fa-trash"></i></button>
                                    </div>
                                </td>
                            </tr>
                            <tr v-if="filteredJobs.length === 0">
                                <td colspan="10">
                                    <div class="empty-state">
                                        <div class="empty-icon"><i class="fas fa-briefcase"></i></div>
                                        <div class="empty-text">暂无数据</div>
                                        <button class="btn btn-primary btn-sm" @click="$emit('add-job')">
                                            <i class="fas fa-plus"></i> 新增第一个职位
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="list-footer">
                    共 {{ filteredJobs.length }} 个职位
                </div>
            </div>

            <!-- 卡片视图 -->
            <div class="card-grid" v-if="viewMode === 'card'">
                <div class="job-card" v-for="job in filteredJobs" :key="job.id" @click="viewJob(job.id)">
                    <div class="card-top">
                        <div>
                            <div class="card-company">{{ job.company }}</div>
                            <div class="card-position">{{ job.title }}</div>
                        </div>
                        <span class="status-badge" :class="'status-' + job.status">
                            <span class="status-dot" :class="getStatusDot(job.status)"></span>
                            {{ store.getStatusLabel(job.status) }}
                        </span>
                    </div>
                    <!-- 赛道标签 -->
                    <div style="margin-bottom: 6px;">
                        <span class="tag-label" v-if="job.categoryId"
                            :style="{ background: store.getCategoryColor(job.categoryId) + '20', color: store.getCategoryColor(job.categoryId) }">
                            <i class="fas fa-circle" style="font-size: 0.5rem; margin-right: 3px;"></i>
                            {{ store.getCategoryName(job.categoryId) }}
                        </span>
                        <span class="tag-label" v-else style="background:#f3f4f6;color:#94a3b8;">未分类</span>
                    </div>
                    <div class="card-meta">
                        <span v-if="job.city"><i class="fas fa-location-dot"></i> {{ job.city }}</span>
                        <span v-if="job.salaryMin || job.salaryMax"><i class="fas fa-money-bill"></i> {{ formatSalary(job) }}</span>
                        <span v-if="job.channel"><i class="fas fa-route"></i> {{ job.channel }}</span>
                    </div>
                    <div class="card-tags" v-if="job.tags && job.tags.length > 0" style="margin-bottom: 8px;">
                        <span class="tag-label" v-for="tag in job.tags" :key="tag"
                            :style="{ background: showTagColor(tag) + '20', color: showTagColor(tag) }">
                            {{ tag }}
                        </span>
                    </div>
                    <div class="card-bottom">
                        <span style="font-size: 0.75rem; color: var(--text-muted);">
                            <i class="far fa-clock"></i> {{ formatDate(job.updatedAt) }}
                        </span>
                        <span v-if="job.priority === 'high'" class="priority-high">高优先级</span>
                    </div>
                </div>
                <div class="empty-state" v-if="filteredJobs.length === 0" style="grid-column: 1 / -1;">
                    <div class="empty-icon"><i class="fas fa-briefcase"></i></div>
                    <div class="empty-text">暂无数据</div>
                </div>
            </div>
        </div>
    `
};
