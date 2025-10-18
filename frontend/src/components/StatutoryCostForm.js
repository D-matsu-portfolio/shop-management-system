import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogActions, DialogContent, DialogTitle, TextField, Button
} from '@mui/material';

const StatutoryCostForm = ({ open, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (open) {
      setFormData(initialData || {
        item_name: '',
        cost: '',
        weight_min: '',
        weight_max: '',
        notes: '',
      });
    }
  }, [open, initialData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const processedData = {
      ...formData,
      cost: parseFloat(formData.cost) || 0,
      weight_min: parseInt(formData.weight_min, 10) || 0,
      weight_max: parseInt(formData.weight_max, 10) || 0,
    };
    onSubmit(processedData);
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{initialData ? '法定費用の編集' : '法定費用の新規追加'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="item_name"
            label="項目名"
            type="text"
            fullWidth
            variant="standard"
            value={formData.item_name || ''}
            onChange={handleChange}
            required
          />
          <TextField
            margin="dense"
            name="cost"
            label="費用"
            type="number"
            fullWidth
            variant="standard"
            value={formData.cost || ''}
            onChange={handleChange}
            required
          />
          <TextField
            margin="dense"
            name="weight_min"
            label="最小重量 (kg)"
            type="number"
            fullWidth
            variant="standard"
            value={formData.weight_min || ''}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            name="weight_max"
            label="最大重量 (kg)"
            type="number"
            fullWidth
            variant="standard"
            value={formData.weight_max || ''}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            name="notes"
            label="備考"
            type="text"
            fullWidth
            variant="standard"
            value={formData.notes || ''}
            onChange={handleChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>キャンセル</Button>
          <Button type="submit">保存</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default StatutoryCostForm;
