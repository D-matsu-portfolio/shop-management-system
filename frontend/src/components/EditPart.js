import React, { useState, useEffect } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Box } from '@mui/material';
import { apiFetch } from '../utils/api';

function EditPart({ part, onPartUpdated, open, onClose }) {
  const [formData, setFormData] = useState(part);

  useEffect(() => {
    setFormData(part);
  }, [part]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await apiFetch(`/api/parts/${part.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      });
      if (data.id) {
        console.log('Part updated:', data);
        onClose();
        onPartUpdated();
      } else {
        throw new Error(data.message || 'Error updating part');
      }
    } catch (error) {
      console.error('Error updating part:', error);
      alert('部品の更新に失敗しました。');
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>部品マスタの編集</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField autoFocus margin="dense" name="part_number" label="品番" type="text" fullWidth variant="standard" value={formData.part_number || ''} onChange={handleChange} />
          <TextField margin="dense" name="name" label="部品名" type="text" fullWidth variant="standard" value={formData.name || ''} onChange={handleChange} required />
          <TextField margin="dense" name="description" label="説明" type="text" fullWidth multiline rows={2} variant="standard" value={formData.description || ''} onChange={handleChange} />
          <TextField margin="dense" name="cost_price" label="仕入れ値" type="number" fullWidth variant="standard" value={formData.cost_price || ''} onChange={handleChange} />
          <TextField margin="dense" name="sale_price" label="販売価格" type="number" fullWidth variant="standard" value={formData.sale_price || ''} onChange={handleChange} required />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>キャンセル</Button>
          <Button type="submit">保存</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default EditPart;
