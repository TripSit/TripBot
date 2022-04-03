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

PREFIX = "about"
TS_ICON = 'https://fossdroid.com/images/icons/me.tripsit.tripmobile.13.png'

class About(commands.Cog):
    '''
    Shows the about page
    '''
    def __init__(self, bot):
        self.bot = bot

    @commands.cooldown(1, 5, commands.BucketType.user)  # the command can only be used once in 5 seconds
    @slash_command(name = "about",
        description = "About this bot")
    async def about(self, ctx):
        '''
        Displays information about the bot
        '''
        output = f"[{PREFIX}] {ctx.author.name}#{ctx.author.discriminator} activated"
        try:
            output = f"{output} on {ctx.guild.name}"
        except AttributeError:
            pass
        finally:
            logger.info(output)

        embed = discord.Embed(
            color = discord.Colour.dark_teal()
        )

        embed.set_author(
            name="TripSit.Me",
            url="http://www.tripsit.me",
            icon_url = TS_ICON)
        embed.add_field(
            name='About TripSit',
            value= 'This app is created by TripSit, an organisation which helps to provide factual information about \
                drugs and how to reduce the harms involved in using them.\
                \n[Check out our website!](http://www.tripsit.me)',
            inline=False)
        embed.add_field(
            name='Disclaimer',
            value= 'Although we have a team dedicated to keeping the information on this app up to date, it is not \
                always possible to provide entirely accurate information on the safety level of drugs. The \
                information here should be used as guidelines only, and it is important to do your own research from \
                multiple sources before ingesting a substance. We also strongly advise using a testing kit and scales \
                to ensure you are taking the correct dosage. These can both be bought online for reasonable prices.',
            inline=False)
        embed.add_field(
            name = 'Support TripSit',
            value = 'TripSit is a completely free service run by volunteers. If you wish to help out, feel free to \
                join the IRC or the Discord, follow and share our content on social media, or make a donation to keep \
                the servers running.',
            inline = False)
        embed.add_field(
            name='Feedback',
            value= 'We would love to hear your feedback on this bot, please join discord.gg / TripSit \
                and talk with Moonbear!',
            inline=False)
        embed.add_field(
            name='Add me to your server!',
            value= 'If you want to add this bot to your server, click the link here: <TBD>',
            inline=False)
        await ctx.respond(embed=embed)

def setup(bot):
    '''
    This registers this file into to the bot.
    Note: You must still "bot.load_extension("cogs.external")" in the main file!
    '''
    logger.debug(f"[{PREFIX}] Starting!")
    bot.add_cog(About(bot))

def teardown():
    '''Shutdown function'''
    logger.debug(f"[{PREFIX}] Stopping!")
