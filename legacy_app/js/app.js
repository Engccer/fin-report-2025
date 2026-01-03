/**
 * 장교조 재정 앱 메인 로직
 */

const App = {
    // 상태
    currentView: null,
    previousView: null,
    data: {
        reports: [],
        budget: null
    },

    // 초기화
    async init() {
        console.log('앱 초기화 시작...');

        // 데이터 로드
        await this.loadData();

        // 네비게이션 설정
        this.setupNavigation();

        // 검색 설정
        this.setupSearch();

        // 모달 설정
        this.setupModal();

        // 키보드 단축키 초기화
        Keyboard.init();

        // 초기 뷰 렌더링
        const hash = window.location.hash.slice(1) || 'dashboard';
        this.navigate(hash);

        // 초기 로드 시 뷰 렌더링 보장
        this.renderView(this.currentView);

        // 마지막 업데이트 시간 표시
        this.updateLastModified();

        console.log('앱 초기화 완료');
    },

    // 데이터 로드
    async loadData() {
        try {
            const [reportsRes, budgetRes] = await Promise.all([
                fetch('data/reports.json'),
                fetch('data/budget.json')
            ]);

            if (reportsRes.ok) {
                this.data.reports = await reportsRes.json();
                console.log(`월별 보고서 ${this.data.reports.length}건 로드`);
            }

            if (budgetRes.ok) {
                this.data.budget = await budgetRes.json();
                console.log('예산/결산 데이터 로드');
            }
        } catch (error) {
            console.error('데이터 로드 오류:', error);
        }
    },

    // 네비게이션 설정
    setupNavigation() {
        // 네비게이션 클릭 이벤트
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = item.dataset.view;
                this.navigate(view);
            });
        });

        // 브라우저 뒤로/앞으로
        window.addEventListener('popstate', () => {
            const hash = window.location.hash.slice(1) || 'dashboard';
            this.navigate(hash, false);
        });
    },

    // 검색 설정
    setupSearch() {
        const searchInput = document.getElementById('global-search');
        if (!searchInput) return;

        let debounceTimer;

        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const query = e.target.value.trim();
                if (query.length >= 2) {
                    this.navigate('search');
                    Search.search(query);
                }
            }, 300);
        });

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const query = e.target.value.trim();
                if (query.length >= 1) {
                    this.navigate('search');
                    Search.search(query);
                }
            }
        });
    },

    // 모달 설정
    setupModal() {
        const modal = document.getElementById('shortcuts-modal');
        if (!modal) return;

        // 닫기 버튼
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.hidden = true;
            });
        }

        // 배경 클릭으로 닫기
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.hidden = true;
            }
        });
    },

    // 뷰 전환
    navigate(view, pushState = true) {
        if (this.currentView === view) return;

        // 이전 뷰 기록
        this.previousView = this.currentView;

        // 모든 뷰 숨기기
        document.querySelectorAll('.view').forEach(v => {
            v.hidden = true;
        });

        // 현재 뷰 표시
        const viewElement = document.getElementById(`view-${view}`);
        if (viewElement) {
            viewElement.hidden = false;
        }

        // 네비게이션 활성화 상태 업데이트
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === view);
        });

        // URL 해시 업데이트
        if (pushState) {
            history.pushState(null, '', `#${view}`);
        }

        this.currentView = view;

        // 뷰별 렌더링
        this.renderView(view);

        // 메인 콘텐츠로 포커스 이동 (접근성)
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.focus();
        }
    },

    // 뷰 렌더링
    renderView(view) {
        switch (view) {
            case 'dashboard':
                Dashboard.render(this.data);
                break;
            case 'monthly':
                Monthly.render(this.data.reports);
                break;
            case 'budget':
                Budget.render(this.data.budget);
                break;
            case 'trends':
                Trends.render(this.data.reports);
                break;
            case 'planner':
                Planner.render(this.data.budget);
                break;
            case 'search':
                // Search.render()는 검색 시 호출됨
                break;
        }
    },

    // 마지막 업데이트 시간
    updateLastModified() {
        const el = document.getElementById('last-update');
        if (el) {
            const now = new Date();
            el.textContent = `${now.toLocaleDateString('ko-KR')} 기준`;
        }
    }
};

// 앱 시작
document.addEventListener('DOMContentLoaded', () => App.init());
