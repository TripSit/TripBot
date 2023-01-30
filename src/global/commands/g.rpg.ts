const F = f(__filename);

export default rpg;

/**
 *
 * @return {string}
 */
export async function work(
  userId:string,
  coins:number,
):Promise<void> {
  log.info(F, `Giving ${coins} to ${userId}`);
}
