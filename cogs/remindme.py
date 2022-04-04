'''A module made by Moonbear of Tripsit'''
import os
import sys
import logging
import discord
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

PREFIX = "rmind"
my_guild = os.getenv('dev_guild_id')
ts_guild = os.getenv('tripsit_guild_id')
guild_list = [my_guild, ts_guild]
TS_ICON = 'https://fossdroid.com/images/icons/me.tripsit.tripmobile.13.png'


class RemindMe(commands.Cog):
    '''
    Sets a reminder for yourself
    '''
    def __init__(self, bot):
        self.bot = bot

    # @commands.dm_only()
    @commands.cooldown(1, 5, commands.BucketType.user)  # the command can only be used once in 5 seconds
    @slash_command(name = "remindme",
        description = "Set reminders",
        guild_ids=guild_list)
    async def remindme(self, ctx):
        '''
        Function for setting reminders
        '''
        #TODO The entire remindme function
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
        await ctx.respond(embed=embed)

def setup(bot):
    '''
    This registers this file into to the bot.
    Note: You must still "bot.load_extension("cogs.external")" in the main file!
    '''
    logger.debug(f"[{PREFIX}] Starting!")
    bot.add_cog(RemindMe(bot))

def teardown():
    '''Shutdown function'''
    logger.debug(f"[{PREFIX}] Stopping!")
