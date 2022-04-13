'''A module made by Moonbear of Tripsit'''
import os
import logging
import sys
import traceback
import discord
from discord.ext import commands
from dotenv import load_dotenv
load_dotenv() # load all the variables from the env file
my_guild = os.getenv('luna_guild_id')
ts_guild = os.getenv('GUILD_ID_TRIPSIT')
guild_list = [my_guild, ts_guild]

logger = logging.getLogger(__file__)
logger.setLevel(logging.DEBUG)
handler = logging.FileHandler(filename='discord.log', encoding='utf-8', mode='w')
handler.setFormatter(logging.Formatter('%(levelname)s: %(message)s'))
logger.addHandler(handler)
logger.addHandler(logging.StreamHandler(sys.stdout))

PREFIX = "dscrd"

DESC = 'A discord bot with harm reduction tools, made with love'

initial_extensions = [
    "about",
    "breathe",
    "combo",
    "contact",
    "hydrate",
    "idose",    # PM only
    "info",
    "kipp",
    "remindme", # in dev
    "karma",    # tripsit only
    "topic",
    "tsapi",    # admin only
    "admin",    # admin only
    "tripsit",  # tripsit only
    "test",     # admin only
    # "db",
    # "sopel",
]

class MyDiscordClient(discord.Bot):
    '''
    The tripsit discord client
    '''
    def __init__(self):
        intents = discord.Intents(
            guilds=True,        # In case i need to ban a guild
            members=True,       # To grab member information like their ID
            bans=True,          # To ban users via command from IRC
            emojis=True,        # To use emojis
            reactions=True,     # For the karma module
            voice_states=False,
            messages=False,
        )
        super().__init__(
            # command_prefix=_prefix_callable,
            description=DESC,
            # pm_help=None,
            # help_attrs=dict(hidden=True),
            # chunk_guilds_at_startup=False,
            # heartbeat_timeout=150.0,
            # allowed_mentions=allowed_mentions,
            intents=intents,
            enable_debug_events=True,
        )

        self.uptime = discord.utils.utcnow()

        for extension in initial_extensions:
            try:
                self.load_extension(f"cogs.{extension}")
            except discord.ExtensionNotFound:
                logger.error(f'[{PREFIX}] Failed to load extension {extension}.', file=sys.stderr)
                traceback.print_exc()
            except discord.ExtensionAlreadyLoaded:
                logger.error(f'[{PREFIX}] Failed to load extension {extension}.', file=sys.stderr)
                traceback.print_exc()
            except discord.NoEntryPointError:
                logger.error(f'[{PREFIX}] Failed to load extension {extension}.', file=sys.stderr)
                traceback.print_exc()
            except discord.ExtensionFailed:
                logger.error(f'[{PREFIX}] Failed to load extension {extension}.', file=sys.stderr)
                traceback.print_exc()

    async def on_connect(self):
        '''
        On connect
        '''
        logger.info(f"[{PREFIX}] Connected")

    async def on_disconnect(self):
        '''
        On disconnect
        '''
        logger.info(f"[{PREFIX}] Disconnected")

    async def on_resumed(self):
        '''
        On resume
        '''
        logger.info(f"[{PREFIX}] Resumed")

    async def on_ready(self):
        '''
        On Ready function
        '''
        if not hasattr(self, 'uptime'):
            self.uptime = discord.utils.utcnow()
        logger.info(f'[{PREFIX}] Ready: {self.user} (ID: {self.user.id})')
        # info = await discord.Bot.application_info(self)
        # logger.info(info)

    async def on_command_error(self, ctx, error):
        '''
        On error from message commands, not really used?
        '''
        if isinstance(error, commands.NoPrivateMessage):
            await ctx.author.send('This command cannot be used in private messages.')
        elif isinstance(error, commands.DisabledCommand):
            await ctx.author.send('Sorry. This command is disabled and cannot be used.')
        elif isinstance(error, commands.CommandInvokeError):
            original = error.original
            if not isinstance(original, discord.HTTPException):
                logger.error(f'[{PREFIX}] In {ctx.command.qualified_name}:', file=sys.stderr)
                traceback.print_tb(original.__traceback__)
                logger.error(f'[{PREFIX}] {original.__class__.__name__}: {original}', file=sys.stderr)
        elif isinstance(error, commands.ArgumentParsingError):
            await ctx.send(error)

    async def on_application_command_error(self, ctx, error):
        '''
        Handles errors from the cooldowns
        '''
        if isinstance(error, commands.NoPrivateMessage):
            await ctx.respond('This command cannot be used in private messages.')
        if isinstance(error, commands.PrivateMessageOnly):
            await ctx.respond('This command can only be used in private messages.')
        elif isinstance(error, commands.DisabledCommand):
            await ctx.respond('Sorry. This command is disabled and cannot be used.')
        elif isinstance(error, commands.CommandInvokeError):
            original = error.original
            if not isinstance(original, discord.HTTPException):
                logger.error(f'[{PREFIX}] In {ctx.command.qualified_name}:', file=sys.stderr)
                traceback.print_tb(original.__traceback__)
                logger.error(f'[{PREFIX}] {original.__class__.__name__}: {original}', file=sys.stderr)
        elif isinstance(error, commands.ArgumentParsingError):
            await ctx.respond(error)
        elif isinstance(error, commands.CommandOnCooldown):
            await ctx.respond("This command is currently on cooldown.")
        elif isinstance(error, commands.MissingPermissions):
            await ctx.respond(error)
        elif isinstance(error, commands.NotOwner):
            print(error)
            await ctx.respond(error)
        else:
            raise error  # raise other errors so they aren't ignored

    def run(self):
        '''
        Starting self!
        '''
        super().run(os.getenv('TRIPSITMEBOT'), reconnect=True)
        # finally:
        #     with open('prev_events.log', 'w', encoding='utf-8') as log_file:
        #         for data in self._prev_events:
        #             try:
        #                 info = json.dumps(json.loads(data), ensure_ascii=True, indent=4)
        #             except Exception as exception:
        #                 logger.error(exception)
        #                 log_file.write(f'{data}\n')
        #             else:
        #                 log_file.write(f'{info}\n')

discord_client = MyDiscordClient()
discord_client.run()
