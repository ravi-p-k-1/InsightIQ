import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
})

function formatValue(value) {
  return numberFormatter.format(value)
}

function LineChart({
  data,
  xKey = 'year',
  yKey = 'value',
  units,
  ariaLabel,
}) {
  if (!data?.length) {
    return <span>No observations returned</span>
  }

  return (
    <div className="line-chart" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          data={data}
          margin={{ top: 12, right: 12, bottom: 4, left: 0 }}
        >
          <CartesianGrid stroke="#edf0f3" vertical={false} />
          <XAxis
            dataKey={xKey}
            minTickGap={28}
            tick={{ fill: '#66717f', fontSize: 12 }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#66717f', fontSize: 12 }}
            tickFormatter={formatValue}
            tickLine={false}
            width={56}
          />
          <Tooltip
            formatter={(value) => [
              units ? `${formatValue(value)} ${units}` : formatValue(value),
              'Value',
            ]}
            labelFormatter={(label) => `Year: ${label}`}
          />
          <Line
            type="monotone"
            dataKey={yKey}
            stroke="#2f6f73"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default LineChart
