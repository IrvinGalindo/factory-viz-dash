import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, User, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth, AppRole } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ProfileWithRole {
  id: string;
  inspector_name: string;
  emp_id: string | null;
  phone: string | null;
  email: string | null;
  role: string;
  active: boolean | null;
  created_at: string | null;
  app_role?: string;
}

const Users = () => {
  const { toast } = useToast();
  const { canEdit } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ProfileWithRole | null>(null);
  const isAdmin = canEdit('users');

  const [formData, setFormData] = useState({
    inspector_name: '',
    emp_id: '',
    phone: '',
    email: '',
    role: 'inspector' as string,
    password: '',
  });

  // Fetch profiles with roles
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['profiles-with-roles'],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from('profile')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      // Map roles by email match (user_roles uses auth.uid, profile uses its own id)
      // We need to get auth users to map
      const rolesMap = new Map(roles?.map(r => [r.user_id, r.role]) ?? []);

      return (profiles ?? []).map(p => ({
        ...p,
        app_role: rolesMap.get(p.id) ?? p.role,
      })) as ProfileWithRole[];
    },
  });

  const resetForm = () => {
    setFormData({ inspector_name: '', emp_id: '', phone: '', email: '', role: 'inspector', password: '' });
    setEditingUser(null);
  };

  // Create user mutation - uses edge function to skip email verification
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: response, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: data.email,
          password: data.password,
          inspector_name: data.inspector_name,
          emp_id: data.emp_id || null,
          phone: data.phone || null,
          role: data.role,
        },
      });
      if (error) throw error;
      if (response?.error) throw new Error(response.error);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles-with-roles'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({ title: 'Usuario creado', description: 'El usuario se ha creado exitosamente' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Update user mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const { error: profileError } = await supabase
        .from('profile')
        .update({
          inspector_name: data.inspector_name,
          emp_id: data.emp_id || null,
          phone: data.phone || null,
          email: data.email,
          role: data.role,
        })
        .eq('id', id);
      if (profileError) throw profileError;

      // Update role
      const { error: deleteRoleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', id);
      if (deleteRoleError) throw deleteRoleError;

      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: id, role: data.role as AppRole });
      if (roleError) throw roleError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles-with-roles'] });
      setEditingUser(null);
      resetForm();
      toast({ title: 'Usuario actualizado', description: 'Los cambios se guardaron exitosamente' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Delete user mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('profile').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles-with-roles'] });
      toast({ title: 'Usuario eliminado', description: 'El usuario ha sido eliminado exitosamente' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleCreateUser = () => {
    if (!formData.inspector_name || !formData.email || !formData.password) {
      toast({ title: 'Error', description: 'Nombre, correo y contraseña son obligatorios', variant: 'destructive' });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleUpdateUser = () => {
    if (!editingUser) return;
    updateMutation.mutate({ id: editingUser.id, data: formData });
  };

  const startEditing = (user: ProfileWithRole) => {
    setEditingUser(user);
    setFormData({
      inspector_name: user.inspector_name,
      emp_id: user.emp_id ?? '',
      phone: user.phone ?? '',
      email: user.email ?? '',
      role: user.app_role ?? 'inspector',
      password: '',
    });
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default' as const;
      case 'engineer': return 'secondary' as const;
      default: return 'outline' as const;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'engineer': return 'Engineer';
      case 'inspector': return 'Inspector';
      default: return role;
    }
  };

  const adminCount = users.filter(u => u.app_role === 'admin').length;
  const engineerCount = users.filter(u => u.app_role === 'engineer').length;
  const inspectorCount = users.filter(u => u.app_role === 'inspector').length;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
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

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard title="Total Usuarios" count={users.length} />
          <StatCard title="Administradores" count={adminCount} />
          <StatCard title="Ingenieros" count={engineerCount} />
          <StatCard title="Inspectores" count={inspectorCount} />
        </div>

        {/* Users Table */}
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
                    <TableHead>No. Empleado</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    {isAdmin && <TableHead>Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.inspector_name}</TableCell>
                      <TableCell>{user.emp_id ?? '-'}</TableCell>
                      <TableCell>{user.phone ?? '-'}</TableCell>
                      <TableCell>{user.email ?? '-'}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.app_role ?? '')}>
                          {getRoleLabel(user.app_role ?? '')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.active ? 'default' : 'destructive'}>
                          {user.active ? 'Activo' : 'Inactivo'}
                        </Badge>
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
                              onClick={() => deleteMutation.mutate(user.id)}
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

        {/* Edit Dialog */}
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

// Extracted form component
interface UserFormProps {
  formData: { inspector_name: string; emp_id: string; phone: string; email: string; role: string; password: string };
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
      <Input id="name" value={formData.inspector_name} onChange={(e) => setFormData({ ...formData, inspector_name: e.target.value })} placeholder="Ej: Juan Pérez" />
    </div>
    <div className="space-y-2">
      <Label htmlFor="emp_id">Número de Empleado</Label>
      <Input id="emp_id" value={formData.emp_id} onChange={(e) => setFormData({ ...formData, emp_id: e.target.value })} placeholder="Ej: EMP001" />
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
          <SelectItem value="engineer">Engineer</SelectItem>
          <SelectItem value="inspector">Inspector</SelectItem>
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

// Extracted stat card
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
