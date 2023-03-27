'use strict';

/**
 * Public functions that can be called in CM fragments.
 */

/* API Includes */
let URLUtils = require('dw/web/URLUtils');
let CMUtil = require('*/cartridge/scripts/util/CMUtil');
let ProductMgr = require('dw/catalog/ProductMgr');

/**
 * Function that can be used to overwrite html title, meta description and meta keywords.
 *
 * usage: $include.metadata('title text','meta description text','comma separated meta keywords')
 *
 * @param title
 * @param description
 * @param keywords
 * @returns {string}
 */
exports.metadata = function (title, description, keywords) {
  try {
    //checks if sitegenesis meta object exists
    //if no exception continue with sitegenesis
    let meta = require('*/cartridge/scripts/meta');
    
    return metadataSitegenesis(title, description, keywords, meta);
  } catch (error) {
    
    return metadataSfra(title, description, keywords);
  }
};

function metadataSitegenesis(title, description, keywords, meta) {
  if (title) {
    meta.update({pageTitle: title});
  }
  if (description) {
    meta.update({pageDescription: description});
  }
  if (keywords) {
    meta.update({pageKeywords: keywords});
  }
  return "";
}

function metadataSfra(title, description, keywords) {
  let cmPageMeta = {};

  if (title) {
    cmPageMeta.title = title;
  }
  if (description) {
    cmPageMeta.description = description;
  }
  if (keywords) {
    cmPageMeta.keywords = keywords;
  }

  let cmMetaData = require('*/cartridge/scripts/CMMetaData');
  cmMetaData.update(cmPageMeta);
  return "";
 }

/**
 * Function that can be used to write a shop URL.
 * In contrast to the original $url.abs() method the result will be slightly rewritten in case of
 * content SEO URLs.
 *
 * Arguments same as for $url.abs().
 *
 * usage: $include.url('controller','param_name_1','param_value_1'...)
 *
 * @returns {string}
 */
exports.url = function() {
  let url = URLUtils.url.apply(URLUtils, arguments).toString();
  url = CMUtil.sanitizeContentUrl(url);
  return url;
};

/**
 * Function that can be used for remotely including a controller (any controller URL, like "Product-Show/...").
 * Arguments same as for $url.abs().
 *
 * usage: $include.controller('controller_name','param_name_1','param_value_1'...)
 *
 * @returns {string}
 */
exports.controller = function (controllerName) {
  let urlParams = [];

  for (var i = 1; i < arguments.length; i++) {
    urlParams.push("'" + arguments[i] + "'");
  }

  var velocity = require('dw/template/Velocity');
  let vtlWriter = new dw.io.StringWriter();
  velocity.render("$velocity.remoteInclude('" + controllerName + "'," + urlParams.join(',') + ")", {'velocity' : velocity}, vtlWriter);
  return vtlWriter.toString();
};

/**
 * Function that can be used for including a template (below the path coremedia/cms").
 * Parameters can be accessed in template via pdict.CurrentHttpParameterMap...
 * The template name must be given without the .isml file extension.
 *
 * usage: $include.template('template_name','param_name_1','param_value_1'...)
 *
 * @returns {string}
 */
exports.template = function() {
  let urlParams = [];
  urlParams.push("'template'");

  for (var i = 0; i < arguments.length; i++) {
    urlParams.push("'" + arguments[i] + "'");
  }

  var velocity = require('dw/template/Velocity');
  let vtlWriter = new dw.io.StringWriter();
  velocity.render("$velocity.remoteInclude('CM-Template'," + urlParams.join(',') + ")", {'velocity' : velocity}, vtlWriter);
  return vtlWriter.toString();
};

/**
 * Function that can be used to determine the availability of a product.
 * The first argument is the product id.
 * If the product is in stock 'true' is returned by default. An alternative value
 * can be passed as 2. argument.
 * If the product is not available 'false' is returned by default. An alternative value
 * can be passed as 3. argument.
 *
 * usages:  $include.availability('p4711') or
 *          $include.availability('p4711','available','not-available')
 *
 * @returns {string} the string that indicates if the product is available or not
 */
exports.availability = function () {
  if (arguments.length > 0 && arguments[0]) {
      var product = ProductMgr.getProduct(arguments[0]);
      if (product) {
          if (product.getAvailabilityModel().isInStock()) {
              if (arguments.length > 1 && typeof arguments[1] === 'string') {
                  return arguments[1];
              }
              return 'true';
          }
      }
  }
  if (arguments.length > 2 && typeof arguments[2] === 'string') {
      return arguments[2];
  }
  return 'false';
};
