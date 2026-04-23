import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, IconButton, Tooltip, Typography,
  TextField, MenuItem, Grid, Avatar,
} from '@mui/material';
import { Pencil, Trash2, ToggleLeft, ToggleRight, UserPlus } from 'lucide-react';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

import PageHeader    from '@/components/common/PageHeader';
import DataTable     from '@/components/common/DataTable';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import FormDrawer    from '@/components/common/FormDrawer';
import { usersApi }         from '@/api/endpoints/users';
import { organizationsApi } from '@/api/endpoints/organizations';
import { branchesApi }      from '@/api/endpoints/branches';
import { useDebounce } from '@/hooks/useDebounce';
import type { User } from '@/types';

// ── Schema ────────────────────────────────────────────────────
const userSchema = z.object({
  orgId:              z.string().uuid('Select an organization'),
  firstName:          z.string().min(1, 'First name is required'),
  lastName:           z.string().optional(),
  email:              z.string().email('Invalid email'),
  username:           z.string().min(2).optional(),
  employeeId:         z.string().optional(),
  departmentId:       z.string().uuid().optional(),
  designationId:      z.string().uuid().optional(),
  branchId:           z.string().uuid().optional(),
  locationId:         z.string().uuid().optional(),
  reportingManagerId: z.string().uuid().optional(),
  joiningDate:        z.string().optional(),
  workEmail:          z.string().email().optional().or(z.literal('')),
  workPhone:          z.string().optional(),
  mobile:             z.string().optional(),
  extension:          z.string().optional(),
  timezone:           z.string().optional(),
});
type UserForm = z.infer<typeof userSchema>;

const TIMEZONES     = ['Asia/Kolkata', 'UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Asia/Singapore'];

const statusColors: Record<string, { bg: string; color: string }> = {
  active:      { bg: '#d4dfcc', color: '#437a22' },
  inactive:    { bg: '#e8e6e3', color: '#6b6966' },
  suspended:   { bg: '#ddcfc6', color: '#964219' },
  offboarded:  { bg: '#e0ced7', color: '#a12c7b' },
};

function getInitials(user: User) {
  return `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
}

// ── Page ──────────────────────────────────────────────────────
export default function UsersPage() {
  const qc = useQueryClient();

  const [page,   setPage]   = useState(1);
  const [limit,  setLimit]  = useState(20);
  const [search, setSearch] = useState('');
  const debouncedSearch     = useDebounce(search);

  const [drawerOpen,    setDrawerOpen]    = useState(false);
  const [editingUser,   setEditingUser]   = useState<User | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);
  const [confirmToggle, setConfirmToggle] = useState<User | null>(null);

  const {
    register, handleSubmit, reset, control,
    formState: { errors },
  } = useForm<UserForm>({
    resolver: zodResolver(userSchema) as Resolver<UserForm>,
  });

  // ── Queries
  const { data, isLoading } = useQuery({
    queryKey: ['users', page, limit, debouncedSearch],
    queryFn:  () => usersApi.list({ page, limit, search: debouncedSearch }),
  });

  const { data: orgsData } = useQuery({
    queryKey: ['organizations-all'],
    queryFn:  () => organizationsApi.list({ page: 1, limit: 100 }),
  });

  const { data: branchesData } = useQuery({
    queryKey: ['branches-all'],
    queryFn:  () => branchesApi.list({ page: 1, limit: 100 }),
  });

  const orgOptions    = orgsData?.data    ?? [];
  const branchOptions = branchesData?.data ?? [];

  // ── Mutations
  const createMutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('User created — temporary password sent'); closeDrawer(); },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e?.response?.data?.message ?? 'Failed to create'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<UserForm> }) => usersApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('User updated'); closeDrawer(); },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e?.response?.data?.message ?? 'Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: usersApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('User deleted'); setConfirmDelete(null); },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e?.response?.data?.message ?? 'Failed to delete'),
  });

  const toggleMutation = useMutation({
    mutationFn: usersApi.toggleStatus,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Status updated'); setConfirmToggle(null); },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e?.response?.data?.message ?? 'Failed to update status'),
  });

  // ── Drawer helpers
  const openCreate = () => { setEditingUser(null); reset({}); setDrawerOpen(true); };

  const openEdit = (user: User) => {
    setEditingUser(user);
    reset({
      orgId:              user.orgId,
      firstName:          user.firstName,
      lastName:           user.lastName           ?? undefined,
      email:              user.email,
      username:           user.username            ?? undefined,
      employeeId:         user.employeeId          ?? undefined,
      departmentId:       user.departmentId        ?? undefined,
      designationId:      user.designationId       ?? undefined,
      branchId:           user.branchId            ?? undefined,
      locationId:         user.locationId          ?? undefined,
      reportingManagerId: user.reportingManagerId  ?? undefined,
      joiningDate:        user.joiningDate         ?? undefined,
      workEmail:          user.workEmail           ?? undefined,
      workPhone:          user.workPhone           ?? undefined,
      mobile:             user.mobile              ?? undefined,
      extension:          user.extension           ?? undefined,
      timezone:           user.timezone            ?? undefined,
    });
    setDrawerOpen(true);
  };

  const closeDrawer = () => { setDrawerOpen(false); setEditingUser(null); reset({}); };

  const onSubmit = (values: UserForm) => {
    const payload = {
      ...values,
      departmentId:       values.departmentId       || undefined,
      designationId:      values.designationId      || undefined,
      branchId:           values.branchId           || undefined,
      locationId:         values.locationId         || undefined,
      reportingManagerId: values.reportingManagerId || undefined,
    };
    if (editingUser) updateMutation.mutate({ id: editingUser.id, data: payload });
    else             createMutation.mutate(payload);
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // ── Columns
  const columns = [
    {
      key: 'name', label: 'User',
      render: (row: User) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Avatar
            src={row.avatarThumbUrl ?? undefined}
            sx={{ width: 32, height: 32, fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#cedcd8', color: '#01696f' }}
          >
            {getInitials(row)}
          </Avatar>
          <Box>
            <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1a1917' }}>
              {row.displayName ?? `${row.firstName} ${row.lastName ?? ''}`.trim()}
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: '#9a9894' }}>{row.email}</Typography>
          </Box>
        </Box>
      ),
    },
    {
      key: 'employeeId', label: 'Emp ID',
      render: (row: User) => (
        <Typography sx={{ fontSize: '0.8125rem', color: '#3a3937', fontVariantNumeric: 'tabular-nums' }}>
          {row.employeeId ?? '—'}
        </Typography>
      ),
    },
    {
      key: 'branch', label: 'Branch',
      render: (row: User) => {
        const branch = branchOptions.find((b) => b.id === row.branchId);
        return <Typography sx={{ fontSize: '0.8125rem', color: '#3a3937' }}>{branch?.name ?? '—'}</Typography>;
      },
    },
    {
      key: 'contact', label: 'Mobile',
      render: (row: User) => (
        <Typography sx={{ fontSize: '0.8125rem', color: '#3a3937' }}>{row.mobile ?? '—'}</Typography>
      ),
    },
    {
      key: 'status', label: 'Status',
      render: (row: User) => {
        const s = row.status ?? 'inactive';
        const c = statusColors[s] ?? statusColors.inactive;
        return (
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.25, borderRadius: 99, fontSize: '0.75rem', fontWeight: 500, backgroundColor: c.bg, color: c.color }}>
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: c.color }} />
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </Box>
        );
      },
    },
    {
      key: 'actions', label: '', width: 120, align: 'right' as const,
      render: (row: User) => (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
          <Tooltip title={row.isActive ? 'Deactivate' : 'Activate'}>
            <IconButton size="small" onClick={() => setConfirmToggle(row)} sx={{ color: row.isActive ? '#437a22' : '#9a9894' }}>
              {row.isActive ? <ToggleRight size={17} /> : <ToggleLeft size={17} />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => openEdit(row)} sx={{ color: '#6b6966', '&:hover': { color: '#01696f' } }}>
              <Pencil size={15} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => setConfirmDelete(row)} sx={{ color: '#6b6966', '&:hover': { color: '#a12c7b' } }}>
              <Trash2 size={15} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // ── Render
  return (
    <Box>
      <PageHeader
        title="Users"
        subtitle="Manage user accounts and access"
        breadcrumbs={[{ label: 'Control Panel' }, { label: 'Users' }]}
        actions={[{ label: 'Add User', onClick: openCreate, icon: <UserPlus size={15} /> }]}
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
        emptyText="No users found. Add your first user."
      />

      {/* Drawer */}
      <FormDrawer
        open={drawerOpen}
        title={editingUser ? 'Edit User' : 'Add User'}
        subtitle={editingUser ? `Editing ${editingUser.firstName}` : 'A temporary password will be auto-generated'}
        onClose={closeDrawer}
        onSubmit={handleSubmit(onSubmit)}
        isSubmitting={isSubmitting}
        submitText={editingUser ? 'Save Changes' : 'Create User'}
        width={540}
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

          {/* First + Last Name */}
          <Grid container spacing={2}>
            <Grid size={6}>
              <FormField label="First Name" required error={errors.firstName?.message}>
                <TextField {...register('firstName')} fullWidth size="small" placeholder="John" error={!!errors.firstName} sx={fieldSx} />
              </FormField>
            </Grid>
            <Grid size={6}>
              <FormField label="Last Name">
                <TextField {...register('lastName')} fullWidth size="small" placeholder="Doe" sx={fieldSx} />
              </FormField>
            </Grid>
          </Grid>

          {/* Email + Username */}
          <Grid container spacing={2}>
            <Grid size={7}>
              <FormField label="Email" required error={errors.email?.message}>
                <TextField
                  {...register('email')}
                  fullWidth size="small"
                  placeholder="john.doe@acme.com"
                  error={!!errors.email}
                  disabled={!!editingUser}
                  sx={fieldSx}
                />
              </FormField>
            </Grid>
            <Grid size={5}>
              <FormField label="Username">
                <TextField {...register('username')} fullWidth size="small" placeholder="jdoe" sx={fieldSx} />
              </FormField>
            </Grid>
          </Grid>

          {/* Employee ID */}
          <FormField label="Employee ID">
            <TextField {...register('employeeId')} fullWidth size="small" placeholder="EMP-001" sx={fieldSx} />
          </FormField>

          {/* Branch */}
          <FormField label="Branch">
            <Controller
              name="branchId"
              control={control}
              render={({ field }) => (
                <TextField {...field} select fullWidth size="small" sx={fieldSx}>
                  <MenuItem value="">No specific branch</MenuItem>
                  {branchOptions.map((b) => (
                    <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                  ))}
                </TextField>
              )}
            />
          </FormField>

          {/* Joining Date */}
          <FormField label="Joining Date">
            <TextField {...register('joiningDate')} fullWidth size="small" type="date" sx={fieldSx}
              slotProps={{ htmlInput: { max: new Date().toISOString().split('T')[0] } }}
            />
          </FormField>

          {/* Contact section */}
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#9a9894', letterSpacing: '0.06em', textTransform: 'uppercase', mt: 0.5 }}>
            Contact
          </Typography>

          <Grid container spacing={2}>
            <Grid size={6}>
              <FormField label="Mobile">
                <TextField {...register('mobile')} fullWidth size="small" placeholder="+91 98765 43210" sx={fieldSx} />
              </FormField>
            </Grid>
            <Grid size={6}>
              <FormField label="Work Phone">
                <TextField {...register('workPhone')} fullWidth size="small" placeholder="+91 80 1234 5678" sx={fieldSx} />
              </FormField>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid size={8}>
              <FormField label="Work Email" error={errors.workEmail?.message}>
                <TextField {...register('workEmail')} fullWidth size="small" placeholder="john@work.acme.com" error={!!errors.workEmail} sx={fieldSx} />
              </FormField>
            </Grid>
            <Grid size={4}>
              <FormField label="Extension">
                <TextField {...register('extension')} fullWidth size="small" placeholder="101" sx={fieldSx} />
              </FormField>
            </Grid>
          </Grid>

          {/* Preferences section */}
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#9a9894', letterSpacing: '0.06em', textTransform: 'uppercase', mt: 0.5 }}>
            Preferences
          </Typography>

          <FormField label="Timezone">
            <Controller
              name="timezone"
              control={control}
              render={({ field }) => (
                <TextField {...field} select fullWidth size="small" sx={fieldSx}>
                  <MenuItem value=""><em>Select timezone</em></MenuItem>
                  {TIMEZONES.map((tz) => (
                    <MenuItem key={tz} value={tz}>{tz}</MenuItem>
                  ))}
                </TextField>
              )}
            />
          </FormField>

        </Box>
      </FormDrawer>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete User"
        message={`Are you sure you want to delete "${confirmDelete?.firstName} ${confirmDelete?.lastName ?? ''}"? This action cannot be undone.`}
        confirmText="Delete"
        severity="error"
        loading={deleteMutation.isPending}
        onConfirm={() => confirmDelete && deleteMutation.mutate(confirmDelete.id)}
        onCancel={() => setConfirmDelete(null)}
      />

      {/* Toggle Confirm */}
      <ConfirmDialog
        open={!!confirmToggle}
        title={confirmToggle?.isActive ? 'Deactivate User' : 'Activate User'}
        message={`Are you sure you want to ${confirmToggle?.isActive ? 'deactivate' : 'activate'} "${confirmToggle?.firstName}"?`}
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

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2, backgroundColor: '#ffffff', fontSize: '0.875rem',
    '& fieldset':             { borderColor: '#e2e0db' },
    '&:hover fieldset':       { borderColor: '#c8c5bf' },
    '&.Mui-focused fieldset': { borderColor: '#01696f', borderWidth: '1.5px' },
  },
};