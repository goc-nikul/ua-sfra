'use strict';

var server = require('server');

server.extend(module.superModule);

server.append('RefreshVariationCache', function (req, res, next) {
    var viewData = res.getViewData();
    var params = req.querystring;

    if (params.attribute === 'color') {
        res.render('product/components/variationAttributeColorNoCache', {
            product: viewData.product,
            variatAttrLength: viewData.variatAttrLength,
            experienceType: viewData.experienceType,
            division: viewData.division
        });
    } else {
        res.render('product/components/variationAttributeNoCache', {
            product: viewData.product,
            variatAttrLength: viewData.variatAttrLength,
            experienceType: viewData.experienceType,
            division: viewData.division
        });
    }
    next();
});
module.exports = server.exports();
