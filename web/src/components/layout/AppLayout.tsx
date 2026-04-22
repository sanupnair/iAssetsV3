import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar  from './Topbar';
import { useUIStore } from '@/store/uiStore';

const SIDEBAR_WIDTH         = 260;
const SIDEBAR_COLLAPSED_WIDTH = 72;

export default function AppLayout() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const width       = sidebarOpen ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED_WIDTH;

  return (
    <Box
      sx={{
        display:         'flex',
        height:          '100vh',
        backgroundColor: '#f5f4f0',
        overflow:        'hidden',
      }}
    >
      {/* Sidebar */}
      <Sidebar
        width={width}
        collapsed={!sidebarOpen}
        SIDEBAR_WIDTH={SIDEBAR_WIDTH}
        SIDEBAR_COLLAPSED_WIDTH={SIDEBAR_COLLAPSED_WIDTH}
      />

      {/* Main area */}
      <Box
        sx={{
          display:       'flex',
          flexDirection: 'column',
          flex:          1,
          minWidth:      0,
          overflow:      'hidden',
          transition:    'all 0.2s ease',
        }}
      >
        <Topbar />

        {/* Page content */}
        <Box
          component="main"
          sx={{
            flex:       1,
            overflow:   'auto',
            px:         3,
            py:         3,
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}