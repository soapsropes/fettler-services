#!/bin/bash

## Dynamo-specific variables

DynamoTemplateFile=dynamo-resources.json

DevDynamoStack=Dynamo-${DevProjectName}
ProdDynamoStack=Dynamo-${ProdProjectName}

DevProfilesRCU=1
DevProfilesWCU=1

ProdProfilesRCU=1
ProdProfilesWCU=1

