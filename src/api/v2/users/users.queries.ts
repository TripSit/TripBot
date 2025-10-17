export default {
  getAllUsers() {
    return db.users.findMany();
  },

  async getUser(DiscordId:string) {
    return db.users.findFirst({
      where: {
        discord_id: DiscordId,
      },
    });
  },
};
