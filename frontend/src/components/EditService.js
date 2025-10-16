import React, { useState, useEffect } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Box } from '@mui/material';

function EditService({ service, onServiceUpdated, open, onClose }) {
  const [formData, setFormData] = useState(service);

  useEffect(() => {
    setFormData(service);
  }, [service]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch(`/api/services/${service.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
      .then(response => response.json())
      .then(data => {
        if (data.id) {
          console.log('Service updated:', data);
          onClose();
          onServiceUpdated();
        } else {
          throw new Error(data.message || 'Error updating service');
        }
      })
      .catch(error => console.error('Error updating service:', error));
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>作業マスタの編集</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField autoFocus margin="dense" name="service_code" label="作業コード" type="text" fullWidth variant="standard" value={formData.service_code || ''} onChange={handleChange} />
          <TextField margin="dense" name="name" label="作業名" type="text" fullWidth variant="standard" value={formData.name || ''} onChange={handleChange} required />
          <TextField margin="dense" name="description" label="説明" type="text" fullWidth multiline rows={2} variant="standard" value={formData.description || ''} onChange={handleChange} />
          <TextField margin="dense" name="default_total_cost" label="標準工賃" type="number" fullWidth variant="standard" value={formData.default_total_cost || ''} onChange={handleChange} required />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>キャンセル</Button>
          <Button type="submit">保存</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default EditService;
