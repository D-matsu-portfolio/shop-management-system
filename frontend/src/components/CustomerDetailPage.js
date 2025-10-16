import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Paper, Box, Typography, Grid, Card, CardContent, CircularProgress, Button } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { jaJP } from '@mui/x-data-grid/locales';
import AddVehicle from './AddVehicle';
import AddEstimate from './AddEstimate';

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

  const handleVehicleAdded = useCallback(() => setRefetchVehicles(prev => !prev), []);
  const handleEstimateAdded = useCallback(() => setRefetchHistory(prev => !prev), []);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    Promise.all([
      fetch(`/api/customers/${id}`).then(res => res.json()),
      fetch(`/api/vehicles/by-customer/${id}`).then(res => res.json()),
    ])
    .then(([customerData, vehiclesData]) => {
      if (isMounted) {
        setCustomer(customerData);
        setVehicles(vehiclesData);
        setLoading(false);
      }
    })
    .catch(error => {
      console.error('Error fetching customer details:', error);
      if (isMounted) setLoading(false);
    });
    return () => { isMounted = false };
  }, [id, refetchVehicles]);

  useEffect(() => {
    if (!selectedVehicle) {
      setWorkHistory([]);
      return;
    }
    let isMounted = true;
    setHistoryLoading(true);
    fetch(`/api/estimates/by-vehicle/${selectedVehicle.id}`)
      .then(res => res.json())
      .then(estimatesData => {
        if (isMounted) {
          setWorkHistory(estimatesData);
          setHistoryLoading(false);
        }
      })
      .catch(error => {
        console.error('Error fetching vehicle history:', error);
        if (isMounted) setHistoryLoading(false);
      });
    return () => { isMounted = false };
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
      <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4}}>
        <Card sx={{ flexGrow: 1 }}><CardContent>
          <Typography variant="h4" component="h1" gutterBottom>{customer.name}</Typography>
          <Typography variant="body1"><strong>メール:</strong> {customer.email}</Typography>
          <Typography variant="body1"><strong>電話番号:</strong> {customer.phone_number}</Typography>
          <Typography variant="body1"><strong>住所:</strong> {customer.address}</Typography>
        </CardContent></Card>
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 1, ml: 2}}>
            <AddVehicle 
              onVehicleAdded={handleVehicleAdded} 
              initialCustomer={customer} 
              renderOpenButton={(handleClickOpen) => (
                <Button variant="contained" onClick={handleClickOpen}>車両を追加</Button>
              )}
            />
            <AddEstimate 
              onEstimateAdded={handleEstimateAdded}
              initialCustomer={customer}
              initialVehicle={selectedVehicle}
              renderOpenButton={(handleClickOpen) => (
                <Button variant="contained" color="secondary" disabled={!selectedVehicle} onClick={handleClickOpen}>
                  選択中の車両で見積もりを作成
                </Button>
              )}
            />
        </Box>
      </Box>

      <Box sx={{ my: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom>所有車両 (車両を選択すると、下の履歴が更新されます)</Typography>
        <Paper style={{ height: 300, width: '100%' }}><DataGrid rows={vehicles} columns={vehicleColumns} onRowClick={handleVehicleRowClick} sx={{cursor: 'pointer'}} slots={{ toolbar: GridToolbar }} localeText={jaJP.components.MuiDataGrid.defaultProps.localeText} /></Paper>
      </Box>

      <Box sx={{ my: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom>作業履歴 (見積もり)</Typography>
        <Paper style={{ height: 300, width: '100%' }}>
          {historyLoading ? <CircularProgress /> : <DataGrid rows={workHistory} columns={historyColumns} onRowClick={(params) => navigate(`/estimates/${params.id}`)} sx={{cursor: 'pointer'}} slots={{ toolbar: GridToolbar }} localeText={jaJP.components.MuiDataGrid.defaultProps.localeText} />}
        </Paper>
      </Box>

    </Box>
  );
}

export default CustomerDetailPage;