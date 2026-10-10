/* ============================================
   主应用入口
   ============================================ */

// Make store globally accessible
window.store = store;

// Event bus
Vue.emitter = Vue.reactive({});
Vue.emitter._events = {};
Vue.emitter.on = function(event, callback) {
    if (!this._events[event]) this._events[event] = [];
    this._events[event].push(callback);
};
Vue.emitter.emit = function(event, data) {
    (this._events[event] || []).forEach(cb => cb(data));
};

// Toast system
window._toast = function(message, type = 'success') {
    const container = document.querySelector('.toast-container');
    if (!container) {
        const div = document.createElement('div');
        div.className = 'toast-container';
        document.body.appendChild(div);
    }
    const el = document.createElement('div');
    el.className = 'toast toast-' + type;

    const icons = { success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-triangle' };
    el.innerHTML = '<i class="fas ' + (icons[type] || 'fa-info-circle') + '"></i> ' + message;

    document.querySelector('.toast-container').appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity 0.3s'; setTimeout(() => el.remove(), 300); }, 2500);
};

// Create app
const app = Vue.createApp({
    setup() {
        const sidebarCollapsed = Vue.ref(false);

        Vue.onMounted(async () => {
            await store.init();

            // Listen for N key to add new job
            document.addEventListener('keydown', (e) => {
                if (e.key === 'n' && !e.ctrlKey && !e.metaKey && !e.target.closest('input, textarea, select')) {
                    e.preventDefault();
                    Vue.emitter.emit('open-job-form', null);
                }
            });
        });

        function openAddJob() {
            Vue.emitter.emit('open-job-form', null);
        }

        function onJobSaved() {
            // Data is already synced via store methods
        }

        return { sidebarCollapsed, openAddJob, onJobSaved };
    }
});

// Register components
app.component('sidebar-component', SidebarComponent);
app.component('top-bar', TopBar);
app.component('job-form', JobForm);

// Use router
app.use(router);

// Mount
app.mount('#app');
