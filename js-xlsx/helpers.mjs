
import { hierarchies } from './ingest-datasets.mjs';

const pluralPropertyNameOf = codeType => {
  if (['POSTCODE','PCDS','postcode','pcds'].includes(codeType))
    return 'postcodes'
  else
    return codeType.toLowerCase()+'s'
}


//  parentCodeType may be upper or lower case; returns uppercase.
// WARNING: if multiple results, returns array. Will not return array if specific hierarchy passed.
const childTypeOf = (parentCodeType, hierarchy) => {
  // inner definition of childTypeOf requires a hierarchy passed. Outer definition is flexible, using each of hierarchies by default.
  const childTypeOf = (parentCodeType, hierarchy) =>
    hierarchy[ hierarchy.indexOf(parentCodeType) -1 ] ;

  // if hierarchy passed, use that (in a 1-element array), else use hierarchies.
  var result = (hierarchy ? [hierarchy] : hierarchies)
    // .filter (hierarchy => hierarchy.includes(parentCodeType))  // redundant ;)
    .map (hierarchy => childTypeOf(parentCodeType, hierarchy))
    .filter (x=>x)
    .map (str=>str.toUpperCase());
  result =  [...new Set(result)];
  // console.log(result,'is childType of', parentCodeType);

  switch (result.length) {
    case 0 : console.log('Error: no childType found');
    break;
    case 1 : return result[0]
    default : return result
  };

}

// childCodeType, parentCodeType may be upper or lower case; childCodeType may be pluralised with s.
const isChildOf = (childCodeType, parentCodeType) => {
  childCodeType = childCodeType.toUpperCase();
  parentCodeType = parentCodeType.toUpperCase();
  return (hierarchies
    .filter (hierarchy => hierarchy.includes(parentCodeType))
    .some (hierarchy => {
      const childTypeCandidate = childTypeOf (parentCodeType, hierarchy) ;
      if (childTypeCandidate==='PCDS' && childCodeType.startsWith('POSTCODE'))
        return true
      return (childCodeType===childTypeCandidate || childCodeType===childTypeCandidate+'S');
    })
  );
}

// only implemented for whole ancestors/ descendants
// returns object with whole & partial ancestors & descendants
const relationTypes = codeType => {
  if (typeof codeType !== 'string')
    console.log('Not a string!!!! (I should throw an error here)');
  const indexables = ['pcds', 'OA11', 'LSOA11CD', 'MSOA11CD', 'LAD17CD'];
  if (!(indexables.includes(codeType))) {
    console.log(`${codeType} was not in `,indexables);
    return {}
  }
  const wholeAncestorTypes = [], wholeDescendantTypes = [], partialAncestorTypes = [], partialDescendantTypes = [];

  // TODO: Generalise for any hierarchy
  if (codeType==='pcds')
    wholeAncestorTypes.push ('OA11');
  if (codeType==='OA11' || wholeAncestorTypes.includes('OA11'))
    wholeAncestorTypes.push ('LSOA11CD');
  if (codeType==='LSOA11CD' || wholeAncestorTypes.includes('LSOA11CD'))
    wholeAncestorTypes.push ('MSOA11CD');
  if (codeType==='MSOA11CD' || wholeAncestorTypes.includes('MSOA11CD'))
    wholeAncestorTypes.push ('LAD17CD');

  if (codeType==='LAD17CD' || wholeDescendantTypes.includes('LAD17CD'))
    wholeDescendantTypes.push ('MSOA11CD');
  if (codeType==='MSOA11CD' || wholeDescendantTypes.includes('MSOA11CD'))
    wholeDescendantTypes.push ('LSOA11CD');
  if (codeType==='LSOA11CD' || wholeDescendantTypes.includes('LSOA11CD'))
    wholeDescendantTypes.push ('OA11');
  if (codeType==='OA11' || wholeDescendantTypes.includes('OA11'))
    wholeDescendantTypes.push ('pcds');

  return { wholeAncestorTypes, wholeDescendantTypes }// , partialAncestorTypes, partialDescendantTypes }
}




export { pluralPropertyNameOf, isChildOf, relationTypes }
