'use strict';

/**
 * Middleware for redirecting the user based on geoLocation. Determine if request locale one of en,de,fr,nl and create new redirect location to en-gb, fr-fr, de-de, nl-nl
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next call in the middleware chain
 * @returns {void}
 */
function redirect(req, res, next) {
    var URLUtilsHelper = require('int_customfeeds/cartridge/scripts/util/URLUtilsHelper.ds');
    var requestDomain = req.host;
    var currentPath = req.httpHeaders['x-is-path_info'];
    var requestLocaleId = URLUtilsHelper.getLocalePath(currentPath);
    var newPath = '';
    var location = null;
    var httpProtocol = req.https ? 'https://' : 'http://';
    var originalUrl = httpProtocol + requestDomain + currentPath;
    originalUrl = (originalUrl.lastIndexOf('/') === originalUrl.length - 1) ? originalUrl : originalUrl + '/';

    requestLocaleId = empty(requestLocaleId) || requestLocaleId === requestDomain ? req.locale.id : requestLocaleId;
    if (URLUtilsHelper.isDomainLocaleRelate(requestDomain, requestLocaleId)) {
        var availableDomains = URLUtilsHelper.getAvailableDomainsForLocale(requestLocaleId);
        if (empty(availableDomains[requestDomain])) {
            var oldLocation = requestDomain + '/' + URLUtilsHelper.getLocaleLangByLocaleID(requestLocaleId);
            var oldUrl = httpProtocol + requestDomain + currentPath;
            var newLocation = URLUtilsHelper.getHostForLocale(requestLocaleId);
            location = oldUrl.replace(oldLocation, newLocation) + '/';
        } else if (URLUtilsHelper.getLocalePath(currentPath) === requestDomain || currentPath === '/') {
            newPath = '/' + URLUtilsHelper.getLocaleLangByLocaleID(requestLocaleId);
            location = URLUtilsHelper.finishURL(req, newPath);
        } else {
            location = null;
        }
        if (location && originalUrl !== location) {
            res.redirect(location);
        }
        return next();
    }

    if (requestLocaleId === 'default') {
        var defLocaleId = URLUtilsHelper.getDefaultLocale();
        if (!empty(defLocaleId)) {
            newPath = currentPath.replace('/default', '/' + URLUtilsHelper.getLocaleLangByLocaleID(defLocaleId));
            location = URLUtilsHelper.finishURL(req, newPath);
            res.redirect(location);
            return next();
        }
    }

    var requestLang = URLUtilsHelper.getRequestLang(requestLocaleId);
    var domainsForLocale = URLUtilsHelper.getAvailableDomainsForLocale(requestLocaleId);
    location = '';
    if (!empty(domainsForLocale) && Object.keys(domainsForLocale).length !== 0) {
        Object.keys(domainsForLocale).forEach(function (domain) {
            newPath = currentPath.replace('/' + URLUtilsHelper.getLocaleLangByLocaleID(requestLocaleId), '/' + URLUtilsHelper.getLocaleLangByLocaleID(domainsForLocale[domain]));
            location = URLUtilsHelper.finishURL(req, newPath);
            location = location.replace(requestDomain, domain);
            return;
        });
    } else {
        var domainsForLang = URLUtilsHelper.getAvailableDomainsForLang(requestLang);
        if (!empty(domainsForLang) && Object.keys(domainsForLang).length !== 0) {
            if (requestDomain in domainsForLang && !empty(domainsForLang[requestDomain])) {
                newPath = currentPath.replace('/' + URLUtilsHelper.getLocaleLangByLocaleID(requestLocaleId), '/' + URLUtilsHelper.getLocaleLangByLocaleID(domainsForLang[requestDomain]));
                location = URLUtilsHelper.finishURL(req, newPath);
            } else {
                Object.keys(domainsForLang).forEach(function (domain) {
                    newPath = currentPath.replace('/' + URLUtilsHelper.getLocaleLangByLocaleID(requestLocaleId), '/' + URLUtilsHelper.getLocaleLangByLocaleID(domainsForLang[domain]));
                    location = URLUtilsHelper.finishURL(req, newPath);
                    location = location.replace(requestDomain, domain);
                    return;
                });
            }
        }
    }

    if (location && originalUrl !== location) {
        res.redirect(location);
    }

    return next();
}

module.exports = {
    redirect: redirect
};
