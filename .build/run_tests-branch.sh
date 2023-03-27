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

cd "$BASEDIR"
branch=${BRANCH-$(git rev-parse --abbrev-ref HEAD)}
    if [[ ( "$branch" == *"release"* ) || ( "$branch" == *"hotfix"* ) ]]
    then
        echo $branch
        branch=release
        echo "branch is $branch "
    else
        echo "branch is not release or hotfix branches"
    fi

echo "Running test for branch: ${branch}"
BRANCH_ENVIRONMENTS=$(node "$DIR/read-config"| jq '.branches["'$branch'"][]' -r)

echo "Running tests for: "
echo "$BRANCH_ENVIRONMENTS"

for test_env in  $BRANCH_ENVIRONMENTS ; do
    $DIR/run_tests-instance.sh ${test_env}
done
