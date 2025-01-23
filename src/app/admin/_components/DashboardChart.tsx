"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const data = [
  { name: "Jan", value: 12 },
  { name: "Feb", value: 15 },
  { name: "Mär", value: 24 },
  { name: "Apr", value: 32 },
  { name: "Mai", value: 45 },
  { name: "Jun", value: 52 },
  { name: "Jul", value: 58 },
  { name: "Aug", value: 55 },
  { name: "Sep", value: 42 },
  { name: "Okt", value: 35 },
  { name: "Nov", value: 22 },
  { name: "Dez", value: 18 },
];

export function DashboardChart() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data}>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#8884d8"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
