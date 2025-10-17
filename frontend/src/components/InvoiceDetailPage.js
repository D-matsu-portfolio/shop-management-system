import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Paper, Box, Typography, Grid, CircularProgress, Button, Divider, TableContainer, 
  Table, TableHead, TableBody, TableRow, TableCell 
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

function InvoiceDetailPage() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  const componentRef = useRef(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      setLoading(true);
      try {
        const data = await apiFetch(`/api/invoices/${id}`);
        setInvoice(data);
      } catch (error) {
        console.error('Error fetching invoice details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id]);

  if (loading) {
    return <CircularProgress />;
  }

  if (!invoice) {
    return <Typography>請求書が見つかりません。</Typography>;
  }

  return (
    <Box sx={{ my: 3 }}>
      <Box className="no-print" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2}}>
        <Typography variant="h4" component="h1">
          御請求書 (ID: {invoice.id})
        </Typography>
        <Box>
          <Button variant="contained" onClick={() => window.print()} sx={{mr: 2}}>印刷</Button>
          {/* Payment button can be added here */}
        </Box>
      </Box>
      
      <div ref={componentRef} className="printable-area">
        <Paper sx={{ p: 4, color: '#333' }}>
          <Box sx={{p: 3, backgroundColor: 'secondary.main', color: 'white', mb: 4}}>
            <Typography variant="h4" component="h1" align="center">御請求書</Typography>
          </Box>

          <Grid container justifyContent="space-between" alignItems="flex-start" sx={{mb: 3}}>
            <Grid xs={6}>
              <Typography variant="h6" gutterBottom sx={{borderBottom: 1, borderColor: 'divider', pb: 1}}>{invoice.customer_name} 様</Typography>
              <Typography variant="body2" sx={{mt: 2}}>〒 {invoice.customer_address}</Typography>
              <Typography variant="body2">TEL: {invoice.customer_phone}</Typography>
            </Grid>
            <Grid xs={4} sx={{textAlign: 'right'}}>
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

          <Box sx={{p: 2, backgroundColor: '#f5f5f5', mb: 3, textAlign: 'center'}}>
            <Typography variant="h5">ご請求金額: {formatCurrency(invoice.grand_total)}</Typography>
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
            <Grid xs={5}>
              <Paper variant="outlined" sx={{p: 2}}>
                <Grid container><Grid xs={6}><Typography>小計</Typography></Grid><Grid xs={6}><Typography align="right">{formatCurrency(invoice.sub_total)}</Typography></Grid></Grid>
                <Divider sx={{my: 1}} />
                <Grid container><Grid xs={6}><Typography>消費税 (10%)</Typography></Grid><Grid xs={6}><Typography align="right">{formatCurrency(invoice.tax)}</Typography></Grid></Grid>
                <Divider sx={{my: 1}} />
                <Grid container><Grid xs={6}><Typography variant="h6">合計金額</Typography></Grid><Grid xs={6}><Typography variant="h6" align="right">{formatCurrency(invoice.grand_total)}</Typography></Grid></Grid>
              </Paper>
            </Grid>
          </Grid>

          {invoice.notes && <Box sx={{mt: 4}}><Typography variant="subtitle1" gutterBottom>備考</Typography><Paper variant="outlined" sx={{p: 2, whiteSpace: 'pre-wrap'}}>{invoice.notes}</Paper></Box>}
        </Paper>
      </div>
    </Box>
  );
}

export default InvoiceDetailPage;
