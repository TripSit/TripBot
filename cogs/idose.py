'''A module made by Moonbear of Tripsit'''
import os
import sys
import logging
import pickle
import discord
from discord.ext import commands
from discord.commands import (
    slash_command,
    permissions,
    Option
)

logger = logging.getLogger(__file__)
logger.setLevel(logging.DEBUG)
handler = logging.FileHandler(filename='discord.log', encoding='utf-8', mode='w')
handler.setFormatter(logging.Formatter('%(asctime)s:%(levelname)s:%(name)s: %(message)s'))
logger.addHandler(handler)
logger.addHandler(logging.StreamHandler(sys.stdout))

PREFIX = "idose"
my_guild = os.getenv('luna_guild_id')
ts_guild = os.getenv('tripsit_guild_id')
guild_list = [my_guild, ts_guild]
TS_ICON = 'https://fossdroid.com/images/icons/me.tripsit.tripmobile.13.png'
with open('allDrugNames.data', 'rb') as filehandle:
    # read the data as binary data stream
    ALL_DRUG_NAMES = pickle.load(filehandle)

async def drug_searcher(ctx: discord.AutocompleteContext):
    """Returns a list of drugs that begin with the characters entered so far."""
    return [drugname for drugname in ALL_DRUG_NAMES if drugname.startswith(ctx.value.lower())]

# https://docs.pycord.dev/en/master/faq.html#how-do-i-send-a-dm


class IDose(commands.Cog):
    '''
    Records when you've dosed
    '''
    def __init__(self, bot):
        self.bot = bot

    @permissions.is_owner()
    @slash_command(name = "idosetest",
        description = "Log your dosages",
        guild_ids=guild_list)
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
        output = f"[{PREFIX}] {ctx.author.name}#{ctx.author.discriminator} activated"
        try:
            output = f"{output} on {ctx.guild.name}"
        except AttributeError:
            pass
        finally:
            logger.info(output)
        
        now = discord.utils.utcnow()
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
            value= f"{relative_now}",
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
        output = f"{ctx.author.name}#{ctx.author.discriminator} activated {PREFIX}"
        try:
            output = f"{output} on {ctx.guild.name}"
        except AttributeError:
            pass
        finally:
            logger.info(output)
        
        now = discord.utils.utcnow()
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
            value= f"{relative_now}",
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
