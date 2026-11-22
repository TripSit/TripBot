/**
 * Removes an item from every inventory and gives its price back, for items that are retired from the market.
 * Everything happens in one transaction, so nobody loses the item without getting their tokens (or the reverse).
 * The refund is the item's recorded price (`cost`) for each inventory row that holds it.
 */
export type RefundResult = { owners: number; tokens: number };

export async function refundRpgItem(value: string): Promise<RefundResult> {
  return db.$transaction(async tx => {
    const rows = await tx.rpg_inventory.findMany({ where: { value } });
    // Credit first, then remove the rows, so a failed credit leaves the items in place
    await Promise.all(rows.map(row => tx.personas.update({
      where: { id: row.persona_id },
      data: { tokens: { increment: row.cost } },
    })));
    await tx.rpg_inventory.deleteMany({ where: { value } });
    return { owners: rows.length, tokens: rows.reduce((sum, row) => sum + row.cost, 0) };
  });
}

export default refundRpgItem;
