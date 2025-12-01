/**
 * 포맷 유틸리티 함수
 */

// 숫자를 통화 형식으로 변환
function formatCurrency(value, showSign = false) {
    if (value === null || value === undefined || isNaN(value)) return '-';

    const num = Number(value);
    const formatted = Math.abs(num).toLocaleString('ko-KR');

    if (showSign && num > 0) {
        return `+${formatted}원`;
    } else if (num < 0) {
        return `-${formatted}원`;
    }
    return `${formatted}원`;
}

// 숫자를 짧은 형식으로 변환 (예: 1,234만원)
function formatCompactCurrency(value) {
    if (value === null || value === undefined || isNaN(value)) return '-';

    const num = Number(value);
    const abs = Math.abs(num);

    if (abs >= 100000000) {
        return `${(num / 100000000).toFixed(1)}억`;
    } else if (abs >= 10000) {
        return `${Math.round(num / 10000)}만`;
    }
    return num.toLocaleString('ko-KR');
}

// 퍼센트 포맷
function formatPercent(value, decimals = 1) {
    if (value === null || value === undefined || isNaN(value)) return '-';
    return `${(Number(value) * 100).toFixed(decimals)}%`;
}

// 날짜 포맷
function formatDate(dateStr) {
    if (!dateStr) return '-';

    // "4월23일" 형식 처리
    const match = dateStr.match(/(\d+)월\s*(\d+)일?/);
    if (match) {
        return `${match[1]}월 ${match[2]}일`;
    }
    return dateStr;
}

// 월 이름
function getMonthName(month) {
    return `${month}월`;
}

// 변화량 계산 및 포맷
function formatChange(current, previous) {
    if (!previous || previous === 0) return { text: '-', className: '' };

    const change = ((current - previous) / previous) * 100;
    const sign = change >= 0 ? '+' : '';

    return {
        text: `${sign}${change.toFixed(1)}%`,
        className: change >= 0 ? 'income' : 'expense'
    };
}

// HTML 이스케이프
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 검색어 하이라이트
function highlightText(text, query) {
    if (!query || !text) return escapeHtml(text);

    const escaped = escapeHtml(text);
    const regex = new RegExp(`(${escapeHtml(query)})`, 'gi');
    return escaped.replace(regex, '<span class="search-highlight">$1</span>');
}
