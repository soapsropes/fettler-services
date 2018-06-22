#!/bin/bash

# "set -e" makes it so if any step fails, the script aborts:
set -e

cd "${BASH_SOURCE%/*}"
source ../setup/pipeline-config.sh

aws s3 cp dev.json s3://${S3BucketConfig}/${S3PrefixConfigEnv}
aws s3 cp prod.json s3://${S3BucketConfig}/${S3PrefixConfigEnv}

