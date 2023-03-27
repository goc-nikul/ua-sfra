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

environment=$1
env_details=$(node "$DIR/read-config" | jq '.environments["'$environment'"]')
export TEST_FORM_DATA=$(echo "$env_details" | jq '.test.formData // empty' -r)
export TEST_URL=$(echo "$env_details" | jq '.test.url // empty' -r)

POD=$(echo "${environment^^}" | cut -d '-' -f2)
uservar=TEST_QUEUE_USER_${POD}
passwordvar=TEST_QUEUE_PASSWORD_${POD}
if [ ! -z "${!uservar}" ] && [ ! -z "${!passwordvar}" ]; then
    export TEST_QUEUE_USER="${!uservar}"
    export TEST_QUEUE_PASSWORD="${!passwordvar}"
fi

$DIR/run_tests.sh ${environment}
