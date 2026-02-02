// components/Toast.tsx
// Custom Toast Notification Component
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  visible: boolean;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  onHide: () => void;
}

const ICONS: Record<ToastType, string> = {
  success: 'checkmark-circle',
  error: 'close-circle',
  warning: 'warning',
  info: 'information-circle',
};

const COLORS: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: { bg: '#10b98120', border: '#10b981', icon: '#10b981' },
  error: { bg: '#ef444420', border: '#ef4444', icon: '#ef4444' },
  warning: { bg: '#f59e0b20', border: '#f59e0b', icon: '#f59e0b' },
  info: { bg: '#3b82f620', border: '#3b82f6', icon: '#3b82f6' },
};

export const Toast: React.FC<ToastProps> = ({ visible, type, title, message, duration = 3000, onHide }) => {
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -100, duration: 200, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onHide());
  };

  if (!visible) return null;

  const colors = COLORS[type];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + 10,
          backgroundColor: isDark ? '#1e293b' : '#fff',
          borderLeftColor: colors.border,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.bg }]}>
        <Ionicons name={ICONS[type] as any} size={24} color={colors.icon} />
      </View>
      <View style={styles.content}>
        {title && <Text style={[styles.title, { color: isDark ? '#fff' : '#0f172a' }]}>{title}</Text>}
        <Text style={[styles.message, { color: isDark ? '#94a3b8' : '#64748b' }]}>{message}</Text>
      </View>
      <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
        <Ionicons name="close" size={20} color={isDark ? '#64748b' : '#94a3b8'} />
      </TouchableOpacity>
    </Animated.View>
  );
};

// Hook for easy usage
import { useState, useCallback } from 'react';

interface ToastState {
  visible: boolean;
  type: ToastType;
  title?: string;
  message: string;
}

export const useToast = () => {
  const [toast, setToast] = useState<ToastState>({ visible: false, type: 'info', message: '' });

  const showToast = useCallback((type: ToastType, message: string, title?: string) => {
    setToast({ visible: true, type, title, message });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

  return { toast, showToast, hideToast };
};

// Confirmation Modal
interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title,
  message,
  confirmText = 'Onayla',
  cancelText = 'İptal',
  confirmColor = '#ef4444',
  onConfirm,
  onCancel,
}) => {
  const isDark = useColorScheme() === 'dark';

  if (!visible) return null;

  return (
    <View style={styles.modalOverlay}>
      <View style={[styles.modalContainer, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
        <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#0f172a' }]}>{title}</Text>
        <Text style={[styles.modalMessage, { color: isDark ? '#94a3b8' : '#64748b' }]}>{message}</Text>
        <View style={styles.modalButtons}>
          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}
            onPress={onCancel}
          >
            <Text style={[styles.modalButtonText, { color: isDark ? '#fff' : '#0f172a' }]}>{cancelText}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: confirmColor }]}
            onPress={onConfirm}
          >
            <Text style={[styles.modalButtonText, { color: '#fff' }]}>{confirmText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export const useConfirm = () => {
  const [state, setState] = useState({
    visible: false,
    title: '',
    message: '',
    confirmText: 'Onayla',
    cancelText: 'İptal',
    confirmColor: '#ef4444',
    onConfirm: () => {},
  });

  const showConfirm = useCallback((options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmColor?: string;
    onConfirm: () => void;
  }) => {
    setState({
      visible: true,
      title: options.title,
      message: options.message,
      confirmText: options.confirmText || 'Onayla',
      cancelText: options.cancelText || 'İptal',
      confirmColor: options.confirmColor || '#ef4444',
      onConfirm: options.onConfirm,
    });
  }, []);

  const hideConfirm = useCallback(() => {
    setState(prev => ({ ...prev, visible: false }));
  }, []);

  return { confirm: state, showConfirm, hideConfirm };
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 9999,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
  },
  closeButton: {
    padding: 4,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  modalContainer: {
    width: '85%',
    padding: 24,
    borderRadius: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default Toast;
