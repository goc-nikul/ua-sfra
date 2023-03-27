'use strict';

var catalogFeed = require('~/cartridge/scripts/jobsteps/CreateCatalogFeed');



var run = function () {
   catalogFeed.execute();
};

exports.run = run;
