import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Dialog, DialogContent, DialogTitle, IconButton, Box, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const qrReaderElementId = 'qr-reader-container';

const QRCodeScannerModal = ({ open, onClose, onScanSuccess }) => {
  const scannerRef = useRef(null);

  useEffect(() => {
    if (open) {
      // Use the low-level API for more control over the camera fallback.
      const scanner = new Html5Qrcode(qrReaderElementId, /* verbose= */ false);
      scannerRef.current = scanner;

      const successCallback = (decodedText, decodedResult) => {
        if (scannerRef.current && scannerRef.current.isScanning) {
          scannerRef.current.stop()
            .then(() => {
              onScanSuccess(decodedText);
            })
            .catch(err => {
              console.error("Failed to stop scanner after success.", err);
              onScanSuccess(decodedText); // Notify parent even if stopping fails.
            });
        }
      };

      const errorCallback = (errorMessage) => {
        // Errors are frequent, so we don't log them to avoid console spam.
      };

      // Configuration with the responsive qrbox, which was a good improvement.
      const config = {
        fps: 10,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const size = Math.min(viewfinderWidth, viewfinderHeight) * 0.7;
          return { width: size, height: size };
        },
      };

      // Start scanning: Try rear camera first, then fall back to front camera.
      // This robustly handles both mobile devices and PCs.
      scanner.start({ facingMode: 'environment' }, config, successCallback, errorCallback)
        .catch(err => {
          console.warn('Rear camera failed to start, trying front camera.', err);
          scanner.start({ facingMode: 'user' }, config, successCallback, errorCallback)
            .catch(err2 => {
              console.error('Could not start scanner with any camera.', err2);
            });
        });
    }

    // Cleanup function
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
        <Box id={qrReaderElementId} width="100%" />
        <Typography variant="body2" color="text.secondary" sx={{mt: 2}}>
          カメラが起動しない、または読み込みがうまくいかない場合は、ブラウザのカメラアクセス許可を確認してください。
        </Typography>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeScannerModal;