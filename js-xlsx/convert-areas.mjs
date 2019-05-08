
import anyName from './GSS-decoders';
import inventory from './inventory';
import { indexes, csvRead, loadInventoriedDataset, doIndex, tellMeAbout } from './ingest-datasets.mjs';

// pass these as maxRows to limit the amount of data loaded!
const VALID_ABERDEEN_POSTCODES = 18171;
const VALID_A_POSTCODES_PLUS_BIRMINGHAM_B = 62042;


console.log(whatIs('S01006646'));

loadInventoriedDataset( inventory.postcodes_valid_to_OAs, {maxRows : VALID_A_POSTCODES_PLUS_BIRMINGHAM_B} )
  .then ( results => {
    doIndex (results)

    // real OA in AB10 ( particularly large OA in centre of town at the cross of multiple postcodes)
    tellMeAbout('S00090540');

    // fake English ward
    tellMeAbout('E05090540');

    // real OA  in B99
    tellMeAbout('E00045170');

    // real OA  in B62
    tellMeAbout('E00049607');

    // real LSOA, Bromsgrove
    tellMeAbout('E01032176');
  });
