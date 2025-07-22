export default {
  async getAllDrugs() {
    return db.drug_names.findMany();
  },

  async getDrug(name: string) {
    return db.drug_names.findFirst({
      where: {
        name: name.toUpperCase(),
      },
    });
  },
};
