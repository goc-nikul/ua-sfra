'use strict';

var customFeed = require('~/cartridge/scripts/jobsteps/CreateCustomFeed');



var run = function () {
   customFeed.execute();
};

exports.run = run;
