
import anyName from './GSS-decoders';
import inventory from './inventory';
import { indexes, hierarchies, csvRead, loadInventoriedDataset, doIndex } from './ingest-datasets.mjs';
import { pluralPropertyNameOf, isChildOf, relationTypes } from './helpers.mjs';

const thisModule = 'convert-areas.';
const runDirectFromCli = process.argv[1].split('/').pop().startsWith(thisModule);

// pass these as maxRows to limit the amount of data loaded!
const VALID_ABERDEEN_POSTCODES = 18171;
const VALID_A_POSTCODES_PLUS_BIRMINGHAM_B = 62042;

// warning about hierarchies - replicated in ingest-datasets.mjs
// warning: "If a postcode straddled an electoral ward/division or parish boundary, it was split between two or more OAs"
// "In Scotland, OAs were based on postcodes as at December 2000 and related to 2001 wards. However, the OAs did not necessarily fit inside ward boundaries"
 // https://www.ons.gov.uk/methodology/geography/ukgeographies/censusgeography


// TODO: DOUBLE CHECK - is MSOA11CD actually a child of LAD17CD???


const siblingsOf = ( gssCode, options={} ) => {
  const { specifiedParent, returnUnpackedIfOnlyOneParent=true } = options;
  var possibleCodeTypes = indexCodesOf(gssCode);
  // assuming for now that only one codeType is possible - TODO: nest filters to work forEach possibleCodeType
  const codeType=possibleCodeTypes[0];

console.log(possibleCodeTypes);
console.log(gssCode);
console.log(Object.keys(indexes[codeType][gssCode]));

  // filter relationTypes which a) are the specified parent IF one is specified & b) are parents
  var possibleParents =  Object.keys(indexes[codeType][gssCode])
    .filter (relation => !specifiedParent || (relation.toupperCase() === specifiedParent.toupperCase() ))
    .filter (relation => possibleCodeTypes.some(thisCode => isChildOf(thisCode,relation)) );

  if (!possibleCodeTypes.length)
    return { error: 'no index'};
  if (!possibleParents.length){
    console.log('Indexes:', Object.keys(indexes[codeType][gssCode]));
    console.log('specifiedParent:', specifiedParent||'none');
    console.log('possibleParents:', possibleParents);
    return { error: 'no parents'};
  }
  if (possibleParents.length > 1) {
    console.log('siblingFail: possibleParents:, possibleParents');
    return { error: 'ambiguous request for siblings'};
  }
  const wholeParents = [], wholeChildren = [], partialParents = [], partialChildren = [];

  // TODO: Generalise for any hierarchy
  if (codeType==='pcds')
    wholeParents.push ('OA11');
  if (codeType==='OA11' || wholeParents.includes('OA11'))
    wholeParents.push ('LSOA11CD');
  if (codeType==='LSOA11CD' || wholeParents.includes('LSOA11CD'))
    wholeParents.push ('MSOA11CD');
  if (codeType==='MSOA11CD' || wholeParents.includes('MSOA11CD'))
    wholeParents.push ('LAD17CD');

  if (codeType==='LAD17CD' || wholeChildren.includes('LAD17CD'))
    wholeChildren.push ('MSOA11CD');
  if (codeType==='MSOA11CD' || wholeChildren.includes('MSOA11CD'))
    wholeChildren.push ('LSOA11CD');
  if (codeType==='LSOA11CD' || wholeChildren.includes('LSOA11CD'))
    wholeChildren.push ('OA11');
  if (codeType==='OA11' || wholeChildren.includes('OA11'))
    wholeChildren.push ('pcds');

  return { wholeParents, wholeChildren }// , partialParents, partialChildren }
}

// returns any first match between arrays, or undefined if no match.
const firstCommonElement = (arr1, arr2)=>
  arr1.find( el1=> arr2.find( el2=> el1===el2 )) ;

// tellMeAbout is for testing functionality
const tellMeAbout = gssCode => {
  if (!isGssCode(gssCode)) {
    console.log(`I dont know what ${gssCode} is :(`);
    return
  };
  console.log(`${gssCode} is: ${whatIs(gssCode)}`);
  console.log(`${gssCode} has ${
    indexCodesOf(gssCode).length ?
      `index code: ${indexCodesOf(gssCode).join(' or ')}`
      : 'unknown index code.'
  }`);

  let knownAreas;

  const codeType = firstCommonElement (indexCodesOf(gssCode), ['OA11', 'LSOA11CD', 'MSOA11CD', 'LAD17CD'])
  if (!indexes[codeType]) {
    console.log(`${codeType} index missing \n`);
    return
  }
  if (!indexes[codeType][gssCode]) {
    console.log(`${codeType} index missing for ${gssCode}\n`);
    return
  }

  switch (codeType) {
    case 'OA11':
      // show OA11 info:
      knownAreas = indexes.OA11[gssCode];
      if (knownAreas.lsoa11cd)
        console.log(`${gssCode} has LSOA11CD: ${knownAreas.lsoa11cd}`);
      if (knownAreas.msoa11cd)
        console.log(`${gssCode} has MSOA11CD: ${knownAreas.msoa11cd}`);
      if (knownAreas.lad17cd)
        console.log(`${gssCode} has LAD17CD: ${knownAreas.lad17cd}`);
      if (knownAreas.postcodes)
        console.log(`${gssCode} has ${knownAreas.postcodes.length} postcodes: ${knownAreas.postcodes.join(', ')}`);
      console.log(' \n');
    break;

    case 'LSOA11CD':
      // show LSOA11CD info:
      knownAreas = indexes.LSOA11CD[gssCode];
      console.log(`LSOA11CD index for ${gssCode} has keys: ${Object.keys(knownAreas)}`);
      console.log(`LSOA11CD index for ${gssCode} contains OA11s: ${knownAreas.oa11s.join(', ')}`);
      console.log(' ');
    break;

    case 'MSOA11CD':
      // show MSOA11CD info:
      knownAreas = indexes.MSOA11CD[gssCode];
      console.log(' !!Not implemented!! ');
      console.log(' ');
    break;

    case 'LAD17CD':
      // show LADCD info:
      knownAreas = indexes.LAD17CD[gssCode];
      console.log(' !!Not implemented!! ');
      console.log(' ');
    break;

    default :
      console.log(`Something's not right here! \n ${codeType} found but no case found to handle it `);
  }

  return
}



// given a GSS code, report() sets a bunch of properties on an object relating to that code, and returns it.
const report = ( gssCode, options={} ) => {
  if (!gssCode)
    return { failure: 'error', error: 'no code provided'}
  if (!isGssCode(gssCode))
    return { gssCode, failure: 'unknown code type' }

  const response = { gssCode };
  // Should only be one sensible code type to populate indexedAsCodetype  - keep an eye on..
  const possibleCodeTypes = indexCodesOf(gssCode);
  // TODO: report for all possibleCodeTypes - find a suitable structure to report this, or error for ambiguity
  const indexedAsCodetype = firstCommonElement (possibleCodeTypes, Object.keys(indexes));

  if (possibleCodeTypes.length > 0) {
    if (possibleCodeTypes.length > 1) {
      response.possibleCodeTypes = indexCodesOf(gssCode);
      response.codeTypeBeingUsedForNow = indexedAs || indexCodesOf(gssCode)[0];
    }
    else
      response.codeType = indexCodesOf(gssCode)[0]
    Object.assign (response, relationTypes(response.codeType||response.codeTypeBeingUsedForNow));
  }
  else {
    // unknown code type - don't bother with hierarchy
  }

  // if (possibleCodeTypes.length > 0) {
  //   if (possibleCodeTypes.length > 1) {
  //     response.possibleCodeTypes = possibleCodeTypes;
  //     response.codeTypeBeingUsedForNow = indexedAsCodetype || indexCodesOf(gssCode)[0];
  //   }
  //   else
  //     response.codeType = indexCodesOf(gssCode)[0]
  //   Object.assign (response, relationTypes(response.codeType||response.codeTypeBeingUsedForNow));
  // }
  // else {
  //   // unknown code type - don't bother with hierarchy
  // }

  response.indexed = !(indexedAsCodetype===undefined);
  if (response.indexed)
    response.indexedAsCodetype = indexedAsCodetype;

// TODO: include shouldIndex - explains why not indexed.


  // get down to business
  if (response.indexed) {
    if (response.wholeAncestors && response.wholeAncestors.length) {
      response.ancestors = (response.ancestors || []) .concat(response.wholeAncestors);
    // /////////////////////////////////////////////////////////////////////////////////////////
    // Need to start indexing consecutive levels. Currently indexes OAs from each level
    console.log('ANCESTOR TYPES of ',gssCode);
    console.log(response.ancestors);

    response.ancestors.forEach (ancestor => {
              console.log(indexes[indexedAsCodetype][gssCode]);
              console.log('looking for property:',ancestor.toLowerCase());
              console.log(indexes[indexedAsCodetype][gssCode][ancestor.toLowerCase()]);
              console.log(!!indexes[indexedAsCodetype][gssCode][ancestor.toLowerCase()]);
            });

    // the relevant ancestor data, _once_you've_indexed_them !!
    // after indexing those, need to count up descendants of ancestor in such a way as to allow more detail later
    // /////////////////////////////////////////////////////////////////////////////////////////
      response.ancestors
        .filter (
          ancestor => !!indexes[indexedAsCodetype][gssCode][ancestor]
        )
        .forEach (ancestor => {
          console.log('assuming isChildOf (',indexedAsCodetype,ancestor,')',isChildOf (indexedAsCodetype,ancestor));
        })


    }

    if (response.wholeDescendants && response.wholeDescendants.length) {
      response.descendants = response.descendants || [];
console.log('possibles:' , Object.keys(indexes[indexedAsCodetype][gssCode]) );
      Object.keys(indexes[indexedAsCodetype][gssCode])
        .filter (
          descendantIndexType => isChildOf (descendantIndexType,indexedAsCodetype)
        )
        // we would usually expect one or zero types to pass the filter
        .forEach (childIndexType => {
          console.log('definitely isChildOf (',childIndexType,indexedAsCodetype,')');
            const childIndex = indexes[indexedAsCodetype][gssCode][childIndexType];
            console.log(childIndex);
            const numberOfChildren = childIndex.length;
            const nominalProportionPerChild = 1/numberOfChildren;
            const childIndexWithProportions = {};
            childIndex.forEach (
                childName => {
                  // TODO: check if there is a human population in the child area
                  childIndexWithProportions[childName] = nominalProportionPerChild;
                })
            response.descendants.push (childIndexWithProportions);
          });

    }
    if (response.partialAncestors && response.partialAncestors.length) {
      response.ancestors = response.ancestors || [];
      response.partialAncestors.forEach (ancestorCodeType => {

      });
    }
    if (response.partialDescendants && response.partialDescendants.length) {
      response.descendants = response.descendants || [];
      response.partialDescendants.forEach (descendantCodeType => {

      });
    }



  }


  return response;
}



// console.log(whatIs('S01006646'));

// // Use these for tests
// console.log(isChildOf('OA11', 'LSOA11CD'));
// console.log(isChildOf('pcds', 'OA11'));
// console.log(isChildOf('pcds', 'LSOA11CD'));
// console.log(isChildOf('OA11s', 'LSOA11CD'));
// console.log(isChildOf('OA11S', 'LSOA11CD'));
// console.log(isChildOf('OA11', 'LSOA11CDS'));

// if called as a module rather than run from CLI, do nothing - leave it to the parent module.
if (runDirectFromCli) {
  loadInventoriedDataset( inventory.postcodes_valid_to_OAs, {maxRows : VALID_A_POSTCODES_PLUS_BIRMINGHAM_B} )
    .then ( results => {
      doIndex (results);

      const args = process.argv.slice (2);
      if (args.length) {
        console.log(args);
        args.forEach (tellMeAbout);
      } else {
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

        console.log('\nS00090540');
        console.log(report('S00090540'));
        console.log('\nE05090540');
        console.log(report('E05090540'));
        // console.log('\nE00045170');
        // console.log(report('E00045170'));    // loadsa output!
        console.log('\nE00049607');
        console.log(report('E00049607'));
        // console.log('\nE01032176');
        // console.log(report('E01032176'));
      };
    });
  };



  export { hierarchies, tellMeAbout, report }
