import React, { useState, useEffect, useCallback } from 'react';
import { Paper, Box, Typography, IconButton, TextField } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { jaJP } from '@mui/x-data-grid/locales';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddVehicle from './AddVehicle';
import EditVehicle from './EditVehicle';

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\\]/g, '\\$&'); // $& means the whole matched string
}

function VehicleList() {
  const [vehicles, setVehicles] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filteredRows, setFilteredRows] = useState([]);
  const [refetch, setRefetch] = useState(false);
  const [editVehicle, setEditVehicle] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleRefetch = useCallback(() => {
    setRefetch(prev => !prev);
  }, []);

  const handleEditOpen = (vehicle) => {
    setEditVehicle(vehicle);
    setIsEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setIsEditDialogOpen(false);
    setEditVehicle(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('この車両を本当に削除しますか？関連する見積もりや整備記録もすべて削除されます。')) {
      fetch(`/api/vehicles/${id}`, { method: 'DELETE' })
        .then(res => {
          if (res.ok) {
            handleRefetch();
          } else {
            throw new Error('Failed to delete vehicle');
          }
        })
        .catch(error => console.error('Error deleting vehicle:', error));
    }
  };
  
  const handleSearch = (event) => {
    const newSearchText = event.target.value;
    setSearchText(newSearchText);
    const searchRegex = new RegExp(escapeRegExp(newSearchText), 'i');
    const filtered = vehicles.filter((row) => {
      return Object.keys(row).some((field) => {
        return searchRegex.test(row[field] ? row[field].toString() : '');
      });
    });
    setFilteredRows(filtered);
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'customer_id', headerName: '顧客ID', width: 100 },
    { field: 'make', headerName: 'メーカー', width: 130 },
    { field: 'model', headerName: 'モデル', width: 130 },
    { field: 'year', headerName: '年式', width: 100 },
    { field: 'weight', headerName: '車両重量 (kg)', type: 'number', width: 140 },
    { field: 'license_plate', headerName: 'ナンバープレート', width: 200 },
    { field: 'vin', headerName: '車台番号(VIN)', flex: 1 },
    {
      field: 'actions',
      headerName: '操作',
      sortable: false,
      width: 120,
      renderCell: (params) => (
        <Box>
          <IconButton onClick={() => handleEditOpen(params.row)} aria-label="edit">
            <EditIcon />
          </IconButton>
          <IconButton onClick={() => handleDelete(params.id)} aria-label="delete">
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  useEffect(() => {
    fetch('/api/vehicles')
      .then(response => response.json())
      .then(data => {
        setVehicles(data);
        setFilteredRows(data);
      })
      .catch(error => console.error('Error fetching vehicles:', error));
  }, [refetch]);

  return (
    <Box sx={{ my: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        車両管理
      </Typography>
      <Box sx={{display: 'flex', justifyContent: 'space-between', mb: 2}}>
        <AddVehicle onVehicleAdded={handleRefetch} />
        <TextField
          variant="outlined"
          value={searchText}
          onChange={handleSearch}
          placeholder="検索…"
          size="small"
        />
      </Box>
      <Paper style={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={filteredRows}
          columns={columns}
          slots={{ toolbar: GridToolbar }}
          localeText={jaJP.components.MuiDataGrid.defaultProps.localeText}
        />
      </Paper>
      {editVehicle && (
        <EditVehicle 
          vehicle={editVehicle} 
          open={isEditDialogOpen} 
          onClose={handleEditClose} 
          onVehicleUpdated={handleRefetch} 
        />
      )}
    </Box>
  );
}

export default VehicleList;