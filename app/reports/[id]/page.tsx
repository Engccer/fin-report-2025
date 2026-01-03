
import { getReports } from "@/lib/data";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AIAnalysis } from "@/components/AIAnalysis";

export const dynamic = "force-dynamic";

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [yearStr, monthStr] = id.split("-");
  const year = parseInt(yearStr);
  const month = parseInt(monthStr);

  const reports = await getReports();
  const report = reports.find((r) => r.year === year && r.month === month);

  if (!report) {
    notFound();
  }

  // Prepare context for AI
  const aiContext = `
    보고서: ${report.year}년 ${report.month}월
    요약: 수입 ${report.summary.income}원, 지출 ${report.summary.expense}원, 잔액 ${report.summary.currentBalance}원
    주요 수입: ${report.incomeDetails.map(i => `${i.item}(${i.amount}원)`).join(", ")}
    주요 지출: ${report.expenseDetails.map(e => `${e.item}(${e.amount}원)`).join(", ")}
    특이사항: ${report.notes.join(", ")}
  `;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center space-x-4">
        <Link
          href="/reports"
          className="inline-flex items-center p-2 rounded-full text-gray-700 hover:bg-gray-100 transition"
          aria-label="목록으로 돌아가기"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {report.year}년 {report.month}월 재정 보고서
          </h1>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-white shadow overflow-hidden rounded-lg border border-gray-200">
        <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
          <h2 className="text-lg leading-6 font-medium text-gray-900">
            재정 요약
          </h2>
        </div>
        <div className="px-4 py-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <dt className="text-sm font-medium text-gray-700">전월 이월금</dt>
            <dd className="mt-1 text-xl font-semibold text-gray-900">
              {report.summary.previousBalance.toLocaleString()}원
            </dd>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <dt className="text-sm font-medium text-green-700">당월 수입</dt>
            <dd className="mt-1 text-xl font-semibold text-green-900">
              {report.summary.income.toLocaleString()}원
            </dd>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <dt className="text-sm font-medium text-red-700">당월 지출</dt>
            <dd className="mt-1 text-xl font-semibold text-red-900">
              {report.summary.expense.toLocaleString()}원
            </dd>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <dt className="text-sm font-medium text-blue-700">잔액</dt>
            <dd className="mt-1 text-xl font-semibold text-blue-900">
              {report.summary.currentBalance.toLocaleString()}원
            </dd>
          </div>
        </div>
      </div>

      {/* Income Details */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">수입 내역</h2>
        <div className="bg-white shadow overflow-hidden rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">구분</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">항목</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">금액</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">비고</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {report.incomeDetails.length > 0 ? (
                  report.incomeDetails.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.item}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">{item.amount.toLocaleString()}원</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.note}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-700">수입 내역이 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Expense Details */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">지출 내역</h2>
        <div className="bg-white shadow overflow-hidden rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">부서</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">항목</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">금액</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">비고</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {report.expenseDetails.length > 0 ? (
                  report.expenseDetails.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.department}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.item}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">{item.amount.toLocaleString()}원</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.note}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-700">지출 내역이 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Notes */}
      {report.notes.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">특이사항</h2>
          <div className="bg-white shadow overflow-hidden rounded-lg border border-gray-200 p-6">
            <ul className="list-disc pl-5 space-y-2">
              {report.notes.map((note, idx) => (
                <li key={idx} className="text-sm text-gray-700">{note}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* AI Analysis */}
      <AIAnalysis contextData={aiContext} />
    </div>
  );
}
