import { AlertColor } from '@mui/material';

export interface SnackbarMessage {
  message: string;
  severity: AlertColor;
  key: number;
}

export interface SnackbarState {
  open: boolean;
  messageInfo: SnackbarMessage | undefined;
}

export const createSnackbarMessage = (message: string, severity: AlertColor = 'info'): SnackbarMessage => ({
  message,
  severity,
  key: Date.now(),
});

export const showSnackbar = (
  message: string,
  severity: AlertColor = 'info',
  setSnackbarState: React.Dispatch<React.SetStateAction<SnackbarState>>
) => {
  const messageInfo = createSnackbarMessage(message, severity);
  setSnackbarState({
    open: true,
    messageInfo,
  });
};

export const handleSnackbarClose = (
  setSnackbarState: React.Dispatch<React.SetStateAction<SnackbarState>>
) => {
  setSnackbarState((prev) => ({
    ...prev,
    open: false,
  }));
};
