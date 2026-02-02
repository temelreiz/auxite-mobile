import { StyleSheet, View, Text, useColorScheme, TouchableOpacity, ScrollView, Image, Modal, Dimensions, TextInput, Keyboard } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '@/stores/useStore';
import { useTranslation } from '@/hooks/useTranslation';
import { useBalanceStore } from '@/stores/useBalanceStore';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { getTradePreview, type TradePreview, getQuote, executeQuoteTrade, type Quote } from '@/services/api';
import { useCustomAlert } from '@/components/CustomAlert';
import { API_URL } from '@/constants/api';

const TROY_OZ_TO_GRAM = 31.1035;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const metalIcons: Record<string, any> = {
  AUXG: require('@/assets/images/metals/gold.png'),
  AUXS: require('@/assets/images/metals/silver.png'),
  AUXPT: require('@/assets/images/metals/platinum.png'),
  AUXPD: require('@/assets/images/metals/palladium.png'),
  // AUXM ve USDT için aşağıdaki dosyaları oluştur veya fallback kullanılır
  // AUXM: require('@/assets/images/tokens/auxm.png'),
  // USDT: require('@/assets/images/tokens/usdt.png'),
};

interface Metal {
  symbol: string;
  name: string;
  price: number;
  priceOz: number;
  buyPrice: number;
  sellPrice: number;
  change24h: number;
  color: string;
}

interface TrendData {
  symbol: string;
  buyVolume: number;
  sellVolume: number;
  trend: 'buy' | 'sell' | 'neutral';
  isCrypto?: boolean;
  icon?: string;
  color?: string;
}

export default function TradeScreen() {
  const { showAlert, AlertComponent } = useCustomAlert();
  const colorScheme = useColorScheme();
  const systemIsDark = colorScheme === 'dark';
  const { theme, language, userEmail, userName } = useStore();
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  const insets = useSafeAreaInsets();
  
  // i18n - Centralized translations with fallback
  const { t: tradeT } = useTranslation('trade');
  const t = {
    trending: tradeT.trending || (language === 'en' ? 'Trending' : 'Trend'),
    auxite: tradeT.auxite || 'Auxite',
    crypto: tradeT.crypto || (language === 'en' ? 'Crypto' : 'Kripto'),
    buy: tradeT.buy || (language === 'en' ? 'Buy' : 'Al'),
    sell: tradeT.sell || (language === 'en' ? 'Sell' : 'Sat'),
    buyTrend: tradeT.buyTrend || (language === 'en' ? 'Buy Trend' : 'Alım Trendi'),
    sellTrend: tradeT.sellTrend || (language === 'en' ? 'Sell Trend' : 'Satım Trendi'),
    price: tradeT.price || (language === 'en' ? 'Price' : 'Fiyat'),
    change: tradeT.change || (language === 'en' ? 'Change' : 'Değişim'),
    findMyAssets: tradeT.findMyAssets || (language === 'en' ? 'Find My Assets' : 'Varlıklarımı Bul'),
    physicalAssetsInfo: tradeT.physicalAssetsInfo || (language === 'en' 
      ? 'All tokens in the Auxite ecosystem are backed by physical assets stored in authorized facilities worldwide.' 
      : 'Auxite ekosistemindeki tüm tokenlar, temsil ettikleri metal türüne karşılık gelen fiziksel değer üzerine yapılandırılmıştır.'),
    capacity: tradeT.capacity || (language === 'en' ? 'Capacity' : 'Kapasite'),
    security: tradeT.security || (language === 'en' ? 'Security' : 'Güvenlik'),
    securityProviders: tradeT.securityProviders || (language === 'en' 
      ? 'All facilities are operated by international security companies such as Brinks, Loomis and Malca-Amit.' 
      : 'Tüm tesisler Brinks, Loomis ve Malca-Amit gibi uluslararası güvenlik şirketleri tarafından işletilmektedir.'),
    priceChart: tradeT.priceChart || (language === 'en' ? 'Price Chart' : 'Fiyat Grafiği'),
    info: tradeT.info || (language === 'en' ? 'Info' : 'Bilgi'),
    data: tradeT.data || (language === 'en' ? 'Data' : 'Veri'),
    market: tradeT.market || (language === 'en' ? 'Market' : 'Piyasa'),
    limit: tradeT.limit || 'Limit',
    amount: tradeT.amount || (language === 'en' ? 'Amount' : 'Miktar'),
    total: tradeT.total || (language === 'en' ? 'Total' : 'Toplam'),
    balance: tradeT.balance || (language === 'en' ? 'Balance' : 'Bakiye'),
    spread: tradeT.spread || 'Spread',
    fee: tradeT.fee || (language === 'en' ? 'Fee' : 'Komisyon'),
    buyPrice: tradeT.buyPrice || (language === 'en' ? 'Buy Price' : 'Alış Fiyatı'),
    sellPrice: tradeT.sellPrice || (language === 'en' ? 'Sell Price' : 'Satış Fiyatı'),
    confirmOrder: tradeT.confirmOrder || (language === 'en' ? 'Confirm Order' : 'Siparişi Onayla'),
    processing: tradeT.processing || (language === 'en' ? 'Processing...' : 'İşleniyor...'),
    orderSuccess: tradeT.orderSuccess || (language === 'en' ? 'Order Successful!' : 'Sipariş Başarılı!'),
    insufficientBalance: tradeT.insufficientBalance || (language === 'en' ? 'Insufficient balance' : 'Yetersiz bakiye'),
    gold: tradeT.gold || (language === 'en' ? 'Gold' : 'Altın'),
    silver: tradeT.silver || (language === 'en' ? 'Silver' : 'Gümüş'),
    platinum: tradeT.platinum || (language === 'en' ? 'Platinum' : 'Platin'),
    palladium: tradeT.palladium || (language === 'en' ? 'Palladium' : 'Paladyum'),
    zurich: tradeT.zurich || (language === 'en' ? 'Zurich' : 'Zürih'),
    london: tradeT.london || (language === 'en' ? 'London' : 'Londra'),
    newYork: tradeT.newYork || 'New York',
    singapore: tradeT.singapore || (language === 'en' ? 'Singapore' : 'Singapur'),
    dubai: tradeT.dubai || 'Dubai',
    switzerland: tradeT.switzerland || (language === 'en' ? 'Switzerland' : 'İsviçre'),
    uk: tradeT.uk || (language === 'en' ? 'United Kingdom' : 'İngiltere'),
    usa: tradeT.usa || (language === 'en' ? 'USA' : 'ABD'),
    uae: tradeT.uae || (language === 'en' ? 'UAE' : 'BAE'),
    // Trade Modal translations
    bonusText: language === 'tr' ? 'AUXM ile işlem yap %2 bonus kazan' :
               language === 'de' ? 'Mit AUXM handeln und 2% Bonus verdienen' :
               language === 'fr' ? 'Tradez avec AUXM et gagnez 2% de bonus' :
               language === 'ar' ? 'تداول بـ AUXM واكسب 2% مكافأة' :
               language === 'ru' ? 'Торгуйте с AUXM и получите 2% бонус' : 'Trade with AUXM and earn 2% bonus',
    limitPriceLabel: language === 'tr' ? 'Limit Fiyatı (USD)' :
                     language === 'de' ? 'Limit-Preis (USD)' :
                     language === 'fr' ? 'Prix limite (USD)' :
                     language === 'ar' ? 'السعر المحدد (USD)' :
                     language === 'ru' ? 'Лимитная цена (USD)' : 'Limit Price (USD)',
    perGram: language === 'tr' ? '/gram' :
              language === 'de' ? '/Gramm' :
              language === 'fr' ? '/gramme' :
              language === 'ar' ? '/غرام' :
              language === 'ru' ? '/грамм' : '/gram',
    current: language === 'tr' ? 'Güncel' :
             language === 'de' ? 'Aktuell' :
             language === 'fr' ? 'Actuel' :
             language === 'ar' ? 'الحالي' :
             language === 'ru' ? 'Текущий' : 'Current',
    savings: language === 'tr' ? 'tasarruf' :
             language === 'de' ? 'Ersparnis' :
             language === 'fr' ? 'économie' :
             language === 'ar' ? 'توفير' :
             language === 'ru' ? 'экономия' : 'savings',
    paymentMethod: language === 'tr' ? 'Ödeme Yöntemi' :
                   language === 'de' ? 'Zahlungsmethode' :
                   language === 'fr' ? 'Mode de paiement' :
                   language === 'ar' ? 'طريقة الدفع' :
                   language === 'ru' ? 'Способ оплаты' : 'Payment Method',
    youWillReceive: language === 'tr' ? 'Alacağınız' :
                    language === 'de' ? 'Sie erhalten' :
                    language === 'fr' ? 'Vous recevrez' :
                    language === 'ar' ? 'ستتلقى' :
                    language === 'ru' ? 'Вы получите' : 'You Will Receive',
    youWillPay: language === 'tr' ? 'Ödeyeceğiniz' :
                language === 'de' ? 'Sie zahlen' :
                language === 'fr' ? 'Vous payerez' :
                language === 'ar' ? 'ستدفع' :
                language === 'ru' ? 'Вы заплатите' : 'You Will Pay',
    orderType: language === 'tr' ? 'İşlem Tipi' :
               language === 'de' ? 'Auftragsart' :
               language === 'fr' ? 'Type d\'ordre' :
               language === 'ar' ? 'نوع الأمر' :
               language === 'ru' ? 'Тип ордера' : 'Order Type',
    tradeFee: language === 'tr' ? 'İşlem Ücreti' :
              language === 'de' ? 'Handelsgebühr' :
              language === 'fr' ? 'Frais de transaction' :
              language === 'ar' ? 'رسوم التداول' :
              language === 'ru' ? 'Комиссия' : 'Trade Fee',
    limitOrderInfo: language === 'tr' ? 'Emir, belirlediğiniz fiyata ulaşıldığında otomatik gerçekleşir. İstediğiniz zaman iptal edebilirsiniz.' :
                    language === 'de' ? 'Der Auftrag wird automatisch ausgeführt, wenn der Preis erreicht wird. Sie können jederzeit stornieren.' :
                    language === 'fr' ? 'L\'ordre sera exécuté automatiquement lorsque le prix sera atteint. Vous pouvez annuler à tout moment.' :
                    language === 'ar' ? 'سيتم تنفيذ الأمر تلقائياً عند الوصول للسعر المحدد. يمكنك الإلغاء في أي وقت.' :
                    language === 'ru' ? 'Ордер будет автоматически исполнен при достижении цены. Вы можете отменить в любое время.' : 
                    'Order will execute automatically when price is reached. You can cancel anytime.',
    placeOrder: language === 'tr' ? 'Emir Ver' :
                language === 'de' ? 'Auftrag erteilen' :
                language === 'fr' ? 'Passer l\'ordre' :
                language === 'ar' ? 'تنفيذ الأمر' :
                language === 'ru' ? 'Разместить ордер' : 'Place Order',
    connectWallet: language === 'tr' ? 'Cüzdan Bağlayın' :
                   language === 'de' ? 'Wallet verbinden' :
                   language === 'fr' ? 'Connecter le portefeuille' :
                   language === 'ar' ? 'ربط المحفظة' :
                   language === 'ru' ? 'Подключить кошелек' : 'Connect Wallet',
    error: language === 'tr' ? 'Hata' :
           language === 'de' ? 'Fehler' :
           language === 'fr' ? 'Erreur' :
           language === 'ar' ? 'خطأ' :
           language === 'ru' ? 'Ошибка' : 'Error',
    success: language === 'tr' ? 'Başarılı' :
             language === 'de' ? 'Erfolgreich' :
             language === 'fr' ? 'Succès' :
             language === 'ar' ? 'نجاح' :
             language === 'ru' ? 'Успешно' : 'Success',
    limitOrderCreated: language === 'tr' ? 'Limit emri oluşturuldu' :
                       language === 'de' ? 'Limit-Auftrag erstellt' :
                       language === 'fr' ? 'Ordre limite créé' :
                       language === 'ar' ? 'تم إنشاء أمر محدد' :
                       language === 'ru' ? 'Лимитный ордер создан' : 'Limit order created',
    bought: language === 'tr' ? 'Satın alındı' :
            language === 'de' ? 'Gekauft' :
            language === 'fr' ? 'Acheté' :
            language === 'ar' ? 'تم الشراء' :
            language === 'ru' ? 'Куплено' : 'Bought',
    sold: language === 'tr' ? 'Satıldı' :
          language === 'de' ? 'Verkauft' :
          language === 'fr' ? 'Vendu' :
          language === 'ar' ? 'تم البيع' :
          language === 'ru' ? 'Продано' : 'Sold',
    ok: language === 'tr' ? 'Tamam' :
        language === 'de' ? 'OK' :
        language === 'fr' ? 'OK' :
        language === 'ar' ? 'موافق' :
        language === 'ru' ? 'ОК' : 'OK',
    enterValidPrice: language === 'tr' ? 'Geçerli bir limit fiyatı girin' :
                     language === 'de' ? 'Geben Sie einen gültigen Limit-Preis ein' :
                     language === 'fr' ? 'Entrez un prix limite valide' :
                     language === 'ar' ? 'أدخل سعراً محدداً صالحاً' :
                     language === 'ru' ? 'Введите действительную лимитную цену' : 'Enter a valid limit price',
    connectWalletFirst: language === 'tr' ? 'Lütfen önce cüzdanınızı bağlayın' :
                        language === 'de' ? 'Bitte verbinden Sie zuerst Ihr Wallet' :
                        language === 'fr' ? 'Veuillez d\'abord connecter votre portefeuille' :
                        language === 'ar' ? 'يرجى ربط محفظتك أولاً' :
                        language === 'ru' ? 'Сначала подключите кошелек' : 'Please connect your wallet first',
    orderFailed: language === 'tr' ? 'Emir oluşturulamadı' :
                 language === 'de' ? 'Auftrag fehlgeschlagen' :
                 language === 'fr' ? 'Échec de l\'ordre' :
                 language === 'ar' ? 'فشل الأمر' :
                 language === 'ru' ? 'Ордер не создан' : 'Order failed',
    tradeFailed: language === 'tr' ? 'İşlem başarısız' :
                 language === 'de' ? 'Handel fehlgeschlagen' :
                 language === 'fr' ? 'Transaction échouée' :
                 language === 'ar' ? 'فشلت الصفقة' :
                 language === 'ru' ? 'Сделка не удалась' : 'Trade failed',
    tradeError: language === 'tr' ? 'İşlem sırasında hata oluştu' :
                language === 'de' ? 'Fehler beim Handel' :
                language === 'fr' ? 'Erreur lors de la transaction' :
                language === 'ar' ? 'خطأ أثناء التداول' :
                language === 'ru' ? 'Ошибка при торговле' : 'Error during trade',
    // Modal Tab Labels
    priceTab: language === 'tr' ? 'Fiyat' :
              language === 'de' ? 'Preis' :
              language === 'fr' ? 'Prix' :
              language === 'ar' ? 'السعر' :
              language === 'ru' ? 'Цена' : 'Price',
    infoTab: language === 'tr' ? 'Bilgiler' :
             language === 'de' ? 'Infos' :
             language === 'fr' ? 'Infos' :
             language === 'ar' ? 'معلومات' :
             language === 'ru' ? 'Инфо' : 'Info',
    dataTab: language === 'tr' ? 'İşlem Verileri' :
             language === 'de' ? 'Handelsdaten' :
             language === 'fr' ? 'Données' :
             language === 'ar' ? 'بيانات التداول' :
             language === 'ru' ? 'Данные' : 'Trade Data',
    // Price Stats
    high24h: language === 'tr' ? '24s Yüksek' :
             language === 'de' ? '24h Hoch' :
             language === 'fr' ? '24h Haut' :
             language === 'ar' ? 'أعلى 24س' :
             language === 'ru' ? '24ч Макс' : '24h High',
    low24h: language === 'tr' ? '24s Düşük' :
            language === 'de' ? '24h Tief' :
            language === 'fr' ? '24h Bas' :
            language === 'ar' ? 'أدنى 24س' :
            language === 'ru' ? '24ч Мин' : '24h Low',
    volume24h: language === 'tr' ? '24s Hacim' :
               language === 'de' ? '24h Volumen' :
               language === 'fr' ? 'Volume 24h' :
               language === 'ar' ? 'حجم 24س' :
               language === 'ru' ? 'Объем 24ч' : '24h Volume',
    // Info Tab
    generalInfo: language === 'tr' ? 'Genel Bilgiler' :
                 language === 'de' ? 'Allgemeine Infos' :
                 language === 'fr' ? 'Infos générales' :
                 language === 'ar' ? 'معلومات عامة' :
                 language === 'ru' ? 'Общая информация' : 'General Info',
    symbol: language === 'tr' ? 'Sembol' :
            language === 'de' ? 'Symbol' :
            language === 'fr' ? 'Symbole' :
            language === 'ar' ? 'الرمز' :
            language === 'ru' ? 'Символ' : 'Symbol',
    blockchain: 'Blockchain',
    contract: language === 'tr' ? 'Kontrat' :
              language === 'de' ? 'Vertrag' :
              language === 'fr' ? 'Contrat' :
              language === 'ar' ? 'العقد' :
              language === 'ru' ? 'Контракт' : 'Contract',
    collateral: language === 'tr' ? 'Teminat' :
                language === 'de' ? 'Sicherheit' :
                language === 'fr' ? 'Garantie' :
                language === 'ar' ? 'الضمان' :
                language === 'ru' ? 'Обеспечение' : 'Collateral',
    collateralRatio: language === 'tr' ? 'Teminat Oranı' :
                     language === 'de' ? 'Sicherheitsquote' :
                     language === 'fr' ? 'Ratio de garantie' :
                     language === 'ar' ? 'نسبة الضمان' :
                     language === 'ru' ? 'Коэф. обеспечения' : 'Collateral Ratio',
    custody: language === 'tr' ? 'Saklama' :
             language === 'de' ? 'Verwahrung' :
             language === 'fr' ? 'Garde' :
             language === 'ar' ? 'الحفظ' :
             language === 'ru' ? 'Хранение' : 'Custody',
    auditor: language === 'tr' ? 'Denetçi' :
             language === 'de' ? 'Prüfer' :
             language === 'fr' ? 'Auditeur' :
             language === 'ar' ? 'المدقق' :
             language === 'ru' ? 'Аудитор' : 'Auditor',
    // Data Tab
    trades24h: language === 'tr' ? '24s İşlem' :
               language === 'de' ? '24h Trades' :
               language === 'fr' ? 'Trades 24h' :
               language === 'ar' ? 'صفقات 24س' :
               language === 'ru' ? 'Сделки 24ч' : '24h Trades',
    buySpread: language === 'tr' ? 'Alış Spread' :
               language === 'de' ? 'Kauf-Spread' :
               language === 'fr' ? 'Spread achat' :
               language === 'ar' ? 'سبريد الشراء' :
               language === 'ru' ? 'Спред покупки' : 'Buy Spread',
    sellSpread: language === 'tr' ? 'Satış Spread' :
                language === 'de' ? 'Verkauf-Spread' :
                language === 'fr' ? 'Spread vente' :
                language === 'ar' ? 'سبريد البيع' :
                language === 'ru' ? 'Спред продажи' : 'Sell Spread',
    // Orders
    completed: language === 'tr' ? 'Gerçekleşen' :
               language === 'de' ? 'Ausgeführt' :
               language === 'fr' ? 'Exécutés' :
               language === 'ar' ? 'المنفذة' :
               language === 'ru' ? 'Исполненные' : 'Completed',
    pending: language === 'tr' ? 'Bekleyen' :
             language === 'de' ? 'Ausstehend' :
             language === 'fr' ? 'En attente' :
             language === 'ar' ? 'قيد الانتظار' :
             language === 'ru' ? 'Ожидающие' : 'Pending',
    noOrders: language === 'tr' ? 'Emir yok' :
              language === 'de' ? 'Keine Aufträge' :
              language === 'fr' ? 'Pas d\'ordres' :
              language === 'ar' ? 'لا توجد أوامر' :
              language === 'ru' ? 'Нет ордеров' : 'No orders',
    loadingChart: language === 'tr' ? 'Grafik yükleniyor...' :
                  language === 'de' ? 'Diagramm wird geladen...' :
                  language === 'fr' ? 'Chargement du graphique...' :
                  language === 'ar' ? 'جاري تحميل الرسم البياني...' :
                  language === 'ru' ? 'Загрузка графика...' : 'Loading chart...',
    loadingPrice: language === 'tr' ? 'Fiyat verisi yükleniyor...' :
                  language === 'de' ? 'Preisdaten werden geladen...' :
                  language === 'fr' ? 'Chargement des prix...' :
                  language === 'ar' ? 'جاري تحميل بيانات السعر...' :
                  language === 'ru' ? 'Загрузка цен...' : 'Loading price data...',
    bonus: language === 'tr' ? 'bonus' :
           language === 'de' ? 'Bonus' :
           language === 'fr' ? 'bonus' :
           language === 'ar' ? 'مكافأة' :
           language === 'ru' ? 'бонус' : 'bonus',
    dcaComingSoon: language === 'tr' ? 'Otomatik alım özelliği yakında aktif olacak' :
                   language === 'de' ? 'Sparplan-Funktion kommt bald' :
                   language === 'fr' ? 'Fonctionnalité d\'achat récurrent bientôt disponible' :
                   language === 'ar' ? 'ميزة الشراء التلقائي قريباً' :
                   language === 'ru' ? 'Функция автопокупки скоро будет доступна' : 'Auto-invest feature coming soon',
    // DCA Translations
    dcaTitle: language === 'tr' ? 'Düzenli Alım' :
              language === 'de' ? 'Sparplan' :
              language === 'fr' ? 'Achat Récurrent' :
              language === 'ar' ? 'شراء تلقائي' :
              language === 'ru' ? 'Автопокупка' : 'Auto-Invest',
    dcaDescription: language === 'tr' ? 'Düzenli aralıklarla otomatik alım yaparak fiyat dalgalanmalarından korunun' :
                    language === 'de' ? 'Schützen Sie sich vor Preisschwankungen durch regelmäßige automatische Käufe' :
                    language === 'fr' ? 'Protégez-vous des fluctuations de prix avec des achats automatiques réguliers' :
                    language === 'ar' ? 'احمِ نفسك من تقلبات الأسعار من خلال عمليات الشراء التلقائية المنتظمة' :
                    language === 'ru' ? 'Защитите себя от колебаний цен с помощью регулярных автоматических покупок' : 'Protect yourself from price fluctuations with regular automatic purchases',
    dcaAmount: language === 'tr' ? 'Her Alımda Miktar' :
               language === 'de' ? 'Betrag pro Kauf' :
               language === 'fr' ? 'Montant par achat' :
               language === 'ar' ? 'المبلغ لكل عملية شراء' :
               language === 'ru' ? 'Сумма за покупку' : 'Amount per Purchase',
    dcaFrequency: language === 'tr' ? 'Alım Sıklığı' :
                  language === 'de' ? 'Kaufhäufigkeit' :
                  language === 'fr' ? 'Fréquence d\'achat' :
                  language === 'ar' ? 'تكرار الشراء' :
                  language === 'ru' ? 'Частота покупок' : 'Purchase Frequency',
    dcaDaily: language === 'tr' ? 'Günlük' :
              language === 'de' ? 'Täglich' :
              language === 'fr' ? 'Quotidien' :
              language === 'ar' ? 'يومي' :
              language === 'ru' ? 'Ежедневно' : 'Daily',
    dcaWeekly: language === 'tr' ? 'Haftalık' :
               language === 'de' ? 'Wöchentlich' :
               language === 'fr' ? 'Hebdomadaire' :
               language === 'ar' ? 'أسبوعي' :
               language === 'ru' ? 'Еженедельно' : 'Weekly',
    dcaBiweekly: language === 'tr' ? '2 Haftada Bir' :
                 language === 'de' ? 'Zweiwöchentlich' :
                 language === 'fr' ? 'Bimensuel' :
                 language === 'ar' ? 'كل أسبوعين' :
                 language === 'ru' ? 'Раз в 2 недели' : 'Bi-weekly',
    dcaMonthly: language === 'tr' ? 'Aylık' :
                language === 'de' ? 'Monatlich' :
                language === 'fr' ? 'Mensuel' :
                language === 'ar' ? 'شهري' :
                language === 'ru' ? 'Ежемесячно' : 'Monthly',
    dcaDuration: language === 'tr' ? 'Süre' :
                 language === 'de' ? 'Dauer' :
                 language === 'fr' ? 'Durée' :
                 language === 'ar' ? 'المدة' :
                 language === 'ru' ? 'Длительность' : 'Duration',
    dcaIndefinite: language === 'tr' ? 'Süresiz' :
                   language === 'de' ? 'Unbegrenzt' :
                   language === 'fr' ? 'Indéfini' :
                   language === 'ar' ? 'غير محدد' :
                   language === 'ru' ? 'Бессрочно' : 'Indefinite',
    dca3Months: language === 'tr' ? '3 Ay' :
                language === 'de' ? '3 Monate' :
                language === 'fr' ? '3 Mois' :
                language === 'ar' ? '3 أشهر' :
                language === 'ru' ? '3 месяца' : '3 Months',
    dca6Months: language === 'tr' ? '6 Ay' :
                language === 'de' ? '6 Monate' :
                language === 'fr' ? '6 Mois' :
                language === 'ar' ? '6 أشهر' :
                language === 'ru' ? '6 месяцев' : '6 Months',
    dca1Year: language === 'tr' ? '1 Yıl' :
              language === 'de' ? '1 Jahr' :
              language === 'fr' ? '1 An' :
              language === 'ar' ? 'سنة واحدة' :
              language === 'ru' ? '1 год' : '1 Year',
    dcaSummary: language === 'tr' ? 'Plan Özeti' :
                language === 'de' ? 'Planübersicht' :
                language === 'fr' ? 'Résumé du plan' :
                language === 'ar' ? 'ملخص الخطة' :
                language === 'ru' ? 'Сводка плана' : 'Plan Summary',
    dcaTotalInvestment: language === 'tr' ? 'Toplam Yatırım' :
                        language === 'de' ? 'Gesamtinvestition' :
                        language === 'fr' ? 'Investissement total' :
                        language === 'ar' ? 'إجمالي الاستثمار' :
                        language === 'ru' ? 'Общая сумма инвестиций' : 'Total Investment',
    dcaNumPurchases: language === 'tr' ? 'Alım Sayısı' :
                     language === 'de' ? 'Anzahl der Käufe' :
                     language === 'fr' ? 'Nombre d\'achats' :
                     language === 'ar' ? 'عدد عمليات الشراء' :
                     language === 'ru' ? 'Количество покупок' : 'Number of Purchases',
    dcaStartPlan: language === 'tr' ? 'Planı Başlat' :
                  language === 'de' ? 'Sparplan starten' :
                  language === 'fr' ? 'Démarrer le plan' :
                  language === 'ar' ? 'بدء الخطة' :
                  language === 'ru' ? 'Начать план' : 'Start Plan',
    dcaPlanCreated: language === 'tr' ? 'Düzenli alım planınız oluşturuldu!' :
                    language === 'de' ? 'Ihr Sparplan wurde erstellt!' :
                    language === 'fr' ? 'Votre plan d\'achat récurrent a été créé!' :
                    language === 'ar' ? 'تم إنشاء خطة الشراء التلقائي!' :
                    language === 'ru' ? 'Ваш план автопокупки создан!' : 'Your auto-invest plan has been created!',
    dcaNextPurchase: language === 'tr' ? 'İlk alım' :
                     language === 'de' ? 'Erster Kauf' :
                     language === 'fr' ? 'Premier achat' :
                     language === 'ar' ? 'أول عملية شراء' :
                     language === 'ru' ? 'Первая покупка' : 'First purchase',
    dcaEnterAmount: language === 'tr' ? 'Lütfen geçerli bir miktar girin' :
                    language === 'de' ? 'Bitte geben Sie einen gültigen Betrag ein' :
                    language === 'fr' ? 'Veuillez entrer un montant valide' :
                    language === 'ar' ? 'يرجى إدخال مبلغ صالح' :
                    language === 'ru' ? 'Пожалуйста, введите корректную сумму' : 'Please enter a valid amount',
    dcaMinAmount: language === 'tr' ? 'Minimum $10 gerekli' :
                  language === 'de' ? 'Minimum $10 erforderlich' :
                  language === 'fr' ? 'Minimum 10$ requis' :
                  language === 'ar' ? 'الحد الأدنى 10$ مطلوب' :
                  language === 'ru' ? 'Минимум $10' : 'Minimum $10 required',
    dcaButtonLabel: language === 'tr' ? 'Düzenli' :
                    language === 'de' ? 'Sparplan' :
                    language === 'fr' ? 'Récurrent' :
                    language === 'ar' ? 'تلقائي' :
                    language === 'ru' ? 'Авто' : 'Auto',
    bonus: 'Bonus',
    buyNow: language === 'tr' ? 'Satın Al' :
            language === 'de' ? 'Kaufen' :
            language === 'fr' ? 'Acheter' :
            language === 'ar' ? 'شراء' :
            language === 'ru' ? 'Купить' : 'Buy',
    sellNow: language === 'tr' ? 'Sat' :
             language === 'de' ? 'Verkaufen' :
             language === 'fr' ? 'Vendre' :
             language === 'ar' ? 'بيع' :
             language === 'ru' ? 'Продать' : 'Sell',
    recurringBuy: language === 'tr' ? 'Otomatik Alım (DCA)' :
                  language === 'de' ? 'Wiederkehrender Kauf (DCA)' :
                  language === 'fr' ? 'Achat Récurrent (DCA)' :
                  language === 'ar' ? 'الشراء المتكرر (DCA)' :
                  language === 'ru' ? 'Регулярная Покупка (DCA)' : 'Recurring Buy (DCA)',
    recurringBuyDesc: language === 'tr' ? 'Düzenli aralıklarla otomatik yatırım yapın' :
                      language === 'de' ? 'Automatische Investitionen in regelmäßigen Abständen' :
                      language === 'fr' ? 'Investissez automatiquement à intervalles réguliers' :
                      language === 'ar' ? 'استثمر تلقائياً على فترات منتظمة' :
                      language === 'ru' ? 'Автоматические инвестиции через регулярные промежутки' : 'Automate your investments at regular intervals',
  };
  
  const [selectedMetal, setSelectedMetal] = useState<Metal | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [allocationModalVisible, setAllocationModalVisible] = useState(false);
  const [tradeModalVisible, setTradeModalVisible] = useState(false);
  const [tradeMode, setTradeMode] = useState<'buy' | 'sell'>('buy');
  const [spread, setSpread] = useState({ buy: 1.5, sell: 1.5 });
  
  // Trade Modal State
  const [tradeAmount, setTradeAmount] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('AUXM');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [limitPrice, setLimitPrice] = useState('');
  const [tradePreview, setTradePreview] = useState<TradePreview | null>(null);
  
  // Modal Tab State
  const [modalTab, setModalTab] = useState<'price' | 'info' | 'data'>('price');
  
  // Orders State (mock data)
  const [completedOrders] = useState([
    { id: '1', type: 'buy' as const, amount: 0.5, price: 138.50, total: 69.25, date: '17.12 14:30' },
    { id: '2', type: 'sell' as const, amount: 0.25, price: 139.20, total: 34.80, date: '17.12 12:15' },
    { id: '3', type: 'buy' as const, amount: 1.0, price: 137.80, total: 137.80, date: '16.12 18:45' },
  ]);
  
  const [pendingOrders, setPendingOrders] = useState([
    { id: '4', type: 'buy' as const, amount: 0.5, price: 135.00, total: 67.50, date: '17.12 15:00' },
    { id: '5', type: 'sell' as const, amount: 1.0, price: 145.00, total: 145.00, date: '17.12 15:30' },
  ]);

  // DCA State
  const [dcaModalVisible, setDcaModalVisible] = useState(false);
  
  // Allocation Warning State
  const [showAllocationWarning, setShowAllocationWarning] = useState(false);
  const [allocationPreview, setAllocationPreview] = useState<{
    totalGrams: number;
    allocatedGrams: number;
    nonAllocatedGrams: number;
    hasPartialAllocation: boolean;
    suggestion?: { gramsToAdd: number; auxmToAdd: number; targetGrams: number; };
  } | null>(null);
  
  // Quote System State
  const [quote, setQuote] = useState<Quote | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [showQuoteConfirm, setShowQuoteConfirm] = useState(false);
  
  // Allocation bypass ref - state async olduğu için ref kullanıyoruz
  const allocationBypassRef = useRef(false);
  const [dcaAmount, setDcaAmount] = useState('');
  const [dcaFrequency, setDcaFrequency] = useState<'daily' | 'weekly' | 'biweekly' | 'monthly'>('weekly');
  const [dcaDuration, setDcaDuration] = useState<'indefinite' | '3months' | '6months' | '1year'>('indefinite');
  const [dcaCurrency, setDcaCurrency] = useState('AUXM');
  
  // Balance store - gerçek API'den
  const { 
    balance, 
    address, 
    isTrading, 
    fetchBalance, 
    executeBuy, 
    executeSell, 
    createOrder 
  } = useBalanceStore();

  // ✅ Sync wallet address from useStore to useBalanceStore
  const { walletAddress: storeWalletAddress } = useStore();
  const { setAddress } = useBalanceStore();
  
  useEffect(() => {
    if (storeWalletAddress && !address) {
      setAddress(storeWalletAddress);
    }
  }, [storeWalletAddress, address, setAddress]);

  // Computed balances for UI
  const balances = {
    auxm: balance?.auxm || 0,
    bonusAuxm: balance?.bonusAuxm || 0,
    eth: balance?.eth || 0,
    usdt: balance?.usdt || 0,
    btc: balance?.btc || 0,
    xrp: balance?.xrp || 0,
    sol: balance?.sol || 0,
    auxg: balance?.auxg || 0,
    auxs: balance?.auxs || 0,
    auxpt: balance?.auxpt || 0,
    auxpd: balance?.auxpd || 0,
  };
  
  // Debug log for balance
  useEffect(() => {
    console.log('🔷 Trade Modal - Balance from store:', { 
      address, 
      storeWalletAddress,
      eth: balance?.eth, 
      auxm: balance?.auxm,
      rawBalance: balance 
    });
  }, [balance, address, storeWalletAddress]);

  // Trending assets state - metals + crypto based on activity
  const [trendingAssets, setTrendingAssets] = useState<TrendData[]>([
    { symbol: 'AUXG', buyVolume: 65, sellVolume: 35, trend: 'buy', isCrypto: false, color: '#EAB308' },
    { symbol: 'AUXS', buyVolume: 45, sellVolume: 55, trend: 'sell', isCrypto: false, color: '#94A3B8' },
    { symbol: 'BTC', buyVolume: 72, sellVolume: 28, trend: 'buy', isCrypto: true, icon: '₿', color: '#F7931A' },
  ]);

  const [metals, setMetals] = useState<Metal[]>([
    { symbol: 'AUXG', name: 'Gold', price: 0, priceOz: 0, buyPrice: 0, sellPrice: 0, change24h: 0, color: '#EAB308' },
    { symbol: 'AUXS', name: 'Silver', price: 0, priceOz: 0, buyPrice: 0, sellPrice: 0, change24h: 0, color: '#94A3B8' },
    { symbol: 'AUXPT', name: 'Platinum', price: 0, priceOz: 0, buyPrice: 0, sellPrice: 0, change24h: 0, color: '#E2E8F0' },
    { symbol: 'AUXPD', name: 'Palladium', price: 0, priceOz: 0, buyPrice: 0, sellPrice: 0, change24h: 0, color: '#64748B' },
    { symbol: 'AUXM', name: 'Auxite Para', price: 1.00, priceOz: 31.1035, buyPrice: 1.00, sellPrice: 1.00, change24h: 0, color: '#A855F7' },
  ]);

  // Crypto Assets
  const [cryptos, setCryptos] = useState([
    { symbol: 'BTC', name: 'Bitcoin', price: 0, change24h: 0, color: '#F7931A', icon: '₿' },
    { symbol: 'ETH', name: 'Ethereum', price: 0, change24h: 0, color: '#627EEA', icon: 'Ξ' },
    { symbol: 'XRP', name: 'Ripple', price: 0, change24h: 0, color: '#00A3E0', icon: '✕' },
    { symbol: 'SOL', name: 'Solana', price: 0, change24h: 0, color: '#9945FF', icon: '◎' },
    { symbol: 'USDT', name: 'Tether', price: 1.00, change24h: 0, color: '#26A17B', icon: '₮' },
  ]);

  const fetchPrices = async () => {
    try {
      const priceRes = await fetch(`${API_URL}/api/metals`);
      const priceData = await priceRes.json();

      if (priceData.ok && priceData.data) {
        // ✅ DÜZELTME: Her metal için ayrı spread config
        let spreadConfig: Record<string, { buy: number; sell: number }> = {
          gold: { buy: 1.5, sell: 1.5 },
          silver: { buy: 2.0, sell: 2.0 },
          platinum: { buy: 2.0, sell: 2.0 },
          palladium: { buy: 2.5, sell: 2.5 },
        };
        
        try {
          const spreadRes = await fetch(`${API_URL}/api/admin/spread`);
          const spreadData = await spreadRes.json();
          
          // ✅ API response: { success: true, config: { metals: { gold: { buy, sell }, ... } } }
          if (spreadData.success && spreadData.config?.metals) {
          console.log("📊 Spread API response:", JSON.stringify(spreadData));
            spreadConfig = spreadData.config.metals;
          } else if (spreadData.config?.metals) {
            spreadConfig = spreadData.config.metals;
          }
          
          // Default spread state for display (gold kullan)
          setSpread(spreadConfig.gold || { buy: 1.5, sell: 1.5 });
        } catch (e) {
          console.log('Spread fetch warning:', e);
        }

        let changes: Record<string, number> = {};
        try {
          const metalsRes = await fetch(`${API_URL}/api/metals`);
          const metalsData = await metalsRes.json();
          if (metalsData.ok && metalsData.changes) {
            changes = metalsData.changes;
          }
        } catch (e) {}

        // ✅ DÜZELTME: Her metal için kendi spread'ini kullan
        const symbolToSpreadKey: Record<string, string> = {
          'AUXG': 'gold',
          'AUXS': 'silver',
          'AUXPT': 'platinum',
          'AUXPD': 'palladium',
        };

        setMetals(prev => prev.map(m => {
          const info = priceData.data.find((d: any) => d.symbol === m.symbol);
          if (info && info.priceOz) {
            const priceOz = info.priceOz;
            const priceGram = priceOz / TROY_OZ_TO_GRAM;
            
            // ✅ Metal'e özel spread kullan
            const spreadKey = symbolToSpreadKey[m.symbol];
            const metalSpread = spreadKey ? spreadConfig[spreadKey] : { buy: 1.5, sell: 1.5 };
            
            const buyPrice = priceGram * (1 + metalSpread.buy / 100);
            const sellPrice = priceGram * (1 - metalSpread.sell / 100);
            
            return { 
              ...m, 
              priceOz: priceOz,
              price: priceGram,
              buyPrice: buyPrice,
              sellPrice: sellPrice,
              change24h: changes[m.symbol] || 0 
            };
          }
          // AUXM için özel işlem - API'de yoksa sabit kal
          if (m.symbol === 'AUXM') {
            return { ...m, change24h: changes[m.symbol] || 0 };
          }
          return m;
        }));
      }

      // Fetch crypto prices
      try {
        const cryptoRes = await fetch(`${API_URL}/api/crypto`);
        const cryptoData = await cryptoRes.json();
        const cryptoMap: Record<string, string> = { BTC: 'bitcoin', ETH: 'ethereum', XRP: 'ripple', SOL: 'solana' };
        
        setCryptos(prev => prev.map(c => {
          const apiKey = cryptoMap[c.symbol];
          if (apiKey && cryptoData[apiKey]) {
            return { 
              ...c, 
              price: cryptoData[apiKey].usd, 
              change24h: cryptoData[apiKey].usd_24h_change || 0 
            };
          }
          return c;
        }));
      } catch (e) {
        console.error('Crypto fetch error:', e);
      }
    } catch (error) {
      console.error('Price fetch error:', error);
    }
  };

  // Fetch trending data
  const fetchTrends = async () => {
    try {
      const res = await fetch(`${API_URL}/api/trends`);
      const data = await res.json();
      if (data.ok && data.trends) {
        // Metal trends'i al ve crypto ekle
        const metalTrends = data.trends.slice(0, 2).map((t: any) => ({
          ...t,
          isCrypto: false,
          color: metals.find(m => m.symbol === t.symbol)?.color || '#EAB308'
        }));
        
        // BTC trend'i API'den veya varsayılan
        const btcTrend = data.cryptoTrends?.find((t: any) => t.symbol === 'BTC') || {
          symbol: 'BTC',
          buyVolume: 72,
          sellVolume: 28,
          trend: 'buy'
        };
        
        setTrendingAssets([
          ...metalTrends,
          { ...btcTrend, isCrypto: true, icon: '₿', color: '#F7931A' }
        ]);
      }
    } catch (e) {
      // Keep default trending data
    }
  };

  useEffect(() => {
    fetchPrices();
    fetchTrends();
    
    // Fetch balance if address exists
    if (address) {
      fetchBalance();
    }
    
    const priceInterval = setInterval(fetchPrices, 5000);  // 5 saniye - trade için kritik
    
    // Quote countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 0) return 0;
        if (prev === 1) {
          setQuote(null);
          setShowQuoteConfirm(false);
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      clearInterval(priceInterval);
      clearInterval(countdownInterval);
    };
    const trendInterval = setInterval(fetchTrends, 60000); // 60 saniye
    return () => {
      clearInterval(priceInterval);
      clearInterval(trendInterval);
    };
  }, [address]);

  const formatPrice = (price: number) => {
    // Large crypto prices (BTC, ETH etc.) - no decimals, with comma formatting
    if (price >= 1000) return '$' + Math.round(price).toLocaleString('en-US');
    // Medium prices with 2 decimals
    if (price >= 1) return '$' + price.toFixed(2);
    // Small prices with 4 decimals
    if (price > 0) return '$' + price.toFixed(4);
    return '$0.00';
  };

  const formatChange = (change: number) => {
    const prefix = change >= 0 ? '+' : '';
    return prefix + change.toFixed(2) + '%';
  };

  const getPriceColor = (change: number) => {
    if (change > 0) return '#10b981';
    if (change < 0) return '#ef4444';
    return isDark ? '#fff' : '#0f172a';
  };

  const openTradeModal = (metal: Metal) => {
    setSelectedMetal(metal);
    setModalTab('price');
    setModalVisible(true);
    // Refresh balance when modal opens
    fetchBalance();
  };

  // currentSelectedMetal'i metals array'inden güncel tut
  const currentSelectedMetal = selectedMetal 
    ? metals.find(m => m.symbol === selectedMetal.symbol) || selectedMetal
    : null;

  const getMetalBySymbol = (symbol: string) => metals.find(m => m.symbol === symbol);

  // Kripto fiyatını al
  const getCryptoPrice = (symbol: string): number => {
    if (symbol === 'AUXM' || symbol === 'USD') return 1;
    if (symbol === 'USDT') return 1;
    const crypto = cryptos.find(c => c.symbol === symbol);
    return crypto?.price || 1;
  };

  // Metal miktarını kripto karşılığına çevir
  const calculateCryptoAmount = (metalGrams: number, metalPriceUSD: number, cryptoSymbol: string): number => {
    const metalValueUSD = metalGrams * metalPriceUSD;
    const cryptoPrice = getCryptoPrice(cryptoSymbol);
    if (cryptoSymbol === 'AUXM' || cryptoSymbol === 'USD' || cryptoSymbol === 'USDT') {
      return metalValueUSD; // USD bazlı tokenlar için direkt USD değeri
    }
    return metalValueUSD / cryptoPrice; // ETH, BTC vb için kripto miktarı
  };

  // Kripto miktarını metal gramına çevir
  const calculateMetalFromCrypto = (cryptoAmount: number, metalPriceUSD: number, cryptoSymbol: string): number => {
    const cryptoPrice = getCryptoPrice(cryptoSymbol);
    const usdValue = cryptoAmount * cryptoPrice;
    return usdValue / metalPriceUSD;
  };

  const getAdvancedChartHtml = (metal: Metal) => {
    const bgColor = isDark ? '#0f172a' : '#ffffff';
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? '#1e293b' : '#f1f5f9';
    const borderColor = isDark ? '#1e293b' : '#e2e8f0';
    const upColor = '#10b981';
    const downColor = '#ef4444';
    
    const currentPrice = metal.price > 0 ? metal.price : 1;
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <script src="https://unpkg.com/lightweight-charts@4.1.0/dist/lightweight-charts.standalone.production.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: ${bgColor}; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
    .container { display: flex; flex-direction: column; height: 100%; }
    .controls { display: flex; gap: 4px; padding: 8px; background: ${bgColor}; border-bottom: 1px solid ${borderColor}; }
    .tf-btn { padding: 6px 10px; border: none; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; }
    .tf-btn.active { background: ${upColor}; color: white; }
    .tf-btn:not(.active) { background: ${isDark ? '#1e293b' : '#f1f5f9'}; color: ${textColor}; }
    .chart-container { flex: 1; min-height: 200px; }
    .panel-container { height: 80px; border-top: 1px solid ${borderColor}; }
    .panel-header { display: flex; justify-content: space-between; align-items: center; padding: 4px 8px; background: ${bgColor}; }
    .panel-label { font-size: 10px; color: ${textColor}; }
    .indicators { display: flex; gap: 4px; padding: 6px 8px; background: ${bgColor}; border-top: 1px solid ${borderColor}; flex-wrap: wrap; }
    .ind-group { display: flex; gap: 4px; align-items: center; }
    .ind-label { font-size: 9px; color: ${textColor}; margin-right: 4px; }
    .ind-btn { padding: 4px 8px; border: none; border-radius: 4px; font-size: 10px; font-weight: 500; cursor: pointer; }
    .ind-btn.overlay.active { background: #3b82f6; color: white; }
    .ind-btn.panel.active { background: ${upColor}; color: white; }
    .ind-btn:not(.active) { background: ${isDark ? '#1e293b' : '#f1f5f9'}; color: ${textColor}; }
  </style>
</head>
<body>
  <div class="container">
    <div class="controls" id="timeframeControls">
      <button class="tf-btn" data-tf="15">15m</button>
      <button class="tf-btn active" data-tf="60">1H</button>
      <button class="tf-btn" data-tf="240">4H</button>
      <button class="tf-btn" data-tf="1440">1D</button>
      <button class="tf-btn" data-tf="10080">1W</button>
    </div>
    <div id="mainChart" class="chart-container"></div>
    <div class="panel-header">
      <span class="panel-label" id="panelLabel">Volume</span>
    </div>
    <div id="panelChart" class="panel-container"></div>
    <div class="indicators">
      <div class="ind-group">
        <span class="ind-label">Overlay:</span>
        <button class="ind-btn overlay" data-ind="MA">MA</button>
        <button class="ind-btn overlay" data-ind="EMA">EMA</button>
        <button class="ind-btn overlay" data-ind="BOLL">BOLL</button>
      </div>
      <div class="ind-group">
        <span class="ind-label">Panel:</span>
        <button class="ind-btn panel active" data-ind="VOL">VOL</button>
        <button class="ind-btn panel" data-ind="RSI">RSI</button>
        <button class="ind-btn panel" data-ind="MACD">MACD</button>
      </div>
    </div>
  </div>
  <script>
    const bgColor = '${bgColor}';
    const textColor = '${textColor}';
    const gridColor = '${gridColor}';
    const borderColor = '${borderColor}';
    const upColor = '${upColor}';
    const downColor = '${downColor}';
    const currentPrice = ${currentPrice};

    function hashString(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash = hash & hash;
      }
      return Math.abs(hash);
    }

    function seededRandom(seed) {
      return function() {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
      };
    }

    function generateData(tf, price) {
      const seed = hashString('${metal.symbol}-' + tf + '-v3');
      const random = seededRandom(seed);
      const now = Math.floor(Date.now() / 1000);
      const intervals = { 15: 900, 60: 3600, 240: 14400, 1440: 86400, 10080: 604800 };
      const interval = intervals[tf] || 3600;
      const count = 100;
      const decimals = price >= 10 ? 2 : 4;
      
      const rawData = [];
      let p = 100;
      for (let i = count; i >= 0; i--) {
        const vol = 0.015;
        const change = (random() - 0.48) * vol;
        const open = p;
        const close = open * (1 + change);
        const high = Math.max(open, close) * (1 + random() * vol * 0.5);
        const low = Math.min(open, close) * (1 - random() * vol * 0.5);
        rawData.push({ open, high, low, close });
        p = close;
      }
      
      const lastClose = rawData[rawData.length - 1].close;
      const scale = price / lastClose;
      
      const data = [];
      for (let i = 0; i <= count; i++) {
        const time = now - (count - i) * interval;
        const r = rawData[i];
        data.push({
          time,
          open: parseFloat((r.open * scale).toFixed(decimals)),
          high: parseFloat((r.high * scale).toFixed(decimals)),
          low: parseFloat((r.low * scale).toFixed(decimals)),
          close: parseFloat((r.close * scale).toFixed(decimals)),
          volume: random() * 1000000
        });
      }
      
      if (data.length > 0) {
        const last = data[data.length - 1];
        last.close = parseFloat(price.toFixed(decimals));
        last.high = Math.max(last.high, last.close);
        last.low = Math.min(last.low, last.close);
      }
      
      return data;
    }

    let mainChart, panelChart, candleSeries, volumeSeries;
    let overlays = new Map();
    let panelSeries = new Map();
    let currentTf = 60;
    let activeOverlays = [];
    let activePanel = 'VOL';
    let chartData = [];

    function createCharts() {
      const mainContainer = document.getElementById('mainChart');
      const panelContainer = document.getElementById('panelChart');
      
      mainChart = LightweightCharts.createChart(mainContainer, {
        width: mainContainer.clientWidth,
        height: mainContainer.clientHeight,
        layout: { background: { type: 'solid', color: bgColor }, textColor: textColor, attributionLogo: false },
        grid: { vertLines: { color: gridColor }, horzLines: { color: gridColor } },
        crosshair: { mode: 0 },
        rightPriceScale: { borderColor: borderColor },
        timeScale: { borderColor: borderColor, timeVisible: true }
      });

      candleSeries = mainChart.addCandlestickSeries({
        upColor: upColor, downColor: downColor,
        borderUpColor: upColor, borderDownColor: downColor,
        wickUpColor: upColor, wickDownColor: downColor
      });

      volumeSeries = mainChart.addHistogramSeries({
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume'
      });
      mainChart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

      panelChart = LightweightCharts.createChart(panelContainer, {
        width: panelContainer.clientWidth,
        height: panelContainer.clientHeight,
        layout: { background: { type: 'solid', color: bgColor }, textColor: textColor, attributionLogo: false },
        grid: { vertLines: { color: gridColor }, horzLines: { color: gridColor } },
        rightPriceScale: { borderColor: borderColor },
        timeScale: { visible: false }
      });

      mainChart.timeScale().subscribeVisibleLogicalRangeChange(range => {
        if (range) panelChart.timeScale().setVisibleLogicalRange(range);
      });

      updateData();
    }

    function updateData() {
      chartData = generateData(currentTf, currentPrice);
      candleSeries.setData(chartData);
      volumeSeries.setData(chartData.map(d => ({
        time: d.time,
        value: d.volume,
        color: d.close >= d.open ? upColor + '50' : downColor + '50'
      })));
      mainChart.timeScale().fitContent();
      updateOverlays();
      updatePanel();
    }

    function calculateMA(data, period) {
      const result = [];
      for (let i = period - 1; i < data.length; i++) {
        let sum = 0;
        for (let j = 0; j < period; j++) sum += data[i - j].close;
        result.push({ time: data[i].time, value: sum / period });
      }
      return result;
    }

    function calculateEMA(data, period) {
      const result = [];
      const k = 2 / (period + 1);
      let ema = data[0].close;
      for (let i = 0; i < data.length; i++) {
        ema = data[i].close * k + ema * (1 - k);
        result.push({ time: data[i].time, value: ema });
      }
      return result;
    }

    function calculateBollinger(data, period = 20) {
      const ma = calculateMA(data, period);
      const upper = [], lower = [];
      for (let i = period - 1; i < data.length; i++) {
        const slice = data.slice(i - period + 1, i + 1);
        const mean = ma[i - period + 1]?.value || data[i].close;
        const variance = slice.reduce((acc, c) => acc + Math.pow(c.close - mean, 2), 0) / period;
        const std = Math.sqrt(variance);
        upper.push({ time: data[i].time, value: mean + 2 * std });
        lower.push({ time: data[i].time, value: mean - 2 * std });
      }
      return { upper, middle: ma, lower };
    }

    function calculateRSI(data, period = 14) {
      const result = [];
      for (let i = 0; i < data.length; i++) {
        if (i < period) { result.push({ time: data[i].time, value: 50 }); continue; }
        let gains = 0, losses = 0;
        for (let j = i - period; j < i; j++) {
          const change = data[j + 1].close - data[j].close;
          if (change > 0) gains += change; else losses -= change;
        }
        const rs = (gains / period) / ((losses / period) || 0.001);
        result.push({ time: data[i].time, value: 100 - (100 / (1 + rs)) });
      }
      return result;
    }

    function calculateMACD(data) {
      let ema12 = data[0].close, ema26 = data[0].close;
      const macd = [], signal = [], histogram = [];
      const macdVals = [];
      for (let i = 0; i < data.length; i++) {
        ema12 = (data[i].close * 2) / 13 + ema12 * 11 / 13;
        ema26 = (data[i].close * 2) / 27 + ema26 * 25 / 27;
        const m = ema12 - ema26;
        macdVals.push(m);
        macd.push({ time: data[i].time, value: m });
      }
      let sigEma = macdVals[0];
      for (let i = 0; i < macdVals.length; i++) {
        sigEma = (macdVals[i] * 2) / 10 + sigEma * 8 / 10;
        signal.push({ time: chartData[i].time, value: sigEma });
        const h = macdVals[i] - sigEma;
        histogram.push({ time: chartData[i].time, value: h, color: h >= 0 ? upColor + '99' : downColor + '99' });
      }
      return { macd, signal, histogram };
    }

    function updateOverlays() {
      overlays.forEach(s => { try { mainChart.removeSeries(s); } catch(e) {} });
      overlays.clear();

      if (activeOverlays.includes('MA')) {
        const ma7 = calculateMA(chartData, 7);
        const ma25 = calculateMA(chartData, 25);
        const s7 = mainChart.addLineSeries({ color: '#f59e0b', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
        s7.setData(ma7);
        overlays.set('ma7', s7);
        const s25 = mainChart.addLineSeries({ color: '#3b82f6', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
        s25.setData(ma25);
        overlays.set('ma25', s25);
      }

      if (activeOverlays.includes('EMA')) {
        const ema12 = calculateEMA(chartData, 12);
        const ema26 = calculateEMA(chartData, 26);
        const s12 = mainChart.addLineSeries({ color: '#06b6d4', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
        s12.setData(ema12);
        overlays.set('ema12', s12);
        const s26 = mainChart.addLineSeries({ color: '#a855f7', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
        s26.setData(ema26);
        overlays.set('ema26', s26);
      }

      if (activeOverlays.includes('BOLL')) {
        const boll = calculateBollinger(chartData);
        const su = mainChart.addLineSeries({ color: upColor + '80', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
        su.setData(boll.upper);
        overlays.set('bollU', su);
        const sm = mainChart.addLineSeries({ color: '#9ca3af80', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
        sm.setData(boll.middle);
        overlays.set('bollM', sm);
        const sl = mainChart.addLineSeries({ color: downColor + '80', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
        sl.setData(boll.lower);
        overlays.set('bollL', sl);
      }
    }

    function updatePanel() {
      panelSeries.forEach(s => { try { panelChart.removeSeries(s); } catch(e) {} });
      panelSeries.clear();
      document.getElementById('panelLabel').textContent = activePanel === 'VOL' ? 'Volume' : activePanel === 'RSI' ? 'RSI (14)' : 'MACD';

      if (activePanel === 'VOL') {
        const vs = panelChart.addHistogramSeries({ priceFormat: { type: 'volume' } });
        vs.setData(chartData.map(d => ({ time: d.time, value: d.volume, color: d.close >= d.open ? upColor + '99' : downColor + '99' })));
        panelSeries.set('vol', vs);
      } else if (activePanel === 'RSI') {
        const rsi = calculateRSI(chartData);
        const rs = panelChart.addLineSeries({ color: '#a855f7', lineWidth: 2, priceLineVisible: false });
        rs.setData(rsi);
        panelSeries.set('rsi', rs);
      } else if (activePanel === 'MACD') {
        const macd = calculateMACD(chartData);
        const hs = panelChart.addHistogramSeries({ priceFormat: { type: 'price' } });
        hs.setData(macd.histogram);
        panelSeries.set('macdH', hs);
        const ms = panelChart.addLineSeries({ color: '#3b82f6', lineWidth: 1, priceLineVisible: false });
        ms.setData(macd.macd);
        panelSeries.set('macdL', ms);
        const ss = panelChart.addLineSeries({ color: '#f59e0b', lineWidth: 1, priceLineVisible: false });
        ss.setData(macd.signal);
        panelSeries.set('macdS', ss);
      }
      panelChart.timeScale().fitContent();
    }

    document.getElementById('timeframeControls').addEventListener('click', e => {
      if (e.target.classList.contains('tf-btn')) {
        document.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentTf = parseInt(e.target.dataset.tf);
        updateData();
      }
    });

    document.querySelector('.indicators').addEventListener('click', e => {
      if (e.target.classList.contains('ind-btn')) {
        const ind = e.target.dataset.ind;
        if (e.target.classList.contains('overlay')) {
          e.target.classList.toggle('active');
          if (activeOverlays.includes(ind)) {
            activeOverlays = activeOverlays.filter(i => i !== ind);
          } else {
            activeOverlays.push(ind);
          }
          updateOverlays();
        } else if (e.target.classList.contains('panel')) {
          document.querySelectorAll('.ind-btn.panel').forEach(b => b.classList.remove('active'));
          e.target.classList.add('active');
          activePanel = ind;
          updatePanel();
        }
      }
    });

    window.addEventListener('resize', () => {
      const mc = document.getElementById('mainChart');
      const pc = document.getElementById('panelChart');
      mainChart.applyOptions({ width: mc.clientWidth, height: mc.clientHeight });
      panelChart.applyOptions({ width: pc.clientWidth, height: pc.clientHeight });
    });

    createCharts();
  </script>
</body>
</html>`;
  };

  // Banner Component
  const Banner = () => (
    <TouchableOpacity activeOpacity={0.9} style={styles.bannerContainer}>
      <LinearGradient
        colors={isDark ? ['#1e293b', '#334155'] : ['#f1f5f9', '#e2e8f0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.banner}
      >
        <View style={styles.bannerContent}>
          <View style={styles.bannerTextContainer}>
            <Text style={[styles.bannerTitle, { color: isDark ? '#fff' : '#0f172a' }]}>
              🎉 Welcome to Auxite
            </Text>
            <Text style={[styles.bannerSubtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              Trade precious metals with ease
            </Text>
          </View>
          <View style={[styles.bannerBadge, { backgroundColor: '#10b981' }]}>
            <Text style={styles.bannerBadgeText}>NEW</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  // Trending Card Component - Metal & Crypto
  const TrendingCard = ({ trend }: { trend: TrendData }) => {
    const isCrypto = trend.isCrypto || false;
    
    // Metal veya crypto bilgilerini al
    const metal = !isCrypto ? getMetalBySymbol(trend.symbol) : null;
    const crypto = isCrypto ? cryptos.find(c => c.symbol === trend.symbol) : null;
    
    if (!metal && !crypto) return null;

    const isBuyTrend = trend.trend === 'buy';
    const trendColor = isBuyTrend ? '#10b981' : '#ef4444';
    const trendIcon = isBuyTrend ? 'trending-up' : 'trending-down';
    const trendLabel = isBuyTrend ? 'Buying' : 'Selling';
    
    const assetColor = trend.color || (metal?.color || crypto?.color || '#10b981');
    const assetName = metal?.name || crypto?.name || '';
    const assetPrice = metal?.price || crypto?.price || 0;
    const assetChange = metal?.change24h || crypto?.change24h || 0;

    const handlePress = () => {
      if (isCrypto) {
        router.push({ pathname: '/(tabs)/convert', params: { from: trend.symbol } } as any);
      } else if (metal) {
        openTradeModal(metal);
      }
    };

    return (
      <TouchableOpacity 
        style={[styles.trendingCard, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}
        activeOpacity={0.7}
        onPress={handlePress}
      >
        <View style={styles.trendingHeader}>
          <View style={[styles.trendingIcon, { backgroundColor: assetColor + '20' }]}>
            {!isCrypto && metalIcons[trend.symbol] ? (
              <Image source={metalIcons[trend.symbol]} style={styles.trendingIconImage} resizeMode="contain" />
            ) : (
              <Text style={[styles.trendingCryptoIcon, { color: assetColor }]}>{trend.icon || trend.symbol[0]}</Text>
            )}
          </View>
          <View style={[styles.trendBadge, { backgroundColor: trendColor + '20' }]}>
            <Ionicons name={trendIcon} size={10} color={trendColor} />
            <Text style={[styles.trendBadgeText, { color: trendColor }]}>{trendLabel}</Text>
          </View>
        </View>
        
        <Text style={[styles.trendingSymbol, { color: isDark ? '#fff' : '#0f172a' }]}>{trend.symbol}</Text>
        
        <View style={styles.trendingPriceRow}>
          <Text style={[styles.trendingPrice, { color: getPriceColor(assetChange) }]}>
            {formatPrice(assetPrice)}
          </Text>
          <Text style={[styles.trendingChange, { color: getPriceColor(assetChange) }]}>
            {formatChange(assetChange)}
          </Text>
        </View>

        <View style={styles.trendingBar}>
          <View 
            style={[
              styles.trendingBarFill, 
              { 
                width: `${trend.buyVolume}%`, 
                backgroundColor: '#10b981' 
              }
            ]} 
          />
          <View 
            style={[
              styles.trendingBarFill, 
              { 
                width: `${trend.sellVolume}%`, 
                backgroundColor: '#ef4444' 
              }
            ]} 
          />
        </View>
        <View style={styles.trendingBarLabels}>
          <Text style={[styles.trendingBarLabel, { color: '#10b981' }]}>{trend.buyVolume}% Buy</Text>
          <Text style={[styles.trendingBarLabel, { color: '#ef4444' }]}>{trend.sellVolume}% Sell</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const TableHeader = ({ title }: { title: string }) => (
    <View style={styles.tableHeader}>
      <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#0f172a' }]}>{title}</Text>
      <Text style={[styles.headerLabel, { color: isDark ? '#64748b' : '#94a3b8' }]}>Price</Text>
      <Text style={[styles.headerLabel, { color: isDark ? '#64748b' : '#94a3b8' }]}>24h Change</Text>
    </View>
  );

  const MetalRow = ({ item }: { item: Metal }) => (
    <TouchableOpacity 
      style={[styles.metalRow, { borderBottomColor: isDark ? '#1e293b' : '#f1f5f9' }]} 
      activeOpacity={0.7}
      onPress={() => openTradeModal(item)}
    >
      <View style={styles.metalLeft}>
        <View style={[styles.metalIcon, { backgroundColor: item.color + '20' }]}>
          {metalIcons[item.symbol] ? (
            <Image source={metalIcons[item.symbol]} style={styles.metalImage} resizeMode="contain" />
          ) : item.symbol === 'AUXM' ? (
            <View style={[styles.auxmIconFallback, { backgroundColor: '#A855F7' }]}>
              <Text style={styles.auxmIconText}>◇</Text>
            </View>
          ) : (
            <Image source={require('@/assets/images/logos/auxite-logo.png')} style={styles.metalImage} resizeMode="contain" />
          )}
        </View>
        <View>
          <Text style={[styles.metalSymbol, { color: isDark ? '#fff' : '#0f172a' }]}>{item.symbol}</Text>
          <Text style={[styles.metalName, { color: isDark ? '#64748b' : '#94a3b8' }]}>{item.name}</Text>
        </View>
      </View>
      <Text style={[styles.metalPrice, { color: getPriceColor(item.change24h) }]}>{formatPrice(item.price)}</Text>
      <Text style={[styles.changeValue, { color: getPriceColor(item.change24h) }]}>{formatChange(item.change24h)}</Text>
    </TouchableOpacity>
  );

  // Crypto Row - Convert sayfasına yönlendirir
  const CryptoRow = ({ item }: { item: typeof cryptos[0] }) => (
    <TouchableOpacity 
      style={[styles.metalRow, { borderBottomColor: isDark ? '#1e293b' : '#f1f5f9' }]} 
      activeOpacity={0.7}
      onPress={() => router.push({ pathname: '/(tabs)/convert', params: { from: item.symbol } } as any)}
    >
      <View style={styles.metalLeft}>
        <View style={[styles.metalIcon, { backgroundColor: item.color + '20' }]}>
          <Text style={[styles.cryptoIconText, { color: item.color }]}>{item.icon}</Text>
        </View>
        <View>
          <Text style={[styles.metalSymbol, { color: isDark ? '#fff' : '#0f172a' }]}>{item.symbol}</Text>
          <Text style={[styles.metalName, { color: isDark ? '#64748b' : '#94a3b8' }]}>{item.name}</Text>
        </View>
      </View>
      <Text style={[styles.metalPrice, { color: getPriceColor(item.change24h) }]}>
        {formatPrice(item.price)}
      </Text>
      <Text style={[styles.changeValue, { color: getPriceColor(item.change24h) }]}>{formatChange(item.change24h)}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', paddingTop: insets.top }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <Banner />

        {/* Trending Section */}
        <View style={styles.trendingSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flame" size={18} color="#f59e0b" />
            <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#0f172a' }]}>{t.trending}</Text>
          </View>
          <View style={styles.trendingCards}>
            {trendingAssets.map((trend) => (
              <TrendingCard key={trend.symbol} trend={trend} />
            ))}
          </View>
        </View>

        {/* Metals List */}
        <View style={[styles.listSection, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
          <TableHeader title={t.auxite} />
          {metals.map((item) => <MetalRow key={item.symbol} item={item} />)}
        </View>

        {/* DCA Button */}
        <TouchableOpacity 
          style={[styles.dcaButton, { backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: isDark ? '#334155' : '#e2e8f0' }]}
          onPress={() => router.push('/recurring-buy')}
          activeOpacity={0.8}
        >
          <View style={[styles.dcaIconBg, { backgroundColor: '#3b82f6' + '20' }]}>
            <Ionicons name="repeat" size={22} color="#3b82f6" />
          </View>
          <View style={styles.dcaTextContainer}>
            <Text style={[styles.dcaTitle, { color: isDark ? '#fff' : '#0f172a' }]}>{t.recurringBuy}</Text>
            <Text style={[styles.dcaDesc, { color: isDark ? '#94a3b8' : '#64748b' }]}>{t.recurringBuyDesc}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={isDark ? '#64748b' : '#94a3b8'} />
        </TouchableOpacity>

        {/* Crypto List */}
        <View style={[styles.listSection, { backgroundColor: isDark ? '#1e293b' : '#fff', marginTop: 16 }]}>
          <TableHeader title={t.crypto} />
          {cryptos.map((item) => <CryptoRow key={item.symbol} item={item} />)}
        </View>

        {/* Physical Assets Info Box */}
        <View style={[styles.infoBox, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="shield-checkmark" size={28} color="#10b981" />
          </View>
          <Text style={[styles.infoText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
            {t.physicalAssetsInfo}
          </Text>
          <TouchableOpacity 
            style={styles.findAssetsBtn}
            activeOpacity={0.8}
            onPress={() => setAllocationModalVisible(true)}
          >
            <Ionicons name="location" size={18} color="#fff" />
            <Text style={styles.findAssetsBtnText}>{t.findMyAssets}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Allocation Finder Modal */}
      <Modal
        visible={allocationModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAllocationModalVisible(false)}
      >
        <View style={[styles.allocationModal, { backgroundColor: isDark ? '#0f172a' : '#fff' }]}>
          <View style={[styles.allocationHeader, { borderBottomColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
            <Text style={[styles.allocationTitle, { color: isDark ? '#fff' : '#0f172a' }]}>{t.findMyAssets}</Text>
            <TouchableOpacity onPress={() => setAllocationModalVisible(false)} style={styles.closeBtn}>
              <Ionicons name="close-circle" size={32} color={isDark ? '#64748b' : '#94a3b8'} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.allocationContent} showsVerticalScrollIndicator={false}>
            {/* Vault Locations */}
            {[
              { city: t.zurich, country: t.switzerland, flag: '🇨🇭', metals: ['AUXG', 'AUXPT'], capacity: '2.4T', security: 'AAA' },
              { city: t.london, country: t.uk, flag: '🇬🇧', metals: ['AUXG', 'AUXS'], capacity: '5.1T', security: 'AAA' },
              { city: t.newYork, country: t.usa, flag: '🇺🇸', metals: ['AUXG', 'AUXS', 'AUXPD'], capacity: '3.8T', security: 'AAA' },
              { city: t.singapore, country: t.singapore, flag: '🇸🇬', metals: ['AUXG', 'AUXPT', 'AUXPD'], capacity: '1.9T', security: 'AA+' },
              { city: t.dubai, country: t.uae, flag: '🇦🇪', metals: ['AUXG'], capacity: '1.2T', security: 'AA+' },
            ].map((vault, index) => (
              <View key={index} style={[styles.vaultCard, { backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}>
                <View style={styles.vaultHeader}>
                  <Text style={styles.vaultFlag}>{vault.flag}</Text>
                  <View style={styles.vaultInfo}>
                    <Text style={[styles.vaultCity, { color: isDark ? '#fff' : '#0f172a' }]}>{vault.city}</Text>
                    <Text style={[styles.vaultCountry, { color: isDark ? '#64748b' : '#94a3b8' }]}>{vault.country}</Text>
                  </View>
                  <View style={[styles.securityBadge, { backgroundColor: '#10b98120' }]}>
                    <Text style={styles.securityText}>{vault.security}</Text>
                  </View>
                </View>
                <View style={styles.vaultDetails}>
                  <View style={styles.vaultMetals}>
                    {vault.metals.map((metal) => (
                      <View key={metal} style={[styles.metalTag, { backgroundColor: isDark ? '#0f172a' : '#e2e8f0' }]}>
                        {metalIcons[metal] && (
                          <Image source={metalIcons[metal]} style={styles.metalTagIcon} resizeMode="contain" />
                        )}
                        <Text style={[styles.metalTagText, { color: isDark ? '#fff' : '#0f172a' }]}>{metal}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={[styles.vaultCapacity, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                    {t.capacity}: {vault.capacity}
                  </Text>
                </View>
              </View>
            ))}

            {/* Info Footer */}
            <View style={[styles.infoFooter, { backgroundColor: isDark ? '#1e293b50' : '#f1f5f9' }]}>
              <Ionicons name="information-circle" size={20} color={isDark ? '#64748b' : '#94a3b8'} />
              <Text style={[styles.infoFooterText, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                {t.securityProviders}
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: isDark ? '#0f172a' : '#fff' }]}>
          <View style={[styles.modalHeader, { paddingTop: insets.top + 8 }]}>
            <View style={styles.modalTitleRow}>
              {currentSelectedMetal && metalIcons[currentSelectedMetal.symbol] ? (
                <Image source={metalIcons[currentSelectedMetal.symbol]} style={styles.modalIcon} resizeMode="contain" />
              ) : (
                <Image source={require('@/assets/images/logos/auxite-logo.png')} style={styles.modalIcon} resizeMode="contain" />
              )}
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#0f172a' }]}>
                    {currentSelectedMetal?.symbol}/USDT
                  </Text>
                  <View style={[styles.changeBadge, { backgroundColor: (currentSelectedMetal?.change24h || 0) >= 0 ? '#10b98120' : '#ef444420' }]}>
                    <Text style={{ color: getPriceColor(currentSelectedMetal?.change24h || 0), fontSize: 11, fontWeight: '600' }}>
                      {(currentSelectedMetal?.change24h || 0) >= 0 ? '↑' : '↓'} {formatChange(currentSelectedMetal?.change24h || 0)}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.modalSubtitle, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                  {currentSelectedMetal?.name === 'Gold' ? `Auxite ${t.gold}` : 
                   currentSelectedMetal?.name === 'Silver' ? `Auxite ${t.silver}` :
                   currentSelectedMetal?.name === 'Platinum' ? `Auxite ${t.platinum}` :
                   currentSelectedMetal?.name === 'Palladium' ? `Auxite ${t.palladium}` :
                   currentSelectedMetal?.name}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={28} color={isDark ? '#64748b' : '#94a3b8'} />
            </TouchableOpacity>
          </View>

          {/* Tab Bar */}
          <View style={[styles.modalTabBar, { borderBottomColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
            {(['price', 'info', 'data'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.modalTabBtn, modalTab === tab && styles.modalTabBtnActive]}
                onPress={() => setModalTab(tab)}
              >
                <Text style={[
                  styles.modalTabText, 
                  { color: modalTab === tab ? '#10b981' : (isDark ? '#64748b' : '#94a3b8') }
                ]}>
                  {tab === 'price' ? t.priceTab : tab === 'info' ? t.infoTab : t.dataTab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tab Content */}
          {modalTab === 'price' && (
            <>
              {/* Price Header */}
              <View style={styles.priceHeaderRow}>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={[styles.modalPrice, { color: getPriceColor(currentSelectedMetal?.change24h || 0) }]}>
                      {formatPrice(currentSelectedMetal?.price || 0)}
                    </Text>
                    <View style={styles.liveBadge}>
                      <View style={styles.liveDot} />
                      <Text style={styles.liveText}>LIVE</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.priceStats}>
                  <Text style={[styles.priceStat, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                    {t.high24h} <Text style={{ color: '#10b981' }}>${((currentSelectedMetal?.price || 0) * 1.015).toFixed(2)}</Text>
                  </Text>
                  <Text style={[styles.priceStat, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                    {t.low24h} <Text style={{ color: '#ef4444' }}>${((currentSelectedMetal?.price || 0) * 0.985).toFixed(2)}</Text>
                  </Text>
                  <Text style={[styles.priceStat, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                    {t.volume24h} <Text style={{ color: isDark ? '#fff' : '#0f172a' }}>11.87M</Text>
                  </Text>
                </View>
              </View>

              {/* Chart */}
              <View style={styles.chartContainer}>
                {currentSelectedMetal && currentSelectedMetal.price > 0 ? (
                  <WebView
                    key={`${currentSelectedMetal.symbol}-${isDark}`}
                    source={{ html: getAdvancedChartHtml(currentSelectedMetal) }}
                    style={styles.chart}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    scrollEnabled={false}
                    startInLoadingState={true}
                    originWhitelist={['*']}
                    renderLoading={() => (
                      <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#0f172a' : '#fff' }]}>
                        <Text style={{ color: isDark ? '#64748b' : '#94a3b8', fontSize: 14 }}>{t.loadingChart}</Text>
                      </View>
                    )}
                  />
                ) : (
                  <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#0f172a' : '#fff' }]}>
                    <Text style={{ color: isDark ? '#64748b' : '#94a3b8', fontSize: 14 }}>{t.loadingPrice}</Text>
                  </View>
                )}
              </View>
            </>
          )}

          {modalTab === 'info' && (
            <ScrollView style={styles.tabContentScroll} showsVerticalScrollIndicator={false}>
              <View style={[styles.infoCard, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                <Text style={[styles.infoCardTitle, { color: isDark ? '#fff' : '#0f172a' }]}>{t.generalInfo}</Text>
                <View style={styles.infoRow}><Text style={[styles.infoLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>{t.symbol}</Text><Text style={[styles.infoValue, { color: isDark ? '#fff' : '#0f172a' }]}>{currentSelectedMetal?.symbol}/USDT</Text></View>
                <View style={styles.infoRow}><Text style={[styles.infoLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>{t.blockchain}</Text><Text style={[styles.infoValue, { color: isDark ? '#fff' : '#0f172a' }]}>Base Sepolia</Text></View>
                <View style={styles.infoRow}><Text style={[styles.infoLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>{t.contract}</Text><Text style={[styles.infoValue, { color: '#3b82f6' }]}>0x1234...5678</Text></View>
              </View>
              <View style={[styles.infoCard, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                <Text style={[styles.infoCardTitle, { color: isDark ? '#fff' : '#0f172a' }]}>{t.collateral}</Text>
                <View style={styles.infoRow}><Text style={[styles.infoLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>{t.collateralRatio}</Text><Text style={[styles.infoValue, { color: '#10b981' }]}>100%</Text></View>
                <View style={styles.infoRow}><Text style={[styles.infoLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>{t.custody}</Text><Text style={[styles.infoValue, { color: isDark ? '#fff' : '#0f172a' }]}>Brinks</Text></View>
                <View style={styles.infoRow}><Text style={[styles.infoLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>{t.auditor}</Text><Text style={[styles.infoValue, { color: isDark ? '#fff' : '#0f172a' }]}>Bureau Veritas</Text></View>
              </View>
            </ScrollView>
          )}

          {modalTab === 'data' && (
            <ScrollView style={styles.tabContentScroll} showsVerticalScrollIndicator={false}>
              <View style={[styles.infoCard, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                <Text style={[styles.infoCardTitle, { color: isDark ? '#fff' : '#0f172a' }]}>{t.dataTab}</Text>
                <View style={styles.infoRow}><Text style={[styles.infoLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>{t.trades24h}</Text><Text style={[styles.infoValue, { color: isDark ? '#fff' : '#0f172a' }]}>1,234</Text></View>
                <View style={styles.infoRow}><Text style={[styles.infoLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>{t.volume24h}</Text><Text style={[styles.infoValue, { color: isDark ? '#fff' : '#0f172a' }]}>$11.87M</Text></View>
                <View style={styles.infoRow}><Text style={[styles.infoLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>{t.buySpread}</Text><Text style={[styles.infoValue, { color: '#10b981' }]}>{spread.buy}%</Text></View>
                <View style={styles.infoRow}><Text style={[styles.infoLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>{t.sellSpread}</Text><Text style={[styles.infoValue, { color: '#ef4444' }]}>{spread.sell}%</Text></View>
                <View style={styles.infoRow}><Text style={[styles.infoLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>{t.buyPrice}</Text><Text style={[styles.infoValue, { color: '#10b981' }]}>${(currentSelectedMetal?.buyPrice || 0).toFixed(2)}/g</Text></View>
                <View style={styles.infoRow}><Text style={[styles.infoLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>{t.sellPrice}</Text><Text style={[styles.infoValue, { color: '#ef4444' }]}>${(currentSelectedMetal?.sellPrice || 0).toFixed(2)}/g</Text></View>
              </View>
            </ScrollView>
          )}

          {/* Minimal Action Buttons */}
          <View style={[styles.minimalActions, { borderTopColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
            <TouchableOpacity 
              style={[styles.minimalBtn, { backgroundColor: '#10b981' }]} 
              activeOpacity={0.8}
              onPress={() => {
                setTradeMode('buy');
                setTradeAmount('');
                setOrderType('market');
                setLimitPrice('');
                setTradeModalVisible(true);
              }}
            >
              <Text style={styles.minimalBtnText}>{t.buy}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.minimalBtn, { backgroundColor: '#ef4444' }]} 
              activeOpacity={0.8}
              onPress={() => {
                setTradeMode('sell');
                setTradeAmount('');
                setOrderType('market');
                setLimitPrice('');
                setTradeModalVisible(true);
              }}
            >
              <Text style={styles.minimalBtnText}>{t.sell}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.minimalBtn, { backgroundColor: '#f59e0b' }]} 
              activeOpacity={0.8}
              onPress={() => {
                setDcaAmount('');
                setDcaFrequency('weekly');
                setDcaDuration('indefinite');
                setDcaCurrency('AUXM');
                setDcaModalVisible(true);
              }}
            >
              <Text style={styles.minimalBtnText}>{t.dcaButtonLabel}</Text>
            </TouchableOpacity>
          </View>

          {/* Orders Section */}
          <View style={[styles.ordersSection, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', paddingBottom: insets.bottom + 8 }]}>
            <View style={styles.ordersColumns}>
              {/* Completed Orders */}
              <View style={styles.ordersColumn}>
                <Text style={[styles.ordersColumnTitle, { color: isDark ? '#fff' : '#0f172a' }]}>{t.completed}</Text>
                {completedOrders.slice(0, 3).map((order) => (
                  <View key={order.id} style={[styles.orderItem, { borderBottomColor: isDark ? '#334155' : '#e2e8f0' }]}>
                    <View style={styles.orderItemLeft}>
                      <View style={[styles.orderTypeDot, { backgroundColor: order.type === 'buy' ? '#10b981' : '#ef4444' }]} />
                      <Text style={[styles.orderAmount, { color: isDark ? '#fff' : '#0f172a' }]}>{order.amount}</Text>
                    </View>
                    <Text style={[styles.orderPrice, { color: isDark ? '#94a3b8' : '#64748b' }]}>${order.price.toFixed(2)}</Text>
                    <Text style={[styles.orderDate, { color: isDark ? '#64748b' : '#94a3b8' }]}>{order.date}</Text>
                  </View>
                ))}
              </View>
              {/* Pending Orders */}
              <View style={styles.ordersColumn}>
                <Text style={[styles.ordersColumnTitle, { color: isDark ? '#fff' : '#0f172a' }]}>{t.pending}</Text>
                {pendingOrders.slice(0, 3).map((order) => (
                  <View key={order.id} style={[styles.orderItem, { borderBottomColor: isDark ? '#334155' : '#e2e8f0' }]}>
                    <View style={styles.orderItemLeft}>
                      <View style={[styles.orderTypeDot, { backgroundColor: order.type === 'buy' ? '#10b981' : '#ef4444' }]} />
                      <Text style={[styles.orderAmount, { color: isDark ? '#fff' : '#0f172a' }]}>{order.amount}</Text>
                    </View>
                    <Text style={[styles.orderPrice, { color: isDark ? '#94a3b8' : '#64748b' }]}>${order.price.toFixed(2)}</Text>
                    <TouchableOpacity onPress={() => setPendingOrders(prev => prev.filter(o => o.id !== order.id))}>
                      <Ionicons name="close-circle" size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
                {pendingOrders.length === 0 && (
                  <Text style={[styles.noOrders, { color: isDark ? '#64748b' : '#94a3b8' }]}>{t.noOrders}</Text>
                )}
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Trade Modal (Buy/Sell) */}
      <Modal
        visible={tradeModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setTradeModalVisible(false)}
      >
        <View style={[styles.tradeModalContainer, { backgroundColor: isDark ? '#0f172a' : '#fff' }]}>
          {/* Header with Metal Icon */}
          <View style={[styles.tradeModalHeader, { borderBottomColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
            <View style={styles.tradeModalHeaderLeft}>
              <View style={[styles.tradeModalIcon, { backgroundColor: (currentSelectedMetal?.color || '#EAB308') + '20' }]}>
                {currentSelectedMetal && metalIcons[currentSelectedMetal.symbol] && (
                  <Image source={metalIcons[currentSelectedMetal.symbol]} style={styles.tradeModalIconImage} resizeMode="contain" />
                )}
              </View>
              <Text style={[styles.tradeModalTitle, { color: isDark ? '#fff' : '#0f172a' }]}>
                {tradeMode === 'buy' ? t.buy : t.sell} {currentSelectedMetal?.symbol}
              </Text>
            </View>
            <TouchableOpacity onPress={() => {
                setTradeModalVisible(false);
                setQuote(null);
                setCountdown(0);
                setShowQuoteConfirm(false);
                allocationBypassRef.current = false;
                setShowAllocationWarning(false);
              }} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={isDark ? '#64748b' : '#94a3b8'} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.tradeModalContent} showsVerticalScrollIndicator={false}>
            {/* Allocation Warning */}
            {showAllocationWarning && allocationPreview && (
              <View style={styles.allocationWarningContainer}>
                <View style={styles.allocationWarningIcon}>
                  <Ionicons name="warning" size={32} color="#f59e0b" />
                </View>
                
                <Text style={[styles.allocationWarningTitle, { color: isDark ? '#fff' : '#0f172a' }]}>
                  {language === 'tr' ? 'Kısmi Allocation' : 'Partial Allocation'}
                </Text>
                
                <Text style={[styles.allocationWarningSubtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                  {language === 'tr' 
                    ? `${allocationPreview.totalGrams.toFixed(4)}g ${currentSelectedMetal?.symbol} satın alıyorsunuz:`
                    : `You are buying ${allocationPreview.totalGrams.toFixed(4)}g ${currentSelectedMetal?.symbol}:`}
                </Text>
                
                <View style={[styles.allocationInfoBox, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                  <View style={styles.allocationRow}>
                    <View style={styles.allocationRowLeft}>
                      <View style={[styles.allocationDot, { backgroundColor: '#10b981' }]} />
                      <Text style={[styles.allocationLabel, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                        {language === 'tr' ? 'Kasada Allocate' : 'Vault Allocated'}
                      </Text>
                    </View>
                    <Text style={[styles.allocationValue, { color: '#10b981' }]}>
                      {allocationPreview.allocatedGrams}g
                    </Text>
                  </View>
                  
                  <View style={styles.allocationRow}>
                    <View style={styles.allocationRowLeft}>
                      <View style={[styles.allocationDot, { backgroundColor: '#f59e0b' }]} />
                      <Text style={[styles.allocationLabel, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                        Non-Allocated
                      </Text>
                    </View>
                    <Text style={[styles.allocationValue, { color: '#f59e0b' }]}>
                      {allocationPreview.nonAllocatedGrams.toFixed(4)}g
                    </Text>
                  </View>
                </View>
                
                <Text style={[styles.allocationNote, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                  {language === 'tr' 
                    ? 'Sadece tam gramlar fiziksel metale allocate edilebilir.'
                    : 'Only whole grams can be allocated to physical metal.'}
                </Text>
                
                <View style={styles.allocationButtons}>
                  {allocationPreview.suggestion && (
                    <TouchableOpacity
                      style={[styles.allocationAddBtn, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]}
                      onPress={() => {
                        const newAmount = allocationPreview.suggestion!.targetGrams * (currentSelectedMetal?.price || 1);
                        setTradeAmount(newAmount.toFixed(2));
                        setShowAllocationWarning(false);
                        setAllocationPreview(null);
                      }}
                    >
                      <Text style={[styles.allocationAddBtnLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                        {language === 'tr' ? 'Ekle' : 'Add'}
                      </Text>
                      <Text style={[styles.allocationAddBtnText, { color: isDark ? '#fff' : '#0f172a' }]}>
                        +{allocationPreview.suggestion.gramsToAdd.toFixed(4)}g → {allocationPreview.suggestion.targetGrams}g
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.allocationContinueBtn}
                    onPress={() => {
                      setShowAllocationWarning(false);
                      // Trade will proceed on next button press
                    }}
                  >
                    <Text style={styles.allocationContinueBtnText}>
                      {language === 'tr' ? 'Devam Et' : 'Continue'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            

            {/* AUXM Bonus Banner - Convert'e link */}
            <TouchableOpacity 
              style={styles.bonusBanner}
              activeOpacity={0.7}
              onPress={() => {
                setTradeModalVisible(false);
                setModalVisible(false);
                // Navigate to Convert tab
                router.push('/(tabs)/convert');
              }}
            >
              <Text style={{ fontSize: 14 }}>🎁</Text>
              <Text style={styles.bonusBannerText}>
                {t.bonusText}
              </Text>
              <Ionicons name="chevron-forward" size={14} color="#a855f7" />
            </TouchableOpacity>

            {/* Market / Limit Tabs */}
            <View style={[styles.orderTypeTabs, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
              <TouchableOpacity
                style={[
                  styles.orderTypeTab,
                  orderType === 'market' && styles.orderTypeTabActive
                ]}
                onPress={() => setOrderType('market')}
              >
                <Ionicons 
                  name="flash" 
                  size={16} 
                  color={orderType === 'market' ? '#fff' : isDark ? '#64748b' : '#94a3b8'} 
                />
                <Text style={[
                  styles.orderTypeTabText,
                  { color: orderType === 'market' ? '#fff' : isDark ? '#64748b' : '#94a3b8' }
                ]}>
                  {t.market}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.orderTypeTab,
                  orderType === 'limit' && styles.orderTypeTabActive
                ]}
                onPress={() => setOrderType('limit')}
              >
                <Ionicons 
                  name="time" 
                  size={16} 
                  color={orderType === 'limit' ? '#fff' : isDark ? '#64748b' : '#94a3b8'} 
                />
                <Text style={[
                  styles.orderTypeTabText,
                  { color: orderType === 'limit' ? '#fff' : isDark ? '#64748b' : '#94a3b8' }
                ]}>
                  {t.limit}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Limit Price Input (only for limit orders) */}
            {orderType === 'limit' && (
              <View style={styles.limitPriceSection}>
                <Text style={[styles.tradeLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                  {t.limitPriceLabel}
                </Text>
                <View style={[
                  styles.amountInputContainer, 
                  { 
                    backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                  }
                ]}>
                  <Text style={[styles.dollarSign, { color: isDark ? '#64748b' : '#94a3b8' }]}>$</Text>
                  <TextInput
                    style={[styles.limitPriceInput, { color: isDark ? '#fff' : '#0f172a' }]}
                    value={limitPrice}
                    onChangeText={setLimitPrice}
                    placeholder={(currentSelectedMetal?.price || 0).toFixed(2)}
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.limitPriceHint}>
                  <Text style={[styles.limitPriceHintText, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                    {t.current}: ${(currentSelectedMetal?.price || 0).toFixed(2)}
                  </Text>
                  {limitPrice && parseFloat(limitPrice) < (currentSelectedMetal?.price || 0) && tradeMode === 'buy' && (
                    <Text style={styles.limitPriceSaving}>
                      %{(((currentSelectedMetal?.price || 0) - parseFloat(limitPrice)) / (currentSelectedMetal?.price || 1) * 100).toFixed(1)} {t.savings}
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* Payment Method Selection */}
            <Text style={[styles.tradeLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              {tradeMode === 'buy' ? t.paymentMethod : t.youWillReceive}
            </Text>
            <View style={styles.currencyRow}>
              {[
                { id: 'AUXM', icon: '💵', color: '#a855f7' },
                { id: 'USDT', icon: '₮', color: '#26a17b' },
                { id: 'BTC', icon: '₿', color: '#f7931a' },
                { id: 'ETH', icon: 'Ξ', color: '#627eea' },
                { id: 'XRP', icon: '✕', color: '#00aae4' },
                { id: 'SOL', icon: '◎', color: '#9945ff' },
              ].map((currency) => (
                <TouchableOpacity
                  key={currency.id}
                  style={[
                    styles.currencyBtn,
                    { 
                      backgroundColor: selectedCurrency === currency.id 
                        ? currency.color + '25' 
                        : isDark ? '#1e293b' : '#f1f5f9',
                      borderColor: selectedCurrency === currency.id 
                        ? currency.color 
                        : isDark ? '#334155' : '#e2e8f0',
                    }
                  ]}
                  onPress={() => setSelectedCurrency(currency.id)}
                >
                  <Text style={[styles.currencyIcon, { color: currency.color }]}>{currency.icon}</Text>
                  <Text style={[
                    styles.currencyName, 
                    { color: selectedCurrency === currency.id ? currency.color : isDark ? '#fff' : '#0f172a' }
                  ]}>
                    {currency.id}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Balance Display */}
            <View style={styles.balanceRow}>
              <Text style={[styles.balanceLabel, { color: isDark ? '#64748b' : '#94a3b8' }]}>{t.balance}:</Text>
              <View style={styles.balanceValues}>
                <Text style={[styles.balanceAmount, { color: isDark ? '#fff' : '#0f172a' }]}>
                  {tradeMode === 'sell' ? (
                    // Sell modunda metal bakiyesini göster
                    <>
                      {currentSelectedMetal?.symbol === 'AUXG' ? balances.auxg.toFixed(4) :
                       currentSelectedMetal?.symbol === 'AUXS' ? balances.auxs.toFixed(4) :
                       currentSelectedMetal?.symbol === 'AUXPT' ? balances.auxpt.toFixed(4) :
                       currentSelectedMetal?.symbol === 'AUXPD' ? balances.auxpd.toFixed(4) : '0.0000'
                      } {currentSelectedMetal?.symbol}
                    </>
                  ) : (
                    // Buy modunda kripto bakiyesini göster
                    <>
                      {selectedCurrency === 'AUXM' ? balances.auxm.toFixed(2) :
                       selectedCurrency === 'ETH' ? balances.eth.toFixed(4) :
                       selectedCurrency === 'USDT' ? balances.usdt.toFixed(2) :
                       selectedCurrency === 'BTC' ? (balances.btc || 0).toFixed(6) :
                       selectedCurrency === 'XRP' ? (balances.xrp || 0).toFixed(2) :
                       selectedCurrency === 'SOL' ? (balances.sol || 0).toFixed(4) : '0.00'
                      } {selectedCurrency}
                    </>
                  )}
                </Text>
                {tradeMode === 'buy' && selectedCurrency === 'AUXM' && balances.bonusAuxm > 0 && (
                  <Text style={styles.bonusAmount}>+{balances.bonusAuxm.toFixed(2)} {t.bonus}</Text>
                )}
              </View>
            </View>

            {/* Amount Input */}
            <Text style={[styles.tradeLabel, { color: isDark ? '#94a3b8' : '#64748b', marginTop: 8 }]}>
              {t.amount}
            </Text>
            <View style={[
              styles.amountInputContainer, 
              { 
                backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                borderColor: isDark ? '#334155' : '#e2e8f0',
              }
            ]}>
              <TextInput
                style={[styles.amountInput, { color: isDark ? '#fff' : '#0f172a' }]}
                value={tradeAmount}
                onChangeText={setTradeAmount}
                placeholder="0.00"
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                keyboardType="decimal-pad"
              />
              <Text style={[styles.amountCurrency, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                {currentSelectedMetal?.symbol || 'AUXG'}
              </Text>
            </View>
            {/* Arrow Divider */}
            <View style={styles.arrowDivider}>
              <View style={[styles.arrowCircle, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                <Ionicons name="swap-vertical" size={20} color={isDark ? '#64748b' : '#94a3b8'} />
              </View>
            </View>

            {/* You Will Pay/Receive */}
            <Text style={[styles.tradeLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              {tradeMode === 'buy' ? (language === 'tr' ? 'Ödeyeceğiniz' : 'You Will Pay') : t.youWillReceive}
            </Text>
            <View style={[
              styles.receiveBox, 
              { 
                backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                borderColor: isDark ? '#334155' : '#e2e8f0',
              }
            ]}>
              <View style={[styles.receiveIcon, { backgroundColor: tradeMode === 'buy' 
                  ? (selectedCurrency === 'AUXM' ? '#a855f720' : 
                     selectedCurrency === 'USDT' ? '#26a17b20' :
                     selectedCurrency === 'BTC' ? '#f7931a20' :
                     selectedCurrency === 'ETH' ? '#627eea20' :
                     selectedCurrency === 'XRP' ? '#23292f20' :
                     selectedCurrency === 'SOL' ? '#9945ff20' : '#a855f720')
                  : (currentSelectedMetal?.color || '#EAB308') + '20' }]}>
                {tradeMode === 'buy' ? (
                  <Text style={{ 
                    fontSize: 28, 
                    fontWeight: '700',
                    color: selectedCurrency === 'AUXM' ? '#a855f7' : 
                           selectedCurrency === 'USDT' ? '#26a17b' :
                           selectedCurrency === 'BTC' ? '#f7931a' :
                           selectedCurrency === 'ETH' ? '#627eea' :
                           selectedCurrency === 'XRP' ? '#23292f' :
                           selectedCurrency === 'SOL' ? '#9945ff' : '#a855f7'
                  }}>
                    {selectedCurrency === 'AUXM' ? '$' : 
                     selectedCurrency === 'USDT' ? '$' :
                     selectedCurrency === 'BTC' ? '₿' :
                     selectedCurrency === 'ETH' ? 'Ξ' :
                     selectedCurrency === 'XRP' ? 'X' :
                     selectedCurrency === 'SOL' ? 'S' : '$'}
                  </Text>
                ) : (
                  currentSelectedMetal && metalIcons[currentSelectedMetal.symbol] && (
                    <Image source={metalIcons[currentSelectedMetal.symbol]} style={styles.receiveIconImage} resizeMode="contain" />
                  )
                )}
              </View>
              <View style={styles.receiveInfo}>
                <Text style={[styles.receiveAmount, { color: isDark ? '#fff' : '#0f172a' }]}>
                  {tradeMode === 'buy' 
                    ? (currentSelectedMetal && tradeAmount 
                        ? (() => {
                            const metalGrams = parseFloat(tradeAmount);
                            const metalPrice = orderType === 'limit' && limitPrice ? parseFloat(limitPrice) : currentSelectedMetal.buyPrice || currentSelectedMetal.price || 1;
                            const cryptoAmount = calculateCryptoAmount(metalGrams, metalPrice, selectedCurrency);
                            // Format based on currency type
                            if (selectedCurrency === 'AUXM' || selectedCurrency === 'USD' || selectedCurrency === 'USDT') {
                              return cryptoAmount.toFixed(2);
                            } else if (selectedCurrency === 'BTC') {
                              return cryptoAmount.toFixed(6);
                            } else {
                              return cryptoAmount.toFixed(4);
                            }
                          })()
                        : '0.00'
                      ) + ' ' + selectedCurrency
                    : (currentSelectedMetal && tradeAmount 
                        ? (() => {
                            const metalGrams = parseFloat(tradeAmount);
                            const metalPrice = orderType === 'limit' && limitPrice ? parseFloat(limitPrice) : currentSelectedMetal.sellPrice || currentSelectedMetal.price || 1;
                            const cryptoAmount = calculateCryptoAmount(metalGrams, metalPrice, selectedCurrency);
                            if (selectedCurrency === 'AUXM' || selectedCurrency === 'USD' || selectedCurrency === 'USDT') {
                              return cryptoAmount.toFixed(2);
                            } else if (selectedCurrency === 'BTC') {
                              return cryptoAmount.toFixed(6);
                            } else {
                              return cryptoAmount.toFixed(4);
                            }
                          })()
                        : '0.00'
                      ) + ' ' + selectedCurrency
                  }
                </Text>
                <Text style={[styles.receivePrice, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                  @ ${orderType === 'limit' && limitPrice ? parseFloat(limitPrice).toFixed(2) : ((tradeMode === "buy" ? currentSelectedMetal?.buyPrice : currentSelectedMetal?.sellPrice) || 0).toFixed(2)}/g
                  {selectedCurrency !== 'AUXM' && selectedCurrency !== 'USD' && selectedCurrency !== 'USDT' && (
                    ` • ${selectedCurrency} $${getCryptoPrice(selectedCurrency).toLocaleString()}`
                  )}
                </Text>
              </View>
            </View>

            {/* Quick Amount Buttons - You Will Pay altında */}
            <View style={[styles.quickAmounts, { marginTop: 8, marginBottom: 12 }]}>
              {['25%', '50%', '75%', 'MAX'].map((pct) => (
                <TouchableOpacity
                  key={pct}
                  style={[styles.quickAmountBtn, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}
                  onPress={() => {
                    if (tradeMode === 'buy') {
                      // Calculate balance in USD equivalent
                      const cryptoPrice = getCryptoPrice(selectedCurrency);
                      let balanceUSD = 0;
                      if (selectedCurrency === 'AUXM') {
                        balanceUSD = balances.auxm + balances.bonusAuxm;
                      } else if (selectedCurrency === 'USDT') {
                        balanceUSD = balances.usdt;
                      } else if (selectedCurrency === 'ETH') {
                        balanceUSD = balances.eth * cryptoPrice;
                      } else if (selectedCurrency === 'BTC') {
                        balanceUSD = (balances.btc || 0) * cryptoPrice;
                      } else if (selectedCurrency === 'XRP') {
                        balanceUSD = (balances.xrp || 0) * cryptoPrice;
                      } else if (selectedCurrency === 'SOL') {
                        balanceUSD = (balances.sol || 0) * cryptoPrice;
                      }
                      const metalPrice = currentSelectedMetal?.buyPrice || currentSelectedMetal?.price || 1;
                      const maxGrams = balanceUSD / metalPrice;
                      const multiplier = pct === 'MAX' ? 1 : parseInt(pct) / 100;
                      setTradeAmount((maxGrams * multiplier).toFixed(4));
                    } else {
                      const metalBalance = currentSelectedMetal?.symbol === 'AUXG' ? balances.auxg :
                                          currentSelectedMetal?.symbol === 'AUXS' ? balances.auxs :
                                          currentSelectedMetal?.symbol === 'AUXPT' ? balances.auxpt :
                                          currentSelectedMetal?.symbol === 'AUXPD' ? balances.auxpd : 0;
                      const multiplier = pct === 'MAX' ? 1 : parseInt(pct) / 100;
                      setTradeAmount((metalBalance * multiplier).toFixed(4));
                    }
                  }}
                >
                  <Text style={[styles.quickAmountText, { color: isDark ? '#94a3b8' : '#64748b' }]}>{pct}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Trade Summary */}
            <View style={[styles.tradeSummary, { backgroundColor: isDark ? '#1e293b50' : '#f1f5f9' }]}>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: isDark ? '#64748b' : '#94a3b8' }]}>{t.orderType}</Text>
                <Text style={[styles.summaryValue, { color: isDark ? '#fff' : '#0f172a' }]}>
                  {orderType === 'market' ? `⚡ ${t.market}` : `⏱️ ${t.limit}`}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: isDark ? '#64748b' : '#94a3b8' }]}>{t.price}</Text>
                <Text style={[styles.summaryValue, { color: isDark ? '#fff' : '#0f172a' }]}>
                @ ${orderType === 'limit' && limitPrice ? parseFloat(limitPrice).toFixed(2) : ((tradeMode === "buy" ? currentSelectedMetal?.buyPrice : currentSelectedMetal?.sellPrice) || 0).toFixed(2)}                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: isDark ? '#64748b' : '#94a3b8' }]}>{t.tradeFee}</Text>
                <Text style={[styles.summaryValue, { color: isDark ? '#fff' : '#0f172a' }]}>
                  {tradeAmount && parseFloat(tradeAmount) > 0 
                    ? '$' + (parseFloat(tradeAmount) * 0.001).toFixed(2) + ' (0.1%)'
                    : '0.1%'
                  }
                </Text>
              </View>
            </View>

            {/* Limit Order Info */}
            {orderType === 'limit' && (
              <View style={[styles.limitOrderInfo, { backgroundColor: isDark ? '#3b82f620' : '#eff6ff' }]}>
                <Ionicons name="information-circle" size={16} color="#3b82f6" />
                <Text style={styles.limitOrderInfoText}>
                  {t.limitOrderInfo}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Trade Button */}
          <View style={[styles.tradeButtonContainer, { paddingBottom: insets.bottom + 12 }]}>
            <TouchableOpacity
              style={[
                styles.tradeButton,
                { 
                  backgroundColor: !tradeAmount || parseFloat(tradeAmount) <= 0 || isProcessing || isTrading || !address
                    ? isDark ? '#334155' : '#cbd5e1'
                    : tradeMode === 'buy' ? '#10b981' : '#ef4444'
                }
              ]}
              disabled={!tradeAmount || parseFloat(tradeAmount) <= 0 || isProcessing || isTrading || !address}
              onPress={async () => {
                Keyboard.dismiss();
                
                if (!address) {
                  showAlert(t.error, t.connectWalletFirst, 'error');
                  return;
                }
                
                if (!currentSelectedMetal) return;
                
                setIsProcessing(true);
                try {
                  const metalGrams = parseFloat(tradeAmount);
                  const amount = metalGrams * (currentSelectedMetal.price || 1); // AUXM cinsinden
                  
                  // Limit Order
                  if (orderType === 'limit') {
                    const price = parseFloat(limitPrice);
                    if (!price || price <= 0) {
                      showAlert(t.error, t.enterValidPrice, 'error');
                      setIsProcessing(false);
                      return;
                    }
                    
                    // Gram hesapla - tradeAmount artık gram cinsinden
                    const grams = metalGrams;
                    
                    const result = await createOrder({
                      type: tradeMode,
                      metal: currentSelectedMetal.symbol as 'AUXG' | 'AUXS' | 'AUXPT' | 'AUXPD',
                      grams: grams,
                      limitPrice: price,
                      paymentMethod: selectedCurrency as 'AUXM' | 'USDT' | 'USD',
                    });
                    
                    if (result.success) {
                      showAlert(
                        t.success,
                        `${t.limitOrderCreated}: ${grams.toFixed(4)}g ${currentSelectedMetal.symbol} @ $${price.toFixed(2)}`,
                        'success',
                        [{ text: t.ok, onPress: () => setTradeModalVisible(false) }]
                      );
                    } else {
                      showAlert(t.error, result.error || t.orderFailed, 'error');
                    }
                  } 
                  // Market Order
                  else {
                    // Allocation preview kontrolü (sadece buy için ve kesirli gram girildiğinde)
                    const isWholeGramInput = Number.isInteger(metalGrams) || Math.abs(metalGrams - Math.round(metalGrams)) < 0.001;
                    
                    if (tradeMode === 'buy' && !showAllocationWarning && !allocationBypassRef.current && !isWholeGramInput) {
                      const grams = metalGrams; // tradeAmount artık gram cinsinden
                      // Kesirli gram girildiğinde API'den kontrol et
                      try {
                          const previewRes = await fetch(
                            `${API_URL}/api/trade?type=buy&fromToken=${selectedCurrency}&toToken=${currentSelectedMetal.symbol}&amount=${amount}&address=${address}`
                          );
                          const previewData = await previewRes.json();
                          
                          if (previewData.preview?.allocationPreview?.hasPartialAllocation) {
                            const allocPrev = previewData.preview.allocationPreview;
                            setAllocationPreview(allocPrev);
                            setIsProcessing(false);
                            
                            // Quote al - fiyatı kilitle (20 saniye)
                            const quoteResult = await getQuote({
                              type: 'buy',
                              metal: currentSelectedMetal.symbol,
                              grams: grams,
                              address: address,
                            });
                            
                            if (quoteResult.success && quoteResult.quote) {
                              setQuote(quoteResult.quote);
                              setCountdown(20); // 20 saniye timeout
                            }
                            
                            // Buton sırası: Complete (varsa), Continue, Cancel
                            const alertButtons: any[] = [];
                            
                            // 1. Complete butonu (yeşil) - varsa, direkt trade execute et
                            if (allocPrev.suggestion) {
                              const targetGrams = allocPrev.suggestion.targetGrams;
                              const targetAmountUSD = targetGrams * (currentSelectedMetal.price || 1);
                              
                              // Convert to crypto amount if needed
                              let targetCryptoAmount = targetAmountUSD;
                              if (selectedCurrency === 'ETH' || selectedCurrency === 'BTC' || selectedCurrency === 'XRP' || selectedCurrency === 'SOL') {
                                const cryptoPrice = getCryptoPrice(selectedCurrency);
                                targetCryptoAmount = targetAmountUSD / cryptoPrice;
                              }
                              
                              alertButtons.push({
                                text: `${targetGrams} ${currentSelectedMetal.symbol}`,
                                style: 'default',
                                onPress: async () => {
                                  setIsProcessing(true);
                                  try {
                                    const result = await executeBuy({
                                      email: userEmail || undefined,
                                      holderName: userName || undefined,
                                      fromToken: selectedCurrency,
                                      toToken: currentSelectedMetal.symbol,
                                      amount: targetCryptoAmount,
                                    });
                                    
                                    if (result.success && result.transaction) {
                                      fetch(`${API_URL}/api/trends`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ symbol: currentSelectedMetal.symbol, action: 'buy' })
                                      }).catch(() => {});
                                      
                                      setQuote(null);
                                      setCountdown(0);
                                      allocationBypassRef.current = false;
                                      
                                      showAlert(
                                        t.success,
                                        `${t.bought}: ${result.transaction.toAmount.toFixed(4)} ${result.transaction.toToken}`,
                                        'success',
                                        [{ text: t.ok, onPress: () => setTradeModalVisible(false) }]
                                      );
                                    } else {
                                      showAlert(t.error, result.error || t.tradeFailed, 'error');
                                    }
                                  } catch (e: any) {
                                    showAlert(t.error, e.message || t.tradeError, 'error');
                                  } finally {
                                    setIsProcessing(false);
                                  }
                                }
                              });
                            }
                            
                            // 2. Continue butonu (sarı/warning) - direkt trade execute et
                            alertButtons.push({
                              text: language === 'tr' ? 'Devam Et' : 'Continue',
                              style: 'destructive',
                              onPress: async () => {
                                // Direkt trade'i execute et
                                setIsProcessing(true);
                                try {
                                  // Convert to crypto amount if needed
                                  let cryptoAmount = amount;
                                  if (selectedCurrency === 'ETH' || selectedCurrency === 'BTC' || selectedCurrency === 'XRP' || selectedCurrency === 'SOL') {
                                    const cryptoPrice = getCryptoPrice(selectedCurrency);
                                    cryptoAmount = amount / cryptoPrice;
                                  }
                                  
                                  const result = await executeBuy({
                                    email: userEmail || undefined,
                                    holderName: userName || undefined,
                                    fromToken: selectedCurrency,
                                    toToken: currentSelectedMetal.symbol,
                                    amount: cryptoAmount,
                                  });
                                  
                                  if (result.success && result.transaction) {
                                    fetch(`${API_URL}/api/trends`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ symbol: currentSelectedMetal.symbol, action: 'buy' })
                                    }).catch(() => {});
                                    
                                    setQuote(null);
                                    setCountdown(0);
                                    allocationBypassRef.current = false;
                                    
                                    showAlert(
                                      t.success,
                                      `${t.bought}: ${result.transaction.toAmount.toFixed(4)} ${result.transaction.toToken}`,
                                      'success',
                                      [{ text: t.ok, onPress: () => setTradeModalVisible(false) }]
                                    );
                                  } else {
                                    showAlert(t.error, result.error || t.tradeFailed, 'error');
                                  }
                                } catch (e: any) {
                                  showAlert(t.error, e.message || t.tradeError, 'error');
                                } finally {
                                  setIsProcessing(false);
                                }
                              }
                            });
                            
                            // 3. Cancel butonu (gri)
                            alertButtons.push({
                              text: language === 'tr' ? 'İptal' : 'Cancel',
                              style: 'cancel',
                              onPress: () => {
                                setQuote(null);
                                setCountdown(0);
                              }
                            });
                            
                            showAlert(
                              language === 'tr' ? 'Kısmi Allocation' : 'Partial Allocation',
                              language === 'tr' 
                                ? `${allocPrev.totalGrams.toFixed(4)}g alıyorsunuz:\n✓ Kasada: ${allocPrev.allocatedGrams}g\n○ Non-Allocated: ${allocPrev.nonAllocatedGrams.toFixed(4)}g\n\nFiyat: $${quoteResult.quote?.pricePerGram.toFixed(2) || '-'}/g\nSadece tam gramlar fiziksel metale allocate edilir.`
                                : `Buying ${allocPrev.totalGrams.toFixed(4)}g:\n✓ Vault Allocated: ${allocPrev.allocatedGrams}g\n○ Non-Allocated: ${allocPrev.nonAllocatedGrams.toFixed(4)}g\n\nPrice: $${quoteResult.quote?.pricePerGram.toFixed(2) || '-'}/g\nOnly whole grams are allocated to physical metal.`,
                              'warning',
                              alertButtons,
                              20 // 20 saniye timeout
                            );
                            return;
                          }
                        } catch (e) {
                          console.warn("Allocation preview check failed:", e);
                        }
                    }
                    
                    // Reset allocation warning after proceeding
                    setShowAllocationWarning(false);
                    setAllocationPreview(null);
                    
                    // Quote system - ilk tıklamada quote al
                    if (!quote || countdown <= 0) {
                      const grams = tradeMode === 'buy' 
                        ? amount / (currentSelectedMetal.price || 1)
                        : amount;
                      
                      const quoteResult = await getQuote({
                        type: tradeMode,
                        metal: currentSelectedMetal.symbol,
                        grams: grams,
                        address: address,
                      });
                      
                      if (quoteResult.success && quoteResult.quote) {
                        setQuote(quoteResult.quote);
                        setCountdown(quoteResult.quote.timeRemaining || 30);
                        setShowQuoteConfirm(true);
                        setIsProcessing(false);
                        return;
                      } else {
                        showAlert(t.error, quoteResult.error || 'Quote failed', 'error');
                        setIsProcessing(false);
                        return;
                      }
                    }
                    
                    // Quote onaylandı, trade'i gerçekleştir
                    let result;
                    
                    if (tradeMode === 'buy') {
                      // Calculate the crypto amount to send based on selected currency
                      let cryptoAmount = amount; // Default: USD-based tokens (AUXM, USDT)
                      
                      if (selectedCurrency === 'ETH' || selectedCurrency === 'BTC' || selectedCurrency === 'XRP' || selectedCurrency === 'SOL') {
                        // For crypto payments, convert USD value to crypto amount
                        const cryptoPrice = getCryptoPrice(selectedCurrency);
                        cryptoAmount = amount / cryptoPrice;
                        console.log('💰 Crypto payment calculation:', {
                          metalGrams,
                          metalPriceUSD: currentSelectedMetal.price,
                          totalUSD: amount,
                          cryptoSymbol: selectedCurrency,
                          cryptoPrice,
                          cryptoAmount,
                        });
                      }
                      
                      result = await executeBuy({
                        email: userEmail || undefined,
                        holderName: userName || undefined,
                        fromToken: selectedCurrency,
                        toToken: currentSelectedMetal.symbol,
                        amount: cryptoAmount,
                      });
                    } else {
                      // Sell: metal gönder, AUXM al
                      result = await executeSell({
                        email: userEmail || undefined,
                        holderName: userName || undefined,
                        fromToken: currentSelectedMetal.symbol,
                        toToken: 'AUXM',
                        amount: metalGrams, // tradeAmount artık gram cinsinden
                      });
                    }
                    
                    if (result.success && result.transaction) {
                      // Record trend
                      fetch(`${API_URL}/api/trends`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                          symbol: currentSelectedMetal.symbol, 
                          action: tradeMode 
                        })
                      }).catch(() => {});
                      
                      // Reset quote state
                      setQuote(null);
                      setCountdown(0);
                      setShowQuoteConfirm(false);
                      allocationBypassRef.current = false;
                      
                      showAlert(
                        t.success,
                        `${tradeMode === 'buy' ? t.bought : t.sold}: ${result.transaction.toAmount.toFixed(4)} ${result.transaction.toToken}`,
                        'success',
                        [{ text: t.ok, onPress: () => setTradeModalVisible(false) }]
                      );
                    } else {
                      showAlert(t.error, result.error || t.tradeFailed, 'error');
                    }
                  }
                } catch (e: any) {
                  console.error('Trade error:', e);
                  showAlert(t.error, e.message || t.tradeError, 'error');
                } finally {
                  setIsProcessing(false);
                }
              }}
            >
              {isProcessing || isTrading ? (
                <Text style={styles.tradeButtonText}>{t.processing}</Text>
              ) : !address ? (
                <Text style={styles.tradeButtonText}>{t.connectWallet}</Text>
              ) : (
                <>
                  <Ionicons 
                    name={tradeMode === 'buy' ? 'arrow-up-circle' : 'arrow-down-circle'} 
                    size={22} 
                    color="#fff" 
                  />
                  <Text style={styles.tradeButtonText}>
                    {orderType === 'limit' 
                      ? t.placeOrder 
                      : (showQuoteConfirm && quote 
                          ? `${t.confirmOrder} (${countdown}s)` 
                          : (tradeMode === 'buy' ? t.buy : t.sell))} {currentSelectedMetal?.symbol}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* DCA Modal */}
      <Modal
        visible={dcaModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDcaModalVisible(false)}
      >
        <View style={[styles.tradeModalContainer, { backgroundColor: isDark ? '#0f172a' : '#fff' }]}>
          {/* Header */}
          <View style={[styles.tradeModalHeader, { borderBottomColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
            <View style={styles.tradeModalHeaderLeft}>
              <View style={[styles.tradeModalIcon, { backgroundColor: '#f59e0b20' }]}>
                <Ionicons name="repeat" size={20} color="#f59e0b" />
              </View>
              <Text style={[styles.tradeModalTitle, { color: isDark ? '#fff' : '#0f172a' }]}>
                {t.dcaTitle} - {currentSelectedMetal?.symbol}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setDcaModalVisible(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={isDark ? '#64748b' : '#94a3b8'} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.tradeModalContent} showsVerticalScrollIndicator={false}>
            {/* Description */}
            <View style={[styles.dcaInfoBanner, { backgroundColor: isDark ? '#f59e0b15' : '#fef3c7' }]}>
              <Ionicons name="information-circle" size={20} color="#f59e0b" />
              <Text style={[styles.dcaInfoText, { color: isDark ? '#fbbf24' : '#92400e' }]}>
                {t.dcaDescription}
              </Text>
            </View>

            {/* Payment Method */}
            <Text style={[styles.tradeLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              {t.paymentMethod}
            </Text>
            <View style={styles.currencyRow}>
              {[
                { id: 'AUXM', icon: '💵', color: '#a855f7' },
                { id: 'USDT', icon: '₮', color: '#26a17b' },
                { id: 'USD', icon: '$', color: '#10b981' },
              ].map((currency) => (
                <TouchableOpacity
                  key={currency.id}
                  style={[
                    styles.currencyBtn,
                    { 
                      backgroundColor: dcaCurrency === currency.id 
                        ? currency.color + '25' 
                        : isDark ? '#1e293b' : '#f1f5f9',
                      borderColor: dcaCurrency === currency.id 
                        ? currency.color 
                        : isDark ? '#334155' : '#e2e8f0',
                    }
                  ]}
                  onPress={() => setDcaCurrency(currency.id)}
                >
                  <Text style={[styles.currencyIcon, { color: currency.color }]}>{currency.icon}</Text>
                  <Text style={[
                    styles.currencyName, 
                    { color: dcaCurrency === currency.id ? currency.color : isDark ? '#fff' : '#0f172a' }
                  ]}>
                    {currency.id}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Amount per Purchase */}
            <Text style={[styles.tradeLabel, { color: isDark ? '#94a3b8' : '#64748b', marginTop: 16 }]}>
              {t.dcaAmount}
            </Text>
            <View style={[
              styles.amountInputContainer, 
              { 
                backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                borderColor: isDark ? '#334155' : '#e2e8f0',
              }
            ]}>
              <Text style={[styles.dollarSign, { color: isDark ? '#64748b' : '#94a3b8' }]}>$</Text>
              <TextInput
                style={[styles.amountInput, { color: isDark ? '#fff' : '#0f172a' }]}
                value={dcaAmount}
                onChangeText={setDcaAmount}
                placeholder="100"
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                keyboardType="decimal-pad"
              />
              <Text style={[styles.amountCurrency, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                {dcaCurrency}
              </Text>
            </View>
            
            {/* Quick Amount Buttons */}
            <View style={styles.quickAmountRow}>
              {['25', '50', '100', '250', '500'].map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={[
                    styles.quickAmountBtn,
                    { 
                      backgroundColor: dcaAmount === amount 
                        ? '#f59e0b20' 
                        : isDark ? '#1e293b' : '#f1f5f9',
                      borderColor: dcaAmount === amount ? '#f59e0b' : isDark ? '#334155' : '#e2e8f0',
                    }
                  ]}
                  onPress={() => setDcaAmount(amount)}
                >
                  <Text style={[
                    styles.quickAmountText,
                    { color: dcaAmount === amount ? '#f59e0b' : isDark ? '#fff' : '#0f172a' }
                  ]}>
                    ${amount}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Frequency */}
            <Text style={[styles.tradeLabel, { color: isDark ? '#94a3b8' : '#64748b', marginTop: 16 }]}>
              {t.dcaFrequency}
            </Text>
            <View style={styles.frequencyRow}>
              {[
                { id: 'daily', label: t.dcaDaily, icon: 'today' },
                { id: 'weekly', label: t.dcaWeekly, icon: 'calendar' },
                { id: 'biweekly', label: t.dcaBiweekly, icon: 'calendar-outline' },
                { id: 'monthly', label: t.dcaMonthly, icon: 'calendar-number' },
              ].map((freq) => (
                <TouchableOpacity
                  key={freq.id}
                  style={[
                    styles.frequencyBtn,
                    { 
                      backgroundColor: dcaFrequency === freq.id 
                        ? '#f59e0b20' 
                        : isDark ? '#1e293b' : '#f1f5f9',
                      borderColor: dcaFrequency === freq.id ? '#f59e0b' : isDark ? '#334155' : '#e2e8f0',
                    }
                  ]}
                  onPress={() => setDcaFrequency(freq.id as any)}
                >
                  <Ionicons 
                    name={freq.icon as any} 
                    size={18} 
                    color={dcaFrequency === freq.id ? '#f59e0b' : isDark ? '#64748b' : '#94a3b8'} 
                  />
                  <Text style={[
                    styles.frequencyText,
                    { color: dcaFrequency === freq.id ? '#f59e0b' : isDark ? '#fff' : '#0f172a' }
                  ]}>
                    {freq.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Duration */}
            <Text style={[styles.tradeLabel, { color: isDark ? '#94a3b8' : '#64748b', marginTop: 16 }]}>
              {t.dcaDuration}
            </Text>
            <View style={styles.durationRow}>
              {[
                { id: 'indefinite', label: t.dcaIndefinite },
                { id: '3months', label: t.dca3Months },
                { id: '6months', label: t.dca6Months },
                { id: '1year', label: t.dca1Year },
              ].map((dur) => (
                <TouchableOpacity
                  key={dur.id}
                  style={[
                    styles.durationBtn,
                    { 
                      backgroundColor: dcaDuration === dur.id 
                        ? '#f59e0b20' 
                        : isDark ? '#1e293b' : '#f1f5f9',
                      borderColor: dcaDuration === dur.id ? '#f59e0b' : isDark ? '#334155' : '#e2e8f0',
                    }
                  ]}
                  onPress={() => setDcaDuration(dur.id as any)}
                >
                  <Text style={[
                    styles.durationText,
                    { color: dcaDuration === dur.id ? '#f59e0b' : isDark ? '#fff' : '#0f172a' }
                  ]}>
                    {dur.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* DCA Summary */}
            <View style={[styles.dcaSummary, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', marginTop: 20 }]}>
              <Text style={[styles.dcaSummaryTitle, { color: isDark ? '#fff' : '#0f172a' }]}>
                {t.dcaSummary}
              </Text>
              
              <View style={styles.dcaSummaryRow}>
                <Text style={[styles.dcaSummaryLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                  {t.dcaFrequency}
                </Text>
                <Text style={[styles.dcaSummaryValue, { color: '#f59e0b' }]}>
                  {dcaFrequency === 'daily' ? t.dcaDaily : 
                   dcaFrequency === 'weekly' ? t.dcaWeekly : 
                   dcaFrequency === 'biweekly' ? t.dcaBiweekly : t.dcaMonthly}
                </Text>
              </View>
              
              <View style={styles.dcaSummaryRow}>
                <Text style={[styles.dcaSummaryLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                  {t.dcaAmount}
                </Text>
                <Text style={[styles.dcaSummaryValue, { color: isDark ? '#fff' : '#0f172a' }]}>
                  ${dcaAmount || '0'} {dcaCurrency}
                </Text>
              </View>

              <View style={styles.dcaSummaryRow}>
                <Text style={[styles.dcaSummaryLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                  {t.dcaDuration}
                </Text>
                <Text style={[styles.dcaSummaryValue, { color: isDark ? '#fff' : '#0f172a' }]}>
                  {dcaDuration === 'indefinite' ? t.dcaIndefinite : 
                   dcaDuration === '3months' ? t.dca3Months : 
                   dcaDuration === '6months' ? t.dca6Months : t.dca1Year}
                </Text>
              </View>

              {dcaDuration !== 'indefinite' && dcaAmount && (
                <>
                  <View style={[styles.dcaDivider, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]} />
                  
                  <View style={styles.dcaSummaryRow}>
                    <Text style={[styles.dcaSummaryLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                      {t.dcaNumPurchases}
                    </Text>
                    <Text style={[styles.dcaSummaryValue, { color: isDark ? '#fff' : '#0f172a' }]}>
                      {dcaDuration === '3months' ? (dcaFrequency === 'daily' ? '90' : dcaFrequency === 'weekly' ? '13' : dcaFrequency === 'biweekly' ? '6' : '3') :
                       dcaDuration === '6months' ? (dcaFrequency === 'daily' ? '180' : dcaFrequency === 'weekly' ? '26' : dcaFrequency === 'biweekly' ? '13' : '6') :
                       (dcaFrequency === 'daily' ? '365' : dcaFrequency === 'weekly' ? '52' : dcaFrequency === 'biweekly' ? '26' : '12')}
                    </Text>
                  </View>
                  
                  <View style={styles.dcaSummaryRow}>
                    <Text style={[styles.dcaSummaryLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                      {t.dcaTotalInvestment}
                    </Text>
                    <Text style={[styles.dcaSummaryValue, { color: '#10b981', fontWeight: '700' }]}>
                      ${(parseFloat(dcaAmount || '0') * (
                        dcaDuration === '3months' ? (dcaFrequency === 'daily' ? 90 : dcaFrequency === 'weekly' ? 13 : dcaFrequency === 'biweekly' ? 6 : 3) :
                        dcaDuration === '6months' ? (dcaFrequency === 'daily' ? 180 : dcaFrequency === 'weekly' ? 26 : dcaFrequency === 'biweekly' ? 13 : 6) :
                        (dcaFrequency === 'daily' ? 365 : dcaFrequency === 'weekly' ? 52 : dcaFrequency === 'biweekly' ? 26 : 12)
                      )).toLocaleString()}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </ScrollView>

          {/* Start DCA Button */}
          <View style={[styles.tradeActionContainer, { paddingBottom: insets.bottom + 12, borderTopColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
            <TouchableOpacity
              style={[
                styles.tradeActionBtn,
                { 
                  backgroundColor: dcaAmount && parseFloat(dcaAmount) >= 10 ? '#f59e0b' : isDark ? '#334155' : '#e2e8f0',
                }
              ]}
              activeOpacity={0.8}
              disabled={!dcaAmount || parseFloat(dcaAmount) < 10}
              onPress={() => {
                if (!dcaAmount || parseFloat(dcaAmount) < 10) {
                  showAlert(t.error, t.dcaMinAmount, 'error');
                  return;
                }
                
                // Simulate DCA plan creation
                showAlert(
                  t.success,
                  `${t.dcaPlanCreated}\n\n${t.dcaNextPurchase}: ${new Date().toLocaleDateString()}`,
                  'success'
                );
                setDcaModalVisible(false);
              }}
            >
              <Ionicons name="repeat" size={20} color="#fff" />
              <Text style={styles.tradeActionText}>{t.dcaStartPlan}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      <AlertComponent />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  
  // Banner styles
  bannerContainer: { marginBottom: 16 },
  banner: { borderRadius: 16, overflow: 'hidden' },
  bannerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  bannerTextContainer: { flex: 1 },
  bannerTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  bannerSubtitle: { fontSize: 12 },
  bannerBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  bannerBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  // Trending section
  trendingSection: { marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, paddingHorizontal: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  trendingCards: { flexDirection: 'row', gap: 8 },
  trendingCard: { 
    flex: 1,
    padding: 10, 
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  trendingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  trendingIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  trendingIconImage: { width: 18, height: 18 },
  trendingCryptoIcon: { fontSize: 14, fontWeight: '700' },
  trendBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6, gap: 2 },
  trendBadgeText: { fontSize: 8, fontWeight: '600' },
  trendingSymbol: { fontSize: 12, fontWeight: '700', marginBottom: 4 },
  trendingPriceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  trendingPrice: { fontSize: 12, fontWeight: '700' },
  trendingChange: { fontSize: 9, fontWeight: '600' },
  trendingBar: { flexDirection: 'row', height: 3, borderRadius: 2, overflow: 'hidden', backgroundColor: '#e2e8f0' },
  trendingBarFill: { height: '100%' },
  trendingBarLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  trendingBarLabel: { fontSize: 8, fontWeight: '500' },

  // List section
  listSection: { borderRadius: 12, overflow: 'hidden', marginBottom: 4 },
  
  // DCA Button
  dcaButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    borderRadius: 12, 
    marginVertical: 12,
    borderWidth: 1,
    gap: 12,
  },
  dcaIconBg: { 
    width: 44, 
    height: 44, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  dcaTextContainer: { flex: 1 },
  dcaTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  dcaDesc: { fontSize: 12 },
  
  tableHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingTop: 12, paddingBottom: 6 },
  headerTitle: { flex: 1, fontSize: 13, fontWeight: '600', marginLeft: 44 },
  headerLabel: { width: 70, fontSize: 9, textAlign: 'center' },

  metalRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1 },
  metalLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  metalIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  metalImage: { width: 22, height: 22 },
  auxmIconFallback: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  auxmIconText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  cryptoIconText: {
    fontSize: 16,
    fontWeight: '700',
  },
  usdtIconFallback: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  usdtIconText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  metalSymbol: { fontSize: 13, fontWeight: '600' },
  metalName: { fontSize: 10, marginTop: 1 },
  metalPrice: { width: 70, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  changeValue: { width: 70, fontSize: 11, fontWeight: '500', textAlign: 'right' },

  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 8 },
  closeBtn: { padding: 4 },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modalIcon: { width: 36, height: 36 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalSubtitle: { fontSize: 11 },
  
  priceSection: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, gap: 10 },
  modalPrice: { fontSize: 28, fontWeight: 'bold' },
  changeBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4 },
  modalChange: { fontSize: 13, fontWeight: '600' },
  
  chartContainer: { flex: 1 },
  chart: { flex: 1 },
  loadingContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },

  actionButtons: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, gap: 12 },
  actionBtn: { 
    flex: 1, 
    flexDirection: 'row',
    alignItems: 'center', 
    justifyContent: 'center',
    paddingVertical: 14, 
    borderRadius: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buyBtn: { backgroundColor: '#10b981' },
  sellBtn: { backgroundColor: '#ef4444' },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Info Box styles
  infoBox: {
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  infoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10b98115',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  findAssetsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  findAssetsBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Allocation Modal styles
  allocationModal: {
    flex: 1,
  },
  allocationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  allocationTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  allocationContent: {
    flex: 1,
    padding: 16,
  },
  vaultCard: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  vaultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  vaultFlag: {
    fontSize: 28,
    marginRight: 12,
  },
  vaultInfo: {
    flex: 1,
  },
  vaultCity: {
    fontSize: 15,
    fontWeight: '600',
  },
  vaultCountry: {
    fontSize: 12,
    marginTop: 2,
  },
  securityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  securityText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '700',
  },
  vaultDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vaultMetals: {
    flexDirection: 'row',
    gap: 6,
  },
  metalTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  metalTagIcon: {
    width: 14,
    height: 14,
  },
  metalTagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  vaultCapacity: {
    fontSize: 11,
  },
  infoFooter: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
    gap: 10,
  },
  infoFooterText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },

  // Trade Modal styles
  tradeModalContainer: {
    flex: 1,
  },
  tradeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  tradeModalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tradeModalIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tradeModalIconImage: {
    width: 20,
    height: 20,
  },
  tradeModalTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  tradeModalContent: {
    flex: 1,
    padding: 16,
  },
  bonusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#a855f710',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
    gap: 6,
  },
  bonusBannerText: {
    flex: 1,
    fontSize: 11,
    color: '#a855f7',
    fontWeight: '500',
  },
  orderTypeTabs: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
    marginBottom: 14,
  },
  orderTypeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 5,
  },
  orderTypeTabActive: {
    backgroundColor: '#3b82f6',
  },
  orderTypeTabText: {
    fontSize: 12,
    fontWeight: '500',
  },
  limitPriceSection: {
    marginBottom: 14,
  },
  dollarSign: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 4,
  },
  limitPriceInput: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'monospace',
    fontWeight: '600',
    paddingVertical: 10,
  },
  limitPriceHint: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  limitPriceHintText: {
    fontSize: 10,
  },
  limitPriceSaving: {
    fontSize: 10,
    color: '#10b981',
    fontWeight: '600',
  },
  currencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  tradeLabel: {
    fontSize: 11,
    marginBottom: 8,
    fontWeight: '500',
  },
  currencyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    gap: 2,
  },
  currencyIcon: {
    fontSize: 10,
  },
  currencyName: {
    fontSize: 8,
    fontWeight: '600',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 4,
  },
  balanceLabel: {
    fontSize: 11,
  },
  balanceValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  balanceAmount: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '500',
  },
  bonusAmount: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#a855f7',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 2,
    marginBottom: 10,
  },
  amountInput: {
    flex: 1,
    fontSize: 20,
    fontFamily: 'monospace',
    fontWeight: '600',
    paddingVertical: 10,
  },
  amountCurrency: {
    fontSize: 13,
    fontWeight: '500',
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  quickAmountBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  quickAmountText: {
    fontSize: 11,
    fontWeight: '500',
  },
  arrowDivider: {
    alignItems: 'center',
    marginVertical: 6,
  },
  arrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiveBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
    marginBottom: 14,
  },
  receiveIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiveIconImage: {
    width: 24,
    height: 24,
  },
  receiveInfo: {
    flex: 1,
  },
  receiveAmount: {
    fontSize: 17,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  receivePrice: {
    fontSize: 11,
    marginTop: 2,
  },
  bonusInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#a855f715',
    borderRadius: 8,
    padding: 10,
    gap: 6,
    marginBottom: 14,
  },
  bonusInfoIcon: {
    fontSize: 14,
  },
  bonusInfoText: {
    fontSize: 11,
    color: '#a855f7',
    fontFamily: 'monospace',
  },
  tradeSummary: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  limitOrderInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 8,
    gap: 8,
    marginBottom: 14,
  },
  limitOrderInfoText: {
    flex: 1,
    fontSize: 11,
    color: '#3b82f6',
    lineHeight: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  summaryLabel: {
    fontSize: 12,
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  tradeButtonContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  tradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  tradeButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },

  // New Modal Tab Styles
  modalTabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 12,
  },
  modalTabBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  modalTabBtnActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#10b981',
  },
  modalTabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabContentScroll: {
    flex: 1,
    padding: 16,
  },
  priceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10b98120',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#10b981',
  },
  priceStats: {
    alignItems: 'flex-end',
  },
  priceStat: {
    fontSize: 10,
    marginBottom: 2,
  },
  infoCard: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 12,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  minimalActions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  minimalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  minimalBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  ordersSection: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  ordersColumns: {
    flexDirection: 'row',
    gap: 12,
  },
  ordersColumn: {
    flex: 1,
  },
  ordersColumnTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  orderItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderTypeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  orderAmount: {
    fontSize: 11,
    fontWeight: '600',
  },
  orderPrice: {
    fontSize: 10,
  },
  orderDate: {
    fontSize: 9,
  },
  noOrders: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 10,
  },
  // DCA Styles
  dcaInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  dcaInfoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  quickAmountRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  quickAmountBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  quickAmountText: {
    fontSize: 12,
    fontWeight: '600',
  },
  frequencyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  frequencyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  frequencyText: {
    fontSize: 12,
    fontWeight: '500',
  },
  durationRow: {
    flexDirection: 'row',
    gap: 8,
  },
  durationBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '500',
  },
  dcaSummary: {
    padding: 14,
    borderRadius: 12,
  },
  dcaSummaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  dcaSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dcaSummaryLabel: {
    fontSize: 13,
  },
  dcaSummaryValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  dcaDivider: {
    height: 1,
    marginVertical: 10,
  },

  // Allocation Warning Styles
  allocationWarningContainer: {
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  allocationWarningIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  allocationWarningTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  allocationWarningSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  allocationInfoBox: {
    width: '100%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  allocationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  allocationRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  allocationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  allocationLabel: {
    fontSize: 14,
  },
  allocationValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  allocationNote: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
  },
  allocationButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  allocationAddBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  allocationAddBtnLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  allocationAddBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  allocationContinueBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f59e0b',
  },
  allocationContinueBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  // Quote Confirmation Styles
  quoteConfirmContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  quoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  quoteTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countdownText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  quoteDetails: {
    gap: 8,
    marginBottom: 12,
  },
  quoteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quoteLabel: {
    fontSize: 14,
  },
  quoteValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  quoteNote: {
    fontSize: 12,
    textAlign: 'center',
  },

});