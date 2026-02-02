// app/auth/verify-email.tsx
// Email Verification Screen

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useStore } from '@/stores/useStore';
import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://wallet.auxite.io';

const translations = {
  tr: {
    title: 'E-postanızı Doğrulayın',
    subtitle: 'E-posta adresinize gönderilen 6 haneli kodu girin',
    sentTo: 'Kod gönderildi:',
    verify: 'Doğrula',
    verifying: 'Doğrulanıyor...',
    resend: 'Kodu Tekrar Gönder',
    resendIn: 'Tekrar gönder',
    seconds: 'sn',
    invalidCode: 'Geçersiz kod. Lütfen tekrar deneyin.',
    expiredCode: 'Kod süresi doldu. Yeni kod isteyin.',
    success: 'E-posta doğrulandı!',
    codeSent: 'Yeni kod gönderildi!',
  },
  en: {
    title: 'Verify Your Email',
    subtitle: 'Enter the 6-digit code sent to your email',
    sentTo: 'Code sent to:',
    verify: 'Verify',
    verifying: 'Verifying...',
    resend: 'Resend Code',
    resendIn: 'Resend in',
    seconds: 's',
    invalidCode: 'Invalid code. Please try again.',
    expiredCode: 'Code expired. Please request a new one.',
    success: 'Email verified!',
    codeSent: 'New code sent!',
  },
  de: {
    title: 'E-Mail bestätigen',
    subtitle: 'Geben Sie den 6-stelligen Code ein',
    sentTo: 'Code gesendet an:',
    verify: 'Bestätigen',
    verifying: 'Wird bestätigt...',
    resend: 'Code erneut senden',
    resendIn: 'Erneut senden in',
    seconds: 's',
    invalidCode: 'Ungültiger Code. Bitte erneut versuchen.',
    expiredCode: 'Code abgelaufen. Bitte neuen anfordern.',
    success: 'E-Mail bestätigt!',
    codeSent: 'Neuer Code gesendet!',
  },
  fr: {
    title: 'Vérifiez votre e-mail',
    subtitle: 'Entrez le code à 6 chiffres',
    sentTo: 'Code envoyé à:',
    verify: 'Vérifier',
    verifying: 'Vérification...',
    resend: 'Renvoyer le code',
    resendIn: 'Renvoyer dans',
    seconds: 's',
    invalidCode: 'Code invalide. Veuillez réessayer.',
    expiredCode: 'Code expiré. Demandez-en un nouveau.',
    success: 'E-mail vérifié!',
    codeSent: 'Nouveau code envoyé!',
  },
  ar: {
    title: 'تحقق من بريدك',
    subtitle: 'أدخل الرمز المكون من 6 أرقام',
    sentTo: 'تم إرسال الرمز إلى:',
    verify: 'تحقق',
    verifying: 'جاري التحقق...',
    resend: 'إعادة إرسال الرمز',
    resendIn: 'إعادة الإرسال خلال',
    seconds: 'ث',
    invalidCode: 'رمز غير صالح. حاول مرة أخرى.',
    expiredCode: 'انتهت صلاحية الرمز. اطلب رمزاً جديداً.',
    success: 'تم التحقق من البريد!',
    codeSent: 'تم إرسال رمز جديد!',
  },
  ru: {
    title: 'Подтвердите email',
    subtitle: 'Введите 6-значный код',
    sentTo: 'Код отправлен на:',
    verify: 'Подтвердить',
    verifying: 'Проверка...',
    resend: 'Отправить код снова',
    resendIn: 'Отправить через',
    seconds: 'с',
    invalidCode: 'Неверный код. Попробуйте снова.',
    expiredCode: 'Код истек. Запросите новый.',
    success: 'Email подтвержден!',
    codeSent: 'Новый код отправлен!',
  },
};

export default function VerifyEmailScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme, language, pendingVerificationEmail, setPendingVerificationEmail } = useStore();
  const { login } = useAuth();
  
  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  const t = translations[language as keyof typeof translations] || translations.en;

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  
  const inputRefs = useRef<(TextInput | null)[]>([]);
  
  // Get email from params, store, or AsyncStorage
  const [email, setEmail] = useState('');
  
  useEffect(() => {
    const loadEmail = async () => {
      // Try params first
      if (params.email) {
        setEmail(params.email as string);
        return;
      }
      // Try store
      if (pendingVerificationEmail) {
        setEmail(pendingVerificationEmail);
        return;
      }
      // Try AsyncStorage
      const storedEmail = await AsyncStorage.getItem('pendingVerificationEmail');
      if (storedEmail) {
        setEmail(storedEmail);
      }
    };
    loadEmail();
  }, [params.email, pendingVerificationEmail]);

  // Resend timer
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleCodeChange = (text: string, index: number) => {
    if (text.length > 1) {
      // Handle paste
      const pasted = text.replace(/[^0-9]/g, '').slice(0, 6).split('');
      const newCode = [...code];
      pasted.forEach((char, i) => {
        if (index + i < 6) newCode[index + i] = char;
      });
      setCode(newCode);
      const nextIndex = Math.min(index + pasted.length, 5);
      inputRefs.current[nextIndex]?.focus();
    } else {
      const newCode = [...code];
      newCode[index] = text.replace(/[^0-9]/g, '');
      setCode(newCode);
      
      // Auto-focus next
      if (text && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
    setError('');
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError(t.invalidCode);
      return;
    }

    if (!email) {
      setError('Email not found');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/auth/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email,
          code: fullCode,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        if (data.error?.includes('expired')) {
          setError(t.expiredCode);
        } else {
          setError(t.invalidCode);
        }
        return;
      }

      // Save auth data using AuthContext
      console.log('Saving auth data:', data.token ? 'Token exists' : 'No token');
      await login(data.user, data.token);
      
      // Clear pending email from AsyncStorage
      await AsyncStorage.removeItem('pendingVerificationEmail');
      
      // Update store
      console.log('Setting isLoggedIn to true');
      useStore.getState().setIsLoggedIn(true);
      setPendingVerificationEmail('');
      
      setSuccess(true);
      
      // Navigate to wallet onboarding (new users don't have wallet yet)
      setTimeout(() => {
        router.dismissAll();
        router.replace('/wallet-onboarding');
      }, 1500);

    } catch (err) {
      setError(t.invalidCode);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/auth/resend-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setResendTimer(60);
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      // Silent fail
    } finally {
      setIsLoading(false);
    }
  };

  const isCodeComplete = code.every(c => c !== '');

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#0f172a'} />
      </TouchableOpacity>

      {success ? (
        <View style={styles.successContainer}>
          <View style={[styles.successIcon, { backgroundColor: '#10b98120' }]}>
            <Ionicons name="checkmark-circle" size={60} color="#10b981" />
          </View>
          <Text style={[styles.successText, { color: isDark ? '#fff' : '#0f172a' }]}>
            {t.success}
          </Text>
        </View>
      ) : (
        <>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: '#10b98120' }]}>
              <Ionicons name="mail-unread" size={40} color="#10b981" />
            </View>
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: isDark ? '#fff' : '#0f172a' }]}>
              {t.title}
            </Text>
            <Text style={[styles.subtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              {t.subtitle}
            </Text>
            <Text style={[styles.email, { color: '#10b981' }]}>
              {t.sentTo} {email}
            </Text>
          </View>

          {/* Code Input */}
          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { inputRefs.current[index] = ref; }}
                style={[
                  styles.codeInput,
                  { 
                    backgroundColor: isDark ? '#1e293b' : '#fff',
                    borderColor: digit ? '#10b981' : (isDark ? '#334155' : '#e2e8f0'),
                    color: isDark ? '#fff' : '#0f172a',
                  }
                ]}
                value={digit}
                onChangeText={(text) => handleCodeChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={6}
                selectTextOnFocus
              />
            ))}
          </View>

          {/* Error */}
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Verify Button */}
          <TouchableOpacity
            style={[styles.verifyButton, !isCodeComplete && styles.verifyButtonDisabled]}
            onPress={handleVerify}
            disabled={isLoading || !isCodeComplete}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={isCodeComplete ? ['#10b981', '#059669'] : ['#475569', '#334155']}
              style={styles.verifyButtonGradient}
            >
              {isLoading ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.verifyButtonText}>{t.verifying}</Text>
                </>
              ) : (
                <Text style={styles.verifyButtonText}>{t.verify}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Resend */}
          <View style={styles.resendContainer}>
            {resendTimer > 0 ? (
              <Text style={[styles.resendTimer, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                {t.resendIn} {resendTimer}{t.seconds}
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResend} disabled={isLoading}>
                <Text style={styles.resendText}>{t.resend}</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  backButton: { width: 40, height: 40, justifyContent: 'center', marginBottom: 24 },
  iconContainer: { alignItems: 'center', marginBottom: 24 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 15, textAlign: 'center', marginBottom: 12 },
  email: { fontSize: 14, fontWeight: '600' },
  codeContainer: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 24 },
  codeInput: { 
    width: 48, 
    height: 56, 
    borderWidth: 2, 
    borderRadius: 12, 
    fontSize: 24, 
    fontWeight: '700', 
    textAlign: 'center' 
  },
  errorContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 16 },
  errorText: { color: '#ef4444', fontSize: 13 },
  verifyButton: { borderRadius: 12, overflow: 'hidden', marginBottom: 20 },
  verifyButtonDisabled: { opacity: 0.7 },
  verifyButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  verifyButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  resendContainer: { alignItems: 'center' },
  resendTimer: { fontSize: 14 },
  resendText: { color: '#10b981', fontSize: 14, fontWeight: '600' },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 100 },
  successIcon: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  successText: { fontSize: 24, fontWeight: '700' },
});
