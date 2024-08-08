export type ToastMessage = {
  message: string;
  severity?: 'success' | 'info' | 'warning' | 'error';
  autoRemove?: boolean;
};
