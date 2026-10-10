/* ============================================
   简历版本管理组件
   ============================================ */
const ResumeManage = {
    setup() {
        const store = window.store;
        const showForm = Vue.ref(false);
        const editingId = Vue.ref(null);
        const form = Vue.ref(getDefaultForm());
        const categoryFilter = Vue.ref('');

        function getDefaultForm() {
            return { name: '', categoryIds: [], remark: '' };
        }

        Vue.onMounted(() => {
            store.setPageMeta('简历版本管理', 'fa-file');
        });

        const filteredResumes = Vue.computed(() => {
            let list = [...store.resumes];
            if (categoryFilter.value) {
                const catId = Number(categoryFilter.value);
                list = list.filter(r => r.categoryIds && r.categoryIds.includes(catId));
            }
            return list;
        });

        function openAdd() {
            editingId.value = null;
            form.value = getDefaultForm();
            showForm.value = true;
        }

        function openEdit(resume) {
            editingId.value = resume.id;
            form.value = {
                name: resume.name || '',
                categoryIds: resume.categoryIds || [],
                remark: resume.remark || ''
            };
            showForm.value = true;
        }

        function closeForm() { showForm.value = false; }

        function toggleCategory(catId) {
            const id = Number(catId);
            const idx = form.value.categoryIds.indexOf(id);
            if (idx >= 0) form.value.categoryIds.splice(idx, 1);
            else form.value.categoryIds.push(id);
        }

        async function save() {
            if (!form.value.name.trim()) {
                window._toast('请输入简历名称', 'warning');
                return;
            }
            const data = {
                name: form.value.name.trim(),
                categoryIds: [...form.value.categoryIds],
                remark: form.value.remark.trim()
            };
            try {
                if (editingId.value) {
                    await store.updateResume(editingId.value, data);
                    window._toast('简历已更新', 'success');
                } else {
                    await store.addResume(data);
                    window._toast('简历已添加', 'success');
                }
                showForm.value = false;
            } catch (e) {
                window._toast('保存失败: ' + e.message, 'error');
            }
        }

        async function deleteResume(resume) {
            if (!confirm('确定删除简历「' + resume.name + '」？')) return;
            await store.deleteResume(resume.id);
            window._toast('已删除', 'success');
        }

        async function setAsDefault(catId, resumeId) {
            await store.setCategoryDefaultResume(catId, resumeId);
            window._toast('已设为' + store.getCategoryName(catId) + '的默认简历', 'success');
        }

        function getCategoryBadge(catId) {
            const cat = store.getCategory(catId);
            return cat || null;
        }

        return { store, showForm, editingId, form, categoryFilter, filteredResumes, openAdd, openEdit, closeForm, toggleCategory, save, deleteResume, setAsDefault, getCategoryBadge };
    },
    template: `
        <div>
            <!-- 工具栏 -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <select class="filter-select" v-model="categoryFilter" style="height: 34px;">
                        <option value="">全部赛道</option>
                        <option v-for="cat in store.categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                    </select>
                </div>
                <button class="btn btn-primary btn-sm" @click="openAdd">
                    <i class="fas fa-plus"></i> 新增简历版本
                </button>
            </div>

            <!-- 简历列表 -->
            <div class="card-grid" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));">
                <div class="job-card" v-for="resume in filteredResumes" :key="resume.id">
                    <div class="card-top">
                        <div>
                            <div class="card-company">
                                <i class="fas fa-file-alt" style="color: var(--primary);"></i>
                                {{ resume.name }}
                            </div>
                        </div>
                    </div>

                    <!-- 适配赛道标签 -->
                    <div style="margin-bottom: 12px;">
                        <template v-if="resume.categoryIds && resume.categoryIds.length > 0">
                            <span class="tag-label" v-for="catId in resume.categoryIds" :key="catId"
                                :style="{ background: store.getCategoryColor(catId) + '20', color: store.getCategoryColor(catId), margin: '2px' }">
                                <i class="fas fa-circle" style="font-size: 0.5rem; margin-right: 3px;"></i>
                                {{ store.getCategoryName(catId) }}
                            </span>
                        </template>
                        <span v-else style="color: var(--text-muted); font-size: 0.78rem;">未绑定赛道</span>
                    </div>

                    <div v-if="resume.remark" style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 12px; padding: 8px 10px; background: var(--bg); border-radius: var(--radius-sm);">
                        <i class="fas fa-lightbulb"></i> {{ resume.remark }}
                    </div>

                    <div class="card-bottom">
                        <span style="font-size: 0.75rem; color: var(--text-muted);">
                            创建于 {{ new Date(resume.createdAt).toLocaleDateString('zh-CN') }}
                        </span>
                        <div style="display: flex; gap: 4px;">
                            <button class="btn-icon" title="编辑" @click="openEdit(resume)"><i class="fas fa-edit"></i></button>
                            <button class="btn-icon" title="删除" @click="deleteResume(resume)"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>

                    <!-- 设为默认简历 -->
                    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border-light); display: flex; flex-wrap: wrap; gap: 6px;">
                        <span style="font-size: 0.72rem; color: var(--text-muted); width: 100%; margin-bottom: 2px;">设为赛道默认简历：</span>
                        <button v-for="cat in store.categories" :key="cat.id"
                            class="btn btn-sm btn-ghost"
                            :style="{ fontSize: '0.72rem', padding: '2px 8px', color: cat.color, borderColor: cat.color + '40' }"
                            @click="setAsDefault(cat.id, resume.id)">
                            <i class="fas fa-check" v-if="cat.defaultResumeId === resume.id"></i>
                            {{ cat.name }}
                        </button>
                    </div>
                </div>

                <div class="empty-state" v-if="filteredResumes.length === 0" style="grid-column: 1 / -1;">
                    <div class="empty-icon"><i class="fas fa-file"></i></div>
                    <div class="empty-text">{{ store.resumes.length === 0 ? '暂无简历版本，点击右上角新增' : '当前筛选条件下无匹配简历' }}</div>
                </div>
            </div>

            <!-- 新增/编辑弹窗 -->
            <div class="modal-overlay" v-if="showForm" @click.self="closeForm">
                <div class="modal-content" style="max-width: 480px;">
                    <div class="modal-header">
                        <h3>{{ editingId ? '编辑简历' : '新增简历版本' }}</h3>
                        <button class="modal-close" @click="closeForm"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>简历名称 <span class="required">*</span></label>
                            <input class="form-control" v-model="form.name" placeholder="如：前端技术简历V2" />
                        </div>
                        <div class="form-group">
                            <label>适配赛道（可多选）</label>
                            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                                <label v-for="cat in store.categories" :key="cat.id"
                                    style="display: flex; align-items: center; gap: 6px; padding: 6px 12px; border: 1px solid var(--border); border-radius: var(--radius); cursor: pointer; transition: var(--transition); font-size: 0.85rem;"
                                    :style="{ background: form.categoryIds.includes(cat.id) ? cat.color + '15' : '', borderColor: form.categoryIds.includes(cat.id) ? cat.color : '' }">
                                    <input type="checkbox" :checked="form.categoryIds.includes(cat.id)" @change="toggleCategory(cat.id)" style="accent-color: cat.color;" />
                                    <span :style="{ color: cat.color }"><i class="fas fa-circle" style="font-size: 0.5rem;"></i></span>
                                    {{ cat.name }}
                                </label>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>简历备注/亮点</label>
                            <textarea class="form-control" v-model="form.remark" rows="3" placeholder="如：突出项目经验，适配B端产品赛道..."></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn" @click="closeForm">取消</button>
                        <button class="btn btn-primary" @click="save"><i class="fas fa-check"></i> 保存</button>
                    </div>
                </div>
            </div>
        </div>
    `
};
