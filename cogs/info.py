'''A module made by Moonbear of Tripsit'''
import logging
import sys
import math
import pickle
import discord
from discord.ext import commands, pages
from discord.commands import (
    slash_command,
    Option
)

logger = logging.getLogger(__file__)
logger.setLevel(logging.INFO)
handler = logging.FileHandler(filename='discord.log', encoding='utf-8', mode='w')
handler.setFormatter(logging.Formatter('%(asctime)s:%(levelname)s:%(name)s: %(message)s'))
logger.addHandler(handler)
logger.addHandler(logging.StreamHandler(sys.stdout))

PREFIX = "info_"
TS_ICON = 'https://fossdroid.com/images/icons/me.tripsit.tripmobile.13.png'
DISCLAIMER = "Please dose responsibly, this info does not replace talking with a medical professional."
with open('allDrugNames.data', 'rb') as filehandle:
    # read the data as binary data stream
    ALL_DRUG_NAMES = pickle.load(filehandle)
with open('allDrugInfo.data', 'rb') as filehandle:
    # read the data as binary data stream
    ALL_DRUG_INFO = pickle.load(filehandle)

async def drug_searcher(ctx: discord.AutocompleteContext):
    """Returns a list of drugs that begin with the characters entered so far."""
    return [drugname for drugname in ALL_DRUG_NAMES if drugname.startswith(ctx.value.lower())]

class Info(commands.Cog):
    '''
    TODO
    '''
    def __init__(self, bot):
        self.bot = bot

    @commands.cooldown(1, 5, commands.BucketType.user)  # the command can only be used once in 5 seconds
    @slash_command(name = "info",
        description = "Lookup substance information!")
    async def info_info(
        self,
        ctx,
        substance: Option(
            str,
            "Pick a substance!",
            autocomplete=discord.utils.basic_autocomplete(drug_searcher)
        ),
        view: Option(
            str,
            "Type of response",
            choices=["Summary","Properties","Everything"]
        ) = "Summary"
    ):
        '''
        This function looks up drug information on the tripsit API

        Depending on the option, it returns either a Summary, the Properties or a Paged view
        It will default to Summary view, which is Everything - Properties - Combos - Links - PWEffects
        Properties view will specifically view the properties
        Considering making a Sources, Links, Combos and PWEffects option
        '''
        #TODO Sources links could look better
        #TODO Some kind of combo results?
        output = f"[{PREFIX}] {ctx.author.name}#{ctx.author.discriminator} activated"
        try:
            output = f"{output} on {ctx.guild.name}"
        except AttributeError:
            pass
        finally:
            logger.info(output)
        logger.debug(f"[{PREFIX}] parameters: {substance} {view}")
        wiki_url = f"https://wiki.tripsit.me/wiki/{substance}"

        # We now store the TS Database locally so we don't need to call the server for every request!
        # url = f'https://tripbot.tripsit.me/api/tripsit/getDrug?name={substance}'
        # response = requests.get(url)
        # ts_data = response.json()["data"][0]
        ts_data = ALL_DRUG_INFO[substance]

        try:
            error = ts_data['err']
            await ctx.respond(f"Error: {ts_data['msg']} Check your spelling! {error}")
            return
        except KeyError:
            pass

        try:
            title = ts_data["pretty_name"]
        except KeyError:
            title = substance

        information = {}

        for base_key, value in ts_data.items():
            formatted_key = base_key.replace("_"," ")
            formatted_key = formatted_key.title()
            formatted_key = formatted_key.replace("Formatted ","")
            logger.debug(f"[info] Basekey: {formatted_key} ({len(str(value))})")
            if isinstance(value, list):
                information[formatted_key] = ", ".join(value)
            if isinstance(value, str):
                information[formatted_key] = str(value)
            if isinstance(value, dict):
                output = ""
                for sub_key, sub_value in value.items():
                    logger.debug(f"[info] sub_key: {sub_key}")
                    logger.debug(f"[info] sub_val: {sub_value}")
                    if base_key == "pweffects":
                        output = f"{output} [{sub_key}]({sub_value})\n"
                        continue
                    if sub_key == "value":
                        output = f"{output} {ts_data[base_key]['value']} {ts_data[base_key]['_unit']}\n"
                        continue
                    if sub_key == "_unit":
                        continue
                    if isinstance(sub_value, dict):
                        for dub_key in sub_value:
                            output = output + dub_key + ": " + sub_value[dub_key] + '\n'
                        output = output + "\n"
                    elif isinstance(sub_value, list):
                        output = output + sub_key + "\n" + ", ".join(sub_value) + '\n'
                    elif isinstance(sub_value, str):
                        output = f"{output} {sub_key}\n {sub_value}\n\n"
                    else:
                        output = output + sub_value + " "
                if len(output) > 1024:
                    if base_key == "pweffects":
                        logger.debug(f"[info] Building {base_key} list")
                        entire_message = output
                        output = []
                        message_length = math.ceil(len(entire_message) / 1000)
                        logger.debug(f"[info] I will make {message_length} messages")
                        messages_built = 0
                        message_start = 0
                        message_end = 1000
                        while messages_built < message_length:
                            logger.debug(f"[info] looking for last ) between {message_start} and {message_end}")
                            message_end = entire_message.rfind(")",message_start,message_end) + 1
                            logger.debug(f"[info] Found the last ) at {message_end}")
                            message_part = entire_message[message_start:message_end]
                            output.append(message_part)
                            logger.debug(f"[info] setting new start to {message_end}")
                            message_start = message_end
                            message_end += 1000
                            messages_built += 1

                information[formatted_key] = output

        if view == "Summary":
            logger.debug(f"[info] Creating {view} embed!")
            embed = discord.Embed()
            embed.set_author(
                name = f"TripSit.Me wiki - {title}",
                url = wiki_url,
                icon_url = TS_ICON)
            for key, value in information.items():
                if key == "Name":
                    continue
                if key == "Pretty Name":
                    continue
                if key == "Properties":
                    continue
                if key == "Links":
                    continue
                if key == "Sources":
                    continue
                if key == "Pweffects":
                    continue
                if key == "Combos":
                    continue
                if len(value) > 1024:
                    logger.debug(f"[info] {key} is too large at {str(len(value))}")
                    continue
                embed.add_field(
                    name = key,
                    value = value,
                    inline = False)
            embed.set_footer(text = DISCLAIMER)
            await ctx.respond(embed=embed)
        if view == "Everything":
            logger.debug(f"[info] Creating {view} embed!")
            book = []
            for key, value in information.items():
                if key == "Name":
                    continue
                if key == "Pretty Name":
                    continue
                if key == "Pweffects" and isinstance(value,list):
                    for page in value:
                        embed = discord.Embed()
                        embed.set_author(
                            name = f"TripSit.Me - {title}",
                            url = wiki_url,
                            icon_url = TS_ICON)
                        embed.add_field(
                            name = key,
                            value = page,
                            inline = False)
                        embed.set_footer(text = DISCLAIMER)
                        book.append(embed)
                    continue
                if len(value) > 1024:
                    logger.debug(f"[info] {key} is too large at {str(len(value))}")
                    continue
                embed = discord.Embed()
                embed.set_author(
                    name = f"TripSit.Me - {title}",
                    url = wiki_url,
                    icon_url = TS_ICON)
                embed.add_field(
                    name = key,
                    value = value,
                    inline = False)
                embed.set_footer(text = DISCLAIMER)
                book.append(embed)
            paginator = pages.Paginator(pages=book)
            await paginator.respond(ctx.interaction, ephemeral=False)
        if view == "Properties":
            logger.debug(f"[info] Creating {view} embed!")
            embed = discord.Embed()
            embed.set_author(
                name = f"_TripSit.Me - {title}_",
                url = wiki_url,
                icon_url = TS_ICON)
            for key, value in information.items():
                if key != "Properties":
                    continue
                if len(value) > 1024:
                    logger.debug(f"[info] {key} is too large at {str(len(value))}")
                    continue
                embed.add_field(
                    name = key,
                    value = value,
                    inline = False)
            embed.set_footer(text = DISCLAIMER)
            await ctx.respond(embed=embed)

def setup(bot):
    '''
    This registers this file into to the bot.
    Note: You must still "bot.load_extension("cogs.external")" in the main file!
    '''
    logger.debug(f"[{PREFIX}] Starting!")
    bot.add_cog(Info(bot))

def teardown():
    '''Shutdown function'''
    logger.debug(f"[{PREFIX}] Stopping!")
