import React, { useState, useContext } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Box, Alert } from '@mui/material';
import { apiFetch } from '../utils/api';
import { AuthContext } from '../context/AuthContext';

function AddHousehold({ onHouseholdAdded }) {
  const [open, setOpen] = useState(false);
  const [householdName, setHouseholdName] = useState('');
  const { isGuest } = useContext(AuthContext);

  const handleClickOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await apiFetch('/api/households', {
        method: 'POST',
        body: JSON.stringify({ household_name: householdName }),
      });
      console.log('Household created:', data);
      setHouseholdName('');
      handleClose();
      onHouseholdAdded();
    } catch (error) {
      console.error('Error creating household:', error);
      alert('世帯の作成に失敗しました。');
    }
  };

  return (
    <Box sx={{ my: 2 }}>
      <Button variant="contained" onClick={handleClickOpen}>新規世帯を追加</Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>新規世帯</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {isGuest && <Alert severity="warning" sx={{ mb: 2 }}>ゲストユーザーは閲覧のみ可能です。</Alert>}
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
            <Button type="submit" disabled={isGuest}>保存</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

export default AddHousehold;
