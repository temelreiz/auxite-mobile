// app/legal/rwa-disclosure.tsx
// Real World Asset (RWA) Disclosure

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
    title: 'RWA Açıklaması',
    lastUpdated: 'Son güncelleme: 1 Ocak 2025',
    subtitle: 'Gerçek Dünya Varlıkları (Real World Assets) Hakkında',
    sections: [
      {
        title: 'RWA Nedir?',
        content: 'Real World Assets (RWA), blockchain üzerinde tokenize edilmiş gerçek dünya varlıklarını ifade eder. Auxite platformunda sunulan tokenlar, fiziksel değerli metalleri (altın, gümüş, platin, paladyum) temsil eder.',
      },
      {
        title: 'Token Karşılığı',
        content: 'Her AUXG tokeni 1 gram fiziksel altın ile desteklenmektedir. Her AUXS tokeni 1 gram fiziksel gümüş ile desteklenmektedir. Her AUXPT tokeni 1 gram fiziksel platin ile desteklenmektedir. Her AUXPD tokeni 1 gram fiziksel paladyum ile desteklenmektedir.',
      },
      {
        title: 'Fiziksel Varlık Saklama',
        content: 'Fiziksel değerli metaller, dünya çapında akredite ve sigortalı kasalarda saklanmaktadır. Saklama hizmeti, bağımsız ve düzenlenmiş custody sağlayıcıları tarafından yürütülmektedir. Tüm varlıklar düzenli olarak denetlenmekte ve doğrulanmaktadır.',
      },
      {
        title: 'Denetim ve Şeffaflık',
        content: 'Aylık bağımsız denetim raporları yayınlanmaktadır. Proof of Reserve (Rezerv Kanıtı) blockchain üzerinde gerçek zamanlı olarak doğrulanabilir. Üçüncü taraf denetim firmaları tarafından düzenli kontroller yapılmaktadır.',
      },
      {
        title: 'Token Standartları',
        content: 'Tüm tokenlar ERC-20 standardında oluşturulmuştur. Base blockchain ağı üzerinde çalışmaktadır. Akıllı kontratlar bağımsız güvenlik firmaları tarafından denetlenmiştir.',
      },
      {
        title: 'Fiziksel Teslimat',
        content: 'Belirli minimum miktarların üzerinde fiziksel teslimat talep edilebilir. Teslimat talepleri 5-10 iş günü içinde işleme alınır. Teslimat maliyetleri ve sigorta ücretleri kullanıcıya aittir.',
      },
      {
        title: 'Değerleme',
        content: 'Token fiyatları, uluslararası spot piyasa fiyatlarına endekslidir. Fiyatlar London Bullion Market Association (LBMA) referans fiyatlarına göre belirlenir. Küçük spread ve işlem ücretleri uygulanır.',
      },
      {
        title: 'Yasal Yapı',
        content: 'Auxite, ilgili yargı alanlarında gerekli lisanslara sahiptir. Token sahipleri, dayanak varlıklar üzerinde orantılı hakka sahiptir. Tokenlar menkul kıymet değildir; dayanak fiziksel varlığın dijital temsilidir.',
      },
      {
        title: 'Riskler',
        content: 'Custody sağlayıcısı riskleri mevcuttur. Sigorta kapsamı sınırlı olabilir. Düzenleyici değişiklikler varlık yapısını etkileyebilir. Detaylı risk bilgilendirmesi için Risk Uyarısı belgesini inceleyiniz.',
      },
      {
        title: 'İletişim',
        content: 'RWA ile ilgili sorularınız için: rwa@auxite.io\nRezerv denetim raporları: audit.auxite.io',
      },
    ],
  },
  en: {
    title: 'RWA Disclosure',
    lastUpdated: 'Last updated: January 1, 2025',
    subtitle: 'About Real World Assets',
    sections: [
      {
        title: 'What is RWA?',
        content: 'Real World Assets (RWA) refers to real-world assets tokenized on the blockchain. The tokens offered on the Auxite platform represent physical precious metals (gold, silver, platinum, palladium).',
      },
      {
        title: 'Token Backing',
        content: 'Each AUXG token is backed by 1 gram of physical gold. Each AUXS token is backed by 1 gram of physical silver. Each AUXPT token is backed by 1 gram of physical platinum. Each AUXPD token is backed by 1 gram of physical palladium.',
      },
      {
        title: 'Physical Asset Custody',
        content: 'Physical precious metals are stored in accredited and insured vaults worldwide. Custody service is provided by independent and regulated custody providers. All assets are regularly audited and verified.',
      },
      {
        title: 'Audit and Transparency',
        content: 'Monthly independent audit reports are published. Proof of Reserve can be verified in real-time on the blockchain. Regular checks are performed by third-party audit firms.',
      },
      {
        title: 'Token Standards',
        content: 'All tokens are created in ERC-20 standard. They operate on the Base blockchain network. Smart contracts have been audited by independent security firms.',
      },
      {
        title: 'Physical Delivery',
        content: 'Physical delivery can be requested for amounts above certain minimums. Delivery requests are processed within 5-10 business days. Delivery costs and insurance fees are borne by the user.',
      },
      {
        title: 'Valuation',
        content: 'Token prices are indexed to international spot market prices. Prices are determined based on London Bullion Market Association (LBMA) reference prices. Small spreads and transaction fees apply.',
      },
      {
        title: 'Legal Structure',
        content: 'Auxite holds necessary licenses in relevant jurisdictions. Token holders have proportional rights to underlying assets. Tokens are not securities; they are digital representations of underlying physical assets.',
      },
      {
        title: 'Risks',
        content: 'Custody provider risks exist. Insurance coverage may be limited. Regulatory changes may affect asset structure. Please review the Risk Disclosure document for detailed risk information.',
      },
      {
        title: 'Contact',
        content: 'For RWA-related questions: rwa@auxite.io\nReserve audit reports: audit.auxite.io',
      },
    ],
  },
  de: {
    title: 'RWA-Offenlegung',
    lastUpdated: 'Letzte Aktualisierung: 1. Januar 2025',
    subtitle: 'Über Real World Assets',
    sections: [
      { title: 'Was ist RWA?', content: 'Real World Assets (RWA) bezieht sich auf reale Vermögenswerte, die auf der Blockchain tokenisiert wurden. Die auf der Auxite-Plattform angebotenen Token repräsentieren physische Edelmetalle.' },
      { title: 'Token-Deckung', content: 'Jeder AUXG-Token ist durch 1 Gramm physisches Gold gedeckt. Jeder AUXS-Token ist durch 1 Gramm physisches Silber gedeckt. Jeder AUXPT-Token ist durch 1 Gramm physisches Platin gedeckt.' },
      { title: 'Physische Verwahrung', content: 'Physische Edelmetalle werden in akkreditierten und versicherten Tresoren weltweit aufbewahrt.' },
      { title: 'Audit und Transparenz', content: 'Monatliche unabhängige Prüfberichte werden veröffentlicht. Proof of Reserve kann in Echtzeit auf der Blockchain überprüft werden.' },
      { title: 'Token-Standards', content: 'Alle Token sind im ERC-20-Standard erstellt und laufen auf dem Base-Blockchain-Netzwerk.' },
      { title: 'Physische Lieferung', content: 'Physische Lieferung kann für Beträge über bestimmten Mindestmengen angefordert werden.' },
      { title: 'Bewertung', content: 'Token-Preise sind an internationale Spotmarktpreise gekoppelt.' },
      { title: 'Rechtliche Struktur', content: 'Auxite besitzt die erforderlichen Lizenzen. Token sind keine Wertpapiere.' },
      { title: 'Risiken', content: 'Es bestehen Verwahrungsrisiken. Der Versicherungsschutz kann begrenzt sein.' },
      { title: 'Kontakt', content: 'Für RWA-bezogene Fragen: rwa@auxite.io' },
    ],
  },
  fr: {
    title: 'Divulgation RWA',
    lastUpdated: 'Dernière mise à jour: 1 janvier 2025',
    subtitle: 'À propos des Real World Assets',
    sections: [
      { title: 'Qu\'est-ce que RWA?', content: 'Les Real World Assets (RWA) font référence aux actifs du monde réel tokenisés sur la blockchain. Les tokens offerts sur la plateforme Auxite représentent des métaux précieux physiques.' },
      { title: 'Adossement des tokens', content: 'Chaque token AUXG est adossé à 1 gramme d\'or physique. Chaque token AUXS est adossé à 1 gramme d\'argent physique.' },
      { title: 'Conservation physique', content: 'Les métaux précieux physiques sont stockés dans des coffres accrédités et assurés dans le monde entier.' },
      { title: 'Audit et transparence', content: 'Des rapports d\'audit indépendants mensuels sont publiés. La preuve de réserve peut être vérifiée en temps réel sur la blockchain.' },
      { title: 'Standards des tokens', content: 'Tous les tokens sont créés selon le standard ERC-20 et fonctionnent sur le réseau blockchain Base.' },
      { title: 'Livraison physique', content: 'La livraison physique peut être demandée pour des montants supérieurs à certains minimums.' },
      { title: 'Valorisation', content: 'Les prix des tokens sont indexés sur les prix du marché spot international.' },
      { title: 'Structure juridique', content: 'Auxite détient les licences nécessaires. Les tokens ne sont pas des valeurs mobilières.' },
      { title: 'Risques', content: 'Des risques liés aux dépositaires existent. La couverture d\'assurance peut être limitée.' },
      { title: 'Contact', content: 'Pour les questions RWA: rwa@auxite.io' },
    ],
  },
  ar: {
    title: 'إفصاح RWA',
    lastUpdated: 'آخر تحديث: 1 يناير 2025',
    subtitle: 'حول أصول العالم الحقيقي',
    sections: [
      { title: 'ما هو RWA؟', content: 'تشير أصول العالم الحقيقي (RWA) إلى الأصول الحقيقية المرمزة على البلوكتشين. تمثل الرموز المقدمة على منصة Auxite المعادن الثمينة الفعلية.' },
      { title: 'دعم الرموز', content: 'كل رمز AUXG مدعوم بـ 1 جرام من الذهب الفعلي. كل رمز AUXS مدعوم بـ 1 جرام من الفضة الفعلية.' },
      { title: 'حفظ الأصول الفعلية', content: 'يتم تخزين المعادن الثمينة الفعلية في خزائن معتمدة ومؤمنة حول العالم.' },
      { title: 'التدقيق والشفافية', content: 'يتم نشر تقارير تدقيق مستقلة شهرية. يمكن التحقق من إثبات الاحتياطي في الوقت الفعلي على البلوكتشين.' },
      { title: 'معايير الرموز', content: 'جميع الرموز منشأة وفق معيار ERC-20 وتعمل على شبكة Base blockchain.' },
      { title: 'التسليم الفعلي', content: 'يمكن طلب التسليم الفعلي للمبالغ التي تتجاوز حدود معينة.' },
      { title: 'التقييم', content: 'أسعار الرموز مرتبطة بأسعار السوق الفوري الدولية.' },
      { title: 'الهيكل القانوني', content: 'تمتلك Auxite التراخيص اللازمة. الرموز ليست أوراقًا مالية.' },
      { title: 'المخاطر', content: 'توجد مخاطر متعلقة بمقدمي الحفظ. قد تكون التغطية التأمينية محدودة.' },
      { title: 'الاتصال', content: 'للأسئلة المتعلقة بـ RWA: rwa@auxite.io' },
    ],
  },
  ru: {
    title: 'Раскрытие информации RWA',
    lastUpdated: 'Последнее обновление: 1 января 2025',
    subtitle: 'О Real World Assets',
    sections: [
      { title: 'Что такое RWA?', content: 'Real World Assets (RWA) относится к реальным активам, токенизированным на блокчейне. Токены, предлагаемые на платформе Auxite, представляют физические драгоценные металлы.' },
      { title: 'Обеспечение токенов', content: 'Каждый токен AUXG обеспечен 1 граммом физического золота. Каждый токен AUXS обеспечен 1 граммом физического серебра.' },
      { title: 'Хранение физических активов', content: 'Физические драгоценные металлы хранятся в аккредитованных и застрахованных хранилищах по всему миру.' },
      { title: 'Аудит и прозрачность', content: 'Публикуются ежемесячные независимые аудиторские отчеты. Proof of Reserve можно проверить в реальном времени на блокчейне.' },
      { title: 'Стандарты токенов', content: 'Все токены созданы по стандарту ERC-20 и работают в сети Base blockchain.' },
      { title: 'Физическая доставка', content: 'Физическая доставка может быть запрошена для сумм выше определенных минимумов.' },
      { title: 'Оценка', content: 'Цены токенов привязаны к международным спотовым ценам.' },
      { title: 'Юридическая структура', content: 'Auxite имеет необходимые лицензии. Токены не являются ценными бумагами.' },
      { title: 'Риски', content: 'Существуют риски, связанные с хранителями. Страховое покрытие может быть ограничено.' },
      { title: 'Контакты', content: 'По вопросам RWA: rwa@auxite.io' },
    ],
  },
};

export default function RWADisclosureScreen() {
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
        <View style={[styles.subtitleBox, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
          <Ionicons name="diamond" size={24} color="#10b981" />
          <Text style={[styles.subtitleText, { color: isDark ? '#fff' : '#0f172a' }]}>{t.subtitle}</Text>
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
  subtitleBox: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16, padding: 16, borderRadius: 12 },
  subtitleText: { fontSize: 16, fontWeight: '600' },
  lastUpdated: { fontSize: 12, marginTop: 16, marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  sectionContent: { fontSize: 14, lineHeight: 22 },
});
