/* ============================================
   数据导入导出组件 (v2 - 包含赛道字段)
   ============================================ */
const DataManager = {
    setup() {
        const store = window.store;
        const fileInput = Vue.ref(null);
        const importing = Vue.ref(false);
        const exporting = Vue.ref(false);

        Vue.onMounted(() => {
            store.setPageMeta('数据导入导出', 'fa-database');
        });

        async function exportJSON() {
            exporting.value = true;
            try {
                const data = await db.exportAll();
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                downloadBlob(blob, '求职管家_备份_' + new Date().toISOString().slice(0, 10) + '.json');
                window._toast('JSON 导出成功', 'success');
            } catch (e) {
                window._toast('导出失败: ' + e.message, 'error');
            } finally {
                exporting.value = false;
            }
        }

        async function exportExcel() {
            exporting.value = true;
            try {
                const jobs = store.jobs;
                const headers = ['公司', '岗位', '赛道', '状态', '地点', '薪资下限(K)', '薪资上限(K)', '渠道', '优先级', '标签', '绑定简历', '链接', '创建时间'];
                const rows = jobs.map(j => [
                    j.company, j.title, store.getCategoryName(j.categoryId), store.getStatusLabel(j.status),
                    j.city || '', j.salaryMin || '', j.salaryMax || '',
                    j.channel || '', store.getPriorityLabel(j.priority),
                    (j.tags || []).join('; '), store.getResumeName(j.resumeBindId) || '', j.url || '', j.createdAt || ''
                ]);
                let csv = '﻿' + headers.join(',') + '\n';
                rows.forEach(r => {
                    csv += r.map(v => '"' + String(v || '').replace(/"/g, '""') + '"').join(',') + '\n';
                });
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                downloadBlob(blob, '求职管家_数据_' + new Date().toISOString().slice(0, 10) + '.csv');
                window._toast('CSV 导出成功（可用 Excel 打开）', 'success');
            } catch (e) {
                window._toast('导出失败: ' + e.message, 'error');
            } finally {
                exporting.value = false;
            }
        }

        function triggerImport() { fileInput.value.click(); }

        async function handleFileUpload(e) {
            const file = e.target.files[0];
            if (!file) return;
            importing.value = true;
            try {
                const text = await file.text();
                const data = JSON.parse(text);

                // Handle both v1 and v2 export formats
                const payload = data.data || data;
                if (!payload.jobs) throw new Error('无效的备份文件格式');

                // For v1 data (no categories), auto-create from store or defaults
                if (!payload.categories || payload.categories.length === 0) {
                    const cats = store.categories.length > 0 ? store.categories
                        : [{ id: 1, name: '技术', color: '#3b82f6', sort: 1 },
                           { id: 2, name: '产品', color: '#9333ea', sort: 2 },
                           { id: 3, name: '运营', color: '#10b981', sort: 3 },
                           { id: 4, name: '售前', color: '#f97316', sort: 4 }];
                    payload.categories = cats.map(c => ({ ...c }));
                }

                if (!confirm('导入将覆盖现有所有数据，确定继续？')) {
                    importing.value = false;
                    return;
                }

                await db.importAll(payload);
                store.loaded = false;
                await store.init();
                window._toast('数据导入成功！共导入 ' + payload.jobs.length + ' 个职位', 'success');
            } catch (e) {
                window._toast('导入失败: ' + e.message, 'error');
            } finally {
                importing.value = false;
                fileInput.value.value = '';
            }
        }

        function downloadBlob(blob, filename) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = filename;
            document.body.appendChild(a); a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        function getStats() {
            const s = store.getStats();
            return [
                { label: '总职位数', value: s.total },
                { label: '面试笔记', value: store.notes.length },
                { label: '标签数', value: store.tags.length },
                { label: '赛道数', value: store.categories.length },
                { label: '简历版本', value: store.resumes.length }
            ];
        }

        return { store, fileInput, importing, exporting, exportJSON, exportExcel, triggerImport, handleFileUpload, getStats };
    },
    template: `
        <div>
            <!-- 数据概览 -->
            <div class="stat-cards" style="margin-bottom: 24px;">
                <div class="stat-card stat-total" v-for="stat in getStats()" :key="stat.label">
                    <div class="stat-value">{{ stat.value }}</div>
                    <div class="stat-label">{{ stat.label }}</div>
                </div>
            </div>

            <div class="import-export-grid">
                <!-- 导出 -->
                <div class="ie-card">
                    <div class="ie-icon"><i class="fas fa-download"></i></div>
                    <h3>导出数据</h3>
                    <p>将数据导出为备份文件，导出内容包含赛道分类、简历版本等全部数据</p>
                    <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                        <button class="btn btn-primary" @click="exportJSON" :disabled="exporting">
                            <i class="fas fa-spinner fa-spin" v-if="exporting"></i>
                            <i class="fas fa-file-code" v-else></i>
                            {{ exporting ? '导出中...' : '导出 JSON' }}
                        </button>
                        <button class="btn" @click="exportExcel" :disabled="exporting">
                            <i class="fas fa-file-excel"></i> 导出 CSV
                        </button>
                    </div>
                    <div style="margin-top: 12px; font-size: 0.78rem; color: var(--text-muted);">
                        JSON 支持完整数据恢复，CSV 可用 Excel 打开编辑（含赛道列）
                    </div>
                </div>

                <!-- 导入 -->
                <div class="ie-card">
                    <div class="ie-icon"><i class="fas fa-upload"></i></div>
                    <h3>导入数据</h3>
                    <p>上传之前导出的 JSON 备份文件，兼容旧版本备份（自动归为未分类）</p>
                    <input type="file" ref="fileInput" accept=".json" style="display: none;" @change="handleFileUpload" />
                    <button class="btn btn-primary" @click="triggerImport" :disabled="importing">
                        <i class="fas fa-spinner fa-spin" v-if="importing"></i>
                        <i class="fas fa-upload" v-else></i>
                        {{ importing ? '导入中...' : '选择文件导入' }}
                    </button>
                    <div style="margin-top: 12px; font-size: 0.78rem; color: var(--text-muted);">
                        ⚠️ 导入将覆盖当前所有数据，建议先导出备份
                    </div>
                </div>
            </div>

            <!-- 数据说明 -->
            <div class="card" style="margin-top: 24px;">
                <div class="card-header">
                    <h3><i class="fas fa-info-circle"></i> 数据说明</h3>
                </div>
                <div class="card-body" style="font-size: 0.85rem; color: var(--text-secondary); line-height: 2;">
                    <p>🔒 <strong>本地存储</strong>：所有数据存储在浏览器本地（IndexedDB），不会上传到任何服务器。</p>
                    <p>💾 <strong>数据备份</strong>：建议定期导出 JSON 备份，以防数据丢失。备份文件包含赛道分类。</p>
                    <p>🔄 <strong>导入兼容</strong>：旧版备份文件（无赛道字段）可正常导入，历史数据自动归为「未分类」。</p>
                    <p><i class="fas fa-layer-group"></i> <strong>赛道数据</strong>：4大固定赛道（技术/产品/运营/售前）会在导入时自动重建。</p>
                </div>
            </div>
        </div>
    `
};
