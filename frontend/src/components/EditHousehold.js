import React, { useState, useEffect, useContext } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Box, Alert } from '@mui/material';
import { apiFetch } from '../utils/api';
import { AuthContext } from '../context/AuthContext';

function EditHousehold({ household, onHouseholdUpdated, open, onClose }) {
  const [formData, setFormData] = useState(household);
  const { isGuest } = useContext(AuthContext);

  useEffect(() => {
    setFormData(household);
  }, [household]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await apiFetch(`/api/households/${household.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      });
      if (data.id) {
        console.log('Household updated:', data);
        onClose();
        onHouseholdUpdated();
      } else {
        throw new Error(data.message || 'Error updating household');
      }
    } catch (error) {
      console.error('Error updating household:', error);
      alert('世帯の更新に失敗しました。');
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>世帯名の編集</DialogTitle>
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
              value={formData.household_name || ''} 
              onChange={handleChange} 
              required 
            />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>キャンセル</Button>
          <Button type="submit" disabled={isGuest}>保存</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default EditHousehold;
