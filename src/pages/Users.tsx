import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/components/language-provider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
  UserResponse,
} from "@/services/spcApi";

const Users = () => {
  const { canEdit } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null);
  const isAdmin = canEdit("users");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationMeta, setPaginationMeta] = useState({
    total: 0,
    page: 1,
    page_size: 20,
    total_pages: 1,
  });

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    role: "inspector" as string,
    password: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["users-list", currentPage],
    queryFn: async () => {
      const response = await fetchUsers(currentPage, 20);
      // Save pagination metadata
      if (response.pagination) {
        setPaginationMeta(response.pagination);
      }
      return response;
    },
  });

  const users = data?.data ?? [];

  const resetForm = () => {
    setFormData({
      full_name: "",
      phone: "",
      email: "",
      role: "inspector",
      password: "",
    });
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
      queryClient.invalidateQueries({ queryKey: ["users-list"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success(t('user_created'), {
        description: t('success'),
      });
    },
    onError: (error: Error) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data: d,
    }: {
      id: string;
      data: Partial<typeof formData>;
    }) =>
      updateUser(id, {
        full_name: d.full_name,
        phone: d.phone || undefined,
        role: d.role,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-list"] });
      setEditingUser(null);
      resetForm();
      toast.success(t('user_updated'), {
        description: t('success'),
      });
    },
    onError: (error: Error) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-list"] });
      toast.success(t('user_deleted'), {
        description: t('success'),
      });
    },
    onError: (error: Error) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateUserStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-list"] });
      toast.success("Estado actualizado");
    },
    onError: (error: Error) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });

  const handleCreateUser = () => {
    if (!formData.full_name || !formData.email || !formData.password) {
      toast.error("Error", {
        description: "Nombre, correo y contraseña son obligatorios",
      });
      return;
    }

    const cleanedData = {
      ...formData,
      full_name: formData.full_name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.replace(/[\s-]/g, ''),
      password: formData.password.trim(),
    };

    createMutation.mutate(cleanedData);
  };

  const handleUpdateUser = () => {
    if (!editingUser) return;

    const cleanedData = {
      ...formData,
      full_name: formData.full_name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.replace(/[\s-]/g, ''),
    };

    updateMutation.mutate({ id: editingUser.user_id, data: cleanedData });
  };

  const startEditing = (user: UserResponse) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name,
      phone: user.phone ?? "",
      email: user.email,
      role: user.role ?? "inspector",
      password: "",
    });
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "default" as const;
      case "engineer":
        return "secondary" as const;
      default:
        return "outline" as const;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Admin";
      case "engineer":
        return "Engineer";
      case "inspector":
        return "Inspector";
      default:
        return role;
    }
  };

  const adminCount = users.filter((u) => u.role === "admin").length;
  const engineerCount = users.filter((u) => u.role === "engineer").length;
  const inspectorCount = users.filter((u) => u.role === "inspector").length;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t('users_title')}
            </h1>
            <p className="text-muted-foreground">
              {t('users_desc')}
            </p>
          </div>

          {isAdmin && (
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={(open) => {
                setIsCreateDialogOpen(open);
                if (!open) resetForm();
              }}
            >
              <DialogTrigger asChild>
                <Button className="gap-2 w-full sm:w-auto">
                  <Plus className="h-4 w-4" />
                  {t('create_user')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{t('create_user')}</DialogTitle>
                  <DialogDescription>
                    {t('users_desc')}
                  </DialogDescription>
                </DialogHeader>
                <UserForm
                  formData={formData}
                  setFormData={setFormData}
                  onSubmit={handleCreateUser}
                  onCancel={() => setIsCreateDialogOpen(false)}
                  isLoading={createMutation.isPending}
                  submitLabel={t('create')}
                  showPassword
                />
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard title={t('total_users')} count={users.length} />
          <StatCard title={t('admins')} count={adminCount} />
          <StatCard title={t('engineers')} count={engineerCount} />
          <StatCard title={t('inspectors')} count={inspectorCount} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('user_list')}</CardTitle>
            <CardDescription>
              {t('user_list_desc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('name')}</TableHead>
                      <TableHead>{t('phone')}</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>{t('role')}</TableHead>
                      <TableHead>{t('status')}</TableHead>
                      {isAdmin && <TableHead>{t('actions')}</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.user_id}>
                        <TableCell className="font-medium">
                          {user.full_name}
                        </TableCell>
                        <TableCell>{user.phone ?? "-"}</TableCell>
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
                                statusMutation.mutate({
                                  id: user.user_id,
                                  isActive: checked,
                                })
                              }
                              disabled={statusMutation.isPending}
                            />
                          ) : (
                            <Badge
                              variant={user.is_active ? "default" : "destructive"}
                            >
                              {user.is_active ? t('active') : t('inactive')}
                            </Badge>
                          )}
                        </TableCell>
                        {isAdmin && (
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startEditing(user)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  deleteMutation.mutate(user.user_id)
                                }
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
              </div>
            )}
          </CardContent>

          {/* Pagination Controls */}
          {paginationMeta.total_pages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t">
              <div className="text-sm text-muted-foreground text-center sm:text-left">
                {t('showing_items')
                  .replace('{items}', t('label_users'))
                  .replace('{start}', (((paginationMeta.page - 1) * paginationMeta.page_size) + 1).toString())
                  .replace('{end}', Math.min(paginationMeta.page * paginationMeta.page_size, paginationMeta.total).toString())
                  .replace('{total}', paginationMeta.total.toString())
                }
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={paginationMeta.page === 1 || isLoading}
                >
                  {t('previous')}
                </Button>
                <div className="text-sm">
                  {t('page_of')
                    .replace('{current}', paginationMeta.page.toString())
                    .replace('{total}', paginationMeta.total_pages.toString())}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(paginationMeta.total_pages, prev + 1))}
                  disabled={paginationMeta.page === paginationMeta.total_pages || isLoading}
                >
                  {t('next')}
                </Button>
              </div>
            </div>
          )}
        </Card>

        <Dialog
          open={!!editingUser}
          onOpenChange={(open) => {
            if (!open) {
              setEditingUser(null);
              resetForm();
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Usuario</DialogTitle>
              <DialogDescription>
                Modifica los datos del usuario
              </DialogDescription>
            </DialogHeader>
            <UserForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleUpdateUser}
              onCancel={() => {
                setEditingUser(null);
                resetForm();
              }}
              isLoading={updateMutation.isPending}
              submitLabel={t('save')}
              showPassword={false}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

interface UserFormProps {
  formData: {
    full_name: string;
    phone: string;
    email: string;
    role: string;
    password: string;
  };
  setFormData: (data: {
    full_name: string;
    phone: string;
    email: string;
    role: string;
    password: string;
  }) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isLoading: boolean;
  submitLabel: string;
  showPassword: boolean;
}

const UserForm = ({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  isLoading,
  submitLabel,
  showPassword,
}: UserFormProps) => {
  const { t } = useLanguage();
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">{t('full_name')}</Label>
        <Input
          id="name"
          value={formData.full_name}
          onChange={(e) =>
            setFormData({ ...formData, full_name: e.target.value })
          }
          placeholder="Ej: Juan Pérez"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">{t('phone')}</Label>
        <div className="flex gap-2">
          <Select
            defaultValue="+521"
            value={['+521', '+1', '+34', '+54', '+57', '+56', '+51'].find(c => formData.phone.startsWith(c)) || "+521"}
            onValueChange={(value) => {
              // Find current code to remove it correctly
              const currentCode = ['+521', '+1', '+34', '+54', '+57', '+56', '+51'].find(c => formData.phone.startsWith(c)) || "+521";
              const currentNumber = formData.phone.startsWith(currentCode)
                ? formData.phone.slice(currentCode.length)
                : formData.phone;
              setFormData({ ...formData, phone: `${value}${currentNumber}` });
            }}
          >
            <SelectTrigger className="w-[110px]">
              <SelectValue placeholder="Code" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="+521">🇲🇽 +521</SelectItem>
              <SelectItem value="+1">🇺🇸 +1</SelectItem>
              <SelectItem value="+34">🇪🇸 +34</SelectItem>
              <SelectItem value="+54">🇦🇷 +54</SelectItem>
              <SelectItem value="+57">🇨🇴 +57</SelectItem>
              <SelectItem value="+56">🇨🇱 +56</SelectItem>
              <SelectItem value="+51">🇵🇪 +51</SelectItem>
            </SelectContent>
          </Select>
          <Input
            id="phone"
            type="tel"
            value={(() => {
              const code = ['+521', '+1', '+34', '+54', '+57', '+56', '+51'].find(c => formData.phone.startsWith(c)) || "+521";
              return formData.phone.startsWith(code) ? formData.phone.slice(code.length) : formData.phone;
            })()}
            onChange={(e) => {
              const code = ['+521', '+1', '+34', '+54', '+57', '+56', '+51'].find(c => formData.phone.startsWith(c)) || "+521";
              // Remove spaces and hyphens from input immediately
              const cleanedValue = e.target.value.replace(/[\s-]/g, '');
              setFormData({ ...formData, phone: `${code}${cleanedValue}` });
            }}
            placeholder="555 1234567"
            className="flex-1"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">{t('company_email')}</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="Ej: usuario@empresa.com"
        />
      </div>
      {showPassword && (
        <div className="space-y-2">
          <Label htmlFor="password">{t('password')}</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            placeholder="Mínimo 8 caracteres"
          />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="role">{t('role')}</Label>
        <Select
          value={formData.role}
          onValueChange={(value) => setFormData({ ...formData, role: value })}
        >
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
        <Button variant="outline" onClick={onCancel} className="flex-1">
          {t('cancel')}
        </Button>
      </div>
    </div>
  )
};

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
