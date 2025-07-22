const F = f(__filename);

export default globalTemplate;

export async function globalTemplate(): Promise<string> {
  const response = 'I did thing!';
  log.info(F, `response: ${JSON.stringify(response, null, 2)}`);
  return response;
}
