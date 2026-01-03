"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

interface TrendChartProps {
  data: {
    name: string;
    income: number;
    expense: number;
    balance: number;
  }[];
}

export function TrendChart({ data }: TrendChartProps) {
  return (
    <div className="h-80 w-full" aria-label="월별 재정 추세 차트">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip
            formatter={(value: number) => value.toLocaleString() + "원"}
            labelStyle={{ color: 'black' }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="income"
            name="수입"
            stroke="#059669" // success color
            activeDot={{ r: 8 }}
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="expense"
            name="지출"
            stroke="#dc2626" // danger color
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BudgetVsActualChart({ data }: { data: any[] }) {
    return (
        <div className="h-96 w-full" aria-label="예산 대비 실제 지출 차트">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip formatter={(value: number) => value.toLocaleString() + "원"} labelStyle={{ color: 'black' }} />
                    <Legend />
                    <Bar dataKey="budget" name="예산" fill="#2563eb" />
                    <Bar dataKey="actual" name="실제 지출" fill="#dc2626" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
