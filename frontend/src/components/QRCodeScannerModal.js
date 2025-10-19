import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Dialog, DialogContent, DialogTitle, IconButton, Box, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const qrReaderElementId = 'qr-reader-container';

const QRCodeScannerModal = ({ open, onClose, onScanSuccess }) => {
  const scannerRef = useRef(null);

  useEffect(() => {
    if (open) {
      const config = {
        fps: 10,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const size = Math.min(viewfinderWidth, viewfinderHeight) * 0.7;
          return { width: size, height: size };
        },
        // Explicitly request the rear camera. This is critical for mobile.
        videoConstraints: {
          facingMode: "environment"
        }
      };

      const successCallback = (decodedText, decodedResult) => {
        // The scanner stops automatically on success when using Html5QrcodeScanner.
        // To prevent multiple scans, we ensure the modal is closed or handled.
        if (scannerRef.current) {
          onScanSuccess(decodedText);
        }
      };

      const errorCallback = (errorMessage) => {
        // Errors are frequent, ignore them to avoid console spam.
      };

      // If a scanner instance doesn't exist, create one.
      if (!scannerRef.current) {
        const scanner = new Html5QrcodeScanner(
          qrReaderElementId,
          config,
          /* verbose= */ false
        );
        scanner.render(successCallback, errorCallback);
        scannerRef.current = scanner;
      }
    }

    // Cleanup function
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Failed to clear scanner.", error);
        });
        scannerRef.current = null;
      }
    };
    // onClose is added to dependencies to handle modal closure properly
  }, [open, onScanSuccess, onClose]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2 }}>
        QRコードをスキャン
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {/* The container for the scanner UI */}
        <Box id={qrReaderElementId} width="100%" sx={{ "& > div": { border: 'none !important' } }} />
        <Typography variant="body2" color="text.secondary" sx={{mt: 2}}>
          カメラが起動しない、または読み込みがうまくいかない場合は、ブラウザのカメラアクセス許可を確認してください。
        </Typography>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeScannerModal;