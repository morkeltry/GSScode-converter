import csvParse from 'csv-parse';
import fs from 'fs';
// import { csvWrite }  from './trimmer/xlsx-csv-convert';


const fileIn ='./data/pcds-oa11-lsoa11cd-msoa11cd-ladcd_Recently_terminated_postcodes_only.csv'
  , fileOut ='result.csv';


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
        else if (remaining>-1 || maxRows==-1) {
          // process and push one row
          results.push( process(data, lookup) );
       }
       })
      .on('end', () => resolve ({ results, headers, lookup }));
  });
}

csvRead (fileIn,
  (x, lookup)=>(x[lookup('FID')]),
  )
    .then (console.log);
