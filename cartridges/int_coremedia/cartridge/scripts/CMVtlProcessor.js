'use strict';

/**
 * This module parses legacy placeholders and processes them with the velocity engine
 */

/* API Includes */
let URLUtils = require('dw/web/URLUtils');
let Velocity = require('dw/template/Velocity');
let CMInclude = require('*/cartridge/scripts/CMInclude');
let Logger = dw.system.Logger.getLogger('coremedia.parser');

/* Constants */
// Begin Pattern of VTL comments
const VTL_BEGIN_PATTERN = /<!--\s*VTL\s*|&lt;!--\s*VTL\s*/g;
// End Pattern of VTL comments
const VTL_END_PATTERN = /\s*VTL\s*-->|\s*VTL\s*--&gt;/g;

/**
 * Parse and replace placeholders in the given fragment markup.
 * The unparsed markup contains velocity function data that is parsed to extract data and call the velocity engine.
 *
 * @param fragmentMarkup unparsed fragment markup
 *
 * @returns {string} parsed fragment markup
 */
exports.processPlaceholders = function(fragmentMarkup) {
  // Logger.debug("### TRACE CM: parse fragment placeholders: " + fragmentMarkup);
  let result = "";

  if (fragmentMarkup.search(VTL_BEGIN_PATTERN) >= 0) {
    // Logger.debug("### TRACE CM: VTL COMMENT START");
    // Resolve <!--VTL ... VTL--> placeholders and resolve links
    let chunks = fragmentMarkup.split(VTL_BEGIN_PATTERN);
    let firstChunk = true;
    for (let i = 0; i < chunks.length; i++) {
      let chunk = chunks[i];
      let innerChunks = chunk.split(VTL_END_PATTERN);
      if (innerChunks.length === 1) {
        if (firstChunk) { // if its the very first chunk it has no VTL snippet - that's ok
          firstChunk = false;
        } else {
          Logger.warn("No matching end delimiter ('VTL-->') found for start delimiter ('<!--VTL'). VTL sections must not be nested!");
        }
        result += chunk;

      } else if (innerChunks.length === 2) {
        // the first inner chunk must be the wanted vtl script that needs to be processed
        result += renderVelocity(decodeHtml(innerChunks[0]));
        // the second inner chunk is the following text till the next begin delimiter that needs to be simply added
        result += innerChunks[1];
      } else {
        Logger.warn("Multiple consecutive end delimiter ('VTL-->') found. VTL sections must not be nested!");
        result += chunk;
      }
    }

  } else {
    // nothing to do
    result = fragmentMarkup;
  }

  return result;
};

function renderVelocity(script) {
  let outputWriter = new dw.io.StringWriter();
  let scriptExt = "#set( $D = '$' )\n";
  scriptExt += "#set( $H = '#' )\n";
  scriptExt += script;
  // Logger.debug("### TRACE CM: renderVelocity is called, script: " + scriptExt);
  Velocity.render(scriptExt, {url: URLUtils, include: CMInclude}, outputWriter);
  return outputWriter.toString();
}

function decodeHtml(str) {
  return str.replace(/&#39;/g, "'");
}
