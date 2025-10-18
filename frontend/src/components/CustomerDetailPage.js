import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Paper, Box, Typography, Grid, Card, CardContent, CircularProgress, Button, useTheme, useMediaQuery } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { jaJP } from '@mui/x-data-grid/locales';
import AddVehicle from './AddVehicle';
import { apiFetch } from '../utils/api';

const vehicleColumns = [
  { field: 'id', headerName: 'ID', width: 70 },
  { field: 'make', headerName: 'メーカー', width: 130 },
  { field: 'model', headerName: 'モデル', width: 130 },
  { field: 'year', headerName: '年式', width: 100 },
  { field: 'weight', headerName: '車両重量 (kg)', type: 'number', width: 140 },
  { field: 'license_plate', headerName: 'ナンバープレート', width: 200 },
  { field: 'vin', headerName: '車台番号(VIN)', flex: 1 },
];

const historyColumns = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'estimate_date', headerName: '日付', width: 180, valueGetter: (value) => new Date(value).toLocaleDateString('ja-JP') },
    { field: 'grand_total', headerName: '合計金額(円)', type: 'number', width: 150, valueGetter: (value) => Number(value).toLocaleString() },
    { field: 'status', headerName: 'ステータス', flex: 1 },
];

function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [workHistory, setWorkHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  const [refetchVehicles, setRefetchVehicles] = useState(false);
  const [refetchHistory, setRefetchHistory] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleVehicleAdded = useCallback(() => setRefetchVehicles(prev => !prev), []);
  const handleEstimateAdded = useCallback(() => setRefetchHistory(prev => !prev), []);

  useEffect(() => {
    const fetchCustomerDetails = async () => {
      setLoading(true);
      try {
        const [customerData, vehiclesData] = await Promise.all([
          apiFetch(`/api/customers/${id}`),
          apiFetch(`/api/vehicles/by-customer/${id}`),
        ]);
        setCustomer(customerData);
        setVehicles(vehiclesData);
      } catch (error) {
        console.error('Error fetching customer details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomerDetails();
  }, [id, refetchVehicles]);

  useEffect(() => {
    if (!selectedVehicle) {
      setWorkHistory([]);
      return;
    }
    const fetchVehicleHistory = async () => {
      setHistoryLoading(true);
      try {
        const estimatesData = await apiFetch(`/api/estimates/by-vehicle/${selectedVehicle.id}`);
        setWorkHistory(estimatesData);
      } catch (error) {
        console.error('Error fetching vehicle history:', error);
      } finally {
        setHistoryLoading(false);
      }
    };
    fetchVehicleHistory();
  }, [selectedVehicle, refetchHistory]);

  const handleVehicleRowClick = (params) => {
    setSelectedVehicle(params.row);
  };

  if (loading) {
    return <CircularProgress />;
  }

  if (!customer) {
    return <Typography>顧客が見つかりません。</Typography>;
  }

  return (
    <Box sx={{ my: 3 }}>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card sx={{ flexGrow: 1 }}><CardContent>
            <Typography variant="h4" component="h1" gutterBottom>{customer.name}</Typography>
            <Typography variant="body1"><strong>メール:</strong> {customer.email}</Typography>
            <Typography variant="body1"><strong>電話番号:</strong> {customer.phone_number}</Typography>
            <Typography variant="body1"><strong>住所:</strong> {customer.address}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Box sx={{display: 'flex', flexDirection: 'column', gap: 1, height: '100%', justifyContent: 'space-around'}}>
              <AddVehicle 
                onVehicleAdded={handleVehicleAdded} 
                initialCustomer={customer} 
                renderOpenButton={(handleClickOpen) => (
                  <Button variant="contained" onClick={handleClickOpen}>車両を追加</Button>
                )}
              />
              <Button 
                component={Link} 
                to="/estimates/new"
                state={{ initialCustomer: customer, initialVehicle: selectedVehicle }}
                variant="contained" 
                color="secondary" 
                disabled={!selectedVehicle}
              >
                選択中の車両で見積もりを作成
              </Button>
          </Box>
        </Grid>
      </Grid>

      <Box sx={{ my: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom>所有車両 (車両を選択すると、下の履歴が更新されます)</Typography>
        <Paper style={{ height: 300, width: '100%' }}>
          <DataGrid 
            rows={vehicles} 
            columns={vehicleColumns} 
            onRowClick={handleVehicleRowClick} 
            sx={{cursor: 'pointer'}} 
            slots={{ toolbar: GridToolbar }} 
            localeText={jaJP.components.MuiDataGrid.defaultProps.localeText} 
            initialState={{
              columns: {
                columnVisibilityModel: {
                  id: !isMobile,
                  year: !isMobile,
                  weight: !isMobile,
                  vin: !isMobile,
                },
              },
            }}
          />
        </Paper>
      </Box>

      <Box sx={{ my: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom>作業履歴 (見積もり)</Typography>
        <Paper style={{ height: 300, width: '100%' }}>
          {historyLoading ? <CircularProgress /> : 
            <DataGrid 
              rows={workHistory} 
              columns={historyColumns} 
              onRowClick={(params) => navigate(`/estimates/${params.id}`)} 
              sx={{cursor: 'pointer'}} 
              slots={{ toolbar: GridToolbar }} 
              localeText={jaJP.components.MuiDataGrid.defaultProps.localeText} 
              initialState={{
                columns: {
                  columnVisibilityModel: {
                    id: !isMobile,
                    status: !isMobile,
                  },
                },
              }}
            />}
        </Paper>
      </Box>

    </Box>
  );
}

export default CustomerDetailPage;