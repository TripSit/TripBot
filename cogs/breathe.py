'''A module made by Moonbear of Tripsit'''
from random import choices
import sys
import logging
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

PREFIX = "brthe"
TS_ICON = 'https://fossdroid.com/images/icons/me.tripsit.tripmobile.13.png'


class Breathe(commands.Cog):
    '''
    Shows the breathe gif
    '''
    def __init__(self, bot):
        self.bot = bot

    @commands.cooldown(1, 5, commands.BucketType.user)  # the command can only be used once in 5 seconds
    @slash_command(name = "breathe",
        description = "Remember to breathe",

    )
    async def breathe(
        self,
        ctx,
        exercise: Option(
            int,
            "Which exercise?",
            choices=[1,2]
        ) = 2
    ):
        '''
        Sends the following .gif into chat, helpful
        '''
        output = f"[{PREFIX}] {ctx.author.name}#{ctx.author.discriminator} activated"
        try:
            output = f"{output} on {ctx.guild.name}"
        except AttributeError:
            pass
        finally:
            logger.info(output)

        if exercise == 1:
            await ctx.respond('https://i.imgur.com/XbH6gP4.gif')
        if exercise == 2:
            await ctx.respond('https://i.imgur.com/n5jBp45.gif')

def setup(bot):
    '''
    This registers this file into to the bot.
    Note: You must still "bot.load_extension("cogs.external")" in the main file!
    '''
    logger.debug(f"[{PREFIX}] Starting!")
    bot.add_cog(Breathe(bot))

def teardown():
    '''Shutdown function'''
    logger.debug(f"[{PREFIX}] Stopping!")
