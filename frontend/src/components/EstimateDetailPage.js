import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Paper, Box, Typography, Grid, CircularProgress, Button, Divider, TableContainer, 
  Table, TableHead, TableBody, TableRow, TableCell, Dialog, DialogActions, DialogContent, 
  DialogTitle, TextField 
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { apiFetch } from '../utils/api';

// Helper function for formatting currency
const formatCurrency = (value) => {
  return Number(value).toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' });
};

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
}));

function EstimateDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState({ 
    invoice_date: new Date().toISOString().slice(0, 10),
    due_date: ''
  });

  const componentRef = useRef(null);

  useEffect(() => {
    const fetchEstimate = async () => {
      setLoading(true);
      try {
        const data = await apiFetch(`/api/estimates/${id}`);
        setEstimate(data);
      } catch (error) {
        console.error('Error fetching estimate details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEstimate();
  }, [id]);

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

  if (loading) {
    return <CircularProgress />;
  }

  if (!estimate) {
    return <Typography>見積もりが見つかりません。</Typography>;
  }

  return (
    <Box sx={{ my: 3 }}>
      <Box className="no-print" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2}}>
        <Typography variant="h4" component="h1">
          御見積書 (ID: {estimate.id})
        </Typography>
        <Box>
          <Button variant="contained" onClick={() => window.print()} sx={{mr: 2}}>印刷</Button>
          <Button variant="contained" color="secondary" onClick={() => setIsInvoiceDialogOpen(true)} disabled={estimate.status === 'invoiced'}>
            {estimate.status === 'invoiced' ? '請求書作成済み' : '請求書を作成'}
          </Button>
        </Box>
      </Box>
      
      <div ref={componentRef} className="printable-area">
        <Paper sx={{ p: 4, color: '#333' }}>
          <Box sx={{p: 3, backgroundColor: 'primary.main', color: 'white', mb: 4}}>
            <Typography variant="h4" component="h1" align="center">御見積書</Typography>
          </Box>

          <Grid container justifyContent="space-between" alignItems="flex-start" sx={{mb: 3}}>
            <Grid xs={6}>
              <Typography variant="h6" gutterBottom sx={{borderBottom: 1, borderColor: 'divider', pb: 1}}>{estimate.customer_name} 様</Typography>
              <Typography variant="body2" sx={{mt: 2}}>〒 {estimate.customer_address}</Typography>
              <Typography variant="body2">TEL: {estimate.customer_phone}</Typography>
            </Grid>
            <Grid xs={4} sx={{textAlign: 'right'}}>
              <Typography variant="h6">No. {String(estimate.id).padStart(6, '0')}</Typography>
              <Typography variant="body1">発行日: {new Date(estimate.estimate_date).toLocaleDateString('ja-JP')}</Typography>
              <Box sx={{mt: 4}}>
                <Typography variant="subtitle2">株式会社 YOUR COMPANY</Typography>
                <Typography variant="body2">〒123-4567 東京都渋谷区...</Typography>
                <Typography variant="body2">TEL: 03-1234-5678</Typography>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{p: 2, backgroundColor: '#f5f5f5', mb: 3, textAlign: 'center'}}>
            <Typography variant="h5">ご請求予定金額: {formatCurrency(estimate.grand_total)}</Typography>
          </Box>

          <Typography variant="h6" gutterBottom>車両情報</Typography>
          <TableContainer component={Paper} variant="outlined" sx={{mb: 4}}>
            <Table size="small">
              <TableBody>
                <TableRow><TableCell sx={{fontWeight: 'bold'}}>メーカー</TableCell><TableCell>{estimate.make}</TableCell><TableCell sx={{fontWeight: 'bold'}}>モデル</TableCell><TableCell>{estimate.model}</TableCell></TableRow>
                <TableRow><TableCell sx={{fontWeight: 'bold'}}>ナンバー</TableCell><TableCell>{estimate.license_plate}</TableCell><TableCell sx={{fontWeight: 'bold'}}>車台番号</TableCell><TableCell>{estimate.vin}</TableCell></TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="h6" gutterBottom>お見積り明細</Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead sx={{backgroundColor: '#fafafa'}}>
                <TableRow><TableCell sx={{fontWeight: 'bold'}}>摘要</TableCell><TableCell align="right" sx={{fontWeight: 'bold'}}>数量</TableCell><TableCell align="right" sx={{fontWeight: 'bold'}}>単価</TableCell><TableCell align="right" sx={{fontWeight: 'bold'}}>金額</TableCell></TableRow>
              </TableHead>
              <TableBody>
                {estimate.line_items.map((item) => (
                  <StyledTableRow key={item.id}><TableCell>{item.description}</TableCell><TableCell align="right">{item.quantity}</TableCell><TableCell align="right">{formatCurrency(item.unit_price)}</TableCell><TableCell align="right">{formatCurrency(item.total_price)}</TableCell></StyledTableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Grid container justifyContent="flex-end" sx={{mt: 2}}>
            <Grid xs={5}>
              <Paper variant="outlined" sx={{p: 2}}>
                <Grid container><Grid xs={6}><Typography>小計</Typography></Grid><Grid xs={6}><Typography align="right">{formatCurrency(estimate.sub_total)}</Typography></Grid></Grid>
                <Divider sx={{my: 1}} />
                <Grid container><Grid xs={6}><Typography>消費税 (10%)</Typography></Grid><Grid xs={6}><Typography align="right">{formatCurrency(estimate.tax)}</Typography></Grid></Grid>
                <Divider sx={{my: 1}} />
                <Grid container><Grid xs={6}><Typography variant="h6">合計金額</Typography></Grid><Grid xs={6}><Typography variant="h6" align="right">{formatCurrency(estimate.grand_total)}</Typography></Grid></Grid>
              </Paper>
            </Grid>
          </Grid>

          {estimate.notes && <Box sx={{mt: 4}}><Typography variant="subtitle1" gutterBottom>備考</Typography><Paper variant="outlined" sx={{p: 2, whiteSpace: 'pre-wrap'}}>{estimate.notes}</Paper></Box>}
        </Paper>
      </div>

      {/* Dialog for Invoice Generation */}
      <Dialog open={isInvoiceDialogOpen} onClose={() => setIsInvoiceDialogOpen(false)} className="no-print">
        <DialogTitle>請求書作成</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" name="invoice_date" label="請求日" type="date" fullWidth variant="standard" value={invoiceData.invoice_date} onChange={(e) => setInvoiceData({...invoiceData, invoice_date: e.target.value})} InputLabelProps={{ shrink: true }} />
          <TextField margin="dense" name="due_date" label="支払期日" type="date" fullWidth variant="standard" value={invoiceData.due_date} onChange={(e) => setInvoiceData({...invoiceData, due_date: e.target.value})} InputLabelProps={{ shrink: true }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsInvoiceDialogOpen(false)}>キャンセル</Button>
          <Button onClick={handleGenerateInvoice}>作成</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default EstimateDetailPage;