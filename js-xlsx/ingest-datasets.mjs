import csvParse from 'csv-parse';
import fs from 'fs';
// import { csvWrite }  from './trimmer/xlsx-csv-convert';
// import { isGssCode, startsWithGssCode, whatIs } from './GSS-decoders';
import anyName from './GSS-decoders';
import inventory from './inventory';

//  Filenames now come from inventory.js
// let fileIn ='./data/pcds-oa11-lsoa11cd-msoa11cd-ladcd_Valid_postcodes_only.csv'
//   , fileOut ='result.csv';
const indexes = { OA11:{}, LSOA11CD:{}, MSOA11CD:{}, LAD17CD:{} };
const shouldIndex = {
  oa11 : true,
  lsoa11cd : true,
  msoa11cd : false,
  LAD17CD : false,
  pcds : false,
}

const logFileLoading = true;

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
const csvRead = (file, process= (x, lookup)=>x, maxRows=-1, progressLog= ()=>{} ) => {
  const results = [];
  let remaining = maxRows;
  let headers, lookup;

  // lookup(name) is quicker than .indexOf(name)
  const setLookup = headers => {
    const dict={};
    if (!headers.length)
      throw Error('Oh dear - headers were empty or not found');
    headers.forEach ((name,idx) => dict[name]=idx);
    return (name => dict[name])
  }

  return new Promise ((resolve, reject) => {
    fs.createReadStream(file)
      .pipe(csvParse())
      .on('data', (data) => {
        progressLog(data.length)
        // this line changes remaining when it runs, so will only run once
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


//NB loadInventoriedDataset is just a wrapper - most of this code is the logger!
const loadInventoriedDataset = ( dataset, options ) => new Promise ( (resolve, reject) => {
  const size = dataset.size || Infinity;
  console.log(`${size}b`);
  const remainingBytesLogger = chunk=> {
    if (chunk>=0)
      dataset.remaining-= chunk
    else {
      dataset.loaded=true;
      dataset.remaining=0;
    };
  }
  const remainingPercentLogger = chunk=> {
    if (chunk>=0)
      dataset.remaining-= 100*(chunk/size)
    else {
      dataset.loaded=true;
      dataset.remaining=0;
    };
  }
  let loggerInterval;

  try {
    const { process, maxRows } = options;
    dataset.remaining = 100;
    csvRead (dataset.location, process, maxRows, remainingPercentLogger)
      .then ( result=> {
        resolve (result);
        clearInterval (loggerInterval);
      }) ;
    if (options.logFileLoading === undefined ? logFileLoading : options.logFileLoading)
      loggerInterval = setInterval ( ()=>{
        console.log(`${dataset.shortname || ''}: ${dataset.remaining.toFixed(2)}%`);
      }, 500);
  }
  catch (err) {
    reject (err);
  }
});



// doIndex will, when complete, create indexes for each column flagged in (the module level constant) shouldIndex
// Access the indexes with indexes[CODETYPE][CODE][SMALLERCODETYPE] === [code1, code2, ...]
// eg indexes.OA11.S00090540.postcodes === ['AB10 4AX', 'AB10 4AY']
const doIndex = ( {results, headers, lookup} ) => {
  // const { results, headers, lookup } = result;
  results.forEach( row=> {
    let oa11=row[lookup('oa11')];
    let pcds=row[lookup('pcds')];

    // OA11 indexing done here
    if (shouldIndex.oa11) {
      if (!indexes.OA11[oa11])
        indexes.OA11[oa11] = { postcodes:[] };

      // NB We are making the assumption here of good data -ie OA11s should map to exactly one larger area
      indexes.OA11[oa11].postcodes.push (pcds);
      ['lsoa11cd','msoa11cd','LAD17CD']
        .forEach (field => indexes.OA11[oa11][field] = (row[lookup(field)]));
    }

    // GENERAL INDEXING DONE HERE
    // currently each of these levels jumps all the way down the hierarchy to OA11s.
    // A better use of memory may be to index the level immediately below using logic appropriate for each
    // this will also leave you better prepared for working with overlapping areas later on.
    ['lsoa11cd','msoa11cd','lad17cd']
      .forEach (field => {
        const upperField= field.toUpperCase();
        if (shouldIndex[field]) {
          let code=row[lookup(field)];
          if (!indexes[upperField][code])
            indexes[upperField][code] = { oa11s:[] };
          indexes[upperField][code].oa11s.push (oa11);
      }});

  });
  // console.log(indexes.OA11);
  // console.log(indexes.LSOA11CD);
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
  }`);

  let knownAreas;

  const findFirstIn = (arr1, arr2)=>
    arr1.find( el1=> arr2.find( el2=> el1===el2 )) ;

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


  export { indexes, csvRead, loadInventoriedDataset, doIndex, tellMeAbout }
