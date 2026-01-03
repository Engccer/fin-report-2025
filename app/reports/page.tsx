
import { getReports } from "@/lib/data";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const reports = await getReports();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">월별 재정 보고서</h1>
        <p className="mt-2 text-sm text-gray-800">
          월별 상세 수입 및 지출 내역을 확인하세요.
        </p>
      </div>

      <div className="bg-white shadow overflow-hidden rounded-md">
        <ul role="list" className="divide-y divide-gray-200">
          {reports
            .slice()
            .reverse()
            .map((report) => (
              <li key={`${report.year}-${report.month}`}>
                <Link
                  href={`/reports/${report.year}-${report.month}`}
                  className="block hover:bg-gray-50 transition"
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-primary truncate">
                        {report.year}년 {report.month}월 재정 보고서
                      </div>
                      <div className="ml-2 flex-shrink-0 flex">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {report.summary.currentBalance.toLocaleString()}원
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 flex justify-between">
                      <div className="sm:flex">
                        <div className="mr-6 flex items-center text-sm text-gray-700">
                          <span className="font-medium mr-1">수입:</span>
                          {report.summary.income.toLocaleString()}원
                        </div>
                        <div className="flex items-center text-sm text-gray-700">
                          <span className="font-medium mr-1">지출:</span>
                          {report.summary.expense.toLocaleString()}원
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          {reports.length === 0 && (
            <li className="px-4 py-8 text-center text-gray-700">
              보고서 데이터가 없습니다.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
