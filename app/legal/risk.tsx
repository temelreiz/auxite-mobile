// app/legal/risk.tsx
// Risk Disclosure

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
    title: 'Risk Uyarısı',
    lastUpdated: 'Son güncelleme: 1 Ocak 2025',
    warning: '⚠️ ÖNEMLİ: Yatırım yapmadan önce bu belgeyi dikkatle okuyun.',
    sections: [
      {
        title: 'Genel Risk Uyarısı',
        content: 'Dijital varlıklar ve tokenize edilmiş değerli metaller yüksek risk içeren yatırımlardır. Yatırımınızın tamamını kaybedebilirsiniz. Kaybetmeyi göze alamayacağınız parayı asla yatırmayın.',
      },
      {
        title: 'Piyasa Riskleri',
        content: 'Değerli metal fiyatları son derece volatil olabilir. Küresel ekonomik koşullar fiyatları etkileyebilir. Döviz kuru dalgalanmaları getirileri etkileyebilir. Likidite koşulları işlem maliyetlerini artırabilir.',
      },
      {
        title: 'Teknoloji Riskleri',
        content: 'Blockchain ağları teknik sorunlar yaşayabilir. Akıllı kontrat hataları fon kaybına yol açabilir. Siber saldırılar varlıklarınızı tehlikeye atabilir. Cüzdan güvenliği tamamen sizin sorumluluğunuzdadır.',
      },
      {
        title: 'Düzenleyici Riskler',
        content: 'Yasal düzenlemeler değişebilir ve yatırımlarınızı etkileyebilir. Bazı yargı alanlarında dijital varlıklar yasaklanabilir veya kısıtlanabilir. Vergi mevzuatı değişebilir.',
      },
      {
        title: 'Likidite Riskleri',
        content: 'Piyasa koşullarına bağlı olarak varlıklarınızı satamayabilirsiniz. Düşük likidite dönemlerinde spread\'ler artabilir. Ani fiyat hareketleri işlem gerçekleştirmeyi zorlaştırabilir.',
      },
      {
        title: 'Staking Riskleri',
        content: 'Stake edilen varlıklar belirlenen süre boyunca kilitlenir ve bu süre içinde erişilemez. APY oranları garanti edilmez ve değişebilir. Protokol riskleri stake edilen varlıkları etkileyebilir.',
      },
      {
        title: 'Karşı Taraf Riskleri',
        content: 'Hizmet sağlayıcılarının finansal durumu değişebilir. Üçüncü taraf custody riskleri bulunmaktadır.',
      },
      {
        title: 'Öneriler',
        content: 'Yatırım yapmadan önce bağımsız finansal danışmanlık alın. Sadece kaybetmeyi göze alabileceğiniz miktarı yatırın. Portföyünüzü çeşitlendirin. Düzenli olarak yatırımlarınızı gözden geçirin. Güvenlik önlemlerini ihmal etmeyin.',
      },
    ],
  },
  en: {
    title: 'Risk Disclosure',
    lastUpdated: 'Last updated: January 1, 2025',
    warning: '⚠️ IMPORTANT: Read this document carefully before investing.',
    sections: [
      {
        title: 'General Risk Warning',
        content: 'Digital assets and tokenized precious metals are high-risk investments. You may lose your entire investment. Never invest money you cannot afford to lose.',
      },
      {
        title: 'Market Risks',
        content: 'Precious metal prices can be extremely volatile. Global economic conditions can affect prices. Currency fluctuations can impact returns. Liquidity conditions can increase transaction costs.',
      },
      {
        title: 'Technology Risks',
        content: 'Blockchain networks may experience technical issues. Smart contract bugs can lead to loss of funds. Cyber attacks can jeopardize your assets. Wallet security is entirely your responsibility.',
      },
      {
        title: 'Regulatory Risks',
        content: 'Legal regulations may change and affect your investments. Digital assets may be banned or restricted in some jurisdictions. Tax legislation may change.',
      },
      {
        title: 'Liquidity Risks',
        content: 'You may not be able to sell your assets depending on market conditions. Spreads may increase during low liquidity periods. Sudden price movements can make trading difficult.',
      },
      {
        title: 'Staking Risks',
        content: 'Staked assets are locked for the specified period and cannot be accessed during this time. APY rates are not guaranteed and may change. Protocol risks can affect staked assets.',
      },
      {
        title: 'Counterparty Risks',
        content: 'The financial status of service providers may change. Third-party custody risks exist.',
      },
      {
        title: 'Recommendations',
        content: 'Seek independent financial advice before investing. Only invest what you can afford to lose. Diversify your portfolio. Regularly review your investments. Do not neglect security measures.',
      },
    ],
  },
  de: {
    title: 'Risikohinweis',
    lastUpdated: 'Letzte Aktualisierung: 1. Januar 2025',
    warning: '⚠️ WICHTIG: Lesen Sie dieses Dokument sorgfältig vor der Investition.',
    sections: [
      { title: 'Allgemeine Risikowarnung', content: 'Digitale Vermögenswerte und tokenisierte Edelmetalle sind Hochrisiko-Investitionen. Sie können Ihre gesamte Investition verlieren.' },
      { title: 'Marktrisiken', content: 'Edelmetallpreise können extrem volatil sein. Globale wirtschaftliche Bedingungen können die Preise beeinflussen.' },
      { title: 'Technologierisiken', content: 'Blockchain-Netzwerke können technische Probleme haben. Smart-Contract-Fehler können zum Verlust von Geldern führen.' },
      { title: 'Regulatorische Risiken', content: 'Gesetzliche Vorschriften können sich ändern. Digitale Vermögenswerte können in einigen Ländern verboten werden.' },
      { title: 'Liquiditätsrisiken', content: 'Sie können Ihre Vermögenswerte je nach Marktbedingungen möglicherweise nicht verkaufen.' },
      { title: 'Staking-Risiken', content: 'Gestakte Vermögenswerte sind für den angegebenen Zeitraum gesperrt. APY-Raten sind nicht garantiert.' },
      { title: 'Gegenparteirisiken', content: 'Der finanzielle Status von Dienstleistern kann sich ändern.' },
      { title: 'Empfehlungen', content: 'Holen Sie sich vor der Investition unabhängige Finanzberatung. Investieren Sie nur, was Sie sich leisten können zu verlieren.' },
    ],
  },
  fr: {
    title: 'Avertissement sur les risques',
    lastUpdated: 'Dernière mise à jour: 1 janvier 2025',
    warning: '⚠️ IMPORTANT: Lisez attentivement ce document avant d\'investir.',
    sections: [
      { title: 'Avertissement général', content: 'Les actifs numériques et les métaux précieux tokenisés sont des investissements à haut risque. Vous pouvez perdre la totalité de votre investissement.' },
      { title: 'Risques de marché', content: 'Les prix des métaux précieux peuvent être extrêmement volatils. Les conditions économiques mondiales peuvent affecter les prix.' },
      { title: 'Risques technologiques', content: 'Les réseaux blockchain peuvent connaître des problèmes techniques. Les bugs de contrats intelligents peuvent entraîner une perte de fonds.' },
      { title: 'Risques réglementaires', content: 'Les réglementations peuvent changer. Les actifs numériques peuvent être interdits dans certaines juridictions.' },
      { title: 'Risques de liquidité', content: 'Vous pourriez ne pas être en mesure de vendre vos actifs selon les conditions du marché.' },
      { title: 'Risques de staking', content: 'Les actifs stakés sont verrouillés pour la période spécifiée. Les taux APY ne sont pas garantis.' },
      { title: 'Risques de contrepartie', content: 'La situation financière des prestataires de services peut changer.' },
      { title: 'Recommandations', content: 'Obtenez des conseils financiers indépendants avant d\'investir. N\'investissez que ce que vous pouvez vous permettre de perdre.' },
    ],
  },
  ar: {
    title: 'تحذير المخاطر',
    lastUpdated: 'آخر تحديث: 1 يناير 2025',
    warning: '⚠️ مهم: اقرأ هذه الوثيقة بعناية قبل الاستثمار.',
    sections: [
      { title: 'تحذير عام من المخاطر', content: 'الأصول الرقمية والمعادن الثمينة المرمزة هي استثمارات عالية المخاطر. قد تفقد استثمارك بالكامل.' },
      { title: 'مخاطر السوق', content: 'يمكن أن تكون أسعار المعادن الثمينة متقلبة للغاية. يمكن أن تؤثر الظروف الاقتصادية العالمية على الأسعار.' },
      { title: 'المخاطر التقنية', content: 'قد تواجه شبكات البلوكتشين مشاكل تقنية. يمكن أن تؤدي أخطاء العقود الذكية إلى فقدان الأموال.' },
      { title: 'المخاطر التنظيمية', content: 'قد تتغير اللوائح القانونية. قد يتم حظر الأصول الرقمية في بعض الولايات القضائية.' },
      { title: 'مخاطر السيولة', content: 'قد لا تتمكن من بيع أصولك حسب ظروف السوق.' },
      { title: 'مخاطر الرهن', content: 'الأصول المرهونة مقفلة للفترة المحددة. معدلات APY غير مضمونة.' },
      { title: 'مخاطر الطرف المقابل', content: 'قد تتغير الحالة المالية لمقدمي الخدمات.' },
      { title: 'التوصيات', content: 'احصل على استشارة مالية مستقلة قبل الاستثمار. استثمر فقط ما يمكنك تحمل خسارته.' },
    ],
  },
  ru: {
    title: 'Предупреждение о рисках',
    lastUpdated: 'Последнее обновление: 1 января 2025',
    warning: '⚠️ ВАЖНО: Внимательно прочитайте этот документ перед инвестированием.',
    sections: [
      { title: 'Общее предупреждение о рисках', content: 'Цифровые активы и токенизированные драгоценные металлы — это инвестиции с высоким риском. Вы можете потерять все свои инвестиции.' },
      { title: 'Рыночные риски', content: 'Цены на драгоценные металлы могут быть крайне волатильными. Глобальные экономические условия могут влиять на цены.' },
      { title: 'Технологические риски', content: 'Блокчейн-сети могут испытывать технические проблемы. Ошибки смарт-контрактов могут привести к потере средств.' },
      { title: 'Регуляторные риски', content: 'Законодательство может измениться. Цифровые активы могут быть запрещены в некоторых юрисдикциях.' },
      { title: 'Риски ликвидности', content: 'Вы можете не иметь возможности продать свои активы в зависимости от рыночных условий.' },
      { title: 'Риски стейкинга', content: 'Застейканные активы заблокированы на указанный период. Ставки APY не гарантированы.' },
      { title: 'Риски контрагента', content: 'Финансовое состояние поставщиков услуг может измениться.' },
      { title: 'Рекомендации', content: 'Получите независимую финансовую консультацию перед инвестированием. Инвестируйте только то, что можете позволить себе потерять.' },
    ],
  },
};

export default function RiskScreen() {
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
        <View style={[styles.warningBox, { backgroundColor: '#fef3c720', borderColor: '#f59e0b' }]}>
          <Text style={styles.warningText}>{t.warning}</Text>
        </View>
        
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
  warningBox: { marginTop: 16, padding: 16, borderRadius: 12, borderWidth: 1 },
  warningText: { fontSize: 14, fontWeight: '600', color: '#f59e0b', textAlign: 'center' },
  lastUpdated: { fontSize: 12, marginTop: 16, marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  sectionContent: { fontSize: 14, lineHeight: 22 },
});
