
import { getReports, getBudgetData } from "@/lib/data";
import Link from "next/link";
import { ArrowUp, ArrowDown, Wallet } from "lucide-react";
import { TrendChart } from "@/components/Charts";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const reports = await getReports();
  const { budget } = await getBudgetData();

  const currentMonth = reports.length > 0 ? reports[reports.length - 1] : null;

  // Calculate year-to-date totals
  const totalIncome = reports.reduce((acc, r) => acc + r.summary.income, 0);
  const totalExpense = reports.reduce((acc, r) => acc + r.summary.expense, 0);
  const currentBalance = currentMonth ? currentMonth.summary.currentBalance : 0;

  const chartData = reports.map(r => ({
      name: `${r.month}월`,
      income: r.summary.income,
      expense: r.summary.expense,
      balance: r.summary.currentBalance
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">재정 대시보드</h1>
        <p className="mt-2 text-sm text-gray-800">
          함께하는장애인교원노동조합의 현재 재정 상태를 한눈에 확인하세요.
        </p>
      </div>

      {/* Chart Section */}
      <div className="bg-white p-6 shadow rounded-lg border border-gray-200">
        <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">월별 재정 추세</h2>
        <TrendChart data={chartData} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowUp className="h-6 w-6 text-success" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-700 truncate">
                    올해 누적 수입
                  </dt>
                  <dd className="text-lg font-bold text-gray-900">
                    {totalIncome.toLocaleString()}원
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowDown className="h-6 w-6 text-danger" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-700 truncate">
                    올해 누적 지출
                  </dt>
                  <dd className="text-lg font-bold text-gray-900">
                    {totalExpense.toLocaleString()}원
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Wallet className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-700 truncate">
                    현재 잔액
                  </dt>
                  <dd className="text-lg font-bold text-gray-900">
                    {currentBalance.toLocaleString()}원
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-white shadow rounded-lg border border-gray-200">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h2 className="text-lg leading-6 font-medium text-gray-900">
            최근 월별 보고서
          </h2>
          <Link href="/reports" className="text-sm font-medium text-primary hover:text-primary/80">
            전체 보기 &rarr;
          </Link>
        </div>
        <div className="border-t border-gray-200">
          <ul role="list" className="divide-y divide-gray-200">
            {reports.slice(-5).reverse().map((report) => (
              <li key={`${report.year}-${report.month}`}>
                <Link href={`/reports/${report.year}-${report.month}`} className="block hover:bg-gray-50 transition">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-primary truncate">
                        {report.year}년 {report.month}월 재정 보고서
                      </p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          완료
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-700">
                          수입: {report.summary.income.toLocaleString()}원
                        </p>
                        <p className="mt-2 flex items-center text-sm text-gray-700 sm:mt-0 sm:ml-6">
                          지출: {report.summary.expense.toLocaleString()}원
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
            {reports.length === 0 && (
              <li className="px-4 py-8 text-center text-gray-700">
                데이터가 없습니다.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
