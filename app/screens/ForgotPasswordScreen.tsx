// app/screens/ForgotPasswordScreen.tsx
// Forgot Password & Reset Password Screen

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/stores/useStore';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://wallet.auxite.io';

// ══════════════════════════════════════════════════════════════════════════════
// TRANSLATIONS
// ══════════════════════════════════════════════════════════════════════════════

const translations = {
  en: {
    title: 'Reset Password',
    subtitle: 'Enter your email and we\'ll send you a reset link',
    email: 'Email',
    sendLink: 'Send Reset Link',
    backToLogin: 'Back to Login',
    checkEmail: 'Check your email',
    emailSentMessage: 'If an account exists with this email, you\'ll receive a password reset link.',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password',
    resetPassword: 'Reset Password',
    passwordChanged: 'Password Changed!',
    passwordChangedMessage: 'Your password has been successfully changed.',
    loginNow: 'Log In Now',
    invalidEmail: 'Please enter a valid email',
    passwordMismatch: 'Passwords do not match',
    weakPassword: 'Min 8 chars, 1 uppercase, 1 lowercase, 1 number',
    genericError: 'Something went wrong. Please try again.',
    linkExpired: 'This reset link has expired. Please request a new one.',
  },
  tr: {
    title: 'Şifre Sıfırla',
    subtitle: 'E-postanızı girin, size sıfırlama linki gönderelim',
    email: 'E-posta',
    sendLink: 'Sıfırlama Linki Gönder',
    backToLogin: 'Girişe Dön',
    checkEmail: 'E-postanızı kontrol edin',
    emailSentMessage: 'Bu e-posta ile bir hesap varsa, şifre sıfırlama linki alacaksınız.',
    newPassword: 'Yeni Şifre',
    confirmPassword: 'Şifre Tekrar',
    resetPassword: 'Şifreyi Sıfırla',
    passwordChanged: 'Şifre Değiştirildi!',
    passwordChangedMessage: 'Şifreniz başarıyla değiştirildi.',
    loginNow: 'Şimdi Giriş Yap',
    invalidEmail: 'Geçerli bir e-posta girin',
    passwordMismatch: 'Şifreler eşleşmiyor',
    weakPassword: 'Min 8 karakter, 1 büyük, 1 küçük harf, 1 rakam',
    genericError: 'Bir hata oluştu. Tekrar deneyin.',
    linkExpired: 'Bu sıfırlama linki süresi dolmuş. Yeni bir tane isteyin.',
  },
  de: {
    title: 'Passwort zurücksetzen',
    subtitle: 'Geben Sie Ihre E-Mail ein und wir senden Ihnen einen Link',
    email: 'E-Mail',
    sendLink: 'Link senden',
    backToLogin: 'Zurück zur Anmeldung',
    checkEmail: 'Überprüfen Sie Ihre E-Mail',
    emailSentMessage: 'Falls ein Konto existiert, erhalten Sie einen Reset-Link.',
    newPassword: 'Neues Passwort',
    confirmPassword: 'Passwort bestätigen',
    resetPassword: 'Passwort zurücksetzen',
    passwordChanged: 'Passwort geändert!',
    passwordChangedMessage: 'Ihr Passwort wurde erfolgreich geändert.',
    loginNow: 'Jetzt anmelden',
    invalidEmail: 'Gültige E-Mail eingeben',
    passwordMismatch: 'Passwörter stimmen nicht überein',
    weakPassword: 'Min 8 Zeichen, 1 Groß-, 1 Kleinbuchstabe, 1 Zahl',
    genericError: 'Etwas ist schief gelaufen. Versuchen Sie es erneut.',
    linkExpired: 'Dieser Link ist abgelaufen. Fordern Sie einen neuen an.',
  },
  ar: {
    title: 'إعادة تعيين كلمة المرور',
    subtitle: 'أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين',
    email: 'البريد الإلكتروني',
    sendLink: 'إرسال رابط',
    backToLogin: 'العودة للدخول',
    checkEmail: 'تحقق من بريدك',
    emailSentMessage: 'إذا كان هناك حساب بهذا البريد، ستتلقى رابط إعادة التعيين.',
    newPassword: 'كلمة المرور الجديدة',
    confirmPassword: 'تأكيد كلمة المرور',
    resetPassword: 'إعادة تعيين',
    passwordChanged: 'تم تغيير كلمة المرور!',
    passwordChangedMessage: 'تم تغيير كلمة المرور بنجاح.',
    loginNow: 'تسجيل الدخول الآن',
    invalidEmail: 'أدخل بريد إلكتروني صحيح',
    passwordMismatch: 'كلمات المرور غير متطابقة',
    weakPassword: '8 أحرف على الأقل، حرف كبير، حرف صغير، رقم',
    genericError: 'حدث خطأ. حاول مرة أخرى.',
    linkExpired: 'انتهت صلاحية هذا الرابط. اطلب رابطاً جديداً.',
  },
  ru: {
    title: 'Сброс пароля',
    subtitle: 'Введите email и мы отправим ссылку для сброса',
    email: 'Эл. почта',
    sendLink: 'Отправить ссылку',
    backToLogin: 'Вернуться к входу',
    checkEmail: 'Проверьте почту',
    emailSentMessage: 'Если аккаунт существует, вы получите ссылку для сброса.',
    newPassword: 'Новый пароль',
    confirmPassword: 'Подтвердите пароль',
    resetPassword: 'Сбросить пароль',
    passwordChanged: 'Пароль изменён!',
    passwordChangedMessage: 'Ваш пароль успешно изменён.',
    loginNow: 'Войти сейчас',
    invalidEmail: 'Введите корректный email',
    passwordMismatch: 'Пароли не совпадают',
    weakPassword: 'Мин 8 символов, 1 заглавная, 1 строчная, 1 цифра',
    genericError: 'Что-то пошло не так. Попробуйте снова.',
    linkExpired: 'Срок действия ссылки истёк. Запросите новую.',
  },
  fr: {
    title: 'Réinitialiser le mot de passe',
    subtitle: 'Entrez votre e-mail et nous vous enverrons un lien',
    email: 'E-mail',
    sendLink: 'Envoyer le lien',
    backToLogin: 'Retour à la connexion',
    checkEmail: 'Vérifiez vos e-mails',
    emailSentMessage: 'Si un compte existe, vous recevrez un lien de réinitialisation.',
    newPassword: 'Nouveau mot de passe',
    confirmPassword: 'Confirmer le mot de passe',
    resetPassword: 'Réinitialiser',
    passwordChanged: 'Mot de passe changé!',
    passwordChangedMessage: 'Votre mot de passe a été changé avec succès.',
    loginNow: 'Se connecter',
    invalidEmail: 'Entrez un e-mail valide',
    passwordMismatch: 'Les mots de passe ne correspondent pas',
    weakPassword: 'Min 8 car., 1 majuscule, 1 minuscule, 1 chiffre',
    genericError: 'Une erreur est survenue. Réessayez.',
    linkExpired: 'Ce lien a expiré. Demandez-en un nouveau.',
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════════

interface ForgotPasswordScreenProps {
  onBack: () => void;
  onLoginSuccess?: (user: any, token: string) => void;
  // If coming from email link:
  resetToken?: string;
  resetEmail?: string;
}

type Step = 'request' | 'sent' | 'reset' | 'success';

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export default function ForgotPasswordScreen({
  onBack,
  onLoginSuccess,
  resetToken,
  resetEmail,
}: ForgotPasswordScreenProps) {
  const { language } = useStore();
  const t = translations[language as keyof typeof translations] || translations.en;
  
  // State
  const [step, setStep] = useState<Step>(resetToken ? 'reset' : 'request');
  const [email, setEmail] = useState(resetEmail || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Refs
  const confirmRef = useRef<TextInput>(null);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [step]);

  // ════════════════════════════════════════════════════════════════════════════
  // VALIDATION
  // ════════════════════════════════════════════════════════════════════════════
  
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePassword = (password: string) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
  };

  // ════════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ════════════════════════════════════════════════════════════════════════════
  
  const handleRequestReset = async () => {
    setError('');
    
    if (!validateEmail(email)) {
      setError(t.invalidEmail);
      return;
    }

    setLoading(true);
    
    try {
      await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      // Always show success (security)
      setStep('sent');
      
    } catch (err) {
      setError(t.genericError);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError('');
    
    if (!validatePassword(newPassword)) {
      setError(t.weakPassword);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t.passwordMismatch);
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail || email,
          token: resetToken,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        if (data.error?.includes('expired')) {
          setError(t.linkExpired);
        } else {
          setError(data.error || t.genericError);
        }
        return;
      }

      setStep('success');
      
    } catch (err) {
      setError(t.genericError);
    } finally {
      setLoading(false);
    }
  };

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════════

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        
        {/* REQUEST RESET FORM */}
        {step === 'request' && (
          <>
            <View style={styles.iconContainer}>
              <Ionicons name="key-outline" size={48} color="#10B981" />
            </View>
            
            <Text style={styles.title}>{t.title}</Text>
            <Text style={styles.subtitle}>{t.subtitle}</Text>

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t.email}
                placeholderTextColor="#94a3b8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleRequestReset}
              />
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRequestReset}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>{t.sendLink}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Ionicons name="arrow-back" size={20} color="#64748b" />
              <Text style={styles.backButtonText}>{t.backToLogin}</Text>
            </TouchableOpacity>
          </>
        )}

        {/* EMAIL SENT */}
        {step === 'sent' && (
          <>
            <View style={[styles.iconContainer, styles.iconSuccess]}>
              <Ionicons name="mail-open-outline" size={48} color="#10B981" />
            </View>
            
            <Text style={styles.title}>{t.checkEmail}</Text>
            <Text style={styles.subtitle}>{t.emailSentMessage}</Text>
            <Text style={styles.emailText}>{email}</Text>

            <TouchableOpacity style={styles.button} onPress={onBack}>
              <Text style={styles.buttonText}>{t.backToLogin}</Text>
            </TouchableOpacity>
          </>
        )}

        {/* RESET PASSWORD FORM */}
        {step === 'reset' && (
          <>
            <View style={styles.iconContainer}>
              <Ionicons name="lock-open-outline" size={48} color="#10B981" />
            </View>
            
            <Text style={styles.title}>{t.title}</Text>
            <Text style={styles.passwordHint}>{t.weakPassword}</Text>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t.newPassword}
                placeholderTextColor="#94a3b8"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPassword}
                returnKeyType="next"
                onSubmitEditing={() => confirmRef.current?.focus()}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#64748b"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                ref={confirmRef}
                style={styles.input}
                placeholder={t.confirmPassword}
                placeholderTextColor="#94a3b8"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleResetPassword}
              />
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>{t.resetPassword}</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* SUCCESS */}
        {step === 'success' && (
          <>
            <View style={[styles.iconContainer, styles.iconSuccess]}>
              <Ionicons name="checkmark-circle" size={64} color="#10B981" />
            </View>
            
            <Text style={styles.title}>{t.passwordChanged}</Text>
            <Text style={styles.subtitle}>{t.passwordChangedMessage}</Text>

            <TouchableOpacity style={styles.button} onPress={onBack}>
              <Text style={styles.buttonText}>{t.loginNow}</Text>
            </TouchableOpacity>
          </>
        )}

      </Animated.View>
    </KeyboardAvoidingView>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  emailText: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '600',
    marginBottom: 32,
  },
  passwordHint: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
    width: '100%',
  },
  inputIcon: {
    marginLeft: 16,
  },
  input: {
    flex: 1,
    height: 52,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#fff',
  },
  eyeIcon: {
    padding: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
  },
  errorText: {
    color: '#ef4444',
    marginLeft: 8,
    fontSize: 14,
  },
  button: {
    backgroundColor: '#10B981',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  backButtonText: {
    color: '#64748b',
    fontSize: 14,
    marginLeft: 8,
  },
});
