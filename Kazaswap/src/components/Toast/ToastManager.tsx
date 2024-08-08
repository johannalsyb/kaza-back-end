import React from 'react';
import {Text, View} from 'react-native';
import {ToastProvider} from 'react-native-toast-notifications';
import variables from '../../styles/variables';
import {StyleSheet} from 'react-native';
import KText from '../KText';

type ToastManagerProps = {
  children: React.ReactNode;
};

export default function ToastManager({children}: ToastManagerProps) {
  return (
    <ToastProvider
      placement="top"
      // duration={4000}
      animationType="slide-in"
      swipeEnabled={true}
      renderType={{
        success: toast => (
          <View style={[styles.shape, styles.success]}>
            <KText style={styles.title}>{toast.data?.title}</KText>
            <KText style={styles.body}>{toast.message}</KText>
          </View>
        ),
        info: toast => (
          <View style={[styles.shape, styles.info]}>
            <KText style={styles.title}>{toast.data?.title}</KText>
            <KText style={styles.body}>{toast.message}</KText>
          </View>
        ),
        warning: toast => (
          <View style={[styles.shape, styles.warning]}>
            <KText style={styles.title}>{toast.data?.title}</KText>
            <KText style={styles.body}>{toast.message}</KText>
          </View>
        ),
        error: toast => (
          <View style={[styles.shape, styles.error]}>
            <KText style={styles.title}>{toast.data?.title}</KText>
            <KText style={styles.body}>{toast.message}</KText>
          </View>
        ),
      }}>
      {children}
    </ToastProvider>
  );
}

const styles = StyleSheet.create({
  shape: {
    width: '97%',
    maxWidth: 400,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    marginTop: 4,
    marginVertical: 4,
    borderRadius: 8,
    borderLeftWidth: 6,
    justifyContent: 'center',
    paddingLeft: 16,
    shadowColor: variables.colors.black,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  title: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  body: {
    marginTop: 2,
    color: '#333',
  },
  success: {
    borderLeftColor: 'green',
  },
  info: {
    borderLeftColor: 'yellow',
  },
  warning: {
    borderLeftColor: 'orange',
  },
  error: {
    borderLeftColor: 'red',
  },
});
