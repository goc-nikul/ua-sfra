#!/bin/bash
set -e
DIR=$(dirname $(realpath $0))
BASEDIR=$(dirname $DIR)
if [ -f "${BASEDIR}/.env" ] ; then
    . "${BASEDIR}/.env"
fi

host=$1
region=$2
instanceType=${3:-dev}
SFCC_CERT_URL=${4:-$1}
jobId=$5

POD_SUFFIX=""
case $region in
    emea)
        POD_SUFFIX="_eu03"
        ;;
    apac)
        POD_SUFFIX="_ap01"
        ;;
    na-oms)
        POD_SUFFIX="_ua03"
        ;;
esac

ARTIFACTS_PATH=${ARTIFACTS_PATH:-$BASEDIR/out/artifacts}

# This finds all files with `-meta` in the name (optionally with POD suffix), then sorts by filename length
# so it can get the shortest-named file (the one without `-dev-` or `-stg-` in it).  This ensures that
# it always chooses the base metadata file for the given pod suffix.
siteArchive=$(find "$ARTIFACTS_PATH" -type f -name '*-meta'"${POD_SUFFIX}"'.zip' | awk '{ print length, $0 }' | sort -n | cut -d" " -f2- | head -n 1)
# This just grabs the code package.  (the only one without `-meta` in the name)
codeArchive=$(find "$ARTIFACTS_PATH" -type f -name '*.zip' -not -name '*-meta*.zip')

if ! [ -z "$instanceType" ] ; then
    maybeSiteArchive=$(echo "$siteArchive" | sed -e "s/-meta${POD_SUFFIX}.zip/-${instanceType}-meta${POD_SUFFIX}.zip/g")
    if [ -e $maybeSiteArchive ] ;then
        siteArchive=${maybeSiteArchive}
    fi
fi

BRANCH=${BRANCH:-$(git branch | grep '^\*' | cut -d ' ' -f2)}

echo "Deploying to $host"
echo "meta suffix: $POD_SUFFIX"
siteArchiveBase=$(basename $siteArchive)
codeArchiveBase=$(basename -s .zip $codeArchive)
echo "code artifact: $codeArchive"
echo "meta artifact: $siteArchive"

if [ -f "$(dirname $DIR)/dw.json" ] ; then
    cd $(dirname $DIR)
    npm run uploadAll
    exit $?
fi

if [ -z "$SFCC_OAUTH_CLIENT_ID" ] || [ -z "$SFCC_OAUTH_CLIENT_SECRET" ]; then
    echo "SFCC Credentials required"
    exit 1
fi
if [ -z "$host" ] ; then
    echo "Host required"
    exit 1
fi

sfccci="$(dirname $DIR)/node_modules/.bin/sfcc-ci"

if [ ! -z "$DEBUG_DEPLOY" ] && [[ "$DEBUG_DEPLOY" != "false" ]] && [[ "$DEBUG_DEPLOY" != "null" ]]; then
    sfccci="$sfccci -D"
fi

if [ ! -z "$SFCC_CERT_URL" ]; then
    POD=$(echo "${SFCC_CERT_URL^^}" | cut -d '.' -f3)
    certvar=SFCC_CERT_${POD}_P12
    certsecretvar=SFCC_CERT_${POD}_SECRET
    if [ ! -z "${!certvar}" ] && [ ! -z "${!certsecretvar}" ]; then
        SFCC_CERT_P12="${!certvar}"
        SFCC_CERT_SECRET="${!certsecretvar}"
    fi
fi

CERT_PARAMS=
if ! [[ -z "$SFCC_CERT_P12" ]] ; then
    SFCC_CERT_PATH=$(mktemp)
    chmod 600 $SFCC_CERT_PATH
    echo "$SFCC_CERT_P12" | base64 -d > $SFCC_CERT_PATH
fi
if ! [[ "$SFCC_CERT_PATH" == */* ]] ; then
    SFCC_CERT_PATH="${SFCC_CERT_BASE}/${SFCC_CERT_PATH}"
fi
if [ ! -z "$SFCC_CERT_PATH" ] && [ -f "$SFCC_CERT_PATH" ]; then
    CERT_PARAMS="-c '${SFCC_CERT_PATH}'"
    if [ ! -z "$SFCC_CERT_SECRET" ] ; then
        CERT_PARAMS="${CERT_PARAMS} -p '${SFCC_CERT_SECRET}'"
    fi
fi

function execSfccCI {
    if [ ! -z "$DRY_RUN" ] && [[ "$DRY_RUN" != "false" ]] && [[ "$DRY_RUN" != "null" ]]; then
        echo -e "${sfccci[@]} $*"
    else
        bash -c "${sfccci[@]} $*"
    fi
}

execSfccCI client:auth
if [ "$instanceType" == "prd" ] ; then
    execSfccCI job:run "${jobId}" -i "${host}" --sync
else
    certhost=${SFCC_CERT_URL-$HOST}
    if  [ -e "$siteArchive" ] ; then
        execSfccCI instance:upload ${siteArchive} -i "${certhost}" "${CERT_PARAMS[@]}"
        execSfccCI instance:import ${siteArchiveBase} -i ${host} --sync
    fi
    execSfccCI code:deploy ${codeArchive} -i "${certhost}" "${CERT_PARAMS[@]}"
    execSfccCI code:activate ${codeArchiveBase} -i ${host}
    if [ ! -z "$SFCC_CERT_P12" ]; then
        rm $SFCC_CERT_PATH
    fi
fi
