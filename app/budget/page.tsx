
import { getBudgetData } from "@/lib/data";
import { BudgetVsActualChart } from "@/components/Charts";

export const dynamic = "force-dynamic";

export default async function BudgetPage() {
  const { budget, settlement } = await getBudgetData();

  // Helper to calculate totals
  const totalBudgetIncome = budget.income.reduce((acc, i) => acc + i.amount, 0);
  const totalBudgetExpense = budget.expense.reduce((acc, i) => acc + i.itemTotal, 0);

  // Calculate settlement totals
  const totalSettlementIncome = settlement.income.total || 0;
  const totalSettlementExpense = settlement.expense.reduce((acc, e) => acc + e.amount, 0);

  // Prepare Chart Data (Aggregated by Department)
  const deptMap = new Map<string, { budget: number, actual: number }>();

  budget.expense.forEach(e => {
      const current = deptMap.get(e.department) || { budget: 0, actual: 0 };
      current.budget += e.itemTotal;
      deptMap.set(e.department, current);
  });

  settlement.expense.forEach(e => {
      const current = deptMap.get(e.department) || { budget: 0, actual: 0 };
      current.actual += e.amount;
      deptMap.set(e.department, current);
  });

  const chartData = Array.from(deptMap.entries()).map(([name, val]) => ({
      name,
      budget: val.budget,
      actual: val.actual
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">예산 및 결산</h1>
        <p className="mt-2 text-sm text-gray-800">
          2025년 예산안 및 결산 내역입니다.
        </p>
      </div>

      {/* Chart Section */}
      <div className="bg-white p-6 shadow rounded-lg border border-gray-200">
         <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">부서별 예산 대비 지출</h2>
         <BudgetVsActualChart data={chartData} />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Budget Summary */}
        <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">예산 요약</h3>
          </div>
          <div className="p-5">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-700">총 예산 수입</dt>
                <dd className="mt-1 text-lg font-semibold text-gray-900">{totalBudgetIncome.toLocaleString()}원</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-700">총 예산 지출</dt>
                <dd className="mt-1 text-lg font-semibold text-gray-900">{totalBudgetExpense.toLocaleString()}원</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Settlement Summary */}
        <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">결산 요약</h3>
          </div>
          <div className="p-5">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-700">총 결산 수입</dt>
                <dd className="mt-1 text-lg font-semibold text-gray-900">{totalSettlementIncome.toLocaleString()}원</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-700">총 결산 지출</dt>
                <dd className="mt-1 text-lg font-semibold text-gray-900">{totalSettlementExpense.toLocaleString()}원</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Budget Expense Details */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">예산 지출 상세</h2>
        <div className="bg-white shadow overflow-hidden rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">부서</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">관</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">항</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">목</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">산출금액</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">비고</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {budget.expense.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.budgetCategory}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.majorItem}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.subItem}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">{item.itemTotal.toLocaleString()}원</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
