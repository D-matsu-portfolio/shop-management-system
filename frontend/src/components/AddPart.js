import React, { useState, useContext } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Box, Alert } from '@mui/material';
import { apiFetch } from '../utils/api';
import { AuthContext } from '../context/AuthContext';

function AddPart({ onPartAdded }) {
  const [open, setOpen] = useState(false);
  const { isGuest } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    part_number: '',
    name: '',
    description: '',
    cost_price: '',
    sale_price: '',
  });

  const handleClickOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await apiFetch('/api/parts', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      console.log('Part created:', data);
      handleClose();
      onPartAdded();
    } catch (error) {
      console.error('Error creating part:', error);
      alert('部品の作成に失敗しました。');
    }
  };

  return (
    <Box sx={{ my: 2 }}>
      <Button variant="contained" onClick={handleClickOpen}>新規部品を追加</Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>新規部品マスタ</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {isGuest && <Alert severity="warning" sx={{ mb: 2 }}>ゲストユーザーは閲覧のみ可能です。</Alert>}
            <TextField autoFocus margin="dense" name="part_number" label="品番" type="text" fullWidth variant="standard" value={formData.part_number} onChange={handleChange} />
            <TextField margin="dense" name="name" label="部品名" type="text" fullWidth variant="standard" value={formData.name} onChange={handleChange} required />
            <TextField margin="dense" name="description" label="説明" type="text" fullWidth multiline rows={2} variant="standard" value={formData.description} onChange={handleChange} />
            <TextField margin="dense" name="cost_price" label="仕入れ値" type="number" fullWidth variant="standard" value={formData.cost_price} onChange={handleChange} />
            <TextField margin="dense" name="sale_price" label="販売価格" type="number" fullWidth variant="standard" value={formData.sale_price} onChange={handleChange} required />
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

export default AddPart;
