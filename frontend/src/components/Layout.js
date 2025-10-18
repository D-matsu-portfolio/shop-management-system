import React, { useState, useContext } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItem, ListItemButton, 
  ListItemIcon, ListItemText, Collapse, useTheme, useMediaQuery, IconButton, Button
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import PeopleIcon from '@mui/icons-material/People';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import BuildIcon from '@mui/icons-material/Build';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ExtensionIcon from '@mui/icons-material/Extension';
import MiscellaneousServicesIcon from '@mui/icons-material/MiscellaneousServices';
import DescriptionIcon from '@mui/icons-material/Description';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import GavelIcon from '@mui/icons-material/Gavel';
import HouseIcon from '@mui/icons-material/House';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { AuthContext } from '../context/AuthContext';
import LogoutIcon from '@mui/icons-material/Logout';

const drawerWidth = 240;

// Define a reusable SubMenu component
function SubMenu({ item, onLinkClick }) {
  const [open, setOpen] = useState(false);
  const handleClick = () => {
    setOpen(!open);
  };

  return (
    <>
      <ListItemButton onClick={handleClick}>
        <ListItemIcon>{item.icon}</ListItemIcon>
        <ListItemText primary={item.text} />
        {open ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {item.subItems.map((subItem) => (
            <ListItem key={subItem.text} disablePadding component={RouterLink} to={subItem.path} sx={{ color: 'inherit', textDecoration: 'none', pl: 4 }} onClick={onLinkClick}>
              <ListItemButton>
                <ListItemIcon>
                  {subItem.icon}
                </ListItemIcon>
                <ListItemText primary={subItem.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Collapse>
    </>
  );
}

const menuGroups = [
    {
        text: '顧客・車両',
        icon: <PeopleIcon />,
        subItems: [
          { text: '顧客管理', path: '/customers', icon: <PeopleIcon /> },
          { text: '世帯管理', path: '/households', icon: <HouseIcon /> },
          { text: '車両管理', path: '/vehicles', icon: <DirectionsCarIcon /> },
        ],
      },
      {
        text: '伝票管理',
        icon: <DescriptionIcon />,
        subItems: [
          { text: '見積もり管理', path: '/estimates', icon: <ReceiptIcon /> },
          { text: '請求書管理', path: '/invoices', icon: <DescriptionIcon /> },
        ],
      },
      {
        text: 'マスタ設定',
        icon: <BuildIcon />,
        subItems: [
          { text: '部品マスタ', path: '/parts', icon: <ExtensionIcon /> },
          { text: '作業マスタ', path: '/services', icon: <MiscellaneousServicesIcon /> },
          { text: '法定費用マスタ', path: '/statutory-costs', icon: <GavelIcon /> },
        ],
      },
       {
        text: 'その他',
        icon: <MiscellaneousServicesIcon />,
        subItems: [
            { text: 'CSVインポート', path: '/import', icon: <CloudUploadIcon /> },
        ]
      }
];

export default function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isAuthenticated, logout } = useContext(AuthContext);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLinkClick = () => {
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const drawerContent = (
    <div>
      <Toolbar />
      <List>
        {menuGroups.map((item) => (
          <SubMenu item={item} key={item.text} onLinkClick={handleLinkClick} />
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
        className="no-print"
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component={RouterLink} to="/" sx={{ flexGrow: 1, color: 'inherit', textDecoration: 'none' }}>
            自動車整備管理システム
          </Typography>
          {isAuthenticated && (
            <Button color="inherit" onClick={logout} startIcon={<LogoutIcon />}>
              ログアウト
            </Button>
          )}
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="mailbox folders"
        className="no-print"
      >
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
          >
            {drawerContent}
          </Drawer>
        ) : (
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', md: 'block' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
            open
          >
            {drawerContent}
          </Drawer>
        )}
      </Box>
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, width: { md: `calc(100% - ${drawerWidth}px)` } }}
      >
        <Toolbar /> 
        {children}
      </Box>
    </Box>
  );
}
