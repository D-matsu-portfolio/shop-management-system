import React, { useState, useContext } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Box, Alert } from '@mui/material';
import { apiFetch } from '../utils/api';
import { AuthContext } from '../context/AuthContext';

function AddService({ onServiceAdded }) {
  const [open, setOpen] = useState(false);
  const { isGuest } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    service_code: '',
    name: '',
    description: '',
    default_total_cost: '',
  });

  const handleClickOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await apiFetch('/api/services', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      console.log('Service created:', data);
      handleClose();
      onServiceAdded();
    } catch (error) {
      console.error('Error creating service:', error);
      alert('作業の作成に失敗しました。');
    }
  };

  return (
    <Box sx={{ my: 2 }}>
      <Button variant="contained" onClick={handleClickOpen}>新規作業を追加</Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>新規作業マスタ</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {isGuest && <Alert severity="warning" sx={{ mb: 2 }}>ゲストユーザーは閲覧のみ可能です。</Alert>}
            <TextField autoFocus margin="dense" name="service_code" label="作業コード" type="text" fullWidth variant="standard" value={formData.service_code} onChange={handleChange} />
            <TextField margin="dense" name="name" label="作業名" type="text" fullWidth variant="standard" value={formData.name} onChange={handleChange} required />
            <TextField margin="dense" name="description" label="説明" type="text" fullWidth multiline rows={2} variant="standard" value={formData.description} onChange={handleChange} />
            <TextField margin="dense" name="default_total_cost" label="標準工賃" type="number" fullWidth variant="standard" value={formData.default_total_cost} onChange={handleChange} required />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>キャンセル</Button>
            <Button type="submit" disabled={isGuest}>保存</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

export default AddService;
