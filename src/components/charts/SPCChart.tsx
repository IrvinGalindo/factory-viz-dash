import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SPCData {
  point: number;
  value: number;
  ucl: number;
  lcl: number;
  avg: number;
  spec: number;
  min: number;
  max: number;
}

interface SPCStats {
  spec: number;
  specDisplay: string;
  specUpper: number;
  specLower: number;
  ucl: number;
  lcl: number;
  avg: number;
  std: number;
  max: number;
  min: number;
  cp: number;
  cpk: number;
  machineUp: number;
  machineLow: number;
}

interface SPCChartProps {
  data: SPCData[];
  stats: SPCStats;
}

export const SPCChart = ({ data, stats }: SPCChartProps) => {
  // Show message when no data is available - FIXED CONDITION
  if (!data || data.length === 0 || !stats) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-muted-foreground">
            <div className="text-lg font-medium mb-2">No se encontraron procesos</div>
            <div className="text-sm">No hay datos disponibles para la máquina seleccionada</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Statistics Panel */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-sm">Control Statistics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded col-span-2">
              <div className="font-semibold text-yellow-800 dark:text-yellow-200">SPEC</div>
              <div className="text-yellow-900 dark:text-yellow-100 text-xs">{stats.specDisplay}</div>
            </div>
            <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded">
              <div className="font-semibold text-red-800 dark:text-red-200">UCL</div>
              <div className="text-red-900 dark:text-red-100">{stats.ucl.toFixed(3)}</div>
            </div>
            <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded">
              <div className="font-semibold text-red-800 dark:text-red-200">LCL</div>
              <div className="text-red-900 dark:text-red-100">{stats.lcl.toFixed(3)}</div>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded">
              <div className="font-semibold text-blue-800 dark:text-blue-200">Avg</div>
              <div className="text-blue-900 dark:text-blue-100">{stats.avg.toFixed(3)}</div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
              <div className="font-semibold">Std</div>
              <div>{stats.std.toFixed(3)}</div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
              <div className="font-semibold">Max</div>
              <div>{stats.max.toFixed(3)}</div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
              <div className="font-semibold">Min</div>
              <div>{stats.min.toFixed(3)}</div>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded">
              <div className="font-semibold text-green-800 dark:text-green-200">Cp</div>
              <div className="text-green-900 dark:text-green-100">{stats.cp.toFixed(3)}</div>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded">
              <div className="font-semibold text-green-800 dark:text-green-200">Cpk</div>
              <div className="text-green-900 dark:text-green-100">{stats.cpk.toFixed(3)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart Panel */}
      <Card className="lg:col-span-3">
        <CardContent className="p-0">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.3} />
              <XAxis 
                dataKey="point" 
                stroke="hsl(var(--foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--foreground))"
                fontSize={12}
                domain={['dataMin - 0.1', 'dataMax + 0.1']}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Legend />
              
              {/* Reference Lines */}
              <ReferenceLine 
                y={stats.spec} 
                stroke="#fbbf24" 
                strokeWidth={2}
                strokeDasharray="5 5"
                label={{ value: "SPEC", position: "left" }}
              />
              <ReferenceLine 
                y={stats.ucl} 
                stroke="#ef4444" 
                strokeWidth={2}
                label={{ value: "UCL", position: "left" }}
              />
              <ReferenceLine 
                y={stats.lcl} 
                stroke="#ef4444" 
                strokeWidth={2}
                label={{ value: "LCL", position: "left" }}
              />
              <ReferenceLine 
                y={stats.avg} 
                stroke="#3b82f6" 
                strokeWidth={2}
                strokeDasharray="3 3"
                label={{ value: "Avg", position: "left" }}
              />
              <ReferenceLine 
                y={stats.max} 
                stroke="#8b5cf6" 
                strokeWidth={2}
                strokeDasharray="2 2"
                label={{ value: "Max", position: "left" }}
              />
              <ReferenceLine 
                y={stats.min} 
                stroke="#f59e0b" 
                strokeWidth={2}
                strokeDasharray="2 2"
                label={{ value: "Min", position: "left" }}
              />
              
              {/* Spec Upper and Lower Limits */}
              <ReferenceLine 
                y={stats.specUpper} 
                stroke="#dc2626" 
                strokeWidth={3}
                label={{ value: "Spec Upper", position: "left" }}
              />
              <ReferenceLine 
                y={stats.specLower} 
                stroke="#dc2626" 
                strokeWidth={3}
                label={{ value: "Spec Lower", position: "left" }}
              />
              
              {/* Data Line */}
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#22c55e" 
                strokeWidth={2}
                dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#22c55e' }}
                name="Actual Values"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};