# js-xlsx

### EASY start
https://github.com/morkeltry/GSScode-converter/blob/master/js-xlsx/show-me-it-working.md

### GSS decoder

'whatIs' tells you what kind of GSS code you're looking at.

To test it:
```
cd transformers/js-xlsx
node -e 'console.log(require("./GSS-decoders").whatIs("W15123456"))'
```
where `W15123456` is your GSS code.

(NB for js-xlsx branch of CampaignLab data-pipeline repo, use: `cd transformers/js-xlsx` )

### abridge postcode / GSS code lookup file

The main lookup file has 2599368 rows × 15 columns - doable, but worth stripping down.

Run:
 ```
 pip3 install pandas
 python3 abridge_pcds-oa11-lsoa11cd-msoa11cd-ladcd_file.py
 ```
  to strip some columns, strip postcodes terminated before 2010, and create two more files - one of valid postcodes, one for postcodes not currently valid, but terminated from 2010 onwards. They are
1760106 rows × 8 columns & 123384 rows × 9 columns respectively.

### trimmer
##### A specific transformer built on general code.

The trimmer strips the rows and columns specified by the 'trim', then attempts to merge multi-column row headers, to create a file suitable for reading in with, eg, pandas.

To test it:
```
cd transformers/js-xlsx
cat trimmer/index.mjs |grep "fileIn ="
cat trimmer/index.mjs |grep "fileOut ="
```
Grab the [.xls file](https://www.ons.gov.uk/peoplepopulationandcommunity/housing/adhocs/008281ct07902011censusaccommodationtypebyhouseholdcompositionmergedlocalauthorities) and save it to the appropriate location ( `fileIn` relative to `js-xlsx/trimmer`)
This file is CT0790, which has a specific definition to be trimmed to (in `js-xlsx/trimmer/dataset-specific-trims.js`)

```
npm i
npm run trim
```

Stuff :

Uses `xlsx-style`, a fork of SheetJS, to read in .xlsx /.xls

Chooses sheet from multi-sheet file.

Data stored in memory as a workbook object, indexed by cell name (eg 'AB37')

Outputs .csv, where rows or columns can be supressed before output by defining trim objects (an object with a `rows` and a `columns` property)

Hierarchical geographic headers over multiple columns are merged automatically up to depth 3.

Bespoke merge function can be added to merge other similar formats.

Currently uses hardcoded input and output filenames.

Contains logic to separate out in-sheet metadata and guess where headers end and data begins, both row-wise and column-wise, but this is not implemented to be automatic.

Contains a bunch of helper functions.

### helpers:
##### GSS codes:
`whatIs(GSScode)` returns the geographical classification of a given GSS code

`isGssCode(GSScode)` true if `GSScode` is the correct shape and begins with a correct  geographical classification

`startsWithGssCode(GSScode)` true if `GSScode` begins with a correct  geographical classification

##### input / output:
`xlsxRead (accessType, fileIn )` reads in an .xlsx file. WIP - will be upgracded to include JSON via file & Ajax

`csvWrite (workbook, fileOut, ignores)` writes workbook memory object to fileOut in CSV. Delimters / line endings are hardcoded as `,` and `\r\n`. Synchronous file write. Receives optional `ignores`, a trim object of rows and columns to supress. Trim object may or may not include blank lines (auto-genereated ones do not), but blank liones are supressed by default unless includeBlankLines is set.

##### simple helpers:
`canonical (cellNameString)` returns a number to sort cell names by, ordered by row then column.

`incX` / `incY (cell, amount)` increments cell by amount rows / columns (or 1 row/ column if amoount not specified)

`maxes (workbook)` manually parses all cells in workbook to find greatest row and column. These can also be found by accesing `workbook[!ref]`

`colNumber(cellNameString)` / `colLetters(ordinal)` convert between callNameString and ordinal

`[success, col, row] = cell.match(splitterRegex) || [null];` splits cell name into column letters and row number (string), or places `null` into `success` if it fails.

##### workbook / sheet helpers

`restOfRowEmpty (sheet, startCell, stopAt) ` checks if the next cell in memory after `startCell` refers to a different row. Caveat: failing to provide `stopAt` relies on workbook object being ordered, which technically cannot be relied upon. On the other hand, providing cell `stopAt` means that function looks no further than that cell. `stopAt` may be a cell name, or a number of cells to the right.

`orderTopToBottomLeftToRight (keyArray)` sorts an array of cell names, most importantly top to bottom then left to right.


`mergeInOrder (sheet, mergeList)` sorts `mergeList` and intersperses into clone of `sheet`. Relies upon orderable objects.

`createKillAndMergeListFromTrim (sheet, trim, mergeRowHeaders, mergeFunction)` does what it says on the tin. Merging is optional, depending upon optional `mergeRowHeaders` flag. `mergeFunction` is also optional. Default is to merge rows A&B into C, which is done without mutation. Currently `mergeFunction` must be a function which takes a `workbook` and mutates it.

`trimTheEasyWay` takes same parameters as `createKillAndMergeListFromTrim`, calls it but then applies the resulting merge and kill lists. Kill list mutates `sheet`, merge list does not.  Will probably be renamed.

`interpretOnsWithRowHierarchy` returns an object of `trim`, `meta`, `colHeaders`, `rowHeaders`, `mergeColumn` where:
    trim: a trim object, `{rows, cols}` with the suggested rows and columns to trim/ merge.
    meta, an object, `{sourcing, terms}` where `sourcing` and `terms` are each arrays of the contents of cells in column A, `sourcing` being those from the rows to be stripped above the data and `terms` from those below.
    colHeaders, an array *of arrays* being each row of column headers
    rowHeaders, an array only meant to identify th4e column into which other header columns will be merged. It is for identification by the user, not for processing, since it may include blank or incorrect elements.
    mergeColumn : the column letter of the column header columns are to be merged into.
  };

`interpretAndTrim` calls `interpretOnsWithRowHierarchy` to get suggested trim and attempts to output this intelligently for user checking. Currently does not await user confirmation, but should do in future. Then performs the trim with `trimTheEasyWay` and returns and object `{sheet, trim}` where sheet is the sheet after blanking and merging the items in `trim` and `trim` is the trim object generated *unless* overridden by passing `interpretAndTrim`  a trim object. In that case, a trim object is still generated and output, but *is then discarded and overriden* by the passed trim object.


### bash scripts & troubleshooting:

##### download-postcodes
```
chmod 755 download-postcodes
./download-postcodes
```

You'll probably want those converted too (see above):
```
python3 abridge_pcds-oa11-lsoa11cd-msoa11cd-ladcd_file.py
```

##### { Error: Cannot find module }
You may be in the wrong directory.
In the case of the trimmer, things are in flux a bit. The .csv filenames or import paths may need tweaking instead/  as well

##### File name too long (error)

The data.json files have long and specific filenames, on the assumption that our filesystems can handles filenames up to about 255 bytes. However, some filesystems may have a problem with that.

Check out your filesystem: `df -Th .`

- is it `ecryptfs`? If so, it's probably using filename encryption, which reduces available filename length to 45 bytes. No worries- if you can reserve a fixed amount of space for the data files, there's a script to make a filesystem within a filesystem within a filesystem in which you can store the data.
- If it's any other filesystem, google the maximum filename length.
Also, check your filename encoding, just in case it uses more than one byte per character: `echo $LC_CTYPE`

To use larger filenames in a filesystem within a filesystem, activate permissions on the scripts to do so:
```
chmod 755 create-fs-for-longer-filenames
chmod 755 mount-data-fs
```
The first script reserves 1Gb. (4096 bytes X 262144). Change that in the script if you need.

Run it with `./create-fs-for-longer-filenames`

You will lose the mount when you restart the machine and will need to run `./mount-data-fs`, or else add the mount info to `/etc/fstab`
