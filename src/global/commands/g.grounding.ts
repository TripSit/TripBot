const F = f(__filename);

export default grounding;

/**
 * Return the link to the grounding image
 * @return {Promise<string>} The link to the grounding image
 */
export async function grounding():Promise<string> {
  const response = 'https://imgur.com/wEg2xFB';
  log.info(F, `response: ${JSON.stringify(response, null, 2)}`);
  return response;
}
