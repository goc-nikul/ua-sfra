'use strict';
var server = require('server');
var pxLogger = require('int_perimeterx/cartridge/scripts/pxLogger');

/**
 * Renders the chosen PerimeterX template
 */
server.get('Show', function (req, res, next) {
    var template = 'error/notFound';
    var data = {};
    if (session.privacy.PXObj) {
        try {
            var obj = JSON.parse(session.privacy.PXObj);
            template = obj.template;
            data = obj.templateData;
        } catch (e) {
            pxLogger.debug('Error parsing PXObj: ' + e, '');
        }
    }

    res.render(template, {
        blockData: data
    });

    next();
});

/**
 * Renders the advanced blocking response JSON object
 */
server.get('ABR', function (req, res, next) {
    var json = {};
    if (session.privacy.PXObj) {
        try {
            var obj = JSON.parse(session.privacy.PXObj);
            json = JSON.parse(obj.templateData);
        } catch (e) {
            pxLogger.debug('Error parsing PXObj in ABR: ' + e, '');
        }
    }
    res.json(json);
    next();
});

module.exports = server.exports();

