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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { generateMockData } from "@/data/mockData";
import { CapabilityHistogramChart } from "@/components/charts/CapabilityHistogramChart";
import { ProductionChart } from "@/components/charts/ProductionChart";
import { StatusChart } from "@/components/charts/StatusChart";
import { TemperatureChart } from "@/components/charts/TemperatureChart";
import { SPCChart } from "@/components/charts/SPCChart";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  AlertTriangle,
  ChevronsUpDown,
  Check,
  CalendarIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";
import { es } from "date-fns/locale";

const Dashboard = () => {
  const [selectedMachine, setSelectedMachine] = useState("");
  const [machines, setMachines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProcess, setSelectedProcess] = useState("");
  const [processes, setProcesses] = useState([]);
  const [spcData, setSpcData] = useState<any>(null);
  const [spcLoading, setSpcLoading] = useState(false);
  const [machineOpen, setMachineOpen] = useState(false);
  const [processOpen, setProcessOpen] = useState(false);

  // Date range states
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 7), // Default: last 7 days
    to: new Date(),
  });
  const [dateOpen, setDateOpen] = useState(false);

  useEffect(() => {
    const fetchMachines = async () => {
      try {
        console.log("🚀 Iniciando conexión a Supabase...");

        // Verificar si supabase está definido
        if (!supabase) {
          throw new Error("Supabase client no está inicializado");
        }

        console.log("Cliente de Supabase:", supabase);

        // Hacer la consulta
        const { data, error } = (await supabase
          .from("machines")
          .select("cmm_name, line")
          .order("line")) as any;

        console.log("📊 Respuesta de Supabase:");
        console.log("Data:", data);
        console.log("Error:", error);

        if (error) {
          console.error("❌ Error de Supabase:", error);
          setError(`Error de base de datos: ${error.message}`);
          return;
        }

        if (!data) {
          console.warn("⚠️ No se recibieron datos de Supabase");
          setError("No se recibieron datos de la base de datos");
          return;
        }

        console.log(`✅ Se encontraron ${data.length} máquinas`);
        setMachines(data);

        if (data.length > 0) {
          console.log("🎯 Seleccionando primera máquina:", data[0].line);
          setSelectedMachine(data[0].line);
        }
      } catch (error) {
        console.error("💥 Error en fetchMachines:", error);
        setError(`Error de conexión: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchMachines();
  }, []);

  // Fetch processes when machine is selected
  useEffect(() => {
    const fetchProcesses = async () => {
      if (!selectedMachine) {
        setProcesses([]);
        setSelectedProcess("");
        return;
      }

      try {
        console.log("🔍 Buscando procesos para máquina:", selectedMachine);

        const { data, error } = (await supabase
          .from("processes")
          .select(
            `
            measurements,
            result_process!inner(
              machine_id,
              machines!inner(line)
            )
          `
          )
          .eq("result_process.machines.line", selectedMachine)) as any;

        if (error) {
          console.error("❌ Error fetching processes:", error);
          return;
        }

        // Extraer números de proceso únicos del JSONB measurements
        const processNumbers = new Set<string>();
        data?.forEach((row: any) => {
          if (row.measurements && Array.isArray(row.measurements)) {
            row.measurements.forEach((measurement: any) => {
              if (measurement.processNumber) {
                processNumbers.add(measurement.processNumber.toString());
              }
            });
          }
        });

        const uniqueProcesses = Array.from(processNumbers).sort();
        console.log("📋 Procesos encontrados:", uniqueProcesses);

        setProcesses(uniqueProcesses as any);

        if (uniqueProcesses.length > 0) {
          console.log("🎯 Seleccionando primer proceso:", uniqueProcesses[0]);
          setSelectedProcess(uniqueProcesses[0] as string);
        }
      } catch (error) {
        console.error("💥 Error in fetchProcesses:", error);
      }
    };

    fetchProcesses();
  }, [selectedMachine]);

  // 🚀 FIXED: Fetch SPC data when machine and process are selected
  useEffect(() => {
    const fetchSPCData = async () => {
      if (!selectedMachine || !selectedProcess) {
        setSpcData(null);
        return;
      }

      setSpcLoading(true);
      try {
        // Build the date filter - use date-only format for inclusive range
        const fromDate = dateRange.from
          ? format(dateRange.from, "yyyy-MM-dd")
          : null;
        // For toDate, use the next day at 00:00:00 to include all records from the selected day
        const toDate = dateRange.to
          ? format(new Date(dateRange.to.getTime() + 86400000), "yyyy-MM-dd")
          : null;

        console.log("🎯 Buscando datos SPC para:", {
          machine: selectedMachine,
          process: selectedProcess,
          dateRange: { fromDate, toDate },
        });

        // PASO 1: Obtener datos de procesos desde el JSONB measurements
        let processQuery = supabase
          .from("processes")
          .select(
            `
            process_id,
            result_process_id,
            measurements,
            created_at,
            result_process!inner(
              result_process_id,
              date,
              machine_id,
              machines!inner(line)
            )
          `
          )
          .eq("result_process.machines.line", selectedMachine);

        // Apply date filters if they exist
        if (fromDate) {
          processQuery = processQuery.gte("result_process.date", fromDate);
        }
        if (toDate) {
          // Use lt (less than) instead of lte since we added one day
          processQuery = processQuery.lt("result_process.date", toDate);
        }

        const { data: processData, error: processError } =
          (await processQuery) as any;

        if (processError) {
          console.error("❌ Error fetching process data:", processError);
          setSpcData(null);
          return;
        }

        if (!processData || processData.length === 0) {
          console.log("⚠️ No process data found for:", {
            selectedMachine,
            selectedProcess,
          });
          setSpcData(null);
          return;
        }

        // Extraer valores del proceso específico desde measurements JSONB
        const processValues: Array<{
          value: number;
          created_at: string;
          result_process_id: string;
        }> = [];

        processData.forEach((row: any) => {
          if (row.measurements && Array.isArray(row.measurements)) {
            row.measurements.forEach((measurement: any) => {
              if (
                measurement.processNumber?.toString() ===
                  selectedProcess.toString() &&
                measurement.value != null
              ) {
                processValues.push({
                  value: Number(measurement.value),
                  created_at: row.created_at,
                  result_process_id: row.result_process_id,
                });
              }
            });
          }
        });

        if (processValues.length === 0) {
          console.log("⚠️ No values found for process:", selectedProcess);
          setSpcData(null);
          return;
        }

        console.log(
          "✅ Process values extracted:",
          processValues.length,
          "records"
        );

        // PASO 2: Obtener estadísticas desde spc_statistics
        // Primero obtenemos el machine_id de la máquina seleccionada
        const { data: machineData, error: machineError } = await supabase
          .from("machines")
          .select("machine_id")
          .eq("line", selectedMachine)
          .maybeSingle();

        if (machineError) {
          console.error("❌ Error fetching machine_id:", machineError);
          setSpcData(null);
          return;
        }

        if (!machineData) {
          console.error("❌ Machine not found");
          setSpcData(null);
          return;
        }

        // Obtener todos los result_process_ids que coinciden con el rango de fechas
        const { data: resultProcessIds, error: rpError } = await supabase
          .from("result_process")
          .select("result_process_id")
          .eq("machine_id", machineData.machine_id)
          .gte("date", fromDate || "1970-01-01")
          .lt("date", toDate || "2100-01-01");

        if (rpError) {
          console.error("❌ Error fetching result_process IDs:", rpError);
        }

        // Obtener estadísticas SPC de la tabla filtradas por result_process_ids
        let spcStatsData = null;
        let spcStatsError = null;

        if (resultProcessIds && resultProcessIds.length > 0) {
          const ids = resultProcessIds.map(rp => rp.result_process_id);
          
          const { data, error } = await supabase
            .from("spc_statistics")
            .select("stats, result_process_id")
            .eq(
              "measurement_name",
              `machine_${machineData.machine_id}_all_measurements`
            )
            .in("result_process_id", ids)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          spcStatsData = data;
          spcStatsError = error;
        }

        if (spcStatsError) {
          console.error("❌ Error fetching SPC stats:", spcStatsError);
        }

        // Buscar las estadísticas para el proceso específico
        let spcStats = null;
        if (spcStatsData?.stats) {
          const statsObj = spcStatsData.stats as any;
          if (statsObj?.measurements) {
            spcStats = statsObj.measurements.find(
              (m: any) =>
                m.processNumber?.toString() === selectedProcess.toString()
            );
          }
        }

        console.log("📊 SPC Stats from DB:", spcStats);

        // Usar estadísticas de la BD o valores por defecto
        const avg = spcStats?.avg || 0;
        const std = spcStats?.std || 0;
        const ucl = spcStats?.ucl || 0;
        const lcl = spcStats?.lcl || 0;
        const max = spcStats?.max || 0;
        const min = spcStats?.min || 0;
        const cp = spcStats?.cp || 0;
        const cpk = spcStats?.cpk || 0;
        const pp = spcStats?.pp;
        const ppk = spcStats?.ppk;
        const stdWithin = spcStats?.stdWithin;
        const stdOverall = spcStats?.stdOverall;
        const outOfSpecCount = spcStats?.outOfSpecCount || 0;
        const status = spcStats?.status || "unknown";
        const sampleCount = spcStats?.sampleCount || processValues.length;

        // PASO 3: Obtener spec limits de la tabla SPC o measurements
        let nominal = spcStats?.nominal || 0;
        let upperTol = spcStats?.upperTolerance || 0;
        let lowerTol = spcStats?.lowerTolerance || 0;
        let upperSpecLimit = spcStats?.upperSpecLimit || 0;
        let lowerSpecLimit = spcStats?.lowerSpecLimit || 0;

        // Si no hay stats en BD, obtener de measurements
        if (!spcStats) {
          processData.forEach((row: any) => {
            if (row.measurements && Array.isArray(row.measurements)) {
              const measurement = row.measurements.find(
                (m: any) =>
                  m.processNumber?.toString() === selectedProcess.toString()
              );
              if (measurement && !nominal) {
                nominal = Number(measurement.nominal) || 0;
                upperTol = Number(measurement.upTol) || 0;
                lowerTol = Number(measurement.lowTol) || 0;
                upperSpecLimit = Number(measurement.upperSpecLimit) || 0;
                lowerSpecLimit = Number(measurement.lowerSpecLimit) || 0;
              }
            }
          });
        }

        console.log("📏 Spec values:", {
          nominal,
          upperTol,
          lowerTol,
          upperSpecLimit,
          lowerSpecLimit,
        });

        // Use spec limits directly from the data
        const specUpper = upperSpecLimit;
        const specLower = lowerSpecLimit;

        console.log("📊 Stats from DB:", {
          avg,
          std,
          ucl,
          lcl,
          min,
          max,
          cp,
          cpk,
        });

        // PASO 4: Crear los datos para el chart
        const chartData = processValues.map((item, index) => ({
          point: index + 1,
          value: item.value,
          ucl: ucl,
          lcl: lcl,
          avg: avg,
          spec: nominal,
          min: min,
          max: max,
          specUpper: specUpper,
          specLower: specLower,
          date: item.created_at
            ? format(new Date(item.created_at), "dd/MM/yyyy HH:mm")
            : `Punto ${index + 1}`,
          result_process_id: item.result_process_id,
        }));

        // Map status from DB to display text
        const statusDisplay =
          status === "in_control"
            ? "Conforme"
            : status === "out_of_control"
            ? "Fuera de Control"
            : status === "warning"
            ? "Advertencia"
            : status === "insufficient_data"
            ? "Datos Insuficientes"
            : "Desconocido";

        const statisticsData = {
          spec: nominal,
          specDisplay: `${nominal} ${upperTol.toFixed(3)}/${lowerTol.toFixed(
            3
          )}`,
          specUpper: specUpper,
          specLower: specLower,
          ucl: ucl,
          lcl: lcl,
          avg: avg,
          std: std,
          stdWithin: stdWithin,
          stdOverall: stdOverall,
          max: max,
          min: min,
          cp: cp,
          cpk: cpk,
          pp: pp,
          ppk: ppk,
          machineUp: upperTol,
          machineLow: lowerTol,
          sampleCount: sampleCount,
          measurementName: `Proceso ${selectedProcess}`,
          outOfSpecCount: outOfSpecCount,
          status: statusDisplay,
        };

        console.log("🎊 Final chart data:", chartData.length, "points");
        console.log("📊 Final statistics:", statisticsData);

        setSpcData({ 
          data: chartData, 
          stats: statisticsData,
          rawValues: processValues.map(pv => pv.value)
        });
      } catch (error) {
        console.error("💥 Error in fetchSPCData:", error);
        setSpcData(null);
      } finally {
        setSpcLoading(false);
      }
    };

    fetchSPCData();
  }, [selectedMachine, selectedProcess, dateRange]);

  // Función para probar la conexión manualmente
  const testConnection = async () => {
    console.log("🧪 Probando conexión manual...");
    try {
      const { data, error } = await supabase
        .from("machines")
        .select("*")
        .limit(1);

      console.log("✅ Prueba de conexión - Data:", data);
      console.log("Error:", error);
    } catch (err) {
      console.error("💥 Error en prueba de conexión:", err);
    }
  };

  const data = selectedMachine ? generateMockData(selectedMachine) : null;

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "high":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case "medium":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "low":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getPriorityVariant = (priority) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando máquinas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">Error de conexión</h3>
                <p className="text-sm text-muted-foreground mt-2">{error}</p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Reintentar
              </button>
              <button
                onClick={testConnection}
                className="ml-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
              >
                Probar Conexión
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (machines.length === 0) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">
                  No se encontraron máquinas
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  No hay datos en la tabla 'machines' o no se pudo acceder a
                  ella.
                </p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Reintentar
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Dashboard de Máquinas
            </h1>
            <p className="text-muted-foreground">
              Monitoreo en tiempo real del rendimiento de las máquinas (
              {machines.length} máquinas encontradas)
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Date Range Picker */}
            <div className="w-80">
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "dd/MM/yyyy", { locale: es })}{" "}
                          - {format(dateRange.to, "dd/MM/yyyy", { locale: es })}
                        </>
                      ) : (
                        format(dateRange.from, "dd/MM/yyyy", { locale: es })
                      )
                    ) : (
                      <span>Seleccionar fechas...</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-3">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange.from}
                      selected={dateRange}
                      onSelect={(range) => {
                        if (range?.from) {
                          setDateRange({
                            from: range.from,
                            to: range.to || range.from,
                          });
                        }
                      }}
                      numberOfMonths={2}
                      locale={es}
                    />
                    <div className="flex justify-between gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDateRange({
                            from: subDays(new Date(), 7),
                            to: new Date(),
                          });
                        }}
                      >
                        Últimos 7 días
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDateRange({
                            from: subDays(new Date(), 30),
                            to: new Date(),
                          });
                        }}
                      >
                        Últimos 30 días
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDateOpen(false);
                        }}
                      >
                        Aplicar
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Machine Selector */}
            <div className="w-80">
              <Popover open={machineOpen} onOpenChange={setMachineOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={machineOpen}
                    className="w-full justify-between"
                  >
                    {selectedMachine || "Seleccionar máquina..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0">
                  <Command>
                    <CommandInput placeholder="Buscar máquina..." />
                    <CommandEmpty>No se encontraron máquinas.</CommandEmpty>
                    <CommandGroup>
                      {machines.map((machine, index) => (
                        <CommandItem
                          key={`${machine.line}-${index}`}
                          value={machine.line.toLowerCase()}
                          onSelect={() => {
                            setSelectedMachine(machine.line);
                            setMachineOpen(false);
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              selectedMachine === machine.line
                                ? "opacity-100"
                                : "opacity-0"
                            }`}
                          />
                          {machine.line}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Solo mostrar charts si hay una máquina seleccionada */}
        {selectedMachine && data && (
          <>
            {/* SPC Control Chart Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Control Estadístico de Procesos (SPC)</CardTitle>
                    <CardDescription>
                      Gráfico de control para la máquina: {selectedMachine}
                      {dateRange.from && dateRange.to && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (
                          {format(dateRange.from, "dd/MM/yyyy", { locale: es })}{" "}
                          - {format(dateRange.to, "dd/MM/yyyy", { locale: es })}
                          )
                        </span>
                      )}
                      {spcData?.stats?.measurementName && (
                        <span className="ml-2 text-xs text-blue-600">
                          | Medición: {spcData.stats.measurementName}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="w-60">
                    <Popover open={processOpen} onOpenChange={setProcessOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={processOpen}
                          className="w-full justify-between"
                          disabled={processes.length === 0}
                        >
                          {selectedProcess
                            ? `Proceso ${selectedProcess}`
                            : processes.length === 0
                            ? "Cargando procesos..."
                            : "Seleccionar proceso..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-60 p-0">
                        <Command>
                          <CommandInput placeholder="Buscar proceso..." />
                          <CommandEmpty>
                            No se encontraron procesos.
                          </CommandEmpty>
                          <CommandGroup>
                            {processes.map((process) => (
                              <CommandItem
                                key={process}
                                value={`proceso ${process}`.toLowerCase()}
                                onSelect={() => {
                                  setSelectedProcess(process);
                                  setProcessOpen(false);
                                }}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    selectedProcess === process
                                      ? "opacity-100"
                                      : "opacity-0"
                                  }`}
                                />
                                Proceso {process}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {spcLoading ? (
                  <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">
                        Cargando datos SPC...
                      </p>
                    </div>
                  </div>
                ) : processes.length === 0 ? (
                  <div className="flex items-center justify-center h-96 text-muted-foreground">
                    <div className="text-center">
                      <div className="text-lg font-medium mb-2">
                        No hay procesos para esta máquina
                      </div>
                      <div className="text-sm">
                        La máquina seleccionada no tiene procesos disponibles
                      </div>
                    </div>
                  </div>
                ) : spcData && spcData.data && spcData.stats ? (
                  <div className="space-y-4">
                    <SPCChart data={spcData.data} stats={spcData.stats} />
                    {/* Info adicional */}
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div className="bg-muted/50 p-2 rounded">
                        <div className="font-semibold">Puntos de datos:</div>
                        <div>{spcData.stats.sampleCount}</div>
                      </div>
                      <div className="bg-muted/50 p-2 rounded">
                        <div className="font-semibold">Fuera de Spec:</div>
                        <div>{spcData.stats.outOfSpecCount}</div>
                      </div>
                      <div className="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded">
                        <div className="font-semibold text-yellow-800 dark:text-yellow-200">
                          No Conformes:
                        </div>
                        <div className="text-yellow-900 dark:text-yellow-100">
                          {spcData.stats.outOfSpecCount}/
                          {spcData.stats.sampleCount} (
                          {(
                            (spcData.stats.outOfSpecCount /
                              spcData.stats.sampleCount) *
                            100
                          ).toFixed(1)}
                          %)
                        </div>
                      </div>
                      <div
                        className={`p-2 rounded ${
                          spcData.stats.status === "Conforme"
                            ? "bg-green-100 dark:bg-green-900/30"
                            : "bg-red-100 dark:bg-red-900/30"
                        }`}
                      >
                        <div
                          className={`font-semibold ${
                            spcData.stats.status === "Conforme"
                              ? "text-green-800 dark:text-green-200"
                              : "text-red-800 dark:text-red-200"
                          }`}
                        >
                          Estado:
                        </div>
                        <div
                          className={
                            spcData.stats.status === "Conforme"
                              ? "text-green-900 dark:text-green-100"
                              : "text-red-900 dark:text-red-100"
                          }
                        >
                          {spcData.stats.status}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-96 text-muted-foreground">
                    <div className="text-center">
                      <div className="text-lg font-medium mb-2">
                        {selectedProcess
                          ? "No hay datos SPC disponibles"
                          : "Selecciona un proceso"}
                      </div>
                      <div className="text-sm">
                        {selectedProcess
                          ? "No se encontraron estadísticas SPC para este proceso en el rango de fechas seleccionado"
                          : "Selecciona un proceso para ver el gráfico SPC"}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Charts Grid */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Capability Histogram Chart - Full Width */}
              {spcData && selectedProcess ? (
                <div className="md:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Histograma de Capacidad - Proceso {selectedProcess}</CardTitle>
                      <CardDescription>
                        Distribución de mediciones con límites de especificación y control
                        <br />
                        <span className="text-xs text-muted-foreground">
                          Período: {format(dateRange.from, "dd/MM/yyyy", { locale: es })} - {format(dateRange.to, "dd/MM/yyyy", { locale: es })}
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <CapabilityHistogramChart 
                        rawValues={spcData.rawValues}
                        stats={{
                          cp: spcData.stats.cp,
                          cpk: spcData.stats.cpk,
                          pp: spcData.stats.pp,
                          ppk: spcData.stats.ppk,
                          avg: spcData.stats.avg,
                          std: spcData.stats.std,
                          stdWithin: spcData.stats.stdWithin,
                          stdOverall: spcData.stats.stdOverall,
                          ucl: spcData.stats.ucl,
                          lcl: spcData.stats.lcl,
                          upperSpecLimit: spcData.stats.specUpper,
                          lowerSpecLimit: spcData.stats.specLower,
                          nominal: spcData.stats.spec,
                          sampleCount: spcData.stats.sampleCount,
                          withinSpecCount: spcData.stats.sampleCount - spcData.stats.outOfSpecCount,
                          outOfSpecCount: spcData.stats.outOfSpecCount,
                        }}
                      />
                    </CardContent>
                  </Card>
                </div>
              ) : selectedProcess ? (
                <div className="md:col-span-2">
                  <Card>
                    <CardContent className="flex items-center justify-center h-64">
                      <div className="text-center text-muted-foreground">
                        <div className="text-lg font-medium mb-2">No hay datos disponibles</div>
                        <div className="text-sm">
                          No se encontraron mediciones para el proceso {selectedProcess} en el rango de fechas seleccionado
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : null}

              <Card>
                <CardHeader>
                  <CardTitle>Producción vs Objetivo</CardTitle>
                  <CardDescription>
                    Comparación mensual de producción
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProductionChart data={data.production} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Estado de la Máquina</CardTitle>
                  <CardDescription>
                    Distribución del tiempo operativo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <StatusChart data={data.status} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Temperatura</CardTitle>
                  <CardDescription>
                    Monitoreo térmico durante el día
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TemperatureChart data={data.temperature} />
                </CardContent>
              </Card>
            </div>

            {/* Recommendations Section */}
            <Card>
              <CardHeader>
                <CardTitle>Recomendaciones</CardTitle>
                <CardDescription>
                  Sugerencias basadas en el análisis de datos de la máquina:{" "}
                  {selectedMachine}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.recommendations.map((recommendation) => (
                    <div
                      key={recommendation.id}
                      className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="mt-0.5">
                        {getPriorityIcon(recommendation.priority)}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">
                            {recommendation.title}
                          </h3>
                          <Badge
                            variant={getPriorityVariant(
                              recommendation.priority
                            )}
                          >
                            {recommendation.priority === "high"
                              ? "Alta"
                              : recommendation.priority === "medium"
                              ? "Media"
                              : "Baja"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {recommendation.description}
                        </p>
                        <p className="text-sm font-medium text-primary">
                          {recommendation.action}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
