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
            <span className="text-red-600 dark:text-red-400 font-medium">{stats.lowerSpecLimit}</span>
          </div>
          
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Promedio (X̄):</span>
            <span className="text-blue-600 dark:text-blue-400 font-medium">{stats.avg}</span>
          </div>
          
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">USL:</span>
            <span className="text-red-600 dark:text-red-400 font-medium">{stats.upperSpecLimit}</span>
          </div>
          
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">LCL:</span>
            <span className="text-pink-600 dark:text-pink-400 font-medium">{stats.lcl}</span>
          </div>
          
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">UCL:</span>
            <span className="text-pink-600 dark:text-pink-400 font-medium">{stats.ucl}</span>
          </div>
        </div>
        
        <div className="border-t mt-2 pt-2 text-xs space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Cp:</span>
            <span className="font-medium text-foreground">
              {stats.cp != null ? stats.cp : 'N/A'}
            </span>
          </div>
          
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Cpk:</span>
            <span className="font-medium text-foreground">
              {stats.cpk != null ? stats.cpk : 'N/A'}
            </span>
          </div>
          
          {stats.pp != null && (
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Pp:</span>
              <span className="font-medium text-foreground">{stats.pp}</span>
            </div>
          )}
          
          {stats.ppk != null && (
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Ppk:</span>
              <span className="font-medium text-foreground">{stats.ppk}</span>
            </div>
          )}
          
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">σ (Desv. Estándar):</span>
            <span className="font-medium text-foreground">
              {stats.stdOverall || stats.std}
            </span>
          </div>
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

// Función para calcular la CDF (Cumulative Distribution Function) de la distribución normal
const normalCDF = (z: number): number => {
  // Aproximación de la función CDF usando la función de error
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
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
  
  // Priorizar rangos de 0.5
  const preferredBinWidth = 0.5;
  const potentialBins = Math.ceil(range / preferredBinWidth);
  
  // Si el número de bins con 0.5 es razonable (entre 5 y 30), usar 0.5
  // Si no, calcular usando la regla de Sturges
  let numBins: number;
  let binWidth: number;
  
  if (potentialBins >= 5 && potentialBins <= 30) {
    binWidth = preferredBinWidth;
    numBins = potentialBins;
    console.log("📊 Histograma - Usando rangos de 0.5");
  } else {
    numBins = Math.ceil(Math.log2(rawValues.length) + 1);
    binWidth = range / numBins;
    console.log("📊 Histograma - Usando rangos custom (Sturges)");
  }
  
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
      range: `${rangeStart}-${rangeEnd}`,
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

  // Calcular el rango extendido para la curva normal (4 desviaciones estándar en cada lado)
  const stdOverall = stats.stdOverall || stats.std;
  const stdWithin = stats.stdWithin || stats.std;
  const curveMin = stats.avg - (4 * stdOverall);
  const curveMax = stats.avg + (4 * stdOverall);
  const curveRange = curveMax - curveMin;
  
  // Calcular valores de la curva normal con rango extendido
  const normalCurvePoints: any[] = [];
  const curveSteps = 200; // Más puntos para una curva más suave
  const curveStep = curveRange / curveSteps;
  const maxFrequency = Math.max(...bins.map(b => b.frequency));
  
  for (let i = 0; i <= curveSteps; i++) {
    const x = curveMin + (i * curveStep);
    
    // Curva Normal Overall
    const normalValueOverall = calculateNormalDistribution(x, stats.avg, stdOverall);
    const scaledValueOverall = normalValueOverall * rawValues.length * binWidth;
    
    // Curva Normal Within
    const normalValueWithin = calculateNormalDistribution(x, stats.avg, stdWithin);
    const scaledValueWithin = normalValueWithin * rawValues.length * binWidth;
    
    normalCurvePoints.push({
      x: x,
      normalValueOverall: scaledValueOverall,
      normalValueWithin: scaledValueWithin
    });
  }

  // Combinar datos del histograma con la curva normal
  // Primero, agregar puntos para la curva que están fuera del rango de los bins
  const chartData: any[] = [];
  
  // Agregar puntos de la curva antes del primer bin
  normalCurvePoints
    .filter(p => p.x < bins[0].rangeStart)
    .forEach(point => {
      chartData.push({
        range: `${point.x}`,
        frequency: 0,
        rangeStart: point.x,
        rangeEnd: point.x,
        midPoint: point.x,
        withinSpec: 0,
        outOfSpec: 0,
        normalValueOverall: point.normalValueOverall,
        normalValueWithin: point.normalValueWithin,
        isExtended: true // Marcador para saber que es parte de la extensión
      });
    });
  
  // Agregar bins con sus valores de curva normal
  bins.forEach(bin => {
    const normalPoint = normalCurvePoints.find(p => Math.abs(p.x - bin.midPoint) < curveStep * 2);
    
    chartData.push({
      ...bin,
      normalValueOverall: normalPoint?.normalValueOverall || 0,
      normalValueWithin: normalPoint?.normalValueWithin || 0
    });
  });
  
  // Agregar puntos de la curva después del último bin
  normalCurvePoints
    .filter(p => p.x > bins[bins.length - 1].rangeEnd)
    .forEach(point => {
      chartData.push({
        range: `${point.x}`,
        frequency: 0,
        rangeStart: point.x,
        rangeEnd: point.x,
        midPoint: point.x,
        withinSpec: 0,
        outOfSpec: 0,
        normalValueOverall: point.normalValueOverall,
        normalValueWithin: point.normalValueWithin,
        isExtended: true // Marcador para saber que es parte de la extensión
      });
    });

  const withinSpecPercentage = ((stats.withinSpecCount / stats.sampleCount) * 100).toFixed(1);
  const outOfSpecPercentage = ((stats.outOfSpecCount / stats.sampleCount) * 100).toFixed(1);

  // Calcular el dominio del eje X para asegurar que TODOS los límites sean visibles
  // Incluir el rango extendido de la curva normal
  const allLimits = [
    stats.lowerSpecLimit,
    stats.upperSpecLimit,
    stats.lcl,
    stats.ucl,
    stats.avg,
    minValue,
    maxValue,
    curveMin,
    curveMax
  ];
  const absoluteMin = Math.min(...allLimits);
  const absoluteMax = Math.max(...allLimits);
  const domainRange = absoluteMax - absoluteMin;
  const domainPadding = domainRange * 0.1; // 10% de padding en cada lado para mejor visualización

  // Ajustar dominio del eje Y para incluir tanto la curva normal como las barras
  const stackedMax = Math.max(...bins.map(b => b.frequency));
  const lineMaxYOverall = Math.max(...normalCurvePoints.map(p => p.normalValueOverall));
  const lineMaxYWithin = Math.max(...normalCurvePoints.map(p => p.normalValueWithin));
  const yMax = Math.max(stackedMax, lineMaxYOverall, lineMaxYWithin) * 1.15; // 15% de espacio superior

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Histogram Chart */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-base">
            Histograma de Capacidad del Proceso
            <span className="ml-3 text-sm font-normal text-muted-foreground">
              (Total de valores: {rawValues.length} | Barras del histograma: {numBins})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 md:p-4">
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={bins} margin={{ top: 20, right: 10, left: 0, bottom: 60 }} barCategoryGap="1%" barGap={0}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.3} />
              
              {/* Definir gradientes para las áreas de desviación */}
              <defs>
                <linearGradient id="sigma3Area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.05} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="sigma2Area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="sigma1Area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              
              <XAxis 
                dataKey="midPoint" 
                type="number"
                domain={[absoluteMin - domainPadding, absoluteMax + domainPadding]}
                stroke="hsl(var(--foreground))"
                fontSize={9}
                tickFormatter={(value) => value.toFixed(4)}
                ticks={bins.map(d => d.midPoint)}
                angle={-45}
                textAnchor="end"
                height={60}
                label={{ value: 'Valor', position: 'insideBottom', offset: -5, fontSize: 11 }}
              />
              <YAxis 
                stroke="hsl(var(--foreground))"
                fontSize={10}
                width={40}
                domain={[0, yMax]}
                label={{ value: 'Frecuencia', angle: -90, position: 'insideLeft', fontSize: 11 }}
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
              
              {/* Reference lines for standard deviations */}
              <ReferenceLine 
                x={stats.avg + stdOverall} 
                stroke="#8b5cf6" 
                strokeWidth={1}
                strokeDasharray="3 3"
                opacity={0.5}
                label={{ value: '+1σ', position: 'top', fill: '#8b5cf6', fontSize: 9 }}
              />
              <ReferenceLine 
                x={stats.avg - stdOverall} 
                stroke="#8b5cf6" 
                strokeWidth={1}
                strokeDasharray="3 3"
                opacity={0.5}
                label={{ value: '-1σ', position: 'top', fill: '#8b5cf6', fontSize: 9 }}
              />
              <ReferenceLine 
                x={stats.avg + 2*stdOverall} 
                stroke="#8b5cf6" 
                strokeWidth={1}
                strokeDasharray="3 3"
                opacity={0.4}
                label={{ value: '+2σ', position: 'top', fill: '#8b5cf6', fontSize: 9 }}
              />
              <ReferenceLine 
                x={stats.avg - 2*stdOverall} 
                stroke="#8b5cf6" 
                strokeWidth={1}
                strokeDasharray="3 3"
                opacity={0.4}
                label={{ value: '-2σ', position: 'top', fill: '#8b5cf6', fontSize: 9 }}
              />
              <ReferenceLine 
                x={stats.avg + 3*stdOverall} 
                stroke="#8b5cf6" 
                strokeWidth={1}
                strokeDasharray="3 3"
                opacity={0.3}
                label={{ value: '+3σ', position: 'top', fill: '#8b5cf6', fontSize: 9 }}
              />
              <ReferenceLine 
                x={stats.avg - 3*stdOverall} 
                stroke="#8b5cf6" 
                strokeWidth={1}
                strokeDasharray="3 3"
                opacity={0.3}
                label={{ value: '-3σ', position: 'top', fill: '#8b5cf6', fontSize: 9 }}
              />
              
              {/* Histogram bars - Dentro de especificación */}
              <Bar 
                dataKey="withinSpec" 
                stackId="spec"
                name="Dentro de Spec"
                fill="#22c55e"
                opacity={0.8}
                maxBarSize={80}
              />
              
              {/* Histogram bars - Fuera de especificación */}
              <Bar 
                dataKey="outOfSpec" 
                stackId="spec"
                name="Fuera de Spec"
                fill="#ef4444"
                opacity={0.8}
                maxBarSize={80}
              />
              
              {/* Normal distribution curves */}
              <Line 
                data={chartData}
                type="basis" 
                dataKey="normalValueOverall" 
                stroke="#f59e0b" 
                strokeWidth={2.5}
                dot={false}
                name="Curva Overall"
                opacity={0.9}
                isAnimationActive={false}
              />
              <Line 
                data={chartData}
                type="basis" 
                dataKey="normalValueWithin" 
                stroke="#10b981" 
                strokeWidth={2.5}
                dot={false}
                name="Curva Within"
                opacity={0.9}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
        
        {/* Legend */}
        <div className="px-2 pb-2 md:px-4 md:pb-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 text-xs md:text-sm mb-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 opacity-70 rounded"></div>
              <span>Dentro de Especificación</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 opacity-70 rounded"></div>
              <span>Fuera de Especificación</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-amber-500"></div>
              <span>Curva Overall</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-emerald-500"></div>
              <span>Curva Within</span>
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
          
          {/* Process Data and Statistics Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 border-t pt-4">
            {/* Process Data */}
            <div>
              <h4 className="font-semibold text-sm mb-3 text-foreground">Datos del Proceso</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">LSL:</span>
                  <span className="font-mono">{stats.lowerSpecLimit.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">USL:</span>
                  <span className="font-mono">{stats.upperSpecLimit.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Promedio (X̄):</span>
                  <span className="font-mono">{stats.avg.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tamaño de Muestra:</span>
                  <span className="font-mono">{stats.sampleCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">σ (Within):</span>
                  <span className="font-mono">{(stats.stdWithin || stats.std).toFixed(6)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">σ (Overall):</span>
                  <span className="font-mono">{(stats.stdOverall || stats.std).toFixed(6)}</span>
                </div>
              </div>
            </div>
            
            {/* Capability Indices */}
            <div>
              <h4 className="font-semibold text-sm mb-3 text-foreground">Índices de Capacidad</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Overall</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span>Pp:</span>
                      <span className="font-mono">{stats.pp?.toFixed(2) || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ppk:</span>
                      <span className="font-mono">{stats.ppk?.toFixed(2) || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Potential (Within)</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span>Cp:</span>
                      <span className="font-mono">{stats.cp.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cpk:</span>
                      <span className="font-mono">{stats.cpk.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Performance Section */}
          <div className="mt-6 border-t pt-4">
            <h4 className="font-semibold text-sm mb-3 text-foreground">Desempeño</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2"></th>
                    <th className="text-right py-2 px-2">Observado</th>
                    <th className="text-right py-2 px-2">Esperado Within</th>
                    <th className="text-right py-2 px-2">Esperado Overall</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  <tr className="border-b">
                    <td className="py-2 text-muted-foreground">PPM &lt; LSL</td>
                    <td className="text-right py-2 px-2 font-mono">
                      {((stats.outOfSpecCount / stats.sampleCount) * 1000000).toFixed(2)}
                    </td>
                    <td className="text-right py-2 px-2 font-mono">
                      {(stats.stdWithin ? (normalCDF((stats.lowerSpecLimit - stats.avg) / stats.stdWithin) * 1000000).toFixed(2) : 'N/A')}
                    </td>
                    <td className="text-right py-2 px-2 font-mono">
                      {(normalCDF((stats.lowerSpecLimit - stats.avg) / stdOverall) * 1000000).toFixed(2)}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 text-muted-foreground">PPM &gt; USL</td>
                    <td className="text-right py-2 px-2 font-mono">
                      {((stats.outOfSpecCount / stats.sampleCount) * 1000000).toFixed(2)}
                    </td>
                    <td className="text-right py-2 px-2 font-mono">
                      {(stats.stdWithin ? ((1 - normalCDF((stats.upperSpecLimit - stats.avg) / stats.stdWithin)) * 1000000).toFixed(2) : 'N/A')}
                    </td>
                    <td className="text-right py-2 px-2 font-mono">
                      {((1 - normalCDF((stats.upperSpecLimit - stats.avg) / stdOverall)) * 1000000).toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-muted-foreground">PPM Total</td>
                    <td className="text-right py-2 px-2 font-mono font-semibold">
                      {((stats.outOfSpecCount / stats.sampleCount) * 1000000).toFixed(2)}
                    </td>
                    <td className="text-right py-2 px-2 font-mono font-semibold">
                      {(stats.stdWithin ? (
                        (normalCDF((stats.lowerSpecLimit - stats.avg) / stats.stdWithin) +
                        (1 - normalCDF((stats.upperSpecLimit - stats.avg) / stats.stdWithin))) * 1000000
                      ).toFixed(2) : 'N/A')}
                    </td>
                    <td className="text-right py-2 px-2 font-mono font-semibold">
                      {((normalCDF((stats.lowerSpecLimit - stats.avg) / stdOverall) +
                        (1 - normalCDF((stats.upperSpecLimit - stats.avg) / stdOverall))) * 1000000).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
