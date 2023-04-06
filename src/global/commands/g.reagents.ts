const F = f(__filename);

export default reagents;

/**
 *
 * @return {any}
 */
export async function reagents():Promise<string> {
  // const response = 'https://i.imgur.com/wETJsZr.png';
  const response = 'https://user-images.githubusercontent.com/1836049/222908130-df3a881b-3ced-462f-a0db-6c2a34cd62ec.png';
  log.info(F, `response: ${JSON.stringify(response, null, 2)}`);
  return response;
}
