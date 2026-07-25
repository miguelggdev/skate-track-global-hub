export interface FeeSettings {
  monthly_fee: number;
  registration_fee: number;
  enable_extraordinary_increment: boolean;
  increment_start_day: number;
  increment_percentage: number;
}

export interface CalculatedFee {
  baseAmount: number;
  incrementAmount: number;
  totalAmount: number;
  incrementApplied: boolean;
  calculationDate: Date;
}

/**
 * Calculate the monthly fee based on payment date and settings
 * @param settings - Fee configuration settings
 * @param paymentDate - Date when payment is made
 * @returns Calculated fee breakdown
 */
export const calculateMonthlyFee = (
  settings: FeeSettings,
  paymentDate: Date
): CalculatedFee => {
  const baseAmount = settings.monthly_fee;
  let incrementAmount = 0;
  let incrementApplied = false;

  // Check if increment should apply
  if (settings.enable_extraordinary_increment) {
    const dayOfMonth = paymentDate.getDate();
    
    // Apply increment if payment date is on or after the configured day
    if (dayOfMonth >= settings.increment_start_day) {
      incrementAmount = baseAmount * (settings.increment_percentage / 100);
      incrementApplied = true;
    }
  }

  return {
    baseAmount,
    incrementAmount,
    totalAmount: baseAmount + incrementAmount,
    incrementApplied,
    calculationDate: paymentDate
  };
};

/**
 * Get the registration fee
 * @param settings - Fee configuration settings
 * @returns Registration fee amount
 */
export const getRegistrationFee = (settings: FeeSettings): number => {
  return settings.registration_fee;
};
