/**
 * 키보드 네비게이션 유틸리티
 */

const Keyboard = {
    // 초기화
    init() {
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    },

    // 키 이벤트 핸들러
    handleKeyDown(e) {
        // 입력 필드에서는 단축키 무시 (Escape 제외)
        const isInput = e.target.matches('input, textarea, select, [contenteditable]');

        // Escape: 모달 닫기, 검색창 blur
        if (e.key === 'Escape') {
            this.handleEscape();
            return;
        }

        // 입력 필드에서는 나머지 단축키 무시
        if (isInput) return;

        // Ctrl/Cmd + K: 검색창 포커스
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            this.focusSearch();
            return;
        }

        // Ctrl/Cmd + S: 예산안 저장
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            if (typeof Planner !== 'undefined' && App.currentView === 'planner') {
                Planner.save();
            }
            return;
        }

        // 숫자키 1-5: 뷰 전환
        if (e.key >= '1' && e.key <= '5') {
            const views = ['dashboard', 'monthly', 'budget', 'trends', 'planner'];
            const index = parseInt(e.key) - 1;
            if (views[index]) {
                e.preventDefault();
                App.navigate(views[index]);
            }
            return;
        }

        // ?: 단축키 안내 모달
        if (e.key === '?' || (e.shiftKey && e.key === '/')) {
            e.preventDefault();
            this.toggleShortcutsModal();
            return;
        }

        // 방향키: 테이블/리스트 네비게이션
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            this.handleArrowNavigation(e);
        }
    },

    // Escape 처리
    handleEscape() {
        // 모달 닫기
        const modal = document.querySelector('.modal:not([hidden])');
        if (modal) {
            modal.hidden = true;
            return;
        }

        // 검색창 blur
        const searchInput = document.getElementById('global-search');
        if (document.activeElement === searchInput) {
            searchInput.blur();
            // 검색 결과 뷰가 열려있으면 이전 뷰로 돌아가기
            if (App.currentView === 'search' && App.previousView) {
                App.navigate(App.previousView);
            }
        }
    },

    // 검색창 포커스
    focusSearch() {
        const searchInput = document.getElementById('global-search');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    },

    // 단축키 모달 토글
    toggleShortcutsModal() {
        const modal = document.getElementById('shortcuts-modal');
        if (modal) {
            modal.hidden = !modal.hidden;
            if (!modal.hidden) {
                const closeBtn = modal.querySelector('.modal-close');
                if (closeBtn) closeBtn.focus();
            }
        }
    },

    // 방향키 네비게이션
    handleArrowNavigation(e) {
        const focusable = document.activeElement;

        // 테이블 행 네비게이션
        if (focusable && focusable.matches('tr[tabindex]')) {
            e.preventDefault();
            const rows = Array.from(focusable.closest('tbody').querySelectorAll('tr[tabindex]'));
            const currentIndex = rows.indexOf(focusable);

            if (e.key === 'ArrowUp' && currentIndex > 0) {
                rows[currentIndex - 1].focus();
            } else if (e.key === 'ArrowDown' && currentIndex < rows.length - 1) {
                rows[currentIndex + 1].focus();
            }
        }

        // 월 선택 버튼 네비게이션
        if (focusable && focusable.matches('.month-btn')) {
            e.preventDefault();
            const buttons = Array.from(document.querySelectorAll('.month-btn'));
            const currentIndex = buttons.indexOf(focusable);

            if (e.key === 'ArrowLeft' && currentIndex > 0) {
                buttons[currentIndex - 1].focus();
            } else if (e.key === 'ArrowRight' && currentIndex < buttons.length - 1) {
                buttons[currentIndex + 1].focus();
            }
        }
    }
};
