import { Chip } from '@mui/material';

interface StatusChipProps {
  active:       boolean;
  activeLabel?:  string;
  inactiveLabel?:string;
  size?:        'small' | 'medium';
}

export default function StatusChip({
  active,
  activeLabel   = 'Active',
  inactiveLabel = 'Inactive',
  size          = 'small',
}: StatusChipProps) {
  return (
    <Chip
      label={active ? activeLabel : inactiveLabel}
      size={size}
      sx={{
        fontSize:        '0.6875rem',
        fontWeight:      600,
        letterSpacing:   '0.03em',
        height:          22,
        borderRadius:    '6px',
        backgroundColor: active ? '#01696f18' : '#00000010',
        color:           active ? '#01696f'   : '#9a9894',
        border:          active ? '1px solid #01696f30' : '1px solid #dcd9d5',
        '& .MuiChip-label': { px: 1 },
      }}
    />
  );
}