"use client";

import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { categorizeTransactionsBatch } from "@/actions/ai";
import { Upload, Download, Save, RefreshCw, Trash2, Loader2, FileSpreadsheet } from "lucide-react";

type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  note: string;
};

export default function ManagerPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem("transaction_manager_data");
    if (saved) {
      try {
        setTransactions(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load saved data", e);
      }
    }
  }, []);

  // Save to local storage whenever transactions change
  useEffect(() => {
    localStorage.setItem("transaction_manager_data", JSON.stringify(transactions));
  }, [transactions]);

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setLoadingMessage("파일을 읽는 중...");
    setIsProcessing(true);

    const reader = new FileReader();

    reader.onload = async (e) => {
      const data = e.target?.result;
      let parsedData: any[] = [];

      if (file.name.endsWith(".csv")) {
        const result = Papa.parse(data as string, { header: true, skipEmptyLines: true });
        parsedData = result.data;
      } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        parsedData = XLSX.utils.sheet_to_json(sheet);
      }

      // Normalize data structure
      const newTransactions: Transaction[] = parsedData.map((row: any, index) => ({
        id: `tx-${Date.now()}-${index}`,
        // Try to find date, description, amount fields intelligently or default
        date: row["날짜"] || row["Date"] || row["일자"] || new Date().toISOString().split('T')[0],
        description: row["적요"] || row["내용"] || row["Description"] || row["받는분"] || row["보낸분"] || "내용 없음",
        amount: parseAmount(row["입금액"] || row["출금액"] || row["거래금액"] || row["Amount"] || "0"),
        category: "미분류",
        note: ""
      }));

      setTransactions((prev) => [...prev, ...newTransactions]);
      setIsProcessing(false);
      setLoadingMessage("");
    };

    if (file.name.endsWith(".csv")) {
      reader.readAsText(file, "EUC-KR"); // Korean banks often use EUC-KR
    } else {
      reader.readAsBinaryString(file);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    }
  });

  const parseAmount = (val: any) => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') return parseInt(val.replace(/,/g, ''), 10) || 0;
    return 0;
  };

  const handleAutoCategorize = async () => {
    setIsProcessing(true);
    setLoadingMessage("AI가 거래 내역을 분석하고 있습니다...");

    // Process in chunks to avoid hitting limits or timeouts
    const unclassified = transactions.filter(t => t.category === "미분류");
    const descriptions = unclassified.map(t => t.description);

    if (descriptions.length === 0) {
        setIsProcessing(false);
        return;
    }

    try {
        const categories = await categorizeTransactionsBatch(descriptions);

        setTransactions(prev => {
            const next = [...prev];
            let catIndex = 0;
            for (let i = 0; i < next.length; i++) {
                if (next[i].category === "미분류" && catIndex < categories.length) {
                    next[i].category = categories[catIndex];
                    catIndex++;
                }
            }
            return next;
        });

    } catch (error) {
        alert("분류 중 오류가 발생했습니다.");
    } finally {
        setIsProcessing(false);
        setLoadingMessage("");
    }
  };

  const updateTransaction = (id: string, field: keyof Transaction, value: any) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const clearAll = () => {
    if (confirm("모든 데이터를 삭제하시겠습니까?")) {
        setTransactions([]);
        localStorage.removeItem("transaction_manager_data");
    }
  };

  const downloadCSV = () => {
    // Add BOM for Excel UTF-8 compatibility
    const bom = "\uFEFF";
    const csv = Papa.unparse(transactions.map(({id, ...rest}) => rest)); // Exclude internal ID
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `financial_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadMarkdown = () => {
    let md = `# 재정 보고서 (${new Date().toLocaleDateString()})\n\n`;
    md += `| 날짜 | 적요 | 카테고리 | 금액 | 비고 |\n`;
    md += `|---|---|---|---|---|\n`;

    transactions.forEach(t => {
        md += `| ${t.date} | ${t.description} | ${t.category} | ${t.amount.toLocaleString()}원 | ${t.note} |\n`;
    });

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `financial_report_${new Date().toISOString().slice(0,10)}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">재정 관리 (Transaction Manager)</h1>
        <p className="mt-2 text-sm text-gray-800">
          은행 거래 내역을 업로드하고 AI를 통해 자동으로 분류하세요.
        </p>
      </div>

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
          isDragActive ? "border-primary bg-blue-50" : "border-gray-300 hover:border-primary"
        }`}
      >
        <input {...getInputProps()} aria-label="파일 업로드" />
        <Upload className="mx-auto h-12 w-12 text-gray-600" />
        <p className="mt-2 text-sm text-gray-800">
          CSV 또는 Excel 파일을 여기로 드래그하거나 클릭하여 업로드하세요.
        </p>
      </div>

      {/* Toolbar */}
      {transactions.length > 0 && (
        <div className="flex flex-wrap gap-4 items-center justify-between bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="flex gap-2">
                 <button
                    onClick={handleAutoCategorize}
                    disabled={isProcessing}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                 >
                    {isProcessing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    AI 자동 분류
                 </button>
                 <button
                    onClick={clearAll}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                 >
                    <Trash2 className="mr-2 h-4 w-4 text-gray-700" />
                    전체 삭제
                 </button>
            </div>
            <div className="flex gap-2">
                 <button
                    onClick={downloadCSV}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                 >
                    <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
                    CSV 다운로드
                 </button>
                 <button
                    onClick={downloadMarkdown}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                 >
                    <Download className="mr-2 h-4 w-4 text-gray-700" />
                    보고서(MD) 다운로드
                 </button>
            </div>
        </div>
      )}

      {isProcessing && loadingMessage && (
          <div className="p-4 bg-blue-50 text-blue-700 rounded-md flex items-center">
              <Loader2 className="animate-spin mr-2 h-5 w-5" />
              {loadingMessage}
          </div>
      )}

      {/* Data Table */}
      {transactions.length > 0 && (
          <div className="bg-white shadow overflow-hidden rounded-lg border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">날짜</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">적요</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">금액</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">카테고리</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">비고</th>
                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">삭제</span></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((t) => (
                    <tr key={t.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <input
                            type="text"
                            value={t.date}
                            onChange={(e) => updateTransaction(t.id, 'date', e.target.value)}
                            className="border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm w-32"
                          />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <input
                            type="text"
                            value={t.description}
                            onChange={(e) => updateTransaction(t.id, 'description', e.target.value)}
                            className="border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm w-full"
                          />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <input
                            type="number"
                            value={t.amount}
                            onChange={(e) => updateTransaction(t.id, 'amount', parseInt(e.target.value))}
                            className="border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm w-24 text-right"
                          />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <select
                            value={t.category}
                            onChange={(e) => updateTransaction(t.id, 'category', e.target.value)}
                            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                          >
                            <option value="미분류">미분류</option>
                            <option value="사무비">사무비</option>
                            <option value="사업비">사업비</option>
                            <option value="회의비">회의비</option>
                            <option value="인건비">인건비</option>
                            <option value="수입">수입</option>
                            <option value="기타">기타</option>
                          </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <input
                            type="text"
                            value={t.note}
                            onChange={(e) => updateTransaction(t.id, 'note', e.target.value)}
                            className="border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm w-full"
                            placeholder="메모"
                          />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => deleteTransaction(t.id)} className="text-red-600 hover:text-red-900">
                            <Trash2 className="h-5 w-5" />
                            <span className="sr-only">삭제</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
      )}
    </div>
  );
}
