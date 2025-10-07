import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, Cell, Line, LineChart, ComposedChart } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CapabilityData {
  range: string;
  frequency: number;
  rangeStart: number;
  rangeEnd: number;
  normalValue?: number;
  isOutOfSpec?: boolean;
}

interface CapabilityStats {
  cp: number;
  cpk: number;
  pp?: number;
  ppk?: number;
  avg: number;
  std: number;
  stdWithin?: number;
  stdOverall?: number;
  ucl: number;
  lcl: number;
  upperSpecLimit: number;
  lowerSpecLimit: number;
  nominal: number;
  sampleCount: number;
  withinSpecCount: number;
  outOfSpecCount: number;
}

interface CapabilityHistogramChartProps {
  rawValues: number[];
  stats: CapabilityStats;
}

// Función para calcular la distribución normal
const calculateNormalDistribution = (x: number, mean: number, std: number): number => {
  const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(std, 2));
  return (1 / (std * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
};

export const CapabilityHistogramChart = ({ rawValues, stats }: CapabilityHistogramChartProps) => {
  if (!rawValues || rawValues.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-muted-foreground">
            <div className="text-lg font-medium mb-2">No hay datos disponibles</div>
            <div className="text-sm">No se encontraron mediciones para generar el histograma</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calcular el rango de datos
  const minValue = Math.min(...rawValues);
  const maxValue = Math.max(...rawValues);
  const range = maxValue - minValue;
  
  // Número de bins usando la regla de Sturges
  const numBins = Math.ceil(Math.log2(rawValues.length) + 1);
  const binWidth = range / numBins;

  // Crear bins para el histograma
  const bins: CapabilityData[] = [];
  for (let i = 0; i < numBins; i++) {
    const rangeStart = minValue + (i * binWidth);
    const rangeEnd = rangeStart + binWidth;
    const frequency = rawValues.filter(v => v >= rangeStart && (i === numBins - 1 ? v <= rangeEnd : v < rangeEnd)).length;
    
    // Verificar si este bin está fuera de especificación
    const isOutOfSpec = rangeEnd < stats.lowerSpecLimit || rangeStart > stats.upperSpecLimit;
    
    bins.push({
      range: `${rangeStart.toFixed(3)}`,
      frequency,
      rangeStart,
      rangeEnd,
      isOutOfSpec
    });
  }

  // Calcular valores de la curva normal
  const normalCurvePoints: any[] = [];
  const step = range / 100;
  const maxFrequency = Math.max(...bins.map(b => b.frequency));
  
  for (let i = 0; i <= 100; i++) {
    const x = minValue + (i * step);
    const normalValue = calculateNormalDistribution(x, stats.avg, stats.stdOverall || stats.std);
    // Escalar la curva normal para que se ajuste al histograma
    const scaledValue = (normalValue * maxFrequency * binWidth * rawValues.length);
    
    normalCurvePoints.push({
      x: x,
      normalValue: scaledValue
    });
  }

  // Combinar datos del histograma con la curva normal
  const chartData = bins.map(bin => {
    const midPoint = (bin.rangeStart + bin.rangeEnd) / 2;
    const normalPoint = normalCurvePoints.find(p => Math.abs(p.x - midPoint) < step);
    
    return {
      ...bin,
      normalValue: normalPoint?.normalValue || 0
    };
  });

  const withinSpecPercentage = ((stats.withinSpecCount / stats.sampleCount) * 100).toFixed(1);
  const outOfSpecPercentage = ((stats.outOfSpecCount / stats.sampleCount) * 100).toFixed(1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Statistics Panel */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-sm">Índices de Capacidad</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-2 text-xs">
            <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded">
              <div className="font-semibold text-green-800 dark:text-green-200">Cp</div>
              <div className="text-green-900 dark:text-green-100 text-lg">{stats.cp.toFixed(3)}</div>
              <div className="text-xs text-muted-foreground">Capacidad del proceso</div>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded">
              <div className="font-semibold text-green-800 dark:text-green-200">Cpk</div>
              <div className="text-green-900 dark:text-green-100 text-lg">{stats.cpk.toFixed(3)}</div>
              <div className="text-xs text-muted-foreground">Capacidad centrada</div>
            </div>
            {stats.pp !== undefined && (
              <div className="bg-teal-100 dark:bg-teal-900/30 p-2 rounded">
                <div className="font-semibold text-teal-800 dark:text-teal-200">Pp</div>
                <div className="text-teal-900 dark:text-teal-100 text-lg">{stats.pp.toFixed(3)}</div>
                <div className="text-xs text-muted-foreground">Desempeño del proceso</div>
              </div>
            )}
            {stats.ppk !== undefined && (
              <div className="bg-teal-100 dark:bg-teal-900/30 p-2 rounded">
                <div className="font-semibold text-teal-800 dark:text-teal-200">Ppk</div>
                <div className="text-teal-900 dark:text-teal-100 text-lg">{stats.ppk.toFixed(3)}</div>
                <div className="text-xs text-muted-foreground">Desempeño centrado</div>
              </div>
            )}
            
            <div className="border-t pt-2 mt-2">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded mb-2">
                <div className="font-semibold text-blue-800 dark:text-blue-200">μ (Promedio)</div>
                <div className="text-blue-900 dark:text-blue-100">{stats.avg.toFixed(4)}</div>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded mb-2">
                <div className="font-semibold">σ (Desv. Estándar)</div>
                <div>{(stats.stdOverall || stats.std).toFixed(4)}</div>
              </div>
            </div>

            <div className="border-t pt-2 mt-2">
              <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded mb-1">
                <div className="font-semibold text-green-700 dark:text-green-300">Dentro de Spec</div>
                <div className="text-lg font-bold text-green-800 dark:text-green-200">
                  {withinSpecPercentage}%
                </div>
                <div className="text-xs text-muted-foreground">
                  {stats.withinSpecCount} de {stats.sampleCount}
                </div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded">
                <div className="font-semibold text-red-700 dark:text-red-300">Fuera de Spec</div>
                <div className="text-lg font-bold text-red-800 dark:text-red-200">
                  {outOfSpecPercentage}%
                </div>
                <div className="text-xs text-muted-foreground">
                  {stats.outOfSpecCount} de {stats.sampleCount}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Histogram Chart */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="text-base">Histograma de Capacidad del Proceso</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ResponsiveContainer width="100%" height={450}>
            <ComposedChart data={chartData} margin={{ top: 30, right: 30, left: 30, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.3} />
              <XAxis 
                dataKey="range" 
                stroke="hsl(var(--foreground))"
                fontSize={10}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                stroke="hsl(var(--foreground))"
                fontSize={12}
                label={{ value: 'Frecuencia', angle: -90, position: 'insideLeft' }}
              />
              
              {/* Reference lines for spec limits */}
              <ReferenceLine 
                x={stats.upperSpecLimit.toFixed(3)} 
                stroke="#dc2626" 
                strokeWidth={3}
                label={{ value: 'USL', position: 'top', fill: '#dc2626', fontSize: 12, fontWeight: 'bold' }}
              />
              <ReferenceLine 
                x={stats.lowerSpecLimit.toFixed(3)} 
                stroke="#dc2626" 
                strokeWidth={3}
                label={{ value: 'LSL', position: 'top', fill: '#dc2626', fontSize: 12, fontWeight: 'bold' }}
              />
              
              {/* Reference lines for control limits */}
              <ReferenceLine 
                x={stats.ucl.toFixed(3)} 
                stroke="#ec4899" 
                strokeWidth={2}
                strokeDasharray="5 5"
                label={{ value: 'UCL', position: 'top', fill: '#ec4899', fontSize: 10 }}
              />
              <ReferenceLine 
                x={stats.lcl.toFixed(3)} 
                stroke="#ec4899" 
                strokeWidth={2}
                strokeDasharray="5 5"
                label={{ value: 'LCL', position: 'top', fill: '#ec4899', fontSize: 10 }}
              />
              
              {/* Reference line for average/nominal */}
              <ReferenceLine 
                x={stats.avg.toFixed(3)} 
                stroke="#3b82f6" 
                strokeWidth={2}
                strokeDasharray="8 4"
                label={{ value: 'X̄', position: 'top', fill: '#3b82f6', fontSize: 12, fontWeight: 'bold' }}
              />
              
              {/* Histogram bars */}
              <Bar dataKey="frequency" name="Frecuencia">
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.isOutOfSpec ? '#ef4444' : '#22c55e'}
                    opacity={0.7}
                  />
                ))}
              </Bar>
              
              {/* Normal distribution curve */}
              <Line 
                type="monotone" 
                dataKey="normalValue" 
                stroke="#8b5cf6" 
                strokeWidth={3}
                dot={false}
                name="Distribución Normal"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
        
        {/* Legend */}
        <div className="px-4 pb-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 opacity-70 rounded"></div>
              <span>Dentro de Especificación</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 opacity-70 rounded"></div>
              <span>Fuera de Especificación</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-purple-500"></div>
              <span>Curva Normal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-red-600"></div>
              <span>LSL/USL (Límites Spec)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-blue-500" style={{backgroundImage: 'linear-gradient(to right, #3b82f6 50%, transparent 50%)', backgroundSize: '8px 2px'}}></div>
              <span>X̄ (Promedio)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-pink-500 border-dashed border-t-2 border-pink-500" style={{borderStyle: 'dashed'}}></div>
              <span>UCL/LCL (Control)</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
