import React, { useState } from 'react';
import { Box, Typography, Paper, Button, Alert, CircularProgress } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { styled } from '@mui/material/styles';
import { apiFetch } from '../utils/api';

const VisuallyHiddenInput = styled('input')({ clip: 'rect(0 0 0 0)', clipPath: 'inset(50%)', height: 1, overflow: 'hidden', position: 'absolute', bottom: 0, left: 0, whiteSpace: 'nowrap', width: 1, });

const ImportSection = ({ title, endpoint, onImportSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setMessage({ type: '', text: '' });
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'ファイルを選択してください。' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await apiFetch(endpoint, {
        method: 'POST',
        body: formData,
      });
      setMessage({ type: 'success', text: response.msg || `${title}のインポートが完了しました。` });
      setSelectedFile(null);
      if (onImportSuccess) onImportSuccess();
    } catch (error) {
      console.error('Import error:', error);
      setMessage({ type: 'error', text: error.message || `${title}のインポートに失敗しました。` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>{title}のインポート</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Button component="label" variant="contained" startIcon={<CloudUploadIcon />}>
          ファイルを選択
          <VisuallyHiddenInput type="file" accept=".csv" onChange={handleFileChange} />
        </Button>
        {selectedFile && <Typography variant="body2">{selectedFile.name}</Typography>}
      </Box>
      <Button variant="contained" color="primary" onClick={handleUpload} disabled={!selectedFile || loading}>
        {loading ? <CircularProgress size={24} /> : 'インポート開始'}
      </Button>
      {message.text && (
        <Alert severity={message.type} sx={{ mt: 2 }}>
          {message.text}
        </Alert>
      )}
    </Paper>
  );
};

function ImportPage() {
  const handleImportSuccess = () => {
    // Optionally, trigger a refetch of relevant data in other components
    // or show a global success notification.
    console.log('Import successful, consider refreshing data.');
  };

  return (
    <Box sx={{ my: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        マスタデータCSVインポート
      </Typography>

      <ImportSection
        title="部品マスタ"
        endpoint="/api/parts/import"
        onImportSuccess={handleImportSuccess}
      />

      <ImportSection
        title="作業マスタ"
        endpoint="/api/services/import"
        onImportSuccess={handleImportSuccess}
      />

      <ImportSection
        title="法定費用マスタ"
        endpoint="/api/statutory-costs/import"
        onImportSuccess={handleImportSuccess}
      />
    </Box>
  );
}

export default ImportPage;
