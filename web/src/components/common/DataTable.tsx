import {
  Box, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow,
  TablePagination, CircularProgress,
  Typography, TextField, InputAdornment,
} from '@mui/material';
import { Search } from 'lucide-react';

interface Column<T> {
  key:       string;
  label:     string;
  width?:    number | string;
  align?:    'left' | 'center' | 'right';
  render?:   (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns:     Column<T>[];
  rows:        T[];
  loading?:    boolean;
  total?:      number;
  page?:       number;
  limit?:      number;
  search?:     string;
  onPageChange?:  (page: number)  => void;
  onLimitChange?: (limit: number) => void;
  onSearchChange?:(search: string)=> void;
  emptyText?:  string;
  rowKey:      (row: T) => string;
}

export default function DataTable<T>({
  columns,
  rows,
  loading        = false,
  total          = 0,
  page           = 1,
  limit          = 20,
  search         = '',
  onPageChange,
  onLimitChange,
  onSearchChange,
  emptyText      = 'No records found',
  rowKey,
}: DataTableProps<T>) {
  return (
    <Box
      sx={{
        backgroundColor: '#ffffff',
        borderRadius:    3,
        border:          '1px solid #e8e6e2',
        overflow:        'hidden',
      }}
    >
      {/* Search bar */}
      {onSearchChange && (
        <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid #f0ede9' }}>
          <TextField
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search…"
            size="small"
            sx={{
              width:    320,
              '& .MuiOutlinedInput-root': {
                borderRadius:    2,
                backgroundColor: '#f9f8f5',
                fontSize:        '0.8125rem',
                '& fieldset':         { borderColor: '#e8e6e2' },
                '&:hover fieldset':   { borderColor: '#c8c5bf' },
                '&.Mui-focused fieldset': { borderColor: '#01696f', borderWidth: '1.5px' },
              },
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={15} color="#9a9894" />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>
      )}

      {/* Table */}
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f9f8f5' }}>
              {columns.map((col) => (
                <TableCell
                  key={col.key}
                  align={col.align ?? 'left'}
                  width={col.width}
                  sx={{
                    fontSize:      '0.75rem',
                    fontWeight:    600,
                    color:         '#6b6966',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    borderBottom:  '1px solid #e8e6e2',
                    py:            1.5,
                    px:            2.5,
                    whiteSpace:    'nowrap',
                  }}
                >
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 6, border: 0 }}>
                  <CircularProgress size={28} sx={{ color: '#01696f' }} />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 6, border: 0 }}>
                  <Typography sx={{ fontSize: '0.8125rem', color: '#bab9b4' }}>
                    {emptyText}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={rowKey(row)}
                  sx={{
                    '&:hover': { backgroundColor: '#f9f8f5' },
                    '&:last-child td': { border: 0 },
                    transition: 'background-color 0.1s',
                  }}
                >
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      align={col.align ?? 'left'}
                      sx={{
                        fontSize:     '0.8125rem',
                        color:        '#3a3937',
                        borderBottom: '1px solid #f0ede9',
                        py:           1.25,
                        px:           2.5,
                      }}
                    >
                      {col.render
                        ? col.render(row)
                        : String((row as Record<string, unknown>)[col.key] ?? '—')}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {total > 0 && (
        <Box sx={{ borderTop: '1px solid #f0ede9' }}>
          <TablePagination
            component="div"
            count={total}
            page={page - 1}
            rowsPerPage={limit}
            rowsPerPageOptions={[10, 20, 50, 100]}
            onPageChange={(_, p) => onPageChange?.(p + 1)}
            onRowsPerPageChange={(e) => onLimitChange?.(Number(e.target.value))}
            sx={{
              fontSize: '0.8125rem',
              color:    '#6b6966',
              '& .MuiTablePagination-select': { fontSize: '0.8125rem' },
              '& .MuiTablePagination-displayedRows': { fontSize: '0.8125rem' },
            }}
          />
        </Box>
      )}
    </Box>
  );
}