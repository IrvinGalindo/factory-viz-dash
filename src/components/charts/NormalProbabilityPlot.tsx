// components/charts/NormalProbabilityPlot.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ComposedChart, Scatter, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { AlertCircle } from "lucide-react";

interface NormalProbabilityPlotProps {
  values: number[];
  measurementName?: string;
}

// Inverse Normal CDF for plotting
function inverseNormalCDF(p: number): number {
  if (p <= 0 || p >= 1) return p <= 0 ? -Infinity : Infinity;
  const a1 = -39.6968302866538,
    a2 = 220.946098424521,
    a3 = -275.928510446969;
  const a4 = 138.357751867269,
    a5 = -30.6647980661472,
    a6 = 2.50662827745924;
  const b1 = -54.4760987982241,
    b2 = 161.585836858041,
    b3 = -155.698979859887;
  const b4 = 66.8013118877197,
    b5 = -13.2806815528857;
  const c1 = -0.00778489400243029,
    c2 = -0.322396458041136,
    c3 = -2.40075827716184;
  const c4 = -2.54973253934373,
    c5 = 4.37466414146497,
    c6 = 2.93816398269878;
  const d1 = 0.00778469570904146,
    d2 = 0.32246712907004,
    d3 = 2.445134137143;
  const d4 = 3.75440866190742;
  const pLow = 0.02425,
    pHigh = 1 - pLow;
  let q, r, x;
  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    x = (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) / ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
  } else if (p <= pHigh) {
    q = p - 0.5;
    r = q * q;
    x =
      ((((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q) /
      (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    x = -(((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) / ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
  }
  return x;
}

// Simple Anderson-Darling test approximation
function andersonDarlingTest(values: number[]): { ad: number; pValue: number; isNormal: boolean } {
  const n = values.length;
  if (n < 3) return { ad: 0, pValue: 1, isNormal: true };

  const sorted = [...values].sort((a, b) => a - b);
  const mean = sorted.reduce((a, b) => a + b, 0) / n;
  const std = Math.sqrt(sorted.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (n - 1));

  if (std === 0) return { ad: 0, pValue: 1, isNormal: true };

  // Standard normal CDF
  const normalCDF = (x: number) => {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - p : p;
  };

  let S = 0;
  for (let i = 0; i < n; i++) {
    const z = (sorted[i] - mean) / std;
    const F = normalCDF(z);
    const Fclamp = Math.max(0.0001, Math.min(0.9999, F));
    S += (2 * (i + 1) - 1) * (Math.log(Fclamp) + Math.log(1 - normalCDF((sorted[n - 1 - i] - mean) / std)));
  }

  let A2 = -n - S / n;
  A2 = A2 * (1 + 0.75 / n + 2.25 / (n * n)); // Adjusted statistic

  // Approximate p-value
  let pValue: number;
  if (A2 < 0.2) pValue = 1 - Math.exp(-13.436 + 101.14 * A2 - 223.73 * A2 * A2);
  else if (A2 < 0.34) pValue = 1 - Math.exp(-8.318 + 42.796 * A2 - 59.938 * A2 * A2);
  else if (A2 < 0.6) pValue = Math.exp(0.9177 - 4.279 * A2 - 1.38 * A2 * A2);
  else if (A2 < 10) pValue = Math.exp(1.2937 - 5.709 * A2 + 0.0186 * A2 * A2);
  else pValue = 0;

  pValue = Math.max(0, Math.min(1, pValue));

  return { ad: A2, pValue, isNormal: pValue >= 0.05 };
}

export const NormalProbabilityPlot = ({ values, measurementName = "Medición" }: NormalProbabilityPlotProps) => {
  if (!values || values.length < 3) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gráfica de Probabilidad Normal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <AlertCircle className="mr-2 h-5 w-5" />
            Se requieren al menos 3 mediciones
          </div>
        </CardContent>
      </Card>
    );
  }

  const normalityTest = andersonDarlingTest(values);
  const n = values.length;
  const { ad, pValue, isNormal } = normalityTest;

  const sortedValues = [...values].sort((a, b) => a - b);

  const plotData = sortedValues.map((val, i) => {
    const p = (i + 0.5) / n;
    const theoretical = inverseNormalCDF(p);
    return { observed: val, theoretical };
  });

  // Reference line
  const minObs = sortedValues[0];
  const maxObs = sortedValues[n - 1];
  const minTheo = inverseNormalCDF(0.001);
  const maxTheo = inverseNormalCDF(0.999);
  const slope = (maxObs - minObs) / (maxTheo - minTheo);
  const intercept = minObs - slope * minTheo;

  const referenceLine = [
    { observed: intercept + slope * minTheo, theoretical: minTheo },
    { observed: intercept + slope * maxTheo, theoretical: maxTheo },
  ];

  // X-axis ticks at 0.1 intervals
  const xTickMin = Math.floor(minObs * 10) / 10;
  const xTickMax = Math.ceil(maxObs * 10) / 10;
  const xTicks: number[] = [];
  for (let tick = xTickMin; tick <= xTickMax + 0.0001; tick += 0.1) {
    xTicks.push(Math.round(tick * 10) / 10);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Gráfica de Probabilidad Normal</CardTitle>
            <p className="text-sm text-muted-foreground">
              {measurementName} • n = {n}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Badge variant={isNormal ? "default" : "destructive"}>{isNormal ? "Normal" : "No Normal"}</Badge>
            <div className="text-sm">
              <div>AD: {ad.toFixed(3)}</div>
              <div>P: {pValue < 0.001 ? "< 0.001" : pValue.toFixed(3)}</div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={plotData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="observed" 
              type="number"
              domain={[xTickMin - 0.05, xTickMax + 0.05]}
              ticks={xTicks}
              tickFormatter={(value) => value.toFixed(1)}
              label={{ value: "Valor Observado", position: "insideBottom", offset: -5 }} 
            />
            <YAxis dataKey="theoretical" label={{ value: "Percentil Teórico", angle: -90, position: "insideLeft" }} />
            <Tooltip 
              formatter={(value: number, name: string) => [value.toFixed(4), name]}
              labelFormatter={(label) => `Percentil: ${Number(label).toFixed(3)}`}
            />
            <Line
              data={referenceLine}
              type="linear"
              dataKey="theoretical"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
              name="Línea de referencia"
            />
            <Scatter 
              dataKey="theoretical" 
              fill={isNormal ? "hsl(var(--chart-2))" : "hsl(var(--destructive))"} 
              name="Datos observados"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
