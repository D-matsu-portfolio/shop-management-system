import React, { useState, useContext } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Box, Drawer as MuiDrawer, AppBar as MuiAppBar, Toolbar, Typography, List, ListItem, ListItemButton, 
  ListItemIcon, ListItemText, Collapse, useTheme, IconButton, Button, CssBaseline, Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
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
import DashboardIcon from '@mui/icons-material/Dashboard';

const drawerWidth = 240;

const openedMixin = (theme) => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme) => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(({ theme, open }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  ...(open && {
    ...openedMixin(theme),
    '& .MuiDrawer-paper': openedMixin(theme),
  }),
  ...(!open && {
    ...closedMixin(theme),
    '& .MuiDrawer-paper': closedMixin(theme),
  }),
}));


// Define a reusable NavItem component for top-level links
function NavItem({ item, open, onLinkClick }) {
  return (
    <ListItem disablePadding sx={{ display: 'block' }}>
      <ListItemButton
        component={RouterLink}
        to={item.path}
        onClick={onLinkClick}
        sx={{ minHeight: 48, justifyContent: open ? 'initial' : 'center', px: 2.5, color: 'inherit', textDecoration: 'none' }}
      >
        <ListItemIcon sx={{ minWidth: 0, mr: open ? 3 : 'auto', justifyContent: 'center' }}>{item.icon}</ListItemIcon>
        <ListItemText primary={item.text} sx={{ opacity: open ? 1 : 0 }} />
      </ListItemButton>
    </ListItem>
  );
}

// Define a reusable SubMenu component
function SubMenu({ item, open, onLinkClick }) {
  const [subMenuOpen, setSubMenuOpen] = useState(false);
  const handleClick = () => {
    setSubMenuOpen(!subMenuOpen);
  };

  return (
    <>
      <ListItemButton sx={{ minHeight: 48, justifyContent: open ? 'initial' : 'center', px: 2.5 }} onClick={handleClick}>
        <ListItemIcon sx={{ minWidth: 0, mr: open ? 3 : 'auto', justifyContent: 'center' }}>{item.icon}</ListItemIcon>
        <ListItemText primary={item.text} sx={{ opacity: open ? 1 : 0 }} />
        {open ? (subMenuOpen ? <ExpandLess /> : <ExpandMore />) : null}
      </ListItemButton>
      <Collapse in={subMenuOpen && open} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {item.subItems.map((subItem) => (
            <ListItem key={subItem.text} disablePadding sx={{ display: 'block' }}>
                <ListItemButton
                    component={RouterLink}
                    to={subItem.path}
                    onClick={onLinkClick}
                    sx={{ pl: 4, color: 'inherit', textDecoration: 'none' }}
                >
                    <ListItemIcon>{subItem.icon}</ListItemIcon>
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
        type: 'item',
        text: 'ダッシュボード',
        path: '/',
        icon: <DashboardIcon />,
    },
    {
        type: 'submenu',
        text: '顧客・車両',
        icon: <PeopleIcon />,
        subItems: [
          { text: '顧客管理', path: '/customers', icon: <PeopleIcon /> },
          { text: '世帯管理', path: '/households', icon: <HouseIcon /> },
          { text: '車両管理', path: '/vehicles', icon: <DirectionsCarIcon /> },
        ],
      },
      {
        type: 'submenu',
        text: '伝票管理',
        icon: <DescriptionIcon />,
        subItems: [
          { text: '見積もり管理', path: '/estimates', icon: <ReceiptIcon /> },
          { text: '請求書管理', path: '/invoices', icon: <DescriptionIcon /> },
        ],
      },
      {
        type: 'submenu',
        text: 'マスタ設定',
        icon: <BuildIcon />,
        subItems: [
          { text: '部品マスタ', path: '/parts', icon: <ExtensionIcon /> },
          { text: '作業マスタ', path: '/services', icon: <MiscellaneousServicesIcon /> },
          { text: '法定費用マスタ', path: '/statutory-costs', icon: <GavelIcon /> },
        ],
      },
       {
        type: 'submenu',
        text: 'その他',
        icon: <MiscellaneousServicesIcon />,
        subItems: [
            { text: 'CSVインポート', path: '/import', icon: <CloudUploadIcon /> },
        ]
      }
];

export default function Layout() {
  const [open, setOpen] = useState(true);
  const { isAuthenticated, logout } = useContext(AuthContext);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const drawerContent = (
    <List>
      {menuGroups.map((item) => {
        if (item.type === 'item') {
          return <NavItem item={item} key={item.text} open={open} />;
        } else if (item.type === 'submenu') {
          return <SubMenu item={item} key={item.text} open={open} />;
        }
        return null;
      })}
    </List>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" open={open} className="no-print">
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{ mr: 2, ...(open && { display: 'none' }) }}
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
      <Drawer variant="permanent" open={open} className="no-print">
        <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', px: [1] }}>
          <IconButton onClick={handleDrawerClose}>
            <ChevronLeftIcon />
          </IconButton>
        </Toolbar>
        <Divider />
        {drawerContent}
      </Drawer>
    </Box>
  );
}
