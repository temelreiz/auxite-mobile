// app/notifications.tsx
// Bildirimler Sayfası

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore } from '@/stores/useStore';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'alert';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

// Translations
const translations: Record<string, Record<string, string>> = {
  tr: {
    title: 'Bildirimler',
    noNotifications: 'Henüz bildirim yok',
    markAllRead: 'Tümünü okundu işaretle',
    today: 'Bugün',
    yesterday: 'Dün',
    earlier: 'Daha önce',
  },
  en: {
    title: 'Notifications',
    noNotifications: 'No notifications yet',
    markAllRead: 'Mark all as read',
    today: 'Today',
    yesterday: 'Yesterday',
    earlier: 'Earlier',
  },
  de: {
    title: 'Benachrichtigungen',
    noNotifications: 'Noch keine Benachrichtigungen',
    markAllRead: 'Alle als gelesen markieren',
    today: 'Heute',
    yesterday: 'Gestern',
    earlier: 'Früher',
  },
  fr: {
    title: 'Notifications',
    noNotifications: 'Aucune notification',
    markAllRead: 'Tout marquer comme lu',
    today: "Aujourd'hui",
    yesterday: 'Hier',
    earlier: 'Plus tôt',
  },
  ar: {
    title: 'الإشعارات',
    noNotifications: 'لا توجد إشعارات بعد',
    markAllRead: 'تحديد الكل كمقروء',
    today: 'اليوم',
    yesterday: 'أمس',
    earlier: 'سابقاً',
  },
  ru: {
    title: 'Уведомления',
    noNotifications: 'Уведомлений пока нет',
    markAllRead: 'Отметить все как прочитанные',
    today: 'Сегодня',
    yesterday: 'Вчера',
    earlier: 'Ранее',
  },
};

// Sample notifications
const sampleNotifications: Notification[] = [
  {
    id: '1',
    type: 'success',
    title: 'Deposit Confirmed',
    message: 'Your deposit of 0.5 ETH has been confirmed.',
    time: '2 min ago',
    read: false,
  },
  {
    id: '2',
    type: 'info',
    title: 'Price Alert',
    message: 'AUXG has reached $95.50',
    time: '1 hour ago',
    read: false,
  },
  {
    id: '3',
    type: 'warning',
    title: 'KYC Reminder',
    message: 'Complete your KYC to unlock all features.',
    time: 'Yesterday',
    read: true,
  },
  {
    id: '4',
    type: 'success',
    title: 'Staking Reward',
    message: 'You earned 0.025 AUXG from staking.',
    time: '2 days ago',
    read: true,
  },
];

export default function NotificationsScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { theme, language } = useStore();
  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  const t = translations[language] || translations.en;

  const [notifications, setNotifications] = useState<Notification[]>(sampleNotifications);

  const colors = {
    background: isDark ? '#0f172a' : '#f8fafc',
    card: isDark ? '#1e293b' : '#fff',
    text: isDark ? '#fff' : '#0f172a',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? '#334155' : '#e2e8f0',
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return { name: 'checkmark-circle', color: '#10b981' };
      case 'warning': return { name: 'warning', color: '#f59e0b' };
      case 'alert': return { name: 'alert-circle', color: '#ef4444' };
      default: return { name: 'information-circle', color: '#3b82f6' };
    }
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t.title}</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead} style={styles.markReadButton}>
            <Ionicons name="checkmark-done" size={20} color="#10b981" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t.noNotifications}</Text>
          </View>
        ) : (
          notifications.map((notification) => {
            const icon = getTypeIcon(notification.type);
            return (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationCard,
                  { 
                    backgroundColor: colors.card,
                    borderLeftColor: icon.color,
                    opacity: notification.read ? 0.7 : 1,
                  }
                ]}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: icon.color + '20' }]}>
                  <Ionicons name={icon.name as any} size={20} color={icon.color} />
                </View>
                <View style={styles.notificationContent}>
                  <Text style={[styles.notificationTitle, { color: colors.text }]}>
                    {notification.title}
                  </Text>
                  <Text style={[styles.notificationMessage, { color: colors.textSecondary }]}>
                    {notification.message}
                  </Text>
                  <Text style={[styles.notificationTime, { color: colors.textSecondary }]}>
                    {notification.time}
                  </Text>
                </View>
                {!notification.read && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: { padding: 4, marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700', flex: 1 },
  markReadButton: { padding: 8 },
  content: { flex: 1, padding: 16 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyText: { fontSize: 15, marginTop: 16 },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 3,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationContent: { flex: 1 },
  notificationTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  notificationMessage: { fontSize: 13, lineHeight: 18, marginBottom: 6 },
  notificationTime: { fontSize: 11 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
    marginLeft: 8,
    marginTop: 4,
  },
});
