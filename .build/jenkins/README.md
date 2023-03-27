# Jenkins Build configuration

This script allows you to use any Pipeline job configuration, just make sure it finds the `Jenkinsfile` at
```
.build/jenkins/Jenkinsfile
```
There are some optional parameters that can be used in the build definition:

### `DEPLOY_ENVIRONMENTS_CONFIG`
This should be a `Credentials` parameter of type `Secret file`.
This is a Jenkins credential file which is a `.json` file that contains the `environments` that
will be used for deployment.

Optionally, this file can be embedded _in the repo_ as `.build/{branch}-environments.json`.  This file
should not contain credentials.  Instead, use the `SFCC_CLIENT_CREDS` parameter (a Jenkins
username/Password credntial) or `SFCC_CLIENT_ID` and `SFCC_CLIENT_PASS` to provide credentials.

For example:
```json
{
    "environments": {
        "development-ua001": {
            "server": "development-ua001-underarmour.demandware.net",
            "username": "builder",
            "password": "*PASSWORD*"
        },
        "development-ua002": {
            "server": "development-ua002-underarmour.demandware.net",
            "username": "builder",
            "password": "*PASSWORD*"
        },
        "development-ua003": {
            "server": "development-ua03-underarmour.demandware.net",
            "username": "builder",
            "password": "*PASSWORD*"
        }
    }
}
```

----------------------------------------------------------------------------------------------------
*NOTE:*
The deploy script will deploy to *every* environment specified in this file, so be sure to only include the
ones you want.
----------------------------------------------------------------------------------------------------

### `DEPLOY_ENVIRONMENTS_CERTS`
This should be a `Credentials` parameter of type `Secret file`
If your deployment requires cert files, you can include them in another Credential file that is a
`.zip` file containing all the certs referenced in your `DEPLOY_ENVIRONMENTS_CONFIG`.  This file
will be extracted to `../certs` relative to the `build-suite`, so you can reference it that way
in your `DEPLOY_ENVIRONMENTS_CONFIG`.

### `SLACK_NOTIFY_CHANNEL`
This should be a `string` parameter.
If `SLACK_NOTIFY_CHANNEL` is set and not empty, the build will notify on the specified channel at
the end of the build.

### `SLACK_NOTIFY_START`
This should be a `boolean` parameter.
If this parameter is set and `true`, the slack channel specified will be notified when builds start.

### `POST_BUILD_SCRIPT`
This should be a `Multi-line String` parameter.
If this parameter is set and not empty, it will be executed as a shell script on success of the build.

### `SFCC_CLIENT_CREDS`
This should be a `Credentials` parameter of type `User name and Password`.
This will be an OCAPI client ID and Password that has permissions on all environments specified in the
`environments.json` file.

### `GITHUB_CREDS`
This should be a `Credentials` parameter of type `User name and password`.
This will be a github username and a Personal Access Token that has access to the
`SalesforceCommerceCloud` organization on Github.  This will be used to retrieve the `sfcc-ci`
command line tool if it is not already on the build environment.

### `NPMRC_FILE`
This should be a `Credentials` parameter of type `Secret file`.
This will provide a `.npmrc` for npm install. **NOTE** This currently is only used for running UACAPI tests.

### `GCLOUD_JSONKEY`
This should be a `Credentials` parameter of type `Secret file`.
This will provide a service credentials file for docker file retrieval from `gcr.io`.  **NOTE** This currently is
only used for running UACAPI tests.

## UACAPI Tests
**NOTE** UACAPI tests will automatically be run after deployment if both `NPMRC_FILE` and `GCLOUD_JSONKEY` are provided.

## Prerequisites
There are only a few prerequisites that need to be installed on the Jenkins server:

1. `nvm` needs to be installed in the `jenkins` home directory at `~/.nvm`
1. `jq` needs to be installed on the machine

