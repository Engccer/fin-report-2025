/**
 * 예산안 편성 뷰
 */

const Planner = {
    items: [],
    scenarios: {},
    currentScenario: 'default',

    render(budgetData) {
        const container = document.getElementById('planner-content');
        if (!container) return;

        // 저장된 데이터 불러오기 또는 초기화
        this.loadFromStorage();

        // 저장된 데이터가 없으면 기존 예산에서 불러오기
        if (this.items.length === 0 && budgetData?.budget?.expense) {
            this.loadFromBudget(budgetData.budget.expense);
        }

        container.innerHTML = `
            <!-- 툴바 -->
            <div class="planner-toolbar">
                <button class="btn btn-primary" onclick="Planner.addItem()">
                    + 항목 추가
                </button>
                <button class="btn btn-secondary" onclick="Planner.loadTemplate()">
                    템플릿 불러오기
                </button>
                <button class="btn btn-secondary" onclick="Planner.save()">
                    💾 저장 (Ctrl+S)
                </button>
                <button class="btn btn-secondary" onclick="Planner.exportCSV()">
                    📥 CSV 내보내기
                </button>
                <button class="btn btn-secondary" onclick="Planner.exportJSON()">
                    📥 JSON 내보내기
                </button>
                <div style="flex: 1;"></div>
                <button class="btn btn-danger" onclick="Planner.clear()">
                    🗑️ 초기화
                </button>
            </div>

            <!-- 시나리오 선택 -->
            <div class="card" style="margin-bottom: 24px;">
                <div style="display: flex; align-items: center; gap: 16px;">
                    <label for="scenario-select" style="font-weight: 500;">시나리오:</label>
                    <select id="scenario-select" class="input" style="width: auto;" onchange="Planner.switchScenario(this.value)">
                        ${Object.keys(this.scenarios).map(key => `
                            <option value="${key}" ${key === this.currentScenario ? 'selected' : ''}>
                                ${key === 'default' ? '기본안' : escapeHtml(key)}
                            </option>
                        `).join('')}
                    </select>
                    <button class="btn btn-secondary" onclick="Planner.newScenario()">+ 새 시나리오</button>
                </div>
            </div>

            <!-- 편집 테이블 -->
            <div class="card">
                <h3 class="card-title">지출 예산 편성</h3>
                <div class="table-wrapper">
                    <div class="planner-row header">
                        <div>부서 / 항목</div>
                        <div>단가</div>
                        <div>횟수</div>
                        <div>소계</div>
                        <div></div>
                    </div>
                    <div id="planner-items">
                        ${this.renderItems()}
                    </div>
                </div>

                <!-- 합계 -->
                <div class="planner-total">
                    <span>총 예산: </span>
                    <span id="planner-total-amount" class="stat-value">${formatCurrency(this.calculateTotal())}</span>
                </div>
            </div>

            <!-- 전년 대비 비교 -->
            ${budgetData?.budget ? this.renderComparison(budgetData.budget) : ''}
        `;

        // 입력 이벤트 설정
        this.setupInputEvents();
    },

    loadFromBudget(expense) {
        this.items = expense.map((item, index) => ({
            id: index + 1,
            department: item.department || '',
            subItem: item.subItem || item.majorItem || '',
            unitPrice: item.unitPrice || item.itemTotal || 0,
            quantity: 1,
            note: item.note || ''
        }));

        this.scenarios[this.currentScenario] = [...this.items];
    },

    loadFromStorage() {
        try {
            const saved = localStorage.getItem('planner-data');
            if (saved) {
                const data = JSON.parse(saved);
                this.items = data.items || [];
                this.scenarios = data.scenarios || { default: [] };
                this.currentScenario = data.currentScenario || 'default';
            } else {
                this.scenarios = { default: [] };
            }
        } catch (e) {
            console.error('저장 데이터 로드 오류:', e);
            this.scenarios = { default: [] };
        }
    },

    save() {
        try {
            // 현재 시나리오 저장
            this.scenarios[this.currentScenario] = [...this.items];

            const data = {
                items: this.items,
                scenarios: this.scenarios,
                currentScenario: this.currentScenario,
                lastSaved: new Date().toISOString()
            };
            localStorage.setItem('planner-data', JSON.stringify(data));

            // 알림
            this.showNotification('저장되었습니다.');
        } catch (e) {
            console.error('저장 오류:', e);
            this.showNotification('저장 중 오류가 발생했습니다.', 'error');
        }
    },

    renderItems() {
        if (this.items.length === 0) {
            return '<div class="empty-state" style="padding: 32px;">항목을 추가해주세요.</div>';
        }

        return this.items.map((item, index) => `
            <div class="planner-row" data-id="${item.id}">
                <div>
                    <input
                        type="text"
                        class="input"
                        placeholder="부서"
                        value="${escapeHtml(item.department)}"
                        data-field="department"
                        style="margin-bottom: 4px;"
                    >
                    <input
                        type="text"
                        class="input"
                        placeholder="항목명"
                        value="${escapeHtml(item.subItem)}"
                        data-field="subItem"
                    >
                </div>
                <div>
                    <input
                        type="text"
                        class="input input-amount"
                        placeholder="단가"
                        value="${item.unitPrice.toLocaleString()}"
                        data-field="unitPrice"
                    >
                </div>
                <div>
                    <input
                        type="number"
                        class="input"
                        placeholder="횟수"
                        value="${item.quantity}"
                        data-field="quantity"
                        min="1"
                    >
                </div>
                <div class="amount" style="font-weight: 600; padding: 8px;">
                    ${formatCurrency(item.unitPrice * item.quantity)}
                </div>
                <div>
                    <button
                        class="btn btn-secondary"
                        onclick="Planner.duplicateItem(${item.id})"
                        title="복제"
                        style="padding: 8px;"
                    >📋</button>
                    <button
                        class="btn btn-danger"
                        onclick="Planner.removeItem(${item.id})"
                        title="삭제"
                        style="padding: 8px;"
                    >🗑️</button>
                </div>
            </div>
        `).join('');
    },

    setupInputEvents() {
        const container = document.getElementById('planner-items');
        if (!container) return;

        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', (e) => {
                const row = e.target.closest('.planner-row');
                const id = parseInt(row.dataset.id);
                const field = e.target.dataset.field;
                let value = e.target.value;

                // 금액 필드는 숫자로 변환
                if (field === 'unitPrice') {
                    value = parseInt(value.replace(/[^0-9]/g, '')) || 0;
                } else if (field === 'quantity') {
                    value = parseInt(value) || 1;
                }

                this.updateItem(id, field, value);
            });
        });
    },

    updateItem(id, field, value) {
        const item = this.items.find(i => i.id === id);
        if (item) {
            item[field] = value;
            this.updateTotal();
        }
    },

    updateTotal() {
        const total = this.calculateTotal();
        const el = document.getElementById('planner-total-amount');
        if (el) {
            el.textContent = formatCurrency(total);
        }
    },

    calculateTotal() {
        return this.items.reduce((sum, item) => {
            return sum + (item.unitPrice || 0) * (item.quantity || 1);
        }, 0);
    },

    addItem() {
        const newId = Math.max(0, ...this.items.map(i => i.id)) + 1;
        this.items.push({
            id: newId,
            department: '',
            subItem: '',
            unitPrice: 0,
            quantity: 1,
            note: ''
        });
        this.render(App.data.budget);
    },

    duplicateItem(id) {
        const item = this.items.find(i => i.id === id);
        if (item) {
            const newId = Math.max(0, ...this.items.map(i => i.id)) + 1;
            this.items.push({ ...item, id: newId });
            this.render(App.data.budget);
        }
    },

    removeItem(id) {
        this.items = this.items.filter(i => i.id !== id);
        this.render(App.data.budget);
    },

    clear() {
        if (confirm('모든 항목을 삭제하시겠습니까?')) {
            this.items = [];
            this.render(App.data.budget);
        }
    },

    loadTemplate() {
        if (confirm('기존 예산안을 템플릿으로 불러오시겠습니까?\n현재 작업 내용은 사라집니다.')) {
            this.items = [];
            if (App.data.budget?.budget?.expense) {
                this.loadFromBudget(App.data.budget.budget.expense);
            }
            this.render(App.data.budget);
        }
    },

    newScenario() {
        const name = prompt('새 시나리오 이름을 입력하세요:');
        if (name && name.trim()) {
            this.scenarios[name.trim()] = [...this.items];
            this.currentScenario = name.trim();
            this.render(App.data.budget);
        }
    },

    switchScenario(name) {
        // 현재 시나리오 저장
        this.scenarios[this.currentScenario] = [...this.items];

        // 새 시나리오 로드
        this.currentScenario = name;
        this.items = [...(this.scenarios[name] || [])];
        this.render(App.data.budget);
    },

    exportCSV() {
        const headers = ['부서', '항목', '단가', '횟수', '소계'];
        const rows = this.items.map(item => [
            item.department,
            item.subItem,
            item.unitPrice,
            item.quantity,
            item.unitPrice * item.quantity
        ]);

        // 합계 행 추가
        rows.push(['', '', '', '합계', this.calculateTotal()]);

        const csv = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        this.downloadFile(csv, '예산안.csv', 'text/csv;charset=utf-8');
    },

    exportJSON() {
        const data = {
            title: `${new Date().getFullYear() + 1}년도 예산안`,
            createdAt: new Date().toISOString(),
            total: this.calculateTotal(),
            items: this.items
        };

        this.downloadFile(
            JSON.stringify(data, null, 2),
            '예산안.json',
            'application/json'
        );
    },

    downloadFile(content, filename, type) {
        const blob = new Blob(['\uFEFF' + content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    renderComparison(budget) {
        if (!budget?.expense) return '';

        const prevTotal = budget.expense.reduce((sum, item) => sum + (item.itemTotal || 0), 0);
        const newTotal = this.calculateTotal();
        const diff = newTotal - prevTotal;
        const changeRate = prevTotal > 0 ? ((newTotal - prevTotal) / prevTotal) * 100 : 0;

        return `
            <div class="card" style="margin-top: 24px;">
                <h3 class="card-title">전년 대비 비교</h3>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-label">전년 예산</div>
                        <div class="stat-value">${formatCurrency(prevTotal)}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">편성 예산</div>
                        <div class="stat-value">${formatCurrency(newTotal)}</div>
                    </div>
                    <div class="stat-card ${diff >= 0 ? 'expense' : 'income'}">
                        <div class="stat-label">증감액</div>
                        <div class="stat-value ${diff >= 0 ? 'expense' : 'income'}">
                            ${diff >= 0 ? '+' : ''}${formatCurrency(diff)}
                        </div>
                        <div class="stat-change">
                            ${changeRate >= 0 ? '+' : ''}${changeRate.toFixed(1)}%
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    showNotification(message, type = 'success') {
        // 간단한 알림 표시
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            padding: 12px 24px;
            background: ${type === 'error' ? 'var(--color-expense)' : 'var(--color-income)'};
            color: white;
            border-radius: var(--radius);
            box-shadow: var(--shadow-md);
            z-index: 1000;
            animation: fadeIn 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
};
