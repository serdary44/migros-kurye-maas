// Default values (Region 2 & 3 - June 2026 rates)
export const DEFAULT_HOURLY_RATE = 177; // TL
export const DEFAULT_SENIORITY_SUPPORT = 2250; // TL (2. Yıl Kıdem)
export const DEFAULT_RELIEF_FUND = 180; // TL (Yardım Fonu Kesintisi)
export const DEFAULT_DUES_INSTALLMENTS = 1200; // TL (Aidat & Taksit)
export const DEFAULT_VAT_RATE = 20; // % KDV
export const DEFAULT_WITHHOLDING_RATE = 20; // % Tevkifat (KDV'nin 2/10'u yani %20'si)

// Daily Package Premium Brackets (Günlük Paket Primi Baremleri)
export const DAILY_PREMIUM_BRACKETS = [
  { min: 20, max: 23, premium: 255 },
  { min: 24, max: 27, premium: 505 },
  { min: 28, max: 33, premium: 770 },
  { min: 34, max: 37, premium: 1180 },
  { min: 38, max: 42, premium: 1595 },
  { min: 43, max: 48, premium: 2040 },
  { min: 49, max: 54, premium: 2550 },
  { min: 55, max: 58, premium: 3055 },
  { min: 59, max: 63, premium: 3390 },
  { min: 64, max: 69, premium: 3815 },
  { min: 70, max: 75, premium: 4320 },
  { min: 76, max: Infinity, premium: 4830 }
];

// Monthly Bonus Brackets (Aylık Paket Bonusu Baremleri)
export const MONTHLY_BONUS_BRACKETS = [
  { min: 700, max: 799, bonus: 12800 },
  { min: 800, max: 899, bonus: 20224 },
  { min: 900, max: 999, bonus: 27520 },
  { min: 1000, max: 1199, bonus: 33408 },
  { min: 1200, max: 1399, bonus: 40300 },
  { min: 1400, max: 1599, bonus: 47970 },
  { min: 1600, max: 1799, bonus: 55698 },
  { min: 1800, max: Infinity, bonus: 68575 }
];

// Migros Yemek distance-based extra support (Mesafe Desteği)
export const FOOD_DISTANCE_SUPPORT = {
  medium: 25, // 4-6 Km arası için +25 TL
  long: 35   // 6+ Km üzeri için +35 TL
};

// Old rates for verification tests (Haziran Mutabakatı doğrulaması için)
export const OLD_VERIFICATION_CONSTANTS = {
  HOURLY_RATE: 147.50,
  SENIORITY_SUPPORT: 2250,
  RELIEF_FUND: 180,
  DUES_INSTALLMENTS: 1200,
  VAT_RATE: 20,
  WITHHOLDING_RATE: 20,
  DAILY_PREMIUM_BRACKETS: [
    { min: 20, max: 23, premium: 200 }, // Estimated old rates to match June invoice
    { min: 24, max: 27, premium: 400 },
    { min: 28, max: 33, premium: 600 },
    { min: 34, max: 37, premium: 900 },
    { min: 38, max: 42, premium: 1250 },
    { min: 43, max: 48, premium: 1600 },
    { min: 49, max: 54, premium: 2000 },
    { min: 55, max: 58, premium: 2400 },
    { min: 59, max: 63, premium: 2700 },
    { min: 64, max: 69, premium: 3000 },
    { min: 70, max: 75, premium: 3400 },
    { min: 76, max: Infinity, premium: 3800 }
  ],
  MONTHLY_BONUS_BRACKETS: [
    { min: 700, max: 799, bonus: 10000 },
    { min: 800, max: 899, bonus: 16000 },
    { min: 900, max: 999, bonus: 22000 },
    { min: 1000, max: 1199, bonus: 27840 }, // June invoice has exactly 27840 bonus for 1048 packets
    { min: 1200, max: 1399, bonus: 32000 },
    { min: 1400, max: 1599, bonus: 38000 },
    { min: 1600, max: 1799, bonus: 44000 },
    { min: 1800, max: Infinity, bonus: 54000 }
  ]
};
