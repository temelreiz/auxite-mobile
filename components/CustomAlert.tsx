import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Dimensions,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/stores/useStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  type: AlertType;
  buttons?: AlertButton[];
  timeout?: number; // Saniye cinsinden timeout
}

const alertConfig: Record<AlertType, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  success: { icon: 'checkmark-circle', color: '#10B981' },
  error: { icon: 'close-circle', color: '#EF4444' },
  warning: { icon: 'warning', color: '#F59E0B' },
  info: { icon: 'information-circle', color: '#3B82F6' },
};

interface AlertComponentProps {
  alert: AlertState;
  onHide: (buttonCallback?: () => void) => void;
}

function AlertModal({ alert, onHide }: AlertComponentProps) {
  const colorScheme = useColorScheme();
  const systemIsDark = colorScheme === 'dark';
  const { theme } = useStore();
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  const [countdown, setCountdown] = useState(alert.timeout || 0);

  const config = alertConfig[alert.type];

  const colors = {
    background: isDark ? '#1C1C1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#1A1A1A',
    subtext: isDark ? '#A1A1AA' : '#6B7280',
    overlay: isDark ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.5)',
    cancelBg: isDark ? '#3A3A3C' : '#E5E7EB',
    cancelText: isDark ? '#FFFFFF' : '#374151',
  };

  // Countdown timer
  useEffect(() => {
    if (!alert.visible || !alert.timeout) return;
    
    setCountdown(alert.timeout);
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onHide(); // Timeout olunca kapat
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [alert.visible, alert.timeout]);

  if (!alert.visible) return null;

  const buttons = alert.buttons && alert.buttons.length > 0 
    ? alert.buttons 
    : [{ text: 'Tamam', onPress: undefined }];

  const getButtonStyle = (button: AlertButton, index: number) => {
    if (button.style === 'cancel') {
      return { backgroundColor: colors.cancelBg };
    }
    if (button.style === 'destructive') {
      return { backgroundColor: '#F59E0B' };
    }
    return { backgroundColor: '#10B981' };
  };

  const getButtonTextStyle = (button: AlertButton) => {
    if (button.style === 'cancel') {
      return { color: colors.cancelText };
    }
    return { color: '#FFFFFF' };
  };

  return (
    <Modal
      transparent
      visible={alert.visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => onHide()}
    >
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <TouchableOpacity
          style={styles.overlayTouch}
          activeOpacity={1}
          onPress={() => onHide()}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={[
              styles.container,
              { backgroundColor: colors.background },
            ]}
          >
            {/* Icon with countdown */}
            <View style={styles.iconRow}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: `${config.color}15` },
                ]}
              >
                <Ionicons name={config.icon} size={28} color={config.color} />
              </View>
              {alert.timeout && countdown > 0 && (
                <View style={[styles.countdownBadge, { backgroundColor: countdown > 10 ? '#10B981' : '#EF4444' }]}>
                  <Ionicons name="time" size={12} color="#fff" />
                  <Text style={styles.countdownText}>{countdown}s</Text>
                </View>
              )}
            </View>

            {/* Content */}
            <Text style={[styles.title, { color: colors.text }]}>
              {alert.title}
            </Text>

            {alert.message ? (
              <Text style={[styles.message, { color: colors.subtext }]}>
                {alert.message}
              </Text>
            ) : null}

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              {buttons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    getButtonStyle(button, index),
                  ]}
                  onPress={() => onHide(button.onPress)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.buttonText, getButtonTextStyle(button)]}>
                    {button.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// Hook
export function useCustomAlert() {
  const [alert, setAlert] = useState<AlertState>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    buttons: [],
    timeout: 0,
  });

  const showAlert = useCallback(
    (
      title: string, 
      message: string, 
      type: AlertType = 'info', 
      buttons?: AlertButton[],
      timeout?: number
    ) => {
      Keyboard.dismiss();
      setAlert({ visible: true, title, message, type, buttons, timeout });
    },
    []
  );

  const hideAlert = useCallback((buttonCallback?: () => void) => {
    setAlert((prev) => ({ ...prev, visible: false }));
    if (buttonCallback) {
      setTimeout(buttonCallback, 150);
    }
  }, []);

  const AlertComponent = useCallback(
    () => <AlertModal alert={alert} onHide={hideAlert} />,
    [alert, hideAlert]
  );

  return { showAlert, hideAlert, AlertComponent };
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouch: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: Math.min(SCREEN_WIDTH - 48, 340),
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  countdownText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  buttonContainer: {
    width: '100%',
    gap: 10,
  },
  button: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});

export default useCustomAlert;
