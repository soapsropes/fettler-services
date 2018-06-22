#!/bin/bash

# "set -e" makes it so if any step fails, the script aborts:
set -e

cd "${BASH_SOURCE%/*}"

# Replace common variables (Region and AccountId) in API Swagger template
cat api-swagger-template.json | sed -e "s/%Region%/$AwsRegion/g" | sed -e "s/%AccountId%/$AwsAccountId/g" > api-swagger-partial.json

# Replace development-specific variables (API Title)
cat api-swagger-partial.json | sed -e "s/%ApiTitle%/$DevStack/" > api-swagger.json

# Package development SAM template (loads Lambda dist zips to S3 locations)
aws cloudformation package --template-file sam-template.json --output-template-file sam-output-dev.yml --s3-bucket "$S3BucketArtifacts" --s3-prefix `echo $CODEBUILD_BUILD_ID | tr : /`
rm -f api-swagger.json

# Replace production-specific variables (API Title)
cat api-swagger-partial.json | sed -e "s/%ApiTitle%/$ProdStack/" > api-swagger.json

# Package production SAM template (loads Lambda dist zips to S3 locations)
aws cloudformation package --template-file sam-template.json --output-template-file sam-output-prod.yml --s3-bucket "$S3BucketArtifacts" --s3-prefix `echo $CODEBUILD_BUILD_ID | tr : /`

