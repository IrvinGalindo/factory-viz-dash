import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Settings, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  fetchMachines as apiFetchMachines,
  createMachine as apiCreateMachine,
  updateMachine as apiUpdateMachine,
  deleteMachine as apiDeleteMachine,
  Machine,
} from '@/services/spcApi';

const Machines = () => {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    cmm_name: '',
    line: '',
    process: ''
  });

  useEffect(() => {
    fetchMachines();
  }, []);

  const fetchMachines = async () => {
    try {
      setLoading(true);
      const data = await apiFetchMachines();
      setMachines(data || []);
    } catch (error) {
      console.error('Error fetching machines:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las máquinas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMachine = async () => {
    if (!formData.cmm_name || !formData.line || !formData.process) {
      toast({
        title: "Error",
        description: "Todos los campos son obligatorios",
        variant: "destructive"
      });
      return;
    }

    try {
      const newMachine = await apiCreateMachine({
        cmm_name: formData.cmm_name,
        line: formData.line,
        process: formData.process
      });

      setMachines([newMachine, ...machines]);
      setFormData({ cmm_name: '', line: '', process: '' });
      setIsCreateDialogOpen(false);

      toast({
        title: "Máquina creada",
        description: `Se ha creado la máquina ${formData.cmm_name} exitosamente`
      });
    } catch (error) {
      console.error('Error creating machine:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la máquina",
        variant: "destructive"
      });
    }
  };

  const handleEditMachine = async () => {
    if (!editingMachine || !formData.cmm_name || !formData.line || !formData.process) {
      toast({
        title: "Error",
        description: "Todos los campos son obligatorios",
        variant: "destructive"
      });
      return;
    }

    try {
      const updatedMachine = await apiUpdateMachine(editingMachine.machine_id, {
        cmm_name: formData.cmm_name,
        line: formData.line,
        process: formData.process
      });

      setMachines(machines.map(machine => 
        machine.machine_id === editingMachine.machine_id ? updatedMachine : machine
      ));
      
      setFormData({ cmm_name: '', line: '', process: '' });
      setEditingMachine(null);
      setIsEditDialogOpen(false);

      toast({
        title: "Máquina actualizada",
        description: "La máquina se ha actualizado exitosamente"
      });
    } catch (error) {
      console.error('Error updating machine:', error);
      toast({
        title: "Error", 
        description: "No se pudo actualizar la máquina",
        variant: "destructive"
      });
    }
  };

  const handleDeleteMachine = async (machineId: string) => {
    try {
      await apiDeleteMachine(machineId);
      setMachines(machines.filter(machine => machine.machine_id !== machineId));
      toast({
        title: "Máquina eliminada",
        description: "La máquina ha sido eliminada exitosamente"
      });
    } catch (error) {
      console.error('Error deleting machine:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la máquina",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (machine: Machine) => {
    setEditingMachine(machine);
    setFormData({
      cmm_name: machine.cmm_name || '',
      line: machine.line || '',
      process: machine.process || ''
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ cmm_name: '', line: '', process: '' });
    setEditingMachine(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando máquinas...</p>
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
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Máquinas</h1>
            <p className="text-muted-foreground">Administra las máquinas del sistema</p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={resetForm}>
                <Plus className="h-4 w-4" />
                Crear Máquina
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Crear Nueva Máquina</DialogTitle>
                <DialogDescription>
                  Completa los datos de la nueva máquina
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cmm_name">CMM *</Label>
                  <Input
                    id="cmm_name"
                    value={formData.cmm_name}
                    onChange={(e) => setFormData({ ...formData, cmm_name: e.target.value })}
                    placeholder="Ej: CMM-001"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="line">Línea *</Label>
                  <Input
                    id="line"
                    value={formData.line}
                    onChange={(e) => setFormData({ ...formData, line: e.target.value })}
                    placeholder="Ej: LINE-A"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="process">Proceso *</Label>
                  <Input
                    id="process"
                    value={formData.process}
                    onChange={(e) => setFormData({ ...formData, process: e.target.value })}
                    placeholder="Ej: Ensamblaje"
                    required
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleCreateMachine} className="flex-1">
                    Crear Máquina
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      resetForm();
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Máquina</DialogTitle>
              <DialogDescription>
                Modifica los datos de la máquina
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit_cmm_name">CMM *</Label>
                <Input
                  id="edit_cmm_name"
                  value={formData.cmm_name}
                  onChange={(e) => setFormData({ ...formData, cmm_name: e.target.value })}
                  placeholder="Ej: CMM-001"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_line">Línea *</Label>
                <Input
                  id="edit_line"
                  value={formData.line}
                  onChange={(e) => setFormData({ ...formData, line: e.target.value })}
                  placeholder="Ej: LINE-A"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_process">Proceso *</Label>
                <Input
                  id="edit_process"
                  value={formData.process}
                  onChange={(e) => setFormData({ ...formData, process: e.target.value })}
                  placeholder="Ej: Ensamblaje"
                  required
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleEditMachine} className="flex-1">
                  Actualizar
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    resetForm();
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Máquinas</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{machines.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Con Línea</CardTitle>
              <QrCode className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {machines.filter(m => m.line).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Con Proceso</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {machines.filter(m => m.process).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Machines Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Máquinas</CardTitle>
            <CardDescription>Todas las máquinas registradas en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {machines.length === 0 ? (
              <div className="text-center py-8">
                <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-muted-foreground">No hay máquinas registradas</p>
                <p className="text-muted-foreground">Crea la primera máquina para comenzar</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>CMM</TableHead>
                    <TableHead>Línea</TableHead>
                    <TableHead>Proceso</TableHead>
                    <TableHead>Fecha de Creación</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {machines.map((machine) => (
                    <TableRow key={machine.machine_id}>
                      <TableCell className="font-medium">
                        {machine.cmm_name || 'Sin nombre'}
                      </TableCell>
                      <TableCell>
                        {machine.line || '-'}
                      </TableCell>
                      <TableCell>
                        {machine.process || '-'}
                      </TableCell>
                      <TableCell>
                        {new Date(machine.created_at).toLocaleDateString('es-MX')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openEditDialog(machine)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteMachine(machine.machine_id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Machines;
