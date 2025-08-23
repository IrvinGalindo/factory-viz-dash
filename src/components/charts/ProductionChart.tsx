import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface ProductionData {
  month: string;
  produced: number;
  target: number;
}

interface ProductionChartProps {
  data: ProductionData[];
}

const chartConfig = {
  produced: {
    label: 'Producido',
    color: 'hsl(var(--primary))',
  },
  target: {
    label: 'Objetivo',
    color: 'hsl(var(--muted))',
  },
};

export const ProductionChart = ({ data }: ProductionChartProps) => {
  return (
    <ChartContainer config={chartConfig} className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="month" 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <ChartTooltip
            content={<ChartTooltipContent />}
          />
          <Bar 
            dataKey="target" 
            fill="hsl(var(--muted))" 
            radius={[4, 4, 0, 0]}
            opacity={0.7}
          />
          <Bar 
            dataKey="produced" 
            fill="hsl(var(--primary))" 
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};