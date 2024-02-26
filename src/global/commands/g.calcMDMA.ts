// https://rollsafe.org/mdma-dosage/

export async function calcMDMA(weight: number, unit: 'lbs' | 'kg'): Promise<{
  '🌱 First Time': string;
  '🔆 Light': string;
  '🌟 Common': string;
  '💪 Strong': string;
  '⚠️ Max': string;
}> {
  const weightInKgs = unit === 'lbs' ? weight * 0.453592 : weight;
  return {
    '🌱 First Time': `${Math.round(weightInKgs * 0.8)}mg (0.8mg/kg)`,
    '🔆 Light': `${Math.round(weightInKgs * 1.2)}mg (1.2mg/kg)`,
    '🌟 Common': `${Math.round(weightInKgs * 1.5)}mg (1.5mg/kg)`,
    '💪 Strong': `${Math.round(weightInKgs * 1.7)}mg (1.7mg/kg)`,
    '⚠️ Max': `${Math.round(weightInKgs * 2.0)}mg (2.0mg/kg)`,
  };
}

export default calcMDMA;
