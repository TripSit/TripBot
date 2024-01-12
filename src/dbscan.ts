/* eslint-disable @typescript-eslint/no-unused-vars */
import { Category, Drug } from 'tripsit_drug_db';
import fs from 'fs';
import path from 'path';
import drugs from '../assets/data/tripsitDB.json';
import combos from '../assets/data/tripsitCombos.json';
import { Combos } from './global/@types/tripsitCombos';

const drugData = drugs as {
  [key: string]: Drug
};

const comboData = combos as Combos;

// function merge() {
//   // This function will merge the two combo files together
//   // comboV0 looks like:
//   // {
//   //   [key: string]: {
//   //     [key: string]: {
//   //       status: string;
//   //       note?: string;
//   //     }
//   //   }
//   // }
//   // comboV1 looks like:
//   // {
//   //   [key: string]: {
//   //     [key: string]: string
//   //   }
//   // }
//   // The final file should look like:
//   // {
//   //   [key: string]: {
//   //     [key: string]: {
//   //       status: <data from v1>;
//   //       note?: <data from v0>;
//   //     }
//   //   }
//   // }

//   const mergedCombos: {
//     [key: string]: {
//       [key: string]: {
//         status: string;
//         note?: string;
//       }
//     }
//   } = {};

//   Object.entries(combov0).forEach(([comboV0Key, comboV0Obj]) => {
//     // console.log(`comboV0Key: ${comboV0Key}`);
//     Object.entries(comboV0Obj).forEach(([interactionV0Key, interactionV0Obj]) => {
//       if (!mergedCombos[comboV0Key]) {
//         mergedCombos[comboV0Key] = {};
//       }
//       if (comboV0Key !== interactionV0Key) {
//         // console.log(`interactionV0Key: ${interactionV0Key}`);

//         const comboV1Obj = combov1[comboV0Key as keyof typeof combov1];
//         if (comboV1Obj) {
//           const interactionV1 = comboV1Obj[interactionV0Key as keyof typeof comboV1Obj];
//           if (interactionV1) {
//             mergedCombos[comboV0Key][interactionV0Key] = {
//               status: interactionV1,
//             };
//             if (Object.hasOwn(interactionV0Obj, 'note')) {
//               mergedCombos[comboV0Key][interactionV0Key].note = (interactionV0Obj as {
//                 note: string;
//                 status: string;
//               }).note;
//             }
//           }
//         }
//       } else {
//         mergedCombos[comboV0Key][interactionV0Key] = {
//           status: 'Self',
//         };
//       }
//     });
//   });

//   fs.writeFile(path.join(__dirname, 'newShit.json'), JSON.stringify(mergedCombos, null, 2), err => {
//     if (err) {
//       // console.log(err);
//     }
//   });
// }

// Object.entries(drugData).forEach(([drugName, drugObj]) => {
//   if (drugObj.combos) {
//     // console.log(`${drugName} has combos`);
//     const drugComboInfo = drugObj.combos;
//     const comboDbInfo = combos[drugName as keyof typeof combos];

//     if (comboDbInfo) {
//       // console.log(`${drugName} was found in combo db`);
//       Object.entries(drugComboInfo).forEach(([comboDrugName]) => {
//         // console.log(`Comparing ${comboDrugName}`);
//         if (comboDbInfo[comboDrugName as keyof typeof comboDbInfo]) {
//           const comboDbStatus = comboDbInfo[comboDrugName as keyof typeof comboDbInfo];
//           const drugDbStatus = drugComboInfo[comboDrugName as keyof typeof drugComboInfo].status;
//           if (comboDbStatus !== drugDbStatus) {
//             console.log(`${drugName} + ${comboDrugName} has issues: ${drugDbStatus} or ${comboDbStatus}`);
//           }
//           // if (comboDbStatus === drugDbStatus && comboDbNote === drugDbNote) {
//           //   console.log(`${comboDrugName} is the same`);
//           // }
//         }
//       });
//     } else {
//       // console.log(`${drugName} has combo info but not in combo db`);
//     }
//   } else {
//     // console.log(`${drugName} has no combos`);
//   }
// });

function expandCategories() {
  const categoryData = {
    '2c-t-x': [] as string[],
    '2c-x': [] as string[],
    '5-meo-xxt': [] as string[],
    amphetamines: [] as string[],
    benzodiazepines: [] as string[],
    dox: [] as string[],
    'ghb/gbl': [] as string[],
    maois: [] as string[],
    mushrooms: [] as string[],
    nbomes: [] as string[],
    opioids: [] as string[],
    ssris: [] as string[],
  };
  Object.entries(drugData).forEach(([drugName, drugObj]) => {
    if (drugName.includes('amphetamine' as Category) || drugObj.aliases?.join().includes('amphetamine')) {
      categoryData.amphetamines.push(drugName);
    }
    if (drugObj.categories?.includes('benzodiazepine' as Category)) {
      categoryData.benzodiazepines.push(drugName);
    }
    if (drugObj.categories?.includes('opioid' as Category)) {
      categoryData.opioids.push(drugName);
    }
    if (drugObj.categories?.includes('ssri' as Category)) {
      categoryData.ssris.push(drugName);
    }
    if (/^do.$/i.test(drugName)) {
      categoryData.dox.push(drugName);
    }
    if (/^2c-t-.$/i.test(drugName)) {
      categoryData['2c-t-x'].push(drugName);
    }
    if (/^2c-.$/i.test(drugName)) {
      categoryData['2c-x'].push(drugName);
    }
    if (/^25.-nbome/i.test(drugName)) {
      categoryData.nbomes.push(drugName);
    }
    if (/^5-meo-..t$/i.test(drugName)) {
      categoryData['5-meo-xxt'].push(drugName);
    }
    if (drugName === 'ghb' || drugName === 'gbl') {
      categoryData['ghb/gbl'].push(drugName);
    }
    if (drugName === 'ssri' || drugName === 'snri' || drugName === 'snris') {
      categoryData.ssris.push(drugName);
    }
    if (drugName === 'maoi') {
      categoryData.maois.push(drugName);
    }
  });

  // console.log(`${JSON.stringify(categoryData, null, 2)}`);
}

expandCategories();
