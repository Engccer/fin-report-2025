
import fs from "fs";
import path from "path";

// Types
export interface MonthlyReport {
  year: number;
  month: number;
  filename: string;
  summary: {
    previousBalance: number;
    income: number;
    expense: number;
    currentBalance: number;
  };
  incomeDetails: {
    category: string;
    item: string;
    amount: number;
    note: string;
  }[];
  expenseDetails: {
    department: string;
    item: string;
    amount: number;
    note: string;
  }[];
  notes: string[];
}

export interface BudgetData {
  budget: {
    income: any[];
    expense: any[];
  };
  settlement: {
    income: any;
    expense: any[];
  };
}

const ROOT_DIR = process.cwd();
const MONTHLY_DIR = path.join(ROOT_DIR, "monthly-reports");
const BUDGET_DIR = path.join(ROOT_DIR, "budget-closing");

// Utilities
function parseCurrency(value: string | number): number {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const cleaned = String(value).replace(/[,원\s`]/g, "").replace(/"/g, "");
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? 0 : num;
}

function parseMarkdownTable(lines: string[]): string[][] {
  const rows: string[][] = [];
  for (const line of lines) {
    if (line.includes("---")) continue;
    const cells = line.split("|").map((c) => c.trim()).filter((c) => c);
    if (cells.length > 0) {
      rows.push(cells);
    }
  }
  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Monthly Report Parsing
function parseMonthlyReport(content: string, filename: string): MonthlyReport {
  const monthMatch = filename.match(/(\d+)년\s*(\d+)월/);
  const year = monthMatch ? parseInt(monthMatch[1], 10) : 2025;
  const month = monthMatch ? parseInt(monthMatch[2], 10) : 1;

  const lines = content.split("\n");

  const summary = {
    previousBalance: 0,
    income: 0,
    expense: 0,
    currentBalance: 0,
  };

  const incomeDetails: MonthlyReport["incomeDetails"] = [];
  const expenseDetails: MonthlyReport["expenseDetails"] = [];
  const notes: string[] = [];

  let currentSection = "";
  let tableLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.match(/^#{2,3}\s*2\.\s*수입\s*(및|\/)\s*지출\s*요약/)) {
      currentSection = "summary";
      tableLines = [];
    } else if (line.match(/^#{2,3}\s*3\.\s*수입\s*내역/)) {
      if (currentSection === "summary" && tableLines.length > 0) {
        const rows = parseMarkdownTable(tableLines);
        for (const row of rows) {
          if (row[0] && row[1]) {
            const label = row[0].replace(/\*\*/g, "");
            const value = parseCurrency(row[1]);
            if (label.includes("전월 이월금") || label.includes("이월금")) {
              summary.previousBalance = value;
            } else if (label.includes("당월 수입") || label.includes("수입")) {
              summary.income = value;
            } else if (label.includes("당월 지출") || label.includes("지출")) {
              summary.expense = value;
            } else if (label.includes("잔액")) {
              summary.currentBalance = value;
            }
          }
        }
      }
      currentSection = "income";
      tableLines = [];
    } else if (
      line.match(/^#{2,3}\s*4\.\s*지출\s*내역/) ||
      line.match(/^#{2,3}\s*4\./)
    ) {
      if (currentSection === "income" && tableLines.length > 0) {
        const rows = parseMarkdownTable(tableLines);
        let currentCategory = "";
        for (const row of rows) {
          if (row.length >= 2) {
            const item = row[0].replace(/\*\*/g, "");
            const amount = row.length >= 2 ? parseCurrency(row[1]) : 0;
            const note = row.length >= 3 ? row[2] : "";

            if (item.startsWith("소계") || item.startsWith("총계")) continue;
            if (amount === 0 && !note) {
              currentCategory = item;
              continue;
            }
            incomeDetails.push({
              category: currentCategory,
              item: item,
              amount: amount,
              note: note,
            });
          }
        }
      }
      currentSection = "expense";
      tableLines = [];
    } else if (
      line.match(/^#{2,3}\s*5\.\s*특이사항/) ||
      line.match(/^#{2,3}\s*5\./)
    ) {
      if (currentSection === "expense" && tableLines.length > 0) {
        const rows = parseMarkdownTable(tableLines);
        let currentDept = "";
        const hasMultiColumn =
          rows.length > 0 &&
          rows[0].length >= 4 &&
          (rows[0][0] === "부서" || rows[0][0].includes("부서"));

        for (const row of rows) {
          if (hasMultiColumn && row.length >= 3) {
            const dept = row[0].replace(/\*\*/g, "").trim();
            const item = row[1].replace(/\*\*/g, "").trim();
            const amount = parseCurrency(row[2]);
            const note = row.length >= 4 ? row[3] : "";

            if (dept && !dept.includes("합계")) currentDept = dept;
            if (item.includes("합계") || item === "부서" || item === "세부 항목")
              continue;
            if (item && amount > 0) {
              expenseDetails.push({
                department: currentDept,
                item: item,
                amount: amount,
                note: note,
              });
            }
          } else if (row.length >= 2) {
            const item = row[0].replace(/\*\*/g, "");
            const amount = parseCurrency(row[1]);
            const note = row.length >= 3 ? row[2] : "";

            if (item.startsWith("소계") || item.startsWith("총계")) continue;
            if (amount === 0 && !note) {
              currentDept = item;
              continue;
            }
            expenseDetails.push({
              department: currentDept,
              item: item,
              amount: amount,
              note: note,
            });
          }
        }
      }
      currentSection = "notes";
      tableLines = [];
    } else if (line.match(/^#{2,3}\s*6\./) || line.startsWith("---")) {
      currentSection = "";
    }

    if (line.startsWith("|") && currentSection) {
      tableLines.push(line);
    }

    if (currentSection === "notes" && line.match(/^\d+\./)) {
      notes.push(line.replace(/^\d+\.\s*/, ""));
    }
  }

  return {
    year,
    month,
    filename,
    summary,
    incomeDetails,
    expenseDetails,
    notes,
  };
}

// Budget CSV Parsing
function parseBudgetCSV(content: string) {
  content = content.replace(/^\uFEFF/, "");
  const lines = content.split("\n").map((l) => l.trim()).filter((l) => l);

  const income = [];
  const expense = [];
  let section = "";
  let currentDept = "";

  for (let i = 0; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);

    if (row[0] === "수입") {
      section = "income";
      continue;
    } else if (row[0] === "지출") {
      section = "expense";
      continue;
    } else if (row[0] === "합계" || row[0] === "예비비(잔액)") {
      continue;
    }

    if (row[0] === "연번" || !row[0]) continue;

    if (section === "income") {
      const id = parseInt(row[0], 10);
      if (isNaN(id)) continue;
      income.push({
        id,
        category: row[1] || "",
        item: row[2] || "",
        amount: parseCurrency(row[7]),
        note: row[8] || "",
      });
    } else if (section === "expense") {
      const id = parseInt(row[0], 10);
      if (isNaN(id)) continue;

      if (row[1]) currentDept = row[1];

      expense.push({
        id,
        department: currentDept,
        budgetCategory: row[2] || "",
        majorItem: row[3] || "",
        subItem: row[4] || "",
        unitPrice: parseCurrency(row[5]),
        unit: row[6] || "",
        frequency: row[7] || "",
        itemTotal: parseCurrency(row[8]),
        departmentTotal: parseCurrency(row[9]),
        note: row[10] || "",
      });
    }
  }

  return { income, expense };
}

function parseSettlementCSV(content: string) {
  content = content.replace(/^\uFEFF/, "");
  const lines = content.split("\n").map((l) => l.trim()).filter((l) => l);

  const income = {
    fund: 0,
    carryover: 0,
    monthlyFees: {} as Record<number, number>,
    monthlyDonations: {} as Record<number, number>,
    interest: 0,
    specialDonations: [] as any[],
    other: 0,
    total: 0,
  };

  const expense = [];
  let section = "";
  let currentDept = "";
  let currentDeptBudget = 0;
  let currentMajorItem = "";
  let currentSubItem = "";
  let currentBudgetAmount = 0;

  for (let i = 0; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);

    if (row[0] === "<수입>") {
      section = "income";
      continue;
    } else if (row[0] === "<지출>") {
      section = "expense";
      continue;
    } else if (row[0] === "합계" || row[0] === "결산액") {
      if (section === "income") {
        income.total = parseCurrency(row[6]);
      }
      continue;
    }

    if (row[0] === "항목" || row[0] === "담당부서") continue;

    if (section === "income") {
      const category = row[0];
      const subCategory = row[2];
      const amount = parseCurrency(row[5]);
      const total = parseCurrency(row[6]);

      if (category === "별도기금") {
        income.fund = total;
      } else if (category === "이월금") {
        income.carryover = total;
      } else if (category === "조합비") {
        if (subCategory) {
          const monthMatch = subCategory.match(/(\d+)월/);
          if (monthMatch) {
            income.monthlyFees[parseInt(monthMatch[1], 10)] = amount;
          }
        }
      } else if (category === "정기 후원비") {
        if (subCategory) {
          const monthMatch = subCategory.match(/(\d+)월/);
          if (monthMatch) {
            income.monthlyDonations[parseInt(monthMatch[1], 10)] = amount;
          }
        }
      } else if (category === "결산이자") {
        income.interest = total;
      } else if (category === "일시 후원비") {
        if (subCategory && amount > 0) {
          income.specialDonations.push({
            donor: subCategory,
            amount: amount,
          });
        }
      } else if (category === "기타") {
        income.other = total;
      }
    } else if (section === "expense") {
      if (row[0]) {
        currentDept = row[0];
        currentDeptBudget = parseCurrency(row[1]);
      }
      if (row[2]) currentMajorItem = row[2];
      if (row[3]) currentSubItem = row[3];
      if (row[4]) currentBudgetAmount = parseCurrency(row[4]);

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
          departmentRemaining: parseCurrency(row[10]),
        });
      }
    }
  }

  return { income, expense };
}

// Data Fetching Functions (Server-Side)

export async function getReports(): Promise<MonthlyReport[]> {
  const reports: MonthlyReport[] = [];
  if (fs.existsSync(MONTHLY_DIR)) {
    const files = fs.readdirSync(MONTHLY_DIR).filter((f) => f.endsWith(".txt"));
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(MONTHLY_DIR, file), "utf-8");
        const report = parseMonthlyReport(content, file);
        reports.push(report);
      } catch (err) {
        console.error(`Error parsing ${file}:`, err);
      }
    }
  }
  return reports.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });
}

export async function getBudgetData(): Promise<BudgetData> {
  let budget = { income: [], expense: [] };
  let settlement = { income: {}, expense: [] };

  if (fs.existsSync(BUDGET_DIR)) {
    const files = fs.readdirSync(BUDGET_DIR);
    for (const file of files) {
      const filePath = path.join(BUDGET_DIR, file);
      if (file.includes("예산안") && file.endsWith(".csv")) {
        try {
          const content = fs.readFileSync(filePath, "utf-8");
          // @ts-ignore
          budget = parseBudgetCSV(content);
        } catch (err) {
          console.error(`Error parsing ${file}:`, err);
        }
      } else if (file.includes("결산안") && file.endsWith(".csv")) {
        try {
          const content = fs.readFileSync(filePath, "utf-8");
          // @ts-ignore
          settlement = parseSettlementCSV(content);
        } catch (err) {
          console.error(`Error parsing ${file}:`, err);
        }
      }
    }
  }
  return { budget, settlement };
}
