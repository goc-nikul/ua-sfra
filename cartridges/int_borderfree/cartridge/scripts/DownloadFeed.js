'use strict';

var downloadFeed = require('~/cartridge/scripts/jobsteps/DownloadFeedToImpex');



var run = function () {
   downloadFeed.execute();
};

exports.run = run;
