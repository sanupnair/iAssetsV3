import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, IconButton, Tooltip, Typography,
  TextField, MenuItem, Grid,
} from '@mui/material';
import { Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

import PageHeader    from '@/components/common/PageHeader';
import DataTable     from '@/components/common/DataTable';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import FormDrawer    from '@/components/common/FormDrawer';
import { departmentsApi }   from '@/api/endpoints/departments';
import { organizationsApi } from '@/api/endpoints/organizations';
import { useDebounce } from '@/hooks/useDebounce';
import type { Department } from '@/types';

// ── Schema ────────────────────────────────────────────────────
const deptSchema = z.object({
  orgId:              z.string().uuid('Select an organization'),
  parentDepartmentId: z.string().uuid().optional().or(z.literal('')),
  name:               z.string().min(2, 'Name is required'),
  code:               z.string().max(20).optional(),
  description:        z.string().optional(),
  email:              z.string().email('Invalid email').optional().or(z.literal('')),
  phone:              z.string().optional(),
});
type DeptForm = z.infer<typeof deptSchema>;

// ── Page ──────────────────────────────────────────────────────
export default function DepartmentsPage() {
  const qc = useQueryClient();

  const [page,   setPage]   = useState(1);
  const [limit,  setLimit]  = useState(20);
  const [search, setSearch] = useState('');
  const debouncedSearch     = useDebounce(search);

  const [drawerOpen,    setDrawerOpen]    = useState(false);
  const [editingDept,   setEditingDept]   = useState<Department | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Department | null>(null);
  const [confirmToggle, setConfirmToggle] = useState<Department | null>(null);

  const {
    register, handleSubmit, reset, control, watch,
    formState: { errors },
  } = useForm<DeptForm>({ resolver: zodResolver(deptSchema) });

  const watchedOrg = watch('orgId');

  // ── Queries
  const { data, isLoading } = useQuery({
    queryKey: ['departments', page, limit, debouncedSearch],
    queryFn:  () => departmentsApi.list({ page, limit, search: debouncedSearch }),
  });

  const { data: orgsData } = useQuery({
    queryKey: ['organizations-all'],
    queryFn:  () => organizationsApi.list({ page: 1, limit: 100 }),
  });

  // Parent dept options — filtered by selected org
  const { data: parentDeptsData } = useQuery({
    queryKey: ['departments-by-org', watchedOrg],
    queryFn:  () => departmentsApi.list({ page: 1, limit: 100, orgId: watchedOrg }),
    enabled:  !!watchedOrg,
  });

  const orgOptions        = orgsData?.data       ?? [];
  const parentDeptOptions = parentDeptsData?.data ?? [];

  // ── Mutations
  const createMutation = useMutation({
    mutationFn: departmentsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Department created');
      closeDrawer();
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e?.response?.data?.message ?? 'Failed to create'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DeptForm> }) =>
      departmentsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Department updated');
      closeDrawer();
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e?.response?.data?.message ?? 'Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: departmentsApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Department deleted');
      setConfirmDelete(null);
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e?.response?.data?.message ?? 'Failed to delete'),
  });

  const toggleMutation = useMutation({
    mutationFn: departmentsApi.toggleStatus,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Status updated');
      setConfirmToggle(null);
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e?.response?.data?.message ?? 'Failed to update status'),
  });

  // ── Drawer helpers
  const openCreate = () => { setEditingDept(null); reset({}); setDrawerOpen(true); };

  const openEdit = (dept: Department) => {
    setEditingDept(dept);
    reset({
      orgId:              dept.orgId,
      parentDepartmentId: dept.parentDepartmentId ?? '',
      name:               dept.name,
      code:               dept.code               ?? '',
      description:        dept.description        ?? '',
      email:              dept.email              ?? '',
      phone:              dept.phone              ?? '',
    });
    setDrawerOpen(true);
  };

  const closeDrawer = () => { setDrawerOpen(false); setEditingDept(null); reset({}); };

  const onSubmit = (values: DeptForm) => {
    const payload = {
      ...values,
      parentDepartmentId: values.parentDepartmentId || undefined,
    };
    if (editingDept) updateMutation.mutate({ id: editingDept.id, data: payload });
    else             createMutation.mutate(payload);
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // ── Columns
  const columns = [
    {
      key: 'name', label: 'Department',
      render: (row: Department) => (
        <Box>
          <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1a1917' }}>
            {row.name}
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: '#9a9894' }}>
            {row.code ?? '—'}
          </Typography>
        </Box>
      ),
    },
    {
      key: 'organization', label: 'Organization',
      render: (row: Department) => {
        const org = orgOptions.find((o) => o.id === row.orgId);
        return (
          <Typography sx={{ fontSize: '0.8125rem', color: '#3a3937' }}>
            {org?.name ?? '—'}
          </Typography>
        );
      },
    },
    {
      key: 'parent', label: 'Parent Dept',
      render: (row: Department) => {
        const parent = parentDeptOptions.find((d) => d.id === row.parentDepartmentId);
        return (
          <Typography sx={{ fontSize: '0.8125rem', color: '#6b6966' }}>
            {parent?.name ?? '—'}
          </Typography>
        );
      },
    },
    {
      key: 'email', label: 'Contact',
      render: (row: Department) => (
        <Box>
          <Typography sx={{ fontSize: '0.8125rem', color: '#3a3937' }}>{row.email ?? '—'}</Typography>
          {row.phone && (
            <Typography sx={{ fontSize: '0.75rem', color: '#9a9894' }}>{row.phone}</Typography>
          )}
        </Box>
      ),
    },
    {
      key: 'isActive', label: 'Status',
      render: (row: Department) => (
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
      render: (row: Department) => (
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
        title="Departments"
        subtitle="Manage departments across your organizations"
        breadcrumbs={[{ label: 'Control Panel' }, { label: 'Departments' }]}
        actions={[{ label: 'Add Department', onClick: openCreate }]}
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
        emptyText="No departments found. Add your first department."
      />

      {/* Create / Edit Drawer */}
      <FormDrawer
        open={drawerOpen}
        title={editingDept ? 'Edit Department' : 'Add Department'}
        subtitle={editingDept ? `Editing ${editingDept.name}` : 'Fill in the details below'}
        onClose={closeDrawer}
        onSubmit={handleSubmit(onSubmit)}
        isSubmitting={isSubmitting}
        submitText={editingDept ? 'Save Changes' : 'Create Department'}
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

          {/* Parent Department — only when org selected */}
          {watchedOrg && (
            <FormField label="Parent Department">
              <Controller
                name="parentDepartmentId"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select fullWidth size="small" sx={fieldSx}>
                    <MenuItem value="">None (Top-level department)</MenuItem>
                    {parentDeptOptions
                      .filter((d) => d.id !== editingDept?.id) // prevent self-reference
                      .map((d) => (
                        <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                      ))}
                  </TextField>
                )}
              />
            </FormField>
          )}

          {/* Name + Code */}
          <Grid container spacing={2}>
            <Grid size={8}>
              <FormField label="Department Name" required error={errors.name?.message}>
                <TextField
                  {...register('name')}
                  fullWidth size="small"
                  placeholder="Engineering"
                  error={!!errors.name}
                  sx={fieldSx}
                />
              </FormField>
            </Grid>
            <Grid size={4}>
              <FormField label="Code" error={errors.code?.message}>
                <TextField
                  {...register('code')}
                  fullWidth size="small"
                  placeholder="ENG"
                  sx={fieldSx}
                  slotProps={{ htmlInput: { style: { textTransform: 'uppercase' } } }}
                />
              </FormField>
            </Grid>
          </Grid>

          {/* Email + Phone */}
          <Grid container spacing={2}>
            <Grid size={6}>
              <FormField label="Email" error={errors.email?.message}>
                <TextField
                  {...register('email')}
                  fullWidth size="small"
                  placeholder="eng@acme.com"
                  error={!!errors.email}
                  sx={fieldSx}
                />
              </FormField>
            </Grid>
            <Grid size={6}>
              <FormField label="Phone">
                <TextField
                  {...register('phone')}
                  fullWidth size="small"
                  placeholder="+91 98765 43210"
                  sx={fieldSx}
                />
              </FormField>
            </Grid>
          </Grid>

          {/* Description */}
          <FormField label="Description">
            <TextField
              {...register('description')}
              fullWidth size="small" multiline rows={2}
              placeholder="Brief description of this department..."
              sx={fieldSx}
            />
          </FormField>

        </Box>
      </FormDrawer>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete Department"
        message={`Are you sure you want to delete "${confirmDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        severity="error"
        loading={deleteMutation.isPending}
        onConfirm={() => confirmDelete && deleteMutation.mutate(confirmDelete.id)}
        onCancel={() => setConfirmDelete(null)}
      />

      {/* Toggle Status Confirm */}
      <ConfirmDialog
        open={!!confirmToggle}
        title={confirmToggle?.isActive ? 'Deactivate Department' : 'Activate Department'}
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

// ── Input style ───────────────────────────────────────────────
const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2, backgroundColor: '#ffffff', fontSize: '0.875rem',
    '& fieldset':             { borderColor: '#e2e0db' },
    '&:hover fieldset':       { borderColor: '#c8c5bf' },
    '&.Mui-focused fieldset': { borderColor: '#01696f', borderWidth: '1.5px' },
  },
};