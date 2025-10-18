import React, { useState, useEffect, useCallback } from 'react';
import { 
  Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Box, 
  Autocomplete, CircularProgress, Typography, IconButton, Grid, Paper, Divider,
  Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import { apiFetch } from '../utils/api';

const estimateTypes = ['一般整備', '車検'];

function AddEstimate({ onEstimateAdded, initialCustomer, initialVehicle, renderOpenButton }) {
  // Dialog State
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Master Data State
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [parts, setParts] = useState([]);
  const [services, setServices] = useState([]);

  // Form State
  const [estimateType, setEstimateType] = useState('一般整備');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [estimateDate, setEstimateDate] = useState(new Date().toISOString().slice(0, 10));
  const [lineItems, setLineItems] = useState([]);
  const [notes, setNotes] = useState('');

  // Pre-fill customer and vehicle if provided
  useEffect(() => {
    if (initialCustomer) setSelectedCustomer(initialCustomer);
    if (initialVehicle) setSelectedVehicle(initialVehicle);
  }, [initialCustomer, initialVehicle]);

  // Fetch master data when dialog opens
  useEffect(() => {
    if (!open) return;
    const fetchMasterData = async () => {
      setLoading(true);
      try {
        const [customerData, vehicleData, partsData, servicesData] = await Promise.all([
          !initialCustomer ? apiFetch('/api/customers') : Promise.resolve([initialCustomer]),
          !initialVehicle ? apiFetch('/api/vehicles') : Promise.resolve([initialVehicle]),
          apiFetch('/api/parts'),
          apiFetch('/api/services'),
        ]);
        setCustomers(customerData);
        setVehicles(vehicleData);
        setParts(partsData);
        setServices(servicesData);
      } catch (err) {
        console.error("Failed to fetch data for estimate form", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMasterData();
  }, [open, initialCustomer, initialVehicle]);

  // Auto-populate fees when estimate type is "Shaken" and a vehicle is selected
  useEffect(() => {
    const fetchShakenFees = async () => {
      if (estimateType === '車検' && selectedVehicle && selectedVehicle.weight && selectedVehicle.vehicle_type) {
        const shakenBaseService = services.find(s => s.service_code === 'SHAKEN-BASE');
        const baseItems = shakenBaseService ? [{
          item_type: 'service',
          service_id: shakenBaseService.id,
          description: shakenBaseService.name,
          quantity: 1,
          unit_price: shakenBaseService.default_total_cost,
          is_fixed: true,
        }] : [];

        try {
          const fees = await apiFetch(`/api/estimates/shaken-fees?vehicleWeight=${selectedVehicle.weight}&vehicleType=${selectedVehicle.vehicle_type}`);
          const feeItems = fees.map(fee => ({ item_type: 'fee', description: fee.item_name, quantity: 1, unit_price: fee.cost, is_fixed: true }));
          const otherItems = lineItems.filter(item => !item.is_fixed);
          setLineItems([...baseItems, ...feeItems, ...otherItems]);
        } catch (err) {
          console.error("Failed to fetch shaken fees", err);
        }
      } else {
        const otherItems = lineItems.filter(item => !item.is_fixed);
        setLineItems(otherItems);
      }
    };
    fetchShakenFees();
  }, [estimateType, selectedVehicle, services]);

  const resetForm = () => {
    setEstimateType('一般整備');
    setSelectedCustomer(initialCustomer || null);
    setSelectedVehicle(initialVehicle || null);
    setEstimateDate(new Date().toISOString().slice(0, 10));
    setLineItems([]);
    setNotes('');
  }

  const handleClickOpen = () => setOpen(true);
  const handleClose = () => { setOpen(false); resetForm(); };

  const handleAddLineItem = (item, type) => {
    const newLineItem = { item_type: type, part_id: type === 'part' ? item.id : null, service_id: type === 'service' ? item.id : null, description: item.name, quantity: 1, unit_price: type === 'part' ? item.sale_price : item.default_total_cost, is_fixed: false };
    setLineItems([...lineItems, newLineItem]);
  };

  const handleLineItemChange = (index, event) => { const values = [...lineItems]; values[index][event.target.name] = event.target.value; setLineItems(values); };
  const handleRemoveLineItem = (index) => { const values = [...lineItems]; values.splice(index, 1); setLineItems(values); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { customer_id: selectedCustomer.id, vehicle_id: selectedVehicle.id, estimate_date: estimateDate, status: 'draft', notes: notes, line_items: lineItems.map(item => ({ ...item, unit_price: Number(item.unit_price), quantity: Number(item.quantity) })) };
    try {
      const data = await apiFetch('/api/estimates', { method: 'POST', body: JSON.stringify(payload) });
      if(data.id) { 
        handleClose(); 
        onEstimateAdded(); 
      } else { 
        throw new Error(data.message || 'Error creating estimate'); 
      }
    } catch (error) {
      console.error('Error creating estimate:', error);
      alert('見積もりの作成に失敗しました。');
    }
  };

  const subTotal = lineItems.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.unit_price)), 0);
  const tax = subTotal * 0.10;
  const grandTotal = subTotal + tax;

  return (
    <Box sx={{ my: 2 }}>
      {renderOpenButton ? renderOpenButton(handleClickOpen) : <Button variant="contained" onClick={handleClickOpen}>新規見積もりを作成</Button>}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="lg">
        <DialogTitle>新規見積もり作成</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {loading ? <CircularProgress /> : (
              <Grid container spacing={3}>
                <Grid xs={12} md={4}>
                  <Typography variant="h6">基本情報</Typography>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>見積もり種別</InputLabel>
                    <Select value={estimateType} label="見積もり種別" onChange={(e) => setEstimateType(e.target.value)}>{estimateTypes.map(type => <MenuItem key={type} value={type}>{type}</MenuItem>)}</Select>
                  </FormControl>
                  <Autocomplete value={selectedCustomer} options={customers} getOptionLabel={(o) => o.name || ''} onChange={(e, val) => setSelectedCustomer(val)} renderInput={(params) => <TextField {...params} label="顧客を選択" required margin="normal" />} disabled={!!initialCustomer} />
                  <Autocomplete value={selectedVehicle} options={vehicles.filter(v => selectedCustomer && v.customer_id === selectedCustomer.id)} getOptionLabel={(o) => `${o.make} ${o.model} (${o.license_plate}) - ${o.weight}kg` || ''} onChange={(e, val) => setSelectedVehicle(val)} renderInput={(params) => <TextField {...params} label="車両を選択" required margin="normal" />} disabled={!selectedCustomer || !!initialVehicle} key={selectedCustomer ? selectedCustomer.id : ''} />
                  <TextField label="見積日" type="date" fullWidth value={estimateDate} onChange={(e) => setEstimateDate(e.target.value)} InputLabelProps={{ shrink: true }} required margin="normal" />
                  <TextField label="備考" fullWidth multiline rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} margin="normal" />
                </Grid>
                <Grid xs={12} md={8}>
                  <Typography variant="h6">明細</Typography>
                  <Box sx={{display: 'flex', gap: 2, mb: 2}}>
                     <Autocomplete options={parts} getOptionLabel={(o) => `${o.name} (${o.part_number || ''}) - ${Number(o.sale_price).toLocaleString()}円` || ''} onChange={(e, val) => { if(val) handleAddLineItem(val, 'part'); }} renderInput={(params) => <TextField {...params} label="部品を検索して追加" />} sx={{flexGrow: 1}} />
                     <Autocomplete options={services} getOptionLabel={(o) => `${o.name} - ${Number(o.default_total_cost).toLocaleString()}円` || ''} onChange={(e, val) => { if(val) handleAddLineItem(val, 'service'); }} renderInput={(params) => <TextField {...params} label="作業を検索して追加" />} sx={{flexGrow: 1}}/>
                  </Box>
                  <Paper variant="outlined">
                    {lineItems.map((lineItem, index) => (
                      <React.Fragment key={index}>
                        <Grid container spacing={1} alignItems="center" sx={{ p: 1, bgcolor: lineItem.is_fixed ? '#f5f5f5' : 'transparent' }}>
                          <Grid xs={5}><TextField name="description" label="作業内容・部品名" fullWidth value={lineItem.description} onChange={e => handleLineItemChange(index, e)} size="small" required disabled={lineItem.is_fixed} /></Grid>
                          <Grid xs={2}><TextField name="quantity" label="数量" type="number" fullWidth value={lineItem.quantity} onChange={e => handleLineItemChange(index, e)} size="small" required disabled={lineItem.is_fixed} /></Grid>
                          <Grid xs={3}><TextField name="unit_price" label="単価" type="number" fullWidth value={lineItem.unit_price} onChange={e => handleLineItemChange(index, e)} size="small" required disabled={lineItem.is_fixed} /></Grid>
                          <Grid xs={1}><Typography align="right">{ (Number(lineItem.quantity) * Number(lineItem.unit_price)).toLocaleString() }円</Typography></Grid>
                          <Grid item xs={1}>{!lineItem.is_fixed && <IconButton onClick={() => handleRemoveLineItem(index)} size="small"><DeleteIcon /></IconButton>}</Grid>
                        </Grid>
                        {index < lineItems.length - 1 && <Divider />} 
                      </React.Fragment>
                    ))}
                     {lineItems.length === 0 && <Typography sx={{p: 2, color: 'text.secondary'}}>明細がありません。上部の検索ボックスから部品や作業を追加してください。</Typography>}
                  </Paper>
                  <Box sx={{mt: 2, pr: 2, textAlign: 'right'}}>
                      <Typography variant="body1">小計: {subTotal.toLocaleString()}円</Typography>
                      <Typography variant="body1">消費税 (10%): {tax.toLocaleString()}円</Typography>
                      <Typography variant="h6">合計金額: {grandTotal.toLocaleString()}円</Typography>
                  </Box>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>キャンセル</Button>
            <Button type="submit" variant="contained">保存</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

export default AddEstimate;
