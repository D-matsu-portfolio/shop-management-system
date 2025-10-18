import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Paper, Box, Typography, Grid, CircularProgress, Button, Divider, TableContainer, 
  Table, TableHead, TableBody, TableRow, TableCell, Alert 
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { apiFetch } from '../utils/api';
import AddPayment from './AddPayment'; // Import the new component

// Helper function for formatting currency
const formatCurrency = (value) => {
  return Number(value).toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' });
};

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
}));

// Component for displaying payment status
const PaymentStatus = ({ total, paid }) => {
  const balance = total - paid;
  let statusText;
  let statusColor;

  if (balance <= 0) {
    statusText = '支払い済み';
    statusColor = 'success.main';
  } else if (paid > 0) {
    statusText = '一部入金';
    statusColor = 'warning.main';
  } else {
    statusText = '未払い';
    statusColor = 'error.main';
  }

  return (
    <Box>
      <Typography variant="h6" component="div" sx={{ color: statusColor, fontWeight: 'bold' }}>
        {statusText}
      </Typography>
      <Typography>合計金額: {formatCurrency(total)}</Typography>
      <Typography>入金済み: {formatCurrency(paid)}</Typography>
      <Typography sx={{fontWeight: 'bold'}}>残高: {formatCurrency(balance)}</Typography>
    </Box>
  );
};


function InvoiceDetailPage() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);

  const componentRef = useRef(null);

  const fetchInvoiceData = useCallback(async () => {
    try {
      const invoiceData = await apiFetch(`/api/invoices/${id}`);
      setInvoice(invoiceData);
      const paymentsData = await apiFetch(`/api/payments/invoice/${id}`);
      setPayments(paymentsData);
    } catch (error) {
      console.error('Error fetching invoice data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    fetchInvoiceData();
  }, [fetchInvoiceData]);

  const handlePaymentAdded = () => {
    // Refetch data to show the new payment and updated invoice status
    fetchInvoiceData();
  };

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!invoice) {
    return <Typography>請求書が見つかりません。</Typography>;
  }

  return (
    <Box sx={{ my: 3 }}>
      <AddPayment
        open={isPaymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        invoiceId={id}
        onPaymentAdded={handlePaymentAdded}
      />

      <Box className="no-print" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2}}>
        <Typography variant="h4" component="h1">
          御請求書 (ID: {invoice.id})
        </Typography>
        <Box>
          <Button variant="contained" onClick={() => window.print()} sx={{mr: 2}}>印刷</Button>
          <Button variant="contained" color="primary" onClick={() => setPaymentModalOpen(true)}>
            入金登録
          </Button>
        </Box>
      </Box>
      
      <div ref={componentRef} className="printable-area">
        <Paper sx={{ p: 4, color: '#333' }}>
          <Box sx={{p: 3, backgroundColor: 'secondary.main', color: 'white', mb: 4}}>
            <Typography variant="h4" component="h1" align="center">御請求書</Typography>
          </Box>

          <Grid container justifyContent="space-between" alignItems="flex-start" sx={{mb: 3}}>
            <Grid item xs={6}>
              <Typography variant="h6" gutterBottom sx={{borderBottom: 1, borderColor: 'divider', pb: 1}}>{invoice.customer_name} 様</Typography>
              <Typography variant="body2" sx={{mt: 2}}>〒 {invoice.customer_address}</Typography>
              <Typography variant="body2">TEL: {invoice.customer_phone}</Typography>
            </Grid>
            <Grid item xs={4} sx={{textAlign: 'right'}}>
              <Typography variant="h6">No. {String(invoice.id).padStart(6, '0')}</Typography>
              <Typography variant="body1">請求日: {new Date(invoice.invoice_date).toLocaleDateString('ja-JP')}</Typography>
              <Typography variant="body1">お支払期日: {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('ja-JP') : ''}</Typography>
              <Box sx={{mt: 4}}>
                <Typography variant="subtitle2">株式会社 YOUR COMPANY</Typography>
                <Typography variant="body2">〒123-4567 東京都渋谷区...</Typography>
                <Typography variant="body2">TEL: 03-1234-5678</Typography>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{p: 2, backgroundColor: '#f5f5f5', mb: 3}}>
             <PaymentStatus total={invoice.grand_total} paid={invoice.paid_amount} />
          </Box>

          <Typography variant="h6" gutterBottom>車両情報</Typography>
          <TableContainer component={Paper} variant="outlined" sx={{mb: 4}}>
            <Table size="small">
              <TableBody>
                <TableRow><TableCell sx={{fontWeight: 'bold'}}>メーカー</TableCell><TableCell>{invoice.make}</TableCell><TableCell sx={{fontWeight: 'bold'}}>モデル</TableCell><TableCell>{invoice.model}</TableCell></TableRow>
                <TableRow><TableCell sx={{fontWeight: 'bold'}}>ナンバー</TableCell><TableCell>{invoice.license_plate}</TableCell><TableCell sx={{fontWeight: 'bold'}}>車台番号</TableCell><TableCell>{invoice.vin}</TableCell></TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="h6" gutterBottom>ご請求明細</Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead sx={{backgroundColor: '#fafafa'}}>
                <TableRow><TableCell sx={{fontWeight: 'bold'}}>摘要</TableCell><TableCell align="right" sx={{fontWeight: 'bold'}}>数量</TableCell><TableCell align="right" sx={{fontWeight: 'bold'}}>単価</TableCell><TableCell align="right" sx={{fontWeight: 'bold'}}>金額</TableCell></TableRow>
              </TableHead>
              <TableBody>
                {invoice.line_items.map((item) => (
                  <StyledTableRow key={item.id}><TableCell>{item.description}</TableCell><TableCell align="right">{item.quantity}</TableCell><TableCell align="right">{formatCurrency(item.unit_price)}</TableCell><TableCell align="right">{formatCurrency(item.total_price)}</TableCell></StyledTableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Grid container justifyContent="flex-end" sx={{mt: 2}}>
            <Grid item xs={5}>
              <Paper variant="outlined" sx={{p: 2}}>
                <Grid container><Grid item xs={6}><Typography>小計</Typography></Grid><Grid item xs={6}><Typography align="right">{formatCurrency(invoice.sub_total)}</Typography></Grid></Grid>
                <Divider sx={{my: 1}} />
                <Grid container><Grid item xs={6}><Typography>消費税 (10%)</Typography></Grid><Grid item xs={6}><Typography align="right">{formatCurrency(invoice.tax)}</Typography></Grid></Grid>
                <Divider sx={{my: 1}} />
                <Grid container><Grid item xs={6}><Typography variant="h6">合計金額</Typography></Grid><Grid item xs={6}><Typography variant="h6" align="right">{formatCurrency(invoice.grand_total)}</Typography></Grid></Grid>
              </Paper>
            </Grid>
          </Grid>
          
          {/* Payment History Section */}
          {payments.length > 0 && (
            <Box sx={{mt: 4}}>
              <Typography variant="h6" gutterBottom>入金履歴</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead sx={{backgroundColor: '#fafafa'}}>
                    <TableRow>
                      <TableCell sx={{fontWeight: 'bold'}}>入金日</TableCell>
                      <TableCell align="right" sx={{fontWeight: 'bold'}}>金額</TableCell>
                      <TableCell sx={{fontWeight: 'bold'}}>支払方法</TableCell>
                      <TableCell sx={{fontWeight: 'bold'}}>備考</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payments.map((p) => (
                      <StyledTableRow key={p.id}>
                        <TableCell>{new Date(p.payment_date).toLocaleDateString()}</TableCell>
                        <TableCell align="right">{formatCurrency(p.amount)}</TableCell>
                        <TableCell>{p.payment_method}</TableCell>
                        <TableCell>{p.notes}</TableCell>
                      </StyledTableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {invoice.notes && <Box sx={{mt: 4}}><Typography variant="subtitle1" gutterBottom>備考</Typography><Paper variant="outlined" sx={{p: 2, whiteSpace: 'pre-wrap'}}>{invoice.notes}</Paper></Box>}
        </Paper>
      </div>
    </Box>
  );
}

export default InvoiceDetailPage;
