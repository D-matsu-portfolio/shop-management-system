import React, { useState, useEffect } from 'react';
import { 
  Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Box, 
  Autocomplete, CircularProgress
} from '@mui/material';

function EditCustomer({ customer, onCustomerUpdated, open, onClose }) {
  const [households, setHouseholds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(customer);

  useEffect(() => {
    setFormData(customer);
  }, [customer]);

  // Fetch all households when the dialog opens
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch('/api/households')
      .then(res => res.json())
      .then(data => {
        setHouseholds(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch households", err);
        setLoading(false);
      });
  }, [open]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleHouseholdChange = (event, newValue) => {
    setFormData({ ...formData, household_id: newValue ? newValue.id : null });
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch(`/api/customers/${customer.id}`,
     {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
      .then(response => response.json())
      .then(data => {
        if (data.id) {
          console.log('Customer updated:', data);
          onClose();
          onCustomerUpdated();
        } else {
          throw new Error(data.message || 'Error updating customer');
        }
      })
      .catch(error => console.error('Error updating customer:', error));
  };

  // Find the full household object for the Autocomplete value
  const selectedHousehold = households.find(h => h.id === formData.household_id) || null;

  return (
      <Dialog open={open} onClose={onClose}>
        <DialogTitle>顧客情報の編集</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {loading ? <CircularProgress /> : (
              <>
                <TextField autoFocus margin="dense" name="name" label="顧客名" type="text" fullWidth variant="standard" value={formData.name || ''} onChange={handleChange} required />
                <Autocomplete
                  options={households}
                  getOptionLabel={(option) => option.household_name || ''}
                  value={selectedHousehold}
                  onChange={handleHouseholdChange}
                  renderInput={(params) => <TextField {...params} label="世帯を選択 (任意)" margin="dense" />}
                />
                <TextField margin="dense" name="phone_number" label="電話番号" type="text" fullWidth variant="standard" value={formData.phone_number || ''} onChange={handleChange} />
                <TextField margin="dense" name="email" label="メールアドレス" type="email" fullWidth variant="standard" value={formData.email || ''} onChange={handleChange} />
                <TextField margin="dense" name="address" label="住所" type="text" fullWidth variant="standard" value={formData.address || ''} onChange={handleChange} />
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

export default EditCustomer;
