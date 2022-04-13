'''A module made by Moonbear of Tripsit'''
import sys
import logging
import json
import requests
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

PREFIX = "combo"
TS_ICON = 'https://fossdroid.com/images/icons/me.tripsit.tripmobile.13.png'
DISCLAIMER = "Please dose responsibly, this info does not replace talking with a medical professional."
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

class Combo(commands.Cog):
    '''
    TODO
    '''
    def __init__(self, bot):
        self.bot = bot

    @commands.cooldown(1, 5, commands.BucketType.user)  # the command can only be used once in 5 seconds
    @slash_command(name = "combo",
        description = "Lookup combo information!")
    async def combo(
        self,
        ctx,
        first_drug: Option(
            str,
            "Pick a substance!",
            autocomplete=discord.utils.basic_autocomplete(drug_search)
        ),
        second_drug: Option(
            str,
            "Pick a substance!",
            autocomplete=discord.utils.basic_autocomplete(drug_search)
            # choices=["Summary","Properties","Everything"]
        )
        ):
        '''
        This uses the API to get the interaction between two drugs.
        '''
        output = f"[{PREFIX}] {ctx.author.name}#{ctx.author.discriminator} activated"
        try:
            output = f"{output} on {ctx.guild.name}"
        except AttributeError:
            pass
        finally:
            logger.info(output)
        logger.debug(f'[combo] Checking {first_drug} against {second_drug}')
        url = f'https://tripbot.tripsit.me/api/tripsit/getInteraction?drugA={first_drug}&drugB={second_drug}'
        logger.debug(f"[combo] {url}")
        response = requests.get(url)
        ts_data = response.json()["data"][0]
        logger.debug(f"[combo] {ts_data}")
        if ts_data is False:
            embed = discord.Embed(
                color = discord.Colour.blurple())
            embed.set_author(
                name="TripSit.Me",
                url="http://www.tripsit.me",
                icon_url = TS_ICON)
            embed.add_field(
                name = f"{first_drug} combined with {second_drug}",
                value = 'There is no information for this combo, please be careful!\n\n',
                inline = False)
            embed.set_footer(
                text = DISCLAIMER)
            await ctx.respond(embed=embed)
            return
        if ts_data.__contains__('err'):
            embed = discord.Embed(
                color = discord.Colour.blurple())
            embed.set_author(
                name="TripSit.Me",
                url="http://www.tripsit.me",
                icon_url = TS_ICON)
            embed.add_field(
                name = f"{first_drug} combined with {second_drug}",
                value = f'{ts_data["msg"]} Check your spelling!\n\n',
                inline = False)
            embed.set_footer(
                text = DISCLAIMER)
            await ctx.respond(embed=embed)
            return

        note = ""
        try:
            note = ts_data['note']
        except KeyError:
            pass

        status = ts_data["status"]

        if status == "Low Risk & Synergy":
            emoji = "↗"
            status_color = discord.Colour.dark_blue()
            definition = "These drugs work together to cause an effect greater than the sum of its parts,\
                 and they aren't likely to cause an adverse or undesirable reaction when used carefully.\
                      Additional research should always be done before combining drugs."
        if status == "Low Risk & No Synergy":
            emoji = "➡"
            status_color = discord.Colour.blue()
            definition = "Effects are additive. The combination is unlikely to cause any adverse or undesirable\
                 reaction beyond those that might ordinarily be expected from these drugs."
        if status == "Low Risk & Decrease":
            emoji = "↘"
            status_color = discord.Colour.teal()
            definition = "Effects are substractive. The combination is unlikely to cause any adverse or \
                undersirable reaction beyond those that might ordinarily be expected from these drugs."
        if status == "Caution":
            emoji = "🦺"
            status_color = discord.Colour.yellow()
            definition = "These combinations are not usually physically harmful, but may produce undesirable \
                effects, such as physical discomfort or overstimulation. Extreme use may cause physical\
                     health issues. Synergistic effects may be unpredictable. Care should be taken when\
                          choosing to use this combination."
        if status == "Unsafe":
            emoji = "⚠️"
            status_color = discord.Colour.orange()
            definition = "There is considerable risk of physical harm when taking these combinations, they \
                should be avoided where possible."
        if status == "Dangerous":
            emoji = "⛔"
            status_color = discord.Colour.red()
            definition = "These combinations are considered extremely harmful and should always be avoided. \
                Reactions to these drugs taken in combination are highly unpredictable and have a \
                    potential to cause death."
        if status == "Unknown":
            emoji = "❓"
            status_color = discord.Colour.random()
            definition = "Effects are unknown."

        embed = discord.Embed(
            color = status_color)
        embed.set_author(
            name="TripSit.Me",
            url="http://www.tripsit.me",
            icon_url = TS_ICON)
        embed.add_field(
            name = f"{first_drug} combined with {second_drug}",
            value = f'{emoji} {status} {emoji}\n\n',
            inline = False)
        if note:
            embed.add_field(
                name = "Note",
                value = f'{note}\n\n',
                inline = False)
        embed.add_field(
            name = f"{status} definition:",
            value = definition,
            inline = False)
        embed.set_footer(
            text = DISCLAIMER)
        await ctx.respond(embed=embed)


def setup(bot):
    '''
    This registers this file into to the bot.
    Note: You must still "bot.load_extension("cogs.external")" in the main file!
    '''
    logger.debug(f"[{PREFIX}] Starting!")
    bot.add_cog(Combo(bot))

def teardown():
    '''Shutdown function'''
    logger.debug(f"[{PREFIX}] Stopping!")
