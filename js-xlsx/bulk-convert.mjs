import csvParse from 'csv-parse';
import fs from 'fs';
import { hierarchies, tellMeAbout, report } from './convert-areas';
import { indexes, csvRead, loadInventoriedDataset, doIndex } from './ingest-datasets.mjs';



const printHelpMessage = ()=> {
  console.log('No arguments given');
}

const mapCsvRowToMemoryStructure = ((x,lookupFn) => {
  x = trimUnwantedColumns(x);

});

const mapArgToMemoryStructure = ((x) => x);



////this function UNFINISHED - possibly on the wrong track!!!
// do it better - are you confusing parent->child and child->parent maps?

const addToSecondaryIndex = (row, arrIndex) => {
  checkIsChild ();
  const newDatasetKey = row[arrIndex];
  // const {children} = indexes.lsoa11cd[row[arrIndex]] //???
  const {children} = report(indexes.lsoa11cd[row[arrIndex]]) //???
  Object.keys(children).forEach (childName => {
    if (!secondaryIndex[childName])
      secondaryIndex[childName]={}
    else
      secondaryIndex[childName][] += children[childName];
  })


// remember arrIndex is the index within the headers array, already looked up to save repetitive calculation.

const loadAndIndexInMemory = (filename, args) => {
  const getPostcodeLookup = loadInventoriedDataset( inventory.postcodes_valid_to_OAs, {maxRows : VALID_A_POSTCODES_PLUS_BIRMINGHAM_B} )
    .then ( ingestedData => {
      const convertFromArea = 'OA11';
      const convertToArea = 'lsoa11cd';
      const arrIndex = ingestedData.lookup(convertFromArea);
      doIndex (ingestedData);
      ingestedData.results.forEach (row=> addToSecondaryIndex (row, arrIndex));



    });
  getBatchData = (filename) ?
    new Promise ((resolve, reject) => {
      const process = mapCsvRowToMemoryStructure;
      csvRead (filename, process)
        .then ( result=> {
          resolve (result);
        })
    })
    : Promise.resolve (args.map (x=>x) );   /// Nonsense!

  return Promise.all ([getPostcodeLookup, getBatchData])
}


const loadAndIndexInMemory = filename => {

};


const args = process.argv.slice (2);
if (!args.length)
  printHelpMessage()
else {
  const batchFilename = fs.existsSync(args[0]) && args[0];
  if (batchFilename)
    console.log('Thats a file that exists.');

  const loadAndIndex = (batchFilename && (fs.statSync(filename).size > permittedMemory)) ?
    loadAndIndexAsStream
    : loadAndIndexInMemory ;

  loadAndIndex (batchFilename || undefined)
    .then (stuff => {
      // doStuff()


    });
}
