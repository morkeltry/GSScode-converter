import csvParse from 'csv-parse';
import fs from 'fs';
// import { csvWrite }  from './trimmer/xlsx-csv-convert';
// import { isGssCode, startsWithGssCode, whatIs } from './GSS-decoders';
import anyName from './GSS-decoders'



const fileIn ='./data/pcds-oa11-lsoa11cd-msoa11cd-ladcd_Valid_postcodes_only.csv'
  , fileOut ='result.csv';
const indexes = { OA11:{}, LSOA11CD:{}, MSOA11CD:{}, LADCD:{} };
const shouldIndex = {
  oa11 : true,
  lsoa11cd : true,
  msoa11cd : false,
  ladcd : false,
  pcds : false,
}

// pass these as maxRows to limit the amount of data loaded!
const VALID_ABERDEEN_POSTCODES = 18171;
const VALID_A_POSTCODES_PLUS_BIRMINGHAM_B = 62042;


// csvRead takes a filname, optionally a row processing function, and optionally a maximum number of rows to consume
// It returns a promise resolving with
// { results: an array of processed rows (each as array),
//   headers: an array of headers,
//   lookup: a function returning the index within the row of the provided string header }

// process is the function to process a row as it comes in
// it's parameter lookup is a lookup function defined here in csvRead, in setLookup.
// Unfortunatly passing back and forth nested closures like we're in React is
// necessary to get the speed boost from the lookup.
const csvRead = (file, process = (x, lookup)=>x, maxRows=-1) => {
  const results = [];
  let remaining = maxRows;
  let headers, lookup;

  // lookup(name) is quicker than .indexOf(name)
  const setLookup = headers => {
    const dict={};
    headers.forEach ((name,idx) => dict[name]=idx);
    return (name => dict[name])
  }

  return new Promise ((resolve, reject) => {
    fs.createReadStream(file)
      .pipe(csvParse())
      .on('data', (data) => {
        if (remaining-- == maxRows){
          lookup = setLookup(data)
          headers=data;
        }
        else if (remaining>-1 || maxRows===-1) {
          // process and push one row
          results.push( process(data, lookup) );
       }
       })
      .on('end', () => resolve ({ results, headers, lookup }));
  });
}

// doIndex will, when complete, create indexes for each column flagged in (the module level constant) shouldIndex
const doIndex = ( {results, headers, lookup} ) => {
  // const { results, headers, lookup } = result;
  results.forEach( row=> {
    let oa11=row[lookup('oa11')];
    let pcds=row[lookup('pcds')];

    if (shouldIndex.oa11) {
      if (!indexes.OA11[oa11])
        indexes.OA11[oa11] = { postcodes:[] };

      // NB We are makign the assumption here of good data -ie OA11s should map to exactly one larger area
      indexes.OA11[oa11].postcodes.push (pcds);
      ['lsoa11cd','msoa11cd','ladcd']
        .forEach (field => indexes.OA11[oa11][field] = (row[lookup(field)]));
    }

    // if (shouldIndex.lsoa11cd) {
    //   if (!indexes.LSOA11CD[lsoa11cd])
    //     indexes.LSOA11CD[lsoa11cd] = { oa11s:[] };
    //
    //   indexes.LSOA11CD[lsoa11cd].oa11s.push (oa11);
    //   ['msoa11cd','ladcd']
    //     .forEach (field => indexes.LSOA11CD[lsoa11cd][field] = (row[lookup(field)]));
    // }

    // currently each of these levels jumps all the way down the hierarchy to OA11s.
    // A better use of memory may be to index the level immediately below using logic appropriate for each
    // this will also leave you better prepared for working with overlapping areas later on.
    ['lsoa11cd','msoa11cd','ladcd']
      .forEach (field => {
        const upperField= field.toUpperCase();
        if (shouldIndex[field]) {
          let code=row[lookup(field)];
          if (!indexes[upperField][code])
            indexes[upperField][code] = { oa11s:[] };
          indexes[upperField][code].oa11s.push (oa11);
      }});

  });
  console.log(indexes.OA11);
  console.log(indexes.LSOA11CD);
}

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
  }\n`);

  let knownAreas;

  const findFirstIn = (arr1, arr2)=>
    arr1.find( el1=> arr2.find( el2=> el1===el2 )) ;

  const codeType = findFirstIn (indexCodesOf(gssCode), ['OA11', 'LSOA11CD', 'MSOA11CD', 'LADCD'])
  if (!indexes[codeType]) {
    console.log(`${codeType} index missing `);
    return
  }
  if (!indexes[codeType][gssCode]) {
    console.log(`${codeType} index missing for ${gssCode}`);
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
      if (knownAreas.ladcd)
        console.log(`${gssCode} has LADCD: ${knownAreas.ladcd}`);
      if (knownAreas.postcodes)
        console.log(`${gssCode} has ${knownAreas.postcodes.length} postcodes: ${knownAreas.postcodes.join(', ')}`);
      console.log(' ');
    break;


    case 'LSOA11CD':
      // show LSOA11CD info:
      knownAreas = indexes.LSOA11CD[gssCode];
      console.log(' !!Not implemented!! ');
      console.log(' ');
    break;

    case 'MSOA11CD':
      // show MSOA11CD info:
      knownAreas = indexes.MSOA11CD[gssCode];
      console.log(' !!Not implemented!! ');
      console.log(' ');
    break;

    case 'LADCD':
      // show LADCD info:
      knownAreas = indexes.LADCD[gssCode];
      console.log(' !!Not implemented!! ');
      console.log(' ');
    break;

    default :
      console.log(`Something's not right here! \n ${codeType} found but no case found to handle it `);
  }

  return
}


console.log(whatIs('S01006646'));
csvRead (fileIn, undefined, VALID_A_POSTCODES_PLUS_BIRMINGHAM_B)
  .then ( results => {
    doIndex (results)

    tellMeAbout('S00090540');
    tellMeAbout('E05090540');
    tellMeAbout('E00045170');
    tellMeAbout('E00049607');
  });
