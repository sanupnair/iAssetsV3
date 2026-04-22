import { Box, Typography, Button, Breadcrumbs, Link } from '@mui/material';
import { Plus } from 'lucide-react';

interface Action {
  label:   string;
  onClick: () => void;
  icon?:   React.ReactNode;
  variant?:'contained' | 'outlined' | 'text';
}

interface PageHeaderProps {
  title:        string;
  subtitle?:    string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?:     Action[];
}

export default function PageHeader({ title, subtitle, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <Box sx={{ mb: 3 }}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs sx={{ mb: 1 }} aria-label="breadcrumb">
          {breadcrumbs.map((crumb, i) =>
            crumb.href && i < breadcrumbs.length - 1 ? (
              <Link
                key={crumb.label}
                href={crumb.href}
                underline="hover"
                sx={{ fontSize: '0.75rem', color: '#9a9894' }}
              >
                {crumb.label}
              </Link>
            ) : (
              <Typography
                key={crumb.label}
                sx={{ fontSize: '0.75rem', color: i === breadcrumbs.length - 1 ? '#3a3937' : '#9a9894' }}
              >
                {crumb.label}
              </Typography>
            ),
          )}
        </Breadcrumbs>
      )}

      {/* Title row */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Typography
            sx={{ fontSize: '1.125rem', fontWeight: 700, color: '#1a1917', letterSpacing: '-0.3px' }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography sx={{ fontSize: '0.8125rem', color: '#9a9894', mt: 0.25 }}>
              {subtitle}
            </Typography>
          )}
        </Box>

        {/* Actions */}
        {actions && actions.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1.5, flexShrink: 0 }}>
            {actions.map((action) => (
              <Button
                key={action.label}
                variant={action.variant ?? 'contained'}
                onClick={action.onClick}
                startIcon={action.icon ?? (action.variant === 'contained' ? <Plus size={16} /> : undefined)}
                size="small"
                sx={{
                  borderRadius:    2,
                  fontSize:        '0.8125rem',
                  fontWeight:      600,
                  px:              2,
                  py:              0.875,
                  textTransform:   'none',
                  backgroundColor: action.variant === 'contained' || !action.variant ? '#01696f' : undefined,
                  '&:hover': {
                    backgroundColor: action.variant === 'contained' || !action.variant ? '#0c4e54' : undefined,
                  },
                }}
              >
                {action.label}
              </Button>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}