import React, { useState, useEffect, useContext } from 'react';
import { Box, Typography, Button, Paper, useTheme, useMediaQuery, Alert } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { apiFetch } from '../utils/api';
import StatutoryCostForm from './StatutoryCostForm';
import { AuthContext } from '../context/AuthContext';

const StatutoryCostsPage = () => {
  const [costs, setCosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCost, setEditingCost] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isGuest } = useContext(AuthContext);

  const fetchCosts = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/statutory-costs');
      setCosts(data);
    } catch (error) {
      console.error('Failed to fetch statutory costs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCosts();
  }, []);

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCost(null);
  };

  const handleAddNew = () => {
    setEditingCost(null);
    setDialogOpen(true);
  };

  const handleEdit = (cost) => {
    setEditingCost(cost);
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('この項目を本当に削除しますか？')) {
      try {
        await apiFetch(`/api/statutory-costs/${id}`, { method: 'DELETE' });
        fetchCosts(); // Refresh data
      } catch (error) {
        console.error('Failed to delete statutory cost:', error);
        alert('削除に失敗しました。');
      }
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (editingCost) {
        // Update existing cost
        await apiFetch(`/api/statutory-costs/${editingCost.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
      } else {
        // Create new cost
        await apiFetch('/api/statutory-costs', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
      }
      fetchCosts(); // Refresh data
      handleCloseDialog();
    } catch (error) {
      console.error('Failed to save statutory cost:', error);
      alert('保存に失敗しました。');
    }
  };

  const columns = [
    { field: 'item_name', headerName: '項目名', width: 300 },
    { field: 'cost', headerName: '費用', width: 150, type: 'number', valueFormatter: (value) => `${Number(value).toLocaleString()}円` },
    { field: 'weight_min', headerName: '最小重量 (kg)', width: 150, type: 'number' },
    { field: 'weight_max', headerName: '最大重量 (kg)', width: 150, type: 'number' },
    { field: 'notes', headerName: '備考', width: 300 },
    {
      field: 'actions',
      headerName: '操作',
      width: 150,
      sortable: false,
      renderCell: (params) => {
        return (
          <Box>
            <Button size="small" onClick={() => handleEdit(params.row)} disabled={isGuest}>編集</Button>
            <Button size="small" color="secondary" onClick={() => handleDelete(params.row.id)} disabled={isGuest}>削除</Button>
          </Box>
        );
      },
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">法定費用マスタ</Typography>
        <Button variant="contained" onClick={handleAddNew} disabled={isGuest}>新規追加</Button>
      </Box>
      {isGuest && <Alert severity="warning" sx={{ mb: 2 }}>ゲストユーザーは閲覧のみ可能です。</Alert>}
      <Paper>
        <DataGrid
          rows={costs}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          autoHeight
          loading={loading}
          initialState={{
            columns: {
              columnVisibilityModel: {
                weight_min: !isMobile,
                weight_max: !isMobile,
                notes: !isMobile,
              },
            },
          }}
        />
      </Paper>
      <StatutoryCostForm
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        initialData={editingCost}
      />
    </Box>
  );
};

export default StatutoryCostsPage;
