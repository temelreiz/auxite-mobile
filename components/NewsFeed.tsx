// components/NewsFeed.tsx
// Auxite Mobile App - Admin Panel'den yönetilen haberler

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/stores/useStore';
import { fetchNews, type NewsItem } from '@/services/adminApi';

// Fallback translations
const newsFeedTranslations: Record<string, Record<string, string>> = {
  tr: { news: 'Haberler', showAll: 'Tümünü Gör', showLess: 'Daha Az', noNews: 'Haber yok' },
  en: { news: 'News', showAll: 'Show All', showLess: 'Show Less', noNews: 'No news' },
  de: { news: 'Nachrichten', showAll: 'Alle anzeigen', showLess: 'Weniger', noNews: 'Keine Nachrichten' },
  fr: { news: 'Actualités', showAll: 'Tout voir', showLess: 'Moins', noNews: 'Pas de nouvelles' },
  ar: { news: 'الأخبار', showAll: 'عرض الكل', showLess: 'أقل', noNews: 'لا توجد أخبار' },
  ru: { news: 'Новости', showAll: 'Показать все', showLess: 'Меньше', noNews: 'Нет новостей' },
};

interface NewsFeedProps {
  maxItems?: number;
  showHeader?: boolean;
  onNewsPress?: (news: NewsItem) => void;
}

export default function NewsFeed({ maxItems = 5, showHeader = true, onNewsPress }: NewsFeedProps) {
  const colorScheme = useColorScheme();
  const { theme, language } = useStore();
  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  const t = newsFeedTranslations[language] || newsFeedTranslations.en;

  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => { loadNews(); }, [language]);

  const loadNews = async () => {
    try {
      setLoading(true);
      const fetchedNews = await fetchNews(language);
      setNews(fetchedNews);
    } catch (error) {
      console.error('News load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (iconName: string): keyof typeof Ionicons.glyphMap => {
    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      'gift': 'gift-outline', 'trending-up': 'trending-up', 'package': 'cube-outline',
      'alert': 'alert-circle-outline', 'info': 'information-circle-outline', 'star': 'star-outline',
      'rocket': 'rocket-outline', 'shield': 'shield-checkmark-outline',
    };
    return iconMap[iconName] || 'newspaper-outline';
  };

  if (loading) {
    return <View style={[styles.container, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}><ActivityIndicator color="#10b981" /></View>;
  }

  if (news.length === 0) return null;

  const displayNews = expanded ? news : news.slice(0, maxItems);

  return (
    <View style={styles.container}>
      {showHeader && (
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="newspaper-outline" size={18} color={isDark ? '#64748b' : '#94a3b8'} />
            <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#0f172a' }]}>{t.news}</Text>
          </View>
          {news.length > maxItems && (
            <TouchableOpacity onPress={() => setExpanded(!expanded)}>
              <Text style={styles.showAll}>{expanded ? t.showLess : t.showAll}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={[styles.newsContainer, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
        {displayNews.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.newsItem, { borderBottomColor: isDark ? '#334155' : '#f1f5f9' }, index === displayNews.length - 1 && { borderBottomWidth: 0 }]}
            activeOpacity={0.7}
            onPress={() => onNewsPress?.(item)}
          >
            <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
              <Ionicons name={getIcon(item.icon)} size={18} color={item.color} />
            </View>
            <View style={styles.newsContent}>
              <Text style={[styles.newsTitle, { color: isDark ? '#fff' : '#0f172a' }]} numberOfLines={1}>{item.title}</Text>
              <Text style={[styles.newsDescription, { color: isDark ? '#94a3b8' : '#64748b' }]} numberOfLines={2}>{item.description}</Text>
              <View style={styles.newsMeta}>
                <Text style={[styles.newsSource, { color: item.color }]}>{item.source}</Text>
                <Text style={[styles.newsDate, { color: isDark ? '#64748b' : '#94a3b8' }]}>{item.date}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 10 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 15, fontWeight: '600' },
  showAll: { fontSize: 12, color: '#10b981', fontWeight: '500' },
  newsContainer: { marginHorizontal: 16, borderRadius: 12, overflow: 'hidden' },
  newsItem: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, gap: 12 },
  iconContainer: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  newsContent: { flex: 1 },
  newsTitle: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  newsDescription: { fontSize: 12, lineHeight: 16, marginBottom: 6 },
  newsMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  newsSource: { fontSize: 10, fontWeight: '600' },
  newsDate: { fontSize: 10 },
});
