#!/bin/bash

set -e
cd "${BASH_SOURCE%/*}"

EnvJson=../config/dev.json

echo Loading environment variables from ${EnvJson}

while read k v
do
	export ${k}=${v}
done < <(jq -r '. | to_entries[] | "\(.key) \(.value)"' ${EnvJson})

export AWS_REGION=us-east-1
export PORT=4023

echo Launching Express

../src/express/bin/www

