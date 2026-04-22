import {
  Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions,
  Button, CircularProgress, Box,
} from '@mui/material';
import { TriangleAlert } from 'lucide-react';

interface ConfirmDialogProps {
  open:        boolean;
  title:       string;
  message:     string;
  confirmText?: string;
  cancelText?:  string;
  severity?:   'error' | 'warning' | 'info';
  loading?:    boolean;
  onConfirm:   () => void;
  onCancel:    () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = 'Confirm',
  cancelText  = 'Cancel',
  severity    = 'error',
  loading     = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const colors = {
    error:   '#a12c7b',
    warning: '#964219',
    info:    '#01696f',
  };
  const color = colors[severity];

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onCancel}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            border:       '1px solid #e8e6e2',
            boxShadow:    '0 8px 32px rgba(0,0,0,0.10)',
          },
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width:           36,
              height:          36,
              borderRadius:    10,
              backgroundColor: `${color}15`,
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              color,
              flexShrink:      0,
            }}
          >
            <TriangleAlert size={18} />
          </Box>
          <Box
            sx={{
              fontSize:      '0.9375rem',
              fontWeight:    700,
              color:         '#1a1917',
              letterSpacing: '-0.2px',
            }}
          >
            {title}
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 0.5 }}>
        <DialogContentText sx={{ fontSize: '0.8125rem', color: '#6b6966', lineHeight: 1.6 }}>
          {message}
        </DialogContentText>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button
          onClick={onCancel}
          disabled={loading}
          size="small"
          variant="outlined"
          sx={{
            borderRadius:  2,
            fontSize:      '0.8125rem',
            fontWeight:    600,
            textTransform: 'none',
            borderColor:   '#e2e0db',
            color:         '#3a3937',
            px:            2,
            '&:hover': { borderColor: '#c8c5bf', backgroundColor: '#00000005' },
          }}
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          size="small"
          variant="contained"
          startIcon={loading ? <CircularProgress size={13} color="inherit" /> : undefined}
          sx={{
            borderRadius:    2,
            fontSize:        '0.8125rem',
            fontWeight:      600,
            textTransform:   'none',
            backgroundColor: color,
            px:              2,
            '&:hover':    { backgroundColor: color, filter: 'brightness(0.9)' },
            '&:disabled': { backgroundColor: `${color}80` },
          }}
        >
          {loading ? 'Please wait…' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}