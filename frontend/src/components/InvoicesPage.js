import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Paper, Box, Typography, IconButton, TextField, useTheme, useMediaQuery } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { jaJP } from '@mui/x-data-grid/locales';
import DeleteIcon from '@mui/icons-material/Delete';
import { apiFetch } from '../utils/api';
import { AuthContext } from '../context/AuthContext';

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\\]/g, '\\$&'); // $& means the whole matched string
}

function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filteredRows, setFilteredRows] = useState([]);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isGuest } = useContext(AuthContext);

  // Note: Delete Invoice API is not yet implemented, this is a placeholder
  const handleDelete = (id) => {
    if (window.confirm('この請求書を本当に削除しますか？')) {
      console.log(`Request to delete invoice ${id}`);
      // fetch(`/api/invoices/${id}`, { method: 'DELETE' })
      //   .then(res => {
      //     if (res.ok) {
      //       handleRefetch();
      //     } else {
      //       throw new Error('Failed to delete invoice');
      //     }
      //   })
      //   .catch(error => console.error('Error deleting invoice:', error));
    }
  };

  const handleSearch = (event) => {
    const newSearchText = event.target.value;
    setSearchText(newSearchText);
    const searchRegex = new RegExp(escapeRegExp(newSearchText), 'i');
    const filtered = invoices.filter((row) => {
      return Object.keys(row).some((field) => {
        const value = field === 'vehicle' ? `${row.make} ${row.model} ${row.license_plate}` : row[field];
        return searchRegex.test(value ? value.toString() : '');
      });
    });
    setFilteredRows(filtered);
  };

  const columns = [
    { field: 'id', headerName: '請求書ID', width: 100 },
    { field: 'customer_name', headerName: '顧客名', width: 200 },
    { field: 'vehicle', headerName: '車両', width: 250, valueGetter: (value, row) => `${row.make || ''} ${row.model || ''} (${row.license_plate || ''})` },
    { field: 'invoice_date', headerName: '請求日', width: 150, valueGetter: (value) => new Date(value).toLocaleDateString('ja-JP') },
    { field: 'due_date', headerName: '支払期日', width: 150, valueGetter: (value) => value ? new Date(value).toLocaleDateString('ja-JP') : '' },
    { field: 'grand_total', headerName: '合計金額(円)', type: 'number', width: 150, valueGetter: (value) => Number(value).toLocaleString() },
    { field: 'status', headerName: 'ステータス', flex: 1 },
    {
      field: 'actions',
      headerName: '操作',
      sortable: false,
      width: 120,
      renderCell: (params) => (
        <Box>
          {/* <IconButton onClick={(e) => { e.stopPropagation(); handleEditOpen(params.row); }}><EditIcon /></IconButton> */}
          <IconButton onClick={(e) => { e.stopPropagation(); handleDelete(params.id); }} aria-label="delete" disabled={isGuest}>
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const data = await apiFetch('/api/invoices');
        setInvoices(data);
        setFilteredRows(data);
      } catch (error) {
        console.error('Error fetching invoices:', error);
      }
    };
    fetchInvoices();
  }, []);

  const handleRowClick = (params, event) => {
    if (event.target.closest('[aria-label="delete"]')) return;
    navigate(`/invoices/${params.id}`);
  };

  return (
    <Box sx={{ my: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        請求書管理
      </Typography>
      <Box sx={{display: 'flex', justifyContent: 'flex-end', mb: 2}}>
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
                vehicle: !isMobile,
                due_date: !isMobile,
                status: !isMobile,
              },
            },
          }}
        />
      </Paper>
    </Box>
  );
}

export default InvoicesPage;