'use strict';

var server = require('server');

var ContentMgr = require('dw/content/ContentMgr');
var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

server.get('ShowSizeChart', function (req, res, next) {
    var metaPage = ContentMgr.getContent('size-chart-page');
    if (metaPage) {
        pageMetaHelper.setPageMetaData(req.pageMetaData, metaPage);
    }
    res.render('components/footer/sizeCharts');
    next();
});

server.get('GetSizeChart', function (req, res, next) {
    var Resource = require('dw/web/Resource');
    var input = req.querystring.chartName;
    var sizechart = ContentMgr.getContent(input);
    if (empty(sizechart)) {
        res.getWriter().println('<h4 class="sf-page__error">' + Resource.msg('generalerror.erroroccured', 'common', null) + '</h4>');
        return;
    }
    res.render('components/footer/sizeChartDetails', {
        standaloneSizeChart: sizechart
    });
    next();
});

module.exports = server.exports();
