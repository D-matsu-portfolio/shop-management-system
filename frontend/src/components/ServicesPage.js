import React, { useState, useEffect, useCallback } from 'react';
import { Paper, Box, Typography, IconButton, TextField } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { jaJP } from '@mui/x-data-grid/locales';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddService from './AddService';
import EditService from './EditService';
import { apiFetch } from '../utils/api';

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\\]/g, '\\$&'); // $& means the whole matched string
}

function ServicesPage() {
  const [services, setServices] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filteredRows, setFilteredRows] = useState([]);
  const [refetch, setRefetch] = useState(false);
  const [editService, setEditService] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleRefetch = useCallback(() => {
    setRefetch(prev => !prev);
  }, []);

  const handleEditOpen = (service) => {
    setEditService(service);
    setIsEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setIsEditDialogOpen(false);
    setEditService(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('この作業を本当に削除しますか？')) {
      try {
        await apiFetch(`/api/services/${id}`, { method: 'DELETE' });
        handleRefetch();
      } catch (error) {
        console.error('Error deleting service:', error);
        alert('作業の削除に失敗しました。');
      }
    }
  };

  const handleSearch = (event) => {
    const newSearchText = event.target.value;
    setSearchText(newSearchText);
    const searchRegex = new RegExp(escapeRegExp(newSearchText), 'i');
    const filtered = services.filter((row) => {
      return Object.keys(row).some((field) => {
        return searchRegex.test(row[field] ? row[field].toString() : '');
      });
    });
    setFilteredRows(filtered);
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'service_code', headerName: '作業コード', width: 150 },
    { field: 'name', headerName: '作業名', width: 250 },
    { field: 'description', headerName: '説明', flex: 1 },
    { field: 'default_total_cost', headerName: '標準工賃', type: 'number', width: 130 },
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
    const fetchServices = async () => {
      try {
        const data = await apiFetch('/api/services');
        setServices(data);
        setFilteredRows(data);
      } catch (error) {
        console.error('Error fetching services:', error);
      }
    };
    fetchServices();
  }, [refetch]);

  return (
    <Box sx={{ my: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        作業マスタ管理
      </Typography>
      <Box sx={{display: 'flex', justifyContent: 'space-between', mb: 2}}>
        <AddService onServiceAdded={handleRefetch} />
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
      {editService && (
        <EditService 
          service={editService} 
          open={isEditDialogOpen} 
          onClose={handleEditClose} 
          onServiceUpdated={handleRefetch} 
        />
      )}
    </Box>
  );
}

export default ServicesPage;
