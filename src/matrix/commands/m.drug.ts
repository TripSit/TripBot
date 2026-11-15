/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable sonarjs/no-nested-template-literals */
/* eslint-disable max-len */
import { RichReply } from 'matrix-bot-sdk';
import { stripIndents } from 'common-tags';
import gDrug from '../../global/commands/g.drug';

const F = f(__filename);

export default mDrug;

export const name = 'drug';
export const description = 'Look up information about a substance';
export const usage = '~drug [substance] (summary|dosage|duration|addiction|crosstolerances|toxicity|all)';

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

// For HR reasons we prefer non-invasive methods, so smoked, vapourised and insufflated go first (in that order)
function orderRoaNames(roaNames: string[]): string[] {
  const ordered = [...roaNames];
  ['Insufflated', 'Vapourised', 'Smoked'].forEach(preferred => {
    const index = ordered.indexOf(preferred);
    if (index !== -1) {
      ordered.splice(index, 1);
      ordered.unshift(preferred);
    }
  });
  return ordered;
}

async function mDrug(roomId: string, event:any, substance:string, section:string = '') {
  let reply:any;

  const drugData = await gDrug(substance);
  if (!drugData) {
    const text = `Task failed successfully!\n\nSorry, i don't know that substance "${substance}". Perhaps check your spelling?`;
    const html = `<b>Task failed successfully!</b> &#129302;<br><br>Sorry, i don't know that substance "${substance}".<br>Perhaps check your spelling?`;
    reply = RichReply.createFor(roomId, event, text, html);
    return matrixClient.sendMessage(roomId, reply);
  }

  function getDosage() {
    let html = '';
    let text = '';
    if (!drugData!.roas) return false;
    // Get a list of drug ROA names
    const roaNames = orderRoaNames(drugData!.roas.map(roa => roa.name));

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
          html += `&#9878; <b>Dosage for ${drugData!.name} (${roaName}) &#9878;:</b><br>${stripIndents`${dosageString.replaceAll('\n', '<br>')}`}<br><br>`;
          text += `Dosage for ${drugData!.name} (${roaName}): \n${stripIndents`${dosageString}`}\n\n`;
          dosageColumns += 1;
        }
      }
    });
    return [text, html];
  }

  function getSummary() {
    log.debug(F, 'summary');
    const text = `Summary for ${drugData!.name}:\n\n${drugData!.summary}\nRead more on the wiki: https://wiki.tripsit.me/wiki/${drugData!.name}`;
    const html = `<b>Summary for ${drugData!.name}:</b><br><br>${(drugData!.summary)}<br><a href='https://wiki.tripsit.me/wiki/${drugData!.name}'>Read more on the wiki</a>`;
    return [text, html];
  }

  function getCrossTolerances() {
    let text = `Known cross-tolerances for ${drugData!.name}:\n`;
    let html = `&#128256; <b> Known cross-tolerances for ${drugData!.name} &#128256;:</b><br><br>`;

    if (drugData!.crossTolerances && drugData!.crossTolerances.length >= 1) {
      const crossToleranceMap = drugData!.crossTolerances
        .map(crossTolerance => crossTolerance[0].toUpperCase() + crossTolerance.substring(1));
      text += stripIndents`${crossToleranceMap.join(', ')}`;
      html += stripIndents`${crossToleranceMap.join(', ')}`;
      return [text, html];
    }
    return false;
  }

  function getExperiences() {
    if (drugData!.experiencesUrl) {
      const text = `Experiences from erowid:\n${drugData!.experiencesUrl.toString()}`;
      const html = `<b>&#128064; Experiences from erowid &#128064;:</b><br>${drugData!.experiencesUrl.toString()}`;
      return [text, html];
    }
    return false;
  }

  function getAddictionPotential() {
    if (drugData!.addictionPotential) {
      const addPot = drugData!.addictionPotential.toString();
      const text = `Addiction potential of ${drugData!.name}:\n ${stripIndents`${addPot}`}`;
      const html = `&#128148;<b>Addiction potential of ${drugData!.name}</b> &#128148;:<br>${stripIndents`${addPot}`}`;
      return [text, html];
    }
    return false;
  }

  function getDuration() {
    if (!drugData!.roas) return false;
    const roaNames:string[] = (drugData!.roas as RoaType[]).map(roa => roa.name);
    const columns = 0;
    let html = `&#9203; <b>Duration for ${drugData!.name} &#9203;</b>:<br>`;
    let text = `Duration for ${drugData!.name}:\n`;
    roaNames.forEach(roaName => {
      if (columns < 3) {
        const roaInfo = drugData!.roas.find(r => r.name === roaName);
        if (roaInfo && roaInfo.duration) {
          let durationString = '';
          roaInfo.duration.forEach(d => {
            durationString += `${d.name}: ${d.value}\n`;
          });
          html += `<b>${roaName}:</b> ${stripIndents`${durationString.replaceAll('\n', '<br>')}`}<br>`;
          text += `${roaName}:\n${stripIndents`${durationString}`}\n`;
        }
      }
    });
    return [text, html];
  }

  function getToxicity() {
    if (!drugData!.toxicity) return false;
    const toxicityMap = drugData!.toxicity.map(toxicity => toxicity[0].toUpperCase() + toxicity.substring(1));
    const toxicityString = toxicityMap.join(', ');
    const html = `<b>&#9763; Toxicity &#9763;</b><br>${toxicityString}`;
    const text = `Toxicity:\n${toxicityString}`;
    return [text, html];
  }

  function getTolerance() {
    if (!drugData!.tolerance) return false;
    let toleranceString = '';
    if (drugData!.tolerance.full) {
      const tolFullCap = drugData!.tolerance.full[0].toUpperCase() + drugData!.tolerance.full.substring(1);
      toleranceString += `Full: ${tolFullCap}\n`;
    }
    if (drugData!.tolerance.half) {
      const tolHalfCap = drugData!.tolerance.half[0].toUpperCase() + drugData!.tolerance.half.substring(1);
      toleranceString += `Half: ${tolHalfCap}\n`;
    }
    if (drugData!.tolerance.zero) {
      const tolZeroCap = drugData!.tolerance.zero[0].toUpperCase() + drugData!.tolerance.zero.substring(1);
      toleranceString += `Zero: ${tolZeroCap}\n`;
    }
    const html = `&#8599; <b>Tolerance information</b> &#8599;:<br>${toleranceString.replaceAll('\n', '<br>')}`;
    const text = `Tolerance information:\n${toleranceString}`;
    return [text, html];
  }

  // Sections that just render one block of information, with the notice to give when there is none
  const simpleSections: Record<string, { get: () => string[] | false; failure?: string; returnNotice?: boolean }> = {
    summary: { get: getSummary },
    dosage: { get: getDosage, failure: `Sorry, i could not provide dosage information on ${drugData.name}` },
    addiction: {
      get: getAddictionPotential,
      failure: `Sorry, i could not provide information on the addiction potential of ${drugData.name}`,
      returnNotice: true,
    },
    crosstolerances: {
      get: getCrossTolerances,
      failure: `Sorry, i could not get information on cross tolerances from ${drugData.name}`,
    },
    toxicity: { get: getToxicity, failure: `Sorry, i was unable to get toxicity information on ${drugData.name}` },
  };
  const simple = Object.hasOwn(simpleSections, section) ? simpleSections[section] : undefined;
  if (simple) {
    const content = simple.get();
    if (content === false) {
      const notice = matrixClient.replyNotice(roomId, event, simple.failure as string);
      return simple.returnNotice ? notice : false;
    }
    reply = RichReply.createFor(roomId, event, content[0], content[1]);
    matrixClient.sendMessage(roomId, reply);
    return true;
  }
  if (section === 'duration') {
    if (drugData.roas) {
      const duration = getDuration();
      if (duration === false) { matrixClient.replyNotice(roomId, event, `Sorry, i could not get duration information on ${drugData.name}`); return false; }
      reply = RichReply.createFor(roomId, event, duration[0], duration[1]);
      matrixClient.sendMessage(roomId, reply);
      return true;
    }
    const html = `<b>Task failed successfully!</b><br><br>Sorry, i could not provide duration information on ${substance}`;
    const text = `Task failed successfully!\n\nSorry, i could not provide duration information on ${substance}`;
    reply = RichReply.createFor(roomId, event, text, html);
    matrixClient.sendMessage(roomId, reply);
    return false;
  }

  if (section === 'all' || section === '') {
    let html = '';
    let text = '';

    const functions = [getSummary, getDosage, getTolerance, getAddictionPotential, getCrossTolerances, getExperiences];
    functions.forEach(f => {
      const result = f();
      log.debug(F, 'run');

      if (result) {
        text += `${result[0]}\n\n`;
        html += `${result[1]}<br><br>`;
      }
    });

    reply = RichReply.createFor(roomId, event, text, html);
    return matrixClient.sendMessage(roomId, reply);
  }

  return false;
}
