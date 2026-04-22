import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, IconButton, Tooltip, Typography,
  TextField, MenuItem, Grid, Switch,
} from '@mui/material';
import { Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

import PageHeader    from '@/components/common/PageHeader';
import DataTable     from '@/components/common/DataTable';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import FormDrawer    from '@/components/common/FormDrawer';
import { designationsApi }  from '@/api/endpoints/designations';
import { organizationsApi } from '@/api/endpoints/organizations';
import { useDebounce } from '@/hooks/useDebounce';
import type { Designation } from '@/types';

// ── Schema ────────────────────────────────────────────────────
// ── Schema ────────────────────────────────────────────────────
const designationSchema = z.object({
  orgId:        z.string().uuid('Select an organization'),
  name:         z.string().min(2, 'Name is required'),
  shortName:    z.string().max(20).optional(),
  description:  z.string().optional(),
  level:        z.coerce.number().int().min(1).max(99).optional(),
  grade:        z.string().optional(),
  category:     z.string().optional(),
  canApprove:   z.boolean().optional().default(false),
  isHodLevel:   z.boolean().optional().default(false),
  isManagement: z.boolean().optional().default(false),
});
type DesignationForm = z.infer<typeof designationSchema>;


const CATEGORIES = ['Executive', 'Management', 'Senior', 'Mid-level', 'Junior', 'Intern', 'Contractual'];

// ── Page ──────────────────────────────────────────────────────
export default function DesignationsPage() {
  const qc = useQueryClient();

  const [page,   setPage]   = useState(1);
  const [limit,  setLimit]  = useState(20);
  const [search, setSearch] = useState('');
  const debouncedSearch     = useDebounce(search);

  const [drawerOpen,       setDrawerOpen]       = useState(false);
  const [editingDsgn,      setEditingDsgn]      = useState<Designation | null>(null);
  const [confirmDelete,    setConfirmDelete]    = useState<Designation | null>(null);
  const [confirmToggle,    setConfirmToggle]    = useState<Designation | null>(null);

  const {
  register, handleSubmit, reset, control,
  formState: { errors },
} = useForm<DesignationForm>({
  resolver: zodResolver(designationSchema) as Resolver<DesignationForm>,
  defaultValues: {
    canApprove:   false,
    isHodLevel:   false,
    isManagement: false,
  },
});

  // ── Queries
  const { data, isLoading } = useQuery({
    queryKey: ['designations', page, limit, debouncedSearch],
    queryFn:  () => designationsApi.list({ page, limit, search: debouncedSearch }),
  });

  const { data: orgsData } = useQuery({
    queryKey: ['organizations-all'],
    queryFn:  () => organizationsApi.list({ page: 1, limit: 100 }),
  });

  const orgOptions = orgsData?.data ?? [];

  // ── Mutations
  const createMutation = useMutation({
    mutationFn: designationsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['designations'] });
      toast.success('Designation created');
      closeDrawer();
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e?.response?.data?.message ?? 'Failed to create'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DesignationForm> }) =>
      designationsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['designations'] });
      toast.success('Designation updated');
      closeDrawer();
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e?.response?.data?.message ?? 'Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: designationsApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['designations'] });
      toast.success('Designation deleted');
      setConfirmDelete(null);
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e?.response?.data?.message ?? 'Failed to delete'),
  });

  const toggleMutation = useMutation({
    mutationFn: designationsApi.toggleStatus,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['designations'] });
      toast.success('Status updated');
      setConfirmToggle(null);
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e?.response?.data?.message ?? 'Failed to update status'),
  });

  // ── Drawer helpers
  const openCreate = () => {
    setEditingDsgn(null);
    reset({ canApprove: false, isHodLevel: false, isManagement: false });
    setDrawerOpen(true);
  };

  const openEdit = (d: Designation) => {
  setEditingDsgn(d);
  reset({
    orgId:        d.orgId,
    name:         d.name,
    shortName:    d.shortName    ?? undefined,
    description:  d.description  ?? undefined,
    level:        d.level        ?? undefined,   // ← undefined, not ''
    grade:        d.grade        ?? undefined,
    category:     d.category     ?? undefined,
    canApprove:   d.canApprove,
    isHodLevel:   d.isHodLevel,
    isManagement: d.isManagement,
  });
  setDrawerOpen(true);
};

  const closeDrawer = () => { setDrawerOpen(false); setEditingDsgn(null); reset({}); };

  const onSubmit = (values: DesignationForm) => {
  if (editingDsgn) updateMutation.mutate({ id: editingDsgn.id, data: values });
  else             createMutation.mutate(values);
};

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // ── Columns
  const columns = [
    {
      key: 'name', label: 'Designation',
      render: (row: Designation) => (
        <Box>
          <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1a1917' }}>{row.name}</Typography>
          <Typography sx={{ fontSize: '0.75rem', color: '#9a9894' }}>{row.shortName ?? '—'}</Typography>
        </Box>
      ),
    },
    {
      key: 'organization', label: 'Organization',
      render: (row: Designation) => {
        const org = orgOptions.find((o) => o.id === row.orgId);
        return <Typography sx={{ fontSize: '0.8125rem', color: '#3a3937' }}>{org?.name ?? '—'}</Typography>;
      },
    },
    {
      key: 'level', label: 'Level / Grade',
      render: (row: Designation) => (
        <Box>
          <Typography sx={{ fontSize: '0.8125rem', color: '#3a3937' }}>
            {row.level != null ? `L${row.level}` : '—'}
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: '#9a9894' }}>{row.grade ?? ''}</Typography>
        </Box>
      ),
    },
    {
      key: 'category', label: 'Category',
      render: (row: Designation) => (
        <Typography sx={{ fontSize: '0.8125rem', color: '#6b6966' }}>{row.category ?? '—'}</Typography>
      ),
    },
    {
      key: 'flags', label: 'Flags',
      render: (row: Designation) => (
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
          {row.canApprove && <FlagChip label="Approver" color="#006494" bg="#c6d8e4" />}
          {row.isHodLevel && <FlagChip label="HOD"      color="#437a22" bg="#d4dfcc" />}
          {row.isManagement && <FlagChip label="Mgmt"   color="#964219" bg="#ddcfc6" />}
          {!row.canApprove && !row.isHodLevel && !row.isManagement && (
            <Typography sx={{ fontSize: '0.75rem', color: '#9a9894' }}>—</Typography>
          )}
        </Box>
      ),
    },
    {
      key: 'isActive', label: 'Status',
      render: (row: Designation) => (
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
      render: (row: Designation) => (
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

  return (
    <Box>
      <PageHeader
        title="Designations"
        subtitle="Manage job designations and levels"
        breadcrumbs={[{ label: 'Control Panel' }, { label: 'Designations' }]}
        actions={[{ label: 'Add Designation', onClick: openCreate }]}
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
        emptyText="No designations found. Add your first designation."
      />

      {/* Create / Edit Drawer */}
      <FormDrawer
        open={drawerOpen}
        title={editingDsgn ? 'Edit Designation' : 'Add Designation'}
        subtitle={editingDsgn ? `Editing ${editingDsgn.name}` : 'Fill in the details below'}
        onClose={closeDrawer}
        onSubmit={handleSubmit(onSubmit)}
        isSubmitting={isSubmitting}
        submitText={editingDsgn ? 'Save Changes' : 'Create Designation'}
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

          {/* Name + Short Name */}
          <Grid container spacing={2}>
            <Grid size={8}>
              <FormField label="Designation Name" required error={errors.name?.message}>
                <TextField
                  {...register('name')}
                  fullWidth size="small"
                  placeholder="Senior Software Engineer"
                  error={!!errors.name}
                  sx={fieldSx}
                />
              </FormField>
            </Grid>
            <Grid size={4}>
              <FormField label="Short Name">
                <TextField
                  {...register('shortName')}
                  fullWidth size="small"
                  placeholder="SSE"
                  sx={fieldSx}
                  slotProps={{ htmlInput: { style: { textTransform: 'uppercase' } } }}
                />
              </FormField>
            </Grid>
          </Grid>

          {/* Level + Grade */}
          <Grid container spacing={2}>
            <Grid size={4}>
              <FormField label="Level" error={errors.level?.message}>
                <TextField
  {...register('level')}
  fullWidth size="small"
  placeholder="5"
  error={!!errors.level}
  sx={fieldSx}
  slotProps={{ htmlInput: { min: 1, max: 99 } }}
/>
              </FormField>
            </Grid>
            <Grid size={4}>
              <FormField label="Grade">
                <TextField
                  {...register('grade')}
                  fullWidth size="small"
                  placeholder="L5"
                  sx={fieldSx}
                />
              </FormField>
            </Grid>
            <Grid size={4}>
              <FormField label="Category">
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select fullWidth size="small" sx={fieldSx}>
                      <MenuItem value=""><em>None</em></MenuItem>
                      {CATEGORIES.map((c) => (
                        <MenuItem key={c} value={c}>{c}</MenuItem>
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
              placeholder="Role responsibilities and scope..."
              sx={fieldSx}
            />
          </FormField>

          {/* Flags section */}
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#9a9894', letterSpacing: '0.06em', textTransform: 'uppercase', mt: 0.5 }}>
            Permissions & Flags
          </Typography>

          {(
            [
              { name: 'canApprove',   label: 'Can Approve',      hint: 'This designation can approve requests' },
              { name: 'isHodLevel',   label: 'HOD Level',         hint: 'Head of Department level designation' },
              { name: 'isManagement', label: 'Management Level',  hint: 'Part of management hierarchy' },
            ] as const
          ).map(({ name, label, hint }) => (
            <Box key={name} sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              px: 1.5, py: 1, borderRadius: 2, border: '1px solid #e2e0db', backgroundColor: '#fafaf8',
            }}>
              <Box>
                <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, color: '#3a3937' }}>{label}</Typography>
                <Typography sx={{ fontSize: '0.75rem', color: '#9a9894' }}>{hint}</Typography>
              </Box>
              <Controller
                name={name}
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={!!field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    size="small"
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: '#01696f' },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#01696f' },
                    }}
                  />
                )}
              />
            </Box>
          ))}

        </Box>
      </FormDrawer>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete Designation"
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
        title={confirmToggle?.isActive ? 'Deactivate Designation' : 'Activate Designation'}
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

// ── Flag chip ─────────────────────────────────────────────────
function FlagChip({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <Box sx={{
      px: 0.75, py: 0.15, borderRadius: 99,
      fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.03em',
      backgroundColor: bg, color,
    }}>
      {label}
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