/**
 * 검색 뷰
 */

const Search = {
    lastQuery: '',

    search(query) {
        this.lastQuery = query;
        const container = document.getElementById('search-content');
        if (!container) return;

        const results = this.performSearch(query);

        container.innerHTML = `
            <div style="margin-bottom: 24px;">
                <p style="color: var(--color-text-light);">
                    "<strong>${escapeHtml(query)}</strong>" 검색 결과: ${results.length}건
                </p>
            </div>

            ${results.length > 0 ? `
                <div class="card">
                    <ul class="search-results" role="list">
                        ${results.map((result, index) => this.renderResultItem(result, query, index)).join('')}
                    </ul>
                </div>
            ` : `
                <div class="empty-state">
                    <div class="empty-state-icon">🔍</div>
                    <p>검색 결과가 없습니다.</p>
                    <p style="font-size: 0.875rem;">다른 검색어를 시도해보세요.</p>
                </div>
            `}
        `;

        // 결과 항목 클릭 이벤트
        container.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const month = item.dataset.month;
                if (month) {
                    Monthly.selectedMonth = parseInt(month);
                    App.navigate('monthly');
                }
            });

            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    item.click();
                }
            });
        });
    },

    performSearch(query) {
        const results = [];
        const lowerQuery = query.toLowerCase();

        // 월별 보고서 검색
        App.data.reports.forEach(report => {
            // 수입 항목 검색
            report.incomeDetails?.forEach(item => {
                if (this.matchesQuery(item, lowerQuery)) {
                    results.push({
                        type: 'income',
                        month: report.month,
                        year: report.year,
                        category: item.category,
                        item: item.item,
                        amount: item.amount,
                        note: item.note,
                        source: '월별 보고서 (수입)'
                    });
                }
            });

            // 지출 항목 검색
            report.expenseDetails?.forEach(item => {
                if (this.matchesQuery(item, lowerQuery)) {
                    results.push({
                        type: 'expense',
                        month: report.month,
                        year: report.year,
                        department: item.department,
                        item: item.item,
                        amount: item.amount,
                        note: item.note,
                        source: '월별 보고서 (지출)'
                    });
                }
            });
        });

        // 결산 데이터 검색
        const settlement = App.data.budget?.settlement;
        if (settlement?.expense) {
            settlement.expense.forEach(exp => {
                if (this.matchesSettlement(exp, lowerQuery)) {
                    results.push({
                        type: 'settlement',
                        department: exp.department,
                        subItem: exp.subItem,
                        item: exp.description,
                        amount: exp.amount,
                        date: exp.date,
                        source: '결산 데이터'
                    });
                }
            });
        }

        // 금액으로 정렬 (높은 순)
        results.sort((a, b) => b.amount - a.amount);

        return results.slice(0, 50); // 최대 50건
    },

    matchesQuery(item, query) {
        const searchable = [
            item.item,
            item.category,
            item.department,
            item.note
        ].filter(Boolean).join(' ').toLowerCase();

        return searchable.includes(query);
    },

    matchesSettlement(item, query) {
        const searchable = [
            item.department,
            item.subItem,
            item.description
        ].filter(Boolean).join(' ').toLowerCase();

        return searchable.includes(query);
    },

    renderResultItem(result, query, index) {
        const typeLabels = {
            income: { text: '수입', class: 'income' },
            expense: { text: '지출', class: 'expense' },
            settlement: { text: '결산', class: '' }
        };

        const typeInfo = typeLabels[result.type] || { text: '', class: '' };

        return `
            <li
                class="search-result-item"
                tabindex="0"
                data-month="${result.month || ''}"
                role="listitem"
            >
                <div class="search-result-title">
                    ${highlightText(result.item, query)}
                </div>
                <div class="search-result-meta">
                    <span class="${typeInfo.class}" style="font-weight: 500;">${typeInfo.text}</span>
                    ${result.month ? ` · ${result.year}년 ${result.month}월` : ''}
                    ${result.department ? ` · ${escapeHtml(result.department)}` : ''}
                    ${result.date ? ` · ${escapeHtml(result.date)}` : ''}
                    <span class="amount ${typeInfo.class}" style="float: right;">
                        ${formatCurrency(result.amount)}
                    </span>
                </div>
                ${result.note ? `
                    <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-top: 4px;">
                        ${highlightText(result.note, query)}
                    </div>
                ` : ''}
            </li>
        `;
    },

    render() {
        const container = document.getElementById('search-content');
        if (!container) return;

        if (this.lastQuery) {
            this.search(this.lastQuery);
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🔍</div>
                    <p>검색어를 입력해주세요.</p>
                    <p style="font-size: 0.875rem;">Ctrl+K로 검색창에 포커스할 수 있습니다.</p>
                </div>
            `;
        }
    }
};
