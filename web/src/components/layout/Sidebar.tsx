import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Typography, Tooltip,
  Collapse, List, ListItemButton,
} from '@mui/material';
import {
  Building2, GitBranch, MapPin, Shield,
  Settings, ChevronDown, ChevronRight,
  LayoutDashboard, Layers, Briefcase, UserCog,
} from 'lucide-react';

interface SidebarProps {
  width:                  number;
  collapsed:              boolean;
  SIDEBAR_WIDTH:          number;
  SIDEBAR_COLLAPSED_WIDTH:number;
}

interface NavItem {
  label:    string;
  icon:     React.ReactNode;
  path?:    string;
  children?: { label: string; icon: React.ReactNode; path: string }[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    icon:  <LayoutDashboard size={18} />,
    path:  '/',
  },
  {
    label: 'Control Panel',
    icon:  <Settings size={18} />,
    children: [
      { label: 'Organizations', icon: <Building2  size={16} />, path: '/control-panel/organizations' },
      { label: 'Branches',      icon: <GitBranch  size={16} />, path: '/control-panel/branches'      },
      { label: 'Locations',     icon: <MapPin     size={16} />, path: '/control-panel/locations'     },
      { label: 'Departments',   icon: <Layers     size={16} />, path: '/control-panel/departments'   },
      { label: 'Designations',  icon: <Briefcase  size={16} />, path: '/control-panel/designations'  },
      { label: 'Roles',         icon: <Shield     size={16} />, path: '/control-panel/roles'         },
      { label: 'Users',         icon: <UserCog    size={16} />, path: '/control-panel/users'         },
    ],
  },
];

export default function Sidebar({ width, collapsed }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    'Control Panel': true,
  });

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isActive = (path: string) => location.pathname === path;
  const isGroupActive = (children: NavItem['children']) =>
    children?.some((c) => location.pathname.startsWith(c.path)) ?? false;

  return (
    <Box
      sx={{
        width,
        minWidth:        width,
        height:          '100vh',
        display:         'flex',
        flexDirection:   'column',
        backgroundColor: '#f5f4f0',
        borderRight:     'none',
        overflow:        'hidden',
        transition:      'width 0.2s ease, min-width 0.2s ease',
        pt:              2,
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          px:             collapsed ? 0 : 2.5,
          mb:             3,
          display:        'flex',
          alignItems:     'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap:            1.5,
        }}
      >
        {/* Logo mark */}
        <Box
          sx={{
            width:          36,
            height:         36,
            borderRadius:   10,
            backgroundColor:'#01696f',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            flexShrink:     0,
          }}
        >
          <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '1rem', letterSpacing: -0.5 }}>
            iA
          </Typography>
        </Box>

        {!collapsed && (
          <Box>
            <Typography
              sx={{
                fontWeight:    800,
                fontSize:      '1rem',
                color:         '#1a1917',
                letterSpacing: '-0.3px',
                lineHeight:    1.1,
              }}
            >
              iAssets
            </Typography>
            <Typography sx={{ fontSize: '0.65rem', color: '#9a9894', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Control Panel
            </Typography>
          </Box>
        )}
      </Box>

      {/* Nav */}
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', px: collapsed ? 1 : 1.5 }}>
        {NAV_ITEMS.map((item) => {
          if (item.path) {
            // Single item
            const active = isActive(item.path);
            return (
              <Tooltip key={item.label} title={collapsed ? item.label : ''} placement="right">
                <ListItemButton
                  onClick={() => navigate(item.path!)}
                  sx={{
                    borderRadius:    2,
                    mb:              0.5,
                    px:              collapsed ? 1.5 : 1.5,
                    py:              1,
                    justifyContent:  collapsed ? 'center' : 'flex-start',
                    backgroundColor: active ? '#01696f14' : 'transparent',
                    color:           active ? '#01696f'   : '#6b6966',
                    '&:hover': {
                      backgroundColor: active ? '#01696f1a' : '#00000008',
                      color:           active ? '#01696f'   : '#1a1917',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', color: 'inherit' }}>
                    {item.icon}
                  </Box>
                  {!collapsed && (
                    <Typography
                      sx={{
                        ml:         1.5,
                        fontSize:   '0.8125rem',
                        fontWeight: active ? 600 : 500,
                        color:      'inherit',
                      }}
                    >
                      {item.label}
                    </Typography>
                  )}
                </ListItemButton>
              </Tooltip>
            );
          }

          // Group item
          const groupActive = isGroupActive(item.children);
          const isOpen      = openGroups[item.label] ?? false;

          if (collapsed) {
            return (
              <Box key={item.label} sx={{ mb: 1 }}>
                {item.children?.map((child) => {
                  const childActive = location.pathname.startsWith(child.path);
                  return (
                    <Tooltip key={child.label} title={child.label} placement="right">
                      <ListItemButton
                        onClick={() => navigate(child.path)}
                        sx={{
                          borderRadius:    2,
                          mb:              0.5,
                          px:              1.5,
                          py:              1,
                          justifyContent:  'center',
                          backgroundColor: childActive ? '#01696f14' : 'transparent',
                          color:           childActive ? '#01696f'   : '#6b6966',
                          '&:hover': {
                            backgroundColor: '#00000008',
                            color:           '#1a1917',
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', color: 'inherit' }}>
                          {child.icon}
                        </Box>
                      </ListItemButton>
                    </Tooltip>
                  );
                })}
              </Box>
            );
          }

          return (
            <Box key={item.label} sx={{ mb: 0.5 }}>
              {/* Group header */}
              <ListItemButton
                onClick={() => toggleGroup(item.label)}
                sx={{
                  borderRadius: 2,
                  px:           1.5,
                  py:           0.875,
                  color:        groupActive ? '#01696f' : '#6b6966',
                  '&:hover': {
                    backgroundColor: '#00000008',
                    color:           '#1a1917',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', color: 'inherit' }}>
                  {item.icon}
                </Box>
                <Typography
                  sx={{
                    ml:         1.5,
                    fontSize:   '0.8125rem',
                    fontWeight: 600,
                    color:      'inherit',
                    flex:       1,
                  }}
                >
                  {item.label}
                </Typography>
                <Box sx={{ color: 'inherit', display: 'flex' }}>
                  {isOpen
                    ? <ChevronDown  size={14} />
                    : <ChevronRight size={14} />
                  }
                </Box>
              </ListItemButton>

              {/* Children */}
              <Collapse in={isOpen} timeout="auto">
                <List disablePadding sx={{ pl: 1.5 }}>
                  {item.children?.map((child) => {
                    const childActive = location.pathname.startsWith(child.path);
                    return (
                      <ListItemButton
                        key={child.label}
                        onClick={() => navigate(child.path)}
                        sx={{
                          borderRadius:    2,
                          mb:              0.25,
                          px:              1.5,
                          py:              0.75,
                          backgroundColor: childActive ? '#01696f14' : 'transparent',
                          color:           childActive ? '#01696f'   : '#6b6966',
                          '&:hover': {
                            backgroundColor: childActive ? '#01696f1a' : '#00000008',
                            color:           childActive ? '#01696f'   : '#1a1917',
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', color: 'inherit' }}>
                          {child.icon}
                        </Box>
                        <Typography
                          sx={{
                            ml:         1.25,
                            fontSize:   '0.8rem',
                            fontWeight: childActive ? 600 : 400,
                            color:      'inherit',
                          }}
                        >
                          {child.label}
                        </Typography>
                        {childActive && (
                          <Box
                            sx={{
                              ml:              'auto',
                              width:           4,
                              height:          4,
                              borderRadius:    '50%',
                              backgroundColor: '#01696f',
                            }}
                          />
                        )}
                      </ListItemButton>
                    );
                  })}
                </List>
              </Collapse>
            </Box>
          );
        })}
      </Box>

      {/* Version footer */}
      {!collapsed && (
        <Box sx={{ px: 2.5, py: 2, borderTop: '1px solid #e8e6e2' }}>
          <Typography sx={{ fontSize: '0.7rem', color: '#bab9b4' }}>
            iAssetsV3 · v1.0.0
          </Typography>
        </Box>
      )}
    </Box>
  );
}