import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Paper, Box, Typography, IconButton, TextField, Button, useTheme, useMediaQuery } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { jaJP } from '@mui/x-data-grid/locales';
import DeleteIcon from '@mui/icons-material/Delete';
import { Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\\]/g, '\\$&'); // $& means the whole matched string
}

function EstimatePage() {
  const [estimates, setEstimates] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filteredRows, setFilteredRows] = useState([]);
  const [refetch, setRefetch] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleRefetch = useCallback(() => {
    setRefetch(prev => !prev);
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('この見積もりを本当に削除しますか？')) {
      try {
        await apiFetch(`/api/estimates/${id}`, { method: 'DELETE' });
        handleRefetch();
      } catch (error) {
        console.error('Error deleting estimate:', error);
        alert(`見積もりの削除に失敗しました: ${error.message}`);
      }
    }
  };

  const handleSearch = (event) => {
    const newSearchText = event.target.value;
    setSearchText(newSearchText);
    const searchRegex = new RegExp(escapeRegExp(newSearchText), 'i');
    const filtered = estimates.filter((row) => {
      return Object.keys(row).some((field) => {
        // Handle nested objects for searching
        const value = field === 'vehicle' ? `${row.make} ${row.model} ${row.license_plate}` : row[field];
        return searchRegex.test(value ? value.toString() : '');
      });
    });
    setFilteredRows(filtered);
  };

  const columns = [
    { field: 'id', headerName: '見積ID', width: 90 },
    { field: 'customer_name', headerName: '顧客名', width: 200 },
    { field: 'license_plate', headerName: '車両', width: 250, valueGetter: (value, row) => `${row.make || ''} ${row.model || ''} (${row.license_plate || ''})` },
    { field: 'estimate_date', headerName: '見積日', width: 180, valueGetter: (value) => new Date(value).toLocaleDateString('ja-JP') },
    { field: 'grand_total', headerName: '合計金額(円)', type: 'number', width: 150, valueGetter: (value, row) => Number(row.grand_total).toLocaleString() },
    { field: 'status', headerName: 'ステータス', flex: 1 },
    {
      field: 'actions',
      headerName: '操作',
      sortable: false,
      width: 120,
      renderCell: (params) => (
        <Box>
          {/* <IconButton onClick={(e) => { e.stopPropagation(); handleEditOpen(params.row); }}><EditIcon /></IconButton> */}
          <IconButton onClick={(e) => { e.stopPropagation(); handleDelete(params.id); }} aria-label="delete">
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  useEffect(() => {
    const fetchEstimates = async () => {
      try {
        const data = await apiFetch('/api/estimates');
        setEstimates(data);
        setFilteredRows(data);
      } catch (error) {
        console.error('Error fetching estimates:', error);
      }
    };
    fetchEstimates();
  }, [refetch]);

  const handleRowClick = (params, event) => {
    if (event.target.closest('[aria-label="delete"]')) return;
    navigate(`/estimates/${params.id}`);
  };

  return (
    <Box sx={{ my: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        見積もり管理
      </Typography>
      <Box sx={{display: 'flex', justifyContent: 'space-between', mb: 2}}>
        <Button component={Link} to="/estimates/new" variant="contained">新規見積もりを作成</Button>
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
                license_plate: !isMobile,
                status: !isMobile,
              },
            },
          }}
        />
      </Paper>
      {/* Edit Estimate Dialog will be added later */}
    </Box>
  );
}

export default EstimatePage;
