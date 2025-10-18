import React, { useState, useEffect } from 'react';
import { Box, Grid, Paper, Typography, CircularProgress, List, ListItem, ListItemText, Divider, Button, Card, CardContent } from '@mui/material';
import { Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import PeopleIcon from '@mui/icons-material/People';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import ReceiptIcon from '@mui/icons-material/Receipt';
import DescriptionIcon from '@mui/icons-material/Description';

const StatCard = ({ title, value, icon }) => (
  <Card sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
    {icon}
    <Box sx={{ ml: 2 }}>
      <Typography variant="h6">{value}</Typography>
      <Typography variant="body2" color="text.secondary">{title}</Typography>
    </Box>
  </Card>
);

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await apiFetch('/api/dashboard/stats');
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <CircularProgress />;
  }

  if (!stats) {
    return <Typography>ダッシュボードデータの読み込みに失敗しました。</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>ダッシュボード</Typography>
      
      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}><StatCard title="総顧客数" value={stats.customerCount} icon={<PeopleIcon sx={{ fontSize: 40, color: 'primary.main' }} />} /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="総車両数" value={stats.vehicleCount} icon={<DirectionsCarIcon sx={{ fontSize: 40, color: 'secondary.main' }} />} /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="下書きの見積もり" value={stats.draftEstimatesCount} icon={<ReceiptIcon sx={{ fontSize: 40, color: 'warning.main' }} />} /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="未払いの請求書" value={stats.unpaidInvoicesCount} icon={<DescriptionIcon sx={{ fontSize: 40, color: 'error.main' }} />} /></Grid>
      </Grid>

      {/* Quick Actions */}
      <Box sx={{ mb: 3 }}>
        <Button component={Link} to="/estimates/new" variant="contained" sx={{ mr: 2 }}>新規見積もりを作成</Button>
        <Button component={Link} to="/customers" variant="outlined">新規顧客を追加</Button>
      </Box>

      {/* Recent Activities */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">最近作成された見積もり</Typography>
            <List>
              {stats.recentEstimates.map((item, index) => (
                <React.Fragment key={item.id}>
                  <ListItem button component={Link} to={`/estimates/${item.id}`}>
                    <ListItemText 
                      primary={`${item.customer_name}様`}
                      secondary={`合計: ${Number(item.grand_total).toLocaleString()}円 - ${new Date(item.estimate_date).toLocaleDateString()}`}
                    />
                  </ListItem>
                  {index < stats.recentEstimates.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">最近追加された顧客</Typography>
            <List>
              {stats.recentCustomers.map((item, index) => (
                <React.Fragment key={item.id}>
                  <ListItem button component={Link} to={`/customers/${item.id}`}>
                    <ListItemText 
                      primary={item.name}
                      secondary={item.address}
                    />
                  </ListItem>
                  {index < stats.recentCustomers.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
