It would be really helpful from the point of view of the converter/ indexer if at least * codeTypes, mappings, location, size, extent, url * are filled out for each dataset, or at least for each .csv, including derivative ones if they are complete.


`name:` Exact ONS name for the dataset, or if it's not from a government agency then, like, a good specific name!

`url:` If the .csv is available for direct download, this is the URL of the actual .csv download if it exists, ie not the webpage describing the download. So right-click and 'copy link location' from the download button. Otherwise, the url where the data can be found.

`olderVersionsUrls:` A list ( `[]` ) of the same, but for older versions of the same data, especially for lookups, eg where ward boundaries changed.

`location:` where the file is meant to be stored on the local file system. ./ is the directory where the script is to be run from, ./data is the data directory inside that directory. The filename should be the same as it is online if it is a direct downloadable .csv .

`extent:` the countries of the UK that the data covers: `'E'` / `'W'` / `'S'` / `'N'` / `'EW'` / `'EWS'` / `'EWSN'` . `'EWSN'` (whole UK) is obviously better. If a dataset is, eg, England only, it's worth searching to see if a United Kingdom equivalent exists.

`size:` the number of bytes (roughly) that the data occupies in .csv on disk. If it's useful, add another property such as memorySize for the size in memory it occupies. In the inventory I posted, I've used `*Kb` and `*Mb` for readability. You can't do that in JSON, only in Javascript.

`codeTypes:` The GSS codes which are represented by columns of the .csv, even if named something different, if the data are exactly the same as the GSS categories (see mappings). GSS codes should be uppercase and include the year, eg `LAD17CD` rather than LADCD, unless that is impossible. As well as XXXnnXX GSS codes, codeTypes includes 'prefixes', a master reference to the GSS codes and `pcds` which are single string, two part postcodes separated by one space. Other formats of postcode are not part of the GSS hierarchy and should be included in `nonGssSchema`. `pcds` may refer to valid or terminated postcodes - we hope valid, tho ;) . `FID` I'm not sure if has any use but I have included it so far.

`olderCodeTypes:` List ( `[]` ) of any known older equivalents of the same order, eg `['LAD11CD']` if the dataset contains a LAD17CD column.

`nonGssSchema:` List of potentially useful columns which do not correspond exactly to a GSS code. There is no harm in prioritising the list for human readability or ignoring any columns are almost certainly of no use.

`mappings:` An object ( `{}` ), keyed by GSS code, where the properties of each key are the different name that this dataset calls the GSS category by.

`note:` In particular, include overview of any usage instructions if non-standard (eg script to generate it). Also any non-standard datasets depends/ depending on (eg Doogal's 'Postcodes In ... ' uses LAD17CD's which seem to come from it's 'Admin Areas' dataset of LAD17CD areas, which does not appear to have any official equivalent.

These properties are non-exhaustive and descriptive, not definitive - it's just so that the categorisable data only needs to be collated by a human once, after which it's ready to be done by a script :)
