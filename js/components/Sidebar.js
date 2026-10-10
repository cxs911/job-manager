/* ============================================
   侧边栏组件 (v2 - 新增赛道折叠菜单)
   ============================================ */
const SidebarComponent = {
    props: {
        collapsed: Boolean
    },
    setup() {
        const categoryExpanded = Vue.ref(true);

        return { store, categoryExpanded };
    },
    template: `
        <aside class="sidebar" :class="{ collapsed }">
            <div class="sidebar-logo">
                <span class="logo-icon">💼</span>
                <span>求职管家</span>
            </div>
            <nav class="sidebar-nav">
                <!-- 数据概览 -->
                <div class="nav-group-title">数据概览</div>
                <router-link to="/" class="nav-item" :class="{ active: $route.path === '/' }">
                    <i class="nav-icon fas fa-chart-pie"></i>
                    <span class="nav-label">仪表盘</span>
                </router-link>

                <!-- 职位管理 -->
                <div class="nav-group-title">职位管理</div>
                <router-link to="/jobs" class="nav-item" :class="{ active: $route.path === '/jobs' }">
                    <i class="nav-icon fas fa-list"></i>
                    <span class="nav-label">全部职位</span>
                    <span class="nav-badge" v-if="store.jobs.length">{{ store.jobs.length }}</span>
                </router-link>
                <router-link to="/jobs/pending" class="nav-item" :class="{ active: $route.path === '/jobs/pending' }">
                    <i class="nav-icon fas fa-inbox"></i>
                    <span class="nav-label">待投递</span>
                    <span class="nav-badge badge-pending" v-if="store.getStatusCount('pending')">{{ store.getStatusCount('pending') }}</span>
                </router-link>
                <router-link to="/jobs/applied" class="nav-item" :class="{ active: $route.path === '/jobs/applied' }">
                    <i class="nav-icon fas fa-paper-plane"></i>
                    <span class="nav-label">已投递</span>
                    <span class="nav-badge badge-applied" v-if="store.getStatusCount('applied')">{{ store.getStatusCount('applied') }}</span>
                </router-link>
                <router-link to="/jobs/interviewing" class="nav-item" :class="{ active: $route.path === '/jobs/interviewing' }">
                    <i class="nav-icon fas fa-comments"></i>
                    <span class="nav-label">面试中</span>
                    <span class="nav-badge badge-interviewing" v-if="store.getStatusCount('interviewing')">{{ store.getStatusCount('interviewing') }}</span>
                </router-link>
                <router-link to="/jobs/offer" class="nav-item" :class="{ active: $route.path === '/jobs/offer' }">
                    <i class="nav-icon fas fa-trophy"></i>
                    <span class="nav-label">Offer</span>
                    <span class="nav-badge badge-offer" v-if="store.getStatusCount('offer')">{{ store.getStatusCount('offer') }}</span>
                </router-link>
                <router-link to="/jobs/rejected" class="nav-item" :class="{ active: $route.path === '/jobs/rejected' }">
                    <i class="nav-icon fas fa-archive"></i>
                    <span class="nav-label">已结束</span>
                    <span class="nav-badge badge-rejected" v-if="store.getStatusCount('rejected')">{{ store.getStatusCount('rejected') }}</span>
                </router-link>

                <!-- 岗位赛道（可折叠） -->
                <div class="nav-group-title" style="cursor:pointer;" @click="categoryExpanded = !categoryExpanded">
                    <i class="fas" :class="categoryExpanded ? 'fa-chevron-down' : 'fa-chevron-right'" style="margin-right: 4px; font-size: 0.6rem;"></i>
                    岗位赛道
                </div>
                <template v-if="categoryExpanded">
                    <router-link v-for="cat in store.categories" :key="cat.id"
                        :to="'/category/' + cat.id"
                        class="nav-item"
                        :class="{ active: $route.path === '/category/' + cat.id }"
                        style="padding-left: 32px;">
                        <i class="nav-icon fas fa-circle" :style="{ color: cat.color, fontSize: '0.65rem' }"></i>
                        <span class="nav-label">{{ cat.name }}</span>
                        <span class="nav-badge" :style="{ background: cat.color + '20', color: cat.color }" v-if="store.getCategoryJobCount(cat.id)">{{ store.getCategoryJobCount(cat.id) }}</span>
                    </router-link>
                    <router-link to="/category/null" class="nav-item"
                        :class="{ active: $route.path === '/category/null' }"
                        style="padding-left: 32px;">
                        <i class="nav-icon fas fa-circle" style="color: #94a3b8; font-size: 0.65rem;"></i>
                        <span class="nav-label">未分类</span>
                        <span class="nav-badge" style="background:#f3f4f6;color:#94a3b8;" v-if="store.getCategoryJobCount(null)">{{ store.getCategoryJobCount(null) }}</span>
                    </router-link>
                </template>

                <!-- 知识库 -->
                <div class="nav-group-title">知识库</div>
                <router-link to="/interview-notes" class="nav-item" :class="{ active: $route.path === '/interview-notes' }">
                    <i class="nav-icon fas fa-book"></i>
                    <span class="nav-label">面试面经库</span>
                </router-link>
                <router-link to="/resume-manage" class="nav-item" :class="{ active: $route.path === '/resume-manage' }">
                    <i class="nav-icon fas fa-file"></i>
                    <span class="nav-label">简历版本管理</span>
                </router-link>

                <!-- 工具与设置 -->
                <div class="nav-group-title">工具与设置</div>
                <router-link to="/category-manage" class="nav-item" :class="{ active: $route.path === '/category-manage' }">
                    <i class="nav-icon fas fa-layer-group"></i>
                    <span class="nav-label">赛道分类管理</span>
                </router-link>
                <router-link to="/tags" class="nav-item" :class="{ active: $route.path === '/tags' }">
                    <i class="nav-icon fas fa-tags"></i>
                    <span class="nav-label">标签管理</span>
                </router-link>
                <router-link to="/data" class="nav-item" :class="{ active: $route.path === '/data' }">
                    <i class="nav-icon fas fa-database"></i>
                    <span class="nav-label">数据导入导出</span>
                </router-link>
            </nav>
        </aside>
    `
};
