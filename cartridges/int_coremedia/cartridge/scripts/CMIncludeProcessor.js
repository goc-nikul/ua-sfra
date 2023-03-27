'use strict';

/**
 * This module removes the no longer supported mode "cm comment based include mechanism".
 * All backward compatiblity function can overwrite this module by prepending in the cartridge path.
 */

/* API Includes */
let Logger = dw.system.Logger.getLogger('coremedia.parser');

exports.processPlaceholders = function(fragmentMarkup) {
  // Logger.debug("### CM TRACE CMIncludeProcessor is no longer supported.");
  return fragmentMarkup;
};
