/**
 * 추이 차트 뷰
 */

const Trends = {
    chart: null,

    render(reports) {
        const container = document.getElementById('trends-content');
        if (!container) return;

        if (!reports || reports.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📉</div>
                    <p>차트를 표시할 데이터가 없습니다.</p>
                </div>
            `;
            return;
        }

        // 데이터 준비
        const chartData = this.prepareChartData(reports);

        container.innerHTML = `
            <!-- 수입/지출 막대 차트 -->
            <div class="card">
                <h3 class="card-title">월별 수입 vs 지출</h3>
                <div class="chart-container">
                    <canvas id="income-expense-chart" aria-label="월별 수입 지출 비교 차트"></canvas>
                </div>
                <!-- 접근성을 위한 데이터 테이블 -->
                <details style="margin-top: 16px;">
                    <summary style="cursor: pointer; color: var(--color-text-light);">데이터 테이블 보기</summary>
                    ${this.renderDataTable(chartData)}
                </details>
            </div>

            <!-- 잔액 추이 차트 -->
            <div class="card">
                <h3 class="card-title">누적 잔액 추이</h3>
                <div class="chart-container">
                    <canvas id="balance-chart" aria-label="월별 잔액 추이 차트"></canvas>
                </div>
            </div>

            <!-- 통계 요약 -->
            <div class="card">
                <h3 class="card-title">기간 통계</h3>
                ${this.renderStats(chartData)}
            </div>
        `;

        // 차트 렌더링
        this.renderCharts(chartData);
    },

    prepareChartData(reports) {
        return reports.map(report => ({
            month: `${report.month}월`,
            income: report.summary?.income || 0,
            expense: report.summary?.expense || 0,
            balance: report.summary?.currentBalance || 0
        }));
    },

    renderCharts(data) {
        // 기존 차트 제거
        if (this.chart) {
            this.chart.destroy();
        }

        // 수입/지출 막대 차트
        const ctx1 = document.getElementById('income-expense-chart');
        if (ctx1) {
            new Chart(ctx1, {
                type: 'bar',
                data: {
                    labels: data.map(d => d.month),
                    datasets: [
                        {
                            label: '수입',
                            data: data.map(d => d.income),
                            backgroundColor: 'rgba(5, 150, 105, 0.7)',
                            borderColor: 'rgb(5, 150, 105)',
                            borderWidth: 1
                        },
                        {
                            label: '지출',
                            data: data.map(d => d.expense),
                            backgroundColor: 'rgba(220, 38, 38, 0.7)',
                            borderColor: 'rgb(220, 38, 38)',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return formatCompactCurrency(value);
                                }
                            }
                        }
                    }
                }
            });
        }

        // 잔액 추이 선 차트
        const ctx2 = document.getElementById('balance-chart');
        if (ctx2) {
            new Chart(ctx2, {
                type: 'line',
                data: {
                    labels: data.map(d => d.month),
                    datasets: [
                        {
                            label: '잔액',
                            data: data.map(d => d.balance),
                            borderColor: 'rgb(37, 99, 235)',
                            backgroundColor: 'rgba(37, 99, 235, 0.1)',
                            fill: true,
                            tension: 0.3
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `잔액: ${formatCurrency(context.raw)}`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            ticks: {
                                callback: function(value) {
                                    return formatCompactCurrency(value);
                                }
                            }
                        }
                    }
                }
            });
        }
    },

    renderDataTable(data) {
        return `
            <table class="data-table" style="margin-top: 12px;">
                <caption class="sr-only">월별 수입 지출 잔액 데이터</caption>
                <thead>
                    <tr>
                        <th scope="col">월</th>
                        <th scope="col" class="amount">수입</th>
                        <th scope="col" class="amount">지출</th>
                        <th scope="col" class="amount">잔액</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(d => `
                        <tr>
                            <td>${d.month}</td>
                            <td class="amount income">${formatCurrency(d.income)}</td>
                            <td class="amount expense">${formatCurrency(d.expense)}</td>
                            <td class="amount balance">${formatCurrency(d.balance)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },

    renderStats(data) {
        const totalIncome = data.reduce((sum, d) => sum + d.income, 0);
        const totalExpense = data.reduce((sum, d) => sum + d.expense, 0);
        const avgIncome = totalIncome / data.length;
        const avgExpense = totalExpense / data.length;

        const maxIncomeMonth = data.reduce((max, d) => d.income > max.income ? d : max, data[0]);
        const maxExpenseMonth = data.reduce((max, d) => d.expense > max.expense ? d : max, data[0]);

        return `
            <div class="stats-grid">
                <div class="stat-card income">
                    <div class="stat-label">총 수입</div>
                    <div class="stat-value income">${formatCurrency(totalIncome)}</div>
                    <div class="stat-change">월평균 ${formatCurrency(avgIncome)}</div>
                </div>
                <div class="stat-card expense">
                    <div class="stat-label">총 지출</div>
                    <div class="stat-value expense">${formatCurrency(totalExpense)}</div>
                    <div class="stat-change">월평균 ${formatCurrency(avgExpense)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">최대 수입 월</div>
                    <div class="stat-value">${maxIncomeMonth.month}</div>
                    <div class="stat-change">${formatCurrency(maxIncomeMonth.income)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">최대 지출 월</div>
                    <div class="stat-value">${maxExpenseMonth.month}</div>
                    <div class="stat-change">${formatCurrency(maxExpenseMonth.expense)}</div>
                </div>
            </div>
        `;
    }
};
