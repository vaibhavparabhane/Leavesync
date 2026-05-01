'use client';

import { Box, Drawer, AppBar, Toolbar, List, ListItemButton, ListItemIcon, ListItemText, Menu, MenuItem, Typography, IconButton, useMediaQuery, useTheme } from '@mui/material';
import Image from 'next/image';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import PeopleIcon from '@mui/icons-material/People';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import DescriptionIcon from '@mui/icons-material/Description';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import EventIcon from '@mui/icons-material/Event';
import LeaveIcon from '@mui/icons-material/EventNote';

import { ReactNode, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { TYPOGRAPHY } from '@/config/typography';
import { dashboardLayoutStyles } from '@/config/styles';

const drawerWidth = 240;

const menuItemsByRole = {
  employee: [
    { text: 'Dashboard', path: '/dashboard/employee', icon: <DashboardIcon /> },
    { text: 'History', path: '/dashboard/employee/leaves', icon: <AssignmentIcon /> },
    { text: 'My Leave', path: '/dashboard/employee/apply', icon: <EventAvailableIcon /> },
  ],
  admin: [
    { text: 'Dashboard', path: '/dashboard/admin', icon: <DashboardIcon /> },
    { text: 'Edit Balance Leave', path: '/dashboard/admin/editleavebalance', icon: <EventAvailableIcon /> },
    { text: 'Edit User', path: '/dashboard/admin/edituser', icon: <PeopleIcon /> },
    { text: 'Permissions', path: '/dashboard/admin/employeemanagement/permissionmanagement', icon: <AdminPanelSettingsIcon /> },
    { text: 'Pending Approval', path: '/dashboard/admin/leavemanagement/approvals', icon: <AssignmentIcon /> },
    { text: 'Leaves History', path: '/dashboard/admin/leavemanagement/employeeleaves', icon: <LeaveIcon /> },
    { text: 'Create Leave', path: '/dashboard/admin/leavemanagement/leavetypes', icon: <DescriptionIcon /> },
    { text: 'Create User', path: '/dashboard/admin/createuser', icon: <PeopleIcon /> },
    { text: 'Create Holiday', path: '/dashboard/admin/holidays', icon: <EventIcon /> },
  ],
  hr: [
    { text: 'Dashboard', path: '/dashboard/hr', icon: <DashboardIcon /> },
    { text: 'Leave History', path: '/dashboard/hr/history', icon: <LeaveIcon /> },
    { text: 'Pending Leaves', path: '/dashboard/hr/approvals', icon: <AssignmentIcon /> },
    { text: 'Apply Leave', path: '/dashboard/hr/apply', icon: <PeopleIcon /> },
  ],
};

type DashboardLayoutProps = {
  children: ReactNode;
  role: 'employee' | 'admin' | 'hr';
};

export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const menuItems = menuItemsByRole[role];
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
  };

  const handleUserMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const drawerContent = (
    <>
      <Toolbar sx={{ justifyContent: 'center', mb: 2, position: 'relative', py: 3 }}>
        {isMobile && (
          <IconButton
            onClick={handleDrawerToggle}
            sx={{ position: 'absolute', right: 8, color: '#ffffff' }}
          >
            <CloseIcon />
          </IconButton>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Image
            src="/devangles.png"
            alt="DevAngles"
            width={isMobile ? 140 : 180}
            height={isMobile ? 56 : 72}
            style={{ objectFit: 'contain' }}
          />
        </Box>
      </Toolbar>

      <List>
        {menuItems.map((item, index) => (
          <ListItemButton
            key={item.text + '-' + index}
            selected={pathname === item.path}
            onClick={() => router.push(item.path)}
            sx={{
              cursor: 'pointer',
              py: 1.5,
              '&.Mui-selected': {
                backgroundColor: '#2c5282',
              },
              '&:hover': {
                backgroundColor: '#2c4a6e',
              },
            }}
          >
            <ListItemIcon sx={{ color: '#ffffff', minWidth: 45 }}>{item.icon}</ListItemIcon>
            <ListItemText 
              primary={item.text}
              primaryTypographyProps={{
                sx: TYPOGRAPHY.SIDEBAR_ITEM
              }}
            />
          </ListItemButton>
        ))}
      </List>
    </>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
        sx={{
          display: { xs: 'block', sm: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: '#1e3a5f',
            color: '#ffffff',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'none', md: 'block' },
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: '#1e3a5f',
            color: '#ffffff',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      <Box sx={{ flexGrow: 1 }}>
        <AppBar
          position="fixed"
          sx={{
            width: { xs: '100%', sm: '100%', md: `calc(100% - ${drawerWidth}px)` },
            ml: { xs: 0, sm: 0, md: `${drawerWidth}px` },
            backgroundColor: '#ffffff',
            color: '#000',
            boxShadow: 1,
          }}
        >
          <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', pl: { xs: 1, sm: 1, md: 2 } }}>
            <Box display="flex" alignItems="center" gap={2}>
              {isMobile && (
                <IconButton
                  color="inherit"
                  aria-label="open drawer"
                  edge="start"
                  onClick={handleDrawerToggle}
                  sx={{ mr: 1 }}
                >
                  <MenuIcon />
                </IconButton>
              )}
              {menuItems
                .filter((item) => pathname === item.path)
                .map((item) => (
                  <Typography
                    key={item.text}
                    variant="h5"
                    sx={{
                      ...TYPOGRAPHY.PAGE_TITLE,
                      color: 'primary.main',
                      fontSize: { xs: '1.1rem', sm: '1.5rem', md: '1.75rem' },
                    }}
                  >
                    {item.text}
                  </Typography>
                ))}
            </Box>

            <Box display="flex" alignItems="center">
              <Box display="flex" alignItems="center" sx={{ cursor: 'pointer' }} onClick={handleUserMenuClick}>
                <AccountCircleIcon sx={{ color: 'black', fontSize: { xs: 28, sm: 32 } }} />
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    color: 'black', 
                    ml: 0.5, 
                    ...TYPOGRAPHY.BODY_TEXT, 
                    fontWeight: 600,
                    display: { xs: 'none', sm: 'block' },
                  }}
                >
                  {user?.full_name || 'User'}
                </Typography>
              </Box>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleUserMenuClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                slotProps={{
                  paper: {
                    sx: {
                      '& .MuiMenuItem-root': {
                        ...TYPOGRAPHY.BODY_TEXT,
                      }
                    }
                  }
                }}
              >
                <MenuItem onClick={() => {
                  handleUserMenuClose();
                  const profilePath =
                    role === 'employee'
                      ? '/dashboard/employee/profile'
                      : role === 'hr'
                      ? '/dashboard/hr/profile'
                      : '/dashboard/admin/profile';
                  router.push(profilePath);
                }}>
                  My Profile
                </MenuItem>
                <MenuItem onClick={() => { handleUserMenuClose(); handleLogout(); }}>
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>

        <Box
          component="main"
          sx={{
            backgroundColor: '#f4f6f8',
            minHeight: '100vh',
            pt: { xs: 9, sm: 10, md: 10 },
            px: { xs: 2, sm: 2, md: 3 },
            pl: { xs: 2, sm: 2, md: 5 },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
