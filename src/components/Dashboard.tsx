// src/pages/Dashboard.tsx
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

import { SPCChart } from "@/components/charts/SPCChart";
import { CapabilityHistogramChart } from "@/components/charts/CapabilityHistogramChart";
import { NormalProbabilityPlot } from "@/components/charts/NormalProbabilityPlot";
import { SChart } from "@/components/charts/SChart";

// Tipos para que TypeScript esté feliz
interface Machine {
 machine_id: string;
 cmm_name: string;
 line: string;
}

interface Measurement {
 processNumber: string;
 item: string;
 columnName: string;
 avg: number;
 stdWithin: number;
 stdOverall: number;
 cp?: number;
 cpk?: number;
 pp?: number;
 ppk?: number;
 lcl: number;
 ucl: number;
 rBar: number;
 d2: number;
 min: number;
 max: number;
 sampleCount: number;
 outOfSpecCount: number;
 outOfControlCount: number;
 status: string;
 nominal?: number;
 lowerTolerance?: number;
 upperTolerance?: number;
 lowerSpecLimit?: number;
 upperSpecLimit?: number;
 subgroups: Array<{
   subgroupNumber: number;
   values: number[];
   average: number;
   range: number;
   size: number;
 }>;
 allValues: number[];
 normalityTest?: {
   ad: number;
   pValue: number;
   isNormal: boolean;
 };
}

export default function Dashboard() {
 const [selectedMachine, setSelectedMachine] = useState<string>("");
 const [selectedProcess, setSelectedProcess] = useState<string>("");
 const [machines, setMachines] = useState<Machine[]>([]);
 const [processes, setProcesses] = useState<string[]>([]);
 const [measurement, setMeasurement] = useState<Measurement | null>(null);
 const [loading, setLoading] = useState(true);

 const [dateRange] = useState({
   from: subDays(new Date(), 30),
   to: new Date(),
 });

 // Cargar máquinas
 useEffect(() => {
   fetch("/api/machines")
     .then(r => r.json())
     .then(data => {
       setMachines(data);
       if (data.length > 0) setSelectedMachine(data[0].machine_id);
       setLoading(false);
     })
     .catch(() => setLoading(false));
 }, []);

 // Cargar procesos
 useEffect(() => {
   if (!selectedMachine) return;
   fetch(`/api/processes/${selectedMachine}`)
     .then(r => r.json())
     .then(data => {
       setProcesses(data);
       if (data.length > 0) setSelectedProcess(data[0]);
     });
 }, [selectedMachine]);

 // Cargar datos SPC del backend
 useEffect(() => {
   if (!selectedMachine || !selectedProcess) {
     setMeasurement(null);
     return;
   }

   fetch(`/api/spc/machine/${selectedMachine}?process=${selectedProcess}`)
     .then(r => r.json())
     .then(data => {
       if (data.measurements && data.measurements.length > 0) {
         const found = data.measurements.find(
           (m: any) => m.processNumber === selectedProcess
         );
         setMeasurement(found || null);
       } else {
         setMeasurement(null);
       }
     })
     .catch(err => {
       console.error(err);
       setMeasurement(null);
     });
 }, [selectedMachine, selectedProcess]);

 if (loading) {
   return (
     <div className="flex items-center justify-center min-h-screen">
       <p className="text-xl mx-auto">Cargando sistema SPC...</p>
     </div>
   );
 }

 return (
   <div className="min-h-screen bg-background p-6">
     <div className="mx-auto max-w-7xl space-y-6">
       {/* Header */}
       <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
         <div>
           <h1 className="text-3xl font-bold tracking-tight">Dashboard SPC - Planta</h1>
           <p className="text-muted-foreground">Sistema 100% Python + AIAG 2005 - Versión Final</p>
         </div>

         <div className="flex flex-wrap gap-3">
           <Popover>
             <PopoverTrigger asChild>
               <Button variant="outline" className="w-64 justify-start">
                 <CalendarIcon className="mr-2 h-4 w-4" />
                 {format(dateRange.from, "dd/MM/yyyy", { locale: es })} -{" "}
                 {format(dateRange.to, "dd/MM/yyyy", { locale: es })}
               </Button>
             </PopoverTrigger>
             <PopoverContent className="w-auto p-0">
               <Calendar mode="range" selected={dateRange} numberOfMonths={2} locale={es} />
             </PopoverContent>
           </Popover>

           <Select value={selectedMachine} onValueChange={setSelectedMachine}>
             <SelectTrigger className="w-80">
               <SelectValue placeholder="Seleccionar máquina" />
             </SelectTrigger>
             <SelectContent>
               {machines.map(m => (
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
                 {processes.map(p => (
                   <SelectItem key={p} value={p}>
                     Proceso {p}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </CardContent>
         </Card>
       )}

       {/* SI HAY DATOS → MOSTRAR TODO */}
       {measurement ? (
         <>
           <Card>
             <CardHeader>
               <CardTitle>Gráfica de Control Xbar-R</CardTitle>
               <CardDescription>
                 {measurement.columnName} • {measurement.item}
               </CardDescription>
             </CardHeader>
             <CardContent>
               <SPCChart
                 data={measurement.subgroups.map((s, i) => ({
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
                   upperSpecLimit: measurement.upperSpecLimit ?? undefined,
                   lowerSpecLimit: measurement.lowerSpecLimit ?? undefined,
                   nominal: measurement.nominal ?? undefined,
                   cp: measurement.cp ?? undefined,
                   cpk: measurement.cpk ?? undefined,
                   pp: measurement.pp ?? undefined,
                   ppk: measurement.ppk ?? undefined,
                   sampleCount: measurement.sampleCount,
                   outOfSpecCount: measurement.outOfSpecCount,
                   // Añadimos el que faltaba
                   withinSpecCount: measurement.sampleCount - measurement.outOfSpecCount,
                 }}
               />
             </CardContent>
           </Card>

           <NormalProbabilityPlot measurement={measurement} />

           {measurement.subgroups.length > 0 && (
             <Card>
               <CardHeader>
                 <CardTitle>Gráfica S (Desviación Estándar)</CardTitle>
               </CardHeader>
               <CardContent>
                 <SChart subgroups={measurement.subgroups} />
               </CardContent>
             </Card>
           )}

           {/* Indicadores rápidos */}
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <Card>
               <