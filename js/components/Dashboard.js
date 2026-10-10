/* ============================================
   仪表盘组件 (v2 - 赛道统计)
   ============================================ */
const Dashboard = {
    emits: ['add-job'],
    setup() {
        const store = window.store;
        const funnelChart = Vue.ref(null);
        const trendChart = Vue.ref(null);
        const categoryChart = Vue.ref(null);
        const funnelCanvas = Vue.ref(null);
        const trendCanvas = Vue.ref(null);
        const categoryCanvas = Vue.ref(null);

        Vue.onMounted(async () => {
            store.setPageMeta('仪表盘', 'fa-chart-pie');
            await Vue.nextTick();
            initCharts();
        });

        function initCharts() {
            // Funnel chart
            if (funnelCanvas.value) {
                const funnelData = store.getFunnelData();
                if (funnelChart.value) funnelChart.value.destroy();
                funnelChart.value = new Chart(funnelCanvas.value, {
                    type: 'bar',
                    data: {
                        labels: funnelData.labels,
                        datasets: [{
                            label: '数量',
                            data: funnelData.values,
                            backgroundColor: ['#94a3b8', '#3b82f6', '#f59e0b', '#10b981'],
                            borderRadius: 4,
                            barPercentage: 0.6
                        }]
                    },
                    options: {
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                callbacks: {
                                    afterLabel: function(context) {
                                        return '转化率: ' + (funnelData.rates[context.dataIndex] || '-');
                                    }
                                }
                            }
                        },
                        scales: {
                            x: { grid: { display: false }, beginAtZero: true },
                            y: { grid: { display: false } }
                        }
                    }
                });
            }

            // Trend chart
            if (trendCanvas.value) {
                const trendData = store.getDailyTrend(30);
                if (trendChart.value) trendChart.value.destroy();
                trendChart.value = new Chart(trendCanvas.value, {
                    type: 'line',
                    data: {
                        labels: trendData.labels.map(d => d.slice(5)),
                        datasets: [{
                            label: '投递数量',
                            data: trendData.values,
                            borderColor: '#4f46e5',
                            backgroundColor: 'rgba(79,70,229,0.1)',
                            fill: true,
                            tension: 0.3,
                            pointRadius: 2,
                            pointHoverRadius: 5,
                            borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            x: { grid: { display: false }, ticks: { maxTicksLimit: 15, font: { size: 10 } } },
                            y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 10 } } }
                        },
                        interaction: { intersect: false, mode: 'index' }
                    }
                });
            }

            // Category chart
            if (categoryCanvas.value && store.categories.length > 0) {
                if (categoryChart.value) categoryChart.value.destroy();
                const catData = store.categories.map(cat => {
                    const stats = store.getCategoryStats(cat.id);
                    return { name: cat.name, color: cat.color, ...stats };
                });
                categoryChart.value = new Chart(categoryCanvas.value, {
                    type: 'bar',
                    data: {
                        labels: catData.map(d => d.name),
                        datasets: [
                            {
                                label: '总投递',
                                data: catData.map(d => d.total),
                                backgroundColor: catData.map(d => d.color + '60'),
                                borderRadius: 3
                            },
                            {
                                label: 'Offer',
                                data: catData.map(d => d.offer),
                                backgroundColor: catData.map(d => d.color),
                                borderRadius: 3
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'top',
                                labels: { boxWidth: 12, padding: 12, font: { size: 11 } }
                            }
                        },
                        scales: {
                            x: { grid: { display: false } },
                            y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 10 } } }
                        },
                        onClick: (e, elements) => {
                            if (elements.length > 0) {
                                const idx = elements[0].datasetIndex === 0 ? elements[0].index : elements[0].index;
                                const cat = catData[idx];
                                if (cat) window.router.push('/category/' + store.getCategoryByName(cat.name).id);
                            }
                        }
                    }
                });
            }
        }

        Vue.watch(() => store.jobs.length, async () => {
            await Vue.nextTick();
            initCharts();
        });

        function goToStatus(status) {
            window.router.push(status ? '/jobs/' + status : '/jobs');
        }

        const stats = Vue.computed(() => store.getStats());
        const funnelData = Vue.computed(() => store.getFunnelData());
        const recentEvents = Vue.computed(() => store.getRecentEvents(7));

        function getEventIcon(type) {
            const icons = {
                '收藏': 'fa-star', '投递': 'fa-paper-plane', '简历筛选': 'fa-filter',
                '笔试': 'fa-pen', '一面': 'fa-user', '二面': 'fa-users',
                '三面': 'fa-users', '终面': 'fa-flag', 'HR面': 'fa-handshake',
                'OC': 'fa-phone', 'Offer': 'fa-trophy', '拒信': 'fa-times-circle'
            };
            return icons[type] || 'fa-dot-circle';
        }

        function getEventColor(type) {
            const colors = {
                '收藏': '#9ca3af', '投递': '#3b82f6', '简历筛选': '#6366f1',
                '笔试': '#8b5cf6', '一面': '#f59e0b', '二面': '#f97316',
                '三面': '#ef4444', '终面': '#dc2626', 'HR面': '#ec4899',
                'OC': '#14b8a6', 'Offer': '#10b981', '拒信': '#6b7280'
            };
            return colors[type] || '#9ca3af';
        }

        function goToJob(jobId) { window.router.push('/job/' + jobId); }

        function formatDate(dateStr) {
            const d = new Date(dateStr);
            const now = new Date();
            const diff = now - d;
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            if (days === 0) return '今天 ' + d.toTimeString().slice(0, 5);
            if (days === 1) return '昨天 ' + d.toTimeString().slice(0, 5);
            if (days < 7) return days + '天前 ' + d.toTimeString().slice(0, 5);
            return d.toLocaleDateString('zh-CN');
        }

        function getCategoryName(id) { return store.getCategoryName(id); }
        function getCategoryColor(id) { return store.getCategoryColor(id); }

        return {
            store, stats, funnelData, recentEvents, goToStatus,
            getEventIcon, getEventColor, goToJob, formatDate,
            getCategoryName, getCategoryColor,
            funnelCanvas, trendCanvas, categoryCanvas
        };
    },
    template: `
        <div>
            <!-- 核心数据卡片 -->
            <div class="stat-cards">
                <div class="stat-card stat-total" @click="goToStatus('')">
                    <div class="stat-value">{{ stats.total }}</div>
                    <div class="stat-label">总职位数</div>
                </div>
                <div class="stat-card stat-pending" @click="goToStatus('pending')">
                    <div class="stat-value">{{ stats.pending }}</div>
                    <div class="stat-label">待投递</div>
                </div>
                <div class="stat-card stat-applied" @click="goToStatus('applied')">
                    <div class="stat-value">{{ stats.applied }}</div>
                    <div class="stat-label">已投递</div>
                </div>
                <div class="stat-card stat-interviewing" @click="goToStatus('interviewing')">
                    <div class="stat-value">{{ stats.interviewing }}</div>
                    <div class="stat-label">面试中</div>
                </div>
                <div class="stat-card stat-offer" @click="goToStatus('offer')">
                    <div class="stat-value">{{ stats.offer }}</div>
                    <div class="stat-label">Offer</div>
                </div>
                <div class="stat-card stat-rejected" @click="goToStatus('rejected')">
                    <div class="stat-value">{{ stats.rejected }}</div>
                    <div class="stat-label">已挂</div>
                </div>
            </div>

            <!-- 图表区域 -->
            <div class="dashboard-grid">
                <div class="dashboard-card">
                    <div class="card-title">
                        <span><i class="fas fa-funnel-dollar"></i> 转化漏斗</span>
                    </div>
                    <div class="card-body">
                        <div style="height: 220px; position: relative;">
                            <canvas ref="funnelCanvas"></canvas>
                        </div>
                        <div style="display: flex; justify-content: space-around; margin-top: 12px; font-size: 0.78rem; color: var(--text-secondary);">
                            <span v-for="(rate, i) in funnelData.rates" :key="i">
                                {{ funnelData.labels[i] }}: {{ rate }}
                            </span>
                        </div>
                    </div>
                </div>
                <div class="dashboard-card">
                    <div class="card-title">
                        <span><i class="fas fa-chart-line"></i> 近30天投递趋势</span>
                    </div>
                    <div class="card-body">
                        <div style="height: 220px; position: relative;">
                            <canvas ref="trendCanvas"></canvas>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 四大赛道投递数据 -->
            <div class="dashboard-card" style="margin-bottom: 24px;">
                <div class="card-title">
                    <span><i class="fas fa-layer-group"></i> 四大赛道投递数据</span>
                    <span style="font-size: 0.78rem; color: var(--text-muted);">点击图表跳转对应赛道</span>
                </div>
                <div class="card-body">
                    <div style="height: 200px; position: relative; margin-bottom: 16px;">
                        <canvas ref="categoryCanvas"></canvas>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px;">
                        <div v-for="cat in store.categories" :key="cat.id"
                            style="padding: 12px; border: 1px solid var(--border); border-radius: var(--radius); cursor: pointer; transition: var(--transition);"
                            @click="window.router.push('/category/' + cat.id)">
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                                <div :style="{ width: '10px', height: '10px', borderRadius: '50%', background: cat.color }"></div>
                                <span style="font-weight: 600; font-size: 0.88rem;">{{ cat.name }}</span>
                            </div>
                            <div style="font-size: 0.78rem; color: var(--text-secondary); line-height: 1.8;">
                                <div>投递 <strong>{{ store.getCategoryStats(cat.id).total }}</strong></div>
                                <div>面试 <strong>{{ store.getCategoryStats(cat.id).interviewing }}</strong></div>
                                <div>Offer <strong>{{ store.getCategoryStats(cat.id).offer }}</strong></div>
                                <div style="margin-top: 4px;">
                                    投递→面试 <strong>{{ store.getCategoryStats(cat.id).total ? (store.getCategoryStats(cat.id).applied / store.getCategoryStats(cat.id).total * 100).toFixed(0) + '%' : '-' }}</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 近期动态 -->
            <div class="dashboard-card">
                <div class="card-title">
                    <span><i class="fas fa-clock-rotate"></i> 近期动态（最近7天）</span>
                </div>
                <div class="card-body">
                    <div class="timeline-list" v-if="recentEvents.length > 0">
                        <div class="timeline-item" v-for="evt in recentEvents" :key="evt.id" style="cursor:pointer;" @click="goToJob(evt.jobId)">
                            <div class="timeline-dot" :style="{ background: getEventColor(evt.type) }"></div>
                            <div class="timeline-content">
                                <div class="tl-title">
                                    <strong>{{ store.getJob(evt.jobId)?.company || '未知' }}</strong>
                                    添加了「{{ evt.type }}」进度事件
                                </div>
                                <div class="tl-meta">{{ formatDate(evt.date) }}</div>
                                <div class="tl-desc" v-if="evt.note">{{ evt.note }}</div>
                            </div>
                        </div>
                    </div>
                    <div class="empty-state" v-else>
                        <div class="empty-icon"><i class="fas fa-calendar"></i></div>
                        <div class="empty-text">近7天暂无动态</div>
                        <button class="btn btn-primary btn-sm" @click="$emit('add-job')">
                            <i class="fas fa-plus"></i> 新增职位
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `
};
