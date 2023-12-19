/* eslint-disable @typescript-eslint/no-unused-vars */
import { Drug } from 'tripsit_drug_db';
import fs from 'fs';
import path from 'path';
import drugs from './global/assets/data/drug_db_tripsit.json';
import combov0 from './global/assets/data/combo.json';
import combov1 from './global/assets/data/comboV1.json';

// const drugData = drugs as {
//   [key: string]: Drug
// };

// const comboData = combos as Combos;

function merge() {
  // This function will merge the two combo files together
  // comboV0 looks like:
  // {
  //   [key: string]: {
  //     [key: string]: {
  //       status: string;
  //       note?: string;
  //     }
  //   }
  // }
  // comboV1 looks like:
  // {
  //   [key: string]: {
  //     [key: string]: string
  //   }
  // }
  // The final file should look like:
  // {
  //   [key: string]: {
  //     [key: string]: {
  //       status: <data from v1>;
  //       note?: <data from v0>;
  //     }
  //   }
  // }

  const mergedCombos: {
    [key: string]: {
      [key: string]: {
        status: string;
        note?: string;
      }
    }
  } = {};

  Object.entries(combov0).forEach(([comboV0Key, comboV0Obj]) => {
    // console.log(`comboV0Key: ${comboV0Key}`);
    Object.entries(comboV0Obj).forEach(([interactionV0Key, interactionV0Obj]) => {
      if (!mergedCombos[comboV0Key]) {
        mergedCombos[comboV0Key] = {};
      }
      if (comboV0Key !== interactionV0Key) {
        // console.log(`interactionV0Key: ${interactionV0Key}`);

        const comboV1Obj = combov1[comboV0Key as keyof typeof combov1];
        if (comboV1Obj) {
          const interactionV1 = comboV1Obj[interactionV0Key as keyof typeof comboV1Obj];
          if (interactionV1) {
            mergedCombos[comboV0Key][interactionV0Key] = {
              status: interactionV1,
            };
            if (Object.hasOwn(interactionV0Obj, 'note')) {
              mergedCombos[comboV0Key][interactionV0Key].note = (interactionV0Obj as {
                note: string;
                status: string;
              }).note;
            }
          }
        }
      } else {
        mergedCombos[comboV0Key][interactionV0Key] = {
          status: 'Self',
        };
      }
    });
  });

  fs.writeFile(path.join(__dirname, 'newShit.json'), JSON.stringify(mergedCombos, null, 2), err => {
    if (err) {
      // console.log(err);
    }
  });
}

merge();

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
