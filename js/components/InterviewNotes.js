/* ============================================
   面试面经库组件 (v2 - 赛道筛选)
   ============================================ */
const InterviewNotes = {
    setup() {
        const store = window.store;
        const selectedCompany = Vue.ref('');
        const searchKeyword = Vue.ref('');
        const categoryFilter = Vue.ref('');

        Vue.onMounted(() => {
            store.setPageMeta('面试面经库', 'fa-book');
        });

        const companies = Vue.computed(() => {
            return store.getCompaniesWithNotes(categoryFilter.value || null);
        });

        const currentNotes = Vue.computed(() => {
            if (!selectedCompany.value) return [];
            let list = store.getNotesByCompany(selectedCompany.value);
            // Apply category filter if set
            if (categoryFilter.value) {
                list = list.filter(n => n.categoryId === Number(categoryFilter.value));
            }
            if (searchKeyword.value.trim()) {
                const kw = searchKeyword.value.trim().toLowerCase();
                list = list.filter(n =>
                    n.question.toLowerCase().includes(kw) ||
                    n.answer.toLowerCase().includes(kw) ||
                    n.review.toLowerCase().includes(kw) ||
                    (n.title && n.title.toLowerCase().includes(kw))
                );
            }
            return list;
        });

        function selectCompany(company) {
            selectedCompany.value = company;
            searchKeyword.value = '';
        }

        return { store, selectedCompany, searchKeyword, categoryFilter, companies, currentNotes, selectCompany };
    },
    template: `
        <div>
            <!-- 搜索与筛选 -->
            <div style="display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; align-items: center;">
                <div class="search-box" style="flex: 1; min-width: 200px;">
                    <i class="fas fa-search"></i>
                    <input type="text" v-model="searchKeyword" placeholder="搜索题目、回答、复盘内容..." style="width: 100%; height: 36px; padding: 0 14px 0 36px; border: 1px solid var(--border); border-radius: 20px; background: var(--bg-white);" />
                </div>
                <select class="filter-select" v-model="categoryFilter" style="height: 36px;">
                    <option value="">全部赛道</option>
                    <option v-for="cat in store.categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                </select>
            </div>

            <div class="interview-layout">
                <!-- 左侧：公司列表 -->
                <div class="company-list">
                    <div class="list-header">
                        <i class="fas fa-building"></i> 公司列表
                        <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 400;" v-if="companies.length">
                            {{ companies.length }}
                        </span>
                    </div>
                    <div v-if="companies.length > 0">
                        <div class="company-item"
                            v-for="c in companies"
                            :key="c.company"
                            :class="{ active: selectedCompany === c.company }"
                            @click="selectCompany(c.company)">
                            <span><i class="fas fa-building"></i> {{ c.company }}</span>
                            <span class="company-count">{{ c.count }}</span>
                        </div>
                    </div>
                    <div class="empty-state" v-else style="padding: 24px;">
                        <div class="empty-icon"><i class="fas fa-building" style="font-size: 1.5rem;"></i></div>
                        <div class="empty-text" style="font-size: 0.82rem;">暂无面经</div>
                    </div>
                </div>

                <!-- 右侧：面经列表 -->
                <div class="notes-panel">
                    <div class="panel-header">
                        <span>
                            <i class="fas fa-book-open"></i>
                            {{ selectedCompany ? selectedCompany + ' 的面经' : '请选择公司' }}
                        </span>
                        <span style="font-size: 0.78rem; color: var(--text-muted);" v-if="currentNotes.length">
                            共 {{ currentNotes.length }} 条
                        </span>
                    </div>
                    <div class="panel-body">
                        <div v-if="selectedCompany && currentNotes.length > 0">
                            <div class="note-item" v-for="n in currentNotes" :key="n.id">
                                <div class="note-header">
                                    <span class="note-round">
                                        <i class="fas fa-tag"></i>
                                        {{ n.title || '未知岗位' }}
                                        <span style="color: var(--text-muted); font-weight: 400;" v-if="n.round">· {{ n.round }}</span>
                                    </span>
                                    <div>
                                        <!-- 赛道标签 -->
                                        <span class="tag-label" v-if="n.categoryId"
                                            :style="{ background: store.getCategoryColor(n.categoryId) + '20', color: store.getCategoryColor(n.categoryId), fontSize: '0.7rem' }">
                                            <i class="fas fa-circle" style="font-size: 0.4rem; margin-right: 3px;"></i>
                                            {{ store.getCategoryName(n.categoryId) }}
                                        </span>
                                    </div>
                                </div>
                                <div class="note-question"><strong>📝 题目：</strong>{{ n.question }}</div>
                                <div class="note-answer" v-if="n.answer"><strong>💡 回答：</strong>{{ n.answer }}</div>
                                <div class="note-review" v-if="n.review"><i class="fas fa-lightbulb"></i> {{ n.review }}</div>
                            </div>
                        </div>
                        <div class="empty-state" v-else-if="selectedCompany && currentNotes.length === 0 && searchKeyword">
                            <div class="empty-icon"><i class="fas fa-search"></i></div>
                            <div class="empty-text">未找到匹配的面经</div>
                        </div>
                        <div class="empty-state" v-else-if="!selectedCompany">
                            <div class="empty-icon"><i class="fas fa-hand-point-left"></i></div>
                            <div class="empty-text">请从左侧选择一家公司查看面经</div>
                            <p style="font-size: 0.82rem; color: var(--text-muted); margin-top: 8px;">在职位详情页添加面试笔记后，内容会自动同步到这里</p>
                        </div>
                        <div class="empty-state" v-else>
                            <div class="empty-icon"><i class="fas fa-book"></i></div>
                            <div class="empty-text">该公司暂无面经记录</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
};
