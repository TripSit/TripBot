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

PREFIX = "trpsit"
TRIPSIT_GUILD_ID = os.getenv('tripsit_guild_id')
TRIPSIT_WELCOME_CHANNEL_ID = os.getenv('tripsit_welcome_channel')
DEV_GUILD_ID = os.getenv('dev_guild_id')
DEV_WELCOME_CHANNEL_ID = os.getenv('tripsit_welcome_channel')
DEV_NEEDSHELP_ROLE = os.getenv('dev_needhelp_role')

GUILD_LIST = [DEV_GUILD_ID]
NEEDSHELP_ROLE_ID = DEV_NEEDSHELP_ROLE
GUILD_ID = DEV_GUILD_ID

TS_ICON = 'https://fossdroid.com/images/icons/me.tripsit.tripmobile.13.png'

class Tripsit(commands.Cog):
    '''
    Records when you've dosed
    '''
    def __init__(self, bot):
        self.bot = bot

    @slash_command(name = "tripsit",
        description = "description",
        guild_ids=GUILD_LIST)
    async def tripsit(
        self,
        ctx,
        user: Option(
            discord.Member,
            "Member to look up",
        ) = None
    ):
        '''
        This will apply the NeedsHelp role to the user
        '''
        output = f"[{PREFIX}] started by {ctx.author.name}#{ctx.author.discriminator}"
        try:
            output = f"{output} on {ctx.guild.name}"
        except AttributeError:
            pass
        finally:
            logger.info(output)

        if user is None:
            patient = ctx.author
        else:
            patient = user

        patientid = patient.id
        # logger.debug(f"patientid: {patientid}")
        guild = ctx.interaction.guild
        # logger.debug(f"guild: {guild}")
        needshelp_role = guild.get_role(int(NEEDSHELP_ROLE_ID))
        # logger.debug(f"needshelp_role: {needshelp_role}")
        member = guild.get_member(patientid)
        # logger.debug(f"member: {member}")
        member_roles = member.roles
        logger.debug(f"member_roles: {member_roles}")

        member_already_needs_help = isinstance(member.get_role(int(NEEDSHELP_ROLE_ID)),str)
        # logger.debug(f"member_already_needs_help: {member_already_needs_help}")
        if member_already_needs_help:
            embed = discord.Embed(
                color = discord.Colour.random()
            )
            embed.set_author(
                name="TripSit.Me",
                url="http://www.tripsit.me",
                icon_url = TS_ICON)
            embed.add_field(
                name = f"Hey {patient}, you've already asked for help!",
                value = "We'll be with you shortly, please start by describing your problem.",
                inline = False)
            embed.set_footer(
                text = "Thanks for using Tripsit.Me!")
            await ctx.respond(
                embed=embed)
        else:

            with open('userdb copy.json', 'r', encoding='UTF-8') as file:
                all_data = json.load(file)
            # logger.debug(f"all_data: {all_data}")
            # logger.debug(f"patientid: {patientid}")
            # logger.debug(f"type: {type(patientid)}")
            if str(patientid) in all_data.keys():
                patient_data = all_data[str(patientid)]
            else:
                patient_data = {}
            
            # logger.debug(f"patient_data: {patient_data}")
            patient_data['roles'] = str(member_roles)
            # logger.debug(f"patient_data: {patient_data}")
            all_data[patientid] = patient_data
            with open('userdb copy.json', 'w', encoding='UTF-8') as file:
                json.dump(all_data, file, indent=4)

            roles_list = []
            for each in member_roles:
                logger.debug(f"each: {each}")
                await member.remove_roles(each)
                # print(each.id)
                # print(each.name)
                # roles_list.append(each.id)

            # logger.debug(f"member_roles: {member_roles}")
            # await member.remove_roles(member_roles)
            await member.add_roles(needshelp_role)

            embed = discord.Embed(
                color = discord.Colour.random()
            )
            embed.set_author(
                name="TripSit.Me",
                url="http://www.tripsit.me",
                icon_url = TS_ICON)
            embed.add_field(
                name = f"Hey {patient}, thanks for asking for help!",
                value = "We'll be with you shortly, please start by describing your problem.",
                inline = False)
            embed.set_footer(
                text = "Thanks for using Tripsit.Me!")
            await ctx.respond(
                embed=embed)
        return

def setup(bot):
    '''
    This registers this file into to the bot.
    Note: You must still "bot.load_extension("cogs.external")" in the main file!
    '''
    logger.debug(f"[{PREFIX}] Starting!")
    bot.add_cog(Tripsit(bot))

def teardown():
    '''Shutdown function'''
    logger.debug(f"[{PREFIX}] Stopping!")
