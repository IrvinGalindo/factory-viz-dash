import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, Tooltip, Legend, Dot } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Subgroup {
  subgroupNumber: number;
  values: number[];
  average: number;
  range: number;
  size: number;
}

interface SChartData {
  subgroupNumber: number;
  s: number;
  isOutOfControl: boolean;
}

interface SChartProps {
  subgroups: Subgroup[];
  processName?: string;
  item?: string;
}

// Constantes B3 y B4 según tamaño de subgrupo (del Apéndice E del manual SPC)
const CONTROL_CONSTANTS: { [key: number]: { B3: number; B4: number } } = {
  2: { B3: 0, B4: 3.267 },
  3: { B3: 0, B4: 2.568 },
  4: { B3: 0, B4: 2.266 },
  5: { B3: 0, B4: 2.089 },
  6: { B3: 0.030, B4: 1.970 },
  7: { B3: 0.118, B4: 1.882 },
  8: { B3: 0.185, B4: 1.815 },
  9: { B3: 0.239, B4: 1.761 },
  10: { B3: 0.284, B4: 1.716 },
};

// Función para calcular la desviación estándar de un subgrupo
const calculateStdDev = (values: number[], mean: number): number => {
  const n = values.length;
  if (n <= 1) return 0;
  
  const sumSquaredDiffs = values.reduce((sum, value) => {
    return sum + Math.pow(value - mean, 2);
  }, 0);
  
  return Math.sqrt(sumSquaredDiffs / (n - 1));
};

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, sBar, uclS, lclS }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-4 text-sm">
        <div className="font-semibold mb-2 text-foreground border-b pb-2">
          Subgrupo #{data.subgroupNumber}
        </div>
        <div className="space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Desviación Estándar (s):</span>
            <span className="font-mono text-foreground">{data.s.toFixed(4)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">s̄ (Promedio):</span>
            <span className="font-mono text-foreground">{sBar.toFixed(4)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">UCLs:</span>
            <span className="font-mono text-foreground">{uclS.toFixed(4)}</span>
          </div>
          {lclS > 0 && (
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">LCLs:</span>
              <span className="font-mono text-foreground">{lclS.toFixed(4)}</span>
            </div>
          )}
          {data.isOutOfControl && (
            <div className="mt-2 pt-2 border-t text-destructive font-semibold">
              ⚠ Fuera de Control
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export const SChart = ({ subgroups, processName = "Proceso", item = "" }: SChartProps) => {
  if (!subgroups || subgroups.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gráfica s (Desviación Estándar)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            No hay datos de subgrupos disponibles
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calcular la desviación estándar de cada subgrupo
  const chartData: SChartData[] = subgroups.map(subgroup => {
    const s = calculateStdDev(subgroup.values, subgroup.average);
    return {
      subgroupNumber: subgroup.subgroupNumber,
      s: s,
      isOutOfControl: false, // Se actualizará después de calcular límites
    };
  });

  // Calcular s̄ (promedio de las desviaciones estándar)
  const sBar = chartData.reduce((sum, point) => sum + point.s, 0) / chartData.length;

  // Obtener las constantes B3 y B4 basadas en el tamaño del subgrupo
  const subgroupSize = subgroups[0].size;
  const constants = CONTROL_CONSTANTS[subgroupSize] || CONTROL_CONSTANTS[10];

  // Calcular límites de control
  const uclS = constants.B4 * sBar;
  const lclS = constants.B3 * sBar;

  // Marcar puntos fuera de control
  chartData.forEach(point => {
    point.isOutOfControl = point.s > uclS || point.s < lclS;
  });

  const outOfControlCount = chartData.filter(p => p.isOutOfControl).length;

  // Calcular dominio del eje Y para asegurar que todos los límites sean visibles
  const allValues = [...chartData.map(d => d.s), uclS, lclS, sBar];
  const minY = Math.min(...allValues);
  const maxY = Math.max(...allValues);
  const yPadding = (maxY - minY) * 0.1;

  // Custom dot renderer para resaltar puntos fuera de control
  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (payload.isOutOfControl) {
      return (
        <circle 
          cx={cx} 
          cy={cy} 
          r={6} 
          fill="hsl(var(--destructive))"
          stroke="white"
          strokeWidth={2}
        />
      );
    }
    return (
      <circle 
        cx={cx} 
        cy={cy} 
        r={4} 
        fill="hsl(var(--primary))"
        stroke="white"
        strokeWidth={1}
      />
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Gráfica s - Control de Variabilidad
          {item && ` (${item})`}
        </CardTitle>
        <div className="text-sm text-muted-foreground mt-2">
          {processName} | Tamaño de Subgrupo: {subgroupSize} | Total Subgrupos: {chartData.length}
        </div>
      </CardHeader>
      <CardContent>
        {/* Estadísticas principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">s̄ (Promedio)</p>
            <p className="text-lg font-semibold">{sBar.toFixed(4)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">UCLs (Límite Superior)</p>
            <p className="text-lg font-semibold text-destructive">{uclS.toFixed(4)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">LCLs (Límite Inferior)</p>
            <p className="text-lg font-semibold text-primary">{lclS > 0 ? lclS.toFixed(4) : (0).toFixed(4)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Puntos Fuera de Control</p>
            <p className={`text-lg font-semibold ${outOfControlCount > 0 ? 'text-destructive' : 'text-green-600'}`}>
              {outOfControlCount} / {chartData.length}
            </p>
          </div>
        </div>

        {/* Gráfica */}
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="subgroupNumber" 
              stroke="hsl(var(--foreground))"
              fontSize={12}
              label={{ value: 'Número de Subgrupo', position: 'insideBottom', offset: -10 }}
            />
            <YAxis 
              stroke="hsl(var(--foreground))"
              fontSize={12}
              domain={[Math.max(0, minY - yPadding), maxY + yPadding]}
              tickFormatter={(value) => value.toFixed(4)}
              label={{ value: 'Desviación Estándar (s)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip sBar={sBar} uclS={uclS} lclS={lclS} />} />
            
            {/* Límite Superior de Control (UCLs) */}
            <ReferenceLine 
              y={uclS} 
              stroke="hsl(var(--destructive))" 
              strokeWidth={2}
              strokeDasharray="5 5"
              label={{ value: 'UCLs', position: 'right', fill: 'hsl(var(--destructive))' }}
            />
            
            {/* Línea Central (s̄) */}
            <ReferenceLine 
              y={sBar} 
              stroke="hsl(var(--foreground))" 
              strokeWidth={2}
              label={{ value: 's̄', position: 'right', fill: 'hsl(var(--foreground))' }}
            />
            
            {/* Límite Inferior de Control (LCLs) */}
            {lclS > 0 && (
              <ReferenceLine 
                y={lclS} 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                strokeDasharray="5 5"
                label={{ value: 'LCLs', position: 'right', fill: 'hsl(var(--primary))' }}
              />
            )}
            
            {/* Línea de datos */}
            <Line 
              type="monotone" 
              dataKey="s" 
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={<CustomDot />}
              name="Desviación Estándar"
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Leyenda personalizada */}
        <div className="mt-4 flex flex-wrap gap-4 justify-center text-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-[hsl(var(--destructive))]" style={{ borderTop: '2px dashed' }}></div>
            <span>UCLs (Límite Superior)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-[hsl(var(--foreground))]"></div>
            <span>s̄ (Promedio)</span>
          </div>
          {lclS > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-[hsl(var(--primary))]" style={{ borderTop: '2px dashed' }}></div>
              <span>LCLs (Límite Inferior)</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[hsl(var(--primary))]"></div>
            <span>Dentro de Control</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[hsl(var(--destructive))]"></div>
            <span>Fuera de Control</span>
          </div>
        </div>

        {/* Interpretación */}
        <div className="mt-6 p-4 bg-muted rounded-lg text-sm">
          <p className="font-semibold mb-2">Interpretación:</p>
          {outOfControlCount === 0 ? (
            <p className="text-green-600">
              ✓ El proceso está en control estadístico. La variabilidad se mantiene estable dentro de los límites establecidos.
            </p>
          ) : (
            <p className="text-destructive">
              ⚠ Hay {outOfControlCount} punto(s) fuera de control. Esto indica cambios en la variabilidad del proceso que requieren investigación.
            </p>
          )}
          {subgroupSize < 9 && (
            <p className="mt-2 text-amber-600">
              ℹ Nota: El tamaño de subgrupo ({subgroupSize}) es menor a 9. Se recomienda usar la Gráfica R para mayor simplicidad.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
