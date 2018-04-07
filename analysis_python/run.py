#/usr/bin/env python
# -*- coding: UTF-8 -*-
import pandas as pd
from io import StringIO
import json
import preprocess as prep

data_frame = prep.get_data_frame("../raw_data/winequality-red.csv", "../raw_data/winequality-white.csv")
data_frame.to_csv("../clean_data/data_wine.csv", index=False)
metadata = prep.get_metadata(data_frame)
with open('../clean_data/metadata_wine.json', 'w') as writer:
    json.dump(metadata, writer)

