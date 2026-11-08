const F = f(__filename);

export default combochart;

/**
 * Returns a link to the combo chart
 * @return {string}
 */
export async function combochart():Promise<string> {
  const response = 'https://wiki.tripsit.me/images/3/3a/Combo_2.png';
  log.info(F, `response: ${JSON.stringify(response, null, 2)}`);
  return response;
}
