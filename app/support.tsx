import { StyleSheet, View, Text, useColorScheme, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useStore } from '@/stores/useStore';
import { useTranslation } from '@/hooks/useTranslation';

export default function SupportScreen() {
  const colorScheme = useColorScheme();
  const systemIsDark = colorScheme === 'dark';
  const { theme } = useStore();
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  
  const { t } = useTranslation('support');

  const colors = {
    background: isDark ? '#0f172a' : '#f8fafc',
    surface: isDark ? '#1e293b' : '#fff',
    text: isDark ? '#fff' : '#0f172a',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? '#1e293b' : '#f1f5f9',
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t.support}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* AI Support Coming Soon */}
        <View style={[styles.comingSoonCard, { backgroundColor: colors.surface }]}>
          <View style={styles.aiIconContainer}>
            <Ionicons name="chatbubbles" size={48} color="#10b981" />
          </View>
          <Text style={[styles.comingSoonTitle, { color: colors.text }]}>
            {t.aiSupportTitle}
          </Text>
          <Text style={[styles.comingSoonDesc, { color: colors.textSecondary }]}>
            {t.aiSupportDesc}
          </Text>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t.faq}
          </Text>
          
          <TouchableOpacity style={[styles.faqItem, { backgroundColor: colors.surface }]}>
            <Text style={[styles.faqQuestion, { color: colors.text }]}>
              {t.faq1}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.faqItem, { backgroundColor: colors.surface }]}>
            <Text style={[styles.faqQuestion, { color: colors.text }]}>
              {t.faq2}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.faqItem, { backgroundColor: colors.surface }]}>
            <Text style={[styles.faqQuestion, { color: colors.text }]}>
              {t.faq3}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.faqItem, { backgroundColor: colors.surface }]}>
            <Text style={[styles.faqQuestion, { color: colors.text }]}>
              {t.faq4}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Contact Options */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t.contactUs}
          </Text>
          
          <View style={styles.contactGrid}>
            <TouchableOpacity style={[styles.contactCard, { backgroundColor: colors.surface }]}>
              <Ionicons name="mail-outline" size={28} color="#10b981" />
              <Text style={[styles.contactLabel, { color: colors.text }]}>{t.email}</Text>
              <Text style={[styles.contactValue, { color: colors.textSecondary }]}>support@auxite.io</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.contactCard, { backgroundColor: colors.surface }]}>
              <Ionicons name="logo-twitter" size={28} color="#1DA1F2" />
              <Text style={[styles.contactLabel, { color: colors.text }]}>{t.twitter}</Text>
              <Text style={[styles.contactValue, { color: colors.textSecondary }]}>@AuxiteIO</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.contactCard, { backgroundColor: colors.surface }]}>
              <Ionicons name="logo-discord" size={28} color="#5865F2" />
              <Text style={[styles.contactLabel, { color: colors.text }]}>{t.discord}</Text>
              <Text style={[styles.contactValue, { color: colors.textSecondary }]}>{t.joinServer}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.contactCard, { backgroundColor: colors.surface }]}>
              <Ionicons name="logo-telegram" size={28} color="#0088cc" />
              <Text style={[styles.contactLabel, { color: colors.text }]}>{t.telegram}</Text>
              <Text style={[styles.contactValue, { color: colors.textSecondary }]}>@AuxiteIO</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  content: { flex: 1 },
  
  comingSoonCard: {
    margin: 16,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
  aiIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10b98120',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  comingSoonTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  comingSoonDesc: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  
  faqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  faqQuestion: { fontSize: 14, flex: 1, marginRight: 8 },
  
  contactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  contactCard: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  contactLabel: { fontSize: 14, fontWeight: '600' },
  contactValue: { fontSize: 12 },
});
