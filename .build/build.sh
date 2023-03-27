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

branch=${BRANCH:-$(git rev-parse --abbrev-ref HEAD | sed 's/team\///')}
hash=$(git rev-parse --short HEAD)
ARTIFACTS_PATH=${ARTIFACTS_PATH:-$BASEDIR/out/artifacts}

echo "Building deployment artifacts for $branch-$hash"
if [ "$BUILD_MODE" == "production" ] ; then
    npm run compile:js:prod && npm run compile:scss:prod
else
    npm run compile:js && npm run compile:scss
fi

cartridges=$(cat $BASEDIR/package.json | jq '.sites[].cartridges[] | {subPath: (if .subPath == null then "" else .subPath + "/" end), name: .name} | "\(.subPath // "")\(.name)"' -r | sed 's@\.\./@@g' | sort | uniq)
tmpPath="$(mktemp -d)"
zipPath="${tmpPath}/${branch}-${hash}"
mkdir -p "${zipPath}"
for cartridge in $cartridges ; do
    echo $cartridge
    newPath=$(basename "$cartridge")
    cp -a "cartridges/$cartridge" "${zipPath}/${newPath}"
done
OLDPATH=$(pwd)
cd "${tmpPath}"
zip -r "${branch}-${hash}.zip" "${branch}-${hash}"
cd "$OLDPATH"

for POD_SUFFIX in "" "_eu03" "_ap01" "_ua03"; do
    if [ -d sites/site_template${POD_SUFFIX} ] ; then
        metaPath="${tmpPath}/${branch}-${hash}-meta${POD_SUFFIX}"
        mkdir -p "${metaPath}"
        cp -a sites/site_template${POD_SUFFIX}/* ${metaPath}
        cd "${tmpPath}"
        echo "creating ${branch}-${hash}-meta${POD_SUFFIX}.zip"
        zip -r "${branch}-${hash}-meta${POD_SUFFIX}.zip" "${branch}-${hash}-meta${POD_SUFFIX}"
        cd "$OLDPATH"
    fi
    if [ -d sites/site_dev${POD_SUFFIX} ] ; then
        metaDev="${tmpPath}/${branch}-${hash}-dev-meta${POD_SUFFIX}"
        mkdir -p "${metaDev}"
        set -e
        cp -a sites/site_template${POD_SUFFIX}/* ${metaDev}
        cp -a sites/site_dev${POD_SUFFIX}/* ${metaDev}
        set +e
        cd "${tmpPath}"
        echo "creating ${branch}-${hash}-dev-meta${POD_SUFFIX}.zip"
        zip -r "${branch}-${hash}-dev-meta${POD_SUFFIX}.zip" "${branch}-${hash}-dev-meta${POD_SUFFIX}"
        cd "$OLDPATH"
    fi
    if [ -d sites/site_stg${POD_SUFFIX} ] ; then
        metaStg="${tmpPath}/${branch}-${hash}-stg-meta${POD_SUFFIX}"
        mkdir -p "${metaStg}"
        set -e
        cp -a sites/site_template${POD_SUFFIX}/* ${metaStg}
        cp -a sites/site_stg${POD_SUFFIX}/* ${metaStg}
        set +e
        cd "${tmpPath}"
        echo "creating ${branch}-${hash}-stg-meta${POD_SUFFIX}.zip"
        zip -r "${branch}-${hash}-stg-meta${POD_SUFFIX}.zip" "${branch}-${hash}-stg-meta${POD_SUFFIX}"
        cd "${OLDPATH}"
    fi
done
echo "Copying artifacts from $tmpPath to $ARTIFACTS_PATH"
mkdir -p "$ARTIFACTS_PATH"
if [ -e $tmpPath/${branch}-${hash}.zip ] ; then
    cp "${tmpPath}/${branch}-${hash}.zip" "${tmpPath}/${branch}-${hash}-meta.zip" "$ARTIFACTS_PATH"
fi
for POD_SUFFIX in "" "_eu03" "_ap01" "_ua03"; do
    if [ -e $tmpPath/${branch}-${hash}-meta${POD_SUFFIX}.zip ] ; then
        cp "${tmpPath}/${branch}-${hash}-meta${POD_SUFFIX}.zip" "$ARTIFACTS_PATH"
    fi
    if [ -e $tmpPath/${branch}-${hash}-dev-meta${POD_SUFFIX}.zip ] ; then
        cp "${tmpPath}/${branch}-${hash}-dev-meta${POD_SUFFIX}.zip" "$ARTIFACTS_PATH"
    fi
    if [ -e $tmpPath/${branch}-${hash}-stg-meta${POD_SUFFIX}.zip ] ; then
        cp "${tmpPath}/${branch}-${hash}-stg-meta${POD_SUFFIX}.zip" "$ARTIFACTS_PATH"
    fi
done
