import pandas as pd
import numpy as np

OAs_lookup = pd.read_csv ('./data/Postcode_to_Output_Area_to_Lower_Layer_Super_Output_Area_to_Middle_Layer_Super_Output_Area_to_Local_Authority_District_February_2018_Lookup_in_the_UK.csv', dtype='unicode' )

abridged=OAs_lookup.drop(OAs_lookup.columns[10:14],axis=1)
abridged=abridged.drop(abridged.columns[5],axis=1)
abridged=abridged.drop(abridged.columns[:2],axis=1)

valid=abridged[pd.to_numeric(abridged['doterm'])==0]
valid=valid.drop(valid.columns[2],axis=1)

recent=abridged[pd.to_numeric(abridged['doterm'])>201000]

recent.to_csv ('./data/pcds-oa11-lsoa11cd-msoa11cd-ladcd_Recently_terminated_postcodes_only.csv', index=False)
valid.to_csv ('./data/pcds-oa11-lsoa11cd-msoa11cd-ladcd_Valid_postcodes_only.csv', index=False)
