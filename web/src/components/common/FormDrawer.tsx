import {
  Drawer, Box, Typography,
  IconButton, Divider, Button, CircularProgress,
} from '@mui/material';
import { X } from 'lucide-react';

interface FormDrawerProps {
  open:          boolean;
  title:         string;
  subtitle?:     string;
  onClose:       () => void;
  onSubmit:      () => void;
  isSubmitting?: boolean;
  submitText?:   string;
  width?:        number;
  children:      React.ReactNode;
}

export default function FormDrawer({
  open,
  title,
  subtitle,
  onClose,
  onSubmit,
  isSubmitting = false,
  submitText   = 'Save',
  width        = 480,
  children,
}: FormDrawerProps) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={isSubmitting ? undefined : onClose}
      slotProps={{
        paper: {
          sx: {
            width,
            maxWidth:        '100vw',
            backgroundColor: '#fafaf8',
            border:          'none',
            boxShadow:       '-4px 0 24px rgba(0,0,0,0.07)',
            display:         'flex',
            flexDirection:   'column',
          },
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px:             3,
          py:             2.5,
          display:        'flex',
          alignItems:     'flex-start',
          justifyContent: 'space-between',
          gap:            2,
          flexShrink:     0,
        }}
      >
        <Box>
          <Typography
            sx={{ fontSize: '1rem', fontWeight: 700, color: '#1a1917', letterSpacing: '-0.2px' }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography sx={{ fontSize: '0.8rem', color: '#9a9894', mt: 0.25 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <IconButton
          onClick={onClose}
          disabled={isSubmitting}
          size="small"
          sx={{ color: '#9a9894', mt: -0.25 }}
        >
          <X size={18} />
        </IconButton>
      </Box>

      <Divider sx={{ borderColor: '#e8e6e2' }} />

      {/* Scrollable content */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 3 }}>
        {children}
      </Box>

      <Divider sx={{ borderColor: '#e8e6e2' }} />

      {/* Footer */}
      <Box
        sx={{
          px:          3,
          py:          2,
          display:     'flex',
          gap:         1.5,
          justifyContent: 'flex-end',
          flexShrink:  0,
          backgroundColor: '#f5f4f0',
        }}
      >
        <Button
          onClick={onClose}
          disabled={isSubmitting}
          variant="outlined"
          size="small"
          sx={{
            borderRadius:  2,
            fontSize:      '0.8125rem',
            fontWeight:    600,
            textTransform: 'none',
            px:            2.5,
            borderColor:   '#e2e0db',
            color:         '#3a3937',
            '&:hover': { borderColor: '#c8c5bf', backgroundColor: '#00000005' },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={onSubmit}
          disabled={isSubmitting}
          variant="contained"
          size="small"
          startIcon={isSubmitting ? <CircularProgress size={13} color="inherit" /> : undefined}
          sx={{
            borderRadius:    2,
            fontSize:        '0.8125rem',
            fontWeight:      600,
            textTransform:   'none',
            px:              2.5,
            backgroundColor: '#01696f',
            '&:hover':    { backgroundColor: '#0c4e54' },
            '&:disabled': { backgroundColor: '#01696f80' },
          }}
        >
          {isSubmitting ? 'Saving…' : submitText}
        </Button>
      </Box>
    </Drawer>
  );
}