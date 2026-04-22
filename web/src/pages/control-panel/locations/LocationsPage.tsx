import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, IconButton, Tooltip, Typography,
  TextField, MenuItem, Grid,
} from '@mui/material';
import { Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useForm, useWatch, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

import PageHeader    from '@/components/common/PageHeader';
import DataTable     from '@/components/common/DataTable';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import FormDrawer    from '@/components/common/FormDrawer';
import { locationsApi }     from '@/api/endpoints/locations';
import { organizationsApi } from '@/api/endpoints/organizations';
import { branchesApi }      from '@/api/endpoints/branches';
import { useDebounce } from '@/hooks/useDebounce';
import type { Location } from '@/types';

// ── Schema ────────────────────────────────────────────────────
const locationSchema = z.object({
  orgId:            z.string().uuid('Select an organization'),
  branchId:         z.string().uuid().optional(),
  parentLocationId: z.string().uuid().optional(),
  name:             z.string().min(2, 'Name is required'),
  code:             z.string().max(20).optional(),
  type:             z.string().optional(),
  description:      z.string().optional(),
  floorNumber:      z.coerce.number().int().optional(),
  capacity:         z.coerce.number().int().min(0).optional(),
  areaSqft:         z.coerce.number().min(0).optional(),
});
type LocationForm = z.infer<typeof locationSchema>;

const LOCATION_TYPES = ['Building', 'Floor', 'Wing', 'Room', 'Lab', 'Warehouse', 'Store', 'Cabin', 'Cubicle', 'Other'];

// ── Page ──────────────────────────────────────────────────────
export default function LocationsPage() {
  const qc = useQueryClient();

  const [page,   setPage]   = useState(1);
  const [limit,  setLimit]  = useState(20);
  const [search, setSearch] = useState('');
  const debouncedSearch     = useDebounce(search);

  const [drawerOpen,    setDrawerOpen]    = useState(false);
  const [editingLoc,    setEditingLoc]    = useState<Location | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Location | null>(null);
  const [confirmToggle, setConfirmToggle] = useState<Location | null>(null);

  const {
  register, handleSubmit, reset, control,
  formState: { errors },
} = useForm<LocationForm>({
  resolver: zodResolver(locationSchema) as Resolver<LocationForm>,
});

const watchedOrg    = useWatch({ control, name: 'orgId' });
const watchedBranch = useWatch({ control, name: 'branchId' });

  // ── Queries
  const { data, isLoading } = useQuery({
    queryKey: ['locations', page, limit, debouncedSearch],
    queryFn:  () => locationsApi.list({ page, limit, search: debouncedSearch }),
  });

  const { data: orgsData } = useQuery({
    queryKey: ['organizations-all'],
    queryFn:  () => organizationsApi.list({ page: 1, limit: 100 }),
  });

 const { data: branchesData } = useQuery({
  queryKey: ['branches-by-org', watchedOrg],
  queryFn:  () => branchesApi.list({ page: 1, limit: 100, orgId: watchedOrg }), // ← was organizationId
  enabled:  !!watchedOrg,
});

  const { data: parentLocsData } = useQuery({
    queryKey: ['locations-by-branch', watchedBranch ?? watchedOrg],
    queryFn:  () => locationsApi.list({
      page: 1, limit: 100,
      orgId:    watchedOrg,
      branchId: watchedBranch,
    }),
    enabled: !!watchedOrg,
  });

  const orgOptions       = orgsData?.data       ?? [];
  const branchOptions    = branchesData?.data    ?? [];
  const parentLocOptions = parentLocsData?.data  ?? [];

  // ── Mutations
  const createMutation = useMutation({
    mutationFn: locationsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['locations'] });
      toast.success('Location created');
      closeDrawer();
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e?.response?.data?.message ?? 'Failed to create'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LocationForm> }) =>
      locationsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['locations'] });
      toast.success('Location updated');
      closeDrawer();
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e?.response?.data?.message ?? 'Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: locationsApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['locations'] });
      toast.success('Location deleted');
      setConfirmDelete(null);
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e?.response?.data?.message ?? 'Failed to delete'),
  });

  const toggleMutation = useMutation({
    mutationFn: locationsApi.toggleStatus,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['locations'] });
      toast.success('Status updated');
      setConfirmToggle(null);
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e?.response?.data?.message ?? 'Failed to update status'),
  });

  // ── Drawer helpers
  const openCreate = () => { setEditingLoc(null); reset({}); setDrawerOpen(true); };

  const openEdit = (loc: Location) => {
    setEditingLoc(loc);
    reset({
      orgId:            loc.orgId,
      branchId:         loc.branchId         ?? undefined,
      parentLocationId: loc.parentLocationId  ?? undefined,
      name:             loc.name,
      code:             loc.code              ?? undefined,
      type:             loc.type              ?? undefined,
      description:      loc.description       ?? undefined,
      floorNumber:      loc.floorNumber       ?? undefined,
      capacity:         loc.capacity          ?? undefined,
      areaSqft:         loc.areaSqft          ?? undefined,
    });
    setDrawerOpen(true);
  };

  const closeDrawer = () => { setDrawerOpen(false); setEditingLoc(null); reset({}); };

  const onSubmit = (values: LocationForm) => {
    const payload = {
      ...values,
      branchId:         values.branchId         || undefined,
      parentLocationId: values.parentLocationId  || undefined,
    };
    if (editingLoc) updateMutation.mutate({ id: editingLoc.id, data: payload });
    else            createMutation.mutate(payload);
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // ── Columns
  const columns = [
    {
      key: 'name', label: 'Location',
      render: (row: Location) => (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1a1917' }}>{row.name}</Typography>
            {row.type && (
              <Box sx={{ px: 0.75, py: 0.1, borderRadius: 99, backgroundColor: '#f3f0ec', color: '#6b6966', fontSize: '0.65rem', fontWeight: 600 }}>
                {row.type}
              </Box>
            )}
          </Box>
          <Typography sx={{ fontSize: '0.75rem', color: '#9a9894' }}>{row.code ?? '—'}</Typography>
        </Box>
      ),
    },
    {
      key: 'organization', label: 'Organization',
      render: (row: Location) => {
        const org = orgOptions.find((o) => o.id === row.orgId);
        return <Typography sx={{ fontSize: '0.8125rem', color: '#3a3937' }}>{org?.name ?? '—'}</Typography>;
      },
    },
    {
      key: 'branch', label: 'Branch',
      render: (row: Location) => {
        const branch = branchOptions.find((b) => b.id === row.branchId);
        return <Typography sx={{ fontSize: '0.8125rem', color: '#6b6966' }}>{branch?.name ?? '—'}</Typography>;
      },
    },
    {
      key: 'details', label: 'Details',
      render: (row: Location) => (
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {row.floorNumber != null && (
            <Typography sx={{ fontSize: '0.75rem', color: '#6b6966' }}>Floor {row.floorNumber}</Typography>
          )}
          {row.capacity != null && (
            <Typography sx={{ fontSize: '0.75rem', color: '#6b6966' }}>Cap: {row.capacity}</Typography>
          )}
          {row.areaSqft != null && (
            <Typography sx={{ fontSize: '0.75rem', color: '#6b6966' }}>{row.areaSqft} sqft</Typography>
          )}
          {row.floorNumber == null && row.capacity == null && row.areaSqft == null && (
            <Typography sx={{ fontSize: '0.75rem', color: '#9a9894' }}>—</Typography>
          )}
        </Box>
      ),
    },
    {
      key: 'isActive', label: 'Status',
      render: (row: Location) => (
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
      render: (row: Location) => (
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
        title="Locations"
        subtitle="Manage physical locations, floors and rooms"
        breadcrumbs={[{ label: 'Control Panel' }, { label: 'Locations' }]}
        actions={[{ label: 'Add Location', onClick: openCreate }]}
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
        emptyText="No locations found. Add your first location."
      />

      <FormDrawer
        open={drawerOpen}
        title={editingLoc ? 'Edit Location' : 'Add Location'}
        subtitle={editingLoc ? `Editing ${editingLoc.name}` : 'Fill in the details below'}
        onClose={closeDrawer}
        onSubmit={handleSubmit(onSubmit)}
        isSubmitting={isSubmitting}
        submitText={editingLoc ? 'Save Changes' : 'Create Location'}
        width={500}
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

          {/* Branch — shown when org selected */}
          {watchedOrg && (
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
          )}

          {/* Parent Location — shown when org selected */}
          {watchedOrg && (
            <FormField label="Parent Location">
              <Controller
                name="parentLocationId"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select fullWidth size="small" sx={fieldSx}>
                    <MenuItem value="">None (Top-level)</MenuItem>
                    {parentLocOptions
                      .filter((l) => l.id !== editingLoc?.id)
                      .map((l) => (
                        <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>
                      ))}
                  </TextField>
                )}
              />
            </FormField>
          )}

          {/* Name + Code */}
          <Grid container spacing={2}>
            <Grid size={8}>
              <FormField label="Location Name" required error={errors.name?.message}>
                <TextField
                  {...register('name')}
                  fullWidth size="small"
                  placeholder="Server Room A"
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
                  placeholder="SRA"
                  sx={fieldSx}
                  slotProps={{ htmlInput: { style: { textTransform: 'uppercase' } } }}
                />
              </FormField>
            </Grid>
          </Grid>

          {/* Type */}
          <FormField label="Location Type">
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <TextField {...field} select fullWidth size="small" sx={fieldSx}>
                  <MenuItem value=""><em>Select type</em></MenuItem>
                  {LOCATION_TYPES.map((t) => (
                    <MenuItem key={t} value={t}>{t}</MenuItem>
                  ))}
                </TextField>
              )}
            />
          </FormField>

          {/* Floor + Capacity + Area */}
          <Grid container spacing={2}>
            <Grid size={4}>
              <FormField label="Floor No.">
                <TextField
                  {...register('floorNumber')}
                  fullWidth size="small" type="number"
                  placeholder="3"
                  sx={fieldSx}
                />
              </FormField>
            </Grid>
            <Grid size={4}>
              <FormField label="Capacity">
                <TextField
                  {...register('capacity')}
                  fullWidth size="small" type="number"
                  placeholder="50"
                  sx={fieldSx}
                />
              </FormField>
            </Grid>
            <Grid size={4}>
              <FormField label="Area (sqft)">
                <TextField
                  {...register('areaSqft')}
                  fullWidth size="small" type="number"
                  placeholder="1200"
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
              placeholder="Brief description of this location..."
              sx={fieldSx}
            />
          </FormField>

        </Box>
      </FormDrawer>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete Location"
        message={`Are you sure you want to delete "${confirmDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        severity="error"
        loading={deleteMutation.isPending}
        onConfirm={() => confirmDelete && deleteMutation.mutate(confirmDelete.id)}
        onCancel={() => setConfirmDelete(null)}
      />

      <ConfirmDialog
        open={!!confirmToggle}
        title={confirmToggle?.isActive ? 'Deactivate Location' : 'Activate Location'}
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

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2, backgroundColor: '#ffffff', fontSize: '0.875rem',
    '& fieldset':             { borderColor: '#e2e0db' },
    '&:hover fieldset':       { borderColor: '#c8c5bf' },
    '&.Mui-focused fieldset': { borderColor: '#01696f', borderWidth: '1.5px' },
  },
};