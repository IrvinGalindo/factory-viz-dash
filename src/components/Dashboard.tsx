import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { generateMockData } from '@/data/mockData';
import { EfficiencyChart } from '@/components/charts/EfficiencyChart';
import { ProductionChart } from '@/components/charts/ProductionChart';
import { StatusChart } from '@/components/charts/StatusChart';
import { TemperatureChart } from '@/components/charts/TemperatureChart';
import { SPCChart } from '@/components/charts/SPCChart';
import { AlertCircle, CheckCircle, Clock, AlertTriangle, ChevronsUpDown, Check, CalendarIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

const Dashboard = () => {
  const [selectedMachine, setSelectedMachine] = useState('');
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProcess, setSelectedProcess] = useState('');
  const [processes, setProcesses] = useState([]);
  const [spcData, setSpcData] = useState(null);
  const [spcLoading, setSpcLoading] = useState(false);
  const [machineOpen, setMachineOpen] = useState(false);
  const [processOpen, setProcessOpen] = useState(false);
  
  // Date range states
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 7), // Default: last 7 days
    to: new Date()
  });
  const [dateOpen, setDateOpen] = useState(false);
  
  useEffect(() => {
    const fetchMachines = async () => {
      try {
        console.log('Iniciando conexión a Supabase...');
        
        // Verificar si supabase está definido
        if (!supabase) {
          throw new Error('Supabase client no está inicializado');
        }
        
        console.log('Cliente de Supabase:', supabase);
        
        // Hacer la consulta
        const { data, error } = await supabase
          .from('machines')
          .select('machine_name')
          .order('machine_name');
        
        console.log('Respuesta de Supabase:');
        console.log('Data:', data);
        console.log('Error:', error);
        
        if (error) {
          console.error('Error de Supabase:', error);
          setError(`Error de base de datos: ${error.message}`);
          return;
        }
        
        if (!data) {
          console.warn('No se recibieron datos de Supabase');
          setError('No se recibieron datos de la base de datos');
          return;
        }
        
        console.log(`Se encontraron ${data.length} máquinas`);
        setMachines(data);
        
        if (data.length > 0) {
          console.log('Seleccionando primera máquina:', data[0].machine_name);
          setSelectedMachine(data[0].machine_name);
        }
        
      } catch (error) {
        console.error('Error en fetchMachines:', error);
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
        setSelectedProcess('');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('processes')
          .select(`
            process_number,
            result_process!inner(
              machine_id,
              machines!inner(machine_name)
            )
          `)
          .eq('result_process.machines.machine_name', selectedMachine);

        if (error) {
          console.error('Error fetching processes:', error);
          return;
        }

        const uniqueProcesses = [...new Set(data?.map(p => p.process_number))].filter(Boolean);
        setProcesses(uniqueProcesses);
        
        if (uniqueProcesses.length > 0) {
          setSelectedProcess(uniqueProcesses[0]);
        }
      } catch (error) {
        console.error('Error in fetchProcesses:', error);
      }
    };

    fetchProcesses();
  }, [selectedMachine]);

  // Fetch SPC data when machine and process are selected
  useEffect(() => {
    const fetchSPCData = async () => {
      if (!selectedMachine || !selectedProcess) {
        setSpcData(null);
        return;
      }

      setSpcLoading(true);
      try {
        // Build the date filter
        const fromDate = dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : null;
        const toDate = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : null;

        // Query following the structure: processes -> result_process -> machines -> spc_statistics
        let query = supabase
          .from('processes')
          .select(`
            value,
            process_number,
            created_at,
            result_process!inner(
              result_process_id,
              date,
              machine_id,
              machines!inner(machine_name),
              spc_statistics!inner(
                id,
                measurement_name,
                spec,
                sample_count,
                ucl,
                lcl,
                avg,
                std,
                max,
                min,
                cp,
                cpk
              )
            )
          `)
          .eq('result_process.machines.machine_name', selectedMachine)
          .eq('process_number', selectedProcess.toString());

        // Apply date filters if they exist
        if (fromDate) {
          query = query.gte('result_process.date', fromDate);
        }
        if (toDate) {
          query = query.lte('result_process.date', toDate);
        }

        const { data: processData, error } = await query;

        if (error) {
          console.error('Error fetching process data:', error);
          setSpcData(null);
          return;
        }

         if (processData && processData.length > 0) {
          // Get SPC statistics using JOIN with processes table as requested
          const { data: spcStatsData, error: spcError } = await supabase
            .from('spc_statistics')
            .select(`
              id,
              measurement_name,
              spec,
              sample_count,
              ucl,
              lcl,
              avg,
              std,
              max,
              min,
              cp,
              cpk,
              processes!inner(process_number)
            `)
            .eq('processes.process_number', selectedProcess)
            .single();

          if (spcError || !spcStatsData) {
            console.log('No SPC statistics found for this process:', spcError);
            setSpcData(null);
            return;
          }

          const spcStats = spcStatsData;
          
          // Get machine_up and machine_low by querying all columns to see what's available
          const { data: rawSpcData } = await supabase
            .from('spc_statistics')
            .select('*')
            .eq('id', spcStats.id)
            .single();
          
          console.log('Raw SPC data:', rawSpcData); // Debug log
          
          const machineUp = Number((rawSpcData as any)?.machine_up) || 0;
          const machineLow = Number((rawSpcData as any)?.machine_low) || 0;

          // Collect all process values for the chart
          const values = processData
            .map(d => d.value)
            .filter(v => v !== null && v !== undefined);
          
          const chartData = values.map((value, index) => ({
            point: index + 1,
            value,
            ucl: Number(spcStats.ucl) || 0,
            lcl: Number(spcStats.lcl) || 0,
            avg: Number(spcStats.avg) || 0,
            spec: Number(spcStats.spec) || 0,
            min: Number(spcStats.min) || 0,
            max: Number(spcStats.max) || 0,
            date: processData[index]?.created_at ? format(new Date(processData[index].created_at), 'dd/MM/yyyy') : `Punto ${index + 1}`
          }));

          const spec = Number(spcStats.spec) || 0;
          
          // Calculate spec limits
          const specUpper = spec + machineUp;
          const specLower = spec + machineLow;
          
          const statisticsData = {
            spec: spec,
            specDisplay: `${spec} ${machineUp >= 0 ? '+' : ''}${machineUp.toFixed(3)}/${machineLow >= 0 ? '+' : ''}${machineLow.toFixed(3)}`,
            specUpper: specUpper,
            specLower: specLower,
            ucl: Number(spcStats.ucl) || 0,
            lcl: Number(spcStats.lcl) || 0,
            avg: Number(spcStats.avg) || 0,
            std: Number(spcStats.std) || 0,
            max: Number(spcStats.max) || 0,
            min: Number(spcStats.min) || 0,
            cp: Number(spcStats.cp) || 0,
            cpk: Number(spcStats.cpk) || 0,
            machineUp: machineUp,
            machineLow: machineLow
          };

          setSpcData({ data: chartData, stats: statisticsData });
        } else {
          setSpcData(null);
        }
      } catch (error) {
        console.error('Error in fetchSPCData:', error);
        setSpcData(null);
      } finally {
        setSpcLoading(false);
      }
    };

    fetchSPCData();
  }, [selectedMachine, selectedProcess, dateRange]);

  // Función para probar la conexión manualmente
  const testConnection = async () => {
    console.log('Probando conexión manual...');
    try {
      const { data, error } = await supabase
        .from('machines')
        .select('*')
        .limit(1);
      
      console.log('Prueba de conexión - Data:', data);
      console.log('Prueba de conexión - Error:', error);
    } catch (err) {
      console.error('Error en prueba de conexión:', err);
    }
  };
  
  const data = selectedMachine ? generateMockData(selectedMachine) : null;

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getPriorityVariant = (priority) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
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
                <h3 className="text-lg font-semibold">No se encontraron máquinas</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  No hay datos en la tabla 'machines' o no se pudo acceder a ella.
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
            <h1 className="text-3xl font-bold tracking-tight">Dashboard de Máquinas</h1>
            <p className="text-muted-foreground">
              Monitoreo en tiempo real del rendimiento de las máquinas 
              ({machines.length} máquinas encontradas)
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
                          {format(dateRange.from, "dd/MM/yyyy", { locale: es })} -{" "}
                          {format(dateRange.to, "dd/MM/yyyy", { locale: es })}
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
                            to: range.to || range.from
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
                            to: new Date()
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
                            to: new Date()
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
                          key={`${machine.machine_name}-${index}`}
                          value={machine.machine_name.toLowerCase()}
                          onSelect={() => {
                            setSelectedMachine(machine.machine_name);
                            setMachineOpen(false);
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              selectedMachine === machine.machine_name ? "opacity-100" : "opacity-0"
                            }`}
                          />
                          {machine.machine_name}
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
                          ({format(dateRange.from, "dd/MM/yyyy", { locale: es })} - {format(dateRange.to, "dd/MM/yyyy", { locale: es })})
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
                        >
                          {selectedProcess ? `Proceso ${selectedProcess}` : "Seleccionar proceso..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-60 p-0">
                        <Command>
                          <CommandInput placeholder="Buscar proceso..." />
                          <CommandEmpty>No se encontraron procesos.</CommandEmpty>
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
                                    selectedProcess === process ? "opacity-100" : "opacity-0"
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
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : processes.length === 0 ? (
                  <div className="flex items-center justify-center h-96 text-muted-foreground">
                    <div className="text-center">
                      <div className="text-lg font-medium mb-2">No hay procesos para esta máquina</div>
                      <div className="text-sm">La máquina seleccionada no tiene procesos disponibles</div>
                    </div>
                  </div>
                ) : spcData && spcData.data && spcData.stats ? (
                  <SPCChart data={spcData.data} stats={spcData.stats} />
                ) : (
                  <div className="flex items-center justify-center h-96 text-muted-foreground">
                    {selectedProcess ? 'No hay datos disponibles para este proceso' : 'Selecciona un proceso para ver el gráfico SPC'}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Charts Grid */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Eficiencia por Hora</CardTitle>
                  <CardDescription>Porcentaje de eficiencia a lo largo del día</CardDescription>
                </CardHeader>
                <CardContent>
                  <EfficiencyChart data={data.efficiency} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Producción vs Objetivo</CardTitle>
                  <CardDescription>Comparación mensual de producción</CardDescription>
                </CardHeader>
                <CardContent>
                  <ProductionChart data={data.production} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Estado de la Máquina</CardTitle>
                  <CardDescription>Distribución del tiempo operativo</CardDescription>
                </CardHeader>
                <CardContent>
                  <StatusChart data={data.status} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Temperatura</CardTitle>
                  <CardDescription>Monitoreo térmico durante el día</CardDescription>
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
                  Sugerencias basadas en el análisis de datos de la máquina: {selectedMachine}
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
                          <h3 className="font-semibold">{recommendation.title}</h3>
                          <Badge variant={getPriorityVariant(recommendation.priority)}>
                            {recommendation.priority === 'high' ? 'Alta' : 
                             recommendation.priority === 'medium' ? 'Media' : 'Baja'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{recommendation.description}</p>
                        <p className="text-sm font-medium text-primary">{recommendation.action}</p>
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