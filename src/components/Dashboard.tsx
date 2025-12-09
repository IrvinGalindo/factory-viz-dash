// src/components/Dashboard.tsx
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format, subDays } from "date-fns";
import { es } from "date-fns/locale";

import { useSPCData } from "@/hooks/useSPCData";
import { SPCChart } from "@/components/charts/SPCChart";
import { CapabilityHistogramChart } from "@/components/charts/CapabilityHistogramChart";
import { NormalProbabilityPlot } from "@/components/charts/NormalProbabilityPlot";
import { SChart } from "@/components/charts/SChart";

const API_BASE_URL = "https://spc-backend-nsa2.onrender.com";

export default function Dashboard() {
  const [selectedMachine, setSelectedMachine] = useState("");
  const [selectedProcess, setSelectedProcess] = useState("");
  const [machines, setMachines] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  // Cargar máquinas
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/machines`)
      .then(r => r.json())
      .then(data => {
        setMachines(data);
        if (data.length > 0) setSelectedMachine(data[0].machine_id);
      })
      .catch(console.error);
  }, []);

  // Cargar procesos
  useEffect(() => {
    if (selectedMachine) {
      fetch(`${API_BASE_URL}/api/processes/${selectedMachine}`)
        .then(r => r.json())
        .then(setProcesses)
        .catch(console.error);
    }
  }, [selectedMachine]);

  // Cargar datos SPC con rango de fechas
  const { data: spcData, loading } = useSPCData(
    selectedMachine,
    selectedProcess,
    dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
    dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : undefined
  );

  const measurement = spcData?.stats;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-2xl">Cargando datos SPC...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard SPC</h1>
            <p className="text-muted-foreground">Sistema Python + AIAG 2005 - Producción</p>
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Rango de fechas */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-64 justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(dateRange.from, "dd/MM/yyyy", { locale: es })} - {format(dateRange.to, "dd/MM/yyyy", { locale: es })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={(range: any) => setDateRange(range || dateRange)}
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
                {machines.map((m: any) => (
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
                  {processes.map((p: string) => (
                    <SelectItem key={p} value={p}>Proceso {p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* CONTENIDO PRINCIPAL */}
        {measurement ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Gráfica de Control Xbar-R</CardTitle>
                <CardDescription>{measurement.columnName} • {measurement.item}</CardDescription>
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

            <NormalProbabilityPlot values={measurement.allValues} measurementName={measurement.columnName} />

            <Card>
              <CardHeader>
                <CardTitle>Histograma de Capacidad</CardTitle>
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
                    withinSpecCount: measurement.sampleCount - measurement.outOfSpecCount,
                  }}
                />
              </CardContent>
            </Card>

            {measurement.subgroups.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Gráfica S (Desviación)</CardTitle>
                </CardHeader>
                <CardContent>
                  <SChart subgroups={measurement.subgroups} />
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Cp / Cpk</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold">{measurement.cp?.toFixed(2) ?? "-"} / {measurement.cpk?.toFixed(2) ?? "-"}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Pp / Ppk</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold">{measurement.pp?.toFixed(2) ?? "-"} / {measurement.ppk?.toFixed(2) ?? "-"}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Estado</CardTitle></CardHeader>
                <CardContent>
                  <Badge variant={measurement.status === "in_control" ? "default" : "destructive"}>
                    {measurement.status === "in_control" ? "En Control" : "Fuera de Control"}
                  </Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Muestras</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{measurement.sampleCount}</div>
                  <p className="text-xs text-muted-foreground">{measurement.outOfSpecCount} fuera de spec</p>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="text-center py-16">
              <p className="text-xl text-muted-foreground">
                Selecciona una máquina y proceso para ver los datos SPC
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
