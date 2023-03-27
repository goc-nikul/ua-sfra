# General Build documentation

This folder contains several scripts supporting building and deploying `ua-sfra` to various environments.

These scripts will respect environment variables set in a `.env` file found in the root of this
repository for testing purposes.  `.env` is ignored by `git` and should not be committed to this repository.

### `build.sh`
This script will execute a build for this repository and place artifacts in the folder specified
by the environment variable `ARTIFACTS_PATH`.  By default, this is the `out/artifacts` folder at the root
of this repository.

### `deploy.sh`
This script will deploy artifacts created by the `build.sh` script.  This script should be run
using the following syntax:

`./build/deploy.sh {host} {region} [instanceType] [2faHost]`

- `host` is the hostname of the instance to deploy to
- `region` can be one of `na`, `emea`, or `apac`.  It is optional, but since this uses a simple positional argument structure, it's required if you choose to specify an instanceType
- `instanceType` is optional, and defaults to `dev`.  only `dev` and `stg` are supported at the moment.  If `stg` is provided, you must also include
a `2faHost`.  See [Metadata] below.
- `2faHost` is the `cert.staging.{realm}.{org}.demandware.net` host name used when deploying to staging instances.  For example, `cert.staging.na04.underarmour.demandware.net`

### Credentials required:
For deploying to all instances, a client ID and client secret are required.  These should be specified per the `sfcc-ci` documentation as:
- `SFCC_OAUTH_CLIENT_ID` client id used for authentication
- `SFCC_OAUTH_CLIENT_SECRET` client secret used for authentication

For deploying to staging instances, client certificates should be stored in a PKCS#12 (`.p12`) file which is then base-64 encoded and stored in an environment variable named `SFCC_CERT_{realm}_P12`.  The associated secret is stored in `SFCC_CERT_{realm}_P12`.  For example:
```
SFCC_CERT_NA04_P12="PHJlYWwgUEtDUzEyIGNvbnRlbnQgZ29lcyBoZXJlPgo="
SFCC_CERT_NA04_SECRET="P@ssword!"
```
(Obviously your P12 value will be much bigger)

### Environment options

#### `run-tests`
Whether to run tests or not on this environment after a deploy.  The `TEST_QUEUE_JOB`,
`TEST_QUEUE_USER`, `TEST_QUEUE_PASSWORD`, `TEST_URL`, and `TEST_FORM_DATA` variables
must be set appropriately for this to work.  These can be configured per-environment in the `config.yaml` file.

### Metadata
Metadata files will be generated for *all* instance types and regions with every build, based on the existence of the site data in `sites`.  These metadata files will be stored in the artifacts folder and will be used appropriately during deployment.

### `config.yaml`

Here is a sample `config.yaml` which describes each option for configuring deployment:

```yaml
branches:
# Each branch entry is an array of environments to deploy to.
  develop:
    - dev-ua03
  main:
    - stg-ua03
environments:
# Each environment configuration has the following structure
# instance:
#   host: // the `blah-blah-blah.demandware.net` hostname
#   region: // one of `na`,`emea`,`apac` - this tells the deployer to pull the right metadata
#   instanceType: // one of `dev`, `stg`, 'prd' - this also tells the deployer to pull the right metadata,
#                 // or for `prd` instances, that `replication` should be used for deployment rather than
#                 // uploading code/metadata directly
#   certURL: // the `cert.blah.blah.blah.demandware.net` hostname for 2FA deploys.  Only relevant for `stg` environments
#   test:  // (optional) Configuration data for kicking off automation tests
#     url: // the URL of the test suite to run
#     formData: // any form-data required to supply parameters on the post
#   replication: (optional) Required for `instanceType: prd`
#     host:  // The staging host where the job is defined for this prd instance
#     jobId: // The job ID on that staging host that is configured to run code and metadata replications
  dev-ua03:
    host: development-ua03-underarmour.demandware.net
    region: na
    mode: production
    instanceType: dev
    test:
      url: https://ci.zebrunner.com/job/ua-ecomm/job/phoenix-auto-qa/job/ECOMM-INT-HealthCheck-Chrome/buildWithParameters?token=ciStart
      formData: locale=en_US
  stg-ua03:
    host: staging-ua03-underarmour.demandware.net
    region: na
    mode: production
    instanceType: stg
    certURL: cert.staging.ua03.underarmour.demandware.net
  prd-ua03:
    host: production-ua03-underarmour.demandware.net
    instanceType: prd
    replication:
      host: staging-ua03-underarmour.demandware.net
      jobId: CodeAndDataDeploy
```
