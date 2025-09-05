import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { generateMockData } from '@/data/mockData';
import { EfficiencyChart } from '@/components/charts/EfficiencyChart';
import { ProductionChart } from '@/components/charts/ProductionChart';
import { StatusChart } from '@/components/charts/StatusChart';
import { TemperatureChart } from '@/components/charts/TemperatureChart';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  const [selectedMachine, setSelectedMachine] = useState('');
  const [machines, setMachines] = useState<{ machine_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const { data, error } = await supabase
          .from('machines')
          .select('machine_name')
          .order('machine_name');
        console.log(error)
        if (error) {
          console.error('Error fetching machines:', error);
          return;
        }
        
        setMachines(data || []);
        if (data && data.length > 0) {
          setSelectedMachine(data[0].machine_name);
          
        }
      } catch (error) {
        console.error('Error fetching machines:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMachines();
  }, []);
  
  const data = generateMockData(selectedMachine);

  const getPriorityIcon = (priority: string) => {
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

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive' as const;
      case 'medium':
        return 'secondary' as const;
      case 'low':
        return 'outline' as const;
      default:
        return 'outline' as const;
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

  if (machines.length === 0) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">No se encontraron máquinas</p>
        </div>
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
            <p className="text-muted-foreground">Monitoreo en tiempo real del rendimiento de las máquinas</p>
          </div>
          
          <div className="w-80">
            <Select value={selectedMachine} onValueChange={setSelectedMachine}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar máquina" />
              </SelectTrigger>
              <SelectContent>
                {machines.map((machine) => (
                  <SelectItem key={machine.machine_name} value={machine.machine_name}>
                    {machine.machine_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

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
            <CardDescription>Sugerencias basadas en el análisis de datos de la máquina seleccionada</CardDescription>
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
      </div>
    </div>
  );
};

export default Dashboard;