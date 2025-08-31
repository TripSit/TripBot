/* eslint-disable max-len */
import { stripIndents } from 'common-tags';

export default class About {
  public static readonly name: string = 'TripSit';

  public static readonly url: string = 'https://tripsit.me/';

  public static readonly inviteUrl: string = 'https://discord.com/api/oauth2/authorize?client_id=957780726806380545&permissions=18432&scope=bot%20applications.commands';

  public static readonly discord: string = 'https://discord.gg/TripSit';

  public static readonly github: string = 'https://github.com/tripsit/tripbot';

  public static readonly botOwner: string = 'Moonbear';

  public static readonly learnUrl: string = 'https://learn.tripsit.me';

  public static readonly webchat: string = 'http://chat.tripsit.me';

  public static readonly botEmail: string = 'discord@tripsit.me';

  public static readonly contentEmail: string = 'content@tripsit.me';

  public static readonly patreon: string = 'https://www.patreon.com/TripSit';

  public static readonly discordSub: string = 'https://discord.com/servers/tripsit-179641883222474752';

  public static readonly kofi: string = 'https://ko-fi.com/tripsit';

  public static readonly spreadshop: string = 'https://tripsit.myspreadshop.com/';

  public static readonly spreadshirt: string = 'https://www.spreadshirt.com/shop/tripsit/';

  public static readonly tripsitSessionsDoc: string = 'https://docs.google.com/document/d/1Jy0VWTY2pj1EUS0uuoJQfK9LX0UjC-pyBYhAjBT67Ic/edit#heading=h.5n7ta7l8o6dk';

  public static readonly tripsitSessionsCourse: string = 'https://learn.tripsit.me/mod/lesson/view.php?id=24';

  public static readonly tripsitSessionsDesc:string = stripIndents`
    **What is a TripSit Session?**
    This is TripSit's help system, basically a support ticket system for people on substances!

    Full details on how to use this system can be found in our [guide document](${this.tripsitSessionsDoc}) and on our [learning portal](${this.tripsitSessionsCourse})!

    ** What does this to? **
    This will create a message in the Tripsit room with a button to create a new thread.
    When a user clicks this button they will be asked two vital questions for tripsitting, and then they submit the form.
    The Needshelp role will be assigned to the user and the bot will try to remove every other role the user has.
    This makes it so that people who need help are restricted to the Tripsit room and can't see any other channels.
    The bot will then create a new thread in the Tripsit room and ping the user, along with the Tripsitters and optionally Helpers.
    The user can then talk to the Tripsitters and Helpers in the thread.
    When the user is done with their session, they can click and the bot will reassign their roles.

    ** How do I set it up? **
    1. Create a room where you want a message posted and threads created (Tripsit)
    2. Create a room where people will talk about Tripsit encounters (Meta-tripsit)
    3. Create a role that will be assigned to users who need help (Needshelp)
    3a. Set up the permissions for this role so that it can only see the Tripsit room
    4. Create a role that will respond to new sessions (Tripsitter)
    5. (Optional) Create a secondary role that will respond to new sessions (Helper)
    6. Run the /setup tripsit command with each of the above channels and roles

    ** Troubleshooting **
    If you have any issues with this system, please contact Moonbear on the TripSit guild!
    They're happy to give direct support to any problems you may have!`;

  public static readonly description: string = stripIndents`
    TripSit is an organization which helps to provide factual information about drugs and how to reduce the harms involved in using them.\
    If you have issues/questions, the best way to get in contact with TeamTripsit is via the official [TripSit discord](${this.discord}),\
    or you can use \`/feedback\` to send a message to Moonbear, TripSit's director.`;

  public static readonly botInfo: string = stripIndents`
    TripBot is the main bot on the TripSit Discord guild and handles a little bit of everything, from harm reduction to fun commands.\
    It currently has 93 commands and you can get info on each of them by using the drop down menu below.`;

  public static readonly inviteInfo: string = stripIndents`
    Want to add TripBot to your server? It's as easy as clicking the button below!

    More advanced features, like using Tripsitting threads, require the bot to have more permissions.\
    Generally the bot will let you know if it's missing permissions.`;

  public static readonly disclaimer: string = stripIndents`
    The information here should be used as guidelines only, and it is important to do your own research from multiple sources before ingesting a substance.\
    TripBot and TripSit are not medical professionals. If you are experiencing a medical emergency, please call 911 or your local emergency number.`;

  public static readonly support: string = stripIndents`
  We'll never charge for our services or hide information behind paywalls or annoying ads. Our mission is to help anyone who needs it, no strings attached.\
  But we can't pay for servers with good intentions alone, so your support means the world to us.

  There are a few awesome ways to contribute:
  1) First of all, TripSit is a completely free service run by volunteers, and we are always looking for more help.\
  If you wish to help out, feel free to join the [discord](${this.discord}), and become a valuable member of the community.\
  [Take the course](${this.learnUrl}) and \`/learn link\` your discord account to get started as a Helper.

  If you want to support us financially, there are a few ways to do so:
  2) [Patreon Subscription](${this.patreon})
    For as little as $1 a month, you can become a patron and keep supporting the good cause.
    After a long enough subscription, you'll be sent some sweet TripSit merch!
    Active patreon subscribers also get a special role in the discord, exclusive to them.
  3) [Discord Subscription](${this.discord})
    If you prefer to keep everything on Discord, you can subscribe to us directly through Discord via the TripSit server and get the same perks as Patreon subscribers.
  4) [Ko-Fi Donation](${this.kofi})
    If Subscriptions aren't your style, you can give a one-time boost to our cause through Ko-Fi.
  5) No spare change? Boosting our server will also give you donor perks while your boost is active!

    What's in it for you? Well, we've got some fantastic benefits for our supporters:

    - **Announcement**: We'll tell the guild you've made a difference in #vip-lounge.
    - **Gold Lounge Access**: Gain entry to our exclusive donor space, #gold-lounge.
    - **Special Donor Colors**: Deck out your Discord persona with unique colors.
    - **Supporter Role (Patreon)**: Be shown at the top of the member list with a unique icon.
    - More surprises are in the works! Your suggestions are welcome.

    Your donations directly fuel our server costs, ensuring TripSit keeps doing what we do best.

    With enough support, we can even expand and provide new services – who's up for a Minecraft server? 😎

    Thank you for being a part of our journey, and for helping make the world a safer place!`;

  public static readonly feedback:string = stripIndents`
      TripBot is an [open source](${this.github}) project and is a labor of love done by a few (2) volunteers.
      We're doing our best, but things can always be better, and we're always looking for new ideas and feedback.

      If you have an idea, a bug report, or just want to say thanks; use the button below to send a message to Moonbear, TripSit's director.

      Your feedback is important to us, we're not in this for the money, we're in this to help people, and we want the bot to be as good as it can be.

      If you have a feature request, please make sure to include as much detail as possible, including how you think it should work, and what it should do.

      If you have a bug report, please include as much detail as possible, including what you were doing when the bug happened, and what you expected to happen.

      If you just want to say thanks, we appreciate it! We love to hear that we're doing a good job, and it helps keep us motivated to keep working on the bot.

      If you're a developer, and you want to help out, the bot is open source, and we're always looking for new contributors. We're happy to help you get started!

      Moonbear is also available on the [TripSit discord](${this.discord}), and is happy to chat about anything bot related, or anything else you want to talk about.`;

  public static readonly credits:string = stripIndents`
      The bot is built using the [Discord.js library](https://discordjs.guide/)
      A majority of this code is original, and is available on [GitHub](${this.github})
      The data is sourced from the [TripSit and Psychonaut Wiki API combined](https://github.com/NoahSaso/merge-psychonautwiki-tripsit-data)
      The DXM calculator comes from [Tripsit](https://github.com/TripSit/DXM-Calculator)
      The Benzo calculator comes from [Tripsit](https://github.com/TripSit/Benzo-Calculator)
      The Ketamine calculator and pill_id code was inspired by [PsyBot](https://github.com/v0idp/PsyBot)
      The LSD calculator info was inspired from [this codepen](https://codepen.io/cyberoxide/pen/BaNarGd)
      The actual [research for the LSD calculator](https://www.reddit.com/r/LSD/comments/4dzh9s/lsd_tolerance_calculator_improved/)
      The bot itself is a spiritual successor to the original TripBot, which was written for IRC and is now defunct.
      `;

  public static readonly privacy:string = stripIndents`
      We take privacy very seriously. We only store the data we need to provide our services, and we never sell or share your data with third parties.
      If you want to know what data we have on you, or if you want to delete your data, you can use the /privacy command.`;

  public static readonly applicationsDesc = stripIndents`
    **What is an Application system?**
    This is an application system to allow people to apply for roles in your guild!

    ** What does this to? **
    This will create a message in the room you run this command with a button.
    When a user clicks this button they will be asked two questions:
    1. Why do you want to help out?
    2. What skills can you bring to the team?
    The user submits this forum and a new thread is created in a separate channel for the team to discuss the application.
    The thread is created in a separate room so that people cannot accidentally @ the user and add them to the thread.
    There is a 24 hour cool down before an application can be accepted or rejected, to give everyone a chance to discuss the application.
    There are a list of pre-defined responses that can be used to reject the application, if desired, but a custom response is usually better.

    ** How do I set it up? **
    1. Create a room where you want a message posted (Apply-Here)
    2. Create a room where people will talk about applications (Applications)
    3. Create a role that people can apply for (Tripsitter)
    4. Create a role that will review applications (Moderator)
    5. Run the /setup applications command with each of the above channels and roles

    ** Troubleshooting **
    If you have any issues with this system, please contact Moonbear on the TripSit guild!
    They're happy to give direct support to any problems you may have!`;

  public static readonly techhelpDesc = stripIndents`
    **What is a TechHelp system?**
    This is a system to allow people to ask for help with technical issues in your guild!
    This can be mod requests or whatever, it doesn't need to be technology related!

    ** What does this to? **
    This is a lot like the Tripsit Sessions system, with some changes:
    1. The user is not restricted to a single room/thread.
    2. There is no meta-channel for discussion, we assume you already have a #moderator room for that.
    3. There is no "im good button" because the bot does not remove roles, but there is a "issue resolved" button.

    ** How do I set it up? **
    1. Create a room where you want a message posted (TechHelp)
    2. Create a role that will respond to new sessions (Moderator)
    3. Run the /setup techhelp command with each of the above channels and roles

    ** Troubleshooting **
    If you have any issues with this system, please contact Moonbear on the TripSit guild!
    They're happy to give direct support to any problems you may have!`;

  public static readonly ticketboothDesc = stripIndents`
    **What is a Ticketbooth system?**
    This sets up a 'front desk' type channel where users must read and click a button in order to see the rest of the guild.
    This is useful for guilds that want to restrict access to the rest of the guild until a user has read the rules.

    ** What does this to? **
    This will create a message in the room you run this command with a button.
    When a user clicks this button they will be given a role.

    ** How do I set it up? **
    1. Create a room where you want a message posted (Ticketbooth)
    2. Create a role that will be assigned to users who click the button (Verified)
    3. Setup permissions:
    3a. Make sure that Everyone can see the Ticketbooth room, but not the rest of the guild.
    3b. Make sure that Verified users can see the rest of the guild, but not the Ticketbooth room.
    3. Run the /setup ticketbooth command with each of the above channels and roles

    ** Troubleshooting **
    If you have any issues with this system, please contact Moonbear on the TripSit guild!
    They're happy to give direct support to any problems you may have!`;

  public static readonly levelingCalculator = 'https://hipperooni.github.io/TripSit-Level-Calculator/';

  public static readonly experienceDesc = stripIndents`
    You gain 15-25 experience when you send a message in chat, once per minute, or in other words: \
    If you send 10 messages in 30 seconds, you will only get 15-25 experience.

    Voice experience is calculated the same way, except you must satisfy the following conditions:
    1. Are not a bot
    2. Are in a voice channel
    4. Have not been awarded voice exp in the last 5 minutes
    5. Are not AFK
    6. Are not deafened
    7. Are not muted
    9. Are not in a stage channel
    10. Do not have the NeedsHelp role
    10. With another human in the channel that also meets these conditions

    This prevents people from idling and generating experience, we want to reward people for being active and participating in the community.

    You can use the \`/levels\` command to see your experience breakdown, which is categorized by where you chat:
    * Total - The sum of all experience gained. In most contexts this is your "level".
    * General - Experience gained from sending messages in most channels. If it's not one of the below categories, it's general.
    * TripSitter - Harm Reduction category rooms, helping out when people need it.
    * Developer - Development category rooms, talking about development or ideas.
    * Team - Team category rooms, talking about team stuff.

    Each of those categories can track text and also voice experience.

    Levels are not used for anything vital, but as you level up you may gain access to new commands or features.
    * Every 10 levels, you gain a new level role with it's own icon
    * Level 10 grants camera and stream permissions in VC
    * Level 20 grants access to a more private lounge channel

    Curious how long it will take to reach X level? Try out the [leveling calculator](${this.levelingCalculator})`;
}
