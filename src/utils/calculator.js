import { 
  DAILY_PREMIUM_BRACKETS, 
  MONTHLY_BONUS_BRACKETS, 
  FOOD_DISTANCE_SUPPORT 
} from './constants.js';

/**
 * Finds the daily premium based on the delivered package count.
 * @param {number} count - Number of packages delivered in a day.
 * @param {Array} brackets - Premium brackets.
 * @returns {number} Daily premium in TL.
 */
export function getDailyPremium(count, brackets = DAILY_PREMIUM_BRACKETS) {
  if (count < 20) return 0;
  const bracket = brackets.find(b => count >= b.min && count <= b.max);
  return bracket ? bracket.premium : 0;
}

/**
 * Finds the monthly bonus based on the total monthly package count.
 * @param {number} count - Total monthly packages delivered.
 * @param {Array} brackets - Monthly bonus brackets.
 * @returns {number} Monthly bonus in TL.
 */
export function getMonthlyBonus(count, brackets = MONTHLY_BONUS_BRACKETS) {
  if (count < 700) return 0;
  const bracket = brackets.find(b => count >= b.min && count <= b.max);
  return bracket ? bracket.bonus : 0;
}

/**
 * Calculates a single day's log earnings.
 * @param {Object} log - Daily log containing hours and packages.
 * @param {number} hourlyRate - Courier hourly rate.
 * @param {Array} dailyBrackets - Daily premium brackets.
 * @returns {Object} Calculated values for the day.
 */
export function calculateDailyLog(log, hourlyRate = 177, dailyBrackets = DAILY_PREMIUM_BRACKETS, vatRate = 20) {
  const hours = parseFloat(log.hours_worked || 0);
  const market = parseInt(log.market_packages || 0); // Normal packages (Market + Yemek 0-4 Km)
  const food4_6 = parseInt(log.food_packages_4_6 || 0);
  const food6plus = parseInt(log.food_packages_6plus || 0);
  const fuelExpense = parseFloat(log.fuel_expense || 0);
  const motorLeaseExpense = parseFloat(log.motor_lease_expense || 0);

  const totalPackages = market; // market represents the TOTAL packages entered in the first box
  
  // Calculate daily package premium
  const dailyPremium = getDailyPremium(totalPackages, dailyBrackets);
  
  // Calculate distance support (Yemek mesafe destegi) - divided by (1 + vatRate / 100) to get KDV-excluded value
  const rawDistanceSupport = 
    (food4_6 * FOOD_DISTANCE_SUPPORT.medium) + 
    (food6plus * FOOD_DISTANCE_SUPPORT.long);
  const distanceSupport = rawDistanceSupport / (1 + vatRate / 100);
    
  // Fixed hourly income
  const fixedIncome = hours * hourlyRate;
  
  // Daily total (KDV Hariç)
  const dailyTotalNet = fixedIncome + dailyPremium + distanceSupport;

  return {
    date: log.log_date,
    hoursWorked: hours,
    marketPackages: market,
    food4_6,
    food6plus,
    totalPackages,
    dailyPremium,
    distanceSupport: parseFloat(distanceSupport.toFixed(4)),
    fixedIncome,
    dailyTotalNet: parseFloat(dailyTotalNet.toFixed(4)),
    fuelExpense,
    motorLeaseExpense,
    totalDailyExpense: fuelExpense + motorLeaseExpense
  };
}

/**
 * Calculates the monthly totals and the final invoice payout.
 * @param {Array} logs - List of daily logs.
 * @param {Object} settings - Profile settings / rates.
 * @param {Object} customBrackets - Optional custom calculation brackets.
 * @returns {Object} Detailed monthly calculation breakdown.
 */
export function calculateMonthlyTotals(logs, settings = {}, customBrackets = {}) {
  // Extract configuration with defaults
  const hourlyRate = parseFloat(settings.hourly_rate ?? 177);
  const senioritySupport = parseFloat(settings.seniority_support ?? 2250);
  const reliefFund = parseFloat(settings.relief_fund ?? 180);
  const duesInstallments = parseFloat(settings.dues_installments ?? 1200);
  const vatRate = parseFloat(settings.vat_rate ?? 20);
  const withholdingRate = parseFloat(settings.withholding_rate ?? 20); // 2/10 is 20%
  const monthlyExtraPremiums = parseFloat(settings.monthly_extra_premiums ?? 0); // Flat monthly extra premiums (e.g. June Migros Paketbaşı Primi)

  const dailyBrackets = customBrackets.dailyPremiumBrackets || DAILY_PREMIUM_BRACKETS;
  const monthlyBrackets = customBrackets.monthlyBonusBrackets || MONTHLY_BONUS_BRACKETS;

  // Aggregate daily logs
  let totalHours = 0;
  let totalMarketPackages = 0;
  let totalFood4_6 = 0;
  let totalFood6plus = 0;
  let totalPackages = 0;
  let totalFuelExpense = 0;
  let totalMotorLeaseExpense = 0;
  
  let cumulativeFixedIncome = 0;
  let cumulativeDailyPremium = 0;
  let cumulativeDistanceSupport = 0;

  const calculatedDailyLogs = logs.map(log => {
    const calc = calculateDailyLog(log, hourlyRate, dailyBrackets, vatRate);
    totalHours += calc.hoursWorked;
    totalMarketPackages += calc.marketPackages;
    totalFood4_6 += calc.food4_6;
    totalFood6plus += calc.food6plus;
    totalPackages += calc.totalPackages;
    totalFuelExpense += calc.fuelExpense;
    totalMotorLeaseExpense += calc.motorLeaseExpense;
    
    cumulativeFixedIncome += calc.fixedIncome;
    cumulativeDailyPremium += calc.dailyPremium;
    cumulativeDistanceSupport += calc.distanceSupport;
    
    return calc;
  });

  // Calculate extra overtime income (removed, user enters total directly)
  const extraHoursIncome = 0;
  const totalFixedIncome = cumulativeFixedIncome;
  const grandTotalHours = totalHours;

  // Calculate monthly bonus
  const monthlyBonus = getMonthlyBonus(totalPackages, monthlyBrackets);

  // Migros per-packet premium (mapped to food distance support!)
  const migrosPacketPremium = cumulativeDistanceSupport;

  // Gross Earnings (KDV Hariç Toplam Gelir)
  const grossEarnings = 
    totalFixedIncome + 
    cumulativeDailyPremium + 
    migrosPacketPremium + 
    monthlyBonus + 
    senioritySupport + 
    monthlyExtraPremiums;

  // Deduct relief fund
  const netEarningsPreVat = grossEarnings - reliefFund;

  // VAT (KDV)
  const vatAmount = netEarningsPreVat * (vatRate / 100);

  // VAT Included
  const vatIncludedAmount = netEarningsPreVat + vatAmount;

  // Withholding Tax (Tevkifat - KDV'nin withholdingRate %'si, örn: 2/10 = %20)
  const withholdingAmount = vatAmount * (withholdingRate / 100);

  // Invoice total after withholding
  const invoiceTotal = vatIncludedAmount - withholdingAmount;

  // Payout after motor dues / installments (Net Ele Gecen)
  const netPayable = invoiceTotal - duesInstallments;

  // Operational Expenses and Net Profit
  const totalExpenses = totalFuelExpense + totalMotorLeaseExpense;
  const netProfit = netPayable - totalExpenses;

  return {
    daysWorked: logs.length,
    totalHours: parseFloat(totalHours.toFixed(2)),
    monthlyExtraHours: 0,
    grandTotalHours: parseFloat(grandTotalHours.toFixed(2)),
    totalMarketPackages,
    totalFood4_6,
    totalFood6plus,
    totalPackages,
    totalFuelExpense: parseFloat(totalFuelExpense.toFixed(2)),
    totalMotorLeaseExpense: parseFloat(totalMotorLeaseExpense.toFixed(2)),
    totalExpenses: parseFloat(totalExpenses.toFixed(2)),
    cumulativeFixedIncome: parseFloat(cumulativeFixedIncome.toFixed(2)),
    extraHoursIncome: 0,
    totalFixedIncome: parseFloat(totalFixedIncome.toFixed(2)),
    cumulativeDailyPremium: parseFloat(cumulativeDailyPremium.toFixed(2)),
    cumulativeDistanceSupport: parseFloat(cumulativeDistanceSupport.toFixed(2)),
    monthlyBonus: parseFloat(monthlyBonus.toFixed(2)),
    senioritySupport: parseFloat(senioritySupport.toFixed(2)),
    migrosPacketPremium: parseFloat(migrosPacketPremium.toFixed(2)),
    grossEarnings: parseFloat(grossEarnings.toFixed(2)),
    reliefFund: parseFloat(reliefFund.toFixed(2)),
    netEarningsPreVat: parseFloat(netEarningsPreVat.toFixed(2)),
    vatAmount: parseFloat(vatAmount.toFixed(2)),
    vatIncludedAmount: parseFloat(vatIncludedAmount.toFixed(2)),
    withholdingAmount: parseFloat(withholdingAmount.toFixed(2)),
    invoiceTotal: parseFloat(invoiceTotal.toFixed(2)),
    duesInstallments: parseFloat(duesInstallments.toFixed(2)),
    netPayable: parseFloat(netPayable.toFixed(2)),
    netProfit: parseFloat(netProfit.toFixed(2)),
    calculatedDailyLogs
  };
}

/**
 * Calculates monthly earnings based on monthly summary totals (averages).
 * Used for Quick Calculator or when daily logs are not available.
 * @param {Object} monthlyData - Aggregated monthly inputs.
 * @param {Object} settings - Profile settings.
 * @returns {Object} Monthly calculation breakdown.
 */
export function calculateFromMonthlyAverages(monthlyData, settings = {}) {
  const days = Math.max(1, parseInt(monthlyData.days_worked ?? 26));
  const hours = parseFloat(monthlyData.total_hours ?? 0);
  const market = parseInt(monthlyData.market_packages ?? 0);
  const food4_6 = parseInt(monthlyData.food_packages_4_6 ?? 0);
  const food6plus = parseInt(monthlyData.food_packages_6plus ?? 0);
  const fuel = parseFloat(monthlyData.total_fuel_expense ?? 0);
  const motorLease = parseFloat(monthlyData.total_motor_lease_expense ?? 0);

  const avgHours = hours / days;
  const avgMarket = market / days;
  const avgFood4_6 = food4_6 / days;
  const avgFood6plus = food6plus / days;
  const avgFuel = fuel / days;
  const avgMotorLease = motorLease / days;

  const mockLogs = [];
  for (let i = 0; i < days; i++) {
    mockLogs.push({
      log_date: `MockDay-${i + 1}`,
      hours_worked: avgHours,
      market_packages: avgMarket,
      food_packages_4_6: avgFood4_6,
      food_packages_6plus: avgFood6plus,
      fuel_expense: avgFuel,
      motor_lease_expense: avgMotorLease
    });
  }

  return calculateMonthlyTotals(mockLogs, settings);
}
