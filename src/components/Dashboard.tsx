import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { SPCChart } from "@/components/charts/SPCChart";
import { SChart } from "@/components/charts/SChart";
import { NormalProbabilityPlot } from "@/components/charts/NormalProbabilityPlot";
import { AlertCircle, AlertTriangle, ChevronsUpDown, Check, CalendarIcon } from "lucide-react";
import { format, subDays } from "date-fns";
import { es } from "date-fns/locale";
import {
  fetchSPCMachines,
  fetchProcessNumbers,
  fetchSPCChartData,
  SPCApiResponse,
} from "@/services/spcApi";
import { useLanguage } from '@/components/language-provider';
import { logger } from "@/utils/logger";

const Dashboard = () => {
  const { t } = useLanguage();
  const [selectedMachineId, setSelectedMachineId] = useState("");
  const [selectedMachineLine, setSelectedMachineLine] = useState("");
  const [machines, setMachines] = useState<Array<{ machine_id: string; line: string; cmm_name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProcess, setSelectedProcess] = useState("");
  const [processes, setProcesses] = useState<string[]>([]);
  const [spcData, setSpcData] = useState<{
    data: Array<{
      point: number;
      value: number;
      ucl: number;
      lcl: number;
      avg: number;
      spec: number;
      min: number;
      max: number;
      specUpper: number;
      specLower: number;
      date: string;
    }>;
    stats: {
      spec: number;
      specDisplay: string;
      specUpper: number;
      specLower: number;
      ucl: number;
      lcl: number;
      avg: number;
      std: number;
      stdWithin: number;
      stdOverall: number;
      max: number;
      min: number;
      cp: number;
      cpk: number;
      pp: number;
      ppk: number;
      sampleCount: number;
      measurementName: string;
      outOfSpecCount: number;
      outOfControlCount: number;
      status: string;
      rBar: number;
      d2: number;
      machineUp: number;
      machineLow: number;
    };
    rawValues: number[];
    subgroups: Array<{
      subgroupNumber: number;
      values: number[];
      average: number;
      range: number;
      size: number;
    }> | null;
    processInfo: { processNumber: string; item: string };
  } | null>(null);
  const [spcLoading, setSpcLoading] = useState(false);
  const [machineOpen, setMachineOpen] = useState(false);
  const [processOpen, setProcessOpen] = useState(false);

  // Date range states
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [dateOpen, setDateOpen] = useState(false);


  // Fetch machines from API
  useEffect(() => {
    const loadMachines = async () => {
      try {
        logger.debug("🚀 Conectando al backend API...");
        const data = await fetchSPCMachines();
        logger.info(`✅ Se encontraron ${data.length} máquinas`);
        setMachines(data);

        if (data.length > 0) {
          logger.debug("🎯 Seleccionando primera máquina:", { id: data[0].machine_id, line: data[0].line });
          setSelectedMachineId(data[0].machine_id);
          setSelectedMachineLine(data[0].line);
        }
      } catch (err: any) {
        logger.error("💥 Error en loadMachines:", err);
        setError(`Error de conexión: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadMachines();
  }, []);

  // Fetch processes when machine is selected
  useEffect(() => {
    const loadProcesses = async () => {
      if (!selectedMachineId) {
        setProcesses([]);
        setSelectedProcess("");
        return;
      }

      try {
        logger.debug("🔍 Buscando procesos para máquina:", selectedMachineId);
        const processNumbers = await fetchProcessNumbers(selectedMachineId);
        logger.debug("📋 Procesos encontrados:", processNumbers);

        setProcesses(processNumbers);

        if (processNumbers.length > 0) {
          logger.debug("🎯 Seleccionando primer proceso:", processNumbers[0]);
          setSelectedProcess(processNumbers[0]);
        }
      } catch (err) {
        logger.error("💥 Error in loadProcesses:", err);
        toast.error("Error al cargar procesos");
        setProcesses([]);
      }
    };

    loadProcesses();
  }, [selectedMachineId]);

  // Fetch SPC data when machine and process are selected
  useEffect(() => {
    const loadSPCData = async () => {
      if (!selectedMachineId || !selectedProcess) {
        setSpcData(null);
        return;
      }

      setSpcLoading(true);
      try {
        const fromDate = dateRange.from
          ? format(dateRange.from, "dd/MM/yyyy")
          : undefined;
        const toDate = dateRange.to
          ? format(dateRange.to, "dd/MM/yyyy")
          : undefined;

        logger.debug("🎯 Buscando datos SPC para:", {
          machineId: selectedMachineId,
          machineLine: selectedMachineLine,
          process: selectedProcess,
          dateRange: { fromDate, toDate },
        });

        const apiData = await fetchSPCChartData(
          selectedMachineId,
          selectedProcess,
          fromDate,
          toDate
        );

        if (!apiData || !apiData.data || !apiData.data.measurements || apiData.data.measurements.length === 0) {
          logger.warn("⚠️ No hay datos SPC disponibles");
          setSpcData(null);
          return;
        }

        // Get values and measurements from the API (values at root level)
        const rawValues = apiData.data.values || [];
        const measurement = apiData.data.measurements[0];

        // Create chart data using actual values from the API
        const chartData = rawValues.map((value, index) => ({
          point: index + 1,
          value: value,
          ucl: measurement.ucl,
          lcl: measurement.lcl,
          avg: measurement.avg,
          spec: measurement.nominal,
          min: measurement.min,
          max: measurement.max,
          specUpper: measurement.upperSpecLimit,
          specLower: measurement.lowerSpecLimit,
          date: `Punto ${index + 1}`,
        }));

        logger.debug(`📊 Raw values from API: ${rawValues.length} values`);

        const statusDisplay =
          measurement.status === "in_control"
            ? "Conforme"
            : measurement.status === "out_of_control"
              ? "Fuera de Control"
              : measurement.status === "warning"
                ? "Advertencia"
                : measurement.status === "insufficient_data"
                  ? "Datos Insuficientes"
                  : "Desconocido";

        const statisticsData = {
          spec: measurement.nominal,
          specDisplay: `${measurement.nominal}`,
          specUpper: measurement.upperSpecLimit,
          specLower: measurement.lowerSpecLimit,
          ucl: measurement.ucl,
          lcl: measurement.lcl,
          avg: measurement.avg,
          std: measurement.stdWithin,
          stdWithin: measurement.stdWithin,
          stdOverall: measurement.stdOverall,
          max: measurement.max,
          min: measurement.min,
          cp: measurement.cp,
          cpk: measurement.cpk,
          pp: measurement.pp,
          ppk: measurement.ppk,
          sampleCount: measurement.sampleCount,
          measurementName: `${measurement.item} - ${measurement.columnName}`,
          outOfSpecCount: measurement.outOfSpecCount,
          outOfControlCount: measurement.outOfControlCount,
          status: statusDisplay,
          rBar: measurement.rBar,
          d2: measurement.d2,
          machineUp: measurement.upperTolerance,
          machineLow: measurement.lowerTolerance,
        };

        logger.debug(`🎊 Final chart data: ${chartData.length} points`);
        logger.debug("📊 Final statistics:", statisticsData);

        setSpcData({
          data: chartData,
          stats: statisticsData,
          rawValues: rawValues,
          subgroups: measurement.subgroups || null,
          processInfo: {
            processNumber: selectedProcess,
            item: measurement.item || "",
          },
        });
      } catch (err) {
        logger.error("💥 Error in loadSPCData:", err);
        toast.error("Error al cargar datos SPC");
        setSpcData(null);
      } finally {
        setSpcLoading(false);
      }
    };

    loadSPCData();
  }, [selectedMachineId, selectedProcess, dateRange]);

  const data = selectedMachineId ? generateMockData(selectedMachineLine) : null;



  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('loading')}</p>
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
                  {t('no_machines')}
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {t('no_machines_found')}
                </p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                {t('retry')}
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t('dashboard_title')}
            </h1>
            <p className="text-muted-foreground">
              {t('dashboard_desc')} (
              {machines.length} {t('machines_found')})
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            {/* Date Range Picker */}
            <div className="w-full sm:w-80">
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
                      <span>{t('select_dates')}</span>
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
                        {t('last_7_days')}
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
                        {t('last_30_days')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDateOpen(false);
                        }}
                      >
                        {t('apply')}
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Machine Selector */}
            <div className="w-full sm:w-80">
              <Popover open={machineOpen} onOpenChange={setMachineOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={machineOpen}
                    className="w-full justify-between"
                  >
                    {selectedMachineLine || t('select_machine')}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[calc(100vw-3rem)] sm:w-80 p-0">
                  <Command>
                    <CommandInput placeholder={t('search_machine')} />
                    <CommandEmpty>{t('no_machines_found')}</CommandEmpty>
                    <CommandGroup>
                      {machines.map((machine, index) => (
                        <CommandItem
                          key={`${machine.machine_id}-${index}`}
                          value={machine.line.toLowerCase()}
                          onSelect={() => {
                            setSelectedMachineId(machine.machine_id);
                            setSelectedMachineLine(machine.line);
                            setMachineOpen(false);
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${selectedMachineId === machine.machine_id
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
        {selectedMachineId && data && (
          <>

            {/* SPC Control Chart Section */}
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle>{t('spc_title')}</CardTitle>
                    <CardDescription>
                      {t('spc_desc')}: {selectedMachineLine}
                      {dateRange.from && dateRange.to && (
                        <span className="block sm:inline sm:ml-2 text-xs text-muted-foreground">
                          (
                          {format(dateRange.from, "dd/MM/yyyy", { locale: es })}{" "}
                          - {format(dateRange.to, "dd/MM/yyyy", { locale: es })}
                          )
                        </span>
                      )}
                      {spcData?.stats?.measurementName && (
                        <span className="block sm:inline sm:ml-2 text-xs text-blue-600">
                          | {t('measurement')}: {spcData.stats.measurementName}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="w-full sm:w-60">
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
                            ? `${t('process')} ${selectedProcess}`
                            : processes.length === 0
                              ? t('loading')
                              : t('select_process')}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[calc(100vw-5rem)] sm:w-60 p-0">
                        <Command>
                          <CommandInput placeholder={t('search_process')} />
                          <CommandEmpty>
                            {t('no_process_selected')}
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
                                  className={`mr-2 h-4 w-4 ${selectedProcess === process
                                    ? "opacity-100"
                                    : "opacity-0"
                                    }`}
                                />
                                {t('process')} {process}
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
                        {t('loading_spc')}
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
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div className="bg-muted/50 p-3 rounded">
                        <div className="font-semibold">{t('data_points')}:</div>
                        <div className="text-lg">{spcData.data.length}</div>
                      </div>
                      <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded">
                        <div className="font-semibold text-yellow-800 dark:text-yellow-200">
                          {t('non_conformant')}:
                        </div>
                        <div className="text-yellow-900 dark:text-yellow-100">
                          {spcData.stats.outOfSpecCount}/{spcData.data.length} (
                          {spcData.data.length > 0
                            ? (
                              (spcData.stats.outOfSpecCount /
                                spcData.data.length) *
                              100
                            ).toFixed(1)
                            : "0.0"}
                          %)
                        </div>
                      </div>
                      <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded">
                        <div className="font-semibold text-green-800 dark:text-green-200">
                          {t('within_spec')}
                        </div>
                        <div className="text-green-900 dark:text-green-100">
                          {spcData.data.length > 0
                            ? (
                              ((spcData.data.length -
                                spcData.stats.outOfSpecCount) /
                                spcData.data.length) *
                              100
                            ).toFixed(1)
                            : "0.0"}
                          %
                        </div>
                        <div className="text-xs text-green-800 dark:text-green-200 mt-1">
                          {spcData.data.length - spcData.stats.outOfSpecCount}{" "}
                          de {spcData.data.length}
                        </div>
                      </div>
                      <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded">
                        <div className="font-semibold text-red-800 dark:text-red-200">
                          {t('out_of_spec')}
                        </div>
                        <div className="text-red-900 dark:text-red-100">
                          {spcData.data.length > 0
                            ? (
                              (spcData.stats.outOfSpecCount /
                                spcData.data.length) *
                              100
                            ).toFixed(1)
                            : "0.0"}
                          %
                        </div>
                        <div className="text-xs text-red-800 dark:text-red-200 mt-1">
                          {spcData.stats.outOfSpecCount} de {spcData.data.length}
                        </div>
                      </div>
                      <div
                        className={`p-3 rounded ${spcData.stats.status === "Conforme"
                          ? "bg-green-100 dark:bg-green-900/30"
                          : "bg-red-100 dark:bg-red-900/30"
                          }`}
                      >
                        <div
                          className={`font-semibold ${spcData.stats.status === "Conforme"
                            ? "text-green-800 dark:text-green-200"
                            : "text-red-800 dark:text-red-200"
                            }`}
                        >
                          {t('status')}:
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
                          ? t('no_spc_data')
                          : t('no_process_selected')}
                      </div>
                      <div className="text-sm">
                        {selectedProcess
                          ? t('no_spc_data')
                          : t('no_process_selected')}
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
                      <CardTitle>
                        {t('capability_histogram')} - {t('process')} {selectedProcess}
                      </CardTitle>
                      <CardDescription>
                        {t('distribution_desc')}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {t('period')}:{" "}
                          {format(dateRange.from, "dd/MM/yyyy", { locale: es })}{" "}
                          -{" "}
                          {format(dateRange.to, "dd/MM/yyyy", { locale: es })}
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
                          withinSpecCount:
                            spcData.stats.sampleCount -
                            spcData.stats.outOfSpecCount,
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
                        <div className="text-lg font-medium mb-2">
                          No hay datos disponibles
                        </div>
                        <div className="text-sm">
                          No se encontraron mediciones para el proceso{" "}
                          {selectedProcess} en el rango de fechas seleccionado
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : null}

              {/* S Chart - Control de Variabilidad */}
              {spcData &&
                selectedProcess &&
                spcData.subgroups &&
                spcData.subgroups.length > 0 ? (
                <div className="md:col-span-2">
                  <SChart
                    subgroups={spcData.subgroups}
                    processName={`Proceso ${selectedProcess}`}
                    item={spcData.processInfo?.item}
                  />
                </div>
              ) : null}

              {/* Normal Probability Plot */}
              {spcData &&
                selectedProcess &&
                spcData.rawValues &&
                spcData.rawValues.length > 0 ? (
                <div className="md:col-span-2">
                  <NormalProbabilityPlot
                    values={spcData.rawValues}
                    measurementName={`Proceso ${selectedProcess}`}
                  />
                </div>
              ) : null}

            </div>


          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
