var Status = require('dw/system/Status');
var Logger = require('dw/system/Logger');

/**
 * @returns {Array} - array of page meta tags
 */
function getPageMetaTags() {
    try {
        var Site = require('dw/system/Site');
        var metaTags = Site.getCurrent().getPageMetaTags();
        const tagObjects = [];
        metaTags.forEach(function (tag) {
            tagObjects.push({
                ID: tag.ID,
                name: tag.name,
                property: tag.property,
                title: tag.title,
                content: tag.content
            });
        });
        return tagObjects;
    } catch (error) {
        Logger.error(JSON.stringify(error));
    }
    return [];
}

exports.modifyGETResponse = function (scriptContent, doc) {
    const pageMetaTags = getPageMetaTags();
    /* eslint-disable no-param-reassign */
    doc.c_pageMetaTags = pageMetaTags;
    return new Status(Status.OK);
};
