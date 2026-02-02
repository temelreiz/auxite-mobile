// components/KYCWebView.tsx
// Sumsub KYC WebView Modal
// In-app verification flow

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '@/stores/useStore';

interface Props {
  visible: boolean;
  onClose: () => void;
  accessToken: string;
  onComplete?: () => void;
}

const translations = {
  tr: { title: 'Kimlik Doğrulama', loading: 'Yükleniyor...', close: 'Kapat' },
  en: { title: 'Identity Verification', loading: 'Loading...', close: 'Close' },
  de: { title: 'Identitätsverifizierung', loading: 'Laden...', close: 'Schließen' },
  fr: { title: 'Vérification d\'identité', loading: 'Chargement...', close: 'Fermer' },
  ar: { title: 'التحقق من الهوية', loading: 'جارٍ التحميل...', close: 'إغلاق' },
  ru: { title: 'Верификация личности', loading: 'Загрузка...', close: 'Закрыть' },
};

export default function KYCWebView({ visible, onClose, accessToken, onComplete }: Props) {
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);
  const colorScheme = useColorScheme();
  const { theme, language } = useStore();

  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  const t = translations[language as keyof typeof translations] || translations.en;

  const [loading, setLoading] = useState(true);

  const colors = {
    background: isDark ? '#0F172A' : '#F8FAFC',
    surface: isDark ? '#1E293B' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#64748B',
    primary: '#10B981',
    border: isDark ? '#334155' : '#E2E8F0',
  };

  // Escape token for safe JavaScript injection
  const escapedToken = accessToken.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
  const langCode = language === 'tr' ? 'tr' : language === 'de' ? 'de' : language === 'fr' ? 'fr' : language === 'ar' ? 'ar' : language === 'ru' ? 'ru' : 'en';

  // Sumsub WebSDK HTML
  const sumsubHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { 
          width: 100%; 
          height: 100%; 
          background: ${isDark ? '#0F172A' : '#F8FAFC'}; 
        }
        #sumsub-websdk-container { 
          width: 100%; 
          height: 100%; 
          min-height: 100vh;
        }
        .loading {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 100vh;
          color: ${isDark ? '#94A3B8' : '#64748B'};
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          gap: 12px;
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid ${isDark ? '#334155' : '#E2E8F0'};
          border-top-color: #10B981;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .error {
          color: #EF4444;
          padding: 20px;
          text-align: center;
        }
        /* Hide Sumsub branding */
        .sns-footer, 
        .powered-by-sumsub,
        [class*="poweredBy"],
        [class*="powered-by"],
        [class*="PoweredBy"],
        [data-role="footer"],
        .sumsub-logo,
        iframe[src*="sumsub"] + div,
        div[class*="footer"] {
          display: none !important;
          visibility: hidden !important;
          height: 0 !important;
          overflow: hidden !important;
        }
      </style>
    </head>
    <body>
      <div id="sumsub-websdk-container">
        <div class="loading">
          <div class="spinner"></div>
          <span>Loading verification...</span>
        </div>
      </div>
      
      <script src="https://static.sumsub.com/idensic/static/sns-websdk-builder.js"></script>
      <script>
        var accessToken = "${escapedToken}";
        var currentLang = "${langCode}";
        var isDarkTheme = ${isDark};
        
        function log(msg) {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'log', message: msg }));
          }
          console.log(msg);
        }
        
        function launchSumsub() {
          log('Starting Sumsub SDK with token length: ' + accessToken.length);
          
          try {
            var snsWebSdkInstance = snsWebSdk.init(
              accessToken,
              function() {
                log('Token refresh requested');
                // Token refresh - aynı token'ı döndür (kısa süreli kullanım için)
                return Promise.resolve(accessToken);
              }
            )
            .withConf({
              theme: isDarkTheme ? 'dark' : 'light',
              lang: currentLang,
            })
            .withOptions({
              addViewportTag: false,
              adaptIframeHeight: true,
            })
            .on('idCheck.onStepCompleted', function(payload) {
              log('Step completed: ' + JSON.stringify(payload));
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'stepCompleted', payload: payload }));
            })
            .on('idCheck.onError', function(error) {
              log('SDK error: ' + JSON.stringify(error));
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', error: error }));
            })
            .on('idCheck.applicantStatus', function(payload) {
              log('Applicant status: ' + JSON.stringify(payload));
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'status', payload: payload }));
            })
            .on('idCheck.onApplicantLoaded', function(payload) {
              log('Applicant loaded');
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'loaded', payload: payload }));
            })
            .on('idCheck.onApplicantSubmitted', function(payload) {
              log('Applicant submitted');
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'completed', payload: payload }));
            })
            .on('idCheck.onApplicantResubmitted', function(payload) {
              log('Applicant resubmitted');
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'resubmitted', payload: payload }));
            })
            .onMessage(function(type, payload) {
              log('Message: ' + type);
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, payload: payload }));
            })
            .build();
            
            log('SDK built, launching...');
            snsWebSdkInstance.launch('#sumsub-websdk-container');
            log('SDK launched');
            
          } catch(e) {
            log('SDK init error: ' + e.message);
            document.getElementById('sumsub-websdk-container').innerHTML = 
              '<div class="error">Error: ' + e.message + '</div>';
          }
        }
        
        // SDK yüklendiğinde başlat
        function checkAndLaunch() {
          if (typeof snsWebSdk !== 'undefined') {
            log('snsWebSdk found, launching...');
            launchSumsub();
          } else {
            log('snsWebSdk not found, retrying...');
            setTimeout(checkAndLaunch, 500);
          }
        }
        
        // Sayfa yüklendiğinde başlat
        if (document.readyState === 'complete') {
          checkAndLaunch();
        } else {
          window.addEventListener('load', checkAndLaunch);
        }
      </script>
    </body>
    </html>
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      // Log mesajlarını console'a yaz
      if (data.type === 'log') {
        console.log('[Sumsub WebView]', data.message);
        return;
      }
      
      console.log('Sumsub message:', data.type, data.payload || data.error);

      if (data.type === 'completed' || data.type === 'idCheck.onApplicantSubmitted') {
        onComplete?.();
      }
      
      if (data.type === 'error') {
        console.error('Sumsub SDK error:', data.error);
      }
    } catch (e) {
      console.error('WebView message parse error:', e);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t.title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* WebView */}
        <View style={styles.webViewContainer}>
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t.loading}</Text>
            </View>
          )}
          <WebView
            ref={webViewRef}
            source={{ html: sumsubHTML }}
            style={styles.webView}
            onLoadEnd={() => setLoading(false)}
            onMessage={handleMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={false}
            scalesPageToFit={true}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            allowsFullscreenVideo={true}
            // Kamera izinleri
            mediaCapturePermissionGrantType="grant"
            allowsProtectedMedia={true}
            // Android için
            androidLayerType="hardware"
            mixedContentMode="always"
            // iOS için
            allowsBackForwardNavigationGestures={false}
            // Permissions
            onPermissionRequest={(request) => {
              request.grant();
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  webViewContainer: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    zIndex: 10,
  },
  loadingText: {
    fontSize: 14,
  },
});
