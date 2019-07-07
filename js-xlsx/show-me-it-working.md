#### Tell me what this GSS code (ie W15123456)  means:
```
 node -e 'console.log(require("./GSS-decoders").whatIs("W15123456"))'
```

#### Show me what the converter does currently

##### Get the code and data and get them into a useable form

```
git clone https://github.com/morkeltry/GSScode-converter.git
npm i
cd js-xlsx

chmod 755 download-postcodes
./download-postcodes

pip3 install pandas
python3 abridge_pcds-oa11-lsoa11cd-msoa11cd-ladcd_file.py
```

##### Try it out:
```
node --experimental-modules bulk-convert.mjs
```
OR
```
node --experimental-modules convert-areas.mjs
```


#### Show me what the converter does currently

##### Get the code and data and get them into a useable form

Need to modify filename ../../../test.xls in curl command below and in xlsx-csv-convert.mjs

```
git clone https://github.com/morkeltry/GSScode-converter.git
npm i
cd js-xlsx/trimmer

cat index.mjs |grep "fileIn ="
curl https://www.ons.gov.uk/file?uri=/peoplepopulationandcommunity/housing/adhocs/008281ct07902011censusaccommodationtypebyhouseholdcompositionmergedlocalauthorities/ct07902011censusaccommodationtypebyhouseholdcompositionmergedlas.xls > ../../../test.xls
cat index.mjs |grep "fileOut ="
cd ..
```

##### Try it out:
```
npm run trim

cat trimmer/result.csv
```


#### It's not working!!!
More detailed documentation here (troubleshooting at the bottom)

https://github.com/morkeltry/GSScode-converter/tree/master/js-xlsx