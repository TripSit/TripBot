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

PREFIX = "cntct"
TS_ICON = 'https://fossdroid.com/images/icons/me.tripsit.tripmobile.13.png'


class Contact(commands.Cog):
    '''
    TODO
    '''
    def __init__(self, bot):
        self.bot = bot

    @commands.cooldown(1, 5, commands.BucketType.user)  # the command can only be used once in 5 seconds
    @slash_command(name = "contact",
        description = "How to contact TripSit")
    async def contact(self, ctx):
        '''
        Information on how to contact tripsit
        '''
        #TODO put in a way for people to live contact through discord via a modal dialog
        output = f"[{PREFIX}] {ctx.author.name}#{ctx.author.discriminator} activated"
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
            name="IRC",
            value= '[Webchat](http://chat.tripsit.me)',
            inline=False)
        embed.add_field(
            name="Discord",
            value= '[Join our discord](http://discord.gg/TripSit)',
            inline=False)
        embed.add_field(
            name="Email Bot issues",
            value= 'discord_bot @ tripsit (dot) me',
            inline=False)
        embed.add_field(
            name="Email Drug information issues",
            value= 'Email: content @ tripsit (dot) me',
            inline=False)
        await ctx.respond(embed=embed)

def setup(bot):
    '''
    This registers this file into to the bot.
    Note: You must still "bot.load_extension("cogs.external")" in the main file!
    '''
    logger.debug(f"[{PREFIX}] Starting!")
    bot.add_cog(Contact(bot))

def teardown():
    '''Shutdown function'''
    logger.debug(f"[{PREFIX}] Stopping!")
