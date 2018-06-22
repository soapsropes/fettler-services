#!/bin/bash

# "set -e" makes it so if any step fails, the script aborts:
set -e

cd "${BASH_SOURCE%/*}"
source ./project-definitions.sh
source ./pipeline-definitions.sh
source ./pipeline-config.sh

echo
echo "Creating build pipeline stack ${PipelineStack} for project ${ProjectName}"

aws cloudformation deploy \
    --template-file "${PipelineTemplateFile}" \
    --stack-name "${PipelineStack}" \
    --capabilities CAPABILITY_NAMED_IAM \
    --parameter-overrides \
    ProjectName="${ProjectName}" \
    ProjectDescriptionName="${ProjectDescriptionName}" \
    GitHubOwner="${GitHubOwner}" \
    GitHubRepo="${GitHubRepo}" \
    GitHubBranch="${GitHubBranch}" \
    GitHubOAuthToken="${GitHubOAuthToken}" \
    S3BucketArtifacts="${S3BucketArtifacts}" \
    S3BucketConfig="${S3BucketConfig}" \
    S3PrefixConfigEnv="${S3PrefixConfigEnv}" \
    ApprovalEmail="${ApprovalEmail}"

echo
echo "Done creating build pipeline stack for ${ProjectName}"

