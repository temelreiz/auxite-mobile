// app/legal/privacy.tsx
// Privacy Policy

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore } from '@/stores/useStore';

const content = {
  tr: {
    title: 'Gizlilik Politikası',
    lastUpdated: 'Son güncelleme: 1 Ocak 2025',
    sections: [
      {
        title: '1. Toplanan Bilgiler',
        content: 'Kimlik bilgileri (ad, soyad, doğum tarihi), İletişim bilgileri (e-posta, telefon), Finansal bilgiler (cüzdan adresleri, işlem geçmişi), Cihaz bilgileri (IP adresi, tarayıcı türü, işletim sistemi), Kullanım verileri (uygulama içi aktiviteler, tercihler).',
      },
      {
        title: '2. Bilgi Kullanımı',
        content: 'Hizmetlerimizi sağlamak ve geliştirmek, İşlemleri gerçekleştirmek ve doğrulamak, Yasal yükümlülüklerimizi yerine getirmek (KYC/AML), Müşteri desteği sağlamak, Güvenliği sağlamak ve dolandırıcılığı önlemek, Size önemli güncellemeler ve bildirimler göndermek.',
      },
      {
        title: '3. Bilgi Paylaşımı',
        content: 'Bilgilerinizi üçüncü taraflarla yalnızca şu durumlarda paylaşırız: Yasal zorunluluk durumunda, Hizmet sağlayıcılarımızla (ödeme işlemcileri, KYC sağlayıcıları), Açık izniniz ile, İş ortaklarımızla (sınırlı ve anonimleştirilmiş şekilde).',
      },
      {
        title: '4. Veri Güvenliği',
        content: 'Verilerinizi korumak için endüstri standardı güvenlik önlemleri kullanıyoruz: SSL/TLS şifreleme, İki faktörlü kimlik doğrulama, Düzenli güvenlik denetimleri, Erişim kontrolü ve izleme, Güvenli veri merkezleri.',
      },
      {
        title: '5. Çerezler',
        content: 'Web sitemizde oturum yönetimi, tercih hatırlama ve analitik amaçlı çerezler kullanıyoruz. Tarayıcı ayarlarınızdan çerezleri yönetebilirsiniz.',
      },
      {
        title: '6. Haklarınız',
        content: 'Verilerinize erişim talep etme, Verilerinizin düzeltilmesini isteme, Verilerinizin silinmesini talep etme, Veri taşınabilirliği talep etme, İşlemeye itiraz etme hakkına sahipsiniz.',
      },
      {
        title: '7. Veri Saklama',
        content: 'Verilerinizi hizmetlerimizi sunmak için gerekli olduğu sürece ve yasal yükümlülüklerimizi yerine getirmek için saklarız. Hesap kapatıldıktan sonra veriler yasal saklama süreleri boyunca tutulur.',
      },
      {
        title: '8. Uluslararası Transferler',
        content: 'Verileriniz, uygun güvenlik önlemleri alınarak farklı ülkelerdeki sunucularda işlenebilir.',
      },
      {
        title: '9. Çocukların Gizliliği',
        content: '18 yaşın altındaki kişilerden bilerek bilgi toplamıyoruz.',
      },
      {
        title: '10. İletişim',
        content: 'Gizlilik sorularınız için: privacy@auxite.io',
      },
    ],
  },
  en: {
    title: 'Privacy Policy',
    lastUpdated: 'Last updated: January 1, 2025',
    sections: [
      {
        title: '1. Information Collected',
        content: 'Identity information (name, date of birth), Contact information (email, phone), Financial information (wallet addresses, transaction history), Device information (IP address, browser type, operating system), Usage data (in-app activities, preferences).',
      },
      {
        title: '2. Use of Information',
        content: 'To provide and improve our services, To execute and verify transactions, To fulfill our legal obligations (KYC/AML), To provide customer support, To ensure security and prevent fraud, To send important updates and notifications.',
      },
      {
        title: '3. Information Sharing',
        content: 'We only share your information with third parties in the following cases: Legal requirement, With our service providers (payment processors, KYC providers), With your explicit consent, With business partners (limited and anonymized).',
      },
      {
        title: '4. Data Security',
        content: 'We use industry-standard security measures to protect your data: SSL/TLS encryption, Two-factor authentication, Regular security audits, Access control and monitoring, Secure data centers.',
      },
      {
        title: '5. Cookies',
        content: 'We use cookies on our website for session management, preference memory, and analytics. You can manage cookies through your browser settings.',
      },
      {
        title: '6. Your Rights',
        content: 'You have the right to: Request access to your data, Request correction of your data, Request deletion of your data, Request data portability, Object to processing.',
      },
      {
        title: '7. Data Retention',
        content: 'We retain your data as long as necessary to provide our services and fulfill our legal obligations. After account closure, data is retained for legal retention periods.',
      },
      {
        title: '8. International Transfers',
        content: 'Your data may be processed on servers in different countries with appropriate security measures.',
      },
      {
        title: '9. Children\'s Privacy',
        content: 'We do not knowingly collect information from individuals under 18 years of age.',
      },
      {
        title: '10. Contact',
        content: 'For privacy questions: privacy@auxite.io',
      },
    ],
  },
  de: {
    title: 'Datenschutzrichtlinie',
    lastUpdated: 'Letzte Aktualisierung: 1. Januar 2025',
    sections: [
      { title: '1. Erfasste Informationen', content: 'Identitätsdaten, Kontaktdaten, Finanzdaten, Geräteinformationen, Nutzungsdaten.' },
      { title: '2. Verwendung der Informationen', content: 'Zur Bereitstellung und Verbesserung unserer Dienste, zur Durchführung von Transaktionen, zur Erfüllung gesetzlicher Pflichten.' },
      { title: '3. Informationsweitergabe', content: 'Wir geben Ihre Daten nur bei gesetzlicher Verpflichtung oder mit Ihrer Zustimmung weiter.' },
      { title: '4. Datensicherheit', content: 'Wir verwenden branchenübliche Sicherheitsmaßnahmen: SSL/TLS, 2FA, regelmäßige Audits.' },
      { title: '5. Cookies', content: 'Wir verwenden Cookies für Sitzungsverwaltung und Analysen.' },
      { title: '6. Ihre Rechte', content: 'Sie haben das Recht auf Zugang, Berichtigung, Löschung und Datenübertragbarkeit.' },
      { title: '7. Datenspeicherung', content: 'Daten werden so lange aufbewahrt, wie für unsere Dienste erforderlich.' },
      { title: '8. Internationale Übertragungen', content: 'Ihre Daten können auf Servern in verschiedenen Ländern verarbeitet werden.' },
      { title: '9. Datenschutz für Kinder', content: 'Wir sammeln wissentlich keine Daten von Personen unter 18 Jahren.' },
      { title: '10. Kontakt', content: 'Für Datenschutzfragen: privacy@auxite.io' },
    ],
  },
  fr: {
    title: 'Politique de confidentialité',
    lastUpdated: 'Dernière mise à jour: 1 janvier 2025',
    sections: [
      { title: '1. Informations collectées', content: "Données d'identité, coordonnées, données financières, informations sur l'appareil, données d'utilisation." },
      { title: '2. Utilisation des informations', content: 'Pour fournir et améliorer nos services, effectuer des transactions, remplir nos obligations légales.' },
      { title: '3. Partage des informations', content: 'Nous ne partageons vos données que si la loi l\'exige ou avec votre consentement.' },
      { title: '4. Sécurité des données', content: 'Nous utilisons des mesures de sécurité standard: SSL/TLS, 2FA, audits réguliers.' },
      { title: '5. Cookies', content: 'Nous utilisons des cookies pour la gestion de session et les analyses.' },
      { title: '6. Vos droits', content: "Vous avez le droit d'accès, de rectification, de suppression et de portabilité des données." },
      { title: '7. Conservation des données', content: 'Les données sont conservées aussi longtemps que nécessaire pour nos services.' },
      { title: '8. Transferts internationaux', content: 'Vos données peuvent être traitées sur des serveurs dans différents pays.' },
      { title: '9. Confidentialité des enfants', content: 'Nous ne collectons pas sciemment de données auprès de personnes de moins de 18 ans.' },
      { title: '10. Contact', content: 'Pour les questions de confidentialité: privacy@auxite.io' },
    ],
  },
  ar: {
    title: 'سياسة الخصوصية',
    lastUpdated: 'آخر تحديث: 1 يناير 2025',
    sections: [
      { title: '1. المعلومات المجمعة', content: 'بيانات الهوية، معلومات الاتصال، البيانات المالية، معلومات الجهاز، بيانات الاستخدام.' },
      { title: '2. استخدام المعلومات', content: 'لتقديم وتحسين خدماتنا، تنفيذ المعاملات، الوفاء بالتزاماتنا القانونية.' },
      { title: '3. مشاركة المعلومات', content: 'نشارك بياناتك فقط عند الضرورة القانونية أو بموافقتك.' },
      { title: '4. أمان البيانات', content: 'نستخدم إجراءات أمان قياسية: SSL/TLS، المصادقة الثنائية، عمليات تدقيق منتظمة.' },
      { title: '5. ملفات تعريف الارتباط', content: 'نستخدم ملفات تعريف الارتباط لإدارة الجلسات والتحليلات.' },
      { title: '6. حقوقك', content: 'لديك الحق في الوصول والتصحيح والحذف ونقل البيانات.' },
      { title: '7. الاحتفاظ بالبيانات', content: 'يتم الاحتفاظ بالبيانات طالما كان ذلك ضروريًا لخدماتنا.' },
      { title: '8. النقل الدولي', content: 'قد تتم معالجة بياناتك على خوادم في بلدان مختلفة.' },
      { title: '9. خصوصية الأطفال', content: 'لا نجمع بيانات من أشخاص تقل أعمارهم عن 18 عامًا.' },
      { title: '10. الاتصال', content: 'لأسئلة الخصوصية: privacy@auxite.io' },
    ],
  },
  ru: {
    title: 'Политика конфиденциальности',
    lastUpdated: 'Последнее обновление: 1 января 2025',
    sections: [
      { title: '1. Собираемая информация', content: 'Идентификационные данные, контактные данные, финансовые данные, информация об устройстве, данные об использовании.' },
      { title: '2. Использование информации', content: 'Для предоставления и улучшения наших услуг, выполнения транзакций, выполнения юридических обязательств.' },
      { title: '3. Передача информации', content: 'Мы передаем ваши данные только при юридической необходимости или с вашего согласия.' },
      { title: '4. Безопасность данных', content: 'Мы используем стандартные меры безопасности: SSL/TLS, 2FA, регулярные аудиты.' },
      { title: '5. Файлы cookie', content: 'Мы используем файлы cookie для управления сессиями и аналитики.' },
      { title: '6. Ваши права', content: 'Вы имеете право на доступ, исправление, удаление и перенос данных.' },
      { title: '7. Хранение данных', content: 'Данные хранятся столько, сколько необходимо для наших услуг.' },
      { title: '8. Международные переводы', content: 'Ваши данные могут обрабатываться на серверах в разных странах.' },
      { title: '9. Конфиденциальность детей', content: 'Мы не собираем данные лиц младше 18 лет.' },
      { title: '10. Контакты', content: 'По вопросам конфиденциальности: privacy@auxite.io' },
    ],
  },
};

export default function PrivacyScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { theme, language } = useStore();
  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  const t = content[language as keyof typeof content] || content.en;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
      <View style={[styles.header, { borderBottomColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#0f172a'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#0f172a' }]}>{t.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.lastUpdated, { color: isDark ? '#64748b' : '#94a3b8' }]}>{t.lastUpdated}</Text>
        {t.sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#0f172a' }]}>{section.title}</Text>
            <Text style={[styles.sectionContent, { color: isDark ? '#94a3b8' : '#64748b' }]}>{section.content}</Text>
          </View>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1 },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  content: { flex: 1, paddingHorizontal: 20 },
  lastUpdated: { fontSize: 12, marginTop: 16, marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  sectionContent: { fontSize: 14, lineHeight: 22 },
});
