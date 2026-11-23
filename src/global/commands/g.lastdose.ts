import type { drug_mass_unit, drug_roa } from '@db/tripbot';

export interface LastDose {
  amount: number;
  units: drug_mass_unit;
  route: drug_roa;
  takenAt: Date;
  substance: string;
}

export default async function lastDose(discordId: string): Promise<LastDose | null> {
  const user = await db.users.findUnique({
    where: { discord_id: discordId },
    select: { id: true },
  });
  if (!user) return null;

  const dose = await db.user_drug_doses.findFirst({
    where: { user_id: user.id },
    orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
    select: {
      dose: true,
      units: true,
      route: true,
      created_at: true,
      drugs: {
        select: {
          drug_names: {
            where: { is_default: true },
            orderBy: { name: 'asc' },
            take: 1,
            select: { name: true },
          },
        },
      },
    },
  });
  if (!dose) return null;

  return {
    amount: dose.dose,
    units: dose.units,
    route: dose.route,
    takenAt: dose.created_at,
    substance: dose.drugs.drug_names[0]?.name ?? 'Unknown substance',
  };
}
