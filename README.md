# Under Armour Storefront Reference Application

Under Armour's Salesforce Commerce Cloud B2C storefront application based on Salesforce's Storefront Reference Architecture (SFRA).

## Repository Info

### NodeJS

This repository was developed to be used with versions of NodeJS greater than: `10`.

You will need to run `npm install` at the root of this repository before making use of any of the commands / tools provided.

If your NodeJS version is less than `10` you can make use of the NVM application to install multiple versions of NodeJS on your computer.

#### NodeJS Resources

- https://github.com/nvm-sh/nvm
- https://github.com/coreybutler/nvm-windows

### Directory Structure

Directory | Notes
--------- | -----
`.build` | This folder houses build scripts that are used to deploy the repository to an environment like Staging or Development.
`build_tools` | This folder houses build scripts that are used for development build flows.
`.circleci` | This folder houses configurations for the Continuous Integration service called CircleCI which runs unit tests and validations for submitted PRs.
`.bin` | This folder can house any custom scripts that aide in the development process.
`cartridges` | This folder should contain an custom made cartridges (customization, integration) and the submodule cartridges added through git. This folder should be a flat directory of cartridges.
`test` | This folder should contain all of the custom test cases built for the application.
`sites` | This folder should contain the necessary site imports to create a fully functioning environment.
`sites/site_template` | The Site Template import should be used to store any "config as code" elements. This import should not contain any demo data and should be imported on a regular basis to Development & Staging with code updates.
`sites/site_demo` | The Site Demo import should be used by Developers to stand up / update their Sandboxes and it can also be used on any QA instances or the Development instance.

### Quick Start Guide

- Clone the repository

- Initialize and Update Submodules
```sh
git submodule init
git submodule update
```

- Run npm install
```sh
npm install
```

- Run the watch script to compile JS and SCSS then watch for new changes to compile
```sh
npm run watch
```

## GIT Submodules

There are several git submodules in this repository, for example:

- cartridges/storefront-reference-architecture
- cartridges/plugin_wishlists
- cartridges/lib_productlist

These dependencies are included as submodules to ensure upgradeability of the solution as well as to help enforce the SFRA best practice of not modifying the SFRA base cartridge(s). As a rule, any dependency that should not or need not be modified should be added as a submodule. This will allow those dependencies to be independently managed and updated.

You will need to initialize / update all of the linked submodules for this repository.

```sh
git submodule init
git submodule update
```

Either way, these commands will be required at least once after cloning this repository, in order to populate the `submodules`.

### Additional Resources

More information on git submodules, including how to update the remote reference, can be found here:

- https://git-scm.com/book/en/v2/Git-Tools-Submodules
- https://www.vogella.com/tutorials/GitSubmodules/article.html

## GIT LFS

The repository has been configured to make use of GIT LFS for file storage of assets contained in the following two directories:

- sites/site_demo/catalogs/*/static/**
- sites/site_demo/libraries/*/static/**
- Any files with the extension: jpg, png, gif

Any files added to the above locations will automatically be added to LFS.

You can see the configuration for this in the following file: `.gitattributes`

If you plan to add any files to these above locations, you should execute the following command to add GIT LFS, to your local repository:

```sh
git lfs install
```

> This adds LFS filters to the .gitconfig file in your home directory, so they are available for all your repos. You could run git lfs install --local if you only want to use LFS with a particular repo.

https://help.github.com/en/articles/configuring-git-large-file-storage

## Installing

```sh
npm install
```

## Building

You can build the entire solution and watch for new changes to recompile by simply running:

For all defined Sites
```sh
npm run watch
```

For individual Sites
```sh
npm run watch:na
npm run watch:emea
```

### Compiling the Customization Layer

The following command can be ran at the root of the repository, to build the customization layer.

For all defined Sites
```sh
npm run compile:js
npm run compile:scss
```

For individual Sites
```sh
npm run compile:js:na
npm run compile:scss:na
npm run compile:js:emea
npm run compile:scss:emea
```

To compile JS source file across all cartridges that is mentioned in `cartridges.json` you can run next command:
```sh
npm run compile:js
```

If you want to watch for changes and automatically compile, the following commands can be used:
```sh
npm run watch
```

*Note: For uploading files you can use the [Prophet VSCode plugin](https://marketplace.visualstudio.com/items?itemName=SqrTT.prophet) to handle automatic uploads for you. (Recommended) Alternatively, you will need to have `dwupload watch` running in a different terminal window to upload.*

#### WebPack Aliases

WebPack Aliases should be used to reference code from cartridges that are not the main customization cartridges.

The configuration for these alises can be found in the main `webpack.config.js` file.

The following are some examples of using aliases:

```js
var processInclude = require('base/util'); // Includes the SFRA util.js script
```

```scss
@import "~base/bootstrap-custom-import"; // Incudes the SFRA bootstrap-custom-import.sass file
```

### Compiling the style guide

To compile `atlas-guide` style guide pages you need to run next command:
```sh
compile:atlas
```

Style guide pages are usind compiled styles from `app_ua_core` cartridge, so you need to compile it firstly using `npm run compile:scss` or run:
```sh
build:atlas
```

### Uploading the cartridges

To upload cartridges using `Prophet Debugger` you need to install and use the plugin. Then have a `dw.json` file in your project's `root` directory with this structure:
```
{
  "username": "login",
  "password": "********",
  "hostname": ["dev**-****-underarmour.demandware.net"],
  "code-version": "active_code_version"
}
```

### Building on a Build Server

The `.build/` folder is a collection of custom scripts created & maintained by [@dsmaher](https://github.com/dsmaher)

See the [README](.build/README.md) for more information on using these scripts.

## Testing

### Running Unit Tests

You can run `npm test` or `npm run test` to execute all unit tests in the project. Run `npm run cover` to get coverage information. Coverage will be available in coverage folder under root directory.

#### Unit Test Code Coverage

1. Open a terminal and navigate to the root directory of this repository.
2. Enter the command: `npm run cover`.
3. Examine the report that is generated. For example: Writing coverage reports at: `/Path/To/This/Rep/coverage`
4. Navigate to this directory on your local machine, open up the index.html file. This file contains a detailed report.

SFRA makes use of Instanbul to provide code coverage for the Unit Tests. This sample repo has been configured to use the same tool.

If you need to ignore a cartridge or files from the code coverage, exclusions can be added to the `.istanbul.yml` file.

#### Testing SFRA

You can run `npm run test:sfra` to execute SFRA's unit test suite.

*Note*: This requires that the storefront-reference-architecture dependency module has been properly installed.

### Running Integration Tests

Integration tests are located in the `test/integration` directory.

To run integration tests you can use the following command:

```sh
npm run test:integration
```

**Note:** Please note that short form of this command will try to locate URL of your sandbox by reading `dw.json` file in the root directory of your project.

If you don't have dw.json file, integration tests will fail. If you have not done so yet, copy `dw.sample.json` to `dw.json` at the root of the repository.

You can also supply URL of the sandbox on the command line:

```sh
npm run test:integration -- --baseUrl devxx-sitegenesis-dw.demandware.net
```

#### Integration Test Code Coverage

Formal code coverage of integration is not possible with extensive overhead but a utility has been created for this repository that will list any controller end-points found in the `cartridges/` directory and report if they have a corresponding integration test or not.

This custom custom coverage script can be executed with the following command:
```sh
npm run cover:integration
```

*Note: As a rule, each controller end-point in the customization layer should have a corresponding integration test.`

## Site Imports

**Note** This section is not currently implemented. As a workaround, manual imports can be achieved by:

1. `cd` into the `sites` directory.
2. Zip the data directory you wish to upload:

    ```sh
    zip -r site_demo.zip site_demo
    ```

3. Upload the zip file to the **Administration > Site Development > Site Import & Export** module within SFCC Business Manager. (Note: this action is disabled in Development instance types)

**Note**: It is important that the name of the zip file matches the folder name within the root of the zip file itself. Also, you cannot create a 'good' import zip file by using MacOS's "Compress" context menu action. You _must_ use the CLI to create the zip file for it to import correctly.

---

Site Imports serve as quick way to create test / develpoment environments and provide a way to "codify" site configurations.

The site imports for this repository can be generated using the following commands:

```sh
npm run siteimport # Full
npm run siteimport:template # Template Only
npm run siteimport:demo # Demo Only
```

*Note: Site imports will be generated at the root of this repository.*

After uploading code and importing `site_template` and `site_demo`, the environment imported to should be fully functional with demo: configurations, products, price books, inventory lists, content and anything else necessary to work on the codebase.

*Note: The first time the imports are uploaded to a "fresh" sandbox, the site search indexes will need to be built/rebuilt.*