/**
 * 월별 보고서 뷰
 */

const Monthly = {
    selectedMonth: null,

    render(reports) {
        const container = document.getElementById('monthly-content');
        if (!container) return;

        if (!reports || reports.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📅</div>
                    <p>월별 보고서 데이터가 없습니다.</p>
                    <p>build.bat을 실행하여 데이터를 생성해주세요.</p>
                </div>
            `;
            return;
        }

        // 기본 선택: 가장 최근 월
        if (!this.selectedMonth) {
            this.selectedMonth = reports[reports.length - 1].month;
        }

        const selectedReport = reports.find(r => r.month === this.selectedMonth);

        container.innerHTML = `
            <!-- 월 선택기 -->
            <div class="month-selector" role="tablist" aria-label="월 선택">
                ${reports.map(report => `
                    <button
                        class="month-btn ${report.month === this.selectedMonth ? 'active' : ''}"
                        data-month="${report.month}"
                        role="tab"
                        aria-selected="${report.month === this.selectedMonth}"
                        aria-controls="monthly-detail"
                    >
                        ${report.month}월
                    </button>
                `).join('')}
            </div>

            <!-- 선택된 월 상세 -->
            <div id="monthly-detail" role="tabpanel">
                ${selectedReport ? this.renderMonthDetail(selectedReport) : '<p>데이터를 선택해주세요.</p>'}
            </div>
        `;

        // 월 선택 이벤트
        container.querySelectorAll('.month-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectedMonth = parseInt(btn.dataset.month);
                this.render(reports);
            });
        });
    },

    renderMonthDetail(report) {
        const { summary, incomeDetails, expenseDetails, notes } = report;

        return `
            <!-- 요약 -->
            <div class="stats-grid" style="margin-bottom: 24px;">
                <div class="stat-card">
                    <div class="stat-label">전월 이월금</div>
                    <div class="stat-value">${formatCurrency(summary?.previousBalance)}</div>
                </div>
                <div class="stat-card income">
                    <div class="stat-label">당월 수입</div>
                    <div class="stat-value income">${formatCurrency(summary?.income)}</div>
                </div>
                <div class="stat-card expense">
                    <div class="stat-label">당월 지출</div>
                    <div class="stat-value expense">${formatCurrency(summary?.expense)}</div>
                </div>
                <div class="stat-card balance">
                    <div class="stat-label">잔액</div>
                    <div class="stat-value balance">${formatCurrency(summary?.currentBalance)}</div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                <!-- 수입 내역 -->
                <div class="card">
                    <h3 class="card-title">수입 내역</h3>
                    ${this.renderIncomeTable(incomeDetails)}
                </div>

                <!-- 지출 내역 -->
                <div class="card">
                    <h3 class="card-title">지출 내역</h3>
                    ${this.renderExpenseTable(expenseDetails)}
                </div>
            </div>

            <!-- 특이사항 -->
            ${notes && notes.length > 0 ? `
                <div class="card" style="margin-top: 24px;">
                    <h3 class="card-title">특이사항</h3>
                    <ul style="padding-left: 20px;">
                        ${notes.map(note => `<li>${escapeHtml(note)}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        `;
    },

    renderIncomeTable(items) {
        if (!items || items.length === 0) {
            return '<p class="empty-state">수입 내역이 없습니다</p>';
        }

        return `
            <div class="table-wrapper">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th scope="col">항목</th>
                            <th scope="col" class="amount">금액</th>
                            <th scope="col">비고</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map(item => `
                            <tr tabindex="0">
                                <td>
                                    ${item.category ? `<small style="color: var(--color-text-muted);">${escapeHtml(item.category)}</small><br>` : ''}
                                    ${escapeHtml(item.item)}
                                </td>
                                <td class="amount income">${formatCurrency(item.amount)}</td>
                                <td><small>${escapeHtml(item.note)}</small></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    renderExpenseTable(items) {
        if (!items || items.length === 0) {
            return '<p class="empty-state">지출 내역이 없습니다</p>';
        }

        return `
            <div class="table-wrapper">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th scope="col">부서/항목</th>
                            <th scope="col" class="amount">금액</th>
                            <th scope="col">비고</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map(item => `
                            <tr tabindex="0">
                                <td>
                                    ${item.department ? `<small style="color: var(--color-text-muted);">${escapeHtml(item.department)}</small><br>` : ''}
                                    ${escapeHtml(item.item)}
                                </td>
                                <td class="amount expense">${formatCurrency(item.amount)}</td>
                                <td><small>${escapeHtml(item.note)}</small></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
};
