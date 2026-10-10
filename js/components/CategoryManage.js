/* ============================================
   赛道分类管理组件
   固定4大分类，仅支持修改颜色、绑定简历、备注
   ============================================ */
const CategoryManage = {
    setup() {
        const store = window.store;
        const editingId = Vue.ref(null);
        const editForm = Vue.ref({});
        const COLORS = ['#3b82f6', '#9333ea', '#10b981', '#f97316', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1', '#84cc16'];

        Vue.onMounted(() => {
            store.setPageMeta('赛道分类管理', 'fa-layer-group');
        });

        const categories = Vue.computed(() => store.categories);

        function startEdit(cat) {
            editingId.value = cat.id;
            editForm.value = {
                color: cat.color,
                defaultResumeId: cat.defaultResumeId || '',
                remark: cat.remark || ''
            };
        }

        function cancelEdit() {
            editingId.value = null;
            editForm.value = {};
        }

        async function saveEdit(cat) {
            const updates = {};
            if (editForm.value.color !== cat.color) updates.color = editForm.value.color;
            if ((editForm.value.defaultResumeId || '') !== (cat.defaultResumeId || '')) {
                updates.defaultResumeId = editForm.value.defaultResumeId ? Number(editForm.value.defaultResumeId) : null;
            }
            if (editForm.value.remark !== (cat.remark || '')) updates.remark = editForm.value.remark;

            if (Object.keys(updates).length === 0) {
                cancelEdit();
                return;
            }

            await store.updateCategory(cat.id, updates);
            editingId.value = null;
            window._toast('赛道「' + cat.name + '」已更新', 'success');
        }

        function goToCategory(catId) {
            window.router.push('/category/' + catId);
        }

        function getCategoryStats(catId) {
            const s = store.getCategoryStats(catId);
            return s.total + '个职位 · ' + s.offer + '个Offer';
        }

        return { store, editingId, editForm, COLORS, categories, startEdit, cancelEdit, saveEdit, goToCategory, getCategoryStats };
    },
    template: `
        <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <p style="color: var(--text-secondary); font-size: 0.88rem;">
                    <i class="fas fa-info-circle"></i> 固定4大岗位赛道，仅支持修改颜色、绑定默认简历和备注
                </p>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px;">
                <div class="card" v-for="cat in categories" :key="cat.id">
                    <div class="card-body">
                        <!-- 顶部：赛道标识 -->
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                            <div :style="{ width: '40px', height: '40px', borderRadius: '10px', background: cat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '1.1rem' }">
                                {{ cat.name.charAt(0) }}
                            </div>
                            <div>
                                <div style="font-size: 1.05rem; font-weight: 700;">{{ cat.name }}</div>
                                <div style="font-size: 0.78rem; color: var(--text-muted);">{{ getCategoryStats(cat.id) }}</div>
                            </div>
                            <div style="margin-left: auto; display: flex; gap: 6px;" v-if="editingId !== cat.id">
                                <button class="btn btn-sm btn-ghost" @click="startEdit(cat)" title="编辑">
                                    <i class="fas fa-edit"></i> 编辑
                                </button>
                                <button class="btn btn-sm btn-ghost" @click="goToCategory(cat.id)" title="查看职位">
                                    <i class="fas fa-external-link"></i> 查看职位
                                </button>
                            </div>
                        </div>

                        <!-- 编辑模式 -->
                        <div v-if="editingId === cat.id">
                            <div class="form-group">
                                <label style="font-size: 0.8rem;">赛道颜色</label>
                                <div class="color-picker">
                                    <div v-for="c in COLORS" :key="c" class="color-option"
                                        :class="{ active: editForm.color === c }"
                                        :style="{ background: c }"
                                        @click="editForm.color = c">
                                    </div>
                                </div>
                            </div>
                            <div class="form-group">
                                <label style="font-size: 0.8rem;">绑定默认简历</label>
                                <select class="form-control" v-model="editForm.defaultResumeId" style="height: 34px;">
                                    <option value="">不绑定</option>
                                    <option v-for="r in store.resumes" :key="r.id" :value="r.id">
                                        {{ r.name }}
                                    </option>
                                </select>
                                <div class="hint">新增岗位选此赛道时，自动填充该简历</div>
                            </div>
                            <div class="form-group">
                                <label style="font-size: 0.8rem;">赛道备注</label>
                                <input class="form-control" v-model="editForm.remark" placeholder="如：前端/后端/测试/数据" style="height: 34px;" />
                                <div class="hint">记录赛道包含的细分方向</div>
                            </div>
                            <div style="display: flex; gap: 8px; margin-top: 12px;">
                                <button class="btn btn-primary btn-sm" @click="saveEdit(cat)">
                                    <i class="fas fa-check"></i> 保存
                                </button>
                                <button class="btn btn-sm" @click="cancelEdit">取消</button>
                            </div>
                        </div>

                        <!-- 展示模式 -->
                        <div v-else>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.85rem;">
                                <div>
                                    <span style="color: var(--text-muted); font-size: 0.75rem;">默认简历</span>
                                    <div style="font-weight: 500;">
                                        {{ cat.defaultResumeId ? store.getResumeName(cat.defaultResumeId) : '未绑定' }}
                                    </div>
                                </div>
                                <div>
                                    <span style="color: var(--text-muted); font-size: 0.75rem;">细分方向</span>
                                    <div style="font-weight: 500; white-space: pre-wrap;">{{ cat.remark || '-' }}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
};
