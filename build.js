/**
 * 장교조 재정 앱 빌드 스크립트
 * 원본 데이터 파일(TXT, CSV)을 JSON으로 변환
 */

const fs = require('fs');
const path = require('path');

// 파일 읽기 (다양한 인코딩 시도)
function readFileWithEncoding(filePath) {
    // 먼저 UTF-8로 시도
    let content = fs.readFileSync(filePath, 'utf-8');

    // BOM 제거
    content = content.replace(/^\uFEFF/, '');

    // 인코딩이 깨졌는지 확인 (한글이 제대로 보이는지)
    // 깨진 문자가 많으면 다른 인코딩 시도가 필요할 수 있음
    const koreanPattern = /[가-힣]/;
    const brokenPattern = /[\ufffd\u00ef\u00bb\u00bf]/;

    if (!koreanPattern.test(content) || brokenPattern.test(content)) {
        // UTF-8로 읽기 실패시 Buffer로 읽어서 재처리 시도
        try {
            const buffer = fs.readFileSync(filePath);
            // EUC-KR로 디코딩 시도 (iconv-lite가 없으면 UTF-8 사용)
            content = buffer.toString('utf-8').replace(/^\uFEFF/, '');
        } catch (e) {
            // 실패시 원본 그대로 사용
        }
    }

    return content;
}

const ROOT_DIR = __dirname;
const MONTHLY_DIR = path.join(ROOT_DIR, 'monthly-reports');
const BUDGET_DIR = path.join(ROOT_DIR, 'budget-closing');
const OUTPUT_DIR = path.join(ROOT_DIR, 'app', 'data');

// 출력 디렉토리 생성
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

// 금액 문자열을 숫자로 변환
function parseCurrency(value) {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    const cleaned = String(value).replace(/[,원\s`]/g, '').replace(/"/g, '');
    const num = parseInt(cleaned, 10);
    return isNaN(num) ? 0 : num;
}

// 마크다운 테이블 파싱
function parseMarkdownTable(lines) {
    const rows = [];
    for (const line of lines) {
        if (line.includes('---')) continue; // 구분선 건너뛰기
        const cells = line.split('|').map(c => c.trim()).filter(c => c);
        if (cells.length > 0) {
            rows.push(cells);
        }
    }
    return rows;
}

// 월별 보고서 파싱
function parseMonthlyReport(content, filename) {
    // 파일명에서 연/월 추출
    const monthMatch = filename.match(/(\d+)년\s*(\d+)월/);
    const year = monthMatch ? parseInt(monthMatch[1], 10) : 2025;
    const month = monthMatch ? parseInt(monthMatch[2], 10) : 1;

    const lines = content.split('\n');

    // 요약 정보 추출
    const summary = {
        previousBalance: 0,
        income: 0,
        expense: 0,
        currentBalance: 0
    };

    // 수입/지출 내역
    const incomeDetails = [];
    const expenseDetails = [];
    const notes = [];

    let currentSection = '';
    let tableLines = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // 섹션 감지 (## 또는 ### 모두 처리)
        if (line.match(/^#{2,3}\s*2\.\s*수입\s*(및|\/)\s*지출\s*요약/)) {
            currentSection = 'summary';
            tableLines = [];
        } else if (line.match(/^#{2,3}\s*3\.\s*수입\s*내역/)) {
            // 이전 섹션 처리
            if (currentSection === 'summary' && tableLines.length > 0) {
                const rows = parseMarkdownTable(tableLines);
                for (const row of rows) {
                    if (row[0] && row[1]) {
                        const label = row[0].replace(/\*\*/g, '');
                        const value = parseCurrency(row[1]);
                        if (label.includes('전월 이월금') || label.includes('이월금')) {
                            summary.previousBalance = value;
                        } else if (label.includes('당월 수입') || label.includes('수입')) {
                            summary.income = value;
                        } else if (label.includes('당월 지출') || label.includes('지출')) {
                            summary.expense = value;
                        } else if (label.includes('잔액')) {
                            summary.currentBalance = value;
                        }
                    }
                }
            }
            currentSection = 'income';
            tableLines = [];
        } else if (line.match(/^#{2,3}\s*4\.\s*지출\s*내역/) || line.match(/^#{2,3}\s*4\./)) {
            // 수입 섹션 처리
            if (currentSection === 'income' && tableLines.length > 0) {
                const rows = parseMarkdownTable(tableLines);
                let currentCategory = '';
                for (const row of rows) {
                    if (row.length >= 2) {
                        const item = row[0].replace(/\*\*/g, '');
                        const amount = row.length >= 2 ? parseCurrency(row[1]) : 0;
                        const note = row.length >= 3 ? row[2] : '';

                        if (item.startsWith('소계') || item.startsWith('총계')) {
                            continue;
                        }
                        if (amount === 0 && !note) {
                            currentCategory = item;
                            continue;
                        }
                        incomeDetails.push({
                            category: currentCategory,
                            item: item,
                            amount: amount,
                            note: note
                        });
                    }
                }
            }
            currentSection = 'expense';
            tableLines = [];
        } else if (line.match(/^#{2,3}\s*5\.\s*특이사항/) || line.match(/^#{2,3}\s*5\./)) {
            // 지출 섹션 처리
            if (currentSection === 'expense' && tableLines.length > 0) {
                const rows = parseMarkdownTable(tableLines);
                let currentDept = '';

                // 테이블 형식 감지: 4열 형식(부서|세부항목|금액|비고) vs 3열 형식(항목|금액|비고)
                const hasMultiColumn = rows.length > 0 && rows[0].length >= 4 &&
                    (rows[0][0] === '부서' || rows[0][0].includes('부서'));

                for (const row of rows) {
                    if (hasMultiColumn && row.length >= 3) {
                        // 4열 형식: 부서 | 세부 항목 | 금액 | 비고
                        const dept = row[0].replace(/\*\*/g, '').trim();
                        const item = row[1].replace(/\*\*/g, '').trim();
                        const amount = parseCurrency(row[2]);
                        const note = row.length >= 4 ? row[3] : '';

                        if (dept && !dept.includes('합계')) {
                            currentDept = dept;
                        }
                        if (item.includes('합계') || item === '부서' || item === '세부 항목') {
                            continue;
                        }
                        if (item && amount > 0) {
                            expenseDetails.push({
                                department: currentDept,
                                item: item,
                                amount: amount,
                                note: note
                            });
                        }
                    } else if (row.length >= 2) {
                        // 3열 형식: 항목 | 금액 | 비고
                        const item = row[0].replace(/\*\*/g, '');
                        const amount = parseCurrency(row[1]);
                        const note = row.length >= 3 ? row[2] : '';

                        if (item.startsWith('소계') || item.startsWith('총계')) {
                            continue;
                        }
                        if (amount === 0 && !note) {
                            currentDept = item;
                            continue;
                        }
                        expenseDetails.push({
                            department: currentDept,
                            item: item,
                            amount: amount,
                            note: note
                        });
                    }
                }
            }
            currentSection = 'notes';
            tableLines = [];
        } else if (line.match(/^#{2,3}\s*6\./) || line.startsWith('---')) {
            currentSection = '';
        }

        // 테이블 라인 수집
        if (line.startsWith('|') && currentSection) {
            tableLines.push(line);
        }

        // 특이사항 수집
        if (currentSection === 'notes' && line.match(/^\d+\./)) {
            notes.push(line.replace(/^\d+\.\s*/, ''));
        }
    }

    return {
        year,
        month,
        filename,
        summary,
        incomeDetails,
        expenseDetails,
        notes
    };
}

// CSV 라인 파싱 (쉼표 구분, 따옴표 처리)
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

// 예산안 CSV 파싱
function parseBudgetCSV(content) {
    // BOM 제거
    content = content.replace(/^\uFEFF/, '');
    const lines = content.split('\n').map(l => l.trim()).filter(l => l);

    const income = [];
    const expense = [];
    let section = '';
    let currentDept = '';

    for (let i = 0; i < lines.length; i++) {
        const row = parseCSVLine(lines[i]);

        // 섹션 감지
        if (row[0] === '수입') {
            section = 'income';
            continue;
        } else if (row[0] === '지출') {
            section = 'expense';
            continue;
        } else if (row[0] === '합계' || row[0] === '예비비(잔액)') {
            continue;
        }

        // 헤더 건너뛰기
        if (row[0] === '연번' || !row[0]) continue;

        if (section === 'income') {
            const id = parseInt(row[0], 10);
            if (isNaN(id)) continue;
            income.push({
                id,
                category: row[1] || '',
                item: row[2] || '',
                amount: parseCurrency(row[7]),
                note: row[8] || ''
            });
        } else if (section === 'expense') {
            const id = parseInt(row[0], 10);
            if (isNaN(id)) continue;

            if (row[1]) currentDept = row[1];

            expense.push({
                id,
                department: currentDept,
                budgetCategory: row[2] || '',
                majorItem: row[3] || '',
                subItem: row[4] || '',
                unitPrice: parseCurrency(row[5]),
                unit: row[6] || '',
                frequency: row[7] || '',
                itemTotal: parseCurrency(row[8]),
                departmentTotal: parseCurrency(row[9]),
                note: row[10] || ''
            });
        }
    }

    return { income, expense };
}

// 결산안 CSV 파싱
function parseSettlementCSV(content) {
    // BOM 제거
    content = content.replace(/^\uFEFF/, '');
    const lines = content.split('\n').map(l => l.trim()).filter(l => l);

    const income = {
        fund: 0,
        carryover: 0,
        monthlyFees: {},
        monthlyDonations: {},
        interest: 0,
        specialDonations: [],
        other: 0,
        total: 0
    };

    const expense = [];
    let section = '';
    let currentDept = '';
    let currentDeptBudget = 0;
    let currentMajorItem = '';
    let currentSubItem = '';
    let currentBudgetAmount = 0;

    for (let i = 0; i < lines.length; i++) {
        const row = parseCSVLine(lines[i]);

        // 섹션 감지
        if (row[0] === '<수입>') {
            section = 'income';
            continue;
        } else if (row[0] === '<지출>') {
            section = 'expense';
            continue;
        } else if (row[0] === '합계' || row[0] === '결산액') {
            if (section === 'income') {
                income.total = parseCurrency(row[6]);
            }
            continue;
        }

        // 헤더 건너뛰기
        if (row[0] === '항목' || row[0] === '담당부서') continue;

        if (section === 'income') {
            const category = row[0];
            const subCategory = row[2];
            const amount = parseCurrency(row[5]);
            const total = parseCurrency(row[6]);

            if (category === '별도기금') {
                income.fund = total;
            } else if (category === '이월금') {
                income.carryover = total;
            } else if (category === '조합비') {
                if (subCategory) {
                    const monthMatch = subCategory.match(/(\d+)월/);
                    if (monthMatch) {
                        income.monthlyFees[parseInt(monthMatch[1], 10)] = amount;
                    }
                }
            } else if (category === '정기 후원비') {
                if (subCategory) {
                    const monthMatch = subCategory.match(/(\d+)월/);
                    if (monthMatch) {
                        income.monthlyDonations[parseInt(monthMatch[1], 10)] = amount;
                    }
                }
            } else if (category === '결산이자') {
                income.interest = total;
            } else if (category === '일시 후원비') {
                if (subCategory && amount > 0) {
                    income.specialDonations.push({
                        donor: subCategory,
                        amount: amount
                    });
                }
            } else if (category === '기타') {
                income.other = total;
            }
        } else if (section === 'expense') {
            // 부서 정보 업데이트
            if (row[0]) {
                currentDept = row[0];
                currentDeptBudget = parseCurrency(row[1]);
            }
            if (row[2]) currentMajorItem = row[2];
            if (row[3]) currentSubItem = row[3];
            if (row[4]) currentBudgetAmount = parseCurrency(row[4]);

            // 지출 내역이 있는 경우
            const date = row[5];
            const description = row[6];
            const amount = parseCurrency(row[7]);

            if (date && description && amount > 0) {
                expense.push({
                    department: currentDept,
                    departmentBudget: currentDeptBudget,
                    majorItem: currentMajorItem,
                    subItem: currentSubItem,
                    budgetAmount: currentBudgetAmount,
                    date: date,
                    description: description,
                    amount: amount,
                    subItemTotal: parseCurrency(row[8]),
                    subItemRemaining: parseCurrency(row[9]),
                    departmentRemaining: parseCurrency(row[10])
                });
            }
        }
    }

    return { income, expense };
}

// 메인 빌드 함수
async function build() {
    console.log('=== 장교조 재정 앱 빌드 시작 ===\n');

    // 출력 디렉토리 생성
    ensureDir(OUTPUT_DIR);

    // 1. 월별 보고서 파싱
    console.log('[1/3] 월별 보고서 파싱...');
    const reports = [];

    if (fs.existsSync(MONTHLY_DIR)) {
        const files = fs.readdirSync(MONTHLY_DIR).filter(f => f.endsWith('.txt'));
        for (const file of files) {
            try {
                const content = fs.readFileSync(path.join(MONTHLY_DIR, file), 'utf-8');
                const report = parseMonthlyReport(content, file);
                reports.push(report);
                console.log(`  - ${file}: ${report.month}월 (수입: ${report.summary.income.toLocaleString()}원, 지출: ${report.summary.expense.toLocaleString()}원)`);
            } catch (err) {
                console.error(`  ! ${file} 파싱 오류:`, err.message);
            }
        }
    }

    // 월 순서로 정렬
    reports.sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
    });

    // 2. 예산안/결산안 파싱
    console.log('\n[2/3] 예산/결산 데이터 파싱...');
    let budget = { income: [], expense: [] };
    let settlement = { income: {}, expense: [] };

    if (fs.existsSync(BUDGET_DIR)) {
        const files = fs.readdirSync(BUDGET_DIR);

        for (const file of files) {
            const filePath = path.join(BUDGET_DIR, file);

            if (file.includes('예산안') && file.endsWith('.csv')) {
                try {
                    const content = fs.readFileSync(filePath, 'utf-8');
                    budget = parseBudgetCSV(content);
                    console.log(`  - ${file}: 수입 ${budget.income.length}건, 지출 ${budget.expense.length}건`);
                } catch (err) {
                    console.error(`  ! ${file} 파싱 오류:`, err.message);
                }
            } else if (file.includes('결산안') && file.endsWith('.csv')) {
                try {
                    const content = fs.readFileSync(filePath, 'utf-8');
                    settlement = parseSettlementCSV(content);
                    console.log(`  - ${file}: 지출 내역 ${settlement.expense.length}건`);
                } catch (err) {
                    console.error(`  ! ${file} 파싱 오류:`, err.message);
                }
            }
        }
    }

    // 3. JSON 파일 저장
    console.log('\n[3/3] JSON 파일 저장...');

    const reportsPath = path.join(OUTPUT_DIR, 'reports.json');
    fs.writeFileSync(reportsPath, JSON.stringify(reports, null, 2), 'utf-8');
    console.log(`  - reports.json (${reports.length}개 월별 보고서)`);

    const budgetPath = path.join(OUTPUT_DIR, 'budget.json');
    fs.writeFileSync(budgetPath, JSON.stringify({ budget, settlement }, null, 2), 'utf-8');
    console.log(`  - budget.json (예산/결산 데이터)`);

    console.log('\n=== 빌드 완료 ===');
    console.log(`출력 위치: ${OUTPUT_DIR}`);
}

// 실행
build().catch(err => {
    console.error('빌드 오류:', err);
    process.exit(1);
});
