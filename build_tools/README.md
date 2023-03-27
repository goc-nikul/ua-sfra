# Under Armour Build Scripts

This repository contains a collection of scrips that are useful for creating a new Reference Architecture overlay cartridge. All of the scripts are executable through CLI.

## Available commands

Please notes all of these commands should be run from the project root directory.

`node build_tools/build --help` - Generate help message

`--upload [path::String]` - Upload a file to a sandbox. Requires dw.json file at the root directory.

For example:
`node build_tools/build --upload cartridges/app_ua_core/cartridge/templates/resources/version.properties`

`node build_tools/build --uploadCartridge String` - Upload a cartridge.

For example:
`node build_tools/build --uploadCartridge app_ua_core`

`node build_tools/build --test [path::String]` - Run unittests on specified files/directories.

`node build_tools/build --cover` - Run all unittests with coverage report.

`node build_tools/build --compile --compile String` - Compile css/js files. - either: css or js

For example:
`node build_tools/build --compile css`

`node build_tools/build --lint String` - Lint scss/js files. - either: js or css

For example:
`node build_tools/build --lint css`

`node build_tools/build --createCartridge String` - Create new cartridge structure

For example:
`node build_tools/build --createCartridge plugin_myplugin`

`node build_tools/build --watch` - Watch and upload files

`node build_tools/build --deployCartridges` - Uploads all cartridges defined in package.json to the SFCC server. Requires dw.json file in build_tools or command line arguments.

For example:
`node build_tools/build --deployCartridges --code-version=version1 --activation-hostname=dev01-na01-hostname.demandware.net --hostname=dev01-na01-hostname.demandware.net --username=myusername --password=mypassword`

`node build_tools/build --deploy-data`- Deploys data_impex metadata to SFCC server. Requires dw.json file in build_tools or command line arguments.

For example:
`node build_tools/build --deploy-data --hostname=dev01-na01-hostname.demandware.net --username=myusername --password=mypassword --data-bundle=core`

## Installation and Usage

You can install the dependencies for these build tools using the following command in the project root directory:

```sh
npm install
```

In order for all commands to work, this script makes a few assumptions:

* There's a `dw.json` file at the root of your repository, that contains information with the path to your sandbox, as well as username and password. --upload-cartridge will also work with command line arguments
* There's a `cartridges` top level folder that contains your cartridge
* `name` property in `package.json` matches the name of your cartridge, or if it doesn't, there's a `packageName` property with the name of the cartridge
* If this an overlay cartridge, `package.json` contains `paths` property, that's of type `Array` and contains key/value pairs with name/path to all cartridges that will come below yours. For example, if you are creating a cartridge that will be overlayed on top of `app_storefront_base` `paths` property will look something like this: `[{ "base": "../sgmf/cartridges/app_storfront_base"}]`
* ESLint and Stylelint are dev-dependancies of your cartridge. You have all required plugins and configs installed as well.
* There's a webpack.config.js in build_tools that specifies how to compile client-side JavaScript files.
* Your `package.json` file contains `browserslist` key that specifies which browsers you are targeting, to compile SCSS files with correct prefixes. See https://github.com/ai/browserslist for more details

# Overriding Client-side SCSS and JS Files

## JS Include Path Example
The SFRA builders work differently than Under Armour Gulp builders. When overriding JS files, you will need to include the correct path to JS module(s) if the module is not in the same cartridge as the overriden file. For example if you've pulled main.js into your org_organizationid_mfra cartridge and main.js includes the `util.js` module and the `util.js` module still lives in app_storefront_base, your path would look like this where `base` is the alias defined for app_storefront_base in package.json (see example below):

`var processInclude = require('base/util');` 

## SCSS Include Path Example
SCSS paths will work similar to the JavaScript paths above. If you are importing a file that does not live in the same cartridge as the file you are working on, you will need to set the alias for the cartridge where the file exists. For example, if homePage.scss needs to include the categoryTiles.scss from app_storefront_base, it would look like this where `base` is the alias defined for app_storefront_base in package.json (see example below):

`@import "~base/components/categoryTiles";`

### Aliases from package.json:

```
"sites": [
  {
    "paths": {
      "base": "../cartridges/app_storefront_base",
      "site": "../cartridges/site_ua_core"
    },
    "packageName": "app_storefront_base"
  }
]
```

# Setting up the deployment project in Jenkins

## Note: This guide assumes that the Jenkins server has already been set up by the OSC team

### Add the new project to the Jenkins server

  On the Jenkins server, you will start at the dash board and it should look something like this:

  ![Jenkins Dashboard][jenkins-dashboard]

  [jenkins-dashboard]: images/jenkins-dashboard.png

  Please choose the "New Item" link in the top left to continue

  On the "New Item" page you will have several options to choose from. You should see a screen similar to the one below:

  ![Jenkins New Item][jenkins-new-item]

  [jenkins-new-item]: images/jenkins-new-item.png

  If this is a new server with no projects on it, please use the "Freestyle Project" option. Otherwise, if this server already has several projects setup it may be faster to use the "Copy existing Item" option to reduce setup time. This option will copy over all of the settings from the chosen project into your new project. After choosing one of these options make sure to enter a name for your project in the "Item name" field, preferably using dashes instead of spaces between words. After this click the "OK" button at the bottom of the form.

  On the next page you should see a screen similar to the one below:

  ![Jenkins Project Configuration][jenkins-project-config]

  [jenkins-project-config]: images/jenkins-project-config.png

  To continue the setup please choose either the "Multiple SCMs" option for Git repositories or the "Subversion" option for SVN repositories.

  If you are setting up Git repositories please read the following instructions. If not please skip below to the section on Subversion.

### Git Repository Setup

  To setup a Git repositories in Jenkins for use with our build script please choose the "Git" option under "Source Code Management"

  When the option has been chosen you should see a screen similar to the one below:

  ![Git Options][git-options]

  [git-options]: images/git-options.png

  Add the SSH Git url to the "Repository URL" field

  Then click the "Add" button next to the "Credentials" drop down to add a set of credentials to log into the Git server

  In the field "Branch Specifier (blank for 'any')" specify the branch name if you decide to use one other than master (e.g. */develop, */release, etc.)

### Build Options Setup

  To setup the build options to allow for deployment to the servers scroll to the bottom of the Jenkin's project settings. There is a section called "Build" where the final part of the setup will occur.

  In the Build section click th "Add build step" button and select "Invoke Ant"

  ![Invoke Ant][invoke-ant]

  [invoke-ant]: images/jenkins-invoke-ant.png

  Enter build options:

  ![Build Options][build-options]

  [build-options]: images/build-options.png

  This section will allow you to enter the build file and the properties for the build.

  In the "Targets" field, enter all Ant targets you wish to use (e.g. deploy, deploy-data, system-object-reports)

  In the "Build File" field enter the path relative to the Jenkins workspace to your deployment script. This should be similar to what is in the path in the image above.

  In the "Properties" field enter all of the properties needed for this project. For an explanation of all of the properties please refer to the [Deploy Properties](DeployProperties.md) document.

  After all of the properties have been entered click the "Apply" button at the bottom of the screen. This will save your project options.

  To test out the build, scroll to the top of the configuration and click the "Build Now" option in the upper left. If everything was setup correctly the build should complete successfully.
  
  
##Examples

Uploading individual cartridges to your sandbox/instance

1. Configure dw.json file with your username, password, activation instance (sandbox URL) and currently active code version
2. Configure the package.json file at the root directory level for the cartridges you want to upload (see "uploadCartridge")
3. Navigate to the command line tool (CMD for Windows, Terminal for OSX)
4. OSX/MAC
		"cd <path to your build tools>"   Sample -> cd /Users/testuser/git/reference-application-sfra
		"npm run uploadCartridge"  
		
##Notes

Build environment flags (i.e Verbose Logging) are controlled via the "buildEnvironment" object in the package.json file

The builders.xml Ant task includes the 'run npm install.xml' task that utilizes npm to automatically install the package.json specified node modules. The installation task may install tens of thousands of files and thus, on initial run, may take as long as ten minutes to complete. Subsequent runs are exponentially quicker as npm will only update those modules requiring an update. Additionally, the 'run npm install.xml' Ant task may be run on independently of builders.xml
