'''
This module performs admin functions like reloading stuff
'''
import os
import sys
import json
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
GUILD_ID_DEV = os.getenv('GUILD_ID_DEV')
GUILD_ID_PRD = os.getenv('GUILD_ID_PRD')
GUILD_LIST = [GUILD_ID_DEV, GUILD_ID_PRD]

DATABASE_NAME = 'userdb.json'


class Admin(commands.Cog):
    """Admin-only commands that make the bot dynamic."""
    def __init__(self, bot):
        self.bot = bot
        self._last_result = None
        self.sessions = set()
        with open(DATABASE_NAME, 'r', encoding='UTF-8') as file:
            all_data = json.load(file)
        if "blacklist" in all_data.keys():
            blacklist = all_data["blacklist"]
        else:
            blacklist = {}

        if "guilds" in blacklist.keys():
            blacklist_guilds = blacklist["guilds"]
        else:
            blacklist_guilds = {}

        if "users" in blacklist.keys():
            blacklist_users = blacklist["users"]
        else:
            blacklist_users = {}

        self.blacklist_guilds = blacklist_guilds
        self.blacklist_users = blacklist_users

        logger.debug(f"[BLgld] {self.blacklist_guilds}")
        logger.debug(f"[BLusr] {self.blacklist_users}")

    @commands.Cog.listener()
    async def on_guild_join(self, guild):
        '''
        Check if you're in a banned guild and leave
        '''
        logger.info(f"I have joined {guild}!")
        with open(DATABASE_NAME, 'r', encoding='UTF-8') as file:
            all_data = json.load(file)  
        blacklist = all_data["blacklist"]
        blacklist_guilds = blacklist["guilds"]
        if str(guild.id) in blacklist_guilds:
            logger.info(f'[{PREFIX}] GuildID: {guild.id} is banned, leaving!')
            await guild.leave()

    @commands.Cog.listener()
    async def on_ready(self):
        '''When the bot is ready, it will check what guilds it's in, and leave banned guilds'''
        # logger.debug(f"discord.Bot.guilds: {self.bot.guilds}")
        logger.debug(f"blacklist_guilds: {self.blacklist_guilds}")
        list_of_guilds = self.bot.guilds
        logger.debug(f"{self.bot.user} is connected to the following guilds:")
        for each in list_of_guilds:
            logger.info(f"I am in {each} ({each.id})!")
            with open(DATABASE_NAME, 'r', encoding='UTF-8') as file:
                all_data = json.load(file)  
            blacklist = all_data["blacklist"]
            blacklist_guilds = blacklist["guilds"]
            if str(each.id) in blacklist_guilds:
                logger.info(f'[{PREFIX}] GuildID: {each.id} is banned, leaving!')
                await each.leave()

    @slash_command(
        name = "guildban",
        aliases = ["gban"],
        usage = "guildban <guild_id>",
        description = "Bans a guild from the bot",
        guild_ids=GUILD_LIST)
    @commands.is_owner()
    async def guildban(self, ctx, guild_id):
        '''
        Ban a guild from the bot
        '''
        with open(DATABASE_NAME, 'r', encoding='UTF-8') as file:
            all_data = json.load(file)

        blacklist = all_data["blacklist"]
        blacklist_guilds = blacklist["guilds"]
        if str(guild_id) in blacklist_guilds:
            await ctx.respond(f"{guild_id} is already banned!")
        else:
            blacklist_guilds.append(guild_id)
            blacklist["guilds"] = blacklist_guilds
            logger.debug(f"blacklist_guilds: {blacklist_guilds}")
            all_data['blacklist'] = blacklist

            with open(DATABASE_NAME, 'w', encoding='UTF-8') as file:
                json.dump(all_data, file, indent=4)

            list_of_guilds = self.bot.guilds
            logger.debug(f"{self.bot.user} is connected to the following guilds:")
            for each in list_of_guilds:
                logger.info(f"I am in {each} ({each.id})!")
                if str(each.id) in blacklist_guilds:
                    logger.info(f'[{PREFIX}] GuildID: {each.id} is banned, leaving!')
                    await each.leave()
            await ctx.respond(f"{guild_id} is now banned!")

    @slash_command(
        name = "guildunban",
        aliases = ["gunban"],
        usage = "guildunban <guild_id>",
        description = "Unbans a guild from the bot",
        guild_ids=GUILD_LIST)
    @commands.is_owner()
    async def guildunban(self, ctx, guild_id):
        '''
        Unban a guild from the bot
        '''
        with open(DATABASE_NAME, 'r', encoding='UTF-8') as file:
            all_data = json.load(file)
        if "blacklist" in all_data.keys():
            blacklist = all_data["blacklist"]
        else:
            blacklist = {}
        logger.debug(f"self.blacklist: {blacklist}")

        if guild_id in blacklist["guilds"]:
            del blacklist[guild_id]
            await ctx.respond(f"{guild_id} is now unbanned!")

            all_data['blacklist_guilds'] = blacklist

            with open(DATABASE_NAME, 'w', encoding='UTF-8') as file:
                json.dump(all_data, file, indent=4)
        else:
            await ctx.respond(f"{guild_id} is not banned!")

    @slash_command(name = "admin",
        description = "Handles modules",
        guild_ids=GUILD_LIST
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
    #     guild_ids=GUILD_LIST)
    # async def add_to_blacklist(self, object_id):
    #     '''
    #     Ban this user/guild
    #     '''
    #     await self.blacklist.put(object_id, True)

    # @slash_command(name = "whitelist",
    #     description = "Remove from blacklist",
    #     guild_ids=GUILD_LIST)
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
