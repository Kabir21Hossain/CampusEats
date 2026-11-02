"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { getDashboardAnalytics } from "@/lib/dashboard-analytics";

const RANGES = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
];

/**
 * Arrow function formatCurrency.
 * @param {*} value - Input value used by the operation.
 * @returns {*} The operation result.
 */
const formatCurrency = (value) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

/**
 * Function ChartTooltip.
 * @param {*} payload - Input value used by the operation.
 * @param {*} label - Input value used by the operation.
 * @returns {*} The operation result.
 */
function ChartTooltip({ active, payload, label, format }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
      <p className="mb-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">{label}</p>
      {payload.map((item) => (
        <div key={item.dataKey} className="flex items-center justify-between gap-5 text-xs">
          <span className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
            {item.name}
          </span>
          <strong className="text-zinc-900 dark:text-zinc-100">
            {format === "currency" ? formatCurrency(item.value) : item.value}
          </strong>
        </div>
      ))}
    </div>
  );
}

/**
 * Function ChartCard.
 * @returns {*} The operation result.
 */
function ChartCard({ chart }) {
  const Chart = chart.type === "bar" ? BarChart : chart.type === "area" ? AreaChart : LineChart;
  const axisFormatter = chart.format === "currency"
    ? (value) => (value ? formatCurrency(value) : "৳0")
    : undefined;

  return (
    <Card>
      <CardContent className="p-5 sm:p-6">
        <div className="mb-5">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{chart.title}</h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{chart.description}</p>
        </div>
        <div className="h-64 w-full" role="img" aria-label={`${chart.title} chart`}>
          <ResponsiveContainer width="100%" height="100%">
            <Chart data={chart.data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#71717a", fontSize: 11 }}
                minTickGap={18}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#71717a", fontSize: 11 }}
                tickFormatter={axisFormatter}
                width={chart.format === "currency" ? 76 : 40}
              />
              <Tooltip content={<ChartTooltip format={chart.format} />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ fontSize: 11, paddingBottom: 16 }}
              />
              {chart.series.map((series) => {
                if (chart.type === "bar") {
                  return (
                    <Bar
                      key={series.key}
                      dataKey={series.key}
                      name={series.label}
                      fill={series.color}
                      radius={[5, 5, 0, 0]}
                      maxBarSize={28}
                    />
                  );
                }
                if (chart.type === "area") {
                  return (
                    <Area
                      key={series.key}
                      dataKey={series.key}
                      name={series.label}
                      type="monotone"
                      stroke={series.color}
                      fill={series.color}
                      fillOpacity={0.12}
                      strokeWidth={2.5}
                      activeDot={{ r: 5 }}
                    />
                  );
                }
                return (
                  <Line
                    key={series.key}
                    dataKey={series.key}
                    name={series.label}
                    type="monotone"
                    stroke={series.color}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                );
              })}
            </Chart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Function DistributionCard.
 * @param {*} description - Input value used by the operation.
 * @param {*} data - Input value used by the operation.
 * @returns {*} The operation result.
 */
function DistributionCard({ title, description, data, hasOrders }) {
  return (
    <Card>
      <CardContent className="p-5 sm:p-6">
        <div className="mb-5">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{title}</h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
        </div>
        {!hasOrders ? (
          <div className="flex h-64 items-center justify-center text-sm text-zinc-400">
            No orders in this period.
          </div>
        ) : (
          <div className="h-64 w-full" role="img" aria-label={`${title} doughnut chart`}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={62}
                  outerRadius={88}
                  paddingAngle={3}
                  stroke="none"
                >
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{ fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Function DashboardAnalytics.
 * @param {*} role - Input value used by the operation.
 * @param {*} viewerId - Input value used by the operation.
 * @returns {*} The operation result.
 */
export function DashboardAnalytics({ orders, role, viewerId, error }) {
  const [days, setDays] = useState(30);
  const analytics = useMemo(
    () => getDashboardAnalytics(orders, role, days, viewerId),
    [orders, role, days, viewerId]
  );

  return (
    <section className="space-y-4" aria-labelledby={`${role}-analytics-heading`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id={`${role}-analytics-heading`} className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Activity insights
          </h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Interactive charts based on order history.
          </p>
        </div>
        <div className="flex w-fit rounded-xl border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900" aria-label="Chart date range">
          {RANGES.map((range) => (
            <button
              key={range.days}
              type="button"
              onClick={() => setDays(range.days)}
              aria-pressed={days === range.days}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                days === range.days
                  ? "bg-emerald-700 text-white"
                  : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          Charts could not be loaded: {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {analytics.charts.map((chart) => <ChartCard key={chart.title} chart={chart} />)}
        <DistributionCard
          title={analytics.distributionTitle}
          description={analytics.distributionDescription}
          data={analytics.distribution}
          hasOrders={analytics.hasOrders}
        />
      </div>
    </section>
  );
}
