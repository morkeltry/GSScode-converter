const Kb=1024;
const Mb=Kb*1024;
const Gb=Mb*1024;

[
{
  name : 'Register of Geographic Codes (August 2018) for the United Kingdom',
  url : 'http://geoportal.statistics.gov.uk/datasets/8c05b84af48f4d25a2be35f1d984b883_0',
  olderVersionsUrls : [],
  location:  './data/RGC_AUG_2018_UK.csv',
  extent : 'EWSN',
  size : 24 *Kb ,
  codeTypes : ['prefixes'],
  note : 'Definitions of prefix types'
},

{
  name : 'Local Authority Districts (December 2017) Names and Codes in the United Kingdom',
  url : 'geoportal1-ons.opendata.arcgis.com/datasets/a267b55f601a4319a9955b0197e3cb81_0.csv',
  olderVersionsUrls : [],
  location:  './data/Local_Authority_Districts_December_2017_Names_and_Codes_in_the_United_Kingdom.csv',
  extent : 'EWSN',
  size :  11 *Kb  ,
  codeTypes : ['LAD17CD', 'LAD17NM', 'FID'],
  olderCodeTypes : []
},

{
  name : 'Ward to Local Authority District (December 2017) Lookup in the United Kingdom',
  url : 'https://opendata.arcgis.com/datasets/046394602a6b415e9fe4039083ef300e_0.csv',
  olderVersionsUrls : [],
  location:  './data/Ward_to_Local_Authority_District_December_2017_Lookup_in_the_United_Kingdom.csv',
  extent : 'EWSN',
  size :  478 *Kb  ,
  codeTypes : ['WD17CD', 'WD17NM',	'WD17NMW', 'LAD17CD', 'LAD17NM', 'FID'],
  olderCodeTypes : []
},

{
  name : 'Wards (December 2016) Names and Codes in the United Kingdom',
  url : 'https://opendata.arcgis.com/datasets/417e93f21c5c419283ac23abc8eedcce_0.csv',
  olderVersionsUrls : [],
  location:  './data/Wards_December_2016_Names_and_Codes_in_the_United_Kingdom.csv',
  extent : 'EWSN',
  size :  257 *Kb,
  codeTypes : ['WD16CD', 'WD16NM', 'FID'],
  olderCodeTypes : []
},

{
  name : 'Lower Layer Super Output Area (2011) to Ward (2018) Lookup in England and Wales v3',
  url : 'https://opendata.arcgis.com/datasets/8c05b84af48f4d25a2be35f1d984b883_0.csv',
  olderVersionsUrls : [],
  location:  './data/Lower_Layer_Super_Output_Area_2011_to_Ward_2018_Lookup_in_England_and_Wales_v3.csv',
  extent : 'EW',
  size :  3 *Mb,
  codeTypes : ['LSOA11CD', 'LSOA11NM', 'WD18CD', 'WD18NM', 'WD18NMW', 'LAD18CD', 'LAD18NM',	'FID'],
  olderCodeTypes : []
},

{
  name : 'Postcode to Output Area to Lower Layer Super Output Area to Middle Layer Super Output Area to Local Authority District (February 2018) Lookup in the UK',
  url : 'https://opendata.arcgis.com/datasets/80628f9289574ba4b39a76ca7830b7e9_0.csv',
  location:  './data/Postcode_to_Output_Area_to_Lower_Layer_Super_Output_Area_to_Middle_Layer_Super_Output_Area_to_Local_Authority_District_February_2018_Lookup_in_the_UK.csv',
  size :  329 *Mb,
  codeTypes : ['OA11', 'LSOA11CD','MSOA11CD','LADCD','LSOA11NM', 'MSOA11NM',	'LADNM', 'LADNMW',	'FID'],
  nonGssSchema : ['pcd7', 'pcd8',	'pcds',	'dointr',	'doterm',	'usertype'],
  note : 'Entries with a non-zero in "doterm" are no longer postcodes!'
},

{
  name : 'Postcode to Output Area to Lower Layer Super Output Area to Middle Layer Super Output Area to Local Authority District (February 2018) Lookup in the UK - Valid postcodes only',
  location:  './data/pcds-oa11-lsoa11cd-msoa11cd-ladcd_Valid_postcodes_only.csv',
  size :  106 *Mb,
  codeTypes : ['OA11', 'LSOA11CD','MSOA11CD','LADCD','FID'],
  nonGssSchema : ['pcds',	'dointr'],
  note : 'Generate from downloaded file by running code in abridge_pcds-oa11-lsoa11cd-msoa11cd-ladcd_file.py'
},

{
  name : 'Postcode to Output Area to Lower Layer Super Output Area to Middle Layer Super Output Area to Local Authority District (February 2018) Lookup in the UK - postcodes terminated since 2010 only',
  location:  './data/pcds-oa11-lsoa11cd-msoa11cd-ladcd_Recently_terminated_postcodes_only.csv',
  size :  8 *Mb,
  codeTypes : ['OA11', 'LSOA11CD','MSOA11CD','LADCD','FID'],
  nonGssSchema : ['pcds',	'dointr',	'doterm'],
  note : 'Generate from downloaded file by running code in abridge_pcds-oa11-lsoa11cd-msoa11cd-ladcd_file.py'
},

{
  name : 'postcodes.io/',
  url : 'http://postcodes.io/',
  extent : 'EWSN',
  size : 14 *Kb,
  codeTypes : ['WD17CD', 'WD17NM',	'WD17NMW', 'LAD17CD', 'LAD17NM'],
  nonGssSchema : [
    "admin_district", "admin_county", "admin_ward", "parish", "parliamentary_constituency", "ccg", "ced",
    "postcode", "quality", "eastings", "northings", "country", "nhs_ha", "longitude", "latitude",
    "european_electoral_region", "primary_care_trust" , "region",
    "lsoa", "msoa", "incode", "outcode", "distance",
    "parliamentary_constituency", "admin_district", "parish", "admin_county", "admin_ward",
     "ced", "ccg", "nuts" ],
  mappings : {
    WD17CD: 'ward_district',
    LAD17CD: 'admin_district'
  },
  note: 'The most useful API reference - should use this as a backup to local system and check how much we\'re allowed to use it. \n Check API reference http://postcodes.io/ becasue not all the good stuff is covered here \n GSS code types in this file need updating. Some unusual ones, eg CCG'
},

{
  name : '',
  url : '',
  location:  './data/',
  extent : '',
  size :  ,
  codeTypes : ['','','','','']
},



{
  name : 'Local Authority District to Region (December 2017) Lookup in England ',
  url : 'https://opendata.arcgis.com/datasets/c457af6314f24b20bb5de8fe41e05898_0.csv',
  olderVersionsUrls : [],
  location:  './data/Local_Authority_District_to_Region_December_2017_Lookup_in_England_.csv',
  extent : 'E',
  size :  16 *Kb  ,
  codeTypes : ['LAD17CD', 'LAD17NM', 'RGN17CD', 'RGN17NM', 'FID'],
  olderCodeTypes : []
},

{
  name : 'Admin Areas',
  url : 'https://www.doogal.co.uk/AdministrativeAreasCSV.ashx',
  location:  './data/Admin areas.csv',
  extent : 'EWSN',
  size :  30 *Kb,
  codeTypes : ['LAD17CD'],
  nonGssSchema : ['District', 'County',	'District Code',	'Latitude',	'Longitude',	'Postcodes',	'Active Postcodes',	'Households',	'Population'],
  note : 'keys to "Postcodes In ..." \n Simple reference good for assessing weight of API requests. Apparently full population coverage'
},

{
  name : 'Postcodes In ... ',
  url : 'https://www.doogal.co.uk/AdministrativeAreasCSV.ashx?district='+district,
  extent : 'EWSN',
  size :  1 *Mb,
  nonGssSchema : ['Postcode',	'In Use?','Latitude',	'Longitude', 'Easting','Northing',	'Grid Ref',	'Ward',	'Parish',	'Introduced',	'Terminated',	'Altitude',	'Country','Last Updated',	'Quality'],
  note : 'direct REST access - append GSS district code to URL \n Includes old postcodes, specified as such \n keys in "Admin Areas"'
},


{
  name : '7044 Places',
  url : 'https://www.centrefortowns.org/7044-places-excel/7044-places-excel/download',
  extent : 'EWS',
  location:  './data/7044-places-cft.csv',
  size :  231 *Kb,
  nonGssSchema : ['Place','Region','Type'],
  note : 'categorises place names as Village || Community || Small town || Medium Town || Large town \n Centre for Towns also have dataset categorising as ,eg, Coastal Town. We should ask them for this'
},


{
  name : '',
  url : '',
  location:  './data/',
  size :  ,
  codeTypes : ['','','','','']
},

{
  name : '',
  url : '',
  location:  './data/',
  size :  ,
  codeTypes : ['','','','','']
},
