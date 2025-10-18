import React, { useState, useEffect, useContext } from 'react';
import { 
  Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Box, 
  Autocomplete, CircularProgress, Select, MenuItem, FormControl, InputLabel, Alert, Grid
} from '@mui/material';
import { apiFetch } from '../utils/api';
import { AuthContext } from '../context/AuthContext';

function EditVehicle({ vehicle, onVehicleUpdated, open, onClose }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(vehicle);
  const [formError, setFormError] = useState('');
  const { isGuest } = useContext(AuthContext);

  useEffect(() => {
    // Ensure formData is not null and has defaults for all fields
    const initialData = {
      make: '',
      model: '',
      year: '',
      vin: '',
      license_plate: '',
      weight: '',
      vehicle_type: '',
      ...vehicle,
    };
    setFormData(initialData);
    setFormError(''); // Clear error when vehicle prop changes
  }, [vehicle, open]); // Rerun when dialog opens

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

  const handleClose = () => {
    setFormError('');
    onClose();
  }

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
      const data = await apiFetch(`/api/vehicles/${vehicle.id}`,
        {
          method: 'PUT',
          body: JSON.stringify(formData),
        }
      );
      if (data.id) {
        console.log('Vehicle updated:', data);
        onVehicleUpdated();
        handleClose();
      } else {
        throw new Error(data.message || 'Error updating vehicle');
      }
    } catch (error) {
      console.error('Error updating vehicle:', error);
      if (error.status === 409) {
        setFormError(error.message);
      } else {
        setFormError('車両の更新に失敗しました。');
      }
    }
  };

  // Find the selected customer object for the Autocomplete component
  const getSelectedCustomer = () => {
    if (!formData || !formData.customer_id) return null;
    let customer = customers.find(c => c.id === formData.customer_id);
    return customer || null;
  }
  
  const selectedCustomer = getSelectedCustomer();

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md">
      <DialogTitle>車両情報の編集 (車検証レイアウト)</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {isGuest && <Alert severity="warning" sx={{ mb: 2 }}>ゲストユーザーは閲覧のみ可能です。</Alert>}
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
              />
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <TextField name="license_plate" label="自動車登録番号又は車両番号" fullWidth variant="outlined" value={formData.license_plate || ''} onChange={handleChange} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField name="year" label="初度登録年月" type="number" fullWidth variant="outlined" value={formData.year || ''} onChange={handleChange} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField name="make" label="車名" fullWidth variant="outlined" value={formData.make || ''} onChange={handleChange} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField name="model" label="型式" fullWidth variant="outlined" value={formData.model || ''} onChange={handleChange} />
                </Grid>
                <Grid item xs={12}>
                  <TextField name="vin" label="車台番号" fullWidth variant="outlined" value={formData.vin || ''} onChange={handleChange} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel id="vehicle-type-label">自動車の種別</InputLabel>
                    <Select
                      labelId="vehicle-type-label"
                      name="vehicle_type"
                      value={formData.vehicle_type || ''}
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
                  <TextField name="weight" label="車両重量 (kg)" type="number" fullWidth variant="outlined" value={formData.weight || ''} onChange={handleChange} />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>キャンセル</Button>
          <Button type="submit" disabled={isGuest}>保存</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default EditVehicle;
