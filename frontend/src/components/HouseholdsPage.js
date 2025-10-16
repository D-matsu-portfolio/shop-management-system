import React, { useState, useEffect, useCallback } from 'react';
import { Paper, Box, Typography, IconButton, TextField } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { jaJP } from '@mui/x-data-grid/locales';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddHousehold from './AddHousehold';
import EditHousehold from './EditHousehold';

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\\]/g, '\\$&'); // $& means the whole matched string
}

function HouseholdsPage() {
  const [households, setHouseholds] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filteredRows, setFilteredRows] = useState([]);
  const [refetch, setRefetch] = useState(false);
  const [editHousehold, setEditHousehold] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleRefetch = useCallback(() => {
    setRefetch(prev => !prev);
  }, []);

  const handleEditOpen = (household) => {
    setEditHousehold(household);
    setIsEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setIsEditDialogOpen(false);
    setEditHousehold(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('この世帯を本当に削除しますか？所属する顧客の世帯情報がリセットされます。')) {
      fetch(`/api/households/${id}`, { method: 'DELETE' })
        .then(res => {
          if (res.ok) {
            handleRefetch();
          } else {
            throw new Error('Failed to delete household');
          }
        })
        .catch(error => console.error('Error deleting household:', error));
    }
  };

  const handleSearch = (event) => {
    const newSearchText = event.target.value;
    setSearchText(newSearchText);
    const searchRegex = new RegExp(escapeRegExp(newSearchText), 'i');
    const filtered = households.filter((row) => {
      return Object.keys(row).some((field) => {
        return searchRegex.test(row[field] ? row[field].toString() : '');
      });
    });
    setFilteredRows(filtered);
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'household_name', headerName: '世帯名', flex: 1 },
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
    fetch('/api/households')
      .then(response => response.json())
      .then(data => {
        setHouseholds(data);
        setFilteredRows(data);
      })
      .catch(error => console.error('Error fetching households:', error));
  }, [refetch]);

  return (
    <Box sx={{ my: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        世帯管理
      </Typography>
      <Box sx={{display: 'flex', justifyContent: 'space-between', mb: 2}}>
        <AddHousehold onHouseholdAdded={handleRefetch} />
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
      {editHousehold && (
        <EditHousehold 
          household={editHousehold} 
          open={isEditDialogOpen} 
          onClose={handleEditClose} 
          onHouseholdUpdated={handleRefetch} 
        />
      )}
    </Box>
  );
}

export default HouseholdsPage;
