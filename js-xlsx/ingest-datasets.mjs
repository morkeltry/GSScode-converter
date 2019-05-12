import csvParse from 'csv-parse';
import fs from 'fs';
// import { csvWrite }  from './trimmer/xlsx-csv-convert';
// import { isGssCode, startsWithGssCode, whatIs } from './GSS-decoders';
import anyName from './GSS-decoders';
import inventory from './inventory';
import { pluralPropertyNameOf} from './helpers.mjs';

//  Filenames now come from inventory.js
// let fileIn ='./data/pcds-oa11-lsoa11cd-msoa11cd-ladcd_Valid_postcodes_only.csv'
//   , fileOut ='result.csv';
const indexes = { OA11:{}, LSOA11CD:{}, MSOA11CD:{}, LAD17CD:{} };

// warning: "If a postcode straddled an electoral ward/division or parish boundary, it was split between two or more OAs"
// "In Scotland, OAs were based on postcodes as at December 2000 and related to 2001 wards. However, the OAs did not necessarily fit inside ward boundaries"
 // https://www.ons.gov.uk/methodology/geography/ukgeographies/censusgeography
// TODO: DOUBLE CHECK - is MSOA11CD actually a child of LAD17CD???
const hierarchies = [
  ['PCDS', 'OA11', 'LSOA11CD', 'MSOA11CD', 'LAD17CD']
]
const shouldIndex = {
  oa11 : true,
  lsoa11cd : true,
  msoa11cd : true,
  LAD17CD : true,
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

  console.log(`${dataset.size || '?'} b`);

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
          // /: unsure why the following check is necessary - TODO: investigate!
          if (!indexes[upperField][code].oa11s.includes(oa11))
            indexes[upperField][code].oa11s.push (oa11);
      }});

  });
  // console.log(indexes.OA11);
  // console.log(indexes.LSOA11CD);
}


  export { indexes, hierarchies, csvRead, loadInventoriedDataset, doIndex }
