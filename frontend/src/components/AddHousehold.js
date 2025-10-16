import React, { useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Box } from '@mui/material';

function AddHousehold({ onHouseholdAdded }) {
  const [open, setOpen] = useState(false);
  const [householdName, setHouseholdName] = useState('');

  const handleClickOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch('/api/households', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ household_name: householdName }),
    })
      .then(response => response.json())
      .then(data => {
        console.log('Household created:', data);
        setHouseholdName('');
        handleClose();
        onHouseholdAdded();
      })
      .catch(error => console.error('Error creating household:', error));
  };

  return (
    <Box sx={{ my: 2 }}>
      <Button variant="contained" onClick={handleClickOpen}>新規世帯を追加</Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>新規世帯</DialogTitle>
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
              value={householdName} 
              onChange={(e) => setHouseholdName(e.target.value)} 
              required 
            />
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

export default AddHousehold;
