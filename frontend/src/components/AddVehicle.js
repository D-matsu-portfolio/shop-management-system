import React, { useState, useEffect } from 'react';
import { 
  Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Box, 
  Autocomplete, CircularProgress, Select, MenuItem, FormControl, InputLabel, Grid, Alert
} from '@mui/material';
import { apiFetch } from '../utils/api';

// The button to open the dialog can be customized by passing a render prop
function AddVehicle({ onVehicleAdded, initialCustomer, renderOpenButton }) {
  const [open, setOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  
  const [formData, setFormData] = useState({
    customer_id: null,
    make: '',
    model: '',
    year: '',
    vin: '',
    license_plate: '',
    weight: '',
    vehicle_type: '',
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
    setFormData({ ...initialData, make: '', model: '', year: '', vin: '', license_plate: '', weight: '', vehicle_type: '' });
    setFormError('');
  }

  const handleClickOpen = () => setOpen(true);
  const handleClose = () => { setOpen(false); resetForm(); };

  const handleChange = (e) => {
    setFormError('');
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCustomerChange = (event, newValue) => {
    setFormError('');
    setFormData({ ...formData, customer_id: newValue ? newValue.id : null });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
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
      if (error.status === 409) {
        setFormError(error.message);
      } else {
        setFormError('車両の作成に失敗しました。');
      }
    }
  };

  const selectedCustomer = customers.find(c => c.id === formData.customer_id) || (initialCustomer && initialCustomer.id === formData.customer_id ? initialCustomer : null) || null;

  return (
    <Box sx={{ my: 2 }}>
      {renderOpenButton ? renderOpenButton(handleClickOpen) : (
        <Button variant="contained" onClick={handleClickOpen}>新規車両を追加</Button>
      )}
      <Dialog open={open} onClose={handleClose} maxWidth="md">
        <DialogTitle>新規車両情報 (車検証レイアウト)</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
            {loading ? <CircularProgress /> : (
              <Box>
                <Autocomplete
                  autoFocus
                  options={customers}
                  getOptionLabel={(option) => option.name || ''}
                  value={selectedCustomer}
                  onChange={handleCustomerChange}
                  renderInput={(params) => <TextField {...params} label="所有者 (顧客)" margin="normal" required variant="outlined" />}
                  disabled={!!initialCustomer}
                />
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField name="license_plate" label="自動車登録番号又は車両番号" fullWidth variant="outlined" value={formData.license_plate} onChange={handleChange} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField name="year" label="初度登録年月" type="number" fullWidth variant="outlined" value={formData.year} onChange={handleChange} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField name="make" label="車名" fullWidth variant="outlined" value={formData.make} onChange={handleChange} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField name="model" label="型式" fullWidth variant="outlined" value={formData.model} onChange={handleChange} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField name="vin" label="車台番号" fullWidth variant="outlined" value={formData.vin} onChange={handleChange} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel id="vehicle-type-label">自動車の種別</InputLabel>
                      <Select
                        labelId="vehicle-type-label"
                        name="vehicle_type"
                        value={formData.vehicle_type}
                        onChange={handleChange}
                        label="自動車の種別"
                      >
                        <MenuItem value=""><em>None</em></MenuItem>
                        <MenuItem value="普通">普通</MenuItem>
                        <MenuItem value="軽自動車">軽自動車</MenuItem>
                        <MenuItem value="小型">小型</MenuItem>
                        <MenuItem value="大型特殊">大型特殊</MenuItem>
                        <MenuItem value="その他">その他</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField name="weight" label="車両重量 (kg)" type="number" fullWidth variant="outlined" value={formData.weight} onChange={handleChange} />
                  </Grid>
                </Grid>
              </Box>
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