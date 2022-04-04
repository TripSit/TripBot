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

PREFIX = "template"
my_guild = os.getenv('dev_guild_id')
ts_guild = os.getenv('tripsit_guild_id')
guild_list = [my_guild, ts_guild]

TS_ICON = 'https://fossdroid.com/images/icons/me.tripsit.tripmobile.13.png'

class ModuleName(commands.Cog):
    '''
    Records when you've dosed
    '''
    def __init__(self, bot):
        self.bot = bot

    @commands.cooldown(1, 5, commands.BucketType.user)
    @slash_command(name = "command_name",
        description = "description",
        guild_ids=guild_list)
    async def command_name(self, ctx):
        '''
        Description
        '''
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
