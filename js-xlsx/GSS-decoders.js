const gssRegex = /^[a-zA-z]\d{8}/;

const gss = {}
// England, Wales, Scotland and Northern Ireland
gss.E00 =gss.W00	=gss.S00	=gss.N00	= { name: "Census Output Area",                    indexCodes: ['OA11']}
gss.E05	=gss.W05	=gss.S13	=gss.N08	=	{ name: "Ward or Electoral Division "}
gss.E14	=gss.W07	=gss.S14	=gss.N06	=	{ name: "Westminster Parliamentary Constituency"}
gss.E15	=gss.W08	=gss.S15	=gss.N07	=	{ name: "European Electoral Region"}
gss.E23	=gss.W15	=gss.S23	=gss.N23	=	{ name: "Police Force Areas"}
gss.E33	=gss.W35	=gss.S34	=gss.N19	=	{ name: "Workplace Zones"}
gss.E92	=gss.W92	=gss.S92	=gss.N92	=	{ name: "Country"}
gss.E30	=gss.W22	=gss.S22	=gss.N12	=gss.K01 = { name: "Travel to Work Areas"}
// overrides
                             gss.N00      .name= "Small Area"

// England, Wales, Scotland
gss.E01	=gss.W01	=gss.S01 =	{ name: "Lower layer Super Output Area (LSOA)",             indexCodes: ['LSOA11CD']}
gss.E02	=gss.W02	=gss.S02 =	{ name: "Middle layer Super Output Area (MSOA)",            indexCodes: ['MSOA11CD']}
gss.E04 =gss.W04  =gss.S35 =	{ name: "Civil Parish"}
gss.E32	=gss.W09	=gss.S16 =	{ name: "London Assembly; Welsh Assembly; Scottish parliament constituency"}
gss.E26	=gss.W18	=gss.S21 =	{ name: "National Park "}
gss.E06	=gss.W06	=gss.S12 =	{ name: "Unitary Authority",                                indexCodes: ['LAD17CD']}
         gss.W10	=gss.S17 =	{ name: "Welsh / Scottish Electoral Region"}
// overrides
         gss.W10           =	{ name: "Welsh Assembly Electoral Region"}
                   gss.S17 =	{ name: "Scottish Parliament Electoral Region"}
         gss.W04           =  { name: "Community"}
                   gss.S01 = 	{ name: "Data Zone"}
                   gss.S02 = 	{ name: "Intermediate Zone"}

// England & Wales
gss.E34	=gss.W37	=gss.K05 =  { name: "Built Up Areas"}
gss.E35	=gss.W38  =gss.K06 =  { name: "Built Up Area Sub-Divisions"}


// England
gss.E07	=	{ name: "Non-Metropolitan District (two-tier)",                                 indexCodes: ['LAD17CD']}
gss.E08	=	{ name: "Metropolitan Borough",                                                 indexCodes: ['LAD17CD']}
gss.E09	=	{ name: "London Borough",                                                       indexCodes: ['LAD17CD']}
gss.E10	=	{ name: "County"}
gss.E11	=	{ name: "Metropolitan County"}
gss.E12	=	{ name: "English Region"}
gss.E38	=	{ name: "Clinical Commissioning Groups"}

gss.E18	=gss.L00 =gss.M00 =	{ name: "Strategic Health Authorities"}

//Wales
gss.W03	= { name: "Upper layer Super Output Area (USOA)"}

// Northern Ireland
gss.N09	= { name: "Local Government Districts",                                           indexCodes: ['LAD17CD']}
gss.N24	= { name: "Police Force Districts"}



isGssCode = code => {
  return startsWithGssCode (code) && code.length==9
}

startsWithGssCode = code => {
  return (typeof code === 'string') && gss[code.slice(0,3)]
}

whatIs = code => {
  return startsWithGssCode (code)?
    gss[code.slice(0,3)].name
  : null
}

indexCodesOf = code => {
  return startsWithGssCode (code)?
    (gss[code.slice(0,3)].indexCodes || [])
  : null
}

module.exports = { isGssCode, startsWithGssCode, whatIs, indexCodesOf }
