/* ============================================
   标签管理组件
   ============================================ */
const TagManager = {
    setup() {
        const store = window.store;
        const showAddForm = Vue.ref(false);
        const newTagName = Vue.ref('');
        const newTagColor = Vue.ref('#3b82f6');
        const editingTag = Vue.ref(null);
        const editName = Vue.ref('');
        const editColor = Vue.ref('');

        const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'];

        Vue.onMounted(() => {
            store.setPageMeta('标签管理', 'fa-tags');
        });

        const tagList = Vue.computed(() => {
            return store.tags.map(t => ({
                ...t,
                count: store.getTagCount(t.name)
            }));
        });

        function openAdd() {
            newTagName.value = '';
            newTagColor.value = COLORS[0];
            showAddForm.value = true;
        }

        async function addTag() {
            const name = newTagName.value.trim();
            if (!name) { window._toast('请输入标签名称', 'warning'); return; }
            if (store.tags.find(t => t.name === name)) {
                window._toast('标签已存在', 'warning');
                return;
            }
            try {
                await store.addTag({ name, color: newTagColor.value });
                showAddForm.value = false;
                window._toast('标签已添加', 'success');
            } catch (e) {
                window._toast(e.message, 'error');
            }
        }

        function openEdit(tag) {
            editingTag.value = tag;
            editName.value = tag.name;
            editColor.value = tag.color;
        }

        function cancelEdit() {
            editingTag.value = null;
        }

        async function saveEdit() {
            const name = editName.value.trim();
            if (!name) { window._toast('请输入标签名称', 'warning'); return; }
            try {
                // If name changed, we need to handle the key change
                if (name !== editingTag.value.name) {
                    // Remove old, add new
                    await store.deleteTag(editingTag.value.name);
                    await store.addTag({ name, color: editColor.value });
                    // Update all jobs that had the old tag
                    for (const job of store.jobs) {
                        if (job.tags && job.tags.includes(editingTag.value.name)) {
                            const newTags = job.tags.map(t => t === editingTag.value.name ? name : t);
                            await store.updateJob(job.id, { tags: newTags });
                        }
                    }
                } else {
                    await store.updateTag(name, { color: editColor.value });
                }
                editingTag.value = null;
                window._toast('标签已更新', 'success');
            } catch (e) {
                window._toast(e.message, 'error');
            }
        }

        async function deleteTag(tag) {
            if (!confirm('确定删除标签「' + tag.name + '」？将从所有职位中移除该标签。')) return;
            await store.deleteTag(tag.name);
            window._toast('标签已删除', 'success');
        }

        return { store, showAddForm, newTagName, newTagColor, editingTag, editName, editColor, COLORS, tagList, openAdd, addTag, openEdit, cancelEdit, saveEdit, deleteTag };
    },
    template: `
        <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <p style="color: var(--text-secondary); font-size: 0.88rem;">
                    <i class="fas fa-info-circle"></i> 自定义标签体系，用于对职位进行分类筛选
                </p>
                <button class="btn btn-primary btn-sm" @click="openAdd">
                    <i class="fas fa-plus"></i> 新增标签
                </button>
            </div>

            <!-- 新增标签表单 -->
            <div v-if="showAddForm" class="card" style="margin-bottom: 20px;">
                <div class="card-body" style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 150px;">
                        <label style="font-size: 0.8rem; font-weight: 600; display: block; margin-bottom: 4px;">标签名称</label>
                        <input class="form-control" v-model="newTagName" placeholder="输入标签名称" @keydown.enter="addTag" style="height: 34px;" />
                    </div>
                    <div>
                        <label style="font-size: 0.8rem; font-weight: 600; display: block; margin-bottom: 4px;">颜色</label>
                        <div class="color-picker">
                            <div v-for="c in COLORS" :key="c" class="color-option"
                                :class="{ active: newTagColor === c }"
                                :style="{ background: c }"
                                @click="newTagColor = c">
                            </div>
                        </div>
                    </div>
                    <div style="padding-top: 18px; display: flex; gap: 8px;">
                        <button class="btn btn-primary btn-sm" @click="addTag"><i class="fas fa-check"></i> 确认</button>
                        <button class="btn btn-sm" @click="showAddForm = false">取消</button>
                    </div>
                </div>
            </div>

            <!-- 标签列表 -->
            <div class="tag-grid">
                <div class="tag-manager-item" v-for="tag in tagList" :key="tag.name">
                    <span class="tag-color-dot" :style="{ background: tag.color }"></span>
                    <!-- Edit mode -->
                    <template v-if="editingTag && editingTag.name === tag.name">
                        <div style="flex: 1; display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                            <input class="form-control" v-model="editName" style="height: 30px; width: 120px;" />
                            <div class="color-picker">
                                <div v-for="c in COLORS" :key="c" class="color-option"
                                    :class="{ active: editColor === c }"
                                    :style="{ background: c, width: '18px', height: '18px' }"
                                    @click="editColor = c">
                                </div>
                            </div>
                            <button class="btn btn-sm btn-primary" @click="saveEdit">保存</button>
                            <button class="btn btn-sm" @click="cancelEdit">取消</button>
                        </div>
                    </template>
                    <!-- Display mode -->
                    <template v-else>
                        <span class="tag-name">{{ tag.name }}</span>
                        <span class="tag-count">{{ tag.count }} 个职位</span>
                        <div class="tag-actions">
                            <button class="btn-icon" title="编辑" @click="openEdit(tag)"><i class="fas fa-edit"></i></button>
                            <button class="btn-icon" title="删除" @click="deleteTag(tag)"><i class="fas fa-trash"></i></button>
                        </div>
                    </template>
                </div>
            </div>

            <div class="empty-state" v-if="tagList.length === 0" style="margin-top: 24px;">
                <div class="empty-icon"><i class="fas fa-tags"></i></div>
                <div class="empty-text">暂无标签</div>
            </div>
        </div>
    `
};
