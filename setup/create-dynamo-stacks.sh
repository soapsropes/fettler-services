#!/bin/bash

# "set -e" makes it so if any step fails, the script aborts:
set -e

cd "${BASH_SOURCE%/*}"
source ./project-definitions.sh
source ./dynamo-definitions.sh

echo
echo "Creating Dynamo resource stacks for ${ProjectName}"

echo
echo "1. Creating development Dynamo resource stack ${DevDynamoStack}"

aws cloudformation deploy \
    --template-file ${DynamoTemplateFile} \
    --stack-name ${DevDynamoStack} \
    --parameter-overrides \
    ProfilesRCU=${DevProfilesRCU} \
    ProfilesWCU=${DevProfilesWCU} \
    EnvProjectName=${DevProjectName}

echo
echo "2. Creating production Dynamo resource stack ${ProdDynamoStack}"

aws cloudformation deploy \
    --template-file ${DynamoTemplateFile} \
    --stack-name ${ProdDynamoStack} \
    --parameter-overrides \
    ProfilesRCU=${ProdProfilesRCU} \
    ProfilesWCU=${ProdProfilesWCU} \
    EnvProjectName=${ProdProjectName}

echo
echo "Done creating Dynamo resource stacks for ${ProjectName}"

