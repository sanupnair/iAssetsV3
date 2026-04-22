import {
  Box, Typography, Avatar, IconButton,
  Menu, MenuItem, Divider, Tooltip,
} from '@mui/material';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PanelLeftClose, PanelLeftOpen, Sun, Moon, LogOut, User } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore   } from '@/store/uiStore';
import { authApi      } from '@/api/endpoints/auth';
import { formatInitials } from '@/utils/formatters';
import toast from 'react-hot-toast';

// ── Breadcrumb map ────────────────────────────────────────────
const BREADCRUMBS: Record<string, string> = {
  '/':                              'Dashboard',
  '/control-panel/organizations':   'Organizations',
  '/control-panel/branches':        'Branches',
  '/control-panel/locations':       'Locations',
  '/control-panel/departments':     'Departments',
  '/control-panel/designations':    'Designations',
  '/control-panel/roles':           'Roles & Permissions',
  '/control-panel/users':           'Users',
};

export default function Topbar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const user      = useAuthStore((s) => s.user);
  const logout    = useAuthStore((s) => s.logout);
  const { sidebarOpen, toggleSidebar, themeMode, setThemeMode } = useUIStore();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const pageTitle = BREADCRUMBS[location.pathname] ?? 'iAssets';

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    } finally {
      logout();
      navigate('/login');
      toast.success('Logged out successfully');
    }
  };

  const toggleTheme = () => {
    setThemeMode(themeMode === 'dark' ? 'light' : 'dark');
  };

  return (
    <Box
      sx={{
        height:          56,
        display:         'flex',
        alignItems:      'center',
        px:              2,
        backgroundColor: '#f5f4f0',
        flexShrink:      0,
        gap:             1,
      }}
    >
      {/* Sidebar toggle */}
      <Tooltip title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}>
        <IconButton onClick={toggleSidebar} size="small" sx={{ color: '#6b6966' }}>
          {sidebarOpen
            ? <PanelLeftClose size={18} />
            : <PanelLeftOpen  size={18} />
          }
        </IconButton>
      </Tooltip>

      {/* Page title */}
      <Typography
        sx={{
          fontSize:      '0.9375rem',
          fontWeight:    600,
          color:         '#1a1917',
          flex:          1,
          ml:            1,
          letterSpacing: '-0.2px',
        }}
      >
        {pageTitle}
      </Typography>

      {/* Theme toggle */}
      <Tooltip title={themeMode === 'dark' ? 'Light mode' : 'Dark mode'}>
        <IconButton onClick={toggleTheme} size="small" sx={{ color: '#6b6966' }}>
          {themeMode === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </IconButton>
      </Tooltip>

      {/* Avatar / user menu */}
      <Tooltip title={user?.displayName ?? 'Account'}>
        <IconButton
          onClick={(e) => setAnchorEl(e.currentTarget)}
          size="small"
          sx={{ ml: 0.5 }}
        >
          <Avatar
            src={user?.avatarUrl ?? undefined}
            sx={{
              width:           32,
              height:          32,
              fontSize:        '0.75rem',
              fontWeight:      700,
              backgroundColor: '#01696f',
              color:           '#fff',
            }}
          >
            {formatInitials(user?.displayName ?? user?.firstName ?? 'U')}
          </Avatar>
        </IconButton>
      </Tooltip>

      {/* Dropdown menu */}
     <Menu
  anchorEl={anchorEl}
  open={Boolean(anchorEl)}
  onClose={() => setAnchorEl(null)}
  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
  anchorOrigin={  { horizontal: 'right', vertical: 'bottom' }}
  slotProps={{
    paper: {
      sx: {
        mt:           1,
        minWidth:     200,
        borderRadius: 2,
        border:       '1px solid #e8e6e2',
        boxShadow:    '0 4px 16px rgba(0,0,0,0.08)',
      },
    },
  }}

      >
        {/* User info */}
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#1a1917' }}>
            {user?.displayName}
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: '#9a9894' }}>
            {user?.email}
          </Typography>
          <Typography
            sx={{
              mt:              0.5,
              fontSize:        '0.6875rem',
              color:           '#01696f',
              fontWeight:      600,
              textTransform:   'uppercase',
              letterSpacing:   '0.06em',
            }}
          >
            {user?.roleCode}
          </Typography>
        </Box>

        <Divider sx={{ borderColor: '#e8e6e2' }} />

        <MenuItem
          onClick={() => { setAnchorEl(null); }}
          sx={{ fontSize: '0.8125rem', gap: 1.5, py: 1, color: '#3a3937' }}
        >
          <User size={15} /> My Profile
        </MenuItem>

        <Divider sx={{ borderColor: '#e8e6e2' }} />

        <MenuItem
          onClick={handleLogout}
          sx={{ fontSize: '0.8125rem', gap: 1.5, py: 1, color: '#a12c7b' }}
        >
          <LogOut size={15} /> Sign out
        </MenuItem>
      </Menu>
    </Box>
  );
}