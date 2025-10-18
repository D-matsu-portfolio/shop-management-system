import React, { useState, useEffect, useContext } from 'react';
import {
  Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Box,
  Autocomplete, CircularProgress, Grid, Alert, Paper, Typography, TextareaAutosize, IconButton
} from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import { apiFetch } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import QRCodeScannerModal from './QRCodeScannerModal';

// Main function to parse the QR code data based on unofficial specs
const parseShakenQrData = (qrString) => {
  const data = {};
  const parts = qrString.split('/');

  // Type 2 contains the main vehicle info
  if (parts[0] === '2') {
    data.model = parts[2]; // 型式
    data.vin = parts[3]; // 車台番号
    data.registration_date = `${parts[4].slice(0, 4)}/${parts[4].slice(4, 6)}`; // 初度登録年月 (YYYY/MM)
    data.type_designation_number = parts[5]; // 型式指定番号
    data.classification_number = parts[6]; // 類別区分番号
    data.shaken_expiry_date = `${parts[7].slice(0, 4)}/${parts[7].slice(4, 6)}/${parts[7].slice(6, 8)}`; // 有効期間の満了する日
    data.make = parts[10]; // 車名
    data.body_style = parts[11]; // 車体の形状
    data.engine_model = parts[13]; // 原動機の型式
    data.fuel_type = parts[14]; // 燃料の種類
    data.displacement = parts[15]; // 総排気量又は定格出力
    data.length = parts[18]; // 長さ
    data.width = parts[19]; // 幅
    data.height = parts[20]; // 高さ
    data.capacity = parts[21]; // 乗車定員
    data.weight = parts[22]; // 車両重量
    data.gross_weight = parts[23]; // 車両総重量
    data.axle_weight_front_front = parts[24]; // 前前軸重
    data.axle_weight_front_rear = parts[25]; // 前後軸重
    data.axle_weight_rear_front = parts[26]; // 後前軸重
    data.axle_weight_rear_rear = parts[27]; // 後後軸重
    data.max_load = parts[30]; // 最大積載量
  }
  // Type 1 contains owner/user info
  else if (parts[0] === '1') {
    data.license_plate = parts[2]; // 自動車登録番号
    data.issue_date = `${parts[3].slice(0, 4)}/${parts[3].slice(4, 6)}/${parts[3].slice(6, 8)}`; // 登録年月日
    data.owner_name = parts[4]; // 所有者の氏名又は名称
    data.owner_address = parts[5]; // 所有者の住所
    data.user_name = parts[7]; // 使用者の氏名又は名称
    data.user_address = parts[8]; // 使用者の住所
    data.base_address = parts[9]; // 使用の本拠の位置
  }

  return data;
};


function AddVehicle({ onVehicleAdded, initialCustomer, renderOpenButton }) {
  const [open, setOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const { isGuest } = useContext(AuthContext);

  const [isScannerOpen, setScannerOpen] = useState(false);
  const [qrCodeData, setQrCodeData] = useState('');
  
  const initialFormState = {
    customer_id: null,
    owner_name: '', // 所有者の氏名又は名称 (free text)
    owner_address: '', // 所有者の住所 (free text)
    license_plate: '', 
    registration_date: '', 
    issue_date: '', 
    make: '', 
    model: '', 
    vin: '', 
    vehicle_type: '', 
    usage: '', 
    purpose: '', 
    body_style: '', 
    capacity: '', 
    max_load: '', 
    weight: '', 
    gross_weight: '', 
    length: '', 
    width: '', 
    height: '', 
    axle_weight_front_front: '', 
    axle_weight_front_rear: '', 
    axle_weight_rear_front: '', 
    axle_weight_rear_rear: '', 
    engine_model: '', 
    displacement: '', 
    fuel_type: '', 
    type_designation_number: '', 
    classification_number: '', 
    shaken_expiry_date: '', 
    user_name: '', 
    user_address: '', 
    base_address: '', 
    odometer_reading: '', 
    odometer_date: '', 
    notes: '',
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    if (initialCustomer) {
      setFormData(prev => ({
        ...prev, 
        customer_id: initialCustomer.id,
        owner_name: initialCustomer.name,
        owner_address: initialCustomer.address,
      }));
    }
  }, [initialCustomer]);

  useEffect(() => {
    if (!open) return;
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const data = await apiFetch('/api/customers');
        setCustomers(data);
      } catch (err) { console.error("Failed to fetch customers", err); }
      finally { setLoading(false); }
    };
    fetchCustomers();
  }, [open]);

  const resetForm = () => {
    setFormData(initialCustomer ? { ...initialFormState, customer_id: initialCustomer.id, owner_name: initialCustomer.name, owner_address: initialCustomer.address } : initialFormState);
    setFormError('');
    setQrCodeData('');
  }

  const handleClickOpen = () => setOpen(true);
  const handleClose = () => { setOpen(false); resetForm(); };

  const handleChange = (e) => {
    setFormError('');
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCustomerChange = (event, newValue) => {
    setFormError('');
    setFormData({
      ...formData, 
      customer_id: newValue ? newValue.id : null,
      owner_name: newValue ? newValue.name : '',
      owner_address: newValue ? newValue.address : '',
    });
  }

  const handleScanSuccess = (decodedText) => {
    setQrCodeData(prev => prev ? `${prev}\n--- (次のQRコード) ---\n${decodedText}` : decodedText);
    const parsedData = parseShakenQrData(decodedText);
    if (Object.keys(parsedData).length > 0) {
      setFormData(prev => ({ ...prev, ...parsedData }));
      alert('QRコードから情報を読み取り、フォームに自動入力しました。');
    }
    setScannerOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      const data = await apiFetch('/api/vehicles', { method: 'POST', body: JSON.stringify(formData) });
      if (data.id) {
        handleClose();
        onVehicleAdded();
      } else { throw new Error(data.message || 'Error creating vehicle'); }
    } catch (error) {
      console.error('Error creating vehicle:', error);
      setFormError(error.message || '車両の作成に失敗しました。');
    }
  };

  const selectedCustomer = customers.find(c => c.id === formData.customer_id) || (initialCustomer && initialCustomer.id === formData.customer_id ? initialCustomer : null) || null;

  return (
    <Box sx={{ my: 2 }}>
      {renderOpenButton ? renderOpenButton(handleClickOpen) : (
        <Button variant="contained" onClick={handleClickOpen}>新規車両を追加</Button>
      )}
      <QRCodeScannerModal open={isScannerOpen} onClose={() => setScannerOpen(false)} onScanSuccess={handleScanSuccess} />
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="lg">
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            新規車両情報 (車検証レイアウト)
            <Button variant="outlined" startIcon={<QrCodeScannerIcon />} onClick={() => setScannerOpen(true)}>QRコード読み取り</Button>
          </Box>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {isGuest && <Alert severity="warning" sx={{ mb: 2 }}>ゲストユーザーは閲覧のみ可能です。</Alert>}
            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
            {loading ? <CircularProgress /> : (
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: 'text.secondary' }}>QRコード読取結果</Typography>
                        <TextareaAutosize minRows={20} value={qrCodeData} readOnly placeholder="ここにQRコードをスキャンした生データが表示されます。" style={{ width: '100%', fontSize: '0.8rem', backgroundColor: '#f5f5f5' }} />
                    </Paper>
                </Grid>

                <Grid item xs={12} md={8}>
                  <Paper component="fieldset" variant="outlined" sx={{ p: 2, mb: 1, borderColor: 'rgba(0, 0, 0, 0.23)' }}>
                    <legend style={{fontSize: '0.75em'}}>車検証</legend>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '16px 12px', alignItems: 'center' }}>
                      {/* ... (grid layout from previous step) ... */}
                      <Box sx={{ gridColumn: '1 / 6' }}><TextField name="license_plate" label="自動車登録番号/車両番号" fullWidth variant="standard" value={formData.license_plate} onChange={handleChange} /></Box>
                      <Box sx={{ gridColumn: '6 / 9' }}><TextField name="issue_date" label="登録/交付年月日" fullWidth variant="standard" value={formData.issue_date} onChange={handleChange} /></Box>
                      <Box sx={{ gridColumn: '9 / 13' }}><TextField name="registration_date" label="初度登録年月" fullWidth variant="standard" value={formData.registration_date} onChange={handleChange} /></Box>
                      <Box sx={{ gridColumn: '1 / 4' }}><TextField name="vehicle_type" label="自動車の種別" fullWidth variant="standard" value={formData.vehicle_type} onChange={handleChange} /></Box>
                      <Box sx={{ gridColumn: '4 / 6' }}><TextField name="usage" label="用途" fullWidth variant="standard" value={formData.usage} onChange={handleChange} /></Box>
                      <Box sx={{ gridColumn: '6 / 9' }}><TextField name="purpose" label="自家用・事業用の別" fullWidth variant="standard" value={formData.purpose} onChange={handleChange} /></Box>
                      <Box sx={{ gridColumn: '9 / 13' }}><TextField name="body_style" label="車体の形状" fullWidth variant="standard" value={formData.body_style} onChange={handleChange} /></Box>
                      <Box sx={{ gridColumn: '1 / 5' }}><TextField name="make" label="車名" fullWidth variant="standard" value={formData.make} onChange={handleChange} /></Box>
                      <Box sx={{ gridColumn: '5 / 7' }}><TextField name="capacity" label="乗車定員" fullWidth variant="standard" value={formData.capacity} onChange={handleChange} /></Box>
                      <Box sx={{ gridColumn: '7 / 9' }}><TextField name="max_load" label="最大積載量" fullWidth variant="standard" value={formData.max_load} onChange={handleChange} /></Box>
                      <Box sx={{ gridColumn: '9 / 11' }}><TextField name="weight" label="車両重量" fullWidth variant="standard" value={formData.weight} onChange={handleChange} /></Box>
                      <Box sx={{ gridColumn: '11 / 13' }}><TextField name="gross_weight" label="車両総重量" fullWidth variant="standard" value={formData.gross_weight} onChange={handleChange} /></Box>
                      <Box sx={{ gridColumn: '1 / 5', alignSelf: 'end' }}><TextField name="vin" label="車台番号" fullWidth variant="standard" value={formData.vin} onChange={handleChange} /></Box>
                      <Box sx={{ gridColumn: '5 / 7' }}><TextField name="length" label="長さ" fullWidth variant="standard" value={formData.length} onChange={handleChange} /></Box>
                      <Box sx={{ gridColumn: '7 / 9' }}><TextField name="width" label="幅" fullWidth variant="standard" value={formData.width} onChange={handleChange} /></Box>
                      <Box sx={{ gridColumn: '9 / 11' }}><TextField name="height" label="高さ" fullWidth variant="standard" value={formData.height} onChange={handleChange} /></Box>
                      <Box sx={{ gridColumn: '1 / 4' }}><TextField name="axle_weight_front_front" label="前前軸重" fullWidth variant="standard" value={formData.axle_weight_front_front} onChange={handleChange} /></Box>
                      <Box sx={{ gridColumn: '4 / 7' }}><TextField name="axle_weight_front_rear" label="前後軸重" fullWidth variant="standard" value={formData.axle_weight_front_rear} onChange={handleChange} /></Box>
                      <Box sx={{ gridColumn: '7 / 10' }}><TextField name="axle_weight_rear_front" label="後前軸重" fullWidth variant="standard" value={formData.axle_weight_rear_front} onChange={handleChange} /></Box>
                      <Box sx={{ gridColumn: '10 / 13' }}><TextField name="axle_weight_rear_rear" label="後後軸重" fullWidth variant="standard" value={formData.axle_weight_rear_rear} onChange={handleChange} /></Box>
                      <Box sx={{ gridColumn: '1 / 5' }}><TextField name="model" label="型式" fullWidth variant="standard" value={formData.model} onChange={handleChange} /></Box>
                      <Box sx={{ gridColumn: '5 / 9' }}><TextField name="engine_model" label="原動機の型式" fullWidth variant="standard" value={formData.engine_model} onChange={handleChange} /></Box>
                      <Box sx={{ gridColumn: '9 / 13' }}><TextField name="displacement" label="総排気量又は定格出力" fullWidth variant="standard" value={formData.displacement} onChange={handleChange} /></Box>
                      <Box sx={{ gridColumn: '1 / 5' }}><TextField name="fuel_type" label="燃料の種類" fullWidth variant="standard" value={formData.fuel_type} onChange={handleChange} /></Box>
                      <Box sx={{ gridColumn: '5 / 9' }}><TextField name="type_designation_number" label="型式指定番号" fullWidth variant="standard" value={formData.type_designation_number} onChange={handleChange} /></Box>
                      <Box sx={{ gridColumn: '9 / 13' }}><TextField name="classification_number" label="類別区分番号" fullWidth variant="standard" value={formData.classification_number} onChange={handleChange} /></Box>
                    </Box>
                  </Paper>

                  <Paper component="fieldset" variant="outlined" sx={{ p: 2, mt: 2, borderColor: 'rgba(0, 0, 0, 0.23)' }}>
                     <legend style={{fontSize: '0.75em'}}>所有者・使用者</legend>
                     <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}><Autocomplete options={customers} getOptionLabel={(option) => option.name || ''} value={selectedCustomer} onChange={handleCustomerChange} renderInput={(params) => <TextField {...params} label="登録顧客から選択" helperText="選択すると所有者名・住所が自動入力されます" />} /></Grid>
                        <Grid item xs={12} sm={6}></Grid> {/* Spacer */}
                        <Grid item xs={12} sm={6}><TextField name="owner_name" label="所有者の氏名又は名称" fullWidth variant="standard" value={formData.owner_name} onChange={handleChange} required /></Grid>
                        <Grid item xs={12} sm={6}><TextField name="owner_address" label="所有者の住所" fullWidth variant="standard" value={formData.owner_address} onChange={handleChange} /></Grid>
                        <Grid item xs={12} sm={6}><TextField name="user_name" label="使用者の氏名又は名称" fullWidth variant="standard" value={formData.user_name} onChange={handleChange} /></Grid>
                        <Grid item xs={12} sm={6}><TextField name="user_address" label="使用者の住所" fullWidth variant="standard" value={formData.user_address} onChange={handleChange} /></Grid>
                        <Grid item xs={12}><TextField name="base_address" label="使用の本拠の位置" fullWidth variant="standard" value={formData.base_address} onChange={handleChange} /></Grid>
                     </Grid>
                  </Paper>

                  <Paper component="fieldset" variant="outlined" sx={{ p: 2, mt: 2, borderColor: 'rgba(0, 0, 0, 0.23)' }}>
                     <legend style={{fontSize: '0.75em'}}>有効期間・備考</legend>
                     <Grid container spacing={2}>
                        <Grid item xs={6}><TextField name="shaken_expiry_date" label="有効期間の満了する日" fullWidth variant="standard" value={formData.shaken_expiry_date} onChange={handleChange} /></Grid>
                        <Grid item xs={6}><TextField name="odometer_reading" label="走行距離計表示値 (km)" fullWidth variant="standard" value={formData.odometer_reading} onChange={handleChange} /></Grid>
                        <Grid item xs={12}><TextField name="notes" label="備考" fullWidth multiline rows={3} variant="standard" value={formData.notes} onChange={handleChange} /></Grid>
                     </Grid>
                  </Paper>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>キャンセル</Button>
            <Button type="submit" variant="contained" disabled={isGuest}>車両を保存</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

export default AddVehicle;
