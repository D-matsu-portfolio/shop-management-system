import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Dialog, DialogContent, DialogTitle, IconButton, Box, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const qrReaderElementId = 'qr-reader-container';

const QRCodeScannerModal = ({ open, onClose, onScanSuccess }) => {
  // Use a ref to hold the scanner instance. This persists across re-renders.
  const scannerRef = useRef(null);

  useEffect(() => {
    if (open) {
      // Ensure the container exists.
      const container = document.getElementById(qrReaderElementId);
      if (!container) return;

      // Initialize scanner
      const scanner = new Html5Qrcode(qrReaderElementId, /* verbose= */ false);
      scannerRef.current = scanner;

      const successCallback = (decodedText, decodedResult) => {
        // Stop scanning on the first successful read.
        if (scannerRef.current && scannerRef.current.isScanning) {
          scannerRef.current.stop()
            .then(() => {
              console.log("QR Scanner stopped on success.");
              onScanSuccess(decodedText); // Notify parent component only after stopping.
            })
            .catch(err => {
              console.error("Failed to stop scanner after success.", err);
              onScanSuccess(decodedText); // Still notify parent even if stopping fails.
            });
        }
      };

      const errorCallback = (errorMessage) => {
        // Errors are frequent, so we don't log them to avoid console spam.
      };

      const config = {
        fps: 10,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const size = Math.min(viewfinderWidth, viewfinderHeight) * 0.7;
          return {
            width: size,
            height: size,
          };
        },
      };

      // Start scanning.
      scanner.start({ facingMode: 'environment' }, config, successCallback, errorCallback)
        .catch(err => {
          console.warn('Environment camera failed, trying user camera.', err);
          scanner.start({ facingMode: 'user' }, config, successCallback, errorCallback)
            .catch(err2 => {
              console.error('Could not start scanner with any camera.', err2);
            });
        });
    }

    // Cleanup function: This is called when the component unmounts or `open` changes.
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop()
          .then(() => console.log("QR Scanner cleaned up."))
          .catch(err => console.warn("Cleanup stop failed.", err));
      }
    };
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
        {open && <Box id={qrReaderElementId} width="100%"></Box>}
        <Typography variant="body2" color="text.secondary" sx={{mt: 2}}>
          カメラが起動しない、または読み込みがうまくいかない場合は、ブラウザのカメラアクセス許可を確認してください。
        </Typography>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeScannerModal;