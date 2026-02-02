// app/legal/terms.tsx
// Terms of Service

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
    title: 'Kullanım Şartları',
    lastUpdated: 'Son güncelleme: 1 Ocak 2025',
    sections: [
      {
        title: '1. Hizmet Tanımı',
        content: 'Auxite, kullanıcıların tokenize edilmiş değerli metalleri (altın, gümüş, platin, paladyum) alıp satabilecekleri ve stake edebilecekleri bir dijital varlık platformudur. Platform, blockchain teknolojisi üzerine inşa edilmiştir ve gerçek dünya varlıklarını (RWA) temsil eden tokenlar sunar.',
      },
      {
        title: '2. Hesap Oluşturma',
        content: 'Hizmetlerimizi kullanmak için bir hesap oluşturmanız gerekmektedir. Hesap oluştururken doğru, güncel ve eksiksiz bilgi sağlamayı kabul edersiniz. Hesabınızın güvenliğinden ve hesabınız altında gerçekleşen tüm aktivitelerden siz sorumlusunuz.',
      },
      {
        title: '3. Uygunluk',
        content: 'Platformumuzu kullanmak için en az 18 yaşında olmanız gerekmektedir. Kendi yargı alanınızda dijital varlık işlemlerinin yasal olduğunu onaylamanız gerekmektedir. ABD, Kuzey Kore, İran ve diğer yaptırım uygulanan ülke vatandaşları hizmetlerimizi kullanamazlar.',
      },
      {
        title: '4. İşlem Kuralları',
        content: 'Tüm işlemler geri alınamaz niteliktedir. Minimum ve maksimum işlem limitleri uygulanabilir. Platform, herhangi bir işlemi onaylama veya reddetme hakkını saklı tutar. İşlem ücretleri her işlem öncesinde açıkça gösterilecektir.',
      },
      {
        title: '5. Staking Koşulları',
        content: 'Stake edilen varlıklar belirlenen süre boyunca kilitlenir. APY oranları garanti edilmez ve piyasa koşullarına göre değişebilir. Erken çıkış durumunda cezalar uygulanabilir. Staking ödülleri otomatik olarak veya manuel olarak talep edilebilir.',
      },
      {
        title: '6. Riskler',
        content: 'Dijital varlık yatırımları yüksek risk içerir. Yatırımınızın tamamını kaybedebilirsiniz. Geçmiş performans gelecekteki sonuçların garantisi değildir. Yatırım kararı vermeden önce bağımsız finansal danışmanlık almanızı öneririz.',
      },
      {
        title: '7. Fikri Mülkiyet',
        content: 'Auxite adı, logosu ve tüm içerik Auxite\'ın mülkiyetindedir. İzinsiz kullanım yasaktır.',
      },
      {
        title: '8. Sorumluluk Sınırı',
        content: 'Auxite, platformun kullanımından doğabilecek doğrudan veya dolaylı zararlardan sorumlu tutulamaz. Hizmet "olduğu gibi" sunulmaktadır.',
      },
      {
        title: '9. Değişiklikler',
        content: 'Bu şartları önceden haber vermeksizin değiştirme hakkımızı saklı tutarız. Değişiklikler yayınlandığı anda yürürlüğe girer.',
      },
      {
        title: '10. İletişim',
        content: 'Sorularınız için: legal@auxite.io',
      },
    ],
  },
  en: {
    title: 'Terms of Service',
    lastUpdated: 'Last updated: January 1, 2025',
    sections: [
      {
        title: '1. Service Description',
        content: 'Auxite is a digital asset platform where users can buy, sell, and stake tokenized precious metals (gold, silver, platinum, palladium). The platform is built on blockchain technology and offers tokens representing real-world assets (RWA).',
      },
      {
        title: '2. Account Creation',
        content: 'You must create an account to use our services. You agree to provide accurate, current, and complete information when creating an account. You are responsible for the security of your account and all activities that occur under it.',
      },
      {
        title: '3. Eligibility',
        content: 'You must be at least 18 years old to use our platform. You must confirm that digital asset transactions are legal in your jurisdiction. Citizens of the US, North Korea, Iran, and other sanctioned countries cannot use our services.',
      },
      {
        title: '4. Transaction Rules',
        content: 'All transactions are irreversible. Minimum and maximum transaction limits may apply. The platform reserves the right to approve or reject any transaction. Transaction fees will be clearly displayed before each transaction.',
      },
      {
        title: '5. Staking Terms',
        content: 'Staked assets are locked for the specified period. APY rates are not guaranteed and may change based on market conditions. Penalties may apply for early withdrawal. Staking rewards can be claimed automatically or manually.',
      },
      {
        title: '6. Risks',
        content: 'Digital asset investments carry high risk. You may lose your entire investment. Past performance is not a guarantee of future results. We recommend seeking independent financial advice before making investment decisions.',
      },
      {
        title: '7. Intellectual Property',
        content: 'The Auxite name, logo, and all content are the property of Auxite. Unauthorized use is prohibited.',
      },
      {
        title: '8. Limitation of Liability',
        content: 'Auxite cannot be held responsible for direct or indirect damages that may arise from the use of the platform. The service is provided "as is".',
      },
      {
        title: '9. Changes',
        content: 'We reserve the right to change these terms without prior notice. Changes take effect immediately upon publication.',
      },
      {
        title: '10. Contact',
        content: 'For questions: legal@auxite.io',
      },
    ],
  },
  de: {
    title: 'Nutzungsbedingungen',
    lastUpdated: 'Letzte Aktualisierung: 1. Januar 2025',
    sections: [
      { title: '1. Servicebeschreibung', content: 'Auxite ist eine Plattform für digitale Vermögenswerte, auf der Benutzer tokenisierte Edelmetalle kaufen, verkaufen und staken können.' },
      { title: '2. Kontoerstellung', content: 'Sie müssen ein Konto erstellen, um unsere Dienste zu nutzen. Sie stimmen zu, genaue und vollständige Informationen anzugeben.' },
      { title: '3. Berechtigung', content: 'Sie müssen mindestens 18 Jahre alt sein. Sie müssen bestätigen, dass digitale Vermögenswerte in Ihrer Gerichtsbarkeit legal sind.' },
      { title: '4. Transaktionsregeln', content: 'Alle Transaktionen sind unwiderruflich. Es können Mindest- und Höchstgrenzen gelten.' },
      { title: '5. Staking-Bedingungen', content: 'Gestakte Vermögenswerte werden für den angegebenen Zeitraum gesperrt. APY-Raten sind nicht garantiert.' },
      { title: '6. Risiken', content: 'Investitionen in digitale Vermögenswerte sind mit hohem Risiko verbunden. Sie können Ihre gesamte Investition verlieren.' },
      { title: '7. Geistiges Eigentum', content: 'Der Name Auxite, das Logo und alle Inhalte sind Eigentum von Auxite.' },
      { title: '8. Haftungsbeschränkung', content: 'Auxite haftet nicht für direkte oder indirekte Schäden aus der Nutzung der Plattform.' },
      { title: '9. Änderungen', content: 'Wir behalten uns das Recht vor, diese Bedingungen ohne vorherige Ankündigung zu ändern.' },
      { title: '10. Kontakt', content: 'Bei Fragen: legal@auxite.io' },
    ],
  },
  fr: {
    title: "Conditions d'utilisation",
    lastUpdated: 'Dernière mise à jour: 1 janvier 2025',
    sections: [
      { title: '1. Description du service', content: "Auxite est une plateforme d'actifs numériques où les utilisateurs peuvent acheter, vendre et staker des métaux précieux tokenisés." },
      { title: '2. Création de compte', content: "Vous devez créer un compte pour utiliser nos services. Vous acceptez de fournir des informations exactes et complètes." },
      { title: '3. Éligibilité', content: "Vous devez avoir au moins 18 ans. Vous devez confirmer que les actifs numériques sont légaux dans votre juridiction." },
      { title: '4. Règles de transaction', content: 'Toutes les transactions sont irréversibles. Des limites minimales et maximales peuvent s\'appliquer.' },
      { title: '5. Conditions de staking', content: 'Les actifs stakés sont verrouillés pour la période spécifiée. Les taux APY ne sont pas garantis.' },
      { title: '6. Risques', content: 'Les investissements en actifs numériques comportent des risques élevés. Vous pouvez perdre la totalité de votre investissement.' },
      { title: '7. Propriété intellectuelle', content: "Le nom Auxite, le logo et tout le contenu sont la propriété d'Auxite." },
      { title: '8. Limitation de responsabilité', content: "Auxite ne peut être tenu responsable des dommages directs ou indirects liés à l'utilisation de la plateforme." },
      { title: '9. Modifications', content: 'Nous nous réservons le droit de modifier ces conditions sans préavis.' },
      { title: '10. Contact', content: 'Pour toute question: legal@auxite.io' },
    ],
  },
  ar: {
    title: 'شروط الخدمة',
    lastUpdated: 'آخر تحديث: 1 يناير 2025',
    sections: [
      { title: '1. وصف الخدمة', content: 'Auxite هي منصة أصول رقمية حيث يمكن للمستخدمين شراء وبيع ورهن المعادن الثمينة المرمزة.' },
      { title: '2. إنشاء الحساب', content: 'يجب عليك إنشاء حساب لاستخدام خدماتنا. أنت توافق على تقديم معلومات دقيقة وكاملة.' },
      { title: '3. الأهلية', content: 'يجب أن يكون عمرك 18 عامًا على الأقل. يجب أن تؤكد أن الأصول الرقمية قانونية في نطاق ولايتك القضائية.' },
      { title: '4. قواعد المعاملات', content: 'جميع المعاملات غير قابلة للإلغاء. قد تنطبق حدود دنيا وقصوى.' },
      { title: '5. شروط الرهن', content: 'يتم قفل الأصول المرهونة للفترة المحددة. معدلات APY غير مضمونة.' },
      { title: '6. المخاطر', content: 'تحمل استثمارات الأصول الرقمية مخاطر عالية. قد تفقد استثمارك بالكامل.' },
      { title: '7. الملكية الفكرية', content: 'اسم Auxite والشعار وجميع المحتويات هي ملك لـ Auxite.' },
      { title: '8. حدود المسؤولية', content: 'لا يمكن تحميل Auxite المسؤولية عن الأضرار المباشرة أو غير المباشرة.' },
      { title: '9. التغييرات', content: 'نحتفظ بالحق في تغيير هذه الشروط دون إشعار مسبق.' },
      { title: '10. الاتصال', content: 'للأسئلة: legal@auxite.io' },
    ],
  },
  ru: {
    title: 'Условия использования',
    lastUpdated: 'Последнее обновление: 1 января 2025',
    sections: [
      { title: '1. Описание сервиса', content: 'Auxite — это платформа цифровых активов, где пользователи могут покупать, продавать и стейкать токенизированные драгоценные металлы.' },
      { title: '2. Создание аккаунта', content: 'Для использования наших услуг необходимо создать аккаунт. Вы соглашаетесь предоставить точную и полную информацию.' },
      { title: '3. Соответствие требованиям', content: 'Вам должно быть не менее 18 лет. Вы должны подтвердить, что цифровые активы легальны в вашей юрисдикции.' },
      { title: '4. Правила транзакций', content: 'Все транзакции необратимы. Могут применяться минимальные и максимальные лимиты.' },
      { title: '5. Условия стейкинга', content: 'Застейканные активы заблокированы на указанный период. Ставки APY не гарантированы.' },
      { title: '6. Риски', content: 'Инвестиции в цифровые активы связаны с высоким риском. Вы можете потерять все свои инвестиции.' },
      { title: '7. Интеллектуальная собственность', content: 'Название Auxite, логотип и весь контент являются собственностью Auxite.' },
      { title: '8. Ограничение ответственности', content: 'Auxite не несет ответственности за прямые или косвенные убытки от использования платформы.' },
      { title: '9. Изменения', content: 'Мы оставляем за собой право изменять эти условия без предварительного уведомления.' },
      { title: '10. Контакты', content: 'По вопросам: legal@auxite.io' },
    ],
  },
};

export default function TermsScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { theme, language } = useStore();
  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  const t = content[language as keyof typeof content] || content.en;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#0f172a'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#0f172a' }]}>
          {t.title}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.lastUpdated, { color: isDark ? '#64748b' : '#94a3b8' }]}>
          {t.lastUpdated}
        </Text>

        {t.sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#0f172a' }]}>
              {section.title}
            </Text>
            <Text style={[styles.sectionContent, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              {section.content}
            </Text>
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
