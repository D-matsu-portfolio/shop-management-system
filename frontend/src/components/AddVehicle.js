import React, { useState, useEffect } from 'react';
import { 
  Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Box, 
  Autocomplete, CircularProgress
} from '@mui/material';
import { apiFetch } from '../utils/api';

// The button to open the dialog can be customized by passing a render prop
function AddVehicle({ onVehicleAdded, initialCustomer, renderOpenButton }) {
  const [open, setOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    customer_id: null,
    make: '',
    model: '',
    year: '',
    vin: '',
    license_plate: '',
    weight: '',
  });

  // Pre-fill customer if provided
  useEffect(() => {
    if (initialCustomer) {
      setFormData(prev => ({ ...prev, customer_id: initialCustomer.id }));
    }
  }, [initialCustomer]);

  // Fetch customers if no initial customer is provided
  useEffect(() => {
    if (!open || initialCustomer) return;
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
  }, [open, initialCustomer]);

  const resetForm = () => {
    const initialData = initialCustomer ? { customer_id: initialCustomer.id } : { customer_id: null };
    setFormData({ ...initialData, make: '', model: '', year: '', vin: '', license_plate: '', weight: '' });
  }

  const handleClickOpen = () => setOpen(true);
  const handleClose = () => { setOpen(false); resetForm(); };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCustomerChange = (event, newValue) => {
    setFormData({ ...formData, customer_id: newValue ? newValue.id : null });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await apiFetch('/api/vehicles', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      if (data.id) {
        console.log('Vehicle created:', data);
        handleClose();
        onVehicleAdded();
      } else {
        throw new Error(data.message || 'Error creating vehicle');
      }
    } catch (error) {
      console.error('Error creating vehicle:', error);
      alert('車両の作成に失敗しました。');
    }
  };

  return (
    <Box sx={{ my: 2 }}>
      {renderOpenButton ? renderOpenButton(handleClickOpen) : (
        <Button variant="contained" onClick={handleClickOpen}>新規車両を追加</Button>
      )}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>新規車両情報</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {loading ? <CircularProgress /> : (
              <>
                <Autocomplete
                  autoFocus
                  options={initialCustomer ? [initialCustomer] : customers}
                  getOptionLabel={(option) => option.name || ''}
                  value={initialCustomer || null}
                  onChange={handleCustomerChange}
                  renderInput={(params) => <TextField {...params} label="顧客" margin="dense" required />}
                  disabled={!!initialCustomer}
                />
                <TextField margin="dense" name="make" label="メーカー" type="text" fullWidth variant="standard" value={formData.make} onChange={handleChange} />
                <TextField margin="dense" name="model" label="モデル" type="text" fullWidth variant="standard" value={formData.model} onChange={handleChange} />
                <TextField margin="dense" name="year" label="年式" type="number" fullWidth variant="standard" value={formData.year} onChange={handleChange} />
                <TextField margin="dense" name="weight" label="車両重量 (kg)" type="number" fullWidth variant="standard" value={formData.weight} onChange={handleChange} />
                <TextField margin="dense" name="vin" label="車台番号(VIN)" type="text" fullWidth variant="standard" value={formData.vin} onChange={handleChange} />
                <TextField margin="dense" name="license_plate" label="ナンバープレート" type="text" fullWidth variant="standard" value={formData.license_plate} onChange={handleChange} />
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>キャンセル</Button>
            <Button type="submit">保存</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

export default AddVehicle;