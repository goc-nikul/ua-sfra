'use strict';

var server = require('server');
var verificationProvider = require('*/cartridge/modules/providers').get('AddressVerification');
var ObjectsHelper = require('~/cartridge/scripts/helpers/ObjectsHelper');

var resultsMap = {
    success: [
        'Verified',
        'VerifiedStreet',
        'VerifiedPlace'
    ],
    interaction: [
        'InteractionRequired'
    ],
    picklist: [
        'StreetPartial',
        'PremisesPartial',
        'Multiple'
    ],
    warning: [
        'None',
        'Null'
    ]
};

var getTemplateBySearchResults = function (results) {
    var resultTemplate = 'warning';
    Object.keys(resultsMap).forEach(function (template) {
        resultsMap[template].forEach(function (status) {
            if (status === results.status) {
                resultTemplate = template;
            }
        });
    });
    return resultTemplate;
};

server.post('Get', function (req, res, next) {
    var moniker = req.form.moniker;
    var results = verificationProvider.get(moniker);

    res.json(results);
    return next();
});

server.post('Verify', function (req, res, next) {
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
    var results = verificationProvider.search({
        address1: req.form.address1,
        address2: req.form.address2,
        city: req.form.city,
        state: req.form.state,
        zipCode: req.form.zipCode
    });
    ObjectsHelper.setProperty(results, 'type', getTemplateBySearchResults(results));
    var templateName = 'account/addressVerification/results/' + results.type;
    var templateContent = renderTemplateHelper.getRenderedHtml(results, templateName);
    res.json({
        renderedTemplate: templateContent,
        data: results
    });
    return next();
});

server.post('Update', function (req, res, next) {
    var moniker = req.form.moniker;
    var refinement = req.form.refinement;

    var results = verificationProvider.update(
        moniker,
        refinement
    );

    res.json(results);
    return next();
});

server.post('TypeDownSearch', function (req, res, next) {
    var query = req.form.query;

    var results = verificationProvider.typeDownSearch(
        query
    );

    res.json(results);
    return next();
});

module.exports = server.exports();
