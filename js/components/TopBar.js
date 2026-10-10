/* ============================================
   顶部栏组件
   ============================================ */
const TopBar = {
    emits: ['toggle-sidebar', 'add-job'],
    template: `
        <header class="top-bar">
            <button class="menu-toggle" @click="$emit('toggle-sidebar')" title="切换侧边栏">
                <i class="fas fa-bars"></i>
            </button>

            <div class="search-box">
                <i class="fas fa-search"></i>
                <input type="text" v-model="store.searchKeyword" placeholder="搜索公司、岗位、JD关键词..." @input="onSearch" />
            </div>

            <div class="top-actions">
                <button class="btn btn-primary" @click="$emit('add-job')">
                    <i class="fas fa-plus"></i>
                    新增职位
                </button>
            </div>
        </header>
    `,
    setup() {
        let searchTimer = null;
        const onSearch = () => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => {
                // Trigger reactive update through the store
                store.searchKeyword = store.searchKeyword.trim();
            }, 300);
        };
        return { store, onSearch };
    }
};
