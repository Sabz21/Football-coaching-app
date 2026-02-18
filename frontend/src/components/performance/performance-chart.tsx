'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from 'recharts';
import { PerformanceMetric, MetricCategory } from '@/types';
import { cn, CATEGORY_COLORS, formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PerformanceChartProps {
  data: PerformanceMetric[];
  title?: string;
  className?: string;
}

export function PerformanceLineChart({
  data,
  title = 'Progress Over Time',
  className,
}: PerformanceChartProps) {
  const chartData = data.map((metric) => ({
    date: formatDate(metric.measuredAt, 'MMM d'),
    value: Number(metric.value),
    name: metric.name,
  }));

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

interface RadarChartData {
  category: string;
  value: number;
  fullMark: number;
}

interface PerformanceRadarChartProps {
  data: Record<MetricCategory, PerformanceMetric[]>;
  className?: string;
}

export function PerformanceRadarChart({
  data,
  className,
}: PerformanceRadarChartProps) {
  // Calculate average for each category
  const chartData: RadarChartData[] = Object.entries(data).map(
    ([category, metrics]) => {
      const avg =
        metrics.length > 0
          ? metrics.reduce((sum, m) => sum + Number(m.value), 0) / metrics.length
          : 0;
      return {
        category: category.charAt(0) + category.slice(1).toLowerCase(),
        value: Math.round(avg),
        fullMark: 100,
      };
    }
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Skills Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis
                dataKey="category"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              />
              <Radar
                name="Performance"
                dataKey="value"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// Metric category progress bars
interface MetricProgressProps {
  category: MetricCategory;
  metrics: PerformanceMetric[];
  className?: string;
}

export function MetricCategoryProgress({
  category,
  metrics,
  className,
}: MetricProgressProps) {
  const colors = CATEGORY_COLORS[category];

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        <div className={cn('w-2 h-2 rounded-full', colors.bg.replace('/20', ''))} />
        <h4 className="text-sm font-medium capitalize">
          {category.toLowerCase()}
        </h4>
      </div>
      <div className="space-y-2">
        {metrics.map((metric) => (
          <div key={metric.id}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">{metric.name}</span>
              <span className={cn('font-medium', colors.text)}>
                {Math.round(Number(metric.value))}
                {metric.unit && <span className="text-muted-foreground ml-0.5">{metric.unit}</span>}
              </span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-500')}
                style={{
                  width: `${metric.value}%`,
                  backgroundColor: colors.fill,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
