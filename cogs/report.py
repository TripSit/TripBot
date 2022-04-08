'''A module made by Moonbear of Tripsit'''
import os
import sys
import logging
import random
import json
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

PREFIX = "reprt"
GUILD_ID_DEV = os.getenv('GUILD_ID_DEV')
GUILD_ID_PRD = os.getenv('GUILD_ID_PRD')
GUILD_LIST = [GUILD_ID_DEV, GUILD_ID_PRD]

TS_ICON = 'https://fossdroid.com/images/icons/me.tripsit.tripmobile.13.png'

class Report(commands.Cog):
    '''
    Records when you've dosed
    '''
    def __init__(self, bot):
        self.bot = bot
        with open('userdb.json', 'r', encoding='UTF-8') as file:
            all_data = json.load(file)

    @slash_command(
        name = "test",
        aliases = ["testing"],
        usage = "test <id>",
        description = "Does stuff",
        guild_ids=GUILD_LIST)
    async def test(self, ctx):
        '''Reports a user for something silly'''
        output = f"[{PREFIX}] started by {ctx.author.name}#{ctx.author.discriminator}"
        try:
            output = f"{output} on {ctx.guild.name}"
        except AttributeError:
            pass
        finally:
            logger.info(output)
            
        embed = discord.Embed(
            color = discord.Colour.random()
        )
        embed.set_author(
            name="TripSit.Me",
            url="http://www.tripsit.me",
            icon_url = TS_ICON)
        embed.add_field(
            name = "Field Name",
            value = "Field Value",
            inline = False)
        embed.set_footer(
            text = "Footer text")
        await ctx.respond(
            embed=embed)

def setup(bot):
    '''
    This registers this file into to the bot.
    Note: You must still "bot.load_extension("cogs.external")" in the main file!
    '''
    logger.debug(f"[{PREFIX}] Starting!")
    bot.add_cog(ModuleName(bot))

def teardown():
    '''Shutdown function'''
    logger.debug(f"[{PREFIX}] Stopping!")
