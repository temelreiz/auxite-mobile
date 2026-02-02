// components/FAQModal.tsx
// FAQ / Help Center Modal with Categories
// 6-Language Support | Dark/Light Mode

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  useColorScheme,
  LayoutAnimation,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/stores/useStore';

// ============================================
// FAQ DATA
// ============================================
interface FAQItem {
  question: { tr: string; en: string };
  answer: { tr: string; en: string };
}

interface FAQCategory {
  id: string;
  title: { tr: string; en: string };
  icon: string;
  color: string;
  items: FAQItem[];
}

const FAQ_DATA: FAQCategory[] = [
  {
    id: 'general',
    title: { tr: 'Genel', en: 'General' },
    icon: 'information-circle',
    color: '#3b82f6',
    items: [
      {
        question: { tr: 'Auxite nedir?', en: 'What is Auxite?' },
        answer: {
          tr: 'Auxite, fiziksel değerli metalleri (altın, gümüş, platin ve paladyum) dijital varlıklar aracılığıyla erişilebilir hale getiren bir finansal teknoloji platformudur.',
          en: 'Auxite is a financial technology platform that provides digital access to physical precious metals such as gold, silver, platinum, and palladium.',
        },
      },
      {
        question: { tr: 'Auxite bir kripto para borsası mı?', en: 'Is Auxite a cryptocurrency exchange?' },
        answer: {
          tr: 'Hayır. Auxite bir kripto borsası değildir. Platform, fiziksel varlıklarla desteklenen metal token\'ları ve ilgili hizmetleri sunar.',
          en: 'No. Auxite is not a cryptocurrency exchange. It provides services related to physically backed metal tokens.',
        },
      },
      {
        question: { tr: 'Auxite hangi varlıkları destekler?', en: 'What assets does Auxite support?' },
        answer: {
          tr: 'Altın (AUXG), Gümüş (AUXS), Platin (AUXPT), Paladyum (AUXPD) ve seçili kripto varlıklar.',
          en: 'Gold (AUXG), Silver (AUXS), Platinum (AUXPT), Palladium (AUXPD), and selected crypto assets.',
        },
      },
    ],
  },
  {
    id: 'tokens',
    title: { tr: 'Metal Token\'lar & RWA', en: 'Metal Tokens & RWA' },
    icon: 'cube',
    color: '#f59e0b',
    items: [
      {
        question: { tr: 'Metal token nedir?', en: 'What is a metal token?' },
        answer: {
          tr: 'Metal token\'lar, belirli bir miktar fiziksel metali temsil eden dijital varlıklardır. Her token, bire bir fiziksel karşılık prensibiyle yapılandırılır.',
          en: 'Metal tokens are digital assets representing a specific amount of physical metal, structured on a 1:1 backing principle.',
        },
      },
      {
        question: { tr: 'Token\'ların gerçekten fiziksel karşılığı var mı?', en: 'Are tokens really backed by physical assets?' },
        answer: {
          tr: 'Evet. Auxite metal token\'ları, yetkili saklayıcılar aracılığıyla fiziksel metallerle desteklenir.',
          en: 'Yes. Auxite metal tokens are backed by physical metals held by authorized custodians.',
        },
      },
      {
        question: { tr: 'Fiziksel metaller nerede saklanır?', en: 'Where are physical metals stored?' },
        answer: {
          tr: 'Metaller, yetkili ve bağımsız saklayıcılar tarafından yönetilen güvenli depolarda muhafaza edilir.',
          en: 'Metals are stored in secure vaults managed by authorized and independent custodians.',
        },
      },
      {
        question: { tr: 'Mint ve burn ne anlama gelir?', en: 'What does mint and burn mean?' },
        answer: {
          tr: 'Metal satın alındığında ilgili token oluşturulur (mint). Satış veya iade durumunda token dolaşımdan kaldırılır (burn).',
          en: 'When metal is purchased, the corresponding token is created (minted). When sold or redeemed, the token is removed from circulation (burned).',
        },
      },
    ],
  },
  {
    id: 'pricing',
    title: { tr: 'Fiyatlama, Spread & Ücretler', en: 'Pricing, Spread & Fees' },
    icon: 'pricetag',
    color: '#10b981',
    items: [
      {
        question: { tr: 'Spread nedir?', en: 'What is spread?' },
        answer: {
          tr: 'Spread, alış ve satış fiyatı arasındaki farktır ve piyasa koşullarına göre değişebilir.',
          en: 'Spread is the difference between buy and sell prices and may vary depending on market conditions.',
        },
      },
      {
        question: { tr: 'Auxiteer statüsü fiyatlamayı etkiler mi?', en: 'Does Auxiteer status affect pricing?' },
        answer: {
          tr: 'Evet. Auxiteer seviyeleri, hesap profiline bağlı olarak fiyatlama parametrelerini etkileyebilir.',
          en: 'Yes. Auxiteer levels may affect pricing parameters based on the account profile.',
        },
      },
      {
        question: { tr: 'Ücretler nerede görüntülenir?', en: 'Where can I view fees?' },
        answer: {
          tr: 'Tüm ücretler ve fiyatlama detayları işlem onayı öncesinde şeffaf şekilde gösterilir.',
          en: 'All fees and pricing details are transparently displayed before transaction confirmation.',
        },
      },
    ],
  },
  {
    id: 'auxiteer',
    title: { tr: 'Auxiteer Programı', en: 'Auxiteer Program' },
    icon: 'diamond',
    color: '#8b5cf6',
    items: [
      {
        question: { tr: 'Auxiteer nedir?', en: 'What is Auxiteer?' },
        answer: {
          tr: 'Auxiteer, Auxite ekosistemine uzun vadeli katılımı ifade eden bir statü tanımıdır.',
          en: 'Auxiteer is a status reflecting long-term participation in the Auxite ecosystem.',
        },
      },
      {
        question: { tr: 'Auxiteer bir ödül programı mı?', en: 'Is Auxiteer a rewards program?' },
        answer: {
          tr: 'Hayır. Auxiteer bir ödül veya getiri programı değildir. Statüye bağlı erişim ve fiyatlama avantajları sunar.',
          en: 'No. Auxiteer is not a reward or yield program. It provides status-based access and pricing adjustments.',
        },
      },
      {
        question: { tr: 'Auxiteer seviyemi nasıl yükseltebilirim?', en: 'How can I upgrade my Auxiteer level?' },
        answer: {
          tr: 'Ortalama bakiye, elde tutma süresi ve platform kullanım süresi gibi kriterlere göre değerlendirilirsiniz.',
          en: 'Eligibility is assessed based on average balance, holding duration, and platform usage.',
        },
      },
    ],
  },
  {
    id: 'stake',
    title: { tr: 'Stake / Earn', en: 'Stake / Earn' },
    icon: 'trending-up',
    color: '#ec4899',
    items: [
      {
        question: { tr: 'Biriktir / Stake nedir?', en: 'What is Stake / Earn?' },
        answer: {
          tr: 'Biriktir / Stake, metal varlıkların belirli bir süre kilitlenerek değerlendirilmesine olanak tanıyan bir hizmettir.',
          en: 'Stake / Earn allows metal assets to be locked for a defined period under specific terms.',
        },
      },
      {
        question: { tr: 'Getiri garanti mi?', en: 'Are returns guaranteed?' },
        answer: {
          tr: 'Hayır. Getiriler garanti edilmez ve piyasa koşullarına bağlı olarak değişebilir.',
          en: 'No. Returns are not guaranteed and may vary depending on market conditions.',
        },
      },
      {
        question: { tr: 'Kilit süresi dolmadan çıkabilir miyim?', en: 'Can I exit before the lock period ends?' },
        answer: {
          tr: 'Bazı ürünlerde erken çıkış mümkün olabilir; bu durumda koşullar ve kısıtlamalar uygulanabilir.',
          en: 'Early exit may be available for certain products, subject to applicable terms and conditions.',
        },
      },
    ],
  },
  {
    id: 'security',
    title: { tr: 'Güvenlik & KYC', en: 'Security & KYC' },
    icon: 'shield-checkmark',
    color: '#06b6d4',
    items: [
      {
        question: { tr: 'KYC neden gerekli?', en: 'Why is KYC required?' },
        answer: {
          tr: 'KYC, yasal yükümlülükler ve platform güvenliği için zorunludur.',
          en: 'KYC is required to comply with regulations and ensure platform security.',
        },
      },
      {
        question: { tr: 'Auxite güvenli mi?', en: 'Is Auxite secure?' },
        answer: {
          tr: 'Auxite, güvenlik protokolleri, erişim kontrolleri ve şeffaflık ilkeleriyle çalışır.',
          en: 'Auxite operates with security protocols, access controls, and transparency principles.',
        },
      },
    ],
  },
  {
    id: 'trust',
    title: { tr: 'Trust Center', en: 'Trust Center' },
    icon: 'ribbon',
    color: '#14b8a6',
    items: [
      {
        question: { tr: 'Trust Center nedir?', en: 'What is Trust Center?' },
        answer: {
          tr: 'Trust Center, saklama, rezerv kanıtı ve denetim süreçlerine ilişkin bilgilerin paylaşıldığı şeffaflık alanıdır.',
          en: 'The Trust Center is a transparency hub providing information on custody, reserves, and audits.',
        },
      },
      {
        question: { tr: 'Tüm raporlar hemen yayınlanır mı?', en: 'Are all reports published immediately?' },
        answer: {
          tr: 'Hayır. Raporlar, ilgili süreçler tamamlandıkça planlanan takvim doğrultusunda yayınlanır.',
          en: 'No. Reports are published according to the planned timeline as processes are completed.',
        },
      },
    ],
  },
  {
    id: 'account',
    title: { tr: 'Hesap & İşlemler', en: 'Account & Transactions' },
    icon: 'wallet',
    color: '#f97316',
    items: [
      {
        question: { tr: 'Para yatırma ve çekme nasıl yapılır?', en: 'How do I deposit and withdraw?' },
        answer: {
          tr: 'Desteklenen yöntemler üzerinden yatırma ve çekme işlemleri gerçekleştirilebilir.',
          en: 'Deposits and withdrawals can be made using supported methods.',
        },
      },
      {
        question: { tr: 'İşlemlerimi nereden takip edebilirim?', en: 'Where can I track my transactions?' },
        answer: {
          tr: 'Tüm işlemler Wallet ve İşlem Geçmişi bölümünde görüntülenebilir.',
          en: 'All transactions can be viewed in the Wallet and Transaction History sections.',
        },
      },
    ],
  },
  {
    id: 'legal',
    title: { tr: 'Yasal Uyarı', en: 'Legal Disclaimer' },
    icon: 'document-text',
    color: '#64748b',
    items: [
      {
        question: { tr: 'Yasal Uyarı', en: 'Legal Disclaimer' },
        answer: {
          tr: 'Auxite, herhangi bir yatırım tavsiyesi veya garanti edilmiş getiri sunmaz.',
          en: 'Auxite does not provide investment advice or guaranteed returns.',
        },
      },
    ],
  },
];

// ============================================
// TRANSLATIONS
// ============================================
const translations = {
  tr: {
    helpCenter: 'Yardım Merkezi',
    faq: 'Sıkça Sorulan Sorular',
    searchPlaceholder: 'Soru ara...',
    contactSupport: 'Destek ile İletişime Geç',
    categories: 'Kategoriler',
    allQuestions: 'Tüm Sorular',
    noResults: 'Sonuç bulunamadı',
  },
  en: {
    helpCenter: 'Help Center',
    faq: 'Frequently Asked Questions',
    searchPlaceholder: 'Search questions...',
    contactSupport: 'Contact Support',
    categories: 'Categories',
    allQuestions: 'All Questions',
    noResults: 'No results found',
  },
};

// ============================================
// MAIN COMPONENT
// ============================================
interface FAQModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function FAQModal({ visible, onClose }: FAQModalProps) {
  const colorScheme = useColorScheme();
  const { language, theme } = useStore();

  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  const lang = (language === 'tr' ? 'tr' : 'en') as 'tr' | 'en';
  const t = translations[lang];

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const colors = {
    primary: '#10b981',
    background: isDark ? '#0f172a' : '#f8fafc',
    surface: isDark ? '#1e293b' : '#ffffff',
    cardBg: isDark ? '#1e293b' : '#f1f5f9',
    text: isDark ? '#ffffff' : '#0f172a',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? '#334155' : '#e2e8f0',
  };

  const toggleItem = (itemId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const handleCategorySelect = (categoryId: string | null) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedCategory(categoryId);
    setExpandedItems(new Set());
  };

  const filteredCategories = selectedCategory
    ? FAQ_DATA.filter(cat => cat.id === selectedCategory)
    : FAQ_DATA;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t.helpCenter}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Category Pills */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryContainer}
          >
            <TouchableOpacity
              style={[
                styles.categoryPill,
                { 
                  backgroundColor: selectedCategory === null ? colors.primary : colors.cardBg,
                  borderColor: selectedCategory === null ? colors.primary : colors.border,
                }
              ]}
              onPress={() => handleCategorySelect(null)}
            >
              <Text style={[
                styles.categoryPillText,
                { color: selectedCategory === null ? '#fff' : colors.textSecondary }
              ]}>
                {t.allQuestions}
              </Text>
            </TouchableOpacity>
            {FAQ_DATA.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryPill,
                  { 
                    backgroundColor: selectedCategory === category.id ? category.color : colors.cardBg,
                    borderColor: selectedCategory === category.id ? category.color : colors.border,
                  }
                ]}
                onPress={() => handleCategorySelect(category.id)}
              >
                <Ionicons 
                  name={category.icon as any} 
                  size={14} 
                  color={selectedCategory === category.id ? '#fff' : category.color} 
                />
                <Text style={[
                  styles.categoryPillText,
                  { color: selectedCategory === category.id ? '#fff' : colors.text }
                ]}>
                  {category.title[lang]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* FAQ Categories */}
          {filteredCategories.map((category) => (
            <View key={category.id} style={styles.categorySection}>
              {/* Category Header */}
              {!selectedCategory && (
                <View style={styles.categoryHeader}>
                  <View style={[styles.categoryIconBg, { backgroundColor: category.color + '20' }]}>
                    <Ionicons name={category.icon as any} size={18} color={category.color} />
                  </View>
                  <Text style={[styles.categoryTitle, { color: colors.text }]}>
                    {category.title[lang]}
                  </Text>
                  <Text style={[styles.categoryCount, { color: colors.textSecondary }]}>
                    {category.items.length}
                  </Text>
                </View>
              )}

              {/* FAQ Items */}
              <View style={[styles.faqCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {category.items.map((item, index) => {
                  const itemId = `${category.id}-${index}`;
                  const isExpanded = expandedItems.has(itemId);
                  const isLast = index === category.items.length - 1;

                  return (
                    <View key={itemId}>
                      <TouchableOpacity
                        style={[
                          styles.faqItem,
                          !isLast && { borderBottomColor: colors.border, borderBottomWidth: 1 }
                        ]}
                        onPress={() => toggleItem(itemId)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.faqQuestion, { color: colors.text }]}>
                          {item.question[lang]}
                        </Text>
                        <Ionicons
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={20}
                          color={colors.textSecondary}
                        />
                      </TouchableOpacity>
                      
                      {isExpanded && (
                        <View style={[styles.faqAnswer, { backgroundColor: colors.cardBg }]}>
                          <Text style={[styles.faqAnswerText, { color: colors.textSecondary }]}>
                            {item.answer[lang]}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          ))}

          {/* Contact Support Button */}
          <TouchableOpacity 
            style={[styles.contactButton, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}
          >
            <Ionicons name="chatbubble-ellipses" size={20} color={colors.primary} />
            <Text style={[styles.contactButtonText, { color: colors.primary }]}>{t.contactSupport}</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  // Category Pills
  categoryScroll: {
    marginTop: 16,
    marginBottom: 8,
  },
  categoryContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: '500',
  },
  // Category Section
  categorySection: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  categoryIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  categoryCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  // FAQ Card
  faqCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  faqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 8,
  },
  faqAnswerText: {
    fontSize: 13,
    lineHeight: 20,
  },
  // Contact Button
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
