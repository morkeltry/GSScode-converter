
import anyName from './GSS-decoders';
import inventory from './inventory';
import { indexes, csvRead, loadInventoriedDataset, doIndex } from './ingest-datasets.mjs';

// pass these as maxRows to limit the amount of data loaded!
const VALID_ABERDEEN_POSTCODES = 18171;
const VALID_A_POSTCODES_PLUS_BIRMINGHAM_B = 62042;

// childCodeType, parentCodeType may be upper or lower case; childCodeType may be pluralised with s.
const isChildOf = (childCodeType, parentCodeType) => {
  childCodeType = childCodeType.toUpperCase();
  parentCodeType = parentCodeType.toUpperCase();
  const heirarchies = [
    ['PCDS', 'OA11', 'LSOA11CD', 'MSOA11CD', 'LAD17CD']
  ]
  return (heirarchies
    .filter (heirarchy => heirarchy.includes(parentCodeType))
    .some (heirarchy => {
      const childCandidate = heirarchy[ heirarchy.indexOf(parentCodeType) -1 ] ;
      return (childCodeType===childCandidate || childCodeType===childCandidate+'S');
    })
  );
}

// only implemented for whole parents/ children
const relations = codeType => {
  if (typeof codeType !== 'string')
    console.log('Not a string!!!! (I should throw an error here)');
  const indexables = ['pcds', 'OA11', 'LSOA11CD', 'MSOA11CD', 'LAD17CD'];
  if (!(indexables.includes(codeType))) {
    console.log(`${codeType} was not in `,indexables);
    return {}
  }
  const wholeParents = [], wholeChildren = [], partialParents = [], partialChildren = [];

  if (codeType==='pcds')
    wholeParents.push ('OA11');
  if (codeType==='OA11' || wholeParents.includes('OA11'))
    wholeParents.push ('LSOA11CD');
  if (codeType==='LSOA11CD' || wholeParents.includes('LSOA11CD'))
    wholeParents.push ('MSOA11CD');
  // TODO: DOUBLE CHECK - is this correct???
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
  const indexedAs = findFirstIn (indexCodesOf(gssCode), Object.keys(indexes));
  const possibleCodeTypes = indexCodesOf(gssCode);
  // Use response.codeType||response.codeTypeBeingUsedForNow until deciding on a final structure.
  response.codeLooksLike = whatIs(gssCode);

  if (possibleCodeTypes.length > 0) {
    if (possibleCodeTypes.length > 1) {
      response.possibleCodeTypes = indexCodesOf(gssCode);
      response.codeTypeBeingUsedForNow = indexedAs || indexCodesOf(gssCode)[0];
    }
    else
      response.codeType = indexCodesOf(gssCode)[0]
    Object.assign (response, relations(response.codeType||response.codeTypeBeingUsedForNow));
  }
  else {
    // unknown code type - don't bother with heirarchy
  }

  response.indexed = !(indexedAs===undefined);
  if (indexedAs!==undefined)
    response.indexedAs = indexedAs;

// TODO: include shouldIndex - explains why not indexed.

  if (indexedAs) {
    Object.assign (response, relations(response.codeType||response.codeTypeBeingUsedForNow));

    if (response.wholeParents && response.wholeParents.length) {
      response.parents = response.parents || [];
      response.wholeParents.forEach (parentCodeType => {
        // response.parents.push
      });
    }

    if (response.wholeChildren && response.wholeChildren.length) {
      response.children = response.children || [];

console.log('possibles:' , Object.keys(indexes[indexedAs][gssCode]) );
      Object.keys(indexes[indexedAs][gssCode])
        .filter (
          childIndexType => isChildOf (childIndexType,indexedAs)
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
            response.children.push (childIndexWithProportions);
          });

    }
    if (response.partialParents && response.partialParents.length) {
      response.parents = response.parents || [];
      response.partialParents.forEach (parentCodeType => {

      });
    }
    if (response.partialChildren && response.partialChildren.length) {
      response.children = response.children || [];
      response.partialChildren.forEach (childCodeType => {

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

    console.log('S00090540');
    console.log(report('S00090540'));
    console.log('E05090540');
    console.log(report('E05090540'));
    console.log('E00045170');
    console.log(report('E00045170'));
    console.log('E00049607');
    console.log(report('E00049607'));
    console.log('E01032176');
    console.log(report('E01032176'));
  });
