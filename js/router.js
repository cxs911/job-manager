/* ============================================
   路由配置 (v2 - 新增赛道/简历路由)
   ============================================ */

const routes = [
    {
        path: '/',
        component: Dashboard
    },
    // 全部职位
    {
        path: '/jobs',
        component: JobList,
        props: { filterStatus: '', filterCategoryId: '' }
    },
    {
        path: '/jobs/:status',
        component: JobList,
        props: route => ({ filterStatus: route.params.status, filterCategoryId: '' })
    },
    // 按赛道筛选
    {
        path: '/category/:categoryId',
        component: JobList,
        props: route => ({ filterStatus: '', filterCategoryId: route.params.categoryId })
    },
    {
        path: '/category/:categoryId/:status',
        component: JobList,
        props: route => ({ filterStatus: route.params.status, filterCategoryId: route.params.categoryId })
    },
    // 职位详情
    {
        path: '/job/:id',
        component: JobDetail,
        props: route => ({ jobId: route.params.id })
    },
    // 面经库
    {
        path: '/interview-notes',
        component: InterviewNotes
    },
    // 赛道管理
    {
        path: '/category-manage',
        component: CategoryManage
    },
    // 简历管理
    {
        path: '/resume-manage',
        component: ResumeManage
    },
    // 标签管理
    {
        path: '/tags',
        component: TagManager
    },
    // 数据导入导出
    {
        path: '/data',
        component: DataManager
    }
];

const router = VueRouter.createRouter({
    history: VueRouter.createWebHashHistory(),
    routes
});

window.router = router;
