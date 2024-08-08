import {ToastType} from 'react-native-toast-notifications';
import {ToastOptions} from 'react-native-toast-notifications/lib/typescript/toast';
import {Toast} from 'react-native-toast-notifications';
import variables from '../../styles/variables';

const BASIC_TOAST: ToastOptions = {
  animationType: 'slide-in',
  // duration: 50000,
  placement: 'bottom',
  successColor: variables.colors.green,
  dangerColor: variables.colors.orange,
  warningColor: variables.colors.greenLight,
  normalColor: variables.colors.greenLight,
  style: {
    backgroundColor: variables.colors.greenLight,
    borderRadius: 5,
    padding: 10,
    zIndex: 1000,
  }
};

export const toastSuccess = (message: string, title = "Success", options:ToastOptions = {}) => {
  Toast.show(message, {
    ...BASIC_TOAST,
    ...options,
    type: 'success',
    data: {
      title,
    },
  });
  return null;
};

export const toastInfo = (message: string, title = "Info", options:ToastOptions = {}) => {
  Toast.show(message, {
    ...BASIC_TOAST,
    ...options,
    type: 'info',
    data: {
      title,
    },
  });
  return null;
};

export const toastWarning = (message: string, title = "Warning", options:ToastOptions = {}) => {
  Toast.show(message, {
    ...BASIC_TOAST,
    ...options,
    type: 'warning',
    data: {
      title,
    },
  });
  return null;
};

export const toastError = (message: string, title = "Error", options:ToastOptions = {}) => {
  Toast.show(message, {
    ...BASIC_TOAST,
    ...options,
    type: 'error',
    data: {
      title,
    },
  });
  return null;
};
