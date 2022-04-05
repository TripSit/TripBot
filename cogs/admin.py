'''
This module performs admin functions like reloading stuff
'''
import os
import sys
import logging
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

PREFIX = "admin"
my_guild = os.getenv('GUILD_ID_DEV')
ts_guild = os.getenv('GUILD_ID_PRD')
guild_list = [my_guild]

class Admin(commands.Cog):
    """Admin-only commands that make the bot dynamic."""
    #TODO add ban functions

    def __init__(self, bot):
        self.bot = bot
        self._last_result = None
        self.sessions = set()

    @commands.Cog.listener()
    async def on_guild_join(self, guild):
        '''
        Check if you're in a banned guild and leave
        '''
        logger.info(f"I have joined {guild}!")
        # if guild.id in self.blacklist:
        #     logger.info(f'[{PREFIX}] GuildID: {guild.id} is banned, leaving!')
        #     await guild.leave()

    @slash_command(name = "admin",
        description = "Handles modules",
        guild_ids=guild_list
        )
    @commands.is_owner()
    async def admin(
        self,
        ctx,
        *,
        module: Option(
            str,
            "Pick a module!",
            choices=[
                "karma",
                "topic",
                "breathe",
                "combo",
                "contact",
                "hydrate",
                "idose",
                "info",
                "kipp",
                "remindme",
                "admin",
                "about"
            ]
            ),
        task: Option(
            str,
            "What are you doing with it?",
            choices=["Reload","Load","Unload"]),
        ):
        '''
        Depending on the option, this will handle modules
        '''
        if ctx.author.id != 177537158419054592:
            await ctx.respond('You need to be an admin to do this!')
            return


        output = f"[{PREFIX}] activated by {ctx.author.name}#{ctx.author.discriminator} "
        try:
            output = f"{output} on {ctx.guild.name}"
        except AttributeError:
            pass
        finally:
            logger.info(output)

        if task == "Reload":
            # Reloads a module.
            try:
                self.bot.reload_extension(f"cogs.{module}")
                logger.info(f"[admin] Reloaded module {module}")
            except discord.ExtensionNotLoaded:
                self.bot.load_extension(f"cogs.{module}")
                logger.info(f"[admin] Loaded module {module}")
            except discord.ExtensionError as exception:
                await ctx.respond(f'{exception.__class__.__name__}: {exception}')
            else:
                await ctx.respond('\N{OK HAND SIGN}')
        if task == "Load":
            # Loads a module.
            try:
                self.bot.load_extension(f"cogs.{module}")
                logger.info(f"[admin] Loaded module {module}")
            except discord.ExtensionError as exception:
                await ctx.respond(f'{exception.__class__.__name__}: {exception}')
            else:
                await ctx.respond('\N{OK HAND SIGN}')
        if task == "Unload":
            # Unloads a module.
            try:
                self.bot.unload_extension(f"cogs.{module}")
                logger.info(f"[admin] Unloaded module {module}")
            except discord.ExtensionError as exception:
                await ctx.respond(f'{exception.__class__.__name__}: {exception}')
            else:
                await ctx.respond('\N{OK HAND SIGN}')

    # can_mute = message.author.guild_permissions.manage_roles
    # can_kick = message.author.guild_permissions.kick_members
    # can_ban = message.author.guild_permissions.ban_members
    # is_admin = message.author.guild_permissions.administrator
    # author_roles = message.author.roles
    # role_vip = False
    # # role_helper = False
    # # role_needshelp = False

    # if can_mute:
    #     if message.content.startswith(f'{PREFIX}quiet'):
    #         await sandbox_channel.send("I would quiet someone on IRC now, but i dont know how!")
    # if can_kick:
    #     if message.content.startswith(f'{PREFIX}kick'):
    #         await sandbox_channel.send("I would kick someone on IRC now, but i dont know how!")
    # if can_ban:
    #     if message.content.startswith(f'{PREFIX}nban'):
    #         await sandbox_channel.send("I would ban someone on IRC now, but i dont know how!")
    #     if message.content.startswith(f'{PREFIX}svsnick'):
    #         await sandbox_channel.send("I would change someone's nickname on IRC now, but i dont know how!")

    # @slash_command(name = "blacklist",
    #     description = "Add to blacklist",
    #     guild_ids=guild_list)
    # async def add_to_blacklist(self, object_id):
    #     '''
    #     Ban this user/guild
    #     '''
    #     await self.blacklist.put(object_id, True)

    # @slash_command(name = "whitelist",
    #     description = "Remove from blacklist",
    #     guild_ids=guild_list)
    # async def remove_from_blacklist(self, object_id):
    #     '''
    #     Unban this user/guild
    #     '''
    #     try:
    #         await self.blacklist.remove(object_id)
    #     except KeyError:
    #         pass

def setup(bot):
    '''
    This registers this file into to the bot.
    Note: You must still "bot.load_extension("cogs.external")" in the main file!
    '''
    logger.debug(f"[{PREFIX}] Starting!")
    bot.add_cog(Admin(bot))

def teardown():
    '''Shutdown function'''
    logger.debug(f"[{PREFIX}] Stopping!")
