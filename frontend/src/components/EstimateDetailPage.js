import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, Typography, CircularProgress, Button, Dialog, DialogActions, DialogContent, 
  DialogTitle, TextField, Autocomplete, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { apiFetch } from '../utils/api';
import './EstimateDetailPage.css';

const formatCurrency = (value) => {
  const num = Number(value);
  if (isNaN(num)) return '';
  return num.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' });
};


const nonTaxableKeywords = ['重量税', '自賠責', '印紙代'];
const taxableShakenKeywords = ['車検基本料'];

function EstimateDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [editableEstimate, setEditableEstimate] = useState(null);
  const [error, setError] = useState(null);
  const [allCustomers, setAllCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [parts, setParts] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState({ 
    invoice_date: new Date().toISOString().slice(0, 10),
    due_date: ''
  });

  const componentRef = useRef(null);

  const initializeNewEstimate = (initialData) => {
    const { initialCustomer, initialVehicle } = initialData || {};
    const emptyLineItems = Array.from({ length: 12 }, (_, i) => ({ id: `new-${Date.now()}-${i}`, description: '', quantity: 1, unit_price: 0, item_type: 'service' }));
    const newEstimate = {
      customer_id: initialCustomer?.id || null,
      vehicle_id: initialVehicle?.id || null,
      estimate_date: new Date().toISOString().slice(0, 10),
      status: 'draft',
      notes: '',
      estimate_type: '一般整備',
      line_items: emptyLineItems,
      customer_name: initialCustomer?.name || '',
      customer_address: initialCustomer?.address || '',
      customer_phone: initialCustomer?.phone_number || '',
      make: initialVehicle?.make || '',
      model: initialVehicle?.model || '',
      license_plate: initialVehicle?.license_plate || '',
      vin: initialVehicle?.vin || '',
      weight: initialVehicle?.weight || '',
      vehicle_type: initialVehicle?.vehicle_type || ''
    };
    setEditableEstimate(newEstimate);
  };

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [customerData, partsData, servicesData] = await Promise.all([
          apiFetch('/api/customers'),
          apiFetch('/api/parts'),
          apiFetch('/api/services'),
        ]);
        setAllCustomers(customerData);
        setParts(partsData);
        setServices(servicesData);
        return { customerData, partsData, servicesData };
      } catch (error) {
        console.error('Error fetching master data:', error);
        setError('マスタデータの読み込みに失敗しました。');
        return null;
      }
    };

    const fetchEstimate = async (estimateId) => {
      try {
        const estimateData = await apiFetch(`/api/estimates/${estimateId}`);
        const rowsToAdd = 12 - (estimateData.line_items?.length || 0);
        if (rowsToAdd > 0) {
          for (let i = 0; i < rowsToAdd; i++) {
            estimateData.line_items.push({ id: `new-${Date.now()}-${i}`, description: '', quantity: 1, unit_price: 0, item_type: 'service' });
          }
        }
        setEditableEstimate(estimateData);
      } catch (error) {
        console.error(`Error fetching estimate ${estimateId}:`, error);
        setError('見積もりデータの読み込みに失敗しました。');
      }
    };

    const runFetch = async () => {
      setLoading(true);
      setError(null);
      await fetchMasterData();

      if (id && id !== 'new') {
        await fetchEstimate(id);
      } else {
        // This is a new estimate
        initializeNewEstimate(location.state);
      }
      setLoading(false);
    };

    runFetch();
  }, [id, location.state]);

  const customerId = editableEstimate?.customer_id;
  useEffect(() => {
    if (customerId) {
      const fetchVehicles = async () => {
        try {
          const data = await apiFetch(`/api/vehicles/by-customer/${customerId}`);
          setVehicles(data);
        } catch (error) { console.error('Error fetching vehicles:', error); }
      };
      fetchVehicles();
    } else {
      setVehicles([]);
    }
  }, [customerId]);

  const handleFetchAndSetShakenFees = async () => {
    if (editableEstimate.estimate_type === '車検' && editableEstimate.vehicle_id && editableEstimate.weight && editableEstimate.vehicle_type) {
      try {
        const fees = await apiFetch(`/api/estimates/shaken-fees?vehicleWeight=${editableEstimate.weight}&vehicleType=${editableEstimate.vehicle_type}`);
        const feeItems = fees.map(fee => ({ id: `new-fee-${fee.item_name}`, item_type: 'fee', description: fee.item_name, quantity: 1, unit_price: fee.cost }));
        const nonShakenItems = editableEstimate.line_items.filter(item => ![...nonTaxableKeywords, ...taxableShakenKeywords].some(keyword => item.description.includes(keyword)));
        setEditableEstimate(e => ({...e, line_items: [...nonShakenItems, ...feeItems]}));
      } catch (err) {
        console.error("Failed to fetch shaken fees", err);
      }
    }
  };

  const handleCustomerSelect = (event, newValue) => {
    setEditableEstimate(e => ({ ...e, customer_id: newValue?.id || null, customer_name: newValue?.name || '', customer_address: newValue?.address || '', customer_phone: newValue?.phone_number || '', vehicle_id: null, make: '', model: '', license_plate: '', vin: '', weight: '', vehicle_type: '' }));
  };

  const handleVehicleSelect = (event, newValue) => {
    setEditableEstimate(e => ({ ...e, vehicle_id: newValue?.id || null, make: newValue?.make || '', model: newValue?.model || '', license_plate: newValue?.license_plate || '', vin: newValue?.vin || '', weight: newValue?.weight || '', vehicle_type: newValue?.vehicle_type || '' }));
  };

  const handleAddLineItemFromMaster = (item, type) => {
    if (!item) return;
    const newItem = { id: `new-${Date.now()}`, description: item.name, quantity: 1, unit_price: type === 'part' ? item.sale_price : item.default_total_cost, item_type: type, part_id: type === 'part' ? item.id : null, service_id: type === 'service' ? item.id : null };
    const firstEmptyIndex = editableEstimate.line_items.findIndex(li => li.item_type === 'service' && li.description === '');
    const updatedLineItems = [...editableEstimate.line_items];
    if (firstEmptyIndex > -1) {
      updatedLineItems.splice(firstEmptyIndex, 1, newItem);
    } else {
      updatedLineItems.push(newItem);
    }
    setEditableEstimate(e => ({ ...e, line_items: updatedLineItems }));
  };

  const handleServiceItemChange = (e, index) => {
    const { name, value } = e.target;
    const updatedLineItems = [...editableEstimate.line_items];
    const originalItem = serviceItems[index];
    const originalIndex = editableEstimate.line_items.findIndex(item => item.id === originalItem.id);
    if (originalIndex > -1) {
      updatedLineItems[originalIndex] = { ...updatedLineItems[originalIndex], [name]: value };
      setEditableEstimate({ ...editableEstimate, line_items: updatedLineItems });
    }
  };

  const handleAddServiceRow = () => {
    const newItem = { id: `new-${Date.now()}`, description: '', quantity: 1, unit_price: 0, item_type: 'service' };
    setEditableEstimate({ ...editableEstimate, line_items: [...editableEstimate.line_items, newItem] });
  };

  const handleDeleteServiceRow = (index) => {
    const originalItem = serviceItems[index];
    const updatedLineItems = editableEstimate.line_items.filter(item => item.id !== originalItem.id);
    setEditableEstimate({ ...editableEstimate, line_items: updatedLineItems });
  };

  const handleSave = async () => {
    const isNew = !editableEstimate.id;
    const payload = { ...editableEstimate, line_items: editableEstimate.line_items.filter(item => item.description && item.description.trim() !== '') };
    try {
      setLoading(true);
      if (isNew) {
        const data = await apiFetch('/api/estimates', { method: 'POST', body: JSON.stringify(payload) });
        alert('保存しました。');
        navigate(`/estimates/${data.id}`, { replace: true });
      } else {
        await apiFetch(`/api/estimates/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
        const data = await apiFetch(`/api/estimates/${id}`);
        setEditableEstimate(data);
        alert('保存しました。');
      }
    } catch (err) {
      console.error('Failed to save estimate', err);
      alert('保存に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoice = async () => {
    try {
      const data = await apiFetch(`/api/invoices/from-estimate/${id}`, {
        method: 'POST',
        body: JSON.stringify(invoiceData),
      });
      if (data.id) {
        navigate(`/invoices/${data.id}`);
      } else {
        throw new Error(data.message || 'Error creating invoice');
      }
    } catch (err) {
      console.error('Error creating invoice:', err);
      alert('請求書の作成に失敗しました。');
    }
  };

  if (loading || !editableEstimate) return <CircularProgress />;

  const serviceItems = editableEstimate.line_items.filter(item => !nonTaxableKeywords.some(keyword => item.description.includes(keyword)) && !taxableShakenKeywords.some(keyword => item.description.includes(keyword)));
  const nonTaxableShakenItems = editableEstimate.line_items.filter(item => nonTaxableKeywords.some(keyword => item.description.includes(keyword)));
  const taxableShakenItems = editableEstimate.line_items.filter(item => taxableShakenKeywords.some(keyword => item.description.includes(keyword)));
  const serviceTotal = serviceItems.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.unit_price)), 0);
  const nonTaxableTotal = nonTaxableShakenItems.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.unit_price)), 0);
  const taxableTotal = taxableShakenItems.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.unit_price)), 0);
  const subTotal = serviceTotal + taxableTotal;
  const tax = subTotal * 0.10;
  const grandTotal = subTotal + tax + nonTaxableTotal;

  return (
    <Box sx={{ my: 3 }}>
      <Box className="no-print" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2}}>
        <Typography variant="h4" component="h1">御見積書 (ID: {editableEstimate.id || 'New'})</Typography>
        <Box>
          <Button variant="contained" color="primary" onClick={handleSave} sx={{mr: 2}}>保存</Button>
          <Button variant="contained" onClick={() => window.print()} sx={{mr: 2}}>印刷</Button>
          <Button variant="contained" color="secondary" onClick={() => setIsInvoiceDialogOpen(true)} disabled={!editableEstimate.id || editableEstimate.status === 'invoiced'}>請求書を作成</Button>
        </Box>
      </Box>
      <div ref={componentRef} className="printable-area">
        <div className="estimate-container">
          <div className="print-header screen-only">
            <div style={{display: 'flex', alignItems: 'center'}}>
              <Autocomplete options={allCustomers} getOptionLabel={(option) => option.name || ''} value={allCustomers.find(c => c.id === editableEstimate.customer_id) || null} onChange={handleCustomerSelect} renderInput={(params) => <TextField {...params} label="顧客を選択" required />} sx={{width: 300, mr: 2}} />
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>見積種別</InputLabel>
                <Select value={editableEstimate.estimate_type || '一般整備'} label="見積種別" onChange={(e) => setEditableEstimate({...editableEstimate, estimate_type: e.target.value }) }>
                  <MenuItem value="一般整備">一般整備</MenuItem>
                  <MenuItem value="車検">車検</MenuItem>
                </Select>
              </FormControl>
            </div>
            <div className="print-meta-info">
              <Typography variant="h6">No. {editableEstimate.id ? String(editableEstimate.id).padStart(6, '0') : '新規'}</Typography>
              <Typography variant="body1">発行日: <input type="date" value={editableEstimate.estimate_date.slice(0,10)} onChange={(e) => setEditableEstimate({...editableEstimate, estimate_date: e.target.value})} /></Typography>
            </div>
          </div>
          <div className="print-only">
            <Typography variant="h4" component="h1" className="print-title">御見積書</Typography>
            <div className="print-header">
              <div className="print-customer-info"><Typography variant="h6" gutterBottom>{editableEstimate.customer_name} 様</Typography></div>
              <div className="print-meta-info"><Typography variant="h6">No. {editableEstimate.id ? String(editableEstimate.id).padStart(6, '0') : '新規'}</Typography></div>
            </div>
          </div>
          <Typography variant="h6" gutterBottom>車両情報</Typography>
          <div className="print-table-container" style={{marginBottom: '25px'}}>
            <table><tbody>
              <tr><td>
                <Autocomplete options={vehicles} getOptionLabel={(option) => `${option.make} ${option.model} (${option.license_plate})` || ''} value={vehicles.find(v => v.id === editableEstimate.vehicle_id) || null} onChange={handleVehicleSelect} disabled={!editableEstimate.customer_id} renderInput={(params) => <TextField {...params} label="車両を選択" required />} sx={{width: 400}}/>
              </td></tr>
            </tbody></table>
          </div>
          {editableEstimate.estimate_type === '車検' && (
            <Button className="no-print" onClick={handleFetchAndSetShakenFees} variant="outlined" sx={{mb: 2}} disabled={!editableEstimate.vehicle_id}>諸費用を自動計算・反映</Button>
          )}
          <div className="new-layout">
            <div className="main-content">
              <Box className="no-print" sx={{display: 'flex', gap: 2, mb: 2}}>
                <Autocomplete options={parts} getOptionLabel={(o) => `${o.name} (${o.part_number || ''}) - ${Number(o.sale_price).toLocaleString()}円` || ''} onChange={(e, val) => { if(val) handleAddLineItemFromMaster(val, 'part'); }} renderInput={(params) => <TextField {...params} label="部品を検索して追加" />} sx={{flexGrow: 1}} />
                <Autocomplete options={services} getOptionLabel={(o) => `${o.name} - ${Number(o.default_total_cost).toLocaleString()}円` || ''} onChange={(e, val) => { if(val) handleAddLineItemFromMaster(val, 'service'); }} renderInput={(params) => <TextField {...params} label="作業を検索して追加" />} sx={{flexGrow: 1}}/>
              </Box>
              <Typography variant="h6" gutterBottom>整備費用明細</Typography>
              <div className="print-table-container"> 
                <table>
                  <thead><tr><th className="desc-col">摘要</th><th className="qty-col">数量</th><th className="price-col">単価</th><th className="price-col">金額</th><th className="no-print"></th></tr></thead>
                  <tbody>
                    {serviceItems.map((item, index) => (
                      <tr key={item.id}>
                        <td><input type="text" name="description" value={item.description} className="desc-input" onChange={(e) => handleServiceItemChange(e, index)} /></td>
                        <td align="right"><input type="number" name="quantity" value={item.quantity} className="qty-input" onChange={(e) => handleServiceItemChange(e, index)} /></td>
                        <td align="right"><input type="number" name="unit_price" value={item.unit_price} className="price-input" onChange={(e) => handleServiceItemChange(e, index)} /></td>
                        <td align="right">{formatCurrency(Number(item.quantity) * Number(item.unit_price))}</td>
                        <td className="no-print"><Button size="small" color="error" onClick={() => handleDeleteServiceRow(index)}>削除</Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button className="no-print" onClick={handleAddServiceRow} sx={{mt: 1}}>+ 行を追加</Button>
            </div>
            <div className="sidebar-content">
              <div className="summary-box"><div className="summary-box-header">課税諸費用</div><div className="summary-box-content">{taxableShakenItems.map(item => (<div className="summary-row" key={item.id}><span>{item.description}</span><span>{formatCurrency(Number(item.quantity) * Number(item.unit_price))}</span></div>))}</div><div className="summary-box-footer">課税諸費用計: {formatCurrency(taxableTotal)}</div></div>
              <div className="summary-box"><div className="summary-box-header">非課税諸費用</div><div className="summary-box-content">{nonTaxableShakenItems.map(item => (<div className="summary-row" key={item.id}><span>{item.description}</span><span>{formatCurrency(Number(item.quantity) * Number(item.unit_price))}</span></div>))}</div><div className="summary-box-footer">非課税諸費用計: {formatCurrency(nonTaxableTotal)}</div></div>
              <div className="summary-box"><div className="summary-box-header">車両整備明細</div><div className="summary-box-content"><div className="summary-row"><span>整備費用計</span><span>{formatCurrency(serviceTotal)}</span></div><div className="summary-row"><span>課税諸費用計</span><span>{formatCurrency(taxableTotal)}</span></div><div className="summary-row"><span>消費税 (10%)</span><span>{formatCurrency(tax)}</span></div><div className="summary-row"><span>非課税諸費用計</span><span>{formatCurrency(nonTaxableTotal)}</span></div></div><div className="summary-box-footer grand-total">合計金額: {formatCurrency(grandTotal)}</div></div>
            </div>
          </div>
        </div>
      </div>
      <Dialog open={isInvoiceDialogOpen} onClose={() => setIsInvoiceDialogOpen(false)} className="no-print"><DialogTitle>請求書作成</DialogTitle><DialogContent><TextField autoFocus margin="dense" name="invoice_date" label="請求日" type="date" fullWidth variant="standard" value={invoiceData.invoice_date} onChange={(e) => setInvoiceData({...invoiceData, invoice_date: e.target.value})} InputLabelProps={{ shrink: true }} /><TextField margin="dense" name="due_date" label="支払期日" type="date" fullWidth variant="standard" value={invoiceData.due_date} onChange={(e) => setInvoiceData({...invoiceData, due_date: e.target.value})} InputLabelProps={{ shrink: true }} /></DialogContent><DialogActions><Button onClick={() => setIsInvoiceDialogOpen(false)}>キャンセル</Button><Button onClick={handleGenerateInvoice}>作成</Button></DialogActions></Dialog>
    </Box>
  );
}

export default EstimateDetailPage;
