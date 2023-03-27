'use strict';

const path = require('path');
const del = require('del');

const packageFile = require(path.join(process.cwd(), 'package.json'));

module.exports = () => {
    // Delete compiled JS and Css assets
    packageFile.sites.forEach(site =>
        site.cartridges.forEach(cartridge => {
            if (cartridge.alias === 'site') {
                del.sync(path.join(process.cwd(), 'cartridges', cartridge.name, 'cartridge/static/*/+(js|css)'));
                console.log(`Deleted compiled Js and Css files for site "${cartridge.name}"`);
            }
        })
    );

    // Delete compiled font files
    del.sync(path.join(process.cwd(), 'cartridges/app_storefront_base/cartridge/static/default/fonts'));
    console.log('Deleted fonts');

    // Delete caches
    del.sync(path.join(process.cwd(), 'build_tools/.cache'));
    del.sync([path.join(process.cwd(), 'node_modules/.cache')]);
    console.log('Deleted caches');

    console.log(`
    You can also delete any additional, non-tracked files by running the git commmand:
    "git clean -d -f"
    Add the flag "--dry-run" to the command to view which files will be deleted beforehand.`);
};
