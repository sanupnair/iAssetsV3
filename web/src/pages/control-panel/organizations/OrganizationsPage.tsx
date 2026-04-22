import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, IconButton, Tooltip, Typography,
  TextField, Grid,
} from '@mui/material';
import { Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

import PageHeader    from '@/components/common/PageHeader';
import DataTable     from '@/components/common/DataTable';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import FormDrawer    from '@/components/common/FormDrawer';
import { organizationsApi } from '@/api/endpoints/organizations';
import { useDebounce } from '@/hooks/useDebounce';
import type { Organization } from '@/types';

// ── Form schema ───────────────────────────────────────────────
const orgSchema = z.object({
  name:         z.string().min(2, 'Name is required'),
  legalName:    z.string().optional(),
  shortCode:    z.string().max(20).optional(),
  website:      z.string().optional(),
  description:  z.string().optional(),
  primaryEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  primaryPhone: z.string().optional(),
  supportEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  supportPhone: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city:         z.string().optional(),
  state:        z.string().optional(),
  country:      z.string().optional(),
  pincode:      z.string().optional(),
  gstin:        z.string().optional(),
  pan:          z.string().optional(),
});
type OrgForm = z.infer<typeof orgSchema>;

// ── Page ──────────────────────────────────────────────────────
export default function OrganizationsPage() {
  const qc = useQueryClient();

  const [page,   setPage]   = useState(1);
  const [limit,  setLimit]  = useState(20);
  const [search, setSearch] = useState('');
  const debouncedSearch     = useDebounce(search);

  const [drawerOpen,    setDrawerOpen]    = useState(false);
  const [editingOrg,    setEditingOrg]    = useState<Organization | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Organization | null>(null);
  const [confirmToggle, setConfirmToggle] = useState<Organization | null>(null);

  const {
    register, handleSubmit, reset,
    formState: { errors },
  } = useForm<OrgForm>({ resolver: zodResolver(orgSchema) });

  // ── Query
  const { data, isLoading } = useQuery({
    queryKey: ['organizations', page, limit, debouncedSearch],
    queryFn:  () => organizationsApi.list({ page, limit, search: debouncedSearch }),
  });

  // ── Mutations
  const createMutation = useMutation({
    mutationFn: organizationsApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['organizations'] }); toast.success('Organization created'); closeDrawer(); },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e?.response?.data?.message ?? 'Failed to create'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<OrgForm> }) => organizationsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['organizations'] }); toast.success('Organization updated'); closeDrawer(); },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e?.response?.data?.message ?? 'Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: organizationsApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['organizations'] }); toast.success('Organization deleted'); setConfirmDelete(null); },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e?.response?.data?.message ?? 'Failed to delete'),
  });

  const toggleMutation = useMutation({
    mutationFn: organizationsApi.toggleStatus,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['organizations'] }); toast.success('Status updated'); setConfirmToggle(null); },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e?.response?.data?.message ?? 'Failed to update status'),
  });

  // ── Drawer helpers
  const openCreate = () => { setEditingOrg(null); reset({}); setDrawerOpen(true); };

  const openEdit = (org: Organization) => {
    setEditingOrg(org);
    reset({
      name:         org.name,
      legalName:    org.legalName    ?? '',
      shortCode:    org.shortCode    ?? '',
      website:      org.website      ?? '',
      description:  org.description  ?? '',
      primaryEmail: org.primaryEmail ?? '',
      primaryPhone: org.primaryPhone ?? '',
      supportEmail: org.supportEmail ?? '',
      supportPhone: org.supportPhone ?? '',
      addressLine1: org.addressLine1 ?? '',
      addressLine2: org.addressLine2 ?? '',
      city:         org.city         ?? '',
      state:        org.state        ?? '',
      country:      org.country      ?? '',
      pincode:      org.pincode       ?? '',
      gstin:        org.gstin        ?? '',
      pan:          org.pan          ?? '',
    });
    setDrawerOpen(true);
  };

  const closeDrawer = () => { setDrawerOpen(false); setEditingOrg(null); reset({}); };

  const onSubmit = (values: OrgForm) => {
    if (editingOrg) updateMutation.mutate({ id: editingOrg.id, data: values });
    else            createMutation.mutate(values);
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // ── Columns
  const columns = [
    {
      key: 'name', label: 'Organization',
      render: (row: Organization) => (
        <Box>
          <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1a1917' }}>{row.name}</Typography>
          <Typography sx={{ fontSize: '0.75rem', color: '#9a9894' }}>{row.shortCode ?? '—'}</Typography>
        </Box>
      ),
    },
    {
      key: 'primaryEmail', label: 'Email',
      render: (row: Organization) => (
        <Typography sx={{ fontSize: '0.8125rem', color: '#3a3937' }}>{row.primaryEmail ?? '—'}</Typography>
      ),
    },
    {
      key: 'city', label: 'Location',
      render: (row: Organization) => (
        <Typography sx={{ fontSize: '0.8125rem', color: '#3a3937' }}>
          {[row.city, row.country].filter(Boolean).join(', ') || '—'}
        </Typography>
      ),
    },
    {
      key: 'isActive', label: 'Status',
      render: (row: Organization) => (
        <Box
          sx={{
            display: 'inline-flex', alignItems: 'center', gap: 0.5,
            px: 1, py: 0.25, borderRadius: 99,
            fontSize: '0.75rem', fontWeight: 500,
            backgroundColor: row.isActive ? '#d4dfcc' : '#e8e6e3',
            color: row.isActive ? '#437a22' : '#6b6966',
          }}
        >
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: row.isActive ? '#437a22' : '#9a9894' }} />
          {row.isActive ? 'Active' : 'Inactive'}
        </Box>
      ),
    },
    {
      key: 'actions', label: '', width: 120, align: 'right' as const,
      render: (row: Organization) => (
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
        title="Organizations"
        subtitle="Manage your organizations"
        breadcrumbs={[{ label: 'Control Panel' }, { label: 'Organizations' }]}
        actions={[{ label: 'Add Organization', onClick: openCreate }]}
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
        emptyText="No organizations found. Add your first organization."
      />

      {/* Create / Edit Drawer */}
      <FormDrawer
        open={drawerOpen}
        title={editingOrg ? 'Edit Organization' : 'Add Organization'}
        subtitle={editingOrg ? `Editing ${editingOrg.name}` : 'Fill in the details below'}
        onClose={closeDrawer}
        onSubmit={handleSubmit(onSubmit)}
        isSubmitting={isSubmitting}
        submitText={editingOrg ? 'Save Changes' : 'Create Organization'}
        width={520}
      >
        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }} onSubmit={handleSubmit(onSubmit)}>

          {/* Row 1 — Name + Code */}
          <Grid container spacing={2}>
            <Grid size={8}>
              <FormField label="Organization Name" required error={errors.name?.message}>
                <TextField
                  {...register('name')}
                  fullWidth size="small"
                  placeholder="Acme Corporation"
                  error={!!errors.name}
                  sx={fieldSx}
                />
              </FormField>
            </Grid>
            <Grid size={4}>
              <FormField label="Short Code" error={errors.shortCode?.message}>
                <TextField
                  {...register('shortCode')}
                  fullWidth size="small"
                  placeholder="ACME"
                  error={!!errors.shortCode}
                  sx={fieldSx}
                  slotProps={{ htmlInput: { style: { textTransform: 'uppercase' } } }}
                />
              </FormField>
            </Grid>
          </Grid>

          {/* Legal Name */}
          <FormField label="Legal Name">
            <TextField
              {...register('legalName')}
              fullWidth size="small"
              placeholder="Acme Corporation Pvt. Ltd."
              sx={fieldSx}
            />
          </FormField>

          {/* Primary Email + Phone */}
          <Grid container spacing={2}>
            <Grid size={6}>
              <FormField label="Primary Email" error={errors.primaryEmail?.message}>
                <TextField
                  {...register('primaryEmail')}
                  fullWidth size="small"
                  placeholder="info@acme.com"
                  error={!!errors.primaryEmail}
                  sx={fieldSx}
                />
              </FormField>
            </Grid>
            <Grid size={6}>
              <FormField label="Primary Phone">
                <TextField
                  {...register('primaryPhone')}
                  fullWidth size="small"
                  placeholder="+91 98765 43210"
                  sx={fieldSx}
                />
              </FormField>
            </Grid>
          </Grid>

          {/* Support Email + Phone */}
          <Grid container spacing={2}>
            <Grid size={6}>
              <FormField label="Support Email" error={errors.supportEmail?.message}>
                <TextField
                  {...register('supportEmail')}
                  fullWidth size="small"
                  placeholder="support@acme.com"
                  error={!!errors.supportEmail}
                  sx={fieldSx}
                />
              </FormField>
            </Grid>
            <Grid size={6}>
              <FormField label="Support Phone">
                <TextField
                  {...register('supportPhone')}
                  fullWidth size="small"
                  placeholder="+91 98765 43211"
                  sx={fieldSx}
                />
              </FormField>
            </Grid>
          </Grid>

          {/* Website */}
          <FormField label="Website">
            <TextField
              {...register('website')}
              fullWidth size="small"
              placeholder="https://acme.com"
              sx={fieldSx}
            />
          </FormField>

          {/* Description */}
          <FormField label="Description">
            <TextField
              {...register('description')}
              fullWidth size="small" multiline rows={2}
              placeholder="Brief description of the organization..."
              sx={fieldSx}
            />
          </FormField>

          {/* Address section label */}
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#9a9894', letterSpacing: '0.06em', textTransform: 'uppercase', mt: 0.5 }}>
            Address
          </Typography>

          <FormField label="Address Line 1">
            <TextField
              {...register('addressLine1')}
              fullWidth size="small"
              placeholder="123 Business Park"
              sx={fieldSx}
            />
          </FormField>

          <FormField label="Address Line 2">
            <TextField
              {...register('addressLine2')}
              fullWidth size="small"
              placeholder="Floor 4, Tower B"
              sx={fieldSx}
            />
          </FormField>

          {/* City + State */}
          <Grid container spacing={2}>
            <Grid size={6}>
              <FormField label="City">
                <TextField {...register('city')} fullWidth size="small" placeholder="Bengaluru" sx={fieldSx} />
              </FormField>
            </Grid>
            <Grid size={6}>
              <FormField label="State">
                <TextField {...register('state')} fullWidth size="small" placeholder="Karnataka" sx={fieldSx} />
              </FormField>
            </Grid>
          </Grid>

          {/* Country + Pincode */}
          <Grid container spacing={2}>
            <Grid size={6}>
              <FormField label="Country">
                <TextField {...register('country')} fullWidth size="small" placeholder="India" sx={fieldSx} />
              </FormField>
            </Grid>
            <Grid size={6}>
              <FormField label="Pincode">
                <TextField {...register('pincode')} fullWidth size="small" placeholder="560001" sx={fieldSx} />
              </FormField>
            </Grid>
          </Grid>

          {/* Tax section label */}
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#9a9894', letterSpacing: '0.06em', textTransform: 'uppercase', mt: 0.5 }}>
            Tax & Compliance
          </Typography>

          {/* GSTIN + PAN */}
          <Grid container spacing={2}>
            <Grid size={6}>
              <FormField label="GSTIN">
                <TextField
                  {...register('gstin')}
                  fullWidth size="small"
                  placeholder="29AABCU9603R1ZX"
                  sx={fieldSx}
                  slotProps={{ htmlInput: { style: { textTransform: 'uppercase' } } }}
                />
              </FormField>
            </Grid>
            <Grid size={6}>
              <FormField label="PAN">
                <TextField
                  {...register('pan')}
                  fullWidth size="small"
                  placeholder="AABCU9603R"
                  sx={fieldSx}
                  slotProps={{ htmlInput: { style: { textTransform: 'uppercase' } } }}
                />
              </FormField>
            </Grid>
          </Grid>

        </Box>
      </FormDrawer>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete Organization"
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
        title={confirmToggle?.isActive ? 'Deactivate Organization' : 'Activate Organization'}
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
function FormField({
  label, required, error, children,
}: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <Box>
      <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, color: '#3a3937', mb: 0.75 }}>
        {label}
        {required && <Box component="span" sx={{ color: '#a12c7b', ml: 0.25 }}>*</Box>}
      </Typography>
      {children}
      {error && (
        <Typography sx={{ fontSize: '0.75rem', color: '#a12c7b', mt: 0.5 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
}

// ── Input style ───────────────────────────────────────────────
const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius:    2,
    backgroundColor: '#ffffff',
    fontSize:        '0.875rem',
    '& fieldset':             { borderColor: '#e2e0db' },
    '&:hover fieldset':       { borderColor: '#c8c5bf' },
    '&.Mui-focused fieldset': { borderColor: '#01696f', borderWidth: '1.5px' },
  },
};