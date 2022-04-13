'''A module made by Moonbear of Tripsit'''
import sys
import os
import json
import logging
import math
from thefuzz import process
import discord
from discord.ext import commands, pages
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
PRD_GUILD = os.getenv('GUILD_ID_PRD')
DEV_GUILD = os.getenv('GUILD_ID_DEV')
GUILD_LIST = [PRD_GUILD, DEV_GUILD]
TS_ICON = 'https://fossdroid.com/images/icons/me.tripsit.tripmobile.13.png'
PREFIX = "test_"
DISCLAIMER = "Please dose responsibly, this info does not replace talking with a medical professional."

with open('allDrugData.json', 'r', encoding='UTF-8') as filehandle:
    ALL_DRUG_DATA = json.load(filehandle)

# For each dictionary in the ALL_DRUG_DATA JSON file, find the "name" key and add it to a list
ALL_DRUG_NAMES = [drug["name"] for drug in ALL_DRUG_DATA]
# logger.debug(f'[{PREFIX}] ALL_DRUG_NAMES: {ALL_DRUG_NAMES}")

TOP_PSYCHS = ["Cannabis", "MDMA", "LSD", "DMT", "Mushrooms"]
TOP_DISSOS = ["Zolpidem", "Ketamine", "DXM", "PCP", "Salvia"]
TOP_OPIATE = ["Alcohol", "Hydrocodone", "Oxycodone", "Tramadol", "Heroin"]
TOP_BENZOS = ["Alprazolam", "Clonazepam", "Diazepam", "Lorazepam", "Flunitrazepam"]
TOP_SPEEDS = ["Nicotine", "Amphetamine", "Cocaine", "Methamphetamine", "Methylphenidate"]
TOP_DRUGS  = TOP_PSYCHS + TOP_DISSOS + TOP_OPIATE + TOP_BENZOS + TOP_SPEEDS
# logger.debug(f'[{PREFIX}] TOP_DRUGS: {TOP_DRUGS}")

for each_drug in TOP_DRUGS:
    try:
        ALL_DRUG_NAMES.remove(each_drug)
        # logger.debug(f'[{PREFIX}] Removed {each_drug} from ALL_DRUG_NAMES")
    except ValueError:
        continue

FINAL_DRUG_LIST = TOP_DRUGS + ALL_DRUG_NAMES
# logger.debug(f'[{PREFIX}] FINAL_DRUG_LIST: {FINAL_DRUG_LIST}")

async def drug_searcher(ctx: discord.AutocompleteContext):
    """Returns a list of drugs that begin with the characters entered so far."""
    # return [drugname for drugname in FINAL_DRUG_LIST if drugname.startswith(ctx.value)]
    if ctx.value != "":
        return [result[0] for result in process.extract(ctx.value, FINAL_DRUG_LIST)]
    else:
        return FINAL_DRUG_LIST


class Test(commands.Cog):
    '''
    TODO
    '''
    def __init__(self, bot):
        self.bot = bot

    @slash_command(
        name = "test",
        description = "Lookup substance information!",
        guild_ids=GUILD_LIST)
    @commands.is_owner()
    async def test(
        self,
        ctx,
        substance: Option(
            str,
            "Pick a substance!",
            autocomplete=discord.utils.basic_autocomplete(drug_searcher)
        ),
        view: Option(
            str,
            "Type of response",
            choices=["Summary","Dosage","Combos"]
        ) = "Summary"
    ):
        '''
        This function looks up drug information on the tripsit API

        Depending on the option, it returns either a Summary, the Properties or a Paged view
        It will default to Summary view, which is Everything - Properties - Combos - Links - PWEffects
        Properties view will specifically view the properties
        Considering making a Sources, Links, Combos and PWEffects option
        '''
        output = f'[{PREFIX}] {ctx.author.name}#{ctx.author.discriminator} activated'
        try:
            output = f'{output} on {ctx.guild.name}'
        except AttributeError:
            pass
        finally:
            logger.info(output)
        logger.info(f'[{PREFIX}] parameters: {substance} {view}')
        wiki_url = f'https://wiki.tripsit.me/wiki/{substance}'

        # Lookup substance in ALL_DRUG_DATA
        for drug in ALL_DRUG_DATA:
            if drug["name"] == substance:
                drug_data = drug
                break

        summary = ""
        if drug_data["summary"] is not None:
            summary += drug_data["summary"] + "\n\n"
        if drug_data["aliases"] is not None:
            alias_string = ""
            for each in drug_data["aliases"]:
                alias_string += f'{each}, '
            if alias_string != "":
                summary += f'**Also known as:** \n{alias_string[:-2]}\n\n'
        if drug_data["classes"] is not None:
            if drug_data["classes"]["chemical"] is not None:
                class_string = ""
                for each_class in drug_data["classes"]["chemical"]:
                    class_string += f'{each_class}, '
                summary += f'**Chemical Class(es):** {class_string[:-2]}\n\n'
        if drug_data["classes"] is not None:
            if drug_data["classes"]["psychoactive"] is not None:
                class_string = ""
                for each_class in drug_data["classes"]["psychoactive"]:
                    class_string += f'{each_class}, '
                summary += f'**Psychoactive Class(es):** {class_string[:-2]}\n\n'

        if drug_data["reagents"] is not None:
            summary += f'**Reagent test results:** \n {drug_data["reagents"]}\n\n'
        if drug_data["toxicity"] is not None:
            toxic_string = ""
            for each_toxic in drug_data["toxicity"]:
                toxic_string += f'{each_toxic}, '
            summary += f'**Toxicity:** {toxic_string[:-2]}\n\n'
        if drug_data["addictionPotential"] is not None:
            summary += f'**Addiction Potential:** {drug_data["addictionPotential"]}\n\n'
        # if (!!drug_data["url"] is not None:{summary += "Links: \n{drug_data["url"]}\n' + drug_data["experiencesUrl"]}
        # if (!!drug_data["experiencesUrl"] is not None:{summary += "\n{drug_data["experiencesUrl"]}

        dosage = ""
        for each_roa in drug_data["roas"]:
            # logger.debug(f'[{PREFIX}] each_roa: {each_roa}')
            dosage += f'\n**{each_roa["name"]} Dosage**\n'
            if "bioavailability" in each_roa:
                if each_roa["bioavailability"] is not None:
                    dosage += f'Bioavailability: {each_roa["bioavailability"]}\n'
            if "dosage" in each_roa:
                if each_roa["dosage"] is not None:
                    # logger.debug(f'[{PREFIX}] each_roa["dosage"]: {each_roa["dosage"]}')
                    j = 0
                    for each_dose in each_roa["dosage"]:
                        # logger.debug(f'[{PREFIX}] each_dose: {each_dose}')
                        if j == 0:
                            if "note" in each_roa:
                                if each_dose["note"] is not None:
                                    dosage += f'Note: {each_dose["Note"]}\n'
                        # logger.debug(f'[{PREFIX}] each_dose["name"]: {each_dose["name"]}')
                        # logger.debug(f'[{PREFIX}] each_dose["value"]: {each_dose["value"]}')
                        dosage += f'{each_dose["name"]}: {each_dose["value"]}\n'
                    j += 1
            if "duration" in each_roa:
                if each_roa["duration"] is not None:
                    k = 0
                    dosage += f'\n**{each_roa["name"]} Duration**\n'
                    for each_duration in each_roa['duration']:
                        if k == 0:
                            if "note" in each_roa:
                                if each_duration["note"] is not None:
                                    dosage += f'Note: {each_duration["Note"]}\n'
                        dosage += f'{each_duration["name"]}: {each_duration["value"]}\n'

        if drug_data["tolerance"]:
            dosage += "\n**Tolerance**\n"

            if drug_data["tolerance"]["full"] is not None:
                dosage += f'Full: {drug_data["tolerance"]["full"]}\n'
            if drug_data["tolerance"]["half"] is not None:
                dosage += f'Half: {drug_data["tolerance"]["half"]}\n'
            if drug_data["tolerance"]["zero"] is not None:
                dosage += f'Zero: {drug_data["tolerance"]["zero"]}\n'
        if drug_data["crossTolerances"] is not None:
            logger.debug(f"[{PREFIX}] drug_data['crossTolerances']: {drug_data['crossTolerances']}")
            crostol_string = ""
            for each_crostol in drug_data["crossTolerances"]:
                crostol_string += f'{each_crostol}, '
            dosage += f'\n**Toxicity:** {crostol_string[:-2]}\n\n'

        if drug_data["interactions"] is not None:
            # For each interaction status, make a list of those names
            interactions = drug_data["interactions"]
            danger_section = ""
            unsafe_section = ""
            caution_section = ""
            decrease_section = ""
            nosyn_section = ""
            synergy_section = ""
            unknown_section = ""
            for each_interaction in interactions:
                if each_interaction["status"] == "Dangerous":
                    danger_section += f'**{each_interaction["name"]}**\n'
                    if "note" in each_interaction:
                        if each_interaction["note"] is not None:
                            danger_section += f'Note: {each_interaction["note"]}\n'
                elif each_interaction["status"] == "Unsafe":
                    unsafe_section += f'**{each_interaction["name"]}**\n'
                    if "note" in each_interaction:
                        if each_interaction["note"] is not None:
                            unsafe_section += f'Note: {each_interaction["note"]}\n'
                elif each_interaction["status"] == "Caution":
                    caution_section += f'**{each_interaction["name"]}**\n'
                    if "note" in each_interaction:
                        if each_interaction["note"] is not None:
                            caution_section += f'Note: {each_interaction["note"]}\n'
                elif each_interaction["status"] == "Low Risk & Decrease":
                    decrease_section += f'**{each_interaction["name"]}**\n'
                    if "note" in each_interaction:
                        if each_interaction["note"] is not None:
                            decrease_section += f'Note: {each_interaction["note"]}\n'
                elif each_interaction["status"] == "Low Risk & No Synergy":
                    nosyn_section += f'**{each_interaction["name"]}**\n'
                    if "note" in each_interaction:
                        if each_interaction["note"] is not None:
                            nosyn_section += f'Note: {each_interaction["note"]}\n'
                elif each_interaction["status"] == "Low Risk & Synergy":
                    synergy_section += f'**{each_interaction["name"]}**\n'
                    if "note" in each_interaction:
                        if each_interaction["note"] is not None:
                            synergy_section += f'Note: {each_interaction["note"]}\n'
                elif each_interaction["status"] == "Unknown":
                    unknown_section += f'**{each_interaction["name"]}**\n'
                    if "note" in each_interaction:
                        if each_interaction["note"] is not None:
                            unknown_section += f'Note: {each_interaction["note"]}\n'

        if view == "Summary":
            if summary != "":
                # logger.debug(len(summary))
                # logger.debug(summary)
                embed = discord.Embed()
                embed.set_author(name = f"TripSit.Me - {substance}", url = wiki_url, icon_url = TS_ICON)
                embed.add_field(name = "Summary", value = summary, inline = False)
                embed.set_footer(text = DISCLAIMER)
                await ctx.respond(embed=embed)
        if view == "Dosage":
            if dosage != "":
                logger.debug(len(dosage))
                book = []
                # logger.debug(dosage)
                if len(dosage) > 1024:
                    # logger.debug(f'[{PREFIX}] {section} is too long')
                    entire_message = dosage
                    message_length = math.ceil(len(entire_message) / 1000)
                    # logger.debug(f"[{PREFIX}] I will make {message_length} messages")
                    messages_built = 0
                    message_start = 0
                    message_end = 1000
                    while messages_built < message_length:
                        # logger.debug(f"[{PREFIX}] looking for last ) between {message_start} and {message_end}")
                        message_end = entire_message.rfind("\n",message_start,message_end) + 1
                        # logger.debug(f"[{PREFIX}] Found the last ) at {message_end}")
                        message_part = entire_message[message_start:message_end]
                        # logger.debug(f"[{PREFIX}] setting new start to {message_end}")
                        message_start = message_end
                        message_end += 1000
                        messages_built += 1
                        embed = discord.Embed()
                        embed.set_author(name = f"TripSit.Me - {substance}", url = wiki_url, icon_url = TS_ICON)
                        embed.add_field(name = "Dosage", value = message_part, inline = False)
                        embed.set_footer(text = DISCLAIMER)
                        book.append(embed)
                if len(dosage) > 0 and len(dosage) <= 1024:
                    # logger.debug(f'[{PREFIX}] name: {name}')
                    # logger.debug(f'[{PREFIX}] text: {text}')
                    # logger.debug(f'[{PREFIX}] {section} is not too long')
                    embed = discord.Embed()
                    embed.set_author(name = f"TripSit.Me - {substance}", url = wiki_url, icon_url = TS_ICON)
                    embed.add_field( name = "Dosage", value = dosage, inline = False)
                    embed.set_footer(text = DISCLAIMER)
                    book.append(embed)
                if len(book) > 0:
                    # logger.debug(f"[{PREFIX}] Sending {len(book)} messages")
                    # logger.debug(book)
                    paginator = pages.Paginator(pages=book)
                    await paginator.respond(ctx.interaction, ephemeral=False)
                else:
                    # logger.debug(f"[{PREFIX}] No messages to send")
                    await ctx.respond(f"No interactions found for {substance}")
        if view == "Combos":
            book = []
            combo_sections = [
                {
                    "name": "Dangerous",
                    "definition": "These combinations are considered extremely harmful and should always be avoided. \
                Reactions to these drugs taken in combination are highly unpredictable and have a \
                    potential to cause death.",
                    "text": danger_section,
                    "color": discord.Colour.red(),
                    "icon": "☠️",
                    "thumbnail": "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/samsung/320/skull-and-crossbones_2620-fe0f.png",
                    },
                {
                    "name": "Unsafe",
                    "definition": "There is considerable risk of physical harm when taking these combinations, they \
                should be avoided where possible.",
                    "text": unsafe_section,
                    "color": discord.Colour.orange(),
                    "icon": "🛑",
                    "thumbnail": "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/samsung/320/stop-sign_1f6d1.png",
                    },
                {
                    "name": "Caution",
                    "definition": "These combinations are not usually physically harmful, but may produce undesirable \
                effects, such as physical discomfort or overstimulation. Extreme use may cause physical\
                     health issues. Synergistic effects may be unpredictable. Care should be taken when\
                          choosing to use this combination.",
                    "text": caution_section,
                    "color": discord.Colour.yellow(),
                    "icon": "⚠️",
                    "thumbnail": "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/samsung/320/caution-sign_2621.png",
                    },
                {
                    "name": "Low Risk & Decrease",
                    "definition": "Effects are substractive. The combination is unlikely to cause any adverse or \
                undersirable reaction beyond those that might ordinarily be expected from these drugs.",
                    "text": decrease_section,
                    "color": discord.Colour.teal(),
                    "icon": "↘",
                    "thumbnail": "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/samsung/320/down-right-arrow_2198-fe0f.png",
                    },
                {
                    "name": "Low Risk & No Synergy",
                    "definition": "Effects are additive. The combination is unlikely to cause any adverse or undesirable\
                 reaction beyond those that might ordinarily be expected from these drugs.",
                    "text": nosyn_section,
                    "color": discord.Colour.blue(),
                    "icon": "➡",
                    "thumbnail": "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/samsung/320/right-arrow_27a1-fe0f.png",
                    },
                {
                    "name": "Low Risk & Synergy",
                    "definition": "These drugs work together to cause an effect greater than the sum of its parts,\
                 and they aren't likely to cause an adverse or undesirable reaction when used carefully.\
                      Additional research should always be done before combining drugs.",
                    "text": synergy_section,
                    "color": discord.Colour.dark_blue(),
                    "icon": "↗",
                    "thumbnail": "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/samsung/320/up-right-arrow_2197-fe0f.png",
                    },
                {
                    "name": "Unknown",
                    "definition": "The status of the interaction are unknown.",
                    "text": unknown_section, 
                    "color": discord.Colour.random(),
                    "icon": "❓",
                    "thumbnail": "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/samsung/320/question-mark_2753.png",
                    }
            ]
            for section in combo_sections:
                name = section["name"]
                definition = section["definition"]
                text = section["text"]
                color = section["color"]
                icon = section["icon"]
                thumbnail = section["thumbnail"]
                title = f"{icon} {name} {icon}"

                if len(text) > 1024:
                    # logger.debug(f'[{PREFIX}] {section} is too long')
                    entire_message = text
                    message_length = math.ceil(len(entire_message) / 1000)
                    # logger.debug(f"[{PREFIX}] I will make {message_length} messages")
                    messages_built = 0
                    message_start = 0
                    message_end = 1000
                    while messages_built < message_length:
                        # logger.debug(f"[{PREFIX}] looking for last ) between {message_start} and {message_end}")
                        message_end = entire_message.rfind("\n",message_start,message_end) + 1
                        # logger.debug(f"[{PREFIX}] Found the last ) at {message_end}")
                        message_part = entire_message[message_start:message_end]
                        # logger.debug(f"[{PREFIX}] setting new start to {message_end}")
                        message_start = message_end
                        message_end += 1000
                        messages_built += 1
                        embed = discord.Embed(
                            color = color
                        )
                        embed.set_author(name = f"TripSit.Me - {substance}", url = wiki_url, icon_url = TS_ICON)
                        embed.add_field(name = title, value = message_part, inline = False)
                        embed.set_footer(text = DISCLAIMER)
                        embed.set_thumbnail(url = thumbnail)
                        book.append(embed)
                    continue
                if len(text) > 0 and len(text) <= 1024:
                    # logger.debug(f'[{PREFIX}] name: {name}')
                    # logger.debug(f'[{PREFIX}] text: {text}')
                    # logger.debug(f'[{PREFIX}] {section} is not too long')
                    embed = discord.Embed(
                        color = color
                    )
                    embed.set_author(name = f"TripSit.Me - {substance}", url = wiki_url, icon_url = TS_ICON)
                    embed.add_field( name = title, value = text, inline = False)
                    embed.set_footer(text = DISCLAIMER)
                    embed.set_thumbnail(url = thumbnail)
                    book.append(embed)
            if len(book) > 0:
                # logger.debug(f"[{PREFIX}] Sending {len(book)} messages")
                # logger.debug(book)
                paginator = pages.Paginator(pages=book)
                await paginator.respond(ctx.interaction, ephemeral=False)
            else:
                # logger.debug(f"[{PREFIX}] No messages to send")
                await ctx.respond(f"No interactions found for {substance}")

            # if danger_section != "":
            #     # logger.debug(f"[{PREFIX}] danger_section: {len(danger_section)}")
            #     embed = discord.Embed()
            #     embed.set_author(name = f"TripSit.Me - {substance}", url = wiki_url, icon_url = TS_ICON)
            #     embed.add_field(name = "Danger", value = danger_section, inline = False)
            #     embed.set_footer(text = DISCLAIMER)
            #     book.append(embed)
            # if unsafe_section != "":
            #     # logger.debug(f"[{PREFIX}] unsafe_section: {len(unsafe_section)}")
            #     embed = discord.Embed()
            #     embed.set_author(name = f"TripSit.Me - {substance}", url = wiki_url, icon_url = TS_ICON)
            #     embed.add_field(name = "Unsafe", value = unsafe_section, inline = False)
            #     embed.set_footer(text = DISCLAIMER)
            #     book.append(embed)
            # if caution_section != "":
            #     # logger.debug(f"[{PREFIX}] caution_section: {len(caution_section)}")
            #     # logger.debug(caution_section)
            #     embed = discord.Embed()
            #     embed.set_author(name = f"TripSit.Me - {substance}", url = wiki_url, icon_url = TS_ICON)
            #     embed.add_field(name = "Caution", value = caution_section, inline = False)
            #     embed.set_footer(text = DISCLAIMER)
            #     book.append(embed)
            # if decrease_section != "":
            #     # logger.debug(f"[{PREFIX}] decrease_section: {len(decrease_section)}")
            #     embed = discord.Embed()
            #     embed.set_author(name = f"TripSit.Me - {substance}", url = wiki_url, icon_url = TS_ICON)
            #     embed.add_field(name = "Decrease", value = decrease_section, inline = False)
            #     embed.set_footer(text = DISCLAIMER)
            #     book.append(embed)
            # if nosyn_section != "":
            #     # logger.debug(f"[{PREFIX}] nosyn_section: {len(nosyn_section)}")
            #     embed = discord.Embed()
            #     embed.set_author(name = f"TripSit.Me - {substance}", url = wiki_url, icon_url = TS_ICON)
            #     embed.add_field(name = "No Synergy", value = nosyn_section, inline = False)
            #     embed.set_footer(text = DISCLAIMER)
            #     book.append(embed)
            # if synergy_section != "":
            #     # logger.debug(f"[{PREFIX}] synergy_section: {len(synergy_section)}")
            #     embed = discord.Embed()
            #     embed.set_author(name = f"TripSit.Me - {substance}", url = wiki_url, icon_url = TS_ICON)
            #     embed.add_field(name = "Synergy", value = synergy_section, inline = False)
            #     embed.set_footer(text = DISCLAIMER)
            #     book.append(embed)
            # if unknown_section != "":
            #     # logger.debug(f"[{PREFIX}] unknown_section: {len(unknown_section)}")
            #     embed = discord.Embed()
            #     embed.set_author(name = f"TripSit.Me - {substance}", url = wiki_url, icon_url = TS_ICON)
            #     embed.add_field(name = "Unknown", value = unknown_section, inline = False)
            #     embed.set_footer(text = DISCLAIMER)
            #     book.append(embed)

            # if len(book) == 0:
            #     embed.set_author(name = f"TripSit.Me - {substance}", url = wiki_url, icon_url = TS_ICON)
            #     embed.add_field(name = "Combinations Uknown!", value = "?????", inline = False)
            #     embed.set_footer(text = DISCLAIMER)
            #     await ctx.respond(embed=embed)



def setup(bot):
    '''
    This registers this file into to the bot.
    Note: You must still "bot.load_extension("cogs.external")" in the main file!
    '''
    # logger.debug(f'[{PREFIX}] Starting!')
    bot.add_cog(Test(bot))

def teardown():
    '''Shutdown function'''
    # logger.debug(f'[{PREFIX}] Stopping!')
