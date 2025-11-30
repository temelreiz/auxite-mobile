// ============================================
// AUXITE LIGHT WALLET - ONBOARDING SYSTEM
// Non-custodial wallet with seed phrase
// ============================================

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  Animated,
  Modal,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================
// RENKLER
// ============================================
const Colors = {
  background: '#0a0e17',
  card: '#141a26',
  cardHover: '#1c2333',
  border: 'rgba(255,255,255,0.08)',
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255,255,255,0.85)',
  textMuted: 'rgba(255,255,255,0.5)',
  primary: '#00d09c',
  primaryDark: '#00b386',
  gold: '#ffc107',
  silver: '#e0e0e0',
  error: '#ff5252',
  warning: '#ffb74d',
};

// ============================================
// BIP39 WORD LIST (İlk 100 kelime - tam liste için ethers.js kullanacağız)
// ============================================
const BIP39_WORDLIST = [
  'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
  'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
  'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual',
  'adapt', 'add', 'addict', 'address', 'adjust', 'admit', 'adult', 'advance',
  'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'age', 'agent',
  'agree', 'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album',
  'alcohol', 'alert', 'alien', 'all', 'alley', 'allow', 'almost', 'alone',
  'alpha', 'already', 'also', 'alter', 'always', 'amateur', 'amazing', 'among',
  'amount', 'amused', 'analyst', 'anchor', 'ancient', 'anger', 'angle', 'angry',
  'animal', 'ankle', 'announce', 'annual', 'another', 'answer', 'antenna', 'antique',
  'anxiety', 'any', 'apart', 'apology', 'appear', 'apple', 'approve', 'april',
  'arch', 'arctic', 'area', 'arena', 'argue', 'arm', 'armed', 'armor',
  'army', 'around', 'arrange', 'arrest', 'arrive', 'arrow', 'art', 'artefact',
  'artist', 'artwork', 'ask', 'aspect', 'assault', 'asset', 'assist', 'assume',
  'asthma', 'athlete', 'atom', 'attack', 'attend', 'attitude', 'attract', 'auction',
  'audit', 'august', 'aunt', 'author', 'auto', 'autumn', 'average', 'avocado',
  'avoid', 'awake', 'aware', 'away', 'awesome', 'awful', 'awkward', 'axis',
  'baby', 'bachelor', 'bacon', 'badge', 'bag', 'balance', 'balcony', 'ball',
  'bamboo', 'banana', 'banner', 'bar', 'barely', 'bargain', 'barrel', 'base',
  'basic', 'basket', 'battle', 'beach', 'bean', 'beauty', 'because', 'become',
];

// ============================================
// ÇEVİRİLER
// ============================================
const translations = {
  tr: {
    // Onboarding
    welcome: 'Auxite Wallet\'a Hoş Geldiniz',
    welcomeSubtitle: 'Fiziksel metal destekli tokenlarınızı güvenle saklayın',
    createNewWallet: 'Yeni Cüzdan Oluştur',
    importWallet: 'Mevcut Cüzdanı İçe Aktar',
    
    // Create Wallet
    createTitle: 'Yeni Cüzdan Oluştur',
    seedPhraseTitle: 'Kurtarma İfadeniz',
    seedPhraseWarning: '⚠️ Bu 12 kelimeyi güvenli bir yere yazın. Kimseyle paylaşmayın!',
    seedPhraseInfo: 'Bu kelimeler cüzdanınıza erişmenin TEK yoludur. Kaybederseniz fonlarınızı kurtaramazsınız.',
    iWroteItDown: 'Yazdım, Devam Et',
    copyToClipboard: 'Kopyala',
    
    // Verify Seed
    verifyTitle: 'Kurtarma İfadesini Doğrula',
    verifySubtitle: 'Lütfen aşağıdaki kelimeleri seçin:',
    selectWord: 'Kelime #',
    verifyError: 'Yanlış kelime seçildi. Tekrar deneyin.',
    
    // Import Wallet
    importTitle: 'Cüzdanı İçe Aktar',
    importSubtitle: '12 veya 24 kelimelik kurtarma ifadenizi girin',
    enterSeedPhrase: 'Kurtarma ifadesini girin...',
    import: 'İçe Aktar',
    invalidSeedPhrase: 'Geçersiz kurtarma ifadesi',
    
    // Set PIN
    setPinTitle: 'PIN Oluştur',
    setPinSubtitle: '6 haneli güvenlik PIN\'inizi belirleyin',
    confirmPinTitle: 'PIN\'i Onayla',
    confirmPinSubtitle: 'PIN\'inizi tekrar girin',
    pinMismatch: 'PIN\'ler eşleşmiyor. Tekrar deneyin.',
    
    // Enter PIN
    enterPinTitle: 'PIN Girin',
    enterPinSubtitle: 'Cüzdanınıza erişmek için PIN girin',
    wrongPin: 'Yanlış PIN. Tekrar deneyin.',
    forgotPin: 'PIN\'imi Unuttum',
    
    // Biometric
    useBiometric: 'Biyometrik ile giriş',
    enableBiometric: 'Biyometrik Etkinleştir',
    
    // Recovery
    viewSeedPhrase: 'Kurtarma İfadesini Gör',
    viewSeedWarning: 'Kurtarma ifadenizi görmek için PIN\'inizi girin',
    
    // Buttons
    continue: 'Devam',
    back: 'Geri',
    cancel: 'İptal',
    confirm: 'Onayla',
    done: 'Tamam',
    
    // Security
    securityTip: 'Güvenlik İpucu',
    neverShare: 'Kurtarma ifadenizi asla kimseyle paylaşmayın',
    noScreenshot: 'Ekran görüntüsü almayın',
    writeOnPaper: 'Kağıda yazıp güvenli bir yerde saklayın',
  },
  en: {
    // Onboarding
    welcome: 'Welcome to Auxite Wallet',
    welcomeSubtitle: 'Securely store your physical metal-backed tokens',
    createNewWallet: 'Create New Wallet',
    importWallet: 'Import Existing Wallet',
    
    // Create Wallet
    createTitle: 'Create New Wallet',
    seedPhraseTitle: 'Your Recovery Phrase',
    seedPhraseWarning: '⚠️ Write down these 12 words in a safe place. Never share them!',
    seedPhraseInfo: 'These words are the ONLY way to access your wallet. If you lose them, you cannot recover your funds.',
    iWroteItDown: 'I Wrote It Down, Continue',
    copyToClipboard: 'Copy',
    
    // Verify Seed
    verifyTitle: 'Verify Recovery Phrase',
    verifySubtitle: 'Please select the following words:',
    selectWord: 'Word #',
    verifyError: 'Wrong word selected. Try again.',
    
    // Import Wallet
    importTitle: 'Import Wallet',
    importSubtitle: 'Enter your 12 or 24 word recovery phrase',
    enterSeedPhrase: 'Enter recovery phrase...',
    import: 'Import',
    invalidSeedPhrase: 'Invalid recovery phrase',
    
    // Set PIN
    setPinTitle: 'Create PIN',
    setPinSubtitle: 'Set your 6-digit security PIN',
    confirmPinTitle: 'Confirm PIN',
    confirmPinSubtitle: 'Enter your PIN again',
    pinMismatch: 'PINs do not match. Try again.',
    
    // Enter PIN
    enterPinTitle: 'Enter PIN',
    enterPinSubtitle: 'Enter PIN to access your wallet',
    wrongPin: 'Wrong PIN. Try again.',
    forgotPin: 'Forgot PIN',
    
    // Biometric
    useBiometric: 'Use Biometric',
    enableBiometric: 'Enable Biometric',
    
    // Recovery
    viewSeedPhrase: 'View Recovery Phrase',
    viewSeedWarning: 'Enter your PIN to view recovery phrase',
    
    // Buttons
    continue: 'Continue',
    back: 'Back',
    cancel: 'Cancel',
    confirm: 'Confirm',
    done: 'Done',
    
    // Security
    securityTip: 'Security Tip',
    neverShare: 'Never share your recovery phrase with anyone',
    noScreenshot: 'Do not take screenshots',
    writeOnPaper: 'Write it on paper and store in a safe place',
  }
};

// ============================================
// WALLET UTILS
// ============================================

// Basit seed phrase generator (gerçek uygulamada ethers.js kullanın)
function generateSeedPhrase() {
  const words = [];
  const usedIndices = new Set();
  
  while (words.length < 12) {
    const randomIndex = Math.floor(Math.random() * BIP39_WORDLIST.length);
    if (!usedIndices.has(randomIndex)) {
      usedIndices.add(randomIndex);
      words.push(BIP39_WORDLIST[randomIndex]);
    }
  }
  
  return words;
}

// Seed'den adres türet (basitleştirilmiş - gerçekte ethers.js kullanın)
async function deriveAddressFromSeed(seedPhrase) {
  const seedString = seedPhrase.join(' ');
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    seedString
  );
  // Ethereum benzeri adres formatı
  return '0x' + hash.substring(0, 40);
}

// PIN'i hash'le
async function hashPin(pin) {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    pin + 'AUXITE_SALT_2024'
  );
}

// Seed'i şifrele (basit XOR - gerçekte AES kullanın)
async function encryptSeed(seedPhrase, pin) {
  const seedString = seedPhrase.join(',');
  const pinHash = await hashPin(pin);
  // Basit encoding - gerçek uygulamada AES-256 kullanın
  const encoded = Buffer.from(seedString).toString('base64');
  return encoded;
}

// Seed'i çöz
async function decryptSeed(encryptedSeed, pin) {
  try {
    // Basit decoding
    const decoded = Buffer.from(encryptedSeed, 'base64').toString('utf8');
    return decoded.split(',');
  } catch (error) {
    return null;
  }
}

// ============================================
// SECURE STORAGE KEYS
// ============================================
const STORAGE_KEYS = {
  HAS_WALLET: 'auxite_has_wallet',
  ENCRYPTED_SEED: 'auxite_encrypted_seed',
  PIN_HASH: 'auxite_pin_hash',
  WALLET_ADDRESS: 'auxite_wallet_address',
  BIOMETRIC_ENABLED: 'auxite_biometric_enabled',
};

// ============================================
// ONBOARDING SCREEN
// ============================================
function OnboardingScreen({ language, t, onCreateWallet, onImportWallet }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="wallet" size={48} color={Colors.primary} />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>{t('welcome')}</Text>
        <Text style={styles.subtitle}>{t('welcomeSubtitle')}</Text>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <Feather name="shield" size={20} color={Colors.primary} />
            <Text style={styles.featureText}>Non-custodial</Text>
          </View>
          <View style={styles.featureItem}>
            <Feather name="key" size={20} color={Colors.primary} />
            <Text style={styles.featureText}>Your Keys</Text>
          </View>
          <View style={styles.featureItem}>
            <Feather name="lock" size={20} color={Colors.primary} />
            <Text style={styles.featureText}>Secure</Text>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={onCreateWallet}>
            <Feather name="plus-circle" size={20} color="#fff" style={{ marginRight: 10 }} />
            <Text style={styles.primaryButtonText}>{t('createNewWallet')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={onImportWallet}>
            <Feather name="download" size={20} color={Colors.primary} style={{ marginRight: 10 }} />
            <Text style={styles.secondaryButtonText}>{t('importWallet')}</Text>
          </TouchableOpacity>
        </View>

        {/* Security Note */}
        <View style={styles.securityNote}>
          <Feather name="info" size={14} color={Colors.textMuted} />
          <Text style={styles.securityNoteText}>
            {language === 'tr' 
              ? 'Anahtarlarınız yalnızca cihazınızda saklanır' 
              : 'Your keys are stored only on your device'}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

// ============================================
// SEED PHRASE DISPLAY SCREEN
// ============================================
function SeedPhraseScreen({ language, t, seedPhrase, onContinue, onBack }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    // Clipboard.setString(seedPhrase.join(' '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.title}>{t('seedPhraseTitle')}</Text>
        
        {/* Warning Box */}
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>{t('seedPhraseWarning')}</Text>
        </View>

        {/* Seed Phrase Grid */}
        <View style={styles.seedPhraseContainer}>
          {seedPhrase.map((word, index) => (
            <View key={index} style={styles.seedWordBox}>
              <Text style={styles.seedWordNumber}>{index + 1}</Text>
              <Text style={[styles.seedWord, !revealed && styles.seedWordBlurred]}>
                {revealed ? word : '••••••'}
              </Text>
            </View>
          ))}
        </View>

        {/* Reveal Button */}
        {!revealed && (
          <TouchableOpacity 
            style={styles.revealButton} 
            onPress={() => setRevealed(true)}
          >
            <Feather name="eye" size={18} color={Colors.primary} />
            <Text style={styles.revealButtonText}>
              {language === 'tr' ? 'Kelimeleri Göster' : 'Reveal Words'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Security Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>{t('securityTip')}</Text>
          <View style={styles.tipItem}>
            <Feather name="x-circle" size={16} color={Colors.error} />
            <Text style={styles.tipText}>{t('neverShare')}</Text>
          </View>
          <View style={styles.tipItem}>
            <Feather name="x-circle" size={16} color={Colors.error} />
            <Text style={styles.tipText}>{t('noScreenshot')}</Text>
          </View>
          <View style={styles.tipItem}>
            <Feather name="check-circle" size={16} color={Colors.primary} />
            <Text style={styles.tipText}>{t('writeOnPaper')}</Text>
          </View>
        </View>

        {/* Continue Button */}
        <TouchableOpacity 
          style={[styles.primaryButton, !revealed && styles.buttonDisabled]} 
          onPress={onContinue}
          disabled={!revealed}
        >
          <Text style={styles.primaryButtonText}>{t('iWroteItDown')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ============================================
// VERIFY SEED SCREEN
// ============================================
function VerifySeedScreen({ language, t, seedPhrase, onVerified, onBack }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedWords, setSelectedWords] = useState([]);
  const [error, setError] = useState(false);
  
  // Rastgele 3 kelime seç
  const [verifyIndices] = useState(() => {
    const indices = [];
    while (indices.length < 3) {
      const idx = Math.floor(Math.random() * 12);
      if (!indices.includes(idx)) {
        indices.push(idx);
      }
    }
    return indices.sort((a, b) => a - b);
  });

  // Her adım için 4 seçenek oluştur
  const getOptions = (correctWord) => {
    const options = [correctWord];
    while (options.length < 4) {
      const randomWord = BIP39_WORDLIST[Math.floor(Math.random() * BIP39_WORDLIST.length)];
      if (!options.includes(randomWord)) {
        options.push(randomWord);
      }
    }
    // Karıştır
    return options.sort(() => Math.random() - 0.5);
  };

  const currentIndex = verifyIndices[currentStep];
  const correctWord = seedPhrase[currentIndex];
  const options = getOptions(correctWord);

  const handleSelect = (word) => {
    if (word === correctWord) {
      setError(false);
      if (currentStep < 2) {
        setSelectedWords([...selectedWords, word]);
        setCurrentStep(currentStep + 1);
      } else {
        // Doğrulama tamamlandı
        onVerified();
      }
    } else {
      setError(true);
      setTimeout(() => setError(false), 1500);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.title}>{t('verifyTitle')}</Text>
        <Text style={styles.subtitle}>{t('verifySubtitle')}</Text>

        {/* Progress */}
        <View style={styles.progressContainer}>
          {[0, 1, 2].map((step) => (
            <View 
              key={step} 
              style={[
                styles.progressDot, 
                step <= currentStep && styles.progressDotActive
              ]} 
            />
          ))}
        </View>

        {/* Current Word */}
        <View style={styles.verifyPrompt}>
          <Text style={styles.verifyPromptText}>
            {t('selectWord')}{currentIndex + 1}
          </Text>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {options.map((word, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.optionButton, error && styles.optionButtonError]}
              onPress={() => handleSelect(word)}
            >
              <Text style={styles.optionText}>{word}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Error */}
        {error && (
          <View style={styles.errorBox}>
            <Feather name="x-circle" size={16} color={Colors.error} />
            <Text style={styles.errorText}>{t('verifyError')}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ============================================
// PIN SETUP SCREEN
// ============================================
function PinSetupScreen({ language, t, onPinSet, onBack, isConfirm = false, firstPin = '' }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    // Auto focus
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  const handlePinChange = (value) => {
    const cleanValue = value.replace(/[^0-9]/g, '').substring(0, 6);
    setPin(cleanValue);
    setError(false);

    if (cleanValue.length === 6) {
      if (isConfirm) {
        if (cleanValue === firstPin) {
          onPinSet(cleanValue);
        } else {
          setError(true);
          setPin('');
        }
      } else {
        onPinSet(cleanValue);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>

        {/* Lock Icon */}
        <View style={styles.pinIconContainer}>
          <Feather name="lock" size={40} color={Colors.primary} />
        </View>

        <Text style={styles.title}>
          {isConfirm ? t('confirmPinTitle') : t('setPinTitle')}
        </Text>
        <Text style={styles.subtitle}>
          {isConfirm ? t('confirmPinSubtitle') : t('setPinSubtitle')}
        </Text>

        {/* PIN Dots */}
        <View style={styles.pinDotsContainer}>
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <View 
              key={index} 
              style={[
                styles.pinDot, 
                index < pin.length && styles.pinDotFilled,
                error && styles.pinDotError
              ]} 
            />
          ))}
        </View>

        {/* Hidden Input */}
        <TextInput
          ref={inputRef}
          style={styles.hiddenInput}
          value={pin}
          onChangeText={handlePinChange}
          keyboardType="numeric"
          maxLength={6}
          secureTextEntry
          autoFocus
        />

        {/* Error */}
        {error && (
          <View style={styles.errorBox}>
            <Feather name="x-circle" size={16} color={Colors.error} />
            <Text style={styles.errorText}>{t('pinMismatch')}</Text>
          </View>
        )}

        {/* Keypad (optional - can use system keyboard instead) */}
        <View style={styles.keypadInfo}>
          <Text style={styles.keypadInfoText}>
            {language === 'tr' ? 'Klavyeyi kullanın' : 'Use keyboard'}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ============================================
// PIN ENTRY SCREEN (Unlock)
// ============================================
function PinEntryScreen({ language, t, onUnlock, onForgotPin, storedPinHash }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  const handlePinChange = async (value) => {
    const cleanValue = value.replace(/[^0-9]/g, '').substring(0, 6);
    setPin(cleanValue);
    setError(false);

    if (cleanValue.length === 6) {
      const enteredHash = await hashPin(cleanValue);
      
      if (enteredHash === storedPinHash) {
        onUnlock(cleanValue);
      } else {
        setError(true);
        setAttempts(attempts + 1);
        setPin('');
        
        if (attempts >= 4) {
          // 5 yanlış denemeden sonra uyar
          Alert.alert(
            language === 'tr' ? 'Uyarı' : 'Warning',
            language === 'tr' 
              ? 'Çok fazla yanlış deneme. Cüzdanınızı kurtarmak için seed phrase kullanın.'
              : 'Too many wrong attempts. Use your seed phrase to recover wallet.'
          );
        }
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Lock Icon */}
        <View style={styles.pinIconContainer}>
          <Feather name="lock" size={48} color={Colors.primary} />
        </View>

        <Text style={styles.title}>{t('enterPinTitle')}</Text>
        <Text style={styles.subtitle}>{t('enterPinSubtitle')}</Text>

        {/* PIN Dots */}
        <View style={styles.pinDotsContainer}>
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <View 
              key={index} 
              style={[
                styles.pinDot, 
                index < pin.length && styles.pinDotFilled,
                error && styles.pinDotError
              ]} 
            />
          ))}
        </View>

        {/* Hidden Input */}
        <TextInput
          ref={inputRef}
          style={styles.hiddenInput}
          value={pin}
          onChangeText={handlePinChange}
          keyboardType="numeric"
          maxLength={6}
          secureTextEntry
          autoFocus
        />

        {/* Error */}
        {error && (
          <View style={styles.errorBox}>
            <Feather name="x-circle" size={16} color={Colors.error} />
            <Text style={styles.errorText}>{t('wrongPin')}</Text>
          </View>
        )}

        {/* Forgot PIN */}
        <TouchableOpacity style={styles.forgotPinButton} onPress={onForgotPin}>
          <Text style={styles.forgotPinText}>{t('forgotPin')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ============================================
// IMPORT WALLET SCREEN
// ============================================
function ImportWalletScreen({ language, t, onImport, onBack }) {
  const [seedInput, setSeedInput] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    const words = seedInput.trim().toLowerCase().split(/\s+/);
    
    if (words.length !== 12 && words.length !== 24) {
      setError(true);
      return;
    }

    // Basit doğrulama - kelimelerin geçerli olup olmadığını kontrol et
    const validWords = words.every(word => BIP39_WORDLIST.includes(word));
    
    if (!validWords) {
      setError(true);
      return;
    }

    setLoading(true);
    try {
      await onImport(words);
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.title}>{t('importTitle')}</Text>
        <Text style={styles.subtitle}>{t('importSubtitle')}</Text>

        {/* Input */}
        <View style={styles.importInputContainer}>
          <TextInput
            style={styles.importInput}
            value={seedInput}
            onChangeText={(text) => {
              setSeedInput(text);
              setError(false);
            }}
            placeholder={t('enterSeedPhrase')}
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={4}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Error */}
        {error && (
          <View style={styles.errorBox}>
            <Feather name="x-circle" size={16} color={Colors.error} />
            <Text style={styles.errorText}>{t('invalidSeedPhrase')}</Text>
          </View>
        )}

        {/* Import Button */}
        <TouchableOpacity 
          style={[styles.primaryButton, loading && styles.buttonDisabled]} 
          onPress={handleImport}
          disabled={loading || seedInput.trim().length === 0}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Feather name="download" size={20} color="#fff" style={{ marginRight: 10 }} />
              <Text style={styles.primaryButtonText}>{t('import')}</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ============================================
// MAIN WALLET ONBOARDING COMPONENT
// ============================================
export default function WalletOnboarding({ language = 'tr', onWalletReady }) {
  const [step, setStep] = useState('checking'); // checking, onboarding, create, verify, pin, confirm-pin, import, unlock
  const [seedPhrase, setSeedPhrase] = useState([]);
  const [firstPin, setFirstPin] = useState('');
  const [storedPinHash, setStoredPinHash] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);

  const t = (key) => translations[language][key] || key;

  // Check if wallet exists
  useEffect(() => {
    checkWalletExists();
  }, []);

  const checkWalletExists = async () => {
    try {
      const hasWallet = await SecureStore.getItemAsync(STORAGE_KEYS.HAS_WALLET);
      const pinHash = await SecureStore.getItemAsync(STORAGE_KEYS.PIN_HASH);
      const address = await SecureStore.getItemAsync(STORAGE_KEYS.WALLET_ADDRESS);
      
      if (hasWallet === 'true' && pinHash) {
        setStoredPinHash(pinHash);
        setWalletAddress(address);
        setStep('unlock');
      } else {
        setStep('onboarding');
      }
    } catch (error) {
      console.error('Check wallet error:', error);
      setStep('onboarding');
    }
  };

  // Create new wallet
  const handleCreateWallet = () => {
    const newSeed = generateSeedPhrase();
    setSeedPhrase(newSeed);
    setStep('create');
  };

  // After showing seed phrase
  const handleSeedContinue = () => {
    setStep('verify');
  };

  // After verifying seed
  const handleSeedVerified = () => {
    setStep('pin');
  };

  // After setting first PIN
  const handleFirstPin = (pin) => {
    setFirstPin(pin);
    setStep('confirm-pin');
  };

  // After confirming PIN
  const handleConfirmPin = async (pin) => {
    try {
      const pinHash = await hashPin(pin);
      const encryptedSeed = await encryptSeed(seedPhrase, pin);
      const address = await deriveAddressFromSeed(seedPhrase);
      
      // Store securely
      await SecureStore.setItemAsync(STORAGE_KEYS.HAS_WALLET, 'true');
      await SecureStore.setItemAsync(STORAGE_KEYS.PIN_HASH, pinHash);
      await SecureStore.setItemAsync(STORAGE_KEYS.ENCRYPTED_SEED, encryptedSeed);
      await SecureStore.setItemAsync(STORAGE_KEYS.WALLET_ADDRESS, address);
      
      setWalletAddress(address);
      onWalletReady(address, pin);
    } catch (error) {
      console.error('Save wallet error:', error);
      Alert.alert('Error', 'Failed to save wallet');
    }
  };

  // Import wallet
  const handleImportWallet = async (words) => {
    setSeedPhrase(words);
    setStep('pin');
  };

  // Unlock wallet
  const handleUnlock = (pin) => {
    onWalletReady(walletAddress, pin);
  };

  // Forgot PIN
  const handleForgotPin = () => {
    Alert.alert(
      language === 'tr' ? 'PIN\'i Sıfırla' : 'Reset PIN',
      language === 'tr' 
        ? 'Cüzdanınızı kurtarmak için seed phrase\'inizi kullanarak yeniden içe aktarmanız gerekir.'
        : 'You need to re-import your wallet using your seed phrase to recover it.',
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('import'), 
          onPress: async () => {
            // Clear stored data
            await SecureStore.deleteItemAsync(STORAGE_KEYS.HAS_WALLET);
            await SecureStore.deleteItemAsync(STORAGE_KEYS.PIN_HASH);
            await SecureStore.deleteItemAsync(STORAGE_KEYS.ENCRYPTED_SEED);
            await SecureStore.deleteItemAsync(STORAGE_KEYS.WALLET_ADDRESS);
            setStep('import');
          }
        },
      ]
    );
  };

  // Render current step
  switch (step) {
    case 'checking':
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      );

    case 'onboarding':
      return (
        <OnboardingScreen
          language={language}
          t={t}
          onCreateWallet={handleCreateWallet}
          onImportWallet={() => setStep('import')}
        />
      );

    case 'create':
      return (
        <SeedPhraseScreen
          language={language}
          t={t}
          seedPhrase={seedPhrase}
          onContinue={handleSeedContinue}
          onBack={() => setStep('onboarding')}
        />
      );

    case 'verify':
      return (
        <VerifySeedScreen
          language={language}
          t={t}
          seedPhrase={seedPhrase}
          onVerified={handleSeedVerified}
          onBack={() => setStep('create')}
        />
      );

    case 'pin':
      return (
        <PinSetupScreen
          language={language}
          t={t}
          onPinSet={handleFirstPin}
          onBack={() => setStep('verify')}
        />
      );

    case 'confirm-pin':
      return (
        <PinSetupScreen
          language={language}
          t={t}
          onPinSet={handleConfirmPin}
          onBack={() => setStep('pin')}
          isConfirm
          firstPin={firstPin}
        />
      );

    case 'import':
      return (
        <ImportWalletScreen
          language={language}
          t={t}
          onImport={handleImportWallet}
          onBack={() => setStep('onboarding')}
        />
      );

    case 'unlock':
      return (
        <PinEntryScreen
          language={language}
          t={t}
          onUnlock={handleUnlock}
          onForgotPin={handleForgotPin}
          storedPinHash={storedPinHash}
        />
      );

    default:
      return null;
  }
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Logo
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary + '40',
  },

  // Typography
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },

  // Features
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 48,
  },
  featureItem: {
    alignItems: 'center',
    marginHorizontal: 16,
  },
  featureText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 8,
  },

  // Buttons
  buttonContainer: {
    marginTop: 'auto',
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },

  // Back Button
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    padding: 8,
    zIndex: 10,
  },

  // Security Note
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    paddingVertical: 12,
  },
  securityNoteText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginLeft: 8,
  },

  // Warning Box
  warningBox: {
    backgroundColor: Colors.warning + '15',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.warning + '30',
  },
  warningText: {
    fontSize: 14,
    color: Colors.warning,
    lineHeight: 20,
  },

  // Seed Phrase
  seedPhraseContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  seedWordBox: {
    width: '31%',
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  seedWordNumber: {
    fontSize: 11,
    color: Colors.textMuted,
    marginRight: 8,
    minWidth: 18,
  },
  seedWord: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  seedWordBlurred: {
    color: Colors.textMuted,
  },

  // Reveal Button
  revealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 24,
  },
  revealButtonText: {
    fontSize: 14,
    color: Colors.primary,
    marginLeft: 8,
    fontWeight: '500',
  },

  // Tips
  tipsContainer: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    color: Colors.textMuted,
    marginLeft: 10,
    flex: 1,
  },

  // Verify
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.border,
    marginHorizontal: 6,
  },
  progressDotActive: {
    backgroundColor: Colors.primary,
  },
  verifyPrompt: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
  },
  verifyPromptText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  optionButton: {
    width: '48%',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionButtonError: {
    borderColor: Colors.error,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
  },

  // Error
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error + '15',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  errorText: {
    fontSize: 13,
    color: Colors.error,
    marginLeft: 8,
  },

  // PIN
  pinIconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  pinDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.card,
    marginHorizontal: 8,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  pinDotFilled: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pinDotError: {
    borderColor: Colors.error,
    backgroundColor: Colors.error + '30',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
  },
  keypadInfo: {
    alignItems: 'center',
    marginTop: 24,
  },
  keypadInfoText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  forgotPinButton: {
    alignItems: 'center',
    marginTop: 32,
  },
  forgotPinText: {
    fontSize: 14,
    color: Colors.primary,
  },

  // Import
  importInputContainer: {
    marginBottom: 24,
  },
  importInput: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    color: Colors.textPrimary,
    fontSize: 15,
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
