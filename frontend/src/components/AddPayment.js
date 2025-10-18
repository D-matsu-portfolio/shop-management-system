import React, { useState } from 'react';
import {
  Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField,
  CircularProgress, Alert, Select, MenuItem, InputLabel, FormControl
} from '@mui/material';
import { apiFetch } from '../utils/api';

const AddPayment = ({ open, onClose, invoiceId, onPaymentAdded }) => {
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('銀行振込');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!amount || isNaN(amount) || amount <= 0) {
      setError('有効な金額を入力してください。');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const newPayment = await apiFetch('/api/payments', {
        method: 'POST',
        body: JSON.stringify({
          invoice_id: invoiceId,
          amount: parseFloat(amount),
          payment_date: paymentDate,
          payment_method: paymentMethod,
          notes: notes,
        }),
      });
      onPaymentAdded(newPayment);
      // Reset form
      setAmount('');
      setNotes('');
      onClose();
    } catch (err) {
      setError(err.message || '入金登録中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>入金登録 (請求書ID: {invoiceId})</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField
          autoFocus
          margin="dense"
          label="入金日"
          type="date"
          fullWidth
          variant="outlined"
          value={paymentDate}
          onChange={(e) => setPaymentDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{mb: 2}}
        />
        <TextField
          margin="dense"
          label="金額 (円)"
          type="number"
          fullWidth
          variant="outlined"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          sx={{mb: 2}}
        />
        <FormControl fullWidth margin="dense" sx={{mb: 2}}>
          <InputLabel>支払方法</InputLabel>
          <Select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            label="支払方法"
          >
            <MenuItem value="銀行振込">銀行振込</MenuItem>
            <MenuItem value="現金">現金</MenuItem>
            <MenuItem value="クレジットカード">クレジットカード</MenuItem>
            <MenuItem value="その他">その他</MenuItem>
          </Select>
        </FormControl>
        <TextField
          margin="dense"
          label="備考"
          type="text"
          fullWidth
          multiline
          rows={3}
          variant="outlined"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </DialogContent>
      <DialogActions sx={{p: '0 24px 16px'}}>
        <Button onClick={onClose} disabled={loading} color="inherit">キャンセル</Button>
        <Button onClick={handleSubmit} disabled={loading} variant="contained">
          {loading ? <CircularProgress size={24} /> : '登録'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddPayment;
