import axios from 'axios';

const F = f(__filename);

type MercuryResponse = {
  is_retrograde: boolean;
};

export default mercury;

export async function mercury(): Promise<string> {
  const { data } = await axios.get<MercuryResponse>('https://mercuryretrogradeapi.com');
  log.info(F, `response: ${JSON.stringify(data)}`);

  return data.is_retrograde
    ? 'Yes! Mercury is currently in retrograde. Blame it for everything.'
    : "Mercury is NOT in retrograde. If things are going wrong, it's entirely your fault ✨";
}
