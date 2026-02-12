import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, User, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
  UserResponse,
} from '@/services/spcApi';

const Users = () => {
  const { toast } = useToast();
  const { canEdit } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null);
  const isAdmin = canEdit('users');

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    role: 'inspector' as string,
    password: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => fetchUsers(1, 100),
  });

  const users = data?.users ?? [];

  const resetForm = () => {
    setFormData({ full_name: '', phone: '', email: '', role: 'inspector', password: '' });
    setEditingUser(null);
  };

  const createMutation = useMutation({
    mutationFn: (d: typeof formData) =>
      createUser({
        email: d.email,
        password: d.password,
        full_name: d.full_name,
        phone: d.phone || undefined,
        role: d.role,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-list'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({ title: 'Usuario creado', description: 'El usuario se ha creado exitosamente' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data: d }: { id: string; data: Partial<typeof formData> }) =>
      updateUser(id, {
        full_name: d.full_name,
        phone: d.phone || undefined,
        role: d.role,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-list'] });
      setEditingUser(null);
      resetForm();
      toast({ title: 'Usuario actualizado', description: 'Los cambios se guardaron exitosamente' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-list'] });
      toast({ title: 'Usuario eliminado', description: 'El usuario ha sido eliminado exitosamente' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateUserStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-list'] });
      toast({ title: 'Estado actualizado' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleCreateUser = () => {
    if (!formData.full_name || !formData.email || !formData.password) {
      toast({ title: 'Error', description: 'Nombre, correo y contraseña son obligatorios', variant: 'destructive' });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleUpdateUser = () => {
    if (!editingUser) return;
    updateMutation.mutate({ id: editingUser.user_id, data: formData });
  };

  const startEditing = (user: UserResponse) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name,
      phone: user.phone ?? '',
      email: user.email,
      role: user.role ?? 'inspector',
      password: '',
    });
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default' as const;
      case 'supervisor': return 'secondary' as const;
      default: return 'outline' as const;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'supervisor': return 'Supervisor';
      case 'inspector': return 'Inspector';
      case 'operator': return 'Operador';
      default: return role;
    }
  };

  const adminCount = users.filter(u => u.role === 'admin').length;
  const supervisorCount = users.filter(u => u.role === 'supervisor').length;
  const inspectorCount = users.filter(u => u.role === 'inspector').length;
  const operatorCount = users.filter(u => u.role === 'operator').length;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
            <p className="text-muted-foreground">Administra los usuarios del sistema</p>
          </div>

          {isAdmin && (
            <Dialog open={isCreateDialogOpen} onOpenChange={(open) => { setIsCreateDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Crear Usuario
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                  <DialogDescription>Completa los datos del nuevo usuario</DialogDescription>
                </DialogHeader>
                <UserForm
                  formData={formData}
                  setFormData={setFormData}
                  onSubmit={handleCreateUser}
                  onCancel={() => setIsCreateDialogOpen(false)}
                  isLoading={createMutation.isPending}
                  submitLabel="Crear Usuario"
                  showPassword
                />
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <StatCard title="Total Usuarios" count={users.length} />
          <StatCard title="Administradores" count={adminCount} />
          <StatCard title="Supervisores" count={supervisorCount} />
          <StatCard title="Inspectores" count={inspectorCount} />
          <StatCard title="Operadores" count={operatorCount} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Usuarios</CardTitle>
            <CardDescription>Todos los usuarios registrados en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    {isAdmin && <TableHead>Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell>{user.phone ?? '-'}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {getRoleLabel(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {isAdmin ? (
                          <Switch
                            checked={user.is_active}
                            onCheckedChange={(checked) =>
                              statusMutation.mutate({ id: user.user_id, isActive: checked })
                            }
                            disabled={statusMutation.isPending}
                          />
                        ) : (
                          <Badge variant={user.is_active ? 'default' : 'destructive'}>
                            {user.is_active ? 'Activo' : 'Inactivo'}
                          </Badge>
                        )}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => startEditing(user)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteMutation.mutate(user.user_id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!editingUser} onOpenChange={(open) => { if (!open) { setEditingUser(null); resetForm(); } }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Usuario</DialogTitle>
              <DialogDescription>Modifica los datos del usuario</DialogDescription>
            </DialogHeader>
            <UserForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleUpdateUser}
              onCancel={() => { setEditingUser(null); resetForm(); }}
              isLoading={updateMutation.isPending}
              submitLabel="Guardar Cambios"
              showPassword={false}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

interface UserFormProps {
  formData: { full_name: string; phone: string; email: string; role: string; password: string };
  setFormData: (data: any) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isLoading: boolean;
  submitLabel: string;
  showPassword: boolean;
}

const UserForm = ({ formData, setFormData, onSubmit, onCancel, isLoading, submitLabel, showPassword }: UserFormProps) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="name">Nombre Completo</Label>
      <Input id="name" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} placeholder="Ej: Juan Pérez" />
    </div>
    <div className="space-y-2">
      <Label htmlFor="phone">Teléfono</Label>
      <Input id="phone" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Ej: +52 555 1234567" />
    </div>
    <div className="space-y-2">
      <Label htmlFor="email">Correo de la Empresa</Label>
      <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Ej: usuario@empresa.com" />
    </div>
    {showPassword && (
      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input id="password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Mínimo 6 caracteres" />
      </div>
    )}
    <div className="space-y-2">
      <Label htmlFor="role">Rol</Label>
      <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="supervisor">Supervisor</SelectItem>
          <SelectItem value="inspector">Inspector</SelectItem>
          <SelectItem value="operator">Operador</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div className="flex gap-2 pt-4">
      <Button onClick={onSubmit} className="flex-1" disabled={isLoading}>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        {submitLabel}
      </Button>
      <Button variant="outline" onClick={onCancel} className="flex-1">Cancelar</Button>
    </div>
  </div>
);

const StatCard = ({ title, count }: { title: string; count: number }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <User className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{count}</div>
    </CardContent>
  </Card>
);

export default Users;
