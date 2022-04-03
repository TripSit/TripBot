'''A module made by Moonbear of Tripsit'''
import sys
import logging
import discord
from discord.ext import commands
from discord.commands import (
    slash_command
)

logger = logging.getLogger(__file__)
logger.setLevel(logging.DEBUG)
handler = logging.FileHandler(filename='discord.log', encoding='utf-8', mode='w')
handler.setFormatter(logging.Formatter('%(asctime)s:%(levelname)s:%(name)s: %(message)s'))
logger.addHandler(handler)
logger.addHandler(logging.StreamHandler(sys.stdout))

PREFIX = "water"
TS_ICON = 'https://fossdroid.com/images/icons/me.tripsit.tripmobile.13.png'


class Hydrate(commands.Cog):
    '''
    TODO
    '''
    def __init__(self, bot):
        self.bot = bot

    @commands.cooldown(1, 5, commands.BucketType.user)  # the command can only be used once in 5 seconds
    @slash_command(name = "hydrate",
        description = "Remember to hydrate!")
    async def hydrate(self, ctx):
        '''
        Sends a reminder to hydrate, now with cool water icons!
        '''
        #TODO Turn this into a message that posts every 100 messages, have people react to get "water tokens" for sng
        output = f"[{PREFIX}] {ctx.author.name}#{ctx.author.discriminator} activated"
        try:
            output = f"{output} on {ctx.guild.name}"
        except AttributeError:
            pass
        finally:
            logger.info(output)
        output = '💧🌊💧🌊💧🌊💧🌊💧🌊💧🌊💧🌊💧🌊\n\n' + \
                '⚠️ ＨＹＤＲＡＴＩＯＮ ＲＥＭＩＮＤＥＲ ⚠️\n\n' + \
                '💧🌊💧🌊💧🌊💧🌊💧🌊💧🌊💧🌊💧🌊'

        embed = discord.Embed(
            color = discord.Colour.blue()
        )
        embed.add_field(
            name="Remember to drink water!",
            value= output,
            inline=False)
        await ctx.respond(embed=embed)

def setup(bot):
    '''
    This registers this file into to the bot.
    Note: You must still "bot.load_extension("cogs.external")" in the main file!
    '''
    logger.debug(f"[{PREFIX}] Starting!")
    bot.add_cog(Hydrate(bot))

def teardown():
    '''Shutdown function'''
    logger.debug(f"[{PREFIX}] Stopping!")
