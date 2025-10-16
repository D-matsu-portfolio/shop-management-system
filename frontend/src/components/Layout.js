import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Drawer, AppBar, Toolbar, Typography, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import BuildIcon from '@mui/icons-material/Build';

import ReceiptIcon from '@mui/icons-material/Receipt';

import ExtensionIcon from '@mui/icons-material/Extension';
import MiscellaneousServicesIcon from '@mui/icons-material/MiscellaneousServices';
import DescriptionIcon from '@mui/icons-material/Description';

import HouseIcon from '@mui/icons-material/House';

const drawerWidth = 240;

const menuItems = [
  { text: '顧客管理', icon: <PeopleIcon />, path: '/customers' },
  { text: '世帯管理', icon: <HouseIcon />, path: '/households' },
  { text: '車両管理', icon: <DirectionsCarIcon />, path: '/vehicles' },
  { text: '見積もり管理', icon: <ReceiptIcon />, path: '/estimates' },
  { text: '請求書管理', icon: <DescriptionIcon />, path: '/invoices' },
  { text: '部品マスタ管理', icon: <ExtensionIcon />, path: '/parts' },
  { text: '作業マスタ管理', icon: <MiscellaneousServicesIcon />, path: '/services' },
];

export default function Layout({ children }) {
  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{ width: `calc(100% - ${drawerWidth}px)`, ml: `${drawerWidth}px` }}
        className="no-print"
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            自動車整備管理システム
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
        variant="permanent"
        anchor="left"
        className="no-print"
      >
        <Toolbar />
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding component={RouterLink} to={item.path} sx={{ color: 'inherit', textDecoration: 'none' }}>
              <ListItemButton>
                <ListItemIcon>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>
      <Box
        component="main"
        sx={{ flexGrow: 1, bgcolor: 'background.default', p: 3 }}
      >
        <Toolbar /> 
        {children}
      </Box>
    </Box>
  );
}
