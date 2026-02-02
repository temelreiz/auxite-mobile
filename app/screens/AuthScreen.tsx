// app/screens/AuthScreen.tsx
// Authentication Screen - Login, Register, OAuth with Code Verification

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '@/stores/useStore';

WebBrowser.maybeCompleteAuthSession();

const { width } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://wallet.auxite.io';

// ══════════════════════════════════════════════════════════════════════════════
// TRANSLATIONS
// ══════════════════════════════════════════════════════════════════════════════

const translations = {
  en: {
    welcome: 'Welcome to',
    tagline: 'Tokenized Precious Metals',
    login: 'Log In',
    register: 'Sign Up',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    name: 'Full Name',
    forgotPassword: 'Forgot Password?',
    noAccount: "Don't have an account?",
    hasAccount: 'Already have an account?',
    orContinueWith: 'or continue with',
    continueWithGoogle: 'Continue with Google',
    continueWithApple: 'Continue with Apple',
    passwordRequirements: 'Min 8 chars, 1 uppercase, 1 lowercase, 1 number',
    loginSuccess: 'Login successful!',
    registerSuccess: 'Account created! Please verify your email.',
    invalidEmail: 'Please enter a valid email',
    passwordMismatch: 'Passwords do not match',
    weakPassword: 'Password does not meet requirements',
    genericError: 'Something went wrong. Please try again.',
    verifyEmail: 'Verify Email',
    verifyEmailMessage: 'Enter the 6-digit code sent to:',
    enterCode: 'Enter verification code',
    verify: 'Verify',
    resendVerification: 'Resend code',
    emailSent: 'Verification code sent!',
    invalidCode: 'Invalid code. Please try again.',
    codeExpired: 'Code expired. Please request a new one.',
  },
  tr: {
    welcome: 'Hoş Geldiniz',
    tagline: 'Tokenize Değerli Metaller',
    login: 'Giriş Yap',
    register: 'Kayıt Ol',
    email: 'E-posta',
    password: 'Şifre',
    confirmPassword: 'Şifre Tekrar',
    name: 'Ad Soyad',
    forgotPassword: 'Şifremi Unuttum',
    noAccount: 'Hesabınız yok mu?',
    hasAccount: 'Zaten hesabınız var mı?',
    orContinueWith: 'veya şununla devam et',
    continueWithGoogle: 'Google ile devam et',
    continueWithApple: 'Apple ile devam et',
    passwordRequirements: 'Min 8 karakter, 1 büyük, 1 küçük harf, 1 rakam',
    loginSuccess: 'Giriş başarılı!',
    registerSuccess: 'Hesap oluşturuldu! Lütfen e-postanızı doğrulayın.',
    invalidEmail: 'Geçerli bir e-posta girin',
    passwordMismatch: 'Şifreler eşleşmiyor',
    weakPassword: 'Şifre gereksinimleri karşılamıyor',
    genericError: 'Bir hata oluştu. Tekrar deneyin.',
    verifyEmail: 'E-posta Doğrula',
    verifyEmailMessage: 'Gönderilen 6 haneli kodu girin:',
    enterCode: 'Doğrulama kodunu girin',
    verify: 'Doğrula',
    resendVerification: 'Kodu tekrar gönder',
    emailSent: 'Doğrulama kodu gönderildi!',
    invalidCode: 'Geçersiz kod. Tekrar deneyin.',
    codeExpired: 'Kod süresi doldu. Yeni bir tane isteyin.',
  },
  de: {
    welcome: 'Willkommen bei',
    tagline: 'Tokenisierte Edelmetalle',
    login: 'Anmelden',
    register: 'Registrieren',
    email: 'E-Mail',
    password: 'Passwort',
    confirmPassword: 'Passwort bestätigen',
    name: 'Vollständiger Name',
    forgotPassword: 'Passwort vergessen?',
    noAccount: 'Noch kein Konto?',
    hasAccount: 'Bereits ein Konto?',
    orContinueWith: 'oder weiter mit',
    continueWithGoogle: 'Mit Google fortfahren',
    continueWithApple: 'Mit Apple fortfahren',
    passwordRequirements: 'Min 8 Zeichen, 1 Groß-, 1 Kleinbuchstabe, 1 Zahl',
    loginSuccess: 'Anmeldung erfolgreich!',
    registerSuccess: 'Konto erstellt! Bitte bestätigen Sie Ihre E-Mail.',
    invalidEmail: 'Bitte gültige E-Mail eingeben',
    passwordMismatch: 'Passwörter stimmen nicht überein',
    weakPassword: 'Passwort erfüllt Anforderungen nicht',
    genericError: 'Etwas ist schief gelaufen. Bitte erneut versuchen.',
    verifyEmail: 'E-Mail bestätigen',
    verifyEmailMessage: 'Geben Sie den 6-stelligen Code ein:',
    enterCode: 'Bestätigungscode eingeben',
    verify: 'Bestätigen',
    resendVerification: 'Code erneut senden',
    emailSent: 'Bestätigungscode gesendet!',
    invalidCode: 'Ungültiger Code. Bitte erneut versuchen.',
    codeExpired: 'Code abgelaufen. Bitte neuen anfordern.',
  },
  ar: {
    welcome: 'مرحباً بك في',
    tagline: 'المعادن الثمينة المرمزة',
    login: 'تسجيل الدخول',
    register: 'إنشاء حساب',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    confirmPassword: 'تأكيد كلمة المرور',
    name: 'الاسم الكامل',
    forgotPassword: 'نسيت كلمة المرور؟',
    noAccount: 'ليس لديك حساب؟',
    hasAccount: 'لديك حساب بالفعل؟',
    orContinueWith: 'أو تابع باستخدام',
    continueWithGoogle: 'المتابعة مع Google',
    continueWithApple: 'المتابعة مع Apple',
    passwordRequirements: '8 أحرف على الأقل، حرف كبير، حرف صغير، رقم',
    loginSuccess: 'تم تسجيل الدخول!',
    registerSuccess: 'تم إنشاء الحساب! يرجى التحقق من بريدك.',
    invalidEmail: 'يرجى إدخال بريد إلكتروني صحيح',
    passwordMismatch: 'كلمات المرور غير متطابقة',
    weakPassword: 'كلمة المرور لا تلبي المتطلبات',
    genericError: 'حدث خطأ. يرجى المحاولة مرة أخرى.',
    verifyEmail: 'تأكيد البريد',
    verifyEmailMessage: 'أدخل الرمز المكون من 6 أرقام:',
    enterCode: 'أدخل رمز التحقق',
    verify: 'تأكيد',
    resendVerification: 'إعادة إرسال الرمز',
    emailSent: 'تم إرسال رمز التحقق!',
    invalidCode: 'رمز غير صالح. حاول مرة أخرى.',
    codeExpired: 'انتهت صلاحية الرمز. اطلب رمزاً جديداً.',
  },
  ru: {
    welcome: 'Добро пожаловать в',
    tagline: 'Токенизированные драгоценные металлы',
    login: 'Войти',
    register: 'Регистрация',
    email: 'Эл. почта',
    password: 'Пароль',
    confirmPassword: 'Подтвердите пароль',
    name: 'Полное имя',
    forgotPassword: 'Забыли пароль?',
    noAccount: 'Нет аккаунта?',
    hasAccount: 'Уже есть аккаунт?',
    orContinueWith: 'или продолжить с',
    continueWithGoogle: 'Продолжить с Google',
    continueWithApple: 'Продолжить с Apple',
    passwordRequirements: 'Мин 8 символов, 1 заглавная, 1 строчная, 1 цифра',
    loginSuccess: 'Вход выполнен!',
    registerSuccess: 'Аккаунт создан! Подтвердите email.',
    invalidEmail: 'Введите корректный email',
    passwordMismatch: 'Пароли не совпадают',
    weakPassword: 'Пароль не соответствует требованиям',
    genericError: 'Что-то пошло не так. Попробуйте снова.',
    verifyEmail: 'Подтвердить email',
    verifyEmailMessage: 'Введите 6-значный код:',
    enterCode: 'Введите код подтверждения',
    verify: 'Подтвердить',
    resendVerification: 'Отправить код повторно',
    emailSent: 'Код подтверждения отправлен!',
    invalidCode: 'Неверный код. Попробуйте снова.',
    codeExpired: 'Код истек. Запросите новый.',
  },
  fr: {
    welcome: 'Bienvenue sur',
    tagline: 'Métaux précieux tokenisés',
    login: 'Connexion',
    register: "S'inscrire",
    email: 'E-mail',
    password: 'Mot de passe',
    confirmPassword: 'Confirmer le mot de passe',
    name: 'Nom complet',
    forgotPassword: 'Mot de passe oublié?',
    noAccount: "Pas de compte?",
    hasAccount: 'Déjà un compte?',
    orContinueWith: 'ou continuer avec',
    continueWithGoogle: 'Continuer avec Google',
    continueWithApple: 'Continuer avec Apple',
    passwordRequirements: 'Min 8 car., 1 majuscule, 1 minuscule, 1 chiffre',
    loginSuccess: 'Connexion réussie!',
    registerSuccess: 'Compte créé! Vérifiez votre e-mail.',
    invalidEmail: 'Entrez un e-mail valide',
    passwordMismatch: 'Les mots de passe ne correspondent pas',
    weakPassword: 'Le mot de passe ne répond pas aux exigences',
    genericError: 'Une erreur est survenue. Réessayez.',
    verifyEmail: 'Vérifier e-mail',
    verifyEmailMessage: 'Entrez le code à 6 chiffres:',
    enterCode: 'Entrez le code de vérification',
    verify: 'Vérifier',
    resendVerification: 'Renvoyer le code',
    emailSent: 'Code de vérification envoyé!',
    invalidCode: 'Code invalide. Réessayez.',
    codeExpired: 'Code expiré. Demandez-en un nouveau.',
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════════

interface AuthScreenProps {
  onAuthSuccess: (user: any, token: string) => void;
  onSkip?: () => void;
}

type AuthMode = 'login' | 'register' | 'verify';

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export default function AuthScreen({ onAuthSuccess, onSkip }: AuthScreenProps) {
  const { language } = useStore();
  const t = translations[language as keyof typeof translations] || translations.en;
  
  // State
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  
  // Refs
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const codeInputRef = useRef<TextInput>(null);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  // Google OAuth
  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  });

  // ════════════════════════════════════════════════════════════════════════════
  // EFFECTS
  // ════════════════════════════════════════════════════════════════════════════
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      handleGoogleAuth(googleResponse.authentication?.idToken);
    }
  }, [googleResponse]);

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
  // AUTH HANDLERS
  // ════════════════════════════════════════════════════════════════════════════
  
  const handleLogin = async () => {
    setError('');
    
    if (!validateEmail(email)) {
      setError(t.invalidEmail);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || t.genericError);
        return;
      }

      // Save auth data
      await AsyncStorage.setItem('authToken', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));

      // Check if email verification needed
      if (data.requiresEmailVerification || !data.user.emailVerified) {
        setPendingVerificationEmail(email);
        setMode('verify');
        return;
      }

      onAuthSuccess(data.user, data.token);

    } catch (err) {
      setError(t.genericError);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setError('');

    if (!validateEmail(email)) {
      setError(t.invalidEmail);
      return;
    }

    if (!validatePassword(password)) {
      setError(t.weakPassword);
      return;
    }

    if (password !== confirmPassword) {
      setError(t.passwordMismatch);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password, 
          name,
          language,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || t.genericError);
        return;
      }

      // Save token
      await AsyncStorage.setItem('authToken', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));

      // Show verification screen
      setPendingVerificationEmail(email);
      setMode('verify');
      
    } catch (err) {
      setError(t.genericError);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      setError(t.invalidCode);
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: pendingVerificationEmail,
          code: verificationCode,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        if (data.error?.includes('expired')) {
          setError(t.codeExpired);
        } else {
          setError(t.invalidCode);
        }
        return;
      }

      // Update stored data
      await AsyncStorage.setItem('authToken', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));

      // Success!
      onAuthSuccess(data.user, data.token);

    } catch (err) {
      setError(t.genericError);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_URL}/api/auth/resend-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingVerificationEmail }),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert('✓', t.emailSent);
      }
    } catch (err) {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async (idToken?: string) => {
    if (!idToken) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || t.genericError);
        return;
      }

      await AsyncStorage.setItem('authToken', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));

      onAuthSuccess(data.user, data.token);
      
    } catch (err: any) {
      if (err.code !== 'ERR_CANCELED') {
        setError(t.genericError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAppleAuth = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      setLoading(true);
      setError('');

      const response = await fetch(`${API_URL}/api/auth/apple`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identityToken: credential.identityToken,
          fullName: credential.fullName,
          email: credential.email,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || t.genericError);
        return;
      }

      await AsyncStorage.setItem('authToken', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));

      onAuthSuccess(data.user, data.token);
      
    } catch (err: any) {
      if (err.code !== 'ERR_CANCELED') {
        setError(t.genericError);
      }
    } finally {
      setLoading(false);
    }
  };

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER - VERIFY EMAIL WITH CODE
  // ════════════════════════════════════════════════════════════════════════════
  
  if (mode === 'verify') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.verifyContainer}>
          <View style={styles.verifyIcon}>
            <Ionicons name="mail-outline" size={64} color="#10B981" />
          </View>
          <Text style={styles.verifyTitle}>{t.verifyEmail}</Text>
          <Text style={styles.verifyMessage}>{t.verifyEmailMessage}</Text>
          <Text style={styles.verifyEmail}>{pendingVerificationEmail}</Text>
          
          {/* Code Input */}
          <View style={styles.codeInputContainer}>
            <TextInput
              ref={codeInputRef}
              style={styles.codeInput}
              placeholder="000000"
              placeholderTextColor="#64748b"
              value={verificationCode}
              onChangeText={(text) => setVerificationCode(text.replace(/[^0-9]/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />
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
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleVerifyCode}
            disabled={loading || verificationCode.length !== 6}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>{t.verify}</Text>
            )}
          </TouchableOpacity>
          
          {/* Resend */}
          <TouchableOpacity
            style={styles.resendButton}
            onPress={handleResendVerification}
            disabled={loading}
          >
            <Text style={styles.resendButtonText}>{t.resendVerification}</Text>
          </TouchableOpacity>

          {/* Back */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setMode('login');
              setPendingVerificationEmail('');
              setVerificationCode('');
              setError('');
            }}
          >
            <Text style={styles.backButtonText}>← {t.login}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER - LOGIN / REGISTER
  // ════════════════════════════════════════════════════════════════════════════
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Logo & Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>AUXITE</Text>
            </View>
            <Text style={styles.welcomeText}>{t.welcome}</Text>
            <Text style={styles.brandText}>Auxite</Text>
            <Text style={styles.tagline}>{t.tagline}</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Name field (register only) */}
            {mode === 'register' && (
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t.name}
                  placeholderTextColor="#94a3b8"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>
            )}

            {/* Email */}
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
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                ref={passwordRef}
                style={styles.input}
                placeholder={t.password}
                placeholderTextColor="#94a3b8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                returnKeyType={mode === 'register' ? 'next' : 'done'}
                onSubmitEditing={() => {
                  if (mode === 'register') {
                    confirmPasswordRef.current?.focus();
                  } else {
                    handleLogin();
                  }
                }}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#64748b"
                />
              </TouchableOpacity>
            </View>

            {/* Confirm Password (register only) */}
            {mode === 'register' && (
              <>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    ref={confirmPasswordRef}
                    style={styles.input}
                    placeholder={t.confirmPassword}
                    placeholderTextColor="#94a3b8"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                    returnKeyType="done"
                    onSubmitEditing={handleRegister}
                  />
                </View>
                <Text style={styles.passwordHint}>{t.passwordRequirements}</Text>
              </>
            )}

            {/* Error */}
            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Forgot Password (login only) */}
            {mode === 'login' && (
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>{t.forgotPassword}</Text>
              </TouchableOpacity>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={mode === 'login' ? handleLogin : handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {mode === 'login' ? t.login : t.register}
                </Text>
              )}
            </TouchableOpacity>

            {/* Toggle Mode */}
            <TouchableOpacity
              style={styles.toggleMode}
              onPress={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError('');
              }}
            >
              <Text style={styles.toggleModeText}>
                {mode === 'login' ? t.noAccount : t.hasAccount}{' '}
                <Text style={styles.toggleModeLink}>
                  {mode === 'login' ? t.register : t.login}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t.orContinueWith}</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* OAuth Buttons */}
          <View style={styles.oauthContainer}>
            {/* Google */}
            <TouchableOpacity
              style={styles.oauthButton}
              onPress={() => googlePromptAsync()}
              disabled={!googleRequest || loading}
            >
              <Ionicons name="logo-google" size={20} color="#EA4335" />
              <Text style={styles.oauthButtonText}>{t.continueWithGoogle}</Text>
            </TouchableOpacity>

            {/* Apple (iOS only) */}
            {Platform.OS === 'ios' && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={12}
                style={styles.appleButton}
                onPress={handleAppleAuth}
              />
            )}
          </View>
        </Animated.View>
      </ScrollView>
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
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  
  // Header
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 2,
  },
  welcomeText: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 4,
  },
  brandText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    color: '#64748b',
  },

  // Form
  form: {
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
  passwordHint: {
    fontSize: 12,
    color: '#64748b',
    marginTop: -8,
    marginBottom: 16,
    marginLeft: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#ef4444',
    marginLeft: 8,
    fontSize: 14,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#10B981',
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#10B981',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleMode: {
    alignItems: 'center',
  },
  toggleModeText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  toggleModeLink: {
    color: '#10B981',
    fontWeight: '600',
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#334155',
  },
  dividerText: {
    color: '#64748b',
    fontSize: 12,
    paddingHorizontal: 16,
  },

  // OAuth
  oauthContainer: {
    gap: 12,
  },
  oauthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  oauthButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 12,
  },
  appleButton: {
    height: 52,
    width: '100%',
  },

  // Verify Email
  verifyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  verifyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  verifyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  verifyMessage: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 8,
  },
  verifyEmail: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '600',
    marginBottom: 32,
  },
  codeInputContainer: {
    width: '100%',
    maxWidth: 280,
    marginBottom: 24,
  },
  codeInput: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#334155',
    height: 64,
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 12,
  },
  resendButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  resendButtonText: {
    color: '#10B981',
    fontSize: 16,
  },
  backButton: {
    marginTop: 24,
  },
  backButtonText: {
    color: '#64748b',
    fontSize: 14,
  },
});
