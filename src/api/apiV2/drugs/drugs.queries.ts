import db from '../../../global/utils/db';

export default {
  getAllDrugs() {
    return db.drug_names.findMany();
  },

  async getDrug(name:string) {
    return db.drug_names.findFirst({
      where: {
        name: name.toUpperCase(),
      },
    });
  },
};
