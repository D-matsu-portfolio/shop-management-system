import React, { useState, useEffect } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Box } from '@mui/material';

function EditHousehold({ household, onHouseholdUpdated, open, onClose }) {
  const [formData, setFormData] = useState(household);

  useEffect(() => {
    setFormData(household);
  }, [household]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch(`/api/households/${household.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
      .then(response => response.json())
      .then(data => {
        if (data.id) {
          console.log('Household updated:', data);
          onClose();
          onHouseholdUpdated();
        } else {
          throw new Error(data.message || 'Error updating household');
        }
      })
      .catch(error => console.error('Error updating household:', error));
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>世帯名の編集</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
            <TextField 
              autoFocus 
              margin="dense" 
              name="household_name" 
              label="世帯名 (例: 山田様方)" 
              type="text" 
              fullWidth 
              variant="standard" 
              value={formData.household_name || ''} 
              onChange={handleChange} 
              required 
            />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>キャンセル</Button>
          <Button type="submit">保存</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default EditHousehold;
