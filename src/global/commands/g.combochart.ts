const F = f(__filename);

export default combochart;

/**
 * Returns a link to the combo chart
 * @return {string}
 */
export async function combochart():Promise<string> {
  const response = 'https://i.gyazo.com/e96558e1d23164a347fff8f590b60dba.png';
  log.info(F, `response: ${JSON.stringify(response, null, 2)}`);
  return response;
}
