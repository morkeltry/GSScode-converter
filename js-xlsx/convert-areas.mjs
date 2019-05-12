
import anyName from './GSS-decoders';
import inventory from './inventory';
import { indexes, csvRead, loadInventoriedDataset, doIndex } from './ingest-datasets.mjs';

// pass these as maxRows to limit the amount of data loaded!
const VALID_ABERDEEN_POSTCODES = 18171;
const VALID_A_POSTCODES_PLUS_BIRMINGHAM_B = 62042;

// TODO: DOUBLE CHECK - is MSOA11CD actually a child of LAD17CD???
const heirarchies = [
  ['PCDS', 'OA11', 'LSOA11CD', 'MSOA11CD', 'LAD17CD']
]

// childCodeType, parentCodeType may be upper or lower case; childCodeType may be pluralised with s.
const isChildOf = (childCodeType, parentCodeType) => {
console.log('compare:',childCodeType, parentCodeType );
  childCodeType = childCodeType.toUpperCase();
  parentCodeType = parentCodeType.toUpperCase();
  return (heirarchies
    .filter (hierarchy => hierarchy.includes(parentCodeType))
    .some (hierarchy => {
      const childCandidate = hierarchy[ hierarchy.indexOf(parentCodeType) -1 ] ;
      if (childCandidate==='PCDS' && childCodeType.startsWith('POSTCODE'))
        return true
      return (childCodeType===childCandidate || childCodeType===childCandidate+'S');
    })
  );
}

// only implemented for whole ancestors/ descendants
const relations = codeType => {
  if (typeof codeType !== 'string')
    console.log('Not a string!!!! (I should throw an error here)');
  const indexables = ['pcds', 'OA11', 'LSOA11CD', 'MSOA11CD', 'LAD17CD'];
  if (!(indexables.includes(codeType))) {
    console.log(`${codeType} was not in `,indexables);
    return {}
  }
  const wholeAncestors = [], wholeDescendants = [], partialAncestors = [], partialDescendants = [];

  // TODO: Generalise for any hierarchy
  if (codeType==='pcds')
    wholeAncestors.push ('OA11');
  if (codeType==='OA11' || wholeAncestors.includes('OA11'))
    wholeAncestors.push ('LSOA11CD');
  if (codeType==='LSOA11CD' || wholeAncestors.includes('LSOA11CD'))
    wholeAncestors.push ('MSOA11CD');
  if (codeType==='MSOA11CD' || wholeAncestors.includes('MSOA11CD'))
    wholeAncestors.push ('LAD17CD');

  if (codeType==='LAD17CD' || wholeDescendants.includes('LAD17CD'))
    wholeDescendants.push ('MSOA11CD');
  if (codeType==='MSOA11CD' || wholeDescendants.includes('MSOA11CD'))
    wholeDescendants.push ('LSOA11CD');
  if (codeType==='LSOA11CD' || wholeDescendants.includes('LSOA11CD'))
    wholeDescendants.push ('OA11');
  if (codeType==='OA11' || wholeDescendants.includes('OA11'))
    wholeDescendants.push ('pcds');

  return { wholeAncestors, wholeDescendants }// , partialAncestors, partialDescendants }
}

// returns any first match between arrays, or undefined if no match.
const findFirstIn = (arr1, arr2)=>
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

  const codeType = findFirstIn (indexCodesOf(gssCode), ['OA11', 'LSOA11CD', 'MSOA11CD', 'LAD17CD'])
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


const report = ( gssCode, options={} ) => {
  if (!gssCode)
    return { failure: 'error', error: 'no code provided'}
  if (!isGssCode(gssCode))
    return { gssCode, failure: 'unknown code type' }

  const response = { gssCode };
  // Should only be one sensible code type to populate indexedAs  - keep an eye on..
  const indexedAs = findFirstIn (indexCodesOf(gssCode), Object.keys(indexes));
  const possibleCodeTypes = indexCodesOf(gssCode);
  // Use response.codeType||response.codeTypeBeingUsedForNow until deciding on a final structure.
  response.codeLooksLike = whatIs(gssCode);

  if (possibleCodeTypes.length > 0) {
    if (possibleCodeTypes.length > 1) {
      response.possibleCodeTypes = indexCodesOf(gssCode);descendant
      response.codeTypeBeingUsedForNow = indexedAs || indexCodesOf(gssCode)[0];
    }
    else
      response.codeType = indexCodesOf(gssCode)[0]
    Object.assign (response, relations(response.codeType||response.codeTypeBeingUsedForNow));
  }
  else {
    // unknown code type - don't bother with hierarchy
  }

  response.indexed = !(indexedAs===undefined);
  if (indexedAs!==undefined)
    response.indexedAs = indexedAs;

// TODO: include shouldIndex - explains why not indexed.

  if (indexedAs) {
    Object.assign (response, relations(response.codeType||response.codeTypeBeingUsedForNow));

    if (response.wholeAncestors && response.wholeAncestors.length) {
      response.ancestors = (response.ancestors || []) .concat(response.wholeAncestors);
// /////////////////////////////////////////////////////////////////////////////////////////
// Need to start indexing consecutive levels. Currently indexes OAs from each level
console.log('ANCESTOR TYPES of ',gssCode);
console.log(response.ancestors);

response.ancestors.forEach (ancestor => {
          console.log(indexes[indexedAs][gssCode]);
          console.log(indexes[indexedAs][gssCode][ancestor.toLowerCase()]);
          console.log(!!indexes[indexedAs][gssCode][ancestor.toLowerCase()]);
        });

// the relevant ancestor data, _once_you've_indexed_them !!
// after indexing those, need to count up descendants of ancestor in such a way as to allow more detail later
// /////////////////////////////////////////////////////////////////////////////////////////
      response.ancestors
        .filter (
          ancestor => !!indexes[indexedAs][gssCode][ancestor]
        )
        .forEach (ancestor => {
          console.log('assuming isChildOf (',indexedAs,ancestor,')',isChildOf (indexedAs,ancestor));
        })


    }

    if (response.wholeDescendants && response.wholeDescendants.length) {
      response.descendants = response.descendants || [];
console.log('possibles:' , Object.keys(indexes[indexedAs][gssCode]) );
      Object.keys(indexes[indexedAs][gssCode])
        .filter (
          descendantIndexType => isChildOf (descendantIndexType,indexedAs)
        )
        // we would usually expect one or zero types to pass the filter
        .forEach (childIndexType => {
          console.log('definitely isChildOf (',childIndexType,indexedAs,')');
            const childIndex = indexes[indexedAs][gssCode][childIndexType];
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

    // real MSOA, Bromsgrove
    tellMeAbout('E02006697');

    // real LADCD, Bromsgrove
    tellMeAbout('E07000234');

    console.log('\nS00090540');
    console.log(report('S00090540'));
    console.log('\nE05090540');
    console.log(report('E05090540'));
    // console.log('\nE00045170');
    // console.log(report('E00045170'));    // loadsa output!
    console.log('\nE00049607');
    console.log(report('E00049607'));

    console.log('\nE01032176');
    console.log(report('E01032176'));

    // console.log('\nE02006697');
    // console.log(report('E02006697'));
    // console.log('\nE07000234');
    // console.log(report('E07000234'));
  });
