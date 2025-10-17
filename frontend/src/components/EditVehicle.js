import React, { useState, useEffect } from 'react';
import { 
  Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Box, 
  Autocomplete, CircularProgress
} from '@mui/material';
import { apiFetch } from '../utils/api';

function EditVehicle({ vehicle, onVehicleUpdated, open, onClose }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(vehicle);

  useEffect(() => {
    setFormData(vehicle);
  }, [vehicle]);

  useEffect(() => {
    if (!open) return;
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const data = await apiFetch('/api/customers');
        setCustomers(data);
      } catch (err) {
        console.error("Failed to fetch customers", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, [open]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCustomerChange = (event, newValue) => {
    setFormData({ ...formData, customer_id: newValue ? newValue.id : null });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await apiFetch(`/api/vehicles/${vehicle.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      });
      if (data.id) {
        console.log('Vehicle updated:', data);
        onClose();
        onVehicleUpdated();
      } else {
        throw new Error(data.message || 'Error updating vehicle');
      }
    } catch (error) {
      console.error('Error updating vehicle:', error);
      alert('車両の更新に失敗しました。');
    }
  };

  const selectedCustomer = customers.find(c => c.id === formData.customer_id) || null;

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>車両情報の編集</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {loading ? <CircularProgress /> : (
            <>
              <Autocomplete
                autoFocus
                options={customers}
                getOptionLabel={(option) => option.name || ''}
                value={selectedCustomer}
                onChange={handleCustomerChange}
                renderInput={(params) => <TextField {...params} label="顧客を選択" margin="dense" required />}
              />
              <TextField margin="dense" name="make" label="メーカー" type="text" fullWidth variant="standard" value={formData.make || ''} onChange={handleChange} />
              <TextField margin="dense" name="model" label="モデル" type="text" fullWidth variant="standard" value={formData.model || ''} onChange={handleChange} />
              <TextField margin="dense" name="year" label="年式" type="number" fullWidth variant="standard" value={formData.year || ''} onChange={handleChange} />
              <TextField margin="dense" name="weight" label="車両重量 (kg)" type="number" fullWidth variant="standard" value={formData.weight || ''} onChange={handleChange} />
              <TextField margin="dense" name="vin" label="車台番号(VIN)" type="text" fullWidth variant="standard" value={formData.vin || ''} onChange={handleChange} />
              <TextField margin="dense" name="license_plate" label="ナンバープレート" type="text" fullWidth variant="standard" value={formData.license_plate || ''} onChange={handleChange} />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>キャンセル</Button>
          <Button type="submit">保存</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default EditVehicle;
