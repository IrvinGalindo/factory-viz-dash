// components/charts/NormalProbabilityPlot.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ComposedChart, Scatter, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface NormalProbabilityPlotProps {
  measurement: {
    allValues: number[];
    normalityTest: {
      ad: number;
      pValue: number;
      isNormal: boolean;
    };
    columnName?: string;
  };
}

// ESTA FUNCIÓN SÍ QUEDA EN FRONTEND (solo para dibujar)
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

export const NormalProbabilityPlot = ({ measurement }: NormalProbabilityPlotProps) => {
  const { allValues, normalityTest, columnName = "Medición" } = measurement;

  if (!allValues || allValues.length < 3) {
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

  const n = allValues.length;
  const ad = normalityTest.ad;
  const pValue = normalityTest.pValue;
  const isNormal = normalityTest.isNormal;

  const sortedValues = [...allValues].sort((a, b) => a - b);

  const plotData = sortedValues.map((val, i) => {
    const p = (i + 0.5) / n;
    const theoretical = inverseNormalCDF(p);
    return { observed: val, theoretical };
  });

  // Línea de referencia
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Gráfica de Probabilidad Normal</CardTitle>
            <p className="text-sm text-muted-foreground">
              {columnName} • n = {n}
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
            <XAxis dataKey="observed" label={{ value: "Valor Observado", position: "insideBottom" }} />
            <YAxis dataKey="theoretical" label={{ value: "Percentil Teórico", angle: -90, position: "insideLeft" }} />
            <Tooltip />
            <Line
              data={referenceLine}
              type="linear"
              dataKey="observed"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
            />
            <Scatter dataKey="observed" fill={isNormal ? "hsl(var(--chart-2))" : "hsl(var(--destructive))"} />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
