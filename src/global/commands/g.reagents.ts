const F = f(__filename);

export default reagents;

/**
 *
 * @return {any}
 */
export async function reagents():Promise<string> {
  const response = 'https://i.imgur.com/wETJsZr.png';
  log.info(F, `response: ${JSON.stringify(response, null, 2)}`);
  return response;
}
