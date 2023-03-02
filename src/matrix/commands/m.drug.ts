/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable sonarjs/no-nested-template-literals */
/* eslint-disable max-len */
import { MatrixClient, RichReply } from 'matrix-bot-sdk';
import { stripIndents } from 'common-tags';
import gDrug from '../../global/commands/g.drug';

const F = f(__filename);

export default mDrug;

type RoaType = {
  name: string,
  dosage?: {
    name: string,
    value: string,
    note?: string,
  }[],
  duration: {
    name: string,
    value: string,
  }[],
};

async function mDrug(roomId: string, event:any, client:MatrixClient, substance:string, section:string) {
  let text:string = '';
  let html:string = '';
  let reply:any;

  const drugData = await gDrug(substance);
  if (drugData === null) {
    text = `Task failed successfully!\n\nSorry, i don't know that substance "${substance}". Perhaps check your spelling?`;
    html = `<b>Task failed successfully!</b> &#129302;<br><br>Sorry, i don't know that substance "${substance}".<br>Perhaps check your spelling?`;
    reply = RichReply.createFor(roomId, event, text, html);
    return client.sendMessage(roomId, reply);
  }

  function getDosage() {
    // Get a list of drug ROA names
    const roaNames = drugData!.roas.map(roa => roa.name);

    // For HR reasons we prefer non-invasive methods
    if (roaNames.includes('Insufflated')) {
      roaNames.splice(roaNames.indexOf('Insufflated'), 1);
      roaNames.unshift('Insufflated');
    }

    if (roaNames.includes('Vapourised')) {
      roaNames.splice(roaNames.indexOf('Vapourised'), 1);
      roaNames.unshift('Vapourised');
    }
    if (roaNames.includes('Smoked')) {
      roaNames.splice(roaNames.indexOf('Smoked'), 1);
      roaNames.unshift('Smoked');
    }

    let dosageColumns = 0;
    roaNames.forEach(roaName => {
      if (dosageColumns < 3) {
        const roaInfo = (drugData!.roas as RoaType[]).find((r:RoaType) => r.name === roaName);
        if (!roaInfo) {
          log.error(F, `Could not find roaInfo for ${roaName}`);
          return;
        }
        if (roaInfo.dosage) {
          let dosageString = '';
          roaInfo.dosage.forEach(d => {
            dosageString += `${d.name}: ${d.value}\n`;
          });
          html += `&#9878; <b>Dosage for ${drugData!.name} (${roaName}) &#9878;:</b><br>${stripIndents`${dosageString}`}<br><br>`;
          text += `Dosage for ${drugData!.name} (${roaName}): \n${stripIndents`${dosageString}`}\n\n`;
          dosageColumns += 1;
        }
      }
    });
    return [text, html];
  }

  function getSummary() {
    text = `Summary for ${drugData!.name}:\n\n${drugData!.summary}\nRead more on the wiki: https://wiki.tripsit.me/wiki/${drugData!.name}`;
    html = `<b>Summary for ${drugData!.name}:</b><br><br>${(drugData!.summary)}<br><a href='https://wiki.tripsit.me/wiki/${drugData!.name}'>Read more on the wiki</a>`;
    return [text, html];
  }

  function getCrossTolerances() {
    text = `Known cross-tolerances for ${drugData!.name}:\n`;
    html = `&#128256; <b> Known cross-tolerances for ${drugData!.name} &#128256;:</b><br><br>`;

    if (drugData!.crossTolerances && drugData!.crossTolerances.length >= 1) {
      const crossToleranceMap = drugData!.crossTolerances
        .map(crossTolerance => crossTolerance[0].toUpperCase() + crossTolerance.substring(1));
      text += stripIndents`${crossToleranceMap.join(', ')}`;
      html += stripIndents`${crossToleranceMap.join(', ')}`;
      return [text, html];
    }
   return false;
  }

  function getAddictionPotential() {
    if (drugData!.addictionPotential) {
      const addPot = drugData!.addictionPotential.toString();
      const capitalized = addPot[0].toUpperCase() + addPot.substring(1);
      text = `Addiction potential of ${drugData!.name}:\n ` + stripIndents`${addPot}`;
      html = `&#128148;<b>Addiction potential of ${drugData!.name}</b> &#128148;:<br>` + stripIndents`${addPot}`;
      return [text, html]
    }
    return false;
  }

  function getDuration() {
    const roaNames = drugData!.roas.map(roa => roa.name);
    let columns = 0;
    let html = `&#9203; <b>Duration for ${drugData!.name} &#9203;</b>:<br>`
    let text = `Duration for ${drugData!.name}:\n`
    roaNames.forEach(roaName => {
      if (columns < 3) {
        const roaInfo = drugData!.roas.find(r => r.name === roaName);
        if(roaInfo && roaInfo.duration) {
          let durationString = '';
          roaInfo.duration.forEach(d => {
            durationString += `${d.name}: ${d.value}\n`;
          });
          html += `<b>${roaName}:</b> ` + stripIndents`${durationString}` + `<br>`;
          text += `${roaName}:\n` + stripIndents`${durationString}` + `\n`;
        }
    }
  });
  return [text, html];
}

  if (section === 'summary') {
    const summary = getSummary();
    reply = RichReply.createFor(roomId, event, summary[0], summary[1]);
    client.sendMessage(roomId, reply);
    return true;
  }
  if (section === 'dosage') {
    if (drugData.roas) {
      const dosage = getDosage();
      reply = RichReply.createFor(roomId, event, dosage[0], dosage[1]);
      client.sendMessage(roomId, reply);
      return true;
    } else {
      html = `<b>Task failed successfully!</b><br><br>Sorry, i could not provide dosage information on ${substance}`;
      text = `Task failed successfully!\n\nSorry, i could not provide dosage information on ${substance}`;
      reply = RichReply.createFor(roomId, event, text, html);
      client.sendMessage(roomId, reply);
      return false;
    }

    /**  case 'tolerance':
      // eslint-disable-next-line no-case-declarations
      let msgPart:string;
      if (drugData.tolerance === null) return `Sorry, i have no information on tolerance for ${substance}`;
      // eslint-disable-next-line no-return-assign
      drugData.tolerance.map((i:string) => msgPart = `${i}\n`);
      return `〽️ **Tolerance information for ${substance}**\n\n${msgPart} 〽️`;* */
  }
  if(section === 'duration') {
    if(drugData.roas) {
      const duration = getDuration();
      reply = RichReply.createFor(roomId, event, duration[0], duration[1]);
      client.sendMessage(roomId, reply);
      return true;
    } else {
      html = `<b>Task failed successfully!</b><br><br>Sorry, i could not provide duration information on ${substance}`;
      text = `Task failed successfully!\n\nSorry, i could not provide duration information on ${substance}`;
      reply = RichReply.createFor(roomId, event, text, html);
      client.sendMessage(roomId, reply);
      return false;
    }
  }
  if(section === 'addiction') {
  const addiction = getAddictionPotential();
  if(addiction === false) return client.replyNotice(roomId, event, `Sorry, i could not provide information on the addiction potential of ${drugData.name}`);
  reply = RichReply.createFor(roomId, event, addiction[0], addiction[1]);
  client.sendMessage(roomId, reply);
  return true;
  }
  return false;
}
