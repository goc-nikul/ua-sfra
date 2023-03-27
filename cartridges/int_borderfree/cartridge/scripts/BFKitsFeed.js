'use strict';

var kitFeed = require('~/cartridge/scripts/jobsteps/CreateKitFeed');



var run = function () {
   kitFeed.execute();
};

exports.run = run;
