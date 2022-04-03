'''A module made by Moonbear of Tripsit'''
import os
import sys
import json
import logging
import pickle
import requests
from discord.ext import commands
from discord.commands import (
    slash_command,
    permissions
)

logger = logging.getLogger(__file__)
logger.setLevel(logging.DEBUG)
handler = logging.FileHandler(filename='discord.log', encoding='utf-8', mode='w')
handler.setFormatter(logging.Formatter('%(asctime)s:%(levelname)s:%(name)s: %(message)s'))
logger.addHandler(handler)
logger.addHandler(logging.StreamHandler(sys.stdout))

PREFIX = "TSAPI"
my_guild = os.getenv('luna_guild_id')
ts_guild = os.getenv('tripsit_guild_id')
guild_list = [my_guild, ts_guild]
ICON_URL = 'https://fossdroid.com/images/icons/me.tripsit.tripmobile.13.png'

class TSAPI(commands.Cog):
    '''
    This handles database stuff
    '''
    def __init__(self, bot):
        self.bot = bot

    @permissions.is_owner()
    @slash_command(name = "refreshdb",
        description = "Gets all drugs, saves them to a file",
        guild_ids=guild_list)
    async def refreshdb(
        self,
        ctx,
    ):
        '''
        This will make a .txt file
        '''
        if ctx.author.id != 177537158419054592:
            await ctx.respond('You need to be an admin to do this!')
            return

        output = f"[{PREFIX}] {ctx.author.name}#{ctx.author.discriminator} activated"
        try:
            output = f"{output} on {ctx.guild.name}"
        except AttributeError:
            pass
        finally:
            logger.info(output)
        url = 'https://tripbot.tripsit.me/api/tripsit/getAllDrugs'
        response = requests.get(url)
        ts_data = response.json()["data"][0]
        all_drug_names = ts_data.keys()
        formatted_json = json.dumps(ts_data, indent=4, sort_keys=True)
        logger.info(f"[db] There are {str(len(all_drug_names))} drugs in the database")
        with open('allDrugInfo.json', mode='w', encoding='UTF-8') as file:
            file.write(formatted_json)
        with open('allDrugInfo.data', mode='wb') as file:
            pickle.dump(ts_data, file)

        all_drug_names = ts_data.keys()
        drug_names = []
        for each_drug in all_drug_names:
            drug_names.append(each_drug)
        drug_names.sort()
        top_25_drugs = [
        'alcohol','ayahuasca','cannabis','diazepam','cocaine',\
        'dmt','ghb','heroin','ketamine','khat',\
        'kratom','lsd','mdma','mescaline','methamphetamine',\
        'dxm','pcp','oxycodone','amphetamine','psilocin',\
        'flunitrazepam','salvia','nicotine','suggestADrug','suggestAnotherdrug']
        for each_drug in top_25_drugs:
            try:
                drug_names.remove(each_drug)
            except ValueError:
                continue
        final_drug_list = top_25_drugs + drug_names

        with open('allDrugNames.data', mode='wb') as file:
            pickle.dump(final_drug_list, file)
        await ctx.respond("Got all drugs names!")

def setup(bot):
    '''
    This registers this file into to the bot.
    Note: You must still "bot.load_extension("cogs.external")" in the main file!
    '''
    logger.debug(f"[{PREFIX}] Starting!")
    bot.add_cog(TSAPI(bot))

def teardown():
    '''Shutdown function'''
    logger.debug(f"[{PREFIX}] Stopping!")
