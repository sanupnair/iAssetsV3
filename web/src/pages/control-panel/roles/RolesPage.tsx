import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, IconButton, Tooltip, Typography,
  TextField, MenuItem, Grid, Switch,
} from '@mui/material';
import { Pencil, Trash2, ToggleLeft, ToggleRight, ShieldCheck } from 'lucide-react';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

import PageHeader    from '@/components/common/PageHeader';
import DataTable     from '@/components/common/DataTable';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import FormDrawer    from '@/components/common/FormDrawer';
import { rolesApi }         from '@/api/endpoints/roles';
import { organizationsApi } from '@/api/endpoints/organizations';
import { useDebounce } from '@/hooks/useDebounce';
import type { Role } from '@/types';

// ── Schema ────────────────────────────────────────────────────
const roleSchema = z.object({
  orgId:          z.string().uuid('Select an organization'),
  name:           z.string().min(2, 'Name is required'),
  code:           z.string().max(20).optional(),
  description:    z.string().optional(),
  color:          z.string().optional(),
  level:          z.coerce.number().int().min(0).max(99).optional(),
  canApprove:     z.boolean().default(false),
  canManageUsers: z.boolean().default(false),
  isDefault:      z.boolean().default(false),
});
type RoleForm = z.infer<typeof roleSchema>;

const ROLE_COLORS = [
  { label: 'Teal',   value: '#01696f' },
  { label: 'Green',  value: '#437a22' },
  { label: 'Blue',   value: '#006494' },
  { label: 'Purple', value: '#7a39bb' },
  { label: 'Orange', value: '#da7101' },
  { label: 'Red',    value: '#a12c7b' },
  { label: 'Gray',   value: '#6b6966' },
];

// ── Page ──────────────────────────────────────────────────────
export default function RolesPage() {
  const qc = useQueryClient();

  const [page,   setPage]   = useState(1);
  const [limit,  setLimit]  = useState(20);
  const [search, setSearch] = useState('');
  const debouncedSearch     = useDebounce(search);

  const [drawerOpen,    setDrawerOpen]    = useState(false);
  const [editingRole,   setEditingRole]   = useState<Role | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Role | null>(null);
  const [confirmToggle, setConfirmToggle] = useState<Role | null>(null);

  const {
    register, handleSubmit, reset, control,
    formState: { errors },
  } = useForm<RoleForm>({
    resolver: zodResolver(roleSchema) as Resolver<RoleForm>,
    defaultValues: { canApprove: false, canManageUsers: false, isDefault: false },
  });

  // ── Queries
  const { data, isLoading } = useQuery({
    queryKey: ['roles', page, limit, debouncedSearch],
    queryFn:  () => rolesApi.list({ page, limit, search: debouncedSearch }),
  });

  const { data: orgsData } = useQuery({
    queryKey: ['organizations-all'],
    queryFn:  () => organizationsApi.list({ page: 1, limit: 100 }),
  });

  const orgOptions = orgsData?.data ?? [];

  // ── Mutations
  const createMutation = useMutation({
    mutationFn: rolesApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['roles'] }); toast.success('Role created'); closeDrawer(); },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e?.response?.data?.message ?? 'Failed to create'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RoleForm> }) => rolesApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['roles'] }); toast.success('Role updated'); closeDrawer(); },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e?.response?.data?.message ?? 'Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: rolesApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['roles'] }); toast.success('Role deleted'); setConfirmDelete(null); },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e?.response?.data?.message ?? 'Failed to delete'),
  });

  const toggleMutation = useMutation({
    mutationFn: rolesApi.toggleStatus,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['roles'] }); toast.success('Status updated'); setConfirmToggle(null); },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e?.response?.data?.message ?? 'Failed to update status'),
  });

  // ── Drawer helpers
  const openCreate = () => {
    setEditingRole(null);
    reset({ canApprove: false, canManageUsers: false, isDefault: false });
    setDrawerOpen(true);
  };

  const openEdit = (role: Role) => {
    setEditingRole(role);
    reset({
      orgId:          role.orgId,
      name:           role.name,
      code:           role.code        ?? undefined,
      description:    role.description ?? undefined,
      color:          role.color       ?? undefined,
      level:          role.level       ?? undefined,
      canApprove:     role.canApprove,
      canManageUsers: role.canManageUsers,
      isDefault:      role.isDefault,
    });
    setDrawerOpen(true);
  };

  const closeDrawer = () => { setDrawerOpen(false); setEditingRole(null); reset({}); };

  const onSubmit = (values: RoleForm) => {
    if (editingRole) updateMutation.mutate({ id: editingRole.id, data: values });
    else             createMutation.mutate(values);
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // ── Columns
  const columns = [
    {
      key: 'name', label: 'Role',
      render: (row: Role) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Color dot */}
          <Box sx={{
            width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
            backgroundColor: row.color ?? '#9a9894',
          }} />
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1a1917' }}>{row.name}</Typography>
              {row.isSystem && (
                <Box sx={{ px: 0.75, py: 0.1, borderRadius: 99, backgroundColor: '#e8e6e3', color: '#6b6966', fontSize: '0.65rem', fontWeight: 600 }}>
                  SYSTEM
                </Box>
              )}
              {row.isDefault && (
                <Box sx={{ px: 0.75, py: 0.1, borderRadius: 99, backgroundColor: '#cedcd8', color: '#01696f', fontSize: '0.65rem', fontWeight: 600 }}>
                  DEFAULT
                </Box>
              )}
            </Box>
            <Typography sx={{ fontSize: '0.75rem', color: '#9a9894' }}>{row.code ?? '—'}</Typography>
          </Box>
        </Box>
      ),
    },
    {
      key: 'organization', label: 'Organization',
      render: (row: Role) => {
        const org = orgOptions.find((o) => o.id === row.orgId);
        return <Typography sx={{ fontSize: '0.8125rem', color: '#3a3937' }}>{org?.name ?? '—'}</Typography>;
      },
    },
    {
      key: 'level', label: 'Level',
      render: (row: Role) => (
        <Typography sx={{ fontSize: '0.8125rem', color: '#3a3937', fontVariantNumeric: 'tabular-nums' }}>
          {row.level ?? '—'}
        </Typography>
      ),
    },
    {
      key: 'permissions', label: 'Permissions',
      render: (row: Role) => (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {row.canApprove && (
            <Box sx={{ px: 0.75, py: 0.1, borderRadius: 99, backgroundColor: '#d4dfcc', color: '#437a22', fontSize: '0.65rem', fontWeight: 600 }}>
              Approve
            </Box>
          )}
          {row.canManageUsers && (
            <Box sx={{ px: 0.75, py: 0.1, borderRadius: 99, backgroundColor: '#cedcd8', color: '#01696f', fontSize: '0.65rem', fontWeight: 600 }}>
              Manage Users
            </Box>
          )}
          {!row.canApprove && !row.canManageUsers && (
            <Typography sx={{ fontSize: '0.75rem', color: '#9a9894' }}>—</Typography>
          )}
        </Box>
      ),
    },
    {
      key: 'isActive', label: 'Status',
      render: (row: Role) => (
        <Box sx={{
          display: 'inline-flex', alignItems: 'center', gap: 0.5,
          px: 1, py: 0.25, borderRadius: 99, fontSize: '0.75rem', fontWeight: 500,
          backgroundColor: row.isActive ? '#d4dfcc' : '#e8e6e3',
          color:           row.isActive ? '#437a22' : '#6b6966',
        }}>
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: row.isActive ? '#437a22' : '#9a9894' }} />
          {row.isActive ? 'Active' : 'Inactive'}
        </Box>
      ),
    },
    {
      key: 'actions', label: '', width: 120, align: 'right' as const,
      render: (row: Role) => (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
          <Tooltip title={row.isActive ? 'Deactivate' : 'Activate'}>
            <span>
              <IconButton
                size="small"
                disabled={row.isSystem}
                onClick={() => setConfirmToggle(row)}
                sx={{ color: row.isActive ? '#437a22' : '#9a9894' }}
              >
                {row.isActive ? <ToggleRight size={17} /> : <ToggleLeft size={17} />}
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={row.isSystem ? 'System role — cannot edit' : 'Edit'}>
            <span>
              <IconButton
                size="small"
                disabled={row.isSystem}
                onClick={() => openEdit(row)}
                sx={{ color: '#6b6966', '&:hover': { color: '#01696f' } }}
              >
                <Pencil size={15} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={row.isSystem ? 'System role — cannot delete' : 'Delete'}>
            <span>
              <IconButton
                size="small"
                disabled={row.isSystem}
                onClick={() => setConfirmDelete(row)}
                sx={{ color: '#6b6966', '&:hover': { color: '#a12c7b' } }}
              >
                <Trash2 size={15} />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // ── Render
  return (
    <Box>
      <PageHeader
        title="Roles"
        subtitle="Manage user roles and permissions"
        breadcrumbs={[{ label: 'Control Panel' }, { label: 'Roles' }]}
        actions={[{ label: 'Add Role', onClick: openCreate, icon: <ShieldCheck size={15} /> }]}
      />

      <DataTable
        columns={columns}
        rows={data?.data ?? []}
        loading={isLoading}
        total={data?.meta.total ?? 0}
        page={page}
        limit={limit}
        search={search}
        onPageChange={setPage}
        onLimitChange={(l) => { setLimit(l); setPage(1); }}
        onSearchChange={(s) => { setSearch(s); setPage(1); }}
        rowKey={(row) => row.id}
        emptyText="No roles found. Add your first role."
      />

      {/* Create / Edit Drawer */}
      <FormDrawer
        open={drawerOpen}
        title={editingRole ? 'Edit Role' : 'Add Role'}
        subtitle={editingRole ? `Editing ${editingRole.name}` : 'Fill in the details below'}
        onClose={closeDrawer}
        onSubmit={handleSubmit(onSubmit)}
        isSubmitting={isSubmitting}
        submitText={editingRole ? 'Save Changes' : 'Create Role'}
        width={480}
      >
        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }} onSubmit={handleSubmit(onSubmit)}>

          {/* Organization */}
          <FormField label="Organization" required error={errors.orgId?.message}>
            <Controller
              name="orgId"
              control={control}
              render={({ field }) => (
                <TextField {...field} select fullWidth size="small" error={!!errors.orgId} sx={fieldSx}>
                  <MenuItem value=""><em>Select organization</em></MenuItem>
                  {orgOptions.map((o) => (
                    <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>
                  ))}
                </TextField>
              )}
            />
          </FormField>

          {/* Name + Code */}
          <Grid container spacing={2}>
            <Grid size={8}>
              <FormField label="Role Name" required error={errors.name?.message}>
                <TextField
                  {...register('name')}
                  fullWidth size="small"
                  placeholder="IT Manager"
                  error={!!errors.name}
                  sx={fieldSx}
                />
              </FormField>
            </Grid>
            <Grid size={4}>
              <FormField label="Code">
                <TextField
                  {...register('code')}
                  fullWidth size="small"
                  placeholder="IT_MGR"
                  sx={fieldSx}
                  slotProps={{ htmlInput: { style: { textTransform: 'uppercase' } } }}
                />
              </FormField>
            </Grid>
          </Grid>

          {/* Level + Color */}
          <Grid container spacing={2}>
            <Grid size={5}>
              <FormField label="Level" error={errors.level?.message}>
                <TextField
                  {...register('level')}
                  fullWidth size="small" type="number"
                  placeholder="1"
                  sx={fieldSx}
                  slotProps={{ htmlInput: { min: 0, max: 99 } }}
                />
              </FormField>
            </Grid>
            <Grid size={7}>
              <FormField label="Color">
                <Controller
                  name="color"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select fullWidth size="small" sx={fieldSx}>
                      <MenuItem value=""><em>None</em></MenuItem>
                      {ROLE_COLORS.map((c) => (
                        <MenuItem key={c.value} value={c.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: c.value }} />
                            {c.label}
                          </Box>
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </FormField>
            </Grid>
          </Grid>

          {/* Description */}
          <FormField label="Description">
            <TextField
              {...register('description')}
              fullWidth size="small" multiline rows={2}
              placeholder="Brief description of this role..."
              sx={fieldSx}
            />
          </FormField>

          {/* Permissions section */}
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#9a9894', letterSpacing: '0.06em', textTransform: 'uppercase', mt: 0.5 }}>
            Permissions
          </Typography>

          {/* Can Approve */}
          <ToggleField label="Can Approve" description="This role can approve requests and workflows">
            <Controller
              name="canApprove"
              control={control}
              render={({ field }) => (
                <Switch
                  checked={!!field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  size="small"
                  sx={switchSx}
                />
              )}
            />
          </ToggleField>

          {/* Can Manage Users */}
          <ToggleField label="Can Manage Users" description="This role can create and manage user accounts">
            <Controller
              name="canManageUsers"
              control={control}
              render={({ field }) => (
                <Switch
                  checked={!!field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  size="small"
                  sx={switchSx}
                />
              )}
            />
          </ToggleField>

          {/* Is Default */}
          <ToggleField label="Default Role" description="Automatically assigned to new users">
            <Controller
              name="isDefault"
              control={control}
              render={({ field }) => (
                <Switch
                  checked={!!field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  size="small"
                  sx={switchSx}
                />
              )}
            />
          </ToggleField>

        </Box>
      </FormDrawer>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete Role"
        message={`Are you sure you want to delete "${confirmDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        severity="error"
        loading={deleteMutation.isPending}
        onConfirm={() => confirmDelete && deleteMutation.mutate(confirmDelete.id)}
        onCancel={() => setConfirmDelete(null)}
      />

      {/* Toggle Status */}
      <ConfirmDialog
        open={!!confirmToggle}
        title={confirmToggle?.isActive ? 'Deactivate Role' : 'Activate Role'}
        message={`Are you sure you want to ${confirmToggle?.isActive ? 'deactivate' : 'activate'} "${confirmToggle?.name}"?`}
        confirmText={confirmToggle?.isActive ? 'Deactivate' : 'Activate'}
        severity="warning"
        loading={toggleMutation.isPending}
        onConfirm={() => confirmToggle && toggleMutation.mutate(confirmToggle.id)}
        onCancel={() => setConfirmToggle(null)}
      />
    </Box>
  );
}

// ── FormField helper ──────────────────────────────────────────
function FormField({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <Box>
      <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, color: '#3a3937', mb: 0.75 }}>
        {label}
        {required && <Box component="span" sx={{ color: '#a12c7b', ml: 0.25 }}>*</Box>}
      </Typography>
      {children}
      {error && <Typography sx={{ fontSize: '0.75rem', color: '#a12c7b', mt: 0.5 }}>{error}</Typography>}
    </Box>
  );
}

// ── Toggle row helper ─────────────────────────────────────────
function ToggleField({ label, description, children }: {
  label: string; description: string; children: React.ReactNode;
}) {
  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      px: 1.5, py: 1.25, borderRadius: 2, border: '1px solid #e2e0db', backgroundColor: '#fafaf8',
    }}>
      <Box>
        <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, color: '#3a3937' }}>{label}</Typography>
        <Typography sx={{ fontSize: '0.75rem', color: '#9a9894' }}>{description}</Typography>
      </Box>
      {children}
    </Box>
  );
}

// ── Styles ────────────────────────────────────────────────────
const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2, backgroundColor: '#ffffff', fontSize: '0.875rem',
    '& fieldset':             { borderColor: '#e2e0db' },
    '&:hover fieldset':       { borderColor: '#c8c5bf' },
    '&.Mui-focused fieldset': { borderColor: '#01696f', borderWidth: '1.5px' },
  },
};

const switchSx = {
  '& .MuiSwitch-switchBase.Mui-checked':                      { color: '#01696f' },
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track':   { backgroundColor: '#01696f' },
};