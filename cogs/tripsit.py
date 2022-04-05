'''A module made by Moonbear of Tripsit'''
import os
import sys
import logging
import json
import discord
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

PREFIX = "trpst"

GUILD_ID_PRD = os.getenv('GUILD_ID_PRD')
GUILD_ID_DEV = os.getenv('GUILD_ID_DEV')
GUILD_ID = GUILD_ID_PRD
GUILD_LIST = [GUILD_ID_PRD, GUILD_ID_DEV]

CHANNEL_TRIPSIT_DEV =   int(os.getenv('CHANNEL_TRIPSIT_DEV'))
CHANNEL_TRIPSIT_PRD =   int(os.getenv('CHANNEL_TRIPSIT_PRD'))
CHANNEL_SANDBOX_PRD =   int(os.getenv('CHANNEL_SANDBOX_PRD'))
CHANNEL_SANDBOX_DEV =   int(os.getenv('CHANNEL_SANDBOX_DEV'))
CHANNEL_TRIPSITME_PRD = int(os.getenv('CHANNEL_TRIPSITME_PRD'))
CHANNEL_TRIPSIT_ID = CHANNEL_TRIPSIT_PRD

CHANNEL_TRIPSITTERS_PRD = int(os.getenv('CHANNEL_TRIPSITTERS_PRD'))
CHANNEL_TRIPSITTERS_ID = CHANNEL_TRIPSITTERS_PRD

ROLE_NEEDSHELP_DEV = int(os.getenv('ROLE_NEEDSHELP_DEV'))
ROLE_NEEDSHELP_PRD = int(os.getenv('ROLE_NEEDSHELP_PRD'))
NEEDSHELP_ROLE_ID = ROLE_NEEDSHELP_PRD

ROLE_TRIPSITTER_PRD = int(os.getenv('ROLE_TRIPSITTER_PRD'))
ROLE_TRIPSITTER_DEV = int(os.getenv('ROLE_TRIPSITTER_DEV'))
ROLE_TRIPSITTER_ID = ROLE_TRIPSITTER_PRD

ROLE_HELPER_PRD = int(os.getenv('ROLE_HELPER_PRD'))
ROLE_HELPER_ID = ROLE_HELPER_PRD

DATABASE_NAME = 'userdb copy.json'

TS_ICON = 'https://fossdroid.com/images/icons/me.tripsit.tripmobile.13.png'

class Tripsit(commands.Cog):
    '''
    Records when you've dosed
    '''
    def __init__(self, bot):
        self.bot = bot

    @commands.Cog.listener()
    async def on_ready(self):
        '''Register the view to be perisent across restarts'''
        self.bot.add_view(Tripsit.MyView()) # Registers a View for persistent listening

    class MyView(discord.ui.View):
        '''Create the view that will be used to listen for events'''
        def __init__(self):
            super().__init__(timeout=None) # timeout of the view must be set to None
            # self.bot = bot

        @discord.ui.button(
            label="Click here if you need assistance!",
            custom_id="danger-1",
            style=discord.ButtonStyle.danger,
        )

        async def button_callback(self, button, interaction):
            '''What happens when you click the button'''
            patient = interaction.user
            member = patient
            guild = interaction.guild
            member_already_needs_help = member.get_role(NEEDSHELP_ROLE_ID) is not None
            logger.debug(f'{member.name} is already in the NEEDSHELP role: {member_already_needs_help}')
            if member_already_needs_help:
                embed = discord.Embed(
                    color = discord.Colour.random()
                )
                embed.set_author(
                    name="TripSit.Me",
                    url="http://www.tripsit.me",
                    icon_url = TS_ICON)
                embed.add_field(
                    name = f"Hey {interaction.user.name}, you're already being helped!",
                    value = f"Check your channel list for '{interaction.user.name} chat here!'",
                    inline = False)
                embed.set_footer(
                    text = "Thanks for using Tripsit.Me!")
                await interaction.response.send_message(
                    embed=embed,
                    ephemeral=True)
            if not member_already_needs_help:
                # with open(DATABASE_NAME, 'r', encoding='UTF-8') as file:
                #     all_data = json.load(file)
                # if str(patientid) in all_data.keys():
                #     patient_data = all_data[str(patientid)]
                # else:
                #     patient_data = {}

                # member_role_list = []
                # for each in member_roles:
                #     mod_roles = ["Admin", "Operator", "Moderator", "Tripsitter"]
                #     if each.name in mod_roles:
                #         await interaction.response.send_message(f"Check your user! {member.name} is a mod!",
                #     ephemeral=True)
                #         return
                #     member_role_list.append(each.id)
                # # logger.debug(f"patient_data: {patient_data}")
                # patient_data['roles'] = member_role_list
                # # logger.debug(f"patient_data: {patient_data}")
                # all_data[patientid] = patient_data
                # with open(DATABASE_NAME, 'w', encoding='UTF-8') as file:
                #     json.dump(all_data, file, indent=4)

                # for each in member_roles:
                #     if each.name == "@everyone":
                #         continue
                #     role = guild.get_role(int(each.id))
                #     logger.debug(f"role: {role}")
                #     await member.remove_roles(role)

                needshelp_role = guild.get_role(NEEDSHELP_ROLE_ID)
                await member.add_roles(needshelp_role)

                tripsitter_role = guild.get_role(ROLE_TRIPSITTER_ID)
                helper_role = guild.get_role(ROLE_HELPER_ID)
                msg = f"Hey {patient.mention}, thank you for asking for assistance!\n\n\
Start off by telling us what's going on: what did you take, how much, what time?\n\n\
A {tripsitter_role.mention} or {helper_role.mention} will be with you as soon as they're available!"
                # logger.debug(f"msg: {msg}")
                # message = await tripsit_channel.send(msg)
                tripsit_channel = interaction.guild.get_channel(CHANNEL_TRIPSIT_ID)
                # logger.debug(f"tripsit_channel: {tripsit_channel}")
                thread = await tripsit_channel.create_thread(
                    name = f"{patient.name} chat here!",
                    reason = f"{interaction.user.name}#{interaction.user.discriminator} has started a thread",
                    auto_archive_duration = 1440,
                    type = discord.ChannelType.private_thread,
                )
                # logger.debug(f"thread: {thread}")

                await thread.send(
                    content = msg,
                    allowed_mentions=discord.AllowedMentions(
                        everyone=False,
                        users=True,
                        roles=True,
                        replied_user=False
                    )
                )

                embed = discord.Embed(
                    color = discord.Colour.random()
                )
                embed.set_author(
                    name="TripSit.Me",
                    url="http://www.tripsit.me",
                    icon_url = TS_ICON)
                embed.add_field(
                    name = f"Hey {interaction.user.name}, you are now being helped!",
                    value = f"Check your channel list for '{interaction.user.name} chat here!'",
                    inline = False)
                embed.set_footer(
                    text = "Thanks for using Tripsit.Me!")
                await interaction.response.send_message(
                    embed=embed,
                    ephemeral=True)

                msg = f"Hey {tripsitter_role.mention} and {helper_role.mention}, {patient.name} can use some help, \
use this thread to talk about it!"
                # logger.debug(f"msg: {msg}")
                tripsitters_channel = interaction.guild.get_channel(CHANNEL_TRIPSITTERS_ID)
                # logger.debug(f"tripsit_channel: {tripsit_channel}")
                thread = await tripsitters_channel.create_thread(
                    name = f"{patient.name} dicuss here!",
                    reason = f"{interaction.user.name}#{interaction.user.discriminator} has started a thread",
                    auto_archive_duration = 1440,
                    type = discord.ChannelType.private_thread,
                )
                # logger.debug(f"thread: {thread}")
                await thread.send(
                    content = msg,
                    allowed_mentions=discord.AllowedMentions(
                        everyone=False,
                        users=True,
                        roles=True,
                        replied_user=False
                    )
                )

    @slash_command(name = "button",
        description = "Random Topic",
        guild_ids=GUILD_LIST)
    @commands.is_owner()
    async def button(self, ctx):
        '''Creates a button to be clicked in the #tripsit room'''
        await ctx.respond("Welcome to the TripSit room!\n\n\
Right now this room is not actively monitored by TripSit staff.\n\n\
**If you need assistance please go to  https://chat.tripsit.me to find our IRC channels!**\n\n\
If you don't need immediate assistance you can click the button below to create a new thread here and \
the community may come around to help!\
", view=Tripsit.MyView())

    @slash_command(name = "tripsit",
        description = "description",
        guild_ids=GUILD_LIST)
    # @commands.has_any_role("Admin", "Operator", "Moderator", "Tripsitter")
    @commands.has_any_role(185175683184590849, 955818629654523914)
    async def tripsit(
        self,
        ctx,
        user: Option(
            discord.Member,
            "Member to look up",
        ) = None,
        toggle: Option(
            str,
            "On or Off?",
            choices = ["On", "Off"]
        ) = "On"
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
            user_provided = False
        else:
            patient = user
            user_provided = True

        patientid = patient.id

        guild = ctx.interaction.guild
        # logger.debug(f"guild: {guild}")
        # logger.debug(f"ROLE_TRIPSITTER_ID: {ROLE_TRIPSITTER_ID}")
        tripsitter_role = guild.get_role(ROLE_TRIPSITTER_ID)

        if ctx.author.id == patientid:
            await ctx.respond("I assure you they're doing just fine =)")
            return

        # logger.debug(f"patientid: {patientid}")
        guild = ctx.interaction.guild
        # logger.debug(f"guild: {guild}")
        needshelp_role = guild.get_role(NEEDSHELP_ROLE_ID)
        # logger.debug(f"needshelp_role: {needshelp_role}")
        member = guild.get_member(patientid)
        # logger.debug(f"member: {member}")
        member_roles = member.roles
        # logger.debug(f"member_roles: {member_roles}")

        member_already_needs_help = member.get_role(NEEDSHELP_ROLE_ID) is not None
        # logger.debug(f"member_already_needs_help: {member_already_needs_help}")
        # logger.debug(f"toggle: {toggle}")
        if toggle == "Off":
            if member_already_needs_help:
                with open(DATABASE_NAME, 'r', encoding='UTF-8') as file:
                    all_data = json.load(file)
                if str(patientid) in all_data.keys():
                    patient_data = all_data[str(patientid)]
                    # logger.debug(f"patient_data: {patient_data}")
                    patient_roles = patient_data['roles']
                    # logger.debug(f"patient_roles: {patient_roles}")
                    for each in patient_roles:
                        # logger.debug(f"each: {each}")
                        role = guild.get_role(int(each))
                        # logger.debug(f"role: {role}")
                        if role.name == "@everyone":
                            continue
                        if role.name == needshelp_role.name:
                            continue
                        await member.add_roles(role)
                    await member.remove_roles(needshelp_role)
                await member.remove_roles(needshelp_role)
                output = f"Removed {needshelp_role.name} from {member.name}"
                logger.info(output)
                await ctx.respond(output)
            else:
                output = f"{member.name} does not need help!"
                logger.info(output)
                await ctx.respond(output)
        if toggle == "On":
            if member_already_needs_help:
                embed = discord.Embed(
                    color = discord.Colour.random()
                )
                embed.set_author(
                    name="TripSit.Me",
                    url="http://www.tripsit.me",
                    icon_url = TS_ICON)
                if user_provided:
                    embed.add_field(
                        name = f"Hey {ctx.author.name}, {patient} is already being helped!",
                        value = "We'll be with them shortly, thanks for caring!",
                        inline = False)
                else:
                    embed.add_field(
                        name = f"Hey {ctx.author.name}, you're already being helped!",
                        value = "Check your channel list for '{ctx.author.name} chat here!'",
                        inline = False)
                embed.set_footer(
                    text = "Thanks for using Tripsit.Me!")
                await ctx.respond(
                    embed=embed)
            if not member_already_needs_help:
                with open(DATABASE_NAME, 'r', encoding='UTF-8') as file:
                    all_data = json.load(file)
                # logger.debug(f"all_data: {all_data}")
                # logger.debug(f"patientid: {patientid}")
                # logger.debug(f"type: {type(patientid)}")
                if str(patientid) in all_data.keys():
                    patient_data = all_data[str(patientid)]
                else:
                    patient_data = {}

                member_role_list = []
                for each in member_roles:
                    mod_roles = ["Admin", "Operator", "Moderator", "Tripsitter"]
                    if each.name in mod_roles:
                        await ctx.respond(f"Check your user! {member.name} is a mod!")
                        return
                    member_role_list.append(each.id)

                # logger.debug(f"patient_data: {patient_data}")
                patient_data['roles'] = member_role_list
                # logger.debug(f"patient_data: {patient_data}")
                all_data[patientid] = patient_data
                with open(DATABASE_NAME, 'w', encoding='UTF-8') as file:
                    json.dump(all_data, file, indent=4)

                for each in member_roles:
                    if each.name == "@everyone":
                        continue
                    role = guild.get_role(int(each.id))
                    logger.debug(f"role: {role}")
                    await member.remove_roles(role)

                await member.add_roles(needshelp_role)

                msg = f"Hey {patient.mention}, thank you for asking for assistance!\n\n\
Start off by telling us what's going on: what did you take, how much, what time?\n\n\
A {tripsitter_role.mention} will be with you as soon as they're available!"
                # logger.debug(f"msg: {msg}")
                # message = await tripsit_channel.send(msg)
                tripsit_channel = self.bot.get_channel(CHANNEL_TRIPSIT_ID)
                # logger.debug(f"tripsit_channel: {tripsit_channel}")
                thread = await tripsit_channel.create_thread(
                    name = f"{patient.name} chat here!",
                    reason = f"{ctx.author.name}#{ctx.author.discriminator} has started a thread",
                    auto_archive_duration = 1440,
                    type = discord.ChannelType.private_thread,
                )
                # logger.debug(f"thread: {thread}")

                await thread.send(
                    content = msg,
                    allowed_mentions=discord.AllowedMentions(
                        everyone=False,
                        users=True,
                        roles=True,
                        replied_user=False
                    )
                )

                embed = discord.Embed(
                    color = discord.Colour.random()
                )
                embed.set_author(
                    name="TripSit.Me",
                    url="http://www.tripsit.me",
                    icon_url = TS_ICON)
                if user_provided:
                    embed.add_field(
                        name = f"Hey {ctx.author.name}, {patient.name} is now being helped!",
                        value = "We'll be with them shortly, thanks for caring!",
                        inline = False)
                else:
                    embed.add_field(
                        name = f"Hey {ctx.author.name}, you are now being helped!",
                        value = f"Check your channel list for '{ctx.author.name} chat here!'",
                        inline = False)
                embed.set_footer(
                    text = "Thanks for using Tripsit.Me!")
                await ctx.respond(
                    embed=embed)

                msg = f"Hey {tripsitter_role.mention}, {patient.name} can use some help, use this thread to talk \
about it!"
                # logger.debug(f"msg: {msg}")
                tripsitters_channel = self.bot.get_channel(CHANNEL_TRIPSITTERS_ID)
                # logger.debug(f"tripsit_channel: {tripsit_channel}")
                thread = await tripsitters_channel.create_thread(
                    name = f"{patient.name} dicuss here!",
                    reason = f"{ctx.author.name}#{ctx.author.discriminator} has started a thread",
                    auto_archive_duration = 1440,
                    type = discord.ChannelType.private_thread,
                )
                # logger.debug(f"thread: {thread}")
                await thread.send(
                    content = msg,
                    allowed_mentions=discord.AllowedMentions(
                        everyone=False,
                        users=True,
                        roles=True,
                        replied_user=False
                    )
                )
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
