
import anyName from './GSS-decoders';
import inventory from './inventory';
import { indexes, csvRead, loadInventoriedDataset, tellMeAbout } from './ingest-datasets.mjs';

// pass these as maxRows to limit the amount of data loaded!
const VALID_ABERDEEN_POSTCODES = 18171;
const VALID_A_POSTCODES_PLUS_BIRMINGHAM_B = 62042;


console.log(whatIs('S01006646'));

loadInventoriedDataset( inventory.postcodes_valid_to_OAs, {maxRows : VALID_A_POSTCODES_PLUS_BIRMINGHAM_B} )
  .then ( results => {
    doIndex (results)

    tellMeAbout('S00090540');
    tellMeAbout('E05090540');
    tellMeAbout('E00045170');
    tellMeAbout('E00049607');
    tellMeAbout('E01032176');
  });
