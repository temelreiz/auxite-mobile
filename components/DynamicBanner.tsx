// components/DynamicBanner.tsx
// Auxite Mobile App - Admin Panel'den yönetilen dinamik banner

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  useColorScheme,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useStore } from '@/stores/useStore';
import { fetchBanners, type Banner } from '@/services/adminApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AUTO_SCROLL_INTERVAL = 8000;

interface DynamicBannerProps {
  onBannerPress?: (banner: Banner) => void;
}

export default function DynamicBanner({ onBannerPress }: DynamicBannerProps) {
  const colorScheme = useColorScheme();
  const { theme, language } = useStore();
  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';

  const [banners, setBanners] = useState<Banner[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const autoScrollTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { loadBanners(); }, [language]);

  const loadBanners = async () => {
    try {
      setLoading(true);
      const fetchedBanners = await fetchBanners(language);
      setBanners(fetchedBanners);
    } catch (error) {
      console.error('Banner load error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (banners.length <= 1) return;
    
    autoScrollTimer.current = setInterval(() => {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setActiveIndex((prev) => (prev + 1) % banners.length);
        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, AUTO_SCROLL_INTERVAL);
    
    return () => { if (autoScrollTimer.current) clearInterval(autoScrollTimer.current); };
  }, [banners.length]);

  const handleBannerPress = (banner: Banner) => {
    if (onBannerPress) { onBannerPress(banner); return; }
    switch (banner.actionType) {
      case 'screen': 
        if (banner.actionValue) router.push(`/(tabs)/${banner.actionValue}` as any); 
        break;
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={[styles.bannerBox, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]} />
      </View>
    );
  }

  if (banners.length === 0) {
    return (
      <View style={styles.container}>
        <View style={[styles.bannerBox, { backgroundColor: '#10b981' }]}>
          <View style={styles.bannerContent}>
            <Text style={styles.title}>Auxite'e Hoş Geldiniz! 🎉</Text>
            <Text style={styles.subtitle}>Değerli metal yatırımlarınızı dijitalleştirin</Text>
          </View>
        </View>
      </View>
    );
  }

  const currentBanner = banners[activeIndex];

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        activeOpacity={0.9} 
        onPress={() => handleBannerPress(currentBanner)}
      >
        <Animated.View 
          style={[
            styles.bannerBox, 
            { 
              backgroundColor: currentBanner.backgroundColor || '#10b981',
              opacity: fadeAnim 
            }
          ]}
        >
          <View style={styles.bannerContent}>
            <View style={styles.textContainer}>
              <Text style={[styles.title, { color: currentBanner.textColor || '#fff' }]}>
                {typeof currentBanner.title === "object" ? currentBanner.title.tr || currentBanner.title.en : currentBanner.title}
              </Text>
              {currentBanner.subtitle && (
                <Text style={[styles.subtitle, { color: currentBanner.textColor ? `${currentBanner.textColor}cc` : '#ffffffcc' }]}>
                  {typeof currentBanner.subtitle === "object" ? currentBanner.subtitle.tr || currentBanner.subtitle.en : currentBanner.subtitle}
                </Text>
              )}
            </View>
            {currentBanner.actionType !== 'none' && (
              <View style={styles.arrowContainer}>
                <Ionicons name="chevron-forward" size={18} color={currentBanner.textColor || '#fff'} />
              </View>
            )}
          </View>
        </Animated.View>
      </TouchableOpacity>
      
      {banners.length > 1 && (
        <View style={styles.indicators}>
          {banners.map((_, index) => (
            <View 
              key={index} 
              style={[
                styles.indicator, 
                { 
                  backgroundColor: activeIndex === index ? '#10b981' : (isDark ? '#475569' : '#cbd5e1'),
                  width: activeIndex === index ? 16 : 6 
                }
              ]} 
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    marginHorizontal: 16, 
    marginTop: 4, 
    marginBottom: 8,
  },
  bannerBox: { 
    height: 80, 
    borderRadius: 12, 
    overflow: 'hidden',
  },
  bannerContent: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingVertical: 12,
  },
  textContainer: { 
    flex: 1,
  },
  title: { 
    fontSize: 15, 
    fontWeight: '700', 
    color: '#fff', 
    marginBottom: 4,
  },
  subtitle: { 
    fontSize: 12, 
    color: 'rgba(255,255,255,0.8)',
  },
  arrowContainer: { 
    width: 28, 
    height: 28, 
    borderRadius: 14, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  indicators: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 8, 
    gap: 4,
  },
  indicator: { 
    height: 6, 
    borderRadius: 3,
  },
});
