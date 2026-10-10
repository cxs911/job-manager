/* ============================================
   新增/编辑职位弹窗组件 (v2 - 新增赛道绑定)
   ============================================ */
const JobForm = {
    emits: ['saved'],
    setup() {
        const visible = Vue.ref(false);
        const editMode = Vue.ref(false);
        const editingId = Vue.ref(null);
        const form = Vue.ref(getDefaultForm());
        const saving = Vue.ref(false);
        const showAdvanced = Vue.ref(false);
        const tagInput = Vue.ref('');

        function getDefaultForm() {
            return {
                company: '',
                title: '',
                status: 'pending',
                url: '',
                categoryId: '',
                city: '',
                salaryMin: '',
                salaryMax: '',
                channel: '',
                priority: 'medium',
                tags: [],
                resumeBindId: '',
                jd: '',
                contact: ''
            };
        }

        function open(job = null) {
            if (job) {
                editMode.value = true;
                editingId.value = job.id;
                form.value = {
                    company: job.company || '',
                    title: job.title || '',
                    status: job.status || 'pending',
                    url: job.url || '',
                    categoryId: job.categoryId || '',
                    city: job.city || '',
                    salaryMin: job.salaryMin || '',
                    salaryMax: job.salaryMax || '',
                    channel: job.channel || '',
                    priority: job.priority || 'medium',
                    tags: job.tags || [],
                    resumeBindId: job.resumeBindId || '',
                    jd: job.jd || '',
                    contact: job.contact || ''
                };
            } else {
                editMode.value = false;
                editingId.value = null;
                form.value = getDefaultForm();
            }
            showAdvanced.value = false;
            visible.value = true;
        }

        function close() {
            visible.value = false;
        }

        function onCategoryChange() {
            if (editMode.value) return; // Don't auto-fill when editing (might overwrite manual selection)
            const catId = form.value.categoryId;
            if (catId) {
                const defaultResumeId = store.getDefaultResumeId(catId);
                if (defaultResumeId) {
                    form.value.resumeBindId = defaultResumeId;
                }
            } else {
                form.value.resumeBindId = '';
            }
        }

        function addTag() {
            const t = tagInput.value.trim();
            if (t && !form.value.tags.includes(t)) {
                form.value.tags.push(t);
            }
            tagInput.value = '';
        }

        function removeTag(tag) {
            form.value.tags = form.value.tags.filter(t => t !== tag);
        }

        function handleTagKey(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
            }
        }

        async function save() {
            if (!form.value.company.trim() || !form.value.title.trim()) {
                window._toast('请填写公司和岗位名称', 'warning');
                return;
            }
            saving.value = true;
            try {
                const data = {
                    company: form.value.company.trim(),
                    title: form.value.title.trim(),
                    status: form.value.status,
                    url: form.value.url.trim(),
                    categoryId: form.value.categoryId ? Number(form.value.categoryId) : null,
                    city: form.value.city.trim(),
                    salaryMin: form.value.salaryMin ? Number(form.value.salaryMin) : null,
                    salaryMax: form.value.salaryMax ? Number(form.value.salaryMax) : null,
                    channel: form.value.channel,
                    priority: form.value.priority,
                    tags: [...form.value.tags],
                    resumeBindId: form.value.resumeBindId ? Number(form.value.resumeBindId) : null,
                    jd: form.value.jd.trim(),
                    contact: form.value.contact.trim()
                };
                if (editMode.value && editingId.value) {
                    await store.updateJob(editingId.value, data);
                    window._toast('职位已更新', 'success');
                } else {
                    await store.addJob(data);
                    window._toast('职位已新增', 'success');
                }
                visible.value = false;
                Vue.emitter.emit('job-saved');
            } catch (e) {
                console.error(e);
                window._toast('保存失败: ' + e.message, 'error');
            } finally {
                saving.value = false;
            }
        }

        Vue.onMounted(() => {
            Vue.emitter.on('open-job-form', open);
        });

        return {
            visible, editMode, form, saving, showAdvanced, tagInput,
            store, close, addTag, removeTag, handleTagKey, onCategoryChange, save, open
        };
    },
    template: `
        <div class="modal-overlay" v-if="visible" @click.self="close">
            <div class="modal-content" style="max-width: 640px;">
                <div class="modal-header">
                    <h3><i class="fas" :class="editMode ? 'fa-edit' : 'fa-plus-circle'"></i> {{ editMode ? '编辑职位' : '新增职位' }}</h3>
                    <button class="modal-close" @click="close"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body">
                    <!-- 第一组：核心必填项 -->
                    <div class="form-section-title"><i class="fas fa-asterisk" style="color: #ef4444; font-size: 10px;"></i> 核心必填</div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>公司名称 <span class="required">*</span></label>
                            <input class="form-control" v-model="form.company" placeholder="请输入公司名称" list="company-list" />
                            <datalist id="company-list">
                                <option v-for="j in store.jobs.map(j => j.company).filter((v,i,a) => a.indexOf(v)===i)" :value="j" />
                            </datalist>
                        </div>
                        <div class="form-group">
                            <label>岗位名称 <span class="required">*</span></label>
                            <input class="form-control" v-model="form.title" placeholder="请输入岗位名称" />
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>岗位赛道 <span class="required">*</span></label>
                            <select class="form-control" v-model="form.categoryId" @change="onCategoryChange">
                                <option value="">请选择赛道</option>
                                <option v-for="cat in store.categories" :key="cat.id" :value="cat.id">
                                    {{ cat.name }}
                                </option>
                                <option value="">未分类</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>岗位状态</label>
                            <select class="form-control" v-model="form.status">
                                <option value="pending">待投递</option>
                                <option value="applied">已投递</option>
                                <option value="interviewing">面试中</option>
                                <option value="offer">Offer</option>
                                <option value="rejected">已挂</option>
                            </select>
                        </div>
                    </div>

                    <!-- 第二组：投递信息 -->
                    <div class="form-section-title" style="margin-top: 20px;"><i class="fas fa-paper-plane"></i> 投递信息</div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>工作地点</label>
                            <input class="form-control" v-model="form.city" placeholder="如：北京" />
                        </div>
                        <div class="form-group">
                            <label>薪资范围 (K)</label>
                            <div style="display: flex; gap: 8px;">
                                <input class="form-control" v-model="form.salaryMin" type="number" placeholder="下限" style="width: 50%;" />
                                <input class="form-control" v-model="form.salaryMax" type="number" placeholder="上限" style="width: 50%;" />
                            </div>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>投递渠道</label>
                            <select class="form-control" v-model="form.channel">
                                <option value="">请选择</option>
                                <option value="BOSS直聘">BOSS直聘</option>
                                <option value="猎聘">猎聘</option>
                                <option value="官网">官网</option>
                                <option value="内推">内推</option>
                                <option value="脉脉">脉脉</option>
                                <option value="其他">其他</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>优先级</label>
                            <select class="form-control" v-model="form.priority">
                                <option value="high">高优先级</option>
                                <option value="medium">中优先级</option>
                                <option value="low">低优先级</option>
                            </select>
                        </div>
                    </div>

                    <!-- 第三组：补充信息（折叠） -->
                    <div style="margin-top: 16px;">
                        <button class="btn btn-ghost btn-sm" @click="showAdvanced = !showAdvanced" type="button">
                            <i class="fas" :class="showAdvanced ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
                            {{ showAdvanced ? '收起补充信息' : '展开补充信息' }}
                        </button>
                    </div>
                    <div v-if="showAdvanced" style="margin-top: 12px;">
                        <div class="form-group">
                            <label>标签</label>
                            <div class="tag-input-wrap" @click="$event.target.querySelector('.tag-input')?.focus()">
                                <span class="tag-item" v-for="tag in form.tags" :key="tag">
                                    {{ tag }}
                                    <span class="tag-remove" @click="removeTag(tag)">&times;</span>
                                </span>
                                <input class="tag-input" v-model="tagInput" @keydown="handleTagKey" @blur="addTag" placeholder="输入标签后回车" />
                            </div>
                        </div>
                        <div class="form-group">
                            <label>简历版本</label>
                            <select class="form-control" v-model="form.resumeBindId">
                                <option value="">请选择</option>
                                <option v-for="r in store.resumes" :key="r.id" :value="r.id">{{ r.name }}</option>
                            </select>
                            <div class="hint" v-if="form.categoryId && store.getDefaultResumeId(form.categoryId)">
                                已自动匹配 {{ store.getCategoryName(form.categoryId) }} 赛道的默认简历
                            </div>
                        </div>
                        <div class="form-group">
                            <label>岗位链接</label>
                            <input class="form-control" v-model="form.url" placeholder="招聘页面URL" />
                        </div>
                        <div class="form-group">
                            <label>JD描述</label>
                            <textarea class="form-control" v-model="form.jd" rows="5" placeholder="粘贴JD原文..."></textarea>
                        </div>
                        <div class="form-group">
                            <label>内推人/联系方式</label>
                            <input class="form-control" v-model="form.contact" placeholder="内推人姓名 / 联系方式" />
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn" @click="close" :disabled="saving">取消</button>
                    <button class="btn btn-primary" @click="save" :disabled="saving">
                        <i class="fas fa-spinner fa-spin" v-if="saving"></i>
                        {{ editMode ? '保存修改' : '新增职位' }}
                    </button>
                </div>
            </div>
        </div>
    `
};
