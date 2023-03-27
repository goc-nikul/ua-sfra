#!/bin/bash

# No Longer using Jenkins to run tests.  It was removed.
# Git Logic Below
if [ -z "$TEST_URL" ]; then
    echo "TEST_URL empty"
    TEST_PARAMS=1
fi
if [ -z "$TEST_QUEUE_USER" ] ; then
    echo "TEST_QUEUE_USER empty"
    TEST_PARAMS=1
fi
if [ -z "$TEST_QUEUE_PASSWORD" ] ; then
    echo "TEST_QUEUE_PASSWORD empty"
    TEST_PARAMS=1
fi
if [ -z "$TEST_FORM_DATA" ]  ; then
    echo "TEST_FORM_DATA empty"
    TEST_PARAMS=1
fi

if ! [ -z "$TEST_PARAMS" ]; then
    exit 0
fi

function execCurl {
    if [ ! -z "$DRY_RUN" ] && [[ "$DRY_RUN" != "false" ]] && [[ "$DRY_RUN" != "null" ]]; then
        echo -e "echo curl $*"
    else
        bash -c "curl $*"
    fi
}

echo "Executing tests"
execCurl -X POST -u "${TEST_QUEUE_USER}:${TEST_QUEUE_PASSWORD}" "'${TEST_URL}'" -F "${TEST_FORM_DATA}"
