'use strict';

/**
 * This module offers utility methods for use within the CoreMedia LiveContext integration.
 */

/* API Includes */
let Logger = dw.system.Logger.getLogger('coremedia.context');

exports.getPreviewContext = function (request) {
  let context = {};

  try {
    let previewDate = session.custom.cmPreviewDate;
    if (previewDate) {
      // preview date needs to be converted
      // 21-07-2014 17:57 Europe/Berlin -> 2014-07-21 17:57:00.000
      let previewDateArgs = previewDate.split(" ");
      let dateArgs = previewDateArgs[0].split("-");
      let dateHeaderValue = dateArgs[2] + "-" + dateArgs[1] + "-" + dateArgs[0];
      let timeHeaderValue = previewDateArgs[1] + ":00.000";
      context.timestamp = dateHeaderValue + " " + timeHeaderValue;
      context.timezone = previewDateArgs[2];
    }
  } catch (e) {
    Logger.error("Unable to read preview date parameters");
    Logger.error(e);
  }

  return context;
};

exports.getPreviewParams = function (request) {
  let context = {};

  // Add parameters for preview date
  try {
    let previewDate = session.custom.cmPreviewDate;
    if (previewDate) {
      // preview date needs to be converted
      // 21-07-2014 17:57 Europe/Berlin -> 2014-07-21 17:57:00.000
      let previewDateArgs = previewDate.split(" ");
      let dateArgs = previewDateArgs[0].split("-");
      let dateHeaderValue = dateArgs[2] + "-" + dateArgs[1] + "-" + dateArgs[0];
      let timeHeaderValue = previewDateArgs[1] + ":00.000";
      context.timestamp = encodeURI(dateHeaderValue + " " + timeHeaderValue);
      context.timezone = encodeURI(previewDateArgs[2]);
    }
  } catch (e) {
    Logger.error("Unable to read preview date parameters");
    Logger.error(e);
  }

  // Add parameters for personalization testing
  try {
    let p13nTest = session.custom.cmP13nTest;
    let p13nTestcontext = session.custom.cmP13nTestcontext;
    if (p13nTest && p13nTestcontext) {
      context.p13n_test = p13nTest;
      context.p13n_testcontext = p13nTestcontext;
    }
  } catch (e) {
    Logger.error("Unable to read perso parameters");
    Logger.error(e);
  }

  // Developer mode
  try {
    let userVariant = session.custom.cmUserVariant;
    if (userVariant) {
      context.userVariant = userVariant;
    }
  } catch (e) {
    Logger.error("Unable to read developer mode parameter");
    Logger.error(e);
  }

  context.preview = "true";

  return context;
};

exports.getUserContext = function (request) {
  let context = {};

  // we know already the customer groups of an user if any. So we augment the context with the customer group ids.
  try {
    if (request.session && request.session.customer && request.session.customer.customerGroups) {
      let membergroupids = [];
      let iter = request.session.customer.customerGroups.iterator();
      while (iter && iter.hasNext()) {
        let membergroupid = iter.next().ID;
        membergroupids.push(membergroupid)
        // Logger.debug("### TRACE Membergroup added: " + membergroupid);
      }
      context.membergroupids = membergroupids.join(',');
    }
  } catch (e) {
    Logger.error("Unable to read customer groups");
    Logger.error(e);
  }

  return context;
};

exports.getUserParams = function (request) {
  let context = {};
  if (session.custom.cmPreviewDate) {
    context.previewDate = escape(session.custom.cmPreviewDate);
  }
  return context;
};
