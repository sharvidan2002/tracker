import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency, formatDate } from '../../utils/formatters'

interface SpendingChartProps {
  data: Array<{ date: string; amount: number }>
  period: 'week' | 'month' | 'year'
  height?: number
}

const SpendingChart: React.FC<SpendingChartProps> = ({
  data,
  period,
  height = 300
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500">No spending data available</p>
          <p className="text-sm text-gray-400 mt-1">Start adding expenses to see trends</p>
        </div>
      </div>
    )
  }

  // Format data for the chart
  const chartData = data.map(item => ({
    ...item,
    date: formatDate(item.date, period === 'year' ? 'MMM yyyy' : period === 'month' ? 'MMM dd' : 'EEE'),
    formattedAmount: formatCurrency(item.amount),
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-medium">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-gray-600">
            Spent: <span className="font-semibold">{formatCurrency(payload[0].value)}</span>
          </p>
        </div>
      )
    }
    return null
  }

  const maxAmount = Math.max(...data.map(d => d.amount))
  const minAmount = Math.min(...data.map(d => d.amount))
  const avgAmount = data.reduce((sum, d) => sum + d.amount, 0) / data.length

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Average</p>
          <p className="text-sm font-semibold text-gray-900">{formatCurrency(avgAmount)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Highest</p>
          <p className="text-sm font-semibold text-gray-900">{formatCurrency(maxAmount)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Lowest</p>
          <p className="text-sm font-semibold text-gray-900">{formatCurrency(minAmount)}</p>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickLine={{ stroke: '#e5e7eb' }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="amount"
              stroke="#000000"
              strokeWidth={2}
              dot={{ fill: '#000000', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#000000', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Trend Analysis */}
      <div className="pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            Total for {period === 'week' ? 'this week' : period === 'month' ? 'this month' : 'this year'}:
          </span>
          <span className="font-semibold text-gray-900">
            {formatCurrency(data.reduce((sum, d) => sum + d.amount, 0))}
          </span>
        </div>

        {data.length >= 2 && (
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-gray-600">Change from previous {period}:</span>
            {(() => {
              const current = data[data.length - 1].amount
              const previous = data[data.length - 2].amount
              const change = previous ? ((current - previous) / previous) * 100 : 0
              return (
                <span className={`font-semibold ${change > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {change > 0 ? '+' : ''}{change.toFixed(1)}%
                </span>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}

export default SpendingChart