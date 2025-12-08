// src/pages/Dashboard.tsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format, subDays } from "date-fns";
import { es } from "date-fns/locale";

import { SPCChart } from "@/components/charts/SPCChart";
import { CapabilityHistogramChart } from "@/components/charts/CapabilityHistogramChart";
import { NormalProbabilityPlot } from "@/components/charts/NormalProbabilityPlot";
import { SChart } from "@/components/charts/SChart";

export default function Dashboard() {
  const [selectedMachine, setSelectedMachine] = useState("");
  const [selectedProcess, setSelectedProcess] = useState("");
  const [machines, setMachines] = useState<{ machine_id: string; cmm_name: string; line: string }[]>([]);
  const [processes, setProcesses] = useState<string[]>([]);
  const [spcData, setSpcData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ from: subDays(new Date(), 30), to: new Date() });

  // Cargar máquinas
  useEffect(() => {
    fetch("/api/machines")
      .then((r) => r.json())
      .then((data) => {
        setMachines(data);
        if (data.length > 0) setSelectedMachine(data[0].machine_id);
        setLoading(false);
      });
  }, []);

  // Cargar procesos cuando cambia máquina
  useEffect(() => {
    if (!selectedMachine) return;
    fetch(`/api/processes/${selectedMachine}`)
      .then((r) => r.json())
      .then((data) => {
        setProcesses(data);
        if (data.length > 0) setSelectedProcess(data[0]);
      });
  }, [selectedMachine]);

  // CARGAR TODOS LOS DATOS DEL BACKEND (¡YA NO HACE NADA EN FRONTEND!)
  useEffect(() => {
    if (!selectedMachine || !selectedProcess) {
      setSpcData(null);
      return;
    }

    const from = dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : "";
    const to = dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : "";

    fetch(`/api/spc/machine/${selectedMachine}?process=${selectedProcess}&from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.measurements && data.measurements.length > 0) {
          const measurement = data.measurements.find((m: any) => m.processNumber === selectedProcess);
          if (measurement) {
            setSpcData({
              stats: measurement,
              rawValues: measurement.allValues || [],
              subgroups: measurement.subgroups || [],
            });
          } else {
            setSpcData(null);
          }
        } else {
          setSpcData(null);
        }
      })
      .catch(console.error);
  }, [selectedMachine, selectedProcess, dateRange]);

  if (loading) return <div className="p-8 text-center">Cargando máquinas...</div>;

  const measurement = spcData?.stats;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard SPC - Planta</h1>
            <p className="text-muted-foreground">Sistema 100% Python + AIAG 2005</p>
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Selector de fechas */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-64 justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from && dateRange.to
                    ? `${format(dateRange.from, "dd/MM/yyyy", { locale: es })} - ${format(dateRange.to, "dd/MM/yyyy", { locale: es })}`
                    : "Seleccionar rango"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={(range: any) => setDateRange(range || { from: new Date(), to: new Date() })}
                  numberOfMonths={2}
                  locale={es}
                />
              </PopoverContent>
            </Popover>

            {/* Selector de máquina */}
            <Select value={selectedMachine} onValueChange={setSelectedMachine}>
              <SelectTrigger className="w-80">
                <SelectValue placeholder="Seleccionar máquina" />
              </SelectTrigger>
              <SelectContent>
                {machines.map((m) => (
                  <SelectItem key={m.machine_id} value={m.machine_id}>
                    {m.cmm_name} - {m.line}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Selector de proceso */}
        {processes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Proceso</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedProcess} onValueChange={setSelectedProcess}>
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {processes.map((p) => (
                    <SelectItem key={p} value={p}>
                      Proceso {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* GRÁFICAS - TODO VIENE DEL BACKEND */}
        {measurement ? (
          <>
            {/* Gráfica de Control */}
            <Card>
              <CardHeader>
                <CardTitle>Gráfica de Control Xbar-R</CardTitle>
                <CardDescription>
                  {measurement.columnName} • {measurement.item}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SPCChart
                  data={measurement.subgroups.map((s: any, i: number) => ({
                    point: i + 1,
                    value: s.average,
                    ucl: measurement.ucl,
                    lcl: measurement.lcl,
                    avg: measurement.avg,
                  }))}
                  stats={measurement}
                />
              </CardContent>
            </Card>

            {/* Histograma + Capacidad */}
            <Card>
              <CardHeader>
                <CardTitle>Histograma de Capacidad del Proceso</CardTitle>
              </CardHeader>
              <CardContent>
                <CapabilityHistogramChart
                  rawValues={measurement.allValues}
                  stats={{
                    avg: measurement.avg,
                    std: measurement.stdOverall,
                    ucl: measurement.ucl,
                    lcl: measurement.lcl,
                    upperSpecLimit: measurement.upperSpecLimit,
                    lowerSpecLimit: measurement.lowerSpecLimit,
                    nominal: measurement.nominal,
                    cp: measurement.cp,
                    cpk: measurement.cpk,
                    pp: measurement.pp,
                    ppk: measurement.ppk,
                    sampleCount: measurement.sampleCount,
                    outOfSpecCount: measurement.outOfSpecCount,
                  }}
                />
              </CardContent>
            </Card>

            {/* GRÁFICA DE PROBABILIDAD NORMAL - 100% DEL BACKEND */}
            <NormalProbabilityPlot measurement={measurement} />

            {/* Gráfica S (desviación estándar) */}
            {measurement.subgroups && measurement.subgroups.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Gráfica S (Desviación Estándar)</CardTitle>
                </CardHeader>
                <CardContent>
                  <SChart subgroups={measurement.subgroups} />
                </CardContent>
              </Card>
            )}

            {/* Resumen de indicadores */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Cp / Cpk</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {measurement.cp?.toFixed(2) ?? "-"} / {measurement.cpk?.toFixed(2) ?? "-"}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Pp / Ppk</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {measurement.pp?.toFixed(2) ?? "-"} / {measurement.ppk?.toFixed(2) ?? "-"}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Estado del Proceso</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant={measurement.status === "in_control" ? "default" : "destructive"} className="text-lg">
                    {measurement.status === "in_control" ? "En Control" : "Fuera de Control"}
                  </Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Muestras</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{measurement.sampleCount}</div>
                  <p className="text-xs text-muted-foreground">{measurement.outOfSpecCount} fuera de especificación</p>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            Selecciona una máquina y proceso para ver los datos SPC
          </div>
        )}
      </div>
    </div>
  );
}
