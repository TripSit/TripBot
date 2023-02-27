/**
 * Calculate how much of a solvent to use for a given amount of a substance to get the wanted
 * dose per push
 * @return {string}
 */
export async function calcSolvent(substance:number, mgpp:number, mlpp:number):Promise<number> {
  return Number(((substance / mgpp) * mlpp).toFixed(2));
}
/**
 *Calculate how much of a substance you need for a given amount of solvent to archieve the wanted dose per push
 */
export async function calcSubstance(solvent:number, mgpp:number, mlpp:number):Promise<number> {
  return Number(((solvent * mgpp) / mlpp).toFixed(2));
}
