import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ScatterChart,
  Scatter,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
} from "recharts";
import { AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";

interface NormalProbabilityPlotProps {
  values: number[];
  measurementName?: string;
}

// Función para calcular la CDF normal estándar
function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - prob : prob;
}

// Función para calcular la inversa de la CDF normal (approximación)
function inverseNormalCDF(p: number): number {
  if (p <= 0 || p >= 1) return p <= 0 ? -Infinity : Infinity;
  
  const a1 = -39.6968302866538, a2 = 220.946098424521, a3 = -275.928510446969;
  const a4 = 138.357751867269, a5 = -30.6647980661472, a6 = 2.50662827745924;
  const b1 = -54.4760987982241, b2 = 161.585836858041, b3 = -155.698979859887;
  const b4 = 66.8013118877197, b5 = -13.2806815528857;
  const c1 = -0.00778489400243029, c2 = -0.322396458041136, c3 = -2.40075827716184;
  const c4 = -2.54973253934373, c5 = 4.37466414146497, c6 = 2.93816398269878;
  const d1 = 0.00778469570904146, d2 = 0.32246712907004, d3 = 2.445134137143;
  const d4 = 3.75440866190742;
  
  const pLow = 0.02425, pHigh = 1 - pLow;
  
  let q, r, x;
  
  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    x = (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
        ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
  } else if (p <= pHigh) {
    q = p - 0.5;
    r = q * q;
    x = (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q /
        (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    x = -(((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
         ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
  }
  
  return x;
}

// Calcular estadístico Anderson-Darling
function calculateAndersonDarling(values: number[]): { ad: number; pValue: number } {
  const n = values.length;
  
  if (n < 3) {
    return { ad: 0, pValue: 1 };
  }
  
  // Calcular media y desviación estándar
  const mean = values.reduce((sum, x) => sum + x, 0) / n;
  const variance = values.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / (n - 1);
  const std = Math.sqrt(variance);
  
  // Estandarizar y ordenar
  const standardized = values.map(x => (x - mean) / std).sort((a, b) => a - b);
  
  // Calcular AD
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const Fi = normalCDF(standardized[i]);
    const F_ni = normalCDF(standardized[n - 1 - i]);
    
    // Evitar log(0)
    const logFi = Fi > 0 ? Math.log(Fi) : -50;
    const log1F = (1 - F_ni) > 0 ? Math.log(1 - F_ni) : -50;
    
    sum += (2 * i + 1) * (logFi + log1F);
  }
  
  const ad = -n - sum / n;
  
  // Ajustar AD
  const adStar = ad * (1 + 0.75 / n + 2.25 / (n * n));
  
  // Calcular P-value
  let pValue: number;
  if (adStar >= 0.6) {
    pValue = Math.exp(1.2937 - 5.709 * adStar + 0.0186 * adStar * adStar);
  } else if (adStar >= 0.34) {
    pValue = Math.exp(0.9177 - 4.279 * adStar - 1.38 * adStar * adStar);
  } else if (adStar >= 0.2) {
    pValue = 1 - Math.exp(-8.318 + 42.796 * adStar - 59.938 * adStar * adStar);
  } else {
    pValue = 1 - Math.exp(-13.436 + 101.14 * adStar - 223.73 * adStar * adStar);
  }
  
  return { ad, pValue: Math.max(0, Math.min(1, pValue)) };
}

export const NormalProbabilityPlot = ({ values, measurementName = "Medición" }: NormalProbabilityPlotProps) => {
  if (!values || values.length < 3) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-xl text-card-foreground">
            Gráfica de Probabilidad Normal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <AlertCircle className="mr-2 h-5 w-5" />
            Se requieren al menos 3 mediciones para evaluar normalidad
          </div>
        </CardContent>
      </Card>
    );
  }

  // Ordenar valores
  const sortedValues = [...values].sort((a, b) => a - b);
  const n = sortedValues.length;

  // Calcular percentiles teóricos
  const theoreticalQuantiles = sortedValues.map((_, i) => {
    const p = (i + 0.5) / n;
    return inverseNormalCDF(p);
  });

  // Calcular línea de referencia (regresión lineal)
  const meanObserved = sortedValues.reduce((sum, x) => sum + x, 0) / n;
  const meanTheoretical = theoreticalQuantiles.reduce((sum, x) => sum + x, 0) / n;
  
  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (theoreticalQuantiles[i] - meanTheoretical) * (sortedValues[i] - meanObserved);
    denominator += Math.pow(theoreticalQuantiles[i] - meanTheoretical, 2);
  }
  const slope = numerator / denominator;
  const intercept = meanObserved - slope * meanTheoretical;

  // Calcular límites de confianza del 95% (márgenes de error)
  const stdResidual = Math.sqrt(
    sortedValues.reduce((sum, val, i) => {
      const expected = intercept + slope * theoreticalQuantiles[i];
      return sum + Math.pow(val - expected, 2);
    }, 0) / Math.max(n - 2, 1)
  );

  // Preparar datos para la gráfica incluyendo límites de confianza
  const plotData = theoreticalQuantiles.map((th, i) => ({
    theoretical: th,
    observed: sortedValues[i],
    expected: intercept + slope * th,
    upperConfidence: intercept + slope * th + 1.96 * stdResidual,
    lowerConfidence: intercept + slope * th - 1.96 * stdResidual,
  }));

  // Calcular estadístico Anderson-Darling
  const { ad, pValue } = calculateAndersonDarling(values);

  // Determinar si es normal
  const isNormal = pValue > 0.05;
  const adQuality = ad < 1.0 ? "excelente" : ad < 2.0 ? "aceptable" : "pobre";

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="text-xl text-card-foreground mb-2">
              Gráfica de Probabilidad Normal
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {measurementName} • n = {n} mediciones
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Badge 
              variant={isNormal ? "default" : "destructive"}
              className="flex items-center gap-1"
            >
              {isNormal ? (
                <><CheckCircle2 className="h-3 w-3" /> Distribución Normal</>
              ) : (
                <><AlertCircle className="h-3 w-3" /> No Normal</>
              )}
            </Badge>
            <div className="text-sm space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">AD:</span>
                <span className="font-mono font-semibold text-foreground">{ad.toFixed(3)}</span>
                <Badge variant="outline" className="text-xs">{adQuality}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">P:</span>
                <span className="font-mono font-semibold text-foreground">
                  {pValue < 0.001 ? "< 0.001" : pValue.toFixed(3)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-2 md:p-4">
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={plotData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.3} />
            
            <XAxis
              dataKey="observed"
              type="number"
              domain={['dataMin - 0.01', 'dataMax + 0.01']}
              label={{ 
                value: 'Valor Observado', 
                position: 'insideBottom', 
                offset: -10,
                style: { fontSize: 12, fill: 'hsl(var(--foreground))' }
              }}
              tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }}
              stroke="hsl(var(--muted-foreground))"
            />
            
            <YAxis
              dataKey="theoretical"
              type="number"
              label={{ 
                value: 'Percentil Normal Teórico', 
                angle: -90, 
                position: 'insideLeft',
                style: { fontSize: 12, fill: 'hsl(var(--foreground))' }
              }}
              tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }}
              stroke="hsl(var(--muted-foreground))"
            />
            
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                color: 'hsl(var(--popover-foreground))',
              }}
              formatter={(value: number) => value.toFixed(4)}
              labelFormatter={() => ''}
            />

            {/* Límite de confianza superior - Margen de error superior */}
            <Line
              type="monotone"
              dataKey="upperConfidence"
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              isAnimationActive={false}
              name="Límite superior 95%"
            />
            
            {/* Límite de confianza inferior - Margen de error inferior */}
            <Line
              type="monotone"
              dataKey="lowerConfidence"
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              isAnimationActive={false}
              name="Límite inferior 95%"
            />

            {/* Línea de valor esperado (normalidad perfecta) */}
            <Line
              type="monotone"
              dataKey="expected"
              stroke="hsl(var(--primary))"
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
              name="Valor esperado"
            />

            {/* Puntos de datos observados */}
            <Scatter
              dataKey="observed"
              fill={isNormal ? "hsl(var(--chart-2))" : "hsl(var(--destructive))"}
              name="Datos observados"
            />
          </ComposedChart>
        </ResponsiveContainer>

        {/* Interpretación y recomendaciones */}
        <div className="mt-6 space-y-4 text-sm">
          <div className={`p-4 rounded-lg border ${
            isNormal 
              ? 'bg-green-500/10 border-green-500/20' 
              : 'bg-destructive/10 border-destructive/20'
          }`}>
            <div className="flex items-start gap-2">
              {isNormal ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
              )}
              <div className="space-y-2">
                <p className="font-semibold text-foreground">
                  {isNormal 
                    ? "✓ Los datos siguen una distribución normal" 
                    : "✗ Los datos NO siguen una distribución normal"}
                </p>
                <p className="text-muted-foreground">
                  {isNormal
                    ? `Los índices Cp, Cpk y los límites de control son confiables. P-value = ${pValue.toFixed(3)} (> 0.05)`
                    : `Los índices Cp/Cpk y límites UCL/LCL pueden ser inexactos. P-value ${pValue < 0.001 ? "< 0.001" : `= ${pValue.toFixed(3)}`} (≤ 0.05)`}
                </p>
              </div>
            </div>
          </div>

          {!isNormal && (
            <div className="p-4 rounded-lg border bg-amber-500/10 border-amber-500/20">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-3">
                  <p className="font-semibold text-foreground">Recomendaciones</p>
                  <ul className="space-y-2 text-muted-foreground list-disc list-inside">
                    {n < 30 && (
                      <li>Aumentar muestra a ≥ 30 mediciones para mejor evaluación</li>
                    )}
                    <li>Investigar si hay mezcla de poblaciones o flujos</li>
                    <li>Verificar límites físicos del proceso</li>
                    <li>Considerar transformación de datos (Box-Cox)</li>
                    <li>Usar métodos no-paramétricos (percentiles en lugar de ±3σ)</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Leyenda explicativa */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-border">
            <div className="flex items-start gap-2">
              <div className="w-3 h-3 rounded-full bg-primary mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">Valor esperado</p>
                <p className="text-xs text-muted-foreground">Línea de normalidad teórica</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0" 
                   style={{ backgroundColor: isNormal ? "hsl(var(--chart-2))" : "hsl(var(--destructive))" }} />
              <div>
                <p className="font-medium text-foreground">Puntos observados</p>
                <p className="text-xs text-muted-foreground">Valores medidos del proceso</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-8 h-0.5 border-t-2 border-dashed mt-2 flex-shrink-0" style={{ borderColor: "#ef4444" }} />
              <div>
                <p className="font-medium text-foreground">Márgenes de error</p>
                <p className="text-xs text-muted-foreground">Límites de confianza 95%</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="mt-1 flex-shrink-0">
                <span className="text-xs font-mono font-semibold text-foreground">AD</span>
              </div>
              <div>
                <p className="font-medium text-foreground">Anderson-Darling</p>
                <p className="text-xs text-muted-foreground">Mide ajuste a normalidad</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
