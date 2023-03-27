## Github actions for `ua-sfra`
Github Actions are now used for the build process for `ua-sfra`.  Using GH actions will provide
visibility into the build process and enable developers to self-service build configuration changes.

Documentation for Github Actions can be found [here](https://docs.github.com/en/actions/quickstart)

### Workflows
The following workflows are currently defined:

#### Deploy Branch
This workflow deploys a branch to predefined list of envrionments, based on [`.build/config.yaml`](../../.build/config.yaml).
This file is documented [here](../../.build/README.md).

This workflow can be manually deployed, but also executes on a cron schedule.

#### Deploy to Target Instance
This workflow is only manually triggered and deploys a branch to a specified host.  You may use either
a URL for an instance or a name defined in [`.build/config.yaml`](../../.build/config.yaml).  If a
named instance is used, the settings in [`.build/config.yaml`](../../.build/config.yaml) are used and
other inputs are ignored.

For this to function on a sandbox or other environment, you must ensure the instance has OCAPI and WEBDAV permissions defined for the client ID `df9bf4ce-83c7-467d-a23f-dd92dcd5545e`.  This tool uses `sfcc-ci` for deployment so ensure OCAPI and WEBDAV are configured on the instance per the documentation for [`sfcc-ci`](https://github.com/SalesforceCommerceCloud/sfcc-ci#configure-an-api-key).

#### PR Check
This workflow executes for PRs and ensures the validity of the PR prior to merge.

### Secrets
The following Secrets are used.

| Secret                     | Notes                                                                         |
|----------------------------|-------------------------------------------------------------------------------|
| `GH_SSH_KEY`               | SSH Key for checkout. Needs to also have permissions to clone from the [SalesForceCommerceCloud](https://github.com/SalesforceCommerceCloud) org.  Required for *all actions* |
| `SFCC_OAUTH_CLIENT_ID`     | The client ID used for deployment to environments.  Per [`sfcc-ci` documentation](https://github.com/SalesforceCommerceCloud/sfcc-ci#environment-variables). |
| `SFCC_OAUTH_CLIENT_SECRET` | The secret for the above client ID.                                           |
| `SFCC_CERT_xxx_P12`        | A `base64` encoded `.p12` certificate with private key for deploying to `stg` environments. The `xxx` should be the short realm ID (e.g. `ua03`). |
| `SFCC_CERT_xxx_SECRET`     | The secret used to use the `.p12` file.                                       |
| `SLACK_WEBHOOK`            | Webhook URL for slack notifications.  Please see the [action documentation](https://github.com/rtCamp/action-slack-notify#usage) for details.  |
| `TEST_QUEUE_USER`          | The user used for triggering automation tests. (only used for environments with tests configured) |
| `TEST_QUEUE_PASSWORD`      | The password used for triggering automation tests. (only used for environments with tests configured) |
| `TEST_QUEUE_USER_xxx`      | Realm override for user used for triggering automation tests.                 |
| `TEST_QUEUE_PASSWORD_xxx`  | Realm override for password used for triggering automation tests.             |

> *Note:*
