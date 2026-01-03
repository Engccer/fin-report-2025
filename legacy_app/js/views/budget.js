/**
 * 예산 vs 실적 비교 뷰
 */

const Budget = {
    render(budgetData) {
        const container = document.getElementById('budget-content');
        if (!container) return;

        if (!budgetData || !budgetData.budget) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📈</div>
                    <p>예산/결산 데이터가 없습니다.</p>
                </div>
            `;
            return;
        }

        const comparison = this.calculateComparison(budgetData);

        container.innerHTML = `
            <!-- 전체 요약 -->
            <div class="stats-grid" style="margin-bottom: 24px;">
                <div class="stat-card">
                    <div class="stat-label">연간 예산</div>
                    <div class="stat-value">${formatCurrency(comparison.totalBudget)}</div>
                </div>
                <div class="stat-card expense">
                    <div class="stat-label">집행액</div>
                    <div class="stat-value expense">${formatCurrency(comparison.totalActual)}</div>
                </div>
                <div class="stat-card balance">
                    <div class="stat-label">잔액</div>
                    <div class="stat-value balance">${formatCurrency(comparison.totalBudget - comparison.totalActual)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">집행률</div>
                    <div class="stat-value">${formatPercent(comparison.totalActual / comparison.totalBudget)}</div>
                </div>
            </div>

            <!-- 부서별 상세 -->
            <div class="card">
                <h3 class="card-title">부서별 예산 집행 현황</h3>
                <div class="table-wrapper">
                    <table class="data-table">
                        <caption class="sr-only">부서별 예산 대비 실적 비교표</caption>
                        <thead>
                            <tr>
                                <th scope="col">부서</th>
                                <th scope="col" class="amount">예산</th>
                                <th scope="col" class="amount">집행</th>
                                <th scope="col" class="amount">잔액</th>
                                <th scope="col" style="width: 200px;">집행률</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.renderDepartmentRows(comparison.departments)}
                        </tbody>
                        <tfoot>
                            <tr style="font-weight: 600; background: var(--color-bg);">
                                <td>합계</td>
                                <td class="amount">${formatCurrency(comparison.totalBudget)}</td>
                                <td class="amount">${formatCurrency(comparison.totalActual)}</td>
                                <td class="amount">${formatCurrency(comparison.totalBudget - comparison.totalActual)}</td>
                                <td>
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <div class="progress-bar" style="flex: 1;">
                                            <div class="progress-fill" style="width: ${Math.min((comparison.totalActual / comparison.totalBudget) * 100, 100)}%"></div>
                                        </div>
                                        <span>${formatPercent(comparison.totalActual / comparison.totalBudget)}</span>
                                    </div>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <!-- 세목별 상세 -->
            <div class="card">
                <h3 class="card-title">세목별 상세 현황</h3>
                <div class="table-wrapper">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th scope="col">부서</th>
                                <th scope="col">세목</th>
                                <th scope="col" class="amount">예산</th>
                                <th scope="col" class="amount">집행</th>
                                <th scope="col" class="amount">잔액</th>
                                <th scope="col">상태</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.renderDetailRows(comparison.details)}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    calculateComparison(budgetData) {
        const { budget, settlement } = budgetData;
        const departments = {};
        const details = [];

        // 예산 데이터 집계
        budget.expense.forEach(item => {
            const dept = item.department;
            const subItem = item.subItem || item.majorItem;

            if (!departments[dept]) {
                departments[dept] = { budget: 0, actual: 0 };
            }
            departments[dept].budget += item.itemTotal || 0;

            details.push({
                department: dept,
                subItem: subItem,
                budget: item.itemTotal || 0,
                actual: 0,
                note: item.note
            });
        });

        // 실제 지출 집계
        if (settlement?.expense) {
            settlement.expense.forEach(exp => {
                const dept = exp.department;
                if (departments[dept]) {
                    departments[dept].actual += exp.amount || 0;
                }

                // 세목별 집계
                const detail = details.find(d =>
                    d.department === dept && d.subItem === exp.subItem
                );
                if (detail) {
                    detail.actual += exp.amount || 0;
                }
            });
        }

        // 합계 계산
        let totalBudget = 0;
        let totalActual = 0;
        Object.values(departments).forEach(d => {
            totalBudget += d.budget;
            totalActual += d.actual;
        });

        return {
            departments,
            details,
            totalBudget,
            totalActual
        };
    },

    renderDepartmentRows(departments) {
        const entries = Object.entries(departments)
            .filter(([_, d]) => d.budget > 0)
            .sort((a, b) => b[1].budget - a[1].budget);

        return entries.map(([dept, data]) => {
            const rate = data.budget > 0 ? data.actual / data.budget : 0;
            const remaining = data.budget - data.actual;
            const barClass = rate > 1 ? 'danger' : rate > 0.9 ? 'warning' : '';

            return `
                <tr tabindex="0">
                    <td><strong>${escapeHtml(dept)}</strong></td>
                    <td class="amount">${formatCurrency(data.budget)}</td>
                    <td class="amount expense">${formatCurrency(data.actual)}</td>
                    <td class="amount ${remaining < 0 ? 'expense' : 'balance'}">${formatCurrency(remaining)}</td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div class="progress-bar" style="flex: 1;">
                                <div class="progress-fill ${barClass}" style="width: ${Math.min(rate * 100, 100)}%"></div>
                            </div>
                            <span style="min-width: 50px; text-align: right;">${formatPercent(rate)}</span>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    renderDetailRows(details) {
        const filtered = details.filter(d => d.budget > 0);

        if (filtered.length === 0) {
            return '<tr><td colspan="6" class="empty-state">상세 데이터가 없습니다</td></tr>';
        }

        return filtered.map(item => {
            const rate = item.budget > 0 ? item.actual / item.budget : 0;
            const remaining = item.budget - item.actual;

            let status = '';
            let statusClass = '';
            if (rate === 0) {
                status = '미집행';
                statusClass = 'color: var(--color-text-muted)';
            } else if (rate > 1) {
                status = '초과';
                statusClass = 'color: var(--color-expense); font-weight: 600';
            } else if (rate >= 0.9) {
                status = '주의';
                statusClass = 'color: var(--color-warning)';
            } else {
                status = formatPercent(rate);
            }

            return `
                <tr tabindex="0">
                    <td><small>${escapeHtml(item.department)}</small></td>
                    <td>${escapeHtml(item.subItem)}</td>
                    <td class="amount">${formatCurrency(item.budget)}</td>
                    <td class="amount">${formatCurrency(item.actual)}</td>
                    <td class="amount ${remaining < 0 ? 'expense' : ''}">${formatCurrency(remaining)}</td>
                    <td style="${statusClass}">${status}</td>
                </tr>
            `;
        }).join('');
    }
};
