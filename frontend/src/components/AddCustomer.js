import React, { useState, useEffect } from 'react';
import { 
  Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Box, 
  Autocomplete, CircularProgress, Alert
} from '@mui/material';

function AddCustomer({ onCustomerAdded }) {
  const [open, setOpen] = useState(false);
  const [households, setHouseholds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suggestedHousehold, setSuggestedHousehold] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    email: '',
    address: '',
    household_id: null,
  });

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

  const resetForm = () => {
    setFormData({ name: '', phone_number: '', email: '', address: '', household_id: null });
    setSuggestedHousehold(null);
  }

  const handleClickOpen = () => setOpen(true);
  const handleClose = () => { setOpen(false); resetForm(); };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleHouseholdChange = (event, newValue) => {
    setFormData({ ...formData, household_id: newValue ? newValue.id : null });
  }

  // This is the new function to check for existing households at the same address
  const handleAddressBlur = () => {
    if (!formData.address) return;

    fetch(`/api/customers?address=${encodeURIComponent(formData.address)}`)
      .then(res => res.json())
      .then(existingCustomers => {
        const foundHousehold = existingCustomers.find(c => c.household_id && c.household_name);
        if (foundHousehold) {
          setSuggestedHousehold({ id: foundHousehold.household_id, name: foundHousehold.household_name });
        }
      })
      .catch(err => console.error('Error checking address:', err));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
      .then(response => response.json())
      .then(data => {
        if (data.id) {
          console.log('Customer created:', data);
          handleClose();
          onCustomerAdded();
        } else {
          throw new Error(data.message || 'Error creating customer');
        }
      })
      .catch(error => console.error('Error creating customer:', error));
  };

  return (
    <Box sx={{ my: 2 }}>
      <Button variant="contained" onClick={handleClickOpen}>新規顧客を追加</Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>新規顧客情報</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {loading ? <CircularProgress /> : (
              <>
                <TextField autoFocus margin="dense" name="name" label="顧客名" type="text" fullWidth variant="standard" value={formData.name} onChange={handleChange} required />
                <TextField margin="dense" name="address" label="住所" type="text" fullWidth variant="standard" value={formData.address} onChange={handleChange} onBlur={handleAddressBlur} />
                
                {suggestedHousehold && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    もしかして、このご住所は「{suggestedHousehold.name}」様方ですか？ 
                    その場合は、下のドロップダウンから選択してください。
                  </Alert>
                )}

                <Autocomplete
                  options={households}
                  getOptionLabel={(option) => option.household_name || ''}
                  onChange={handleHouseholdChange}
                  renderInput={(params) => <TextField {...params} label="世帯を選択 (任意)" margin="dense" />}

                />
                <TextField margin="dense" name="phone_number" label="電話番号" type="text" fullWidth variant="standard" value={formData.phone_number} onChange={handleChange} />
                <TextField margin="dense" name="email" label="メールアドレス" type="email" fullWidth variant="standard" value={formData.email} onChange={handleChange} />
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

export default AddCustomer;
