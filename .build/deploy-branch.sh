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
branch=${BRANCH_OVERRIDE:-${BRANCH:-$(git rev-parse --abbrev-ref HEAD)}}
    if [[ ( "$branch" == *"release"* ) || ( "$branch" == *"hotfix"* ) ]]
    then
        echo $branch
        branch=release
        echo "branch is $branch "
    else
        echo "branch is not release or hotfix branches" 
    fi
echo "Deploying for branch: ${branch}"
BRANCH_ENVIRONMENTS=$(node "$DIR/read-config"| jq '.branches["'$branch'"][]' -r)

echo "Deploying to: "
echo "$BRANCH_ENVIRONMENTS"

for deploy_env in  $BRANCH_ENVIRONMENTS ; do
    $DIR/deploy-instance.sh ${deploy_env}
done
