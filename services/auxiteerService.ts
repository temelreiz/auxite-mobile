// services/auxiteerService.ts
// ═══════════════════════════════════════════════════════════════════════════════
// AUXITEER TIER SYSTEM - Fee & Spread Calculation Service
// Platform: Web & Mobile Compatible
// ═══════════════════════════════════════════════════════════════════════════════

// ============================================
// TYPES & INTERFACES
// ============================================
export type TierId = 'regular' | 'core' | 'reserve' | 'vault' | 'sovereign';
export type MetalType = 'AUXG' | 'AUXS' | 'AUXPT' | 'AUXPD';
export type Language = 'tr' | 'en' | 'de' | 'fr' | 'ar' | 'ru';

export interface TierConfig {
  id: TierId;
  name: Record<Language, string>;
  spread: number | 'custom';
  fee: number | 'custom';
  color: string;
  icon: string;
  minBalance: number;
  maxBalance?: number;
  minDays: number;
  requiresKYC: boolean;
  requiresMetalAsset: boolean;
  requiresEarnPosition: boolean;
  requiresInvitation: boolean;
  requirements: Record<Language, string[]>;
  benefits: Record<Language, string[]>;
  extras?: Record<Language, string[]>;
}

export interface UserProfile {
  id: string;
  email: string;
  isKYCVerified: boolean;
  kycVerifiedAt?: Date;
  accountCreatedAt: Date;
  country: string;
  isInvited?: boolean;
  invitedBy?: string;
}

export interface UserBalance {
  totalUSD: number;
  averageBalanceUSD: number;
  balanceHistory: { date: Date; amount: number }[];
  daysWithBalance: number;
  metals: {
    AUXG: number;
    AUXS: number;
    AUXPT: number;
    AUXPD: number;
  };
  hasMetalAsset: boolean;
  hasEarnPosition: boolean;
  earnPositionValue: number;
  stakePositionValue: number;
}

export interface TierEligibility {
  tierId: TierId;
  isEligible: boolean;
  currentProgress: number; // 0-100
  missingRequirements: string[];
  nextTier?: TierId;
  daysUntilEligible?: number;
  amountUntilEligible?: number;
}

export interface TransactionQuote {
  metalType: MetalType;
  amount: number;
  amountUSD: number;
  spread: number;
  spreadAmount: number;
  fee: number;
  feeAmount: number;
  totalCost: number;
  effectivePrice: number;
  tierApplied: TierId;
  savings?: number; // Compared to regular tier
}

export interface AuxiteerStatus {
  userId: string;
  currentTier: TierId;
  tierConfig: TierConfig;
  eligibility: TierEligibility[];
  nextTierProgress: number;
  memberSince: Date;
  totalVolume: number;
  totalSavings: number;
}

// ============================================
// TIER CONFIGURATION
// ============================================
export const AUXITEER_TIERS: Record<TierId, TierConfig> = {
  regular: {
    id: 'regular',
    name: {
      tr: 'Regular',
      en: 'Regular',
      de: 'Standard',
      fr: 'Standard',
      ar: 'عادي',
      ru: 'Обычный',
    },
    spread: 1.00,
    fee: 0.35,
    color: '#64748b',
    icon: 'person-outline',
    minBalance: 0,
    minDays: 0,
    requiresKYC: false,
    requiresMetalAsset: false,
    requiresEarnPosition: false,
    requiresInvitation: false,
    requirements: {
      tr: ['Temel hesap'],
      en: ['Basic account'],
      de: ['Basiskonto'],
      fr: ['Compte de base'],
      ar: ['حساب أساسي'],
      ru: ['Базовый аккаунт'],
    },
    benefits: {
      tr: ['Standart fiyatlama', 'Temel özellikler'],
      en: ['Standard pricing', 'Basic features'],
      de: ['Standardpreise', 'Grundfunktionen'],
      fr: ['Tarification standard', 'Fonctionnalités de base'],
      ar: ['التسعير القياسي', 'الميزات الأساسية'],
      ru: ['Стандартные цены', 'Базовые функции'],
    },
  },
  core: {
    id: 'core',
    name: {
      tr: 'Auxiteer Core',
      en: 'Auxiteer Core',
      de: 'Auxiteer Core',
      fr: 'Auxiteer Core',
      ar: 'Auxiteer Core',
      ru: 'Auxiteer Core',
    },
    spread: 0.80,
    fee: 0.25,
    color: '#10b981',
    icon: 'shield-outline',
    minBalance: 10000,
    minDays: 7,
    requiresKYC: true,
    requiresMetalAsset: false,
    requiresEarnPosition: false,
    requiresInvitation: false,
    requirements: {
      tr: ['KYC tamamlandı', '≥ $10.000 ortalama bakiye', '≥ 7 gün'],
      en: ['KYC completed', '≥ $10,000 average balance', '≥ 7 days'],
      de: ['KYC abgeschlossen', '≥ $10.000 Durchschnittsguthaben', '≥ 7 Tage'],
      fr: ['KYC complété', '≥ $10.000 solde moyen', '≥ 7 jours'],
      ar: ['اكتمل KYC', '≥ 10,000$ متوسط الرصيد', '≥ 7 أيام'],
      ru: ['KYC завершен', '≥ $10,000 средний баланс', '≥ 7 дней'],
    },
    benefits: {
      tr: ['%20 spread indirimi', '%29 fee indirimi', 'Öncelikli destek'],
      en: ['20% spread reduction', '29% fee reduction', 'Priority support'],
      de: ['20% Spread-Reduktion', '29% Gebührenreduktion', 'Prioritäts-Support'],
      fr: ['20% réduction spread', '29% réduction frais', 'Support prioritaire'],
      ar: ['تخفيض 20% سبريد', 'تخفيض 29% رسوم', 'دعم أولوية'],
      ru: ['20% снижение спреда', '29% снижение комиссии', 'Приоритетная поддержка'],
    },
  },
  reserve: {
    id: 'reserve',
    name: {
      tr: 'Auxiteer Reserve',
      en: 'Auxiteer Reserve',
      de: 'Auxiteer Reserve',
      fr: 'Auxiteer Reserve',
      ar: 'Auxiteer Reserve',
      ru: 'Auxiteer Reserve',
    },
    spread: 0.65,
    fee: 0.18,
    color: '#3b82f6',
    icon: 'diamond-outline',
    minBalance: 10000,
    maxBalance: 100000,
    minDays: 30,
    requiresKYC: true,
    requiresMetalAsset: true,
    requiresEarnPosition: false,
    requiresInvitation: false,
    requirements: {
      tr: ['$10.000 - $100.000 bakiye', '≥ 30 gün ortalama bakiye', 'En az 1 metal varlığı'],
      en: ['$10,000 - $100,000 balance', '≥ 30 days average balance', 'At least 1 metal asset'],
      de: ['$10.000 - $100.000 Guthaben', '≥ 30 Tage Durchschnitt', 'Mind. 1 Metallvermögen'],
      fr: ['$10.000 - $100.000 solde', '≥ 30 jours solde moyen', 'Au moins 1 actif métal'],
      ar: ['رصيد $10,000 - $100,000', '≥ 30 يوم متوسط الرصيد', 'أصل معدني واحد على الأقل'],
      ru: ['$10,000 - $100,000 баланс', '≥ 30 дней средний баланс', 'Минимум 1 металлический актив'],
    },
    benefits: {
      tr: ['%35 spread indirimi', '%49 fee indirimi', 'Geliştirilmiş işlem önceliği', 'Özel müşteri desteği'],
      en: ['35% spread reduction', '49% fee reduction', 'Enhanced execution priority', 'Dedicated customer support'],
      de: ['35% Spread-Reduktion', '49% Gebührenreduktion', 'Verbesserte Ausführungspriorität', 'Dedizierter Support'],
      fr: ['35% réduction spread', '49% réduction frais', 'Priorité d\'exécution améliorée', 'Support client dédié'],
      ar: ['تخفيض 35% سبريد', 'تخفيض 49% رسوم', 'أولوية تنفيذ محسنة', 'دعم عملاء مخصص'],
      ru: ['35% снижение спреда', '49% снижение комиссии', 'Улучшенный приоритет исполнения', 'Персональная поддержка'],
    },
  },
  vault: {
    id: 'vault',
    name: {
      tr: 'Auxiteer Vault',
      en: 'Auxiteer Vault',
      de: 'Auxiteer Vault',
      fr: 'Auxiteer Vault',
      ar: 'Auxiteer Vault',
      ru: 'Auxiteer Vault',
    },
    spread: 0.50,
    fee: 0.12,
    color: '#8b5cf6',
    icon: 'cube-outline',
    minBalance: 100000,
    minDays: 90,
    requiresKYC: true,
    requiresMetalAsset: true,
    requiresEarnPosition: true,
    requiresInvitation: false,
    requirements: {
      tr: ['≥ $100.000 ortalama bakiye', '≥ 90 gün', 'Aktif Earn/Lease pozisyonu'],
      en: ['≥ $100,000 average balance', '≥ 90 days', 'Active Earn/Lease position'],
      de: ['≥ $100.000 Durchschnittsguthaben', '≥ 90 Tage', 'Aktive Earn/Lease-Position'],
      fr: ['≥ $100.000 solde moyen', '≥ 90 jours', 'Position Earn/Lease active'],
      ar: ['≥ $100,000 متوسط الرصيد', '≥ 90 يوم', 'موقف Earn/Lease نشط'],
      ru: ['≥ $100,000 средний баланс', '≥ 90 дней', 'Активная позиция Earn/Lease'],
    },
    benefits: {
      tr: ['%50 spread indirimi', '%66 fee indirimi', 'Öncelikli işlem penceresi', 'OTC talep hakkı'],
      en: ['50% spread reduction', '66% fee reduction', 'Priority execution window', 'OTC quote request'],
      de: ['50% Spread-Reduktion', '66% Gebührenreduktion', 'Prioritäts-Ausführungsfenster', 'OTC-Angebotsanfrage'],
      fr: ['50% réduction spread', '66% réduction frais', 'Fenêtre d\'exécution prioritaire', 'Demande de cotation OTC'],
      ar: ['تخفيض 50% سبريد', 'تخفيض 66% رسوم', 'نافذة تنفيذ أولوية', 'طلب عرض OTC'],
      ru: ['50% снижение спреда', '66% снижение комиссии', 'Приоритетное окно исполнения', 'Запрос OTC котировки'],
    },
    extras: {
      tr: ['Öncelikli execution window', 'OTC talep hakkı'],
      en: ['Priority execution window', 'OTC quote request'],
      de: ['Prioritäts-Ausführungsfenster', 'OTC-Angebotsanfrage'],
      fr: ['Fenêtre d\'exécution prioritaire', 'Demande de cotation OTC'],
      ar: ['نافذة تنفيذ أولوية', 'طلب عرض OTC'],
      ru: ['Приоритетное окно исполнения', 'Запрос OTC котировки'],
    },
  },
  sovereign: {
    id: 'sovereign',
    name: {
      tr: 'Auxiteer Sovereign',
      en: 'Auxiteer Sovereign',
      de: 'Auxiteer Sovereign',
      fr: 'Auxiteer Sovereign',
      ar: 'Auxiteer Sovereign',
      ru: 'Auxiteer Sovereign',
    },
    spread: 'custom',
    fee: 'custom',
    color: '#0f172a',
    icon: 'star-outline',
    minBalance: 500000,
    minDays: 180,
    requiresKYC: true,
    requiresMetalAsset: true,
    requiresEarnPosition: true,
    requiresInvitation: true,
    requirements: {
      tr: ['≥ $500.000 bakiye', 'Davetiye / Manuel onay', 'Özel inceleme'],
      en: ['≥ $500,000 balance', 'Invitation / Manual review', 'Special review'],
      de: ['≥ $500.000 Guthaben', 'Einladung / Manuelle Prüfung', 'Sonderprüfung'],
      fr: ['≥ $500.000 solde', 'Invitation / Examen manuel', 'Examen spécial'],
      ar: ['≥ $500,000 رصيد', 'دعوة / مراجعة يدوية', 'مراجعة خاصة'],
      ru: ['≥ $500,000 баланс', 'Приглашение / Ручная проверка', 'Специальная проверка'],
    },
    benefits: {
      tr: ['Özel spread oranları', 'Özel fee oranları', 'Özel hesap yöneticisi', 'Özel saklama seçenekleri', 'VIP etkinlik erişimi'],
      en: ['Custom spread rates', 'Custom fee rates', 'Dedicated account manager', 'Custom custody options', 'VIP event access'],
      de: ['Individuelle Spread-Raten', 'Individuelle Gebührenraten', 'Dedizierter Account Manager', 'Individuelle Verwahrungsoptionen', 'VIP-Eventszugang'],
      fr: ['Taux de spread personnalisés', 'Taux de frais personnalisés', 'Gestionnaire de compte dédié', 'Options de garde personnalisées', 'Accès aux événements VIP'],
      ar: ['معدلات سبريد مخصصة', 'معدلات رسوم مخصصة', 'مدير حساب مخصص', 'خيارات حفظ مخصصة', 'وصول VIP'],
      ru: ['Индивидуальные спреды', 'Индивидуальные комиссии', 'Персональный менеджер', 'Индивидуальное хранение', 'VIP доступ'],
    },
    extras: {
      tr: ['Özel hesap yöneticisi', 'Özel saklama & vault opsiyonları', '7/24 öncelikli destek'],
      en: ['Dedicated account manager', 'Custom custody & vault options', '24/7 priority support'],
      de: ['Dedizierter Account Manager', 'Individuelle Verwahrungs- & Tresoroptionen', '24/7 Prioritäts-Support'],
      fr: ['Gestionnaire de compte dédié', 'Options de garde & coffre personnalisées', 'Support prioritaire 24/7'],
      ar: ['مدير حساب مخصص', 'خيارات الحفظ والخزنة المخصصة', 'دعم أولوية 24/7'],
      ru: ['Персональный менеджер', 'Индивидуальное хранение', 'Приоритетная поддержка 24/7'],
    },
  },
};

// ============================================
// FLOOR LIMITS (CRITICAL - Never go below)
// ============================================
export const PRICING_FLOOR = {
  spread: 0.40, // Spread asla %0.40 altına inmez
  fee: 0.10,    // Fee asla %0.10 altına inmez
};

// ============================================
// METAL PRICES (Mock - Replace with real API)
// ============================================
export const METAL_PRICES: Record<MetalType, number> = {
  AUXG: 2650.00,  // Gold per oz
  AUXS: 31.50,    // Silver per oz
  AUXPT: 980.00,  // Platinum per oz
  AUXPD: 1050.00, // Palladium per oz
};

// Convert oz to gram
const OZ_TO_GRAM = 31.1035;

export const METAL_PRICES_PER_GRAM: Record<MetalType, number> = {
  AUXG: METAL_PRICES.AUXG / OZ_TO_GRAM,  // ~85.21
  AUXS: METAL_PRICES.AUXS / OZ_TO_GRAM,  // ~1.01
  AUXPT: METAL_PRICES.AUXPT / OZ_TO_GRAM, // ~31.51
  AUXPD: METAL_PRICES.AUXPD / OZ_TO_GRAM, // ~33.76
};

// ============================================
// AUXITEER SERVICE CLASS
// ============================================
export class AuxiteerService {
  private static instance: AuxiteerService;

  private constructor() {}

  public static getInstance(): AuxiteerService {
    if (!AuxiteerService.instance) {
      AuxiteerService.instance = new AuxiteerService();
    }
    return AuxiteerService.instance;
  }

  // ──────────────────────────────────────────
  // TIER DETERMINATION
  // ──────────────────────────────────────────
  
  /**
   * Kullanıcının mevcut tier'ını belirle
   */
  public determineTier(profile: UserProfile, balance: UserBalance): TierId {
    // Sovereign check (requires invitation)
    if (this.checkSovereignEligibility(profile, balance)) {
      return 'sovereign';
    }

    // Vault check
    if (this.checkVaultEligibility(profile, balance)) {
      return 'vault';
    }

    // Reserve check
    if (this.checkReserveEligibility(profile, balance)) {
      return 'reserve';
    }

    // Core check
    if (this.checkCoreEligibility(profile, balance)) {
      return 'core';
    }

    return 'regular';
  }

  private checkCoreEligibility(profile: UserProfile, balance: UserBalance): boolean {
    const tier = AUXITEER_TIERS.core;
    return (
      profile.isKYCVerified &&
      balance.averageBalanceUSD >= tier.minBalance &&
      balance.daysWithBalance >= tier.minDays
    );
  }

  private checkReserveEligibility(profile: UserProfile, balance: UserBalance): boolean {
    const tier = AUXITEER_TIERS.reserve;
    return (
      profile.isKYCVerified &&
      balance.averageBalanceUSD >= tier.minBalance &&
      (tier.maxBalance ? balance.averageBalanceUSD <= tier.maxBalance : true) &&
      balance.daysWithBalance >= tier.minDays &&
      balance.hasMetalAsset
    );
  }

  private checkVaultEligibility(profile: UserProfile, balance: UserBalance): boolean {
    const tier = AUXITEER_TIERS.vault;
    return (
      profile.isKYCVerified &&
      balance.averageBalanceUSD >= tier.minBalance &&
      balance.daysWithBalance >= tier.minDays &&
      balance.hasMetalAsset &&
      balance.hasEarnPosition
    );
  }

  private checkSovereignEligibility(profile: UserProfile, balance: UserBalance): boolean {
    const tier = AUXITEER_TIERS.sovereign;
    return (
      profile.isKYCVerified &&
      profile.isInvited === true &&
      balance.averageBalanceUSD >= tier.minBalance &&
      balance.daysWithBalance >= tier.minDays &&
      balance.hasMetalAsset &&
      balance.hasEarnPosition
    );
  }

  // ──────────────────────────────────────────
  // ELIGIBILITY CHECK
  // ──────────────────────────────────────────

  /**
   * Tüm tier'lar için eligibility durumunu al
   */
  public getAllEligibility(profile: UserProfile, balance: UserBalance, lang: Language = 'en'): TierEligibility[] {
    const tiers: TierId[] = ['regular', 'core', 'reserve', 'vault', 'sovereign'];
    return tiers.map(tierId => this.checkEligibility(tierId, profile, balance, lang));
  }

  /**
   * Belirli bir tier için eligibility kontrol et
   */
  public checkEligibility(
    tierId: TierId,
    profile: UserProfile,
    balance: UserBalance,
    lang: Language = 'en'
  ): TierEligibility {
    const tier = AUXITEER_TIERS[tierId];
    const missingRequirements: string[] = [];
    let progress = 0;
    let totalChecks = 0;
    let passedChecks = 0;

    // Regular is always eligible
    if (tierId === 'regular') {
      return {
        tierId,
        isEligible: true,
        currentProgress: 100,
        missingRequirements: [],
      };
    }

    // KYC Check
    if (tier.requiresKYC) {
      totalChecks++;
      if (profile.isKYCVerified) {
        passedChecks++;
      } else {
        missingRequirements.push(
          lang === 'tr' ? 'KYC doğrulaması gerekli' : 'KYC verification required'
        );
      }
    }

    // Balance Check
    totalChecks++;
    if (balance.averageBalanceUSD >= tier.minBalance) {
      passedChecks++;
    } else {
      const needed = tier.minBalance - balance.averageBalanceUSD;
      missingRequirements.push(
        lang === 'tr'
          ? `$${needed.toLocaleString()} daha bakiye gerekli`
          : `$${needed.toLocaleString()} more balance needed`
      );
    }

    // Days Check
    totalChecks++;
    if (balance.daysWithBalance >= tier.minDays) {
      passedChecks++;
    } else {
      const needed = tier.minDays - balance.daysWithBalance;
      missingRequirements.push(
        lang === 'tr'
          ? `${needed} gün daha gerekli`
          : `${needed} more days required`
      );
    }

    // Metal Asset Check
    if (tier.requiresMetalAsset) {
      totalChecks++;
      if (balance.hasMetalAsset) {
        passedChecks++;
      } else {
        missingRequirements.push(
          lang === 'tr' ? 'Metal varlığı gerekli' : 'Metal asset required'
        );
      }
    }

    // Earn Position Check
    if (tier.requiresEarnPosition) {
      totalChecks++;
      if (balance.hasEarnPosition) {
        passedChecks++;
      } else {
        missingRequirements.push(
          lang === 'tr' ? 'Aktif Earn pozisyonu gerekli' : 'Active Earn position required'
        );
      }
    }

    // Invitation Check (Sovereign only)
    if (tier.requiresInvitation) {
      totalChecks++;
      if (profile.isInvited) {
        passedChecks++;
      } else {
        missingRequirements.push(
          lang === 'tr' ? 'Davetiye gerekli' : 'Invitation required'
        );
      }
    }

    progress = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;
    const isEligible = missingRequirements.length === 0;

    // Determine next tier
    const tierOrder: TierId[] = ['regular', 'core', 'reserve', 'vault', 'sovereign'];
    const currentIndex = tierOrder.indexOf(tierId);
    const nextTier = currentIndex < tierOrder.length - 1 ? tierOrder[currentIndex + 1] : undefined;

    return {
      tierId,
      isEligible,
      currentProgress: progress,
      missingRequirements,
      nextTier,
      daysUntilEligible: tier.minDays > balance.daysWithBalance ? tier.minDays - balance.daysWithBalance : undefined,
      amountUntilEligible: tier.minBalance > balance.averageBalanceUSD ? tier.minBalance - balance.averageBalanceUSD : undefined,
    };
  }

  // ──────────────────────────────────────────
  // PRICING CALCULATION
  // ──────────────────────────────────────────

  /**
   * Tier'a göre spread oranını al
   */
  public getSpread(tierId: TierId, customSpread?: number): number {
    const tier = AUXITEER_TIERS[tierId];
    
    if (tier.spread === 'custom' && customSpread !== undefined) {
      return Math.max(customSpread, PRICING_FLOOR.spread);
    }
    
    if (typeof tier.spread === 'number') {
      return Math.max(tier.spread, PRICING_FLOOR.spread);
    }
    
    // Default for custom without specified value
    return PRICING_FLOOR.spread;
  }

  /**
   * Tier'a göre fee oranını al
   */
  public getFee(tierId: TierId, customFee?: number): number {
    const tier = AUXITEER_TIERS[tierId];
    
    if (tier.fee === 'custom' && customFee !== undefined) {
      return Math.max(customFee, PRICING_FLOOR.fee);
    }
    
    if (typeof tier.fee === 'number') {
      return Math.max(tier.fee, PRICING_FLOOR.fee);
    }
    
    // Default for custom without specified value
    return PRICING_FLOOR.fee;
  }

  /**
   * İşlem için fiyat teklifi hesapla
   */
  public calculateQuote(
    metalType: MetalType,
    amountInGrams: number,
    tierId: TierId,
    direction: 'buy' | 'sell' = 'buy',
    customSpread?: number,
    customFee?: number
  ): TransactionQuote {
    const pricePerGram = METAL_PRICES_PER_GRAM[metalType];
    const baseAmountUSD = amountInGrams * pricePerGram;
    
    const spread = this.getSpread(tierId, customSpread);
    const fee = this.getFee(tierId, customFee);
    
    const spreadAmount = baseAmountUSD * (spread / 100);
    const feeAmount = baseAmountUSD * (fee / 100);
    
    // Buy: add spread and fee | Sell: subtract spread and fee
    const totalCost = direction === 'buy'
      ? baseAmountUSD + spreadAmount + feeAmount
      : baseAmountUSD - spreadAmount - feeAmount;
    
    const effectivePrice = totalCost / amountInGrams;
    
    // Calculate savings compared to regular tier
    const regularSpread = this.getSpread('regular');
    const regularFee = this.getFee('regular');
    const regularTotal = direction === 'buy'
      ? baseAmountUSD * (1 + (regularSpread + regularFee) / 100)
      : baseAmountUSD * (1 - (regularSpread + regularFee) / 100);
    
    const savings = direction === 'buy'
      ? regularTotal - totalCost
      : totalCost - regularTotal;

    return {
      metalType,
      amount: amountInGrams,
      amountUSD: baseAmountUSD,
      spread,
      spreadAmount,
      fee,
      feeAmount,
      totalCost,
      effectivePrice,
      tierApplied: tierId,
      savings: savings > 0 ? savings : undefined,
    };
  }

  // ──────────────────────────────────────────
  // USER STATUS
  // ──────────────────────────────────────────

  /**
   * Kullanıcının tam Auxiteer durumunu al
   */
  public getAuxiteerStatus(
    profile: UserProfile,
    balance: UserBalance,
    totalVolume: number = 0,
    lang: Language = 'en'
  ): AuxiteerStatus {
    const currentTier = this.determineTier(profile, balance);
    const tierConfig = AUXITEER_TIERS[currentTier];
    const eligibility = this.getAllEligibility(profile, balance, lang);
    
    // Calculate progress to next tier
    const tierOrder: TierId[] = ['regular', 'core', 'reserve', 'vault', 'sovereign'];
    const currentIndex = tierOrder.indexOf(currentTier);
    const nextTierId = currentIndex < tierOrder.length - 1 ? tierOrder[currentIndex + 1] : null;
    
    let nextTierProgress = 100;
    if (nextTierId) {
      const nextTierEligibility = eligibility.find(e => e.tierId === nextTierId);
      nextTierProgress = nextTierEligibility?.currentProgress || 0;
    }

    // Calculate total savings (mock - should come from transaction history)
    const regularSpread = this.getSpread('regular');
    const regularFee = this.getFee('regular');
    const currentSpread = this.getSpread(currentTier);
    const currentFee = this.getFee(currentTier);
    const savingsRate = (regularSpread + regularFee) - (currentSpread + currentFee);
    const totalSavings = (totalVolume * savingsRate) / 100;

    return {
      userId: profile.id,
      currentTier,
      tierConfig,
      eligibility,
      nextTierProgress,
      memberSince: profile.accountCreatedAt,
      totalVolume,
      totalSavings,
    };
  }

  // ──────────────────────────────────────────
  // UI HELPERS
  // ──────────────────────────────────────────

  /**
   * Tier config'i al
   */
  public getTierConfig(tierId: TierId): TierConfig {
    return AUXITEER_TIERS[tierId];
  }

  /**
   * Tüm tier'ları sıralı şekilde al
   */
  public getAllTiers(): TierConfig[] {
    const order: TierId[] = ['regular', 'core', 'reserve', 'vault', 'sovereign'];
    return order.map(id => AUXITEER_TIERS[id]);
  }

  /**
   * Tier karşılaştırma tablosu oluştur
   */
  public getTierComparison(lang: Language = 'en'): Array<{
    tier: TierConfig;
    spreadDiscount: string;
    feeDiscount: string;
  }> {
    const regularSpread = this.getSpread('regular');
    const regularFee = this.getFee('regular');

    return this.getAllTiers().map(tier => {
      const spread = typeof tier.spread === 'number' ? tier.spread : null;
      const fee = typeof tier.fee === 'number' ? tier.fee : null;

      let spreadDiscount = '-';
      let feeDiscount = '-';

      if (spread !== null && tier.id !== 'regular') {
        const discount = Math.round(((regularSpread - spread) / regularSpread) * 100);
        spreadDiscount = `${discount}%`;
      }

      if (fee !== null && tier.id !== 'regular') {
        const discount = Math.round(((regularFee - fee) / regularFee) * 100);
        feeDiscount = `${discount}%`;
      }

      if (tier.id === 'sovereign') {
        spreadDiscount = lang === 'tr' ? 'Özel' : 'Custom';
        feeDiscount = lang === 'tr' ? 'Özel' : 'Custom';
      }

      return {
        tier,
        spreadDiscount,
        feeDiscount,
      };
    });
  }

  /**
   * UI için pricing notu oluştur
   */
  public getPricingNote(tierId: TierId, lang: Language = 'en'): string {
    const notes: Record<Language, string> = {
      tr: 'Fiyatlama, Auxiteer statünüze göre ayarlanmıştır.',
      en: 'Pricing is adjusted based on your Auxiteer status.',
      de: 'Die Preise werden basierend auf Ihrem Auxiteer-Status angepasst.',
      fr: 'Les prix sont ajustés en fonction de votre statut Auxiteer.',
      ar: 'يتم تعديل الأسعار بناءً على حالة Auxiteer الخاصة بك.',
      ru: 'Цены корректируются в зависимости от вашего статуса Auxiteer.',
    };
    return notes[lang];
  }

  /**
   * UI için tooltip metni oluştur
   */
  public getPricingTooltip(lang: Language = 'en'): string {
    const tooltips: Record<Language, string> = {
      tr: 'Auxiteer seviyeleri, hesap profiline ve piyasa koşullarına bağlı olarak fiyatlama parametrelerini etkileyebilir.',
      en: 'Auxiteer levels may affect pricing parameters based on account profile and market conditions.',
      de: 'Auxiteer-Stufen können die Preisparameter basierend auf Kontoprofil und Marktbedingungen beeinflussen.',
      fr: 'Les niveaux Auxiteer peuvent affecter les paramètres de tarification en fonction du profil du compte et des conditions du marché.',
      ar: 'قد تؤثر مستويات Auxiteer على معايير التسعير بناءً على ملف الحساب وظروف السوق.',
      ru: 'Уровни Auxiteer могут влиять на параметры ценообразования в зависимости от профиля аккаунта и рыночных условий.',
    };
    return tooltips[lang];
  }

  /**
   * Legal disclaimer metni
   */
  public getLegalDisclaimer(lang: Language = 'en'): string {
    const disclaimers: Record<Language, string> = {
      tr: 'Auxiteer programı, herhangi bir finansal getiri veya ödül vaadi içermez.',
      en: 'The Auxiteer program does not constitute a financial incentive or guaranteed return.',
      de: 'Das Auxiteer-Programm stellt keinen finanziellen Anreiz oder garantierte Rendite dar.',
      fr: 'Le programme Auxiteer ne constitue pas une incitation financière ou un rendement garanti.',
      ar: 'برنامج Auxiteer لا يشكل حافزًا ماليًا أو عائدًا مضمونًا.',
      ru: 'Программа Auxiteer не является финансовым стимулом или гарантированным доходом.',
    };
    return disclaimers[lang];
  }

  /**
   * Eligibility hatası mesajı
   */
  public getNotEligibleMessage(lang: Language = 'en'): string {
    const messages: Record<Language, string> = {
      tr: 'Bu fiyatlama seviyesi için henüz uygun değilsiniz.',
      en: 'You are not yet eligible for this pricing level.',
      de: 'Sie sind noch nicht für diese Preisstufe berechtigt.',
      fr: 'Vous n\'êtes pas encore éligible pour ce niveau de tarification.',
      ar: 'لست مؤهلاً بعد لمستوى التسعير هذا.',
      ru: 'Вы пока не соответствуете этому уровню ценообразования.',
    };
    return messages[lang];
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================
export const auxiteerService = AuxiteerService.getInstance();

// ============================================
// REACT HOOK (for React/React Native)
// ============================================
export function useAuxiteer(
  profile: UserProfile | null,
  balance: UserBalance | null,
  lang: Language = 'en'
) {
  if (!profile || !balance) {
    return {
      currentTier: 'regular' as TierId,
      tierConfig: AUXITEER_TIERS.regular,
      eligibility: [],
      isLoading: true,
      spread: auxiteerService.getSpread('regular'),
      fee: auxiteerService.getFee('regular'),
      calculateQuote: (metal: MetalType, amount: number, direction: 'buy' | 'sell' = 'buy') =>
        auxiteerService.calculateQuote(metal, amount, 'regular', direction),
    };
  }

  const status = auxiteerService.getAuxiteerStatus(profile, balance, 0, lang);

  return {
    currentTier: status.currentTier,
    tierConfig: status.tierConfig,
    eligibility: status.eligibility,
    isLoading: false,
    spread: auxiteerService.getSpread(status.currentTier),
    fee: auxiteerService.getFee(status.currentTier),
    calculateQuote: (metal: MetalType, amount: number, direction: 'buy' | 'sell' = 'buy') =>
      auxiteerService.calculateQuote(metal, amount, status.currentTier, direction),
    status,
  };
}

// ============================================
// EXAMPLE USAGE
// ============================================
/*
// React/React Native Usage:
import { auxiteerService, useAuxiteer, TierId } from '@/services/auxiteerService';

// Get user's current tier
const tier = auxiteerService.determineTier(userProfile, userBalance);

// Calculate quote with tier pricing
const quote = auxiteerService.calculateQuote('AUXG', 10, tier, 'buy');
console.log(`Total Cost: $${quote.totalCost.toFixed(2)}`);
console.log(`Savings vs Regular: $${quote.savings?.toFixed(2) || 0}`);

// Get spread/fee for tier
const spread = auxiteerService.getSpread(tier);
const fee = auxiteerService.getFee(tier);

// Using the hook
const { currentTier, spread, fee, calculateQuote } = useAuxiteer(profile, balance, 'tr');

// Get all tiers for comparison
const tiers = auxiteerService.getAllTiers();
const comparison = auxiteerService.getTierComparison('en');
*/

// ============================================
// API ENDPOINTS (Backend Implementation Guide)
// ============================================
/*
Backend API endpoints to implement:

GET /api/auxiteer/status
- Returns user's current Auxiteer status
- Response: AuxiteerStatus

GET /api/auxiteer/tiers
- Returns all tier configurations
- Response: TierConfig[]

GET /api/auxiteer/eligibility
- Returns eligibility for all tiers
- Response: TierEligibility[]

POST /api/auxiteer/quote
- Calculate transaction quote with tier pricing
- Body: { metalType, amount, direction }
- Response: TransactionQuote

POST /api/auxiteer/upgrade-check
- Check if user qualifies for tier upgrade
- Response: { eligible: boolean, newTier?: TierId }

Admin Endpoints:
POST /api/admin/auxiteer/invite
- Invite user to Sovereign tier
- Body: { userId }

PUT /api/admin/auxiteer/custom-pricing
- Set custom pricing for Sovereign users
- Body: { userId, spread, fee }

Database Schema:
- users table: Add auxiteer_tier, is_invited, invited_by, custom_spread, custom_fee
- auxiteer_history: Track tier changes over time
- transaction_log: Include tier_applied, spread, fee for each transaction
*/
