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
import { branchesApi }      from '@/api/endpoints/branches';
import { organizationsApi } from '@/api/endpoints/organizations';
import { useDebounce } from '@/hooks/useDebounce';
import type { Branch } from '@/types';

// ── Schema ────────────────────────────────────────────────────
const branchSchema = z.object({
  orgId:        z.string().uuid('Select an organization'),
  name:         z.string().min(2, 'Name is required'),
  code:         z.string().max(20).optional(),
  branchType:   z.string().optional(),
  description:  z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  pincode:      z.string().optional(),
  phone:        z.string().optional(),
  email:        z.string().email('Invalid email').optional().or(z.literal('')),
  gstin:        z.string().optional(),
  isHq:         z.boolean().optional().default(false),
});
type BranchForm = z.infer<typeof branchSchema>;

const BRANCH_TYPES = ['HQ', 'Regional', 'Warehouse', 'Office', 'Retail', 'Service Center', 'Other'];

// ── Page ──────────────────────────────────────────────────────
export default function BranchesPage() {
  const qc = useQueryClient();

  const [page,   setPage]   = useState(1);
  const [limit,  setLimit]  = useState(20);
  const [search, setSearch] = useState('');
  const debouncedSearch     = useDebounce(search);

  const [drawerOpen,    setDrawerOpen]    = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Branch | null>(null);
  const [confirmToggle, setConfirmToggle] = useState<Branch | null>(null);

  const {
    register, handleSubmit, reset, control,
    formState: { errors },
  } = useForm<BranchForm>({
    resolver: zodResolver(branchSchema) as Resolver<BranchForm>,
    defaultValues: { isHq: false },
  });

  // ── Queries
  const { data, isLoading } = useQuery({
    queryKey: ['branches', page, limit, debouncedSearch],
    queryFn:  () => branchesApi.list({ page, limit, search: debouncedSearch }),
  });

  const { data: orgsData } = useQuery({
    queryKey: ['organizations-all'],
    queryFn:  () => organizationsApi.list({ page: 1, limit: 100 }),
  });

  const orgOptions = orgsData?.data ?? [];

  // ── Mutations
  const createMutation = useMutation({
    mutationFn: branchesApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['branches'] });
      toast.success('Branch created');
      closeDrawer();
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e?.response?.data?.message ?? 'Failed to create'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BranchForm> }) =>
      branchesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['branches'] });
      toast.success('Branch updated');
      closeDrawer();
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e?.response?.data?.message ?? 'Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: branchesApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['branches'] });
      toast.success('Branch deleted');
      setConfirmDelete(null);
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e?.response?.data?.message ?? 'Failed to delete'),
  });

  const toggleMutation = useMutation({
    mutationFn: branchesApi.toggleStatus,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['branches'] });
      toast.success('Status updated');
      setConfirmToggle(null);
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e?.response?.data?.message ?? 'Failed to update status'),
  });

  // ── Drawer helpers
  const openCreate = () => {
    setEditingBranch(null);
    reset({ isHq: false });
    setDrawerOpen(true);
  };

  const openEdit = (branch: Branch) => {
    setEditingBranch(branch);
    reset({
      orgId:        branch.orgId,
      name:         branch.name,
      code:         branch.code         ?? undefined,
      branchType:   branch.branchType   ?? undefined,
      description:  branch.description  ?? undefined,
      addressLine1: branch.addressLine1 ?? undefined,
      addressLine2: branch.addressLine2 ?? undefined,
      pincode:      branch.pincode      ?? undefined,
      phone:        branch.phone        ?? undefined,
      email:        branch.email        ?? undefined,
      gstin:        branch.gstin        ?? undefined,
      isHq:         branch.isHq,
    });
    setDrawerOpen(true);
  };

  const closeDrawer = () => { setDrawerOpen(false); setEditingBranch(null); reset({}); };

  const onSubmit = (values: BranchForm) => {
    if (editingBranch) updateMutation.mutate({ id: editingBranch.id, data: values });
    else               createMutation.mutate(values);
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // ── Columns
  const columns = [
    {
      key: 'name', label: 'Branch',
      render: (row: Branch) => (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1a1917' }}>{row.name}</Typography>
            {row.isHq && (
              <Box sx={{ px: 0.75, py: 0.1, borderRadius: 99, backgroundColor: '#cedcd8', color: '#01696f', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.04em' }}>
                HQ
              </Box>
            )}
          </Box>
          <Typography sx={{ fontSize: '0.75rem', color: '#9a9894' }}>{row.code ?? '—'}</Typography>
        </Box>
      ),
    },
    {
      key: 'organization', label: 'Organization',
      render: (row: Branch) => {
        const org = orgOptions.find((o) => o.id === row.orgId);
        return <Typography sx={{ fontSize: '0.8125rem', color: '#3a3937' }}>{org?.name ?? '—'}</Typography>;
      },
    },
    {
      key: 'branchType', label: 'Type',
      render: (row: Branch) => (
        <Typography sx={{ fontSize: '0.8125rem', color: '#6b6966' }}>{row.branchType ?? '—'}</Typography>
      ),
    },
    {
      key: 'contact', label: 'Contact',
      render: (row: Branch) => (
        <Box>
          <Typography sx={{ fontSize: '0.8125rem', color: '#3a3937' }}>{row.email ?? '—'}</Typography>
          {row.phone && <Typography sx={{ fontSize: '0.75rem', color: '#9a9894' }}>{row.phone}</Typography>}
        </Box>
      ),
    },
    {
      key: 'location', label: 'Location',
      render: (row: Branch) => (
        <Typography sx={{ fontSize: '0.8125rem', color: '#3a3937' }}>
          {[row.addressLine1, row.pincode].filter(Boolean).join(', ') || '—'}
        </Typography>
      ),
    },
    {
      key: 'isActive', label: 'Status',
      render: (row: Branch) => (
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
      render: (row: Branch) => (
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
        title="Branches"
        subtitle="Manage organization branches and offices"
        breadcrumbs={[{ label: 'Control Panel' }, { label: 'Branches' }]}
        actions={[{ label: 'Add Branch', onClick: openCreate }]}
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
        emptyText="No branches found. Add your first branch."
      />

      {/* Create / Edit Drawer */}
      <FormDrawer
        open={drawerOpen}
        title={editingBranch ? 'Edit Branch' : 'Add Branch'}
        subtitle={editingBranch ? `Editing ${editingBranch.name}` : 'Fill in the details below'}
        onClose={closeDrawer}
        onSubmit={handleSubmit(onSubmit)}
        isSubmitting={isSubmitting}
        submitText={editingBranch ? 'Save Changes' : 'Create Branch'}
        width={520}
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
              <FormField label="Branch Name" required error={errors.name?.message}>
                <TextField
                  {...register('name')}
                  fullWidth size="small"
                  placeholder="Bengaluru HQ"
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
                  placeholder="BLR"
                  sx={fieldSx}
                  slotProps={{ htmlInput: { style: { textTransform: 'uppercase' } } }}
                />
              </FormField>
            </Grid>
          </Grid>

          {/* Type + HQ toggle */}
          <Grid container spacing={2}>
            <Grid size={8}>
              <FormField label="Branch Type">
                <Controller
                  name="branchType"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select fullWidth size="small" sx={fieldSx}>
                      <MenuItem value=""><em>Select type</em></MenuItem>
                      {BRANCH_TYPES.map((t) => (
                        <MenuItem key={t} value={t}>{t}</MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </FormField>
            </Grid>
            <Grid size={4}>
              <FormField label="Headquarters">
                <Box sx={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  px: 1.5, height: 40, borderRadius: 2, border: '1px solid #e2e0db', backgroundColor: '#ffffff',
                }}>
                  <Typography sx={{ fontSize: '0.8125rem', color: '#3a3937' }}>Is HQ</Typography>
                  <Controller
                    name="isHq"
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
                  placeholder="blr@acme.com"
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

          {/* GSTIN */}
          <FormField label="GSTIN">
            <TextField
              {...register('gstin')}
              fullWidth size="small"
              placeholder="29AABCU9603R1ZX"
              sx={fieldSx}
              slotProps={{ htmlInput: { style: { textTransform: 'uppercase' } } }}
            />
          </FormField>

          {/* Address section */}
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#9a9894', letterSpacing: '0.06em', textTransform: 'uppercase', mt: 0.5 }}>
            Address
          </Typography>

          <FormField label="Address Line 1">
            <TextField {...register('addressLine1')} fullWidth size="small" placeholder="123 MG Road" sx={fieldSx} />
          </FormField>

          <FormField label="Address Line 2">
            <TextField {...register('addressLine2')} fullWidth size="small" placeholder="Floor 2, Tower B" sx={fieldSx} />
          </FormField>

          <FormField label="Pincode">
            <TextField {...register('pincode')} fullWidth size="small" placeholder="560001" sx={fieldSx} />
          </FormField>

          {/* Description */}
          <FormField label="Description">
            <TextField
              {...register('description')}
              fullWidth size="small" multiline rows={2}
              placeholder="Brief description of this branch..."
              sx={fieldSx}
            />
          </FormField>

        </Box>
      </FormDrawer>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete Branch"
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
        title={confirmToggle?.isActive ? 'Deactivate Branch' : 'Activate Branch'}
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