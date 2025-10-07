import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, Cell, Line, LineChart, ComposedChart, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CapabilityData {
  range: string;
  frequency: number;
  rangeStart: number;
  rangeEnd: number;
  midPoint: number;
  normalValue?: number;
  isOutOfSpec?: boolean;
  withinSpec?: number;
  outOfSpec?: number;
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

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, stats }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-4 text-sm">
        <div className="font-semibold mb-2 text-foreground border-b pb-2">
          Rango: {data.rangeStart.toFixed(4)} - {data.rangeEnd.toFixed(4)}
        </div>
        
        <div className="space-y-1.5">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Frecuencia Total:</span>
            <span className="font-semibold text-foreground">{data.frequency}</span>
          </div>
          
          <div className="flex justify-between gap-4">
            <span className="text-green-600 dark:text-green-400">Dentro de Spec:</span>
            <span className="font-semibold text-green-700 dark:text-green-300">{data.withinSpec}</span>
          </div>
          
          <div className="flex justify-between gap-4">
            <span className="text-red-600 dark:text-red-400">Fuera de Spec:</span>
            <span className="font-semibold text-red-700 dark:text-red-300">{data.outOfSpec}</span>
          </div>
        </div>
        
        <div className="border-t mt-2 pt-2 space-y-1 text-xs">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">LSL:</span>
            <span className="text-red-600 dark:text-red-400 font-medium">{stats.lowerSpecLimit.toFixed(4)}</span>
          </div>
          
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Promedio (X̄):</span>
            <span className="text-blue-600 dark:text-blue-400 font-medium">{stats.avg.toFixed(4)}</span>
          </div>
          
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">USL:</span>
            <span className="text-red-600 dark:text-red-400 font-medium">{stats.upperSpecLimit.toFixed(4)}</span>
          </div>
          
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">LCL:</span>
            <span className="text-pink-600 dark:text-pink-400 font-medium">{stats.lcl.toFixed(4)}</span>
          </div>
          
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">UCL:</span>
            <span className="text-pink-600 dark:text-pink-400 font-medium">{stats.ucl.toFixed(4)}</span>
          </div>
        </div>
        
        <div className="border-t mt-2 pt-2 text-xs">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Cpk:</span>
            <span className="font-medium text-foreground">
              {stats.cpk != null ? stats.cpk.toFixed(3) : 'N/A'}
            </span>
          </div>
          {stats.ppk != null && (
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Ppk:</span>
              <span className="font-medium text-foreground">{stats.ppk.toFixed(3)}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  return null;
};

// Función para calcular la distribución normal
const calculateNormalDistribution = (x: number, mean: number, std: number): number => {
  const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(std, 2));
  return (1 / (std * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
};

export const CapabilityHistogramChart = ({ rawValues, stats }: CapabilityHistogramChartProps) => {
  // Log para debugging
  console.log("📊 Histograma - Valores recibidos:", rawValues.length);
  console.log("📊 Histograma - rawValues:", rawValues);
  console.log("📊 Histograma - stats.sampleCount:", stats.sampleCount);
  
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
  
  console.log("📊 Histograma - Número de bins calculados:", numBins);

  // Crear bins para el histograma
  const bins: CapabilityData[] = [];
  for (let i = 0; i < numBins; i++) {
    const rangeStart = minValue + (i * binWidth);
    const rangeEnd = rangeStart + binWidth;
    const midPoint = (rangeStart + rangeEnd) / 2;
    
    // Obtener los valores que caen en este bin
    const valuesInBin = rawValues.filter(v => 
      v >= rangeStart && (i === numBins - 1 ? v <= rangeEnd : v < rangeEnd)
    );
    
    // Contar cuántos están dentro y fuera de especificación
    const withinSpecInBin = valuesInBin.filter(v => 
      v >= stats.lowerSpecLimit && v <= stats.upperSpecLimit
    ).length;
    
    const outOfSpecInBin = valuesInBin.length - withinSpecInBin;
    
    bins.push({
      range: `${rangeStart.toFixed(3)}-${rangeEnd.toFixed(3)}`,
      frequency: valuesInBin.length,
      rangeStart,
      rangeEnd,
      midPoint,
      withinSpec: withinSpecInBin,
      outOfSpec: outOfSpecInBin,
      isOutOfSpec: outOfSpecInBin > 0 && withinSpecInBin === 0 // Solo si TODOS están fuera
    });
  }
  
  console.log("📊 Histograma - Bins creados:", bins);

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
    const normalPoint = normalCurvePoints.find(p => Math.abs(p.x - bin.midPoint) < step);
    
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
              <div className="text-green-900 dark:text-green-100 text-lg">
                {stats.cp != null ? stats.cp.toFixed(3) : 'N/A'}
              </div>
              <div className="text-xs text-muted-foreground">Capacidad del proceso</div>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded">
              <div className="font-semibold text-green-800 dark:text-green-200">Cpk</div>
              <div className="text-green-900 dark:text-green-100 text-lg">
                {stats.cpk != null ? stats.cpk.toFixed(3) : 'N/A'}
              </div>
              <div className="text-xs text-muted-foreground">Capacidad centrada</div>
            </div>
            {stats.pp != null && (
              <div className="bg-teal-100 dark:bg-teal-900/30 p-2 rounded">
                <div className="font-semibold text-teal-800 dark:text-teal-200">Pp</div>
                <div className="text-teal-900 dark:text-teal-100 text-lg">{stats.pp.toFixed(3)}</div>
                <div className="text-xs text-muted-foreground">Desempeño del proceso</div>
              </div>
            )}
            {stats.ppk != null && (
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
          <CardTitle className="text-base">
            Histograma de Capacidad del Proceso
            <span className="ml-3 text-sm font-normal text-muted-foreground">
              (Total de valores: {rawValues.length} | Barras del histograma: {numBins})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ResponsiveContainer width="100%" height={450}>
            <ComposedChart data={chartData} margin={{ top: 30, right: 30, left: 30, bottom: 80 }} barCategoryGap="10%">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.3} />
              <XAxis 
                dataKey="midPoint" 
                type="number"
                domain={[
                  (dataMin: number) => Math.min(dataMin, stats.lowerSpecLimit) - 0.02,
                  (dataMax: number) => Math.max(dataMax, stats.upperSpecLimit) + 0.02
                ]}
                stroke="hsl(var(--foreground))"
                fontSize={10}
                tickFormatter={(value) => value.toFixed(4)}
                ticks={chartData.map(d => d.midPoint)}
                angle={-45}
                textAnchor="end"
                height={80}
                label={{ value: 'Valor', position: 'insideBottom', offset: -10 }}
              />
              <YAxis 
                stroke="hsl(var(--foreground))"
                fontSize={12}
                label={{ value: 'Frecuencia', angle: -90, position: 'insideLeft' }}
              />
              
              {/* Custom Tooltip */}
              <Tooltip content={<CustomTooltip stats={stats} />} />
              
              {/* Reference lines for spec limits */}
              <ReferenceLine 
                x={stats.upperSpecLimit} 
                stroke="#dc2626" 
                strokeWidth={3}
                label={{ value: 'USL', position: 'top', fill: '#dc2626', fontSize: 12, fontWeight: 'bold' }}
              />
              <ReferenceLine 
                x={stats.lowerSpecLimit} 
                stroke="#dc2626" 
                strokeWidth={3}
                label={{ value: 'LSL', position: 'top', fill: '#dc2626', fontSize: 12, fontWeight: 'bold' }}
              />
              
              {/* Reference lines for control limits */}
              <ReferenceLine 
                x={stats.ucl} 
                stroke="#ec4899" 
                strokeWidth={2}
                strokeDasharray="5 5"
                label={{ value: 'UCL', position: 'top', fill: '#ec4899', fontSize: 10 }}
              />
              <ReferenceLine 
                x={stats.lcl} 
                stroke="#ec4899" 
                strokeWidth={2}
                strokeDasharray="5 5"
                label={{ value: 'LCL', position: 'top', fill: '#ec4899', fontSize: 10 }}
              />
              
              {/* Reference line for average/nominal */}
              <ReferenceLine 
                x={stats.avg} 
                stroke="#3b82f6" 
                strokeWidth={2}
                strokeDasharray="8 4"
                label={{ value: 'X̄', position: 'top', fill: '#3b82f6', fontSize: 12, fontWeight: 'bold' }}
              />
              
              {/* Histogram bars - Dentro de especificación */}
              <Bar 
                dataKey="withinSpec" 
                stackId="spec"
                name="Dentro de Spec"
                fill="#22c55e"
                opacity={0.7}
                maxBarSize={60}
              />
              
              {/* Histogram bars - Fuera de especificación */}
              <Bar 
                dataKey="outOfSpec" 
                stackId="spec"
                name="Fuera de Spec"
                fill="#ef4444"
                opacity={0.7}
                maxBarSize={60}
              />
              
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
