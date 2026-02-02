// services/ConvertService.ts
// Convert Service - Metal to Metal Conversion via On-chain Exchange

import walletService, { CONTRACTS } from './WalletService';
import balanceService from './BalanceService';
import { ethers } from 'ethers';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ConversionQuote {
  fromMetal: string;
  toMetal: string;
  fromAmount: number;
  toAmount: number;
  rate: number;
  fee: number;
  feePercent: number;
  priceImpact: number;
  expiresAt: number;
}

export interface ConversionResult {
  success: boolean;
  txHash?: string;
  fromAmount?: number;
  toAmount?: number;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const CONVERSION_FEE_PERCENT = 0.3; // 0.3% fee
const QUOTE_VALIDITY_SECONDS = 30;

const METAL_TOKENS: Record<string, string> = {
  AUXG: CONTRACTS.AUXG,
  AUXS: CONTRACTS.AUXS,
  AUXPT: CONTRACTS.AUXPT,
  AUXPD: CONTRACTS.AUXPD,
};

// ═══════════════════════════════════════════════════════════════════════════
// CONVERT SERVICE CLASS
// ═══════════════════════════════════════════════════════════════════════════

class ConvertService {
  private currentQuote: ConversionQuote | null = null;

  // ═══════════════════════════════════════════════════════════════════════════
  // QUOTE
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get conversion quote
   */
  async getQuote(
    fromMetal: string,
    toMetal: string,
    fromAmount: number,
    metalPrices: Record<string, number>
  ): Promise<{ success: boolean; quote?: ConversionQuote; error?: string }> {
    // Validate metals
    fromMetal = fromMetal.toUpperCase();
    toMetal = toMetal.toUpperCase();

    if (!METAL_TOKENS[fromMetal] || !METAL_TOKENS[toMetal]) {
      return { success: false, error: 'Invalid metal' };
    }

    if (fromMetal === toMetal) {
      return { success: false, error: 'Cannot convert to same metal' };
    }

    if (fromAmount <= 0) {
      return { success: false, error: 'Invalid amount' };
    }

    // Check balance
    const balanceCheck = await balanceService.hasSufficientBalance(fromMetal, fromAmount);
    if (!balanceCheck.sufficient) {
      return { 
        success: false, 
        error: `Insufficient balance. Available: ${balanceCheck.available.toFixed(2)}g` 
      };
    }

    // Get prices
    const fromPrice = metalPrices[fromMetal];
    const toPrice = metalPrices[toMetal];

    if (!fromPrice || !toPrice) {
      return { success: false, error: 'Price data unavailable' };
    }

    // Calculate conversion
    const fromValue = fromAmount * fromPrice;
    const fee = fromValue * (CONVERSION_FEE_PERCENT / 100);
    const netValue = fromValue - fee;
    const toAmount = netValue / toPrice;
    const rate = toAmount / fromAmount;

    // Try to get on-chain rate if wallet connected
    let onChainRate: { toAmount: string; fee: string } | null = null;
    try {
      const fromAmountWei = ethers.parseUnits(fromAmount.toString(), 18).toString();
      onChainRate = await walletService.getExchangeRate(fromMetal, toMetal, fromAmountWei);
    } catch {
      // Use calculated rate
    }

    // Build quote
    const quote: ConversionQuote = {
      fromMetal,
      toMetal,
      fromAmount,
      toAmount: onChainRate 
        ? parseFloat(ethers.formatUnits(onChainRate.toAmount, 18))
        : toAmount,
      rate,
      fee: onChainRate 
        ? parseFloat(ethers.formatUnits(onChainRate.fee, 18))
        : fee / fromPrice, // Convert fee to fromMetal terms
      feePercent: CONVERSION_FEE_PERCENT,
      priceImpact: 0, // Would need liquidity depth to calculate
      expiresAt: Date.now() + (QUOTE_VALIDITY_SECONDS * 1000),
    };

    this.currentQuote = quote;

    return { success: true, quote };
  }

  /**
   * Get current quote
   */
  getCurrentQuote(): ConversionQuote | null {
    if (!this.currentQuote) return null;
    
    // Check if expired
    if (Date.now() > this.currentQuote.expiresAt) {
      this.currentQuote = null;
      return null;
    }

    return this.currentQuote;
  }

  /**
   * Clear current quote
   */
  clearQuote(): void {
    this.currentQuote = null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXECUTION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Execute conversion
   */
  async convert(
    fromMetal: string,
    toMetal: string,
    fromAmount: number
  ): Promise<ConversionResult> {
    const walletState = walletService.getState();
    
    if (!walletState.isConnected) {
      return { success: false, error: 'Wallet not connected' };
    }

    // Validate metals
    fromMetal = fromMetal.toUpperCase();
    toMetal = toMetal.toUpperCase();

    if (!METAL_TOKENS[fromMetal] || !METAL_TOKENS[toMetal]) {
      return { success: false, error: 'Invalid metal' };
    }

    // Convert amount to wei
    const amountWei = ethers.parseUnits(fromAmount.toString(), 18).toString();

    // Execute swap via wallet service
    const result = await walletService.swapMetals(fromMetal, toMetal, amountWei);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    // Clear quote after successful conversion
    this.clearQuote();

    // Clear balance cache
    balanceService.clearCache();

    return {
      success: true,
      txHash: result.txHash,
      fromAmount,
      toAmount: result.toAmount 
        ? parseFloat(ethers.formatUnits(result.toAmount, 18))
        : undefined,
    };
  }

  /**
   * Execute current quote
   */
  async executeQuote(): Promise<ConversionResult> {
    const quote = this.getCurrentQuote();
    
    if (!quote) {
      return { success: false, error: 'No active quote or quote expired' };
    }

    return this.convert(quote.fromMetal, quote.toMetal, quote.fromAmount);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get available conversion pairs
   */
  getConversionPairs(): Array<{ from: string; to: string }> {
    const metals = Object.keys(METAL_TOKENS);
    const pairs: Array<{ from: string; to: string }> = [];

    for (const from of metals) {
      for (const to of metals) {
        if (from !== to) {
          pairs.push({ from, to });
        }
      }
    }

    return pairs;
  }

  /**
   * Calculate reverse - how much fromMetal needed for specific toMetal amount
   */
  calculateReverse(
    toMetal: string,
    toAmount: number,
    metalPrices: Record<string, number>,
    fromMetal: string
  ): number {
    const fromPrice = metalPrices[fromMetal.toUpperCase()];
    const toPrice = metalPrices[toMetal.toUpperCase()];

    if (!fromPrice || !toPrice) return 0;

    const toValue = toAmount * toPrice;
    const grossValue = toValue / (1 - CONVERSION_FEE_PERCENT / 100);
    return grossValue / fromPrice;
  }

  /**
   * Format quote for display
   */
  formatQuote(quote: ConversionQuote, language: 'en' | 'tr' = 'en'): {
    fromLabel: string;
    toLabel: string;
    rateLabel: string;
    feeLabel: string;
    expiresLabel: string;
  } {
    const remaining = Math.max(0, Math.floor((quote.expiresAt - Date.now()) / 1000));

    return {
      fromLabel: `${quote.fromAmount.toFixed(2)}g ${quote.fromMetal}`,
      toLabel: `${quote.toAmount.toFixed(4)}g ${quote.toMetal}`,
      rateLabel: `1 ${quote.fromMetal} = ${quote.rate.toFixed(4)} ${quote.toMetal}`,
      feeLabel: `${quote.feePercent}% (${quote.fee.toFixed(4)}g)`,
      expiresLabel: language === 'tr' ? `${remaining} saniye` : `${remaining}s`,
    };
  }

  /**
   * Get minimum conversion amount
   */
  getMinimumAmount(metal: string): number {
    const minimums: Record<string, number> = {
      AUXG: 0.1,
      AUXS: 1,
      AUXPT: 0.1,
      AUXPD: 0.1,
    };
    return minimums[metal.toUpperCase()] || 0.1;
  }
}

export const convertService = new ConvertService();
export default convertService;
