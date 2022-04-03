'''A module made by Moonbear of Tripsit'''
import sys
import logging
import random
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

PREFIX = "kipp_"

TS_ICON = 'https://fossdroid.com/images/icons/me.tripsit.tripmobile.13.png'

class KIPP(commands.Cog):
    '''
    Keep it positive please =)
    '''
    def __init__(self, bot):
        self.bot = bot

    @commands.cooldown(1, 5, commands.BucketType.user)  # the command can only be used once in 5 seconds
    @slash_command(name = "kipp",
        description = "Keep It Positive Please!")
    async def kipp(self, ctx):
        '''
        Sends a message to chat, simple, nice, be happy =)
        '''
        #TODO Add in happy facts as the title of the embed, eg: otters sleep holding hands!
        output = f"[{PREFIX}] {ctx.author.name}#{ctx.author.discriminator} activated"
        try:
            output = f"{output} on {ctx.guild.name}"
        except AttributeError:
            pass
        finally:
            logger.info(output)
        happy_emojis = [
            '😀','😃','😄','😊','😁','🥰','😇','😍','😂','🤣',
            '🙂','😆','😋','😛','🙃','😜','🤪','😝','🤗','🤭',
            '😎','😺','😸','😹','😻','👍','✌']

        output = f'{"".join(random.sample(happy_emojis,10))}\n\n' + \
                '💜Keep It Positive Please!💜\n\n' + \
                f'{"".join(random.sample(happy_emojis,10))}'

        embed = discord.Embed(
            color = discord.Colour.blue()
        )
        embed.add_field(
            name="<3",
            value= output,
            inline=False)
        await ctx.respond(embed=embed)

def setup(bot):
    '''
    This registers this file into to the bot.
    Note: You must still "bot.load_extension("cogs.external")" in the main file!
    '''
    logger.debug(f"[{PREFIX}] Starting!")
    bot.add_cog(KIPP(bot))

def teardown():
    '''Shutdown function'''
    logger.debug(f"[{PREFIX}] Stopping!")
