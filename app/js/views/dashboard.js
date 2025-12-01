/**
 * 대시보드 뷰
 */

const Dashboard = {
    render(data) {
        const container = document.getElementById('dashboard-content');
        if (!container) return;

        const { reports, budget } = data;

        // 최신 보고서 찾기
        const latestReport = reports.length > 0 ? reports[reports.length - 1] : null;

        // 연간 통계 계산
        const yearStats = this.calculateYearStats(reports);

        // 예산 정보
        const budgetInfo = budget?.budget || { income: [], expense: [] };
        const totalBudget = budgetInfo.expense.reduce((sum, item) => sum + (item.itemTotal || 0), 0);

        container.innerHTML = `
            <!-- 요약 카드 -->
            <div class="stats-grid">
                <div class="stat-card income">
                    <div class="stat-label">누적 수입</div>
                    <div class="stat-value income">${formatCurrency(yearStats.totalIncome)}</div>
                    <div class="stat-change">올해 ${reports.length}개월</div>
                </div>
                <div class="stat-card expense">
                    <div class="stat-label">누적 지출</div>
                    <div class="stat-value expense">${formatCurrency(yearStats.totalExpense)}</div>
                    <div class="stat-change">예산 대비 ${formatPercent(yearStats.totalExpense / totalBudget)}</div>
                </div>
                <div class="stat-card balance">
                    <div class="stat-label">현재 잔액</div>
                    <div class="stat-value balance">${formatCurrency(latestReport?.summary?.currentBalance || 0)}</div>
                    <div class="stat-change">${latestReport ? latestReport.month + '월 말 기준' : '-'}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">연간 예산</div>
                    <div class="stat-value">${formatCurrency(totalBudget)}</div>
                    <div class="stat-change">잔여 ${formatCurrency(totalBudget - yearStats.totalExpense)}</div>
                </div>
            </div>

            <!-- 최근 보고서 -->
            <div class="card">
                <h3 class="card-title">최근 월별 현황</h3>
                <div class="table-wrapper">
                    <table class="data-table">
                        <caption class="sr-only">최근 월별 수입 지출 현황</caption>
                        <thead>
                            <tr>
                                <th scope="col">월</th>
                                <th scope="col" class="amount">수입</th>
                                <th scope="col" class="amount">지출</th>
                                <th scope="col" class="amount">잔액</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.renderRecentReports(reports)}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- 부서별 집행 현황 요약 -->
            <div class="card">
                <h3 class="card-title">부서별 예산 집행률</h3>
                ${this.renderDepartmentSummary(budget)}
            </div>
        `;
    },

    // 연간 통계 계산
    calculateYearStats(reports) {
        let totalIncome = 0;
        let totalExpense = 0;

        reports.forEach(report => {
            totalIncome += report.summary?.income || 0;
            totalExpense += report.summary?.expense || 0;
        });

        return { totalIncome, totalExpense };
    },

    // 최근 보고서 테이블
    renderRecentReports(reports) {
        if (reports.length === 0) {
            return '<tr><td colspan="4" class="empty-state">데이터가 없습니다</td></tr>';
        }

        // 최근 5개월
        const recent = reports.slice(-5).reverse();

        return recent.map(report => `
            <tr tabindex="0">
                <td><strong>${report.month}월</strong></td>
                <td class="amount income">${formatCurrency(report.summary?.income)}</td>
                <td class="amount expense">${formatCurrency(report.summary?.expense)}</td>
                <td class="amount balance">${formatCurrency(report.summary?.currentBalance)}</td>
            </tr>
        `).join('');
    },

    // 부서별 집행 현황 요약
    renderDepartmentSummary(budget) {
        if (!budget?.budget?.expense || !budget?.settlement?.expense) {
            return '<p class="empty-state">예산/결산 데이터가 없습니다</p>';
        }

        // 부서별 예산 집계
        const deptBudgets = {};
        budget.budget.expense.forEach(item => {
            const dept = item.department;
            if (!deptBudgets[dept]) {
                deptBudgets[dept] = { budget: 0, actual: 0 };
            }
            deptBudgets[dept].budget += item.itemTotal || 0;
        });

        // 부서별 실제 지출 집계
        budget.settlement.expense.forEach(item => {
            const dept = item.department;
            if (deptBudgets[dept]) {
                deptBudgets[dept].actual += item.amount || 0;
            }
        });

        // 정렬 (집행률 높은 순)
        const sorted = Object.entries(deptBudgets)
            .filter(([_, v]) => v.budget > 0)
            .sort((a, b) => (b[1].actual / b[1].budget) - (a[1].actual / a[1].budget))
            .slice(0, 6);

        if (sorted.length === 0) {
            return '<p class="empty-state">데이터가 없습니다</p>';
        }

        return `
            <div class="table-wrapper">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th scope="col">부서</th>
                            <th scope="col" class="amount">예산</th>
                            <th scope="col" class="amount">집행</th>
                            <th scope="col">집행률</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sorted.map(([dept, data]) => {
                            const rate = data.budget > 0 ? data.actual / data.budget : 0;
                            const barClass = rate > 1 ? 'danger' : rate > 0.8 ? 'warning' : '';
                            return `
                                <tr tabindex="0">
                                    <td>${escapeHtml(dept)}</td>
                                    <td class="amount">${formatCurrency(data.budget)}</td>
                                    <td class="amount">${formatCurrency(data.actual)}</td>
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
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
};
