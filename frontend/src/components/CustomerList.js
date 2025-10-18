import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Paper, Box, Typography, IconButton, TextField, useTheme, useMediaQuery } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { jaJP } from '@mui/x-data-grid/locales';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCustomer from './AddCustomer';
import EditCustomer from './EditCustomer';
import { apiFetch } from '../utils/api'; // Import apiFetch

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\\\\]/g, '\\$&'); // $& means the whole matched string
}

function CustomerList() {
  const [customers, setCustomers] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filteredRows, setFilteredRows] = useState([]);
  const [refetch, setRefetch] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleRefetch = useCallback(() => {
    setRefetch(prev => !prev);
  }, []);

  const handleEditOpen = (customer) => {
    setEditCustomer(customer);
    setIsEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setIsEditDialogOpen(false);
    setEditCustomer(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('この顧客を本当に削除しますか？関連する車両や見積もりもすべて削除されます。')) {
      try {
        await apiFetch(`/api/customers/${id}`, { method: 'DELETE' });
        handleRefetch();
      } catch (error) {
        console.error('Error deleting customer:', error);
        alert(`顧客の削除に失敗しました: ${error.message}`);
      }
    }
  };

  const handleSearch = (event) => {
    const newSearchText = event.target.value;
    setSearchText(newSearchText);
    const searchRegex = new RegExp(escapeRegExp(newSearchText), 'i');
    const filtered = customers.filter((row) => {
      return Object.keys(row).some((field) => {
        return searchRegex.test(row[field] ? row[field].toString() : '');
      });
    });
    setFilteredRows(filtered);
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: '顧客名', width: 200 },
    { field: 'household_name', headerName: '世帯名', width: 200 },
    { field: 'phone_number', headerName: '電話番号', width: 150 },
    { field: 'email', headerName: 'メールアドレス', width: 250 },
    { field: 'address', headerName: '住所', flex: 1 },
    {
      field: 'actions',
      headerName: '操作',
      sortable: false,
      width: 120,
      renderCell: (params) => (
        <Box>
          <IconButton onClick={(e) => { e.stopPropagation(); handleEditOpen(params.row); }} aria-label="edit">
            <EditIcon />
          </IconButton>
          <IconButton onClick={(e) => { e.stopPropagation(); handleDelete(params.id); }} aria-label="delete">
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const data = await apiFetch('/api/customers');
        setCustomers(data);
        setFilteredRows(data);
      } catch (error) {
        console.error('Error fetching customers:', error);
      }
    };
    fetchCustomers();
  }, [refetch]);

  const handleRowClick = (params, event) => {
    if (event.target.closest('[aria-label="edit"], [aria-label="delete"]')) {
      return;
    }
    navigate(`/customers/${params.id}`);
  };

  return (
    <Box sx={{ my: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        顧客管理
      </Typography>
      <Box sx={{display: 'flex', justifyContent: 'space-between', mb: 2}}>
        <AddCustomer onCustomerAdded={handleRefetch} />
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
          onRowClick={handleRowClick}
          sx={{ '& .MuiDataGrid-cell:hover': { cursor: 'pointer' } }}
          slots={{ toolbar: GridToolbar }}
          localeText={jaJP.components.MuiDataGrid.defaultProps.localeText}
          initialState={{
            columns: {
              columnVisibilityModel: {
                household_name: !isMobile,
                phone_number: !isMobile,
                email: !isMobile,
                address: !isMobile,
              },
            },
          }}
        />
      </Paper>
      {editCustomer && (
        <EditCustomer 
          customer={editCustomer} 
          open={isEditDialogOpen} 
          onClose={handleEditClose} 
          onCustomerUpdated={handleRefetch} 
        />
      )}
    </Box>
  );
}

export default CustomerList;