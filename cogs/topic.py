'''A module made by Moonbear of Tripsit'''
import os
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

PREFIX = "topic"
DEV_GUILD_ID = os.getenv('dev_guild_id')
TRIPSIT_GUILD_ID = os.getenv('tripsit_guild_id')
guild_list = [DEV_GUILD_ID, TRIPSIT_GUILD_ID]
TS_ICON = 'https://fossdroid.com/images/icons/me.tripsit.tripmobile.13.png'
TRIPSIT_WELCOME_CHANNEL_ID = os.getenv('tripsit_welcome_channel')
DEV_WELCOME_CHANNEL_ID = os.getenv('tripsit_welcome_channel')

# https://docs.pycord.dev/en/master/faq.html#how-do-i-send-a-dm

class Topic(commands.Cog):
    '''
    Records when you've dosed
    '''
    def __init__(self, bot):
        self.bot = bot

    @commands.Cog.listener()
    async def on_member_join(self, member):
        '''
        When someone joins
        '''
        if member.guild.id == TRIPSIT_GUILD_ID:
            logger.info(f"[{PREFIX}] {member} has joined {member.guild}")

            embed = discord.Embed(
                color = discord.Colour.random()
            )
            embed.set_author(
                name="TripSit.Me",
                url="http://www.tripsit.me",
                icon_url = TS_ICON)
            embed.add_field(
                name=f"Welcome to {member.guild}, {member}!",
                value= rtopic(),
                inline=False)
            welcome_channel = self.bot.get_channel(TRIPSIT_WELCOME_CHANNEL_ID)
            await welcome_channel.send(embed=embed)
        return


    @slash_command(name = "topic",
        description = "Random Topic",
        guild_ids=guild_list)
    async def topic(self, ctx):
        '''
        Random Topic
        '''
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
            name="Random Topic...",
            value= rtopic(),
            inline=False)
        await ctx.respond(embed=embed)

def rtopic():
    '''Returns a random karma quote'''
    # pylint: disable=line-too-long
    topic_list = [
        "What did you eat for breakfast?",
        "How many cups of coffee, tea, or beverage-of-choice do you have each morning?",
        "Are you an early bird or night owl?",
        "Do you prefer showing at morning or night?",
        "What's your favorite flower or plant?",
        "What's your caffeinated beverage of choice? Coffee? Cola? Tea?",
        "What's your favorite scent?",
        "What's the last great TV show or movie you watched?",
        "Best book you've ever read?",
        "If you could learn one new professional skill, what would it be?",
        "If you could learn one new personal skill, what would it be?",
        "What's your favorite way to get in some exercise?",
        "If you could write a book, what genre would you write it in? Mystery? Thriller? Romance? Historical fiction? Non-fiction?",
        "What is one article of clothing that someone could wear that would make you walk out on a date with them?",
        "The zombie apocalypse is coming, who are 3 people you want on your team?",
        "What is your most used emoji?",
        "Who was your childhood actor/actress crush?",
        "If you were a wrestler what would be your entrance theme song?",
        "If you could bring back any fashion trend what would it be?",
        "You have your own late night talk show, who do you invite as your first guest?",
        "You have to sing karaoke, what song do you pick?",
        "What was your least favorite food as a child? Do you still hate it or do you love it now?",
        "If you had to eat one meal everyday for the rest of your life what would it be?",
        "If aliens landed on earth tomorrow and offered to take you home with them, would you go?",
        "60s, 70s, 80s, 90s: Which decade do you love the most and why?",
        "What's your favorite sandwich and why?",
        "What is your favorite item you've bought this year?",
        "What would be the most surprising scientific discovery imaginable?",
        "What is your absolute dream job?",
        "What would your talent be if you were Miss or Mister World?",
        "What would the title of your autobiography be?",
        "Say you're independently wealthy and don't have to work, what would you do with your time?",
        "If you had to delete all but 3 apps from your smartphone, which ones would you keep?",
        "What is your favorite magical or mythological animal?",
        "What does your favorite shirt look like?",
        "Who is your favorite Disney hero or heroine? Would you trade places with them?",
        "What would your dream house be like?",
        "If you could add anyone to Mount Rushmore who would it be; why?",
        "You're going sail around the world, what's the name of your boat?",
        "What fictional family would you be a member of?",
        "What sport would you compete in if you were in the Olympics (even if it's not in the olympics)?",
        "What would your superpower be and why?",
        "What's your favorite tradition or holiday?",
        "What fictional world or place would you like to visit?",
        "What is your favorite breakfast food?",
        "What is your favorite time of the day and why?",
        "Coffee or tea?",
        "Teleportation or flying?",
        "What is your favorite TV show?",
        "What book, movie read/seen recently you would recommend and why?",
        "What breed of dog would you be?",
        "If you had a time machine, would go back in time or into the future?",
        "Do you think you could live without your smartphone (or other technology item) for 24 hours?",
        "What is your favorite dessert?",
        "What was your favorite game to play as a child?",
        "Are you a traveler or a homebody?",
        "What's one career you wish you could have?",
        "What fictional world or place would you like to visit?",
        "Have you ever completed anything on your “bucket list”?",
        "Do you have a favorite plant?",
        "What did you have for breakfast this morning?",
        "What is your favorite meal to cook and why?",
        "What is your favorite musical instrument and why?",
        "Are you a cat person or a dog person?",
        "What languages do you know how to speak?",
        "Popcorn or M&Ms?",
        "What's the weirdest food you've ever eaten?",
        "What is your cellphone wallpaper?",
        "You can have an unlimited supply of one thing for the rest of your life, what is it? Sushi? Scotch Tape?",
        "Would you go with aliens if they beamed down to Earth?",
        "Are you sunrise, daylight, twilight, or nighttime? Why?",
        "What season would you be?",
        "Are you a good dancer?",
        "What fruit or vegetable would you most want to be?",
        "If you could hang out with any cartoon character, who would you choose and why?",
        "If you could live anywhere in the world for a year, where would it be?",
        "If you could choose any person from history to be your imaginary friend, who would it be and why?",
        "If you could see one movie again for the first time, what would it be and why?",
        "If you could bring back any fashion trend what would it be?",
        "If you could live in any country, where would you live?",
        "If you could choose any two famous people to have dinner with who would they be?",
        "If you could be any animal in the world, what animal would you choose to be?",
        "If you could do anything in the world as your career, what would you do?",
        "If you could be any supernatural creature, what would you be and why?",
        "If you could change places with anyone in the world, who would it be and why?",
        "If you could rename yourself, what name would you pick?",
        "If you could have someone follow you around all the time, like a personal assistant, what would you have them do?",
        "If you could instantly become an expert in something, what would it be?",
        "If you could be guaranteed one thing in life (besides money), what would it be?",
        "If you had to teach a class on one thing, what would you teach?",
        "If you could magically become fluent in any language, what would it be?",
        "If you could be immortal, what age would you choose to stop aging at and why?",
        "If you could be on a reality TV show, which one would you choose and why?",
        "If you could choose any person from history to be your imaginary friend, who would it be and why?",
        "If you could eliminate one thing from your daily routine, what would it be and why?",
        "If you could go to Mars, would you? Why or why not?",
        "If you could have the power of teleportation right now, where would you go and why?",
        "If you could write a book that was guaranteed to be a best seller, what would you write?",
        "Would you rather live in the ocean or on the moon?",
        "Would you rather meet your travel back in time to meet your ancestors or to the future to meet your descendants?",
        "Would you rather lose all of your money or all of your pictures?",
        "Would you rather have invisibility or flight?",
        "Would you rather live where it only snows or the temperature never falls below 100 degrees?",
        "Would you rather always be slightly late or super early?",
        "Would you rather give up your smartphone or your computer?",
        "Would you rather live without heat and AC or live without social media?",
        "Would you rather be the funniest or smartest person in the room?",
        "Would you rather be able to run at 100 miles per hour or fly at 10 miles per hour?",
        "Would you rather be a superhero or the world's best chef?",
        "Would you rather be an Olympic gold medallist or an astronaut?"
    ]
    return random.choice(topic_list)

def setup(bot):
    '''
    This registers this file into to the bot.
    Note: You must still "bot.load_extension("cogs.external")" in the main file!
    '''
    logger.debug(f"[{PREFIX}] Starting!")
    bot.add_cog(Topic(bot))

def teardown():
    '''Shutdown function'''
    logger.debug(f"[{PREFIX}] Stopping!")
