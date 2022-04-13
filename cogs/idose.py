'''A module made by Moonbear of Tripsit'''
import os
import sys
import logging
from thefuzz import process
import discord
from discord.ext import commands
from discord.commands import (
    slash_command,
    Option
)

logger = logging.getLogger(__file__)
logger.setLevel(logging.DEBUG)
handler = logging.FileHandler(filename='discord.log', encoding='utf-8', mode='w')
handler.setFormatter(logging.Formatter('%(asctime)s:%(levelname)s:%(name)s: %(message)s'))
logger.addHandler(handler)
logger.addHandler(logging.StreamHandler(sys.stdout))

PREFIX = "idose"
my_guild = os.getenv('GUILD_ID_DEV')
ts_guild = os.getenv('GUILD_ID_PRD')
guild_list = [my_guild, ts_guild]
TS_ICON = 'https://fossdroid.com/images/icons/me.tripsit.tripmobile.13.png'
with open('allDrugData.json', 'r', encoding='UTF-8') as filehandle:
    ALL_DRUG_DATA = json.load(filehandle)

# For each dictionary in the ALL_DRUG_DATA JSON file, find the "name" key and add it to a list
ALL_DRUG_NAMES = [drug["name"] for drug in ALL_DRUG_DATA]
# logger.debug(f'[{PREFIX}] ALL_DRUG_NAMES: {ALL_DRUG_NAMES}")

TOP_PSYCHS = ["Cannabis", "MDMA", "LSD", "DMT", "Mushrooms"]
TOP_DISSOS = ["Zolpidem", "Ketamine", "DXM", "PCP", "Salvia"]
TOP_OPIATE = ["Alcohol", "Hydrocodone", "Oxycodone", "Tramadol", "Heroin"]
TOP_BENZOS = ["Alprazolam", "Clonazepam", "Diazepam", "Lorazepam", "Flunitrazepam"]
TOP_SPEEDS = ["Nicotine", "Amphetamine", "Cocaine", "Methamphetamine", "Methylphenidate"]
TOP_DRUGS  = TOP_PSYCHS + TOP_DISSOS + TOP_OPIATE + TOP_BENZOS + TOP_SPEEDS
# logger.debug(f'[{PREFIX}] TOP_DRUGS: {TOP_DRUGS}")

for each_drug in TOP_DRUGS:
    try:
        ALL_DRUG_NAMES.remove(each_drug)
        # logger.debug(f'[{PREFIX}] Removed {each_drug} from ALL_DRUG_NAMES")
    except ValueError:
        continue

FINAL_DRUG_LIST = TOP_DRUGS + ALL_DRUG_NAMES
# logger.debug(f'[{PREFIX}] FINAL_DRUG_LIST: {FINAL_DRUG_LIST}")

async def drug_searcher(ctx: discord.AutocompleteContext):
    """Returns a list of drugs that begin with the characters entered so far."""
    # return [drugname for drugname in FINAL_DRUG_LIST if drugname.startswith(ctx.value)]
    if ctx.value != "":
        return [result[0] for result in process.extract(ctx.value, FINAL_DRUG_LIST)]
    else:
        return FINAL_DRUG_LIST

# https://docs.pycord.dev/en/master/faq.html#how-do-i-send-a-dm


class IDose(commands.Cog):
    '''
    Records when you've dosed
    '''
    def __init__(self, bot):
        self.bot = bot

    @slash_command(name = "idosetest",
        description = "Log your dosages",
        guild_ids=guild_list)
    @commands.is_owner()
    async def idosetest(
        self,
        ctx,
        substance: Option(
            str,
            "What substance?",
            autocomplete=discord.utils.basic_autocomplete(drug_searcher)),
        volume: Option(
            int,
            "How much?"),
        unit: Option(
            str,
            "What unit?",
            choices=["g (grams)","mg (milligrams)","ml (milliliters)","μg (micrograms)"])
        ):
        '''
        Function to log your dosages
        '''
        if ctx.author.id != 177537158419054592:
            await ctx.respond('You need to be an admin to do this!')
            return

        output = f"[{PREFIX}] activated by {ctx.author.name}#{ctx.author.discriminator} "
        try:
            output = f"{output} on {ctx.guild.name}"
        except AttributeError:
            pass
        finally:
            logger.info(output)

        now = discord.utils.utcnow()
        formatted_now = discord.utils.format_dt(now, style = "t")
        relative_now = discord.utils.format_dt(now, style = "R")

        embed = discord.Embed(
            color = discord.Colour.random()
        )
        embed.set_author(
            name="TripSit.Me",
            url="http://www.tripsit.me",
            icon_url = TS_ICON)
        embed.add_field(
            name= f"You dosed {volume} {unit} of {substance}",
            value= f"{relative_now} at {formatted_now}",
            inline=False)
        await ctx.respond(embed=embed)


    @commands.dm_only()
    @commands.cooldown(1, 5, commands.BucketType.user)  # the command can only be used once in 5 seconds
    @slash_command(name = "idose",
        description = "Log your dosages")
    async def idose(
        self,
        ctx,
        substance: Option(
            str,
            "What substance?",
            autocomplete=discord.utils.basic_autocomplete(drug_searcher)),
        volume: Option(
            int,
            "How much?"),
        unit: Option(
            str,
            "What unit?",
            choices=["g (grams)","mg (milligrams)","ml (milliliters)","μg (micrograms)"])
        ):
        '''
        Function to log your dosages
        '''
        output = f"[{PREFIX}] activated by {ctx.author.name}#{ctx.author.discriminator} "
        try:
            output = f"{output} on {ctx.guild.name}"
        except AttributeError:
            pass
        finally:
            logger.info(output)

        now = discord.utils.utcnow()
        formatted_now = discord.utils.format_dt(now, style = "t")
        relative_now = discord.utils.format_dt(now, style = "R")

        embed = discord.Embed(
            color = discord.Colour.random()
        )
        embed.set_author(
            name="TripSit.Me",
            url="http://www.tripsit.me",
            icon_url = TS_ICON)
        embed.add_field(
            name= f"You dosed {volume} {unit} of {substance}",
            value= f"{relative_now} at {formatted_now}",
            inline=False)
        await ctx.respond(embed=embed)

def setup(bot):
    '''
    This registers this file into to the bot.
    Note: You must still "bot.load_extension("cogs.external")" in the main file!
    '''
    logger.debug(f"[{PREFIX}] Starting!")
    bot.add_cog(IDose(bot))

def teardown():
    '''Shutdown function'''
    logger.debug(f"[{PREFIX}] Stopping!")
