// app/(auth)/forgot-password.tsx
// Forgot Password Screen

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useStore } from '@/stores/useStore';

const translations = {
  tr: {
    title: 'Şifremi Unuttum',
    subtitle: 'E-posta adresinize şifre sıfırlama bağlantısı göndereceğiz',
    email: 'E-posta',
    emailPlaceholder: 'ornek@email.com',
    sendLink: 'Sıfırlama Bağlantısı Gönder',
    sending: 'Gönderiliyor...',
    backToLogin: 'Giriş sayfasına dön',
    invalidEmail: 'Geçerli bir e-posta girin',
    successTitle: 'Bağlantı Gönderildi!',
    successMsg: 'E-postanızı kontrol edin ve şifre sıfırlama bağlantısına tıklayın.',
    resend: 'Tekrar Gönder',
  },
  en: {
    title: 'Forgot Password',
    subtitle: "We'll send a password reset link to your email",
    email: 'Email',
    emailPlaceholder: 'example@email.com',
    sendLink: 'Send Reset Link',
    sending: 'Sending...',
    backToLogin: 'Back to login',
    invalidEmail: 'Enter a valid email',
    successTitle: 'Link Sent!',
    successMsg: 'Check your email and click the password reset link.',
    resend: 'Resend',
  },
  de: {
    title: 'Passwort vergessen',
    subtitle: 'Wir senden Ihnen einen Link zum Zurücksetzen des Passworts',
    email: 'E-Mail',
    emailPlaceholder: 'beispiel@email.com',
    sendLink: 'Link senden',
    sending: 'Wird gesendet...',
    backToLogin: 'Zurück zur Anmeldung',
    invalidEmail: 'Geben Sie eine gültige E-Mail ein',
    successTitle: 'Link gesendet!',
    successMsg: 'Überprüfen Sie Ihre E-Mail und klicken Sie auf den Link.',
    resend: 'Erneut senden',
  },
  fr: {
    title: 'Mot de passe oublié',
    subtitle: 'Nous vous enverrons un lien de réinitialisation',
    email: 'E-mail',
    emailPlaceholder: 'exemple@email.com',
    sendLink: 'Envoyer le lien',
    sending: 'Envoi...',
    backToLogin: 'Retour à la connexion',
    invalidEmail: 'Entrez un e-mail valide',
    successTitle: 'Lien envoyé!',
    successMsg: 'Vérifiez votre e-mail et cliquez sur le lien.',
    resend: 'Renvoyer',
  },
  ar: {
    title: 'نسيت كلمة المرور',
    subtitle: 'سنرسل لك رابط إعادة تعيين كلمة المرور',
    email: 'البريد الإلكتروني',
    emailPlaceholder: 'example@email.com',
    sendLink: 'إرسال الرابط',
    sending: 'جاري الإرسال...',
    backToLogin: 'العودة لتسجيل الدخول',
    invalidEmail: 'أدخل بريد إلكتروني صالح',
    successTitle: 'تم إرسال الرابط!',
    successMsg: 'تحقق من بريدك الإلكتروني وانقر على الرابط.',
    resend: 'إعادة الإرسال',
  },
  ru: {
    title: 'Забыли пароль',
    subtitle: 'Мы отправим ссылку для сброса пароля',
    email: 'Эл. почта',
    emailPlaceholder: 'example@email.com',
    sendLink: 'Отправить ссылку',
    sending: 'Отправка...',
    backToLogin: 'Вернуться к входу',
    invalidEmail: 'Введите корректный email',
    successTitle: 'Ссылка отправлена!',
    successMsg: 'Проверьте почту и перейдите по ссылке.',
    resend: 'Отправить снова',
  },
};

export default function ForgotPasswordScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { theme, language } = useStore();
  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  const t = translations[language as keyof typeof translations] || translations.en;

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSendLink = async () => {
    setError('');

    if (!validateEmail(email)) {
      setError(t.invalidEmail);
      return;
    }

    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSuccess(true);
    } catch (err) {
      setError('Failed to send email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#0f172a'} />
        </TouchableOpacity>

        {success ? (
          /* Success State */
          <View style={styles.successContainer}>
            <View style={[styles.successIcon, { backgroundColor: '#10b98120' }]}>
              <Ionicons name="mail-open" size={48} color="#10b981" />
            </View>
            <Text style={[styles.successTitle, { color: isDark ? '#fff' : '#0f172a' }]}>
              {t.successTitle}
            </Text>
            <Text style={[styles.successMsg, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              {t.successMsg}
            </Text>
            <TouchableOpacity
              style={[styles.resendButton, { borderColor: isDark ? '#334155' : '#e2e8f0' }]}
              onPress={() => setSuccess(false)}
            >
              <Text style={[styles.resendText, { color: isDark ? '#fff' : '#0f172a' }]}>
                {t.resend}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <Text style={styles.backToLoginText}>{t.backToLogin}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Form State */
          <>
            <View style={styles.iconContainer}>
              <View style={[styles.iconCircle, { backgroundColor: '#10b98120' }]}>
                <Ionicons name="key" size={40} color="#10b981" />
              </View>
            </View>

            <View style={styles.header}>
              <Text style={[styles.title, { color: isDark ? '#fff' : '#0f172a' }]}>
                {t.title}
              </Text>
              <Text style={[styles.subtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                {t.subtitle}
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                  {t.email}
                </Text>
                <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: isDark ? '#334155' : '#e2e8f0' }]}>
                  <Ionicons name="mail-outline" size={20} color={isDark ? '#64748b' : '#94a3b8'} />
                  <TextInput
                    style={[styles.input, { color: isDark ? '#fff' : '#0f172a' }]}
                    placeholder={t.emailPlaceholder}
                    placeholderTextColor={isDark ? '#475569' : '#cbd5e1'}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {error ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color="#ef4444" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSendLink}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <LinearGradient colors={['#10b981', '#059669']} style={styles.sendButtonGradient}>
                  {isLoading ? (
                    <>
                      <ActivityIndicator size="small" color="#fff" />
                      <Text style={styles.sendButtonText}>{t.sending}</Text>
                    </>
                  ) : (
                    <Text style={styles.sendButtonText}>{t.sendLink}</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.backToLogin} onPress={() => router.push('/auth/login')}>
                <Ionicons name="arrow-back" size={16} color="#10b981" />
                <Text style={styles.backToLoginText}>{t.backToLogin}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  backButton: { width: 40, height: 40, justifyContent: 'center', marginBottom: 24 },
  iconContainer: { alignItems: 'center', marginBottom: 24 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  header: { marginBottom: 32 },
  title: { fontSize: 26, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  form: {},
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, height: 52, gap: 10 },
  input: { flex: 1, fontSize: 15 },
  errorContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fef2f2', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, marginBottom: 16 },
  errorText: { color: '#ef4444', fontSize: 13, flex: 1 },
  sendButton: { borderRadius: 12, overflow: 'hidden', marginBottom: 20 },
  sendButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  sendButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  backToLogin: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  backToLoginText: { color: '#10b981', fontSize: 14, fontWeight: '600' },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 100 },
  successIcon: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  successTitle: { fontSize: 24, fontWeight: '700', marginBottom: 12 },
  successMsg: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 32, paddingHorizontal: 20 },
  resendButton: { borderWidth: 1, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, marginBottom: 16 },
  resendText: { fontSize: 15, fontWeight: '600' },
});
