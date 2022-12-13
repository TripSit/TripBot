const F = f(__filename);

export default recovery;

/**
 *
 * @return {string}
 */
export async function recovery():Promise<string> {
  const response = 'https://i.imgur.com/nTEm0QE.png';
  log.info(F, `response: ${JSON.stringify(response, null, 2)}`);
  return response;
}
