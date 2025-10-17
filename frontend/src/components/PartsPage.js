import React, { useState, useEffect, useCallback } from 'react';
import { Paper, Box, Typography, IconButton, TextField } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { jaJP } from '@mui/x-data-grid/locales';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddPart from './AddPart';
import EditPart from './EditPart';
import { apiFetch } from '../utils/api';

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\\]/g, '\\$&'); // $& means the whole matched string
}

function PartsPage() {
  const [parts, setParts] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filteredRows, setFilteredRows] = useState([]);
  const [refetch, setRefetch] = useState(false);
  const [editPart, setEditPart] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleRefetch = useCallback(() => {
    setRefetch(prev => !prev);
  }, []);

  const handleEditOpen = (part) => {
    setEditPart(part);
    setIsEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setIsEditDialogOpen(false);
    setEditPart(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('この部品を本当に削除しますか？')) {
      try {
        await apiFetch(`/api/parts/${id}`, { method: 'DELETE' });
        handleRefetch();
      } catch (error) {
        console.error('Error deleting part:', error);
        alert(`部品の削除に失敗しました: ${error.message}`);
      }
    }
  };

  const handleSearch = (event) => {
    const newSearchText = event.target.value;
    setSearchText(newSearchText);
    const searchRegex = new RegExp(escapeRegExp(newSearchText), 'i');
    const filtered = parts.filter((row) => {
      return Object.keys(row).some((field) => {
        return searchRegex.test(row[field] ? row[field].toString() : '');
      });
    });
    setFilteredRows(filtered);
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'part_number', headerName: '品番', width: 150 },
    { field: 'name', headerName: '部品名', width: 250 },
    { field: 'description', headerName: '説明', flex: 1 },
    { field: 'cost_price', headerName: '仕入れ値', type: 'number', width: 130 },
    { field: 'sale_price', headerName: '販売価格', type: 'number', width: 130 },
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
    const fetchParts = async () => {
      try {
        const data = await apiFetch('/api/parts');
        setParts(data);
        setFilteredRows(data);
      } catch (error) {
        console.error('Error fetching parts:', error);
      }
    };
    fetchParts();
  }, [refetch]);

  return (
    <Box sx={{ my: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        部品マスタ管理
      </Typography>
      <Box sx={{display: 'flex', justifyContent: 'space-between', mb: 2}}>
        <AddPart onPartAdded={handleRefetch} />
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
      {editPart && (
        <EditPart 
          part={editPart} 
          open={isEditDialogOpen} 
          onClose={handleEditClose} 
          onPartUpdated={handleRefetch} 
        />
      )}
    </Box>
  );
}

export default PartsPage;
