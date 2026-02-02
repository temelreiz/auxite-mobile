// app/profile.tsx
// Profile Screen - Email & Phone Management

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useColorScheme,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useStore } from '@/stores/useStore';
import useCustomAlert from '@/components/CustomAlert';

import { API_URL } from '@/constants/api';

const translations: Record<string, Record<string, string>> = {
  tr: {
    profile: 'Profil',
    email: 'E-posta',
    phone: 'Telefon',
    emailPlaceholder: 'E-posta adresinizi girin',
    phonePlaceholder: 'Telefon numaranızı girin',
    save: 'Kaydet',
    saving: 'Kaydediliyor...',
    profileSaved: 'Profil kaydedildi',
    profileSavedDesc: 'Bilgileriniz başarıyla güncellendi.',
    error: 'Hata',
    errorDesc: 'Profil kaydedilirken bir hata oluştu.',
    invalidEmail: 'Geçerli bir e-posta adresi girin',
    invalidPhone: 'Geçerli bir telefon numarası girin',
    notificationSettings: 'Bildirim Ayarları',
    notificationDesc: 'E-posta ve SMS bildirimlerini yönetin',
  },
  en: {
    profile: 'Profile',
    email: 'Email',
    phone: 'Phone',
    emailPlaceholder: 'Enter your email',
    phonePlaceholder: 'Enter your phone number',
    save: 'Save',
    saving: 'Saving...',
    profileSaved: 'Profile Saved',
    profileSavedDesc: 'Your information has been updated.',
    error: 'Error',
    errorDesc: 'An error occurred while saving your profile.',
    invalidEmail: 'Please enter a valid email',
    invalidPhone: 'Please enter a valid phone number',
    notificationSettings: 'Notification Settings',
    notificationDesc: 'Manage email and SMS notifications',
  },
  de: {
    profile: 'Profil',
    email: 'E-Mail',
    phone: 'Telefon',
    emailPlaceholder: 'Geben Sie Ihre E-Mail ein',
    phonePlaceholder: 'Geben Sie Ihre Telefonnummer ein',
    save: 'Speichern',
    saving: 'Speichern...',
    profileSaved: 'Profil gespeichert',
    profileSavedDesc: 'Ihre Informationen wurden aktualisiert.',
    error: 'Fehler',
    errorDesc: 'Beim Speichern Ihres Profils ist ein Fehler aufgetreten.',
    invalidEmail: 'Geben Sie eine gültige E-Mail-Adresse ein',
    invalidPhone: 'Geben Sie eine gültige Telefonnummer ein',
    notificationSettings: 'Benachrichtigungseinstellungen',
    notificationDesc: 'E-Mail- und SMS-Benachrichtigungen verwalten',
  },
  fr: {
    profile: 'Profil',
    email: 'E-mail',
    phone: 'Téléphone',
    emailPlaceholder: 'Entrez votre e-mail',
    phonePlaceholder: 'Entrez votre numéro de téléphone',
    save: 'Enregistrer',
    saving: 'Enregistrement...',
    profileSaved: 'Profil enregistré',
    profileSavedDesc: 'Vos informations ont été mises à jour.',
    error: 'Erreur',
    errorDesc: 'Une erreur est survenue lors de l\'enregistrement.',
    invalidEmail: 'Veuillez entrer un e-mail valide',
    invalidPhone: 'Veuillez entrer un numéro de téléphone valide',
    notificationSettings: 'Paramètres de notification',
    notificationDesc: 'Gérer les notifications par e-mail et SMS',
  },
  ar: {
    profile: 'الملف الشخصي',
    email: 'البريد الإلكتروني',
    phone: 'الهاتف',
    emailPlaceholder: 'أدخل بريدك الإلكتروني',
    phonePlaceholder: 'أدخل رقم هاتفك',
    save: 'حفظ',
    saving: 'جاري الحفظ...',
    profileSaved: 'تم حفظ الملف الشخصي',
    profileSavedDesc: 'تم تحديث معلوماتك.',
    error: 'خطأ',
    errorDesc: 'حدث خطأ أثناء حفظ ملفك الشخصي.',
    invalidEmail: 'أدخل بريد إلكتروني صالح',
    invalidPhone: 'أدخل رقم هاتف صالح',
    notificationSettings: 'إعدادات الإشعارات',
    notificationDesc: 'إدارة إشعارات البريد الإلكتروني والرسائل',
  },
  ru: {
    profile: 'Профиль',
    email: 'Эл. почта',
    phone: 'Телефон',
    emailPlaceholder: 'Введите вашу эл. почту',
    phonePlaceholder: 'Введите ваш номер телефона',
    save: 'Сохранить',
    saving: 'Сохранение...',
    profileSaved: 'Профиль сохранён',
    profileSavedDesc: 'Ваша информация обновлена.',
    error: 'Ошибка',
    errorDesc: 'Произошла ошибка при сохранении профиля.',
    invalidEmail: 'Введите действительный адрес эл. почты',
    invalidPhone: 'Введите действительный номер телефона',
    notificationSettings: 'Настройки уведомлений',
    notificationDesc: 'Управление уведомлениями по эл. почте и SMS',
  },
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { language, theme, walletAddress } = useStore();
  const isDark = theme === 'system' ? colorScheme === 'dark' : theme === 'dark';
  const t = translations[language] || translations.en;
  const { showAlert, AlertComponent } = useCustomAlert();

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const colors = {
    background: isDark ? '#0f172a' : '#f8fafc',
    surface: isDark ? '#1e293b' : '#ffffff',
    text: isDark ? '#ffffff' : '#0f172a',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? '#334155' : '#e2e8f0',
    primary: '#10b981',
  };

  // Fetch existing profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!walletAddress) {
        setFetching(false);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/api/user/profile?address=${walletAddress}`);
        const data = await res.json();
        if (data.success && data.profile) {
          setEmail(data.profile.email || '');
          setPhone(data.profile.phone || '');
        }
      } catch (e) {
        console.error('Profile fetch error:', e);
      } finally {
        setFetching(false);
      }
    };
    fetchProfile();
  }, [walletAddress]);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return !email || re.test(email);
  };

  const validatePhone = (phone: string) => {
    const re = /^[\d\s\-\+\(\)]{7,20}$/;
    return !phone || re.test(phone);
  };

  const handleSave = async () => {
    if (email && !validateEmail(email)) {
      showAlert(t.error, t.invalidEmail, 'error');
      return;
    }
    if (phone && !validatePhone(phone)) {
      showAlert(t.error, t.invalidPhone, 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/user/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: walletAddress,
          email: email.trim(),
          phone: phone.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        showAlert(t.profileSaved, t.profileSavedDesc, 'success');
      } else {
        throw new Error(data.error);
      }
    } catch (e) {
      console.error('Profile save error:', e);
      showAlert(t.error, t.errorDesc, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t.profile}</Text>
        <View style={{ width: 40 }} />
      </View>

      {fetching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t.email}</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={t.emailPlaceholder}
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Phone */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t.phone}</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="call-outline" size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={t.phonePlaceholder}
                placeholderTextColor={colors.textSecondary}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>{t.save}</Text>
            )}
          </TouchableOpacity>

          {/* Notification Settings Link */}
          <TouchableOpacity
            style={[styles.notificationLink, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push('/notification-settings')}
          >
            <View style={styles.notificationLinkContent}>
              <Ionicons name="notifications-outline" size={22} color={colors.primary} />
              <View style={styles.notificationLinkText}>
                <Text style={[styles.notificationLinkTitle, { color: colors.text }]}>{t.notificationSettings}</Text>
                <Text style={[styles.notificationLinkDesc, { color: colors.textSecondary }]}>{t.notificationDesc}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={{ height: 50 }} />
        </ScrollView>
      )}
      
      <AlertComponent />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  notificationLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  notificationLinkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationLinkText: {
    gap: 2,
  },
  notificationLinkTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  notificationLinkDesc: {
    fontSize: 13,
  },
});
