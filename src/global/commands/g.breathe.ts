const F = f(__filename);

export default breathe;

/**
 * Returns one of the breaking exercises
 * @param {string | null} choice Which exercise to return
 */
export async function breathe(choice: null | string): Promise<string> {
  let response = 'https://tenor.com/view/breathing-gif-15523921'; // Polygon
  if (choice === '2') {
    response = 'https://i.imgur.com/XbH6gP4.gif';
  } // Balls
  if (choice === '3') {
    response = 'https://i.imgur.com/g57i96f.gif';
  } // Circle
  if (choice === '4') {
    response = 'https://i.imgur.com/MkUcTPl.gif';
  } // Hedgehog
  log.info(F, `response: ${JSON.stringify(response, null, 2)}`);
  return response;
}
