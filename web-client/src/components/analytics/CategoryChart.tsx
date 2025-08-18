import React, { useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { BarChart3, PieChart as PieChartIcon } from 'lucide-react'
import Button from '../ui/Button'
import { formatCurrency, formatPercentage } from '../../utils/formatters'
import { EXPENSE_CATEGORIES } from '../../utils/constants'

interface CategoryChartProps {
  data: Array<{
    category: string
    amount: number
    percentage: number
  }>
  height?: number
}

const CategoryChart: React.FC<CategoryChartProps> = ({
  data,
  height = 300
}) => {
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie')

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500">No category data available</p>
          <p className="text-sm text-gray-400 mt-1">Start categorizing expenses to see breakdown</p>
        </div>
      </div>
    )
  }

  // Get colors for categories
  const getColorForCategory = (categoryName: string) => {
    const category = EXPENSE_CATEGORIES.find(cat => cat.name === categoryName)
    return category?.color || '#737373'
  }

  // Prepare data with colors
  const chartData = data.map((item, index) => ({
    ...item,
    color: getColorForCategory(item.category),
    name: item.category,
  }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-medium">
          <p className="font-medium text-gray-900">{data.category}</p>
          <p className="text-sm text-gray-600">
            Amount: <span className="font-semibold">{formatCurrency(data.amount)}</span>
          </p>
          <p className="text-sm text-gray-600">
            Percentage: <span className="font-semibold">{formatPercentage(data.percentage)}</span>
          </p>
        </div>
      )
    }
    return null
  }

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }: any) => {
    if (percentage < 5) return null // Don't show labels for slices less than 5%

    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${formatPercentage(percentage, 0)}`}
      </text>
    )
  }

  return (
    <div className="space-y-4">
      {/* Chart Type Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant={chartType === 'pie' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setChartType('pie')}
            leftIcon={<PieChartIcon className="h-3 w-3" />}
          >
            Pie
          </Button>
          <Button
            variant={chartType === 'bar' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setChartType('bar')}
            leftIcon={<BarChart3 className="h-3 w-3" />}
          >
            Bar
          </Button>
        </div>

        <div className="text-sm text-gray-600">
          {data.length} categories
        </div>
      </div>

      {/* Chart */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'pie' ? (
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={CustomLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="amount"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="category"
                tick={{ fontSize: 10, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={{ stroke: '#e5e7eb' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={{ stroke: '#e5e7eb' }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="amount" fill="#000000" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Category Legend/List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-4 border-t border-gray-100">
        {data.slice(0, 6).map((item, index) => {
          const categoryInfo = EXPENSE_CATEGORIES.find(cat => cat.name === item.category)
          return (
            <div key={item.category} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
              <div className="flex items-center space-x-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getColorForCategory(item.category) }}
                />
                <div className="flex items-center space-x-1">
                  {categoryInfo && <span className="text-sm">{categoryInfo.icon}</span>}
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {item.category}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {formatCurrency(item.amount)}
                </p>
                <p className="text-xs text-gray-500">
                  {formatPercentage(item.percentage)}
                </p>
              </div>
            </div>
          )
        })}

        {data.length > 6 && (
          <div className="col-span-full text-center">
            <Button variant="ghost" size="sm">
              Show all {data.length} categories
            </Button>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="pt-4 border-t border-gray-100">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Top Category</p>
            <p className="text-sm font-semibold text-gray-900">
              {data[0]?.category || 'None'}
            </p>
            <p className="text-xs text-gray-500">
              {data[0] && formatCurrency(data[0].amount)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Spent</p>
            <p className="text-sm font-semibold text-gray-900">
              {formatCurrency(data.reduce((sum, item) => sum + item.amount, 0))}
            </p>
            <p className="text-xs text-gray-500">
              Across {data.length} categories
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CategoryChart