import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, IconButton, Avatar,
  Divider, Menu, MenuItem, Chip, useMediaQuery, useTheme,
} from '@mui/material';
import {
  Dashboard as DashboardIcon, Groups as TeamsIcon,
  EmojiEvents as AchievementsIcon, AdminPanelSettings as AdminIcon,
  Menu as MenuIcon, Logout as LogoutIcon, Person as PersonIcon,
  ChevronLeft as ChevronLeftIcon, Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const DRAWER_WIDTH = 260;

const navItems = [
  { text: 'Dashboard', path: '/', icon: <DashboardIcon />, roles: ['admin', 'manager', 'contributor', 'viewer'] },
  { text: 'Teams', path: '/teams', icon: <TeamsIcon />, roles: ['admin', 'manager', 'contributor', 'viewer'] },
  { text: 'Achievements', path: '/achievements', icon: <AchievementsIcon />, roles: ['admin', 'manager', 'contributor', 'viewer'] },
  { text: 'Analytics', path: '/analytics', icon: <AnalyticsIcon />, roles: ['admin', 'manager', 'contributor', 'viewer'] },
  { text: 'Admin Panel', path: '/admin', icon: <AdminIcon />, roles: ['admin'] },
];

const roleColors = {
  admin: 'error',
  manager: 'warning',
  contributor: 'info',
  viewer: 'default',
};

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const visibleItems = navItems.filter(item => item.roles.includes(user?.role));

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{
          width: 40, height: 40, borderRadius: 2,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 18, color: '#fff',
        }}>
          A
        </Box>
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#e2e8f0', lineHeight: 1.2 }}>
            ACME Inc.
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
            Team Management
          </Typography>
        </Box>
        {isMobile && (
          <IconButton onClick={() => setMobileOpen(false)} sx={{ ml: 'auto' }}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

      {/* Nav items */}
      <List sx={{ flex: 1, px: 1.5, py: 2 }}>
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => { navigate(item.path); if (isMobile) setMobileOpen(false); }}
                sx={{
                  borderRadius: 2,
                  py: 1.2,
                  backgroundColor: isActive ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                  '&:hover': { backgroundColor: 'rgba(99, 102, 241, 0.08)' },
                  '& .MuiListItemIcon-root': {
                    color: isActive ? '#818cf8' : '#64748b',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? '#e2e8f0' : '#94a3b8',
                  }}
                />
                {isActive && (
                  <Box sx={{
                    width: 4, height: 24, borderRadius: 2,
                    background: 'linear-gradient(180deg, #6366f1, #8b5cf6)',
                  }} />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

      {/* User section */}
      <Box sx={{ p: 2 }}>
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1.5,
          p: 1.5, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.03)',
        }}>
          <Avatar sx={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            fontSize: '0.875rem', fontWeight: 700,
          }}>
            {user?.name?.charAt(0) || 'U'}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#e2e8f0' }} noWrap>
              {user?.name}
            </Typography>
            <Chip
              label={user?.role}
              size="small"
              color={roleColors[user?.role] || 'default'}
              sx={{ height: 20, fontSize: '0.65rem', mt: 0.3 }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
        >
          {drawer}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH },
          }}
        >
          {drawer}
        </Drawer>
      )}

      {/* Main content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top bar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            backgroundColor: 'rgba(10, 14, 26, 0.8)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <Toolbar>
            {isMobile && (
              <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 2 }}>
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="h6" sx={{ flex: 1, fontWeight: 600, fontSize: '1.1rem' }}>
              {visibleItems.find(i => location.pathname === i.path ||
                (i.path !== '/' && location.pathname.startsWith(i.path)))?.text || 'Dashboard'}
            </Typography>
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
              <Avatar sx={{
                width: 34, height: 34,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                fontSize: '0.85rem', fontWeight: 700,
              }}>
                {user?.name?.charAt(0)}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
            >
              <MenuItem disabled>
                <PersonIcon sx={{ mr: 1 }} /> {user?.name}
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => { logout(); navigate('/login'); setAnchorEl(null); }}>
                <LogoutIcon sx={{ mr: 1 }} /> Logout
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* Page content */}
        <Box sx={{ flex: 1, p: { xs: 2, sm: 3 }, overflow: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
