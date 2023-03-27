'use strict';

/**
 * The onRequest hook is called with every top-level request in a site. This happens both for requests to cached and non-cached pages.
 * For performance reasons the hook function should be kept short.
 *
 * @module  request/OnRequest
 */

let CMUtil = require('*/cartridge/scripts/util/CMUtil');

/**
 * The onRequest hook function.
 */
exports.onRequest = function () {
  // Init context
  CMUtil.initSessionContext();
  // Store the preview flag as a custom attribute in the current session
  session.custom.cmPreview = CMUtil.isPreviewRequest(request);
};
