#!/bin/bash

# if realpath is not on system use readlink
if ! [ -x "$(command -v realpath)" ]; then
    DIR=$(dirname $(readlink -f -- "$0"))
else
    DIR=$(dirname $(realpath $0))
fi
BASEDIR=$(dirname $DIR)
if [ -f "${BASEDIR}/.env" ] ; then
    . "${BASEDIR}/.env"
fi

deploy_env=$1

env_details=$(node "$DIR/read-config" | jq '.environments["'$deploy_env'"]')
if [ -z "$env_details" ] || [ "$env_details" == "null" ]; then
    env_host=$1
    env_region=$2
    env_instanceType=$3
    env_certURL=$4
else
    env_host=$(echo "$env_details" | jq '.host' -r)
    env_region=$(echo "$env_details" | jq '.region' -r)
    env_instanceType=$(echo "$env_details" | jq '.instanceType' -r)
    env_certURL=$(echo "$env_details" | jq '.certURL | select(. != null)' -r)
    if [ "$env_instanceType" == "prd" ]; then
        env_host=$(echo "$env_details" | jq ".replication.host" -r)
        env_jobid=$(echo "$env_details" | jq ".replication.jobId" -r)
    fi
fi

$DIR/deploy.sh "$env_host" "$env_region" "$env_instanceType" "$env_certURL" "$env_jobid"
