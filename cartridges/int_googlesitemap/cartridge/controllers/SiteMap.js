/**
 * Description of the Controller and the logic it provides
 *
 * @module  controllers/SiteMap
 */

'use strict';

/* Script Modules */
var app = require('app');
var guard = require('guard');


/**
 * This controller is used to render sitemap template
 */
function start() {
    app.getView().render('sitemap/sitemap');
}

/**
 * This controller is used to serve requests for Google XML site maps.
 */
function googleClassic() {
    const Pipelet = require('dw/system/Pipelet'),
        Logger = require('dw/system/Logger');
    try {
        var SendGoogleSiteMapResult = new Pipelet('SendGoogleSiteMap').execute({
            FileName: request.httpParameterMap.name.stringValue
        });
    } catch (e) {
        Logger.error('ERROR Sitemap.js: ' + e);
        response.setStatus(404);
    }
    if (SendGoogleSiteMapResult.result === PIPELET_NEXT) {
        response.setBuffered(false);
        response.setStatus(200);
    } else {
        response.setStatus(404);
    }
    return;
}

/**
 * This controller is used to get and print sitemap XML file from file system
 */
function google() {
    const HTTPClient = require('dw/net/HTTPClient'),
        URLUtils = require('dw/web/URLUtils'),
        File = require('dw/io/File'),
        Calendar = require('dw/util/Calendar'),
        StringUtils = require('dw/util/StringUtils'),
        Site = require('dw/system/Site'),
        FileReader = require('dw/io/FileReader'),
        Resource = require('dw/web/Resource');

    var httpHost = request.httpHost,
        httpClient = new HTTPClient(),
        siteMapName = request.httpParameters.name[0],
        httpParamLocale,
        siteMapURL = URLUtils.abs('SiteMap-GoogleClassic', 'name', siteMapName).toString(),
        siteMapText,
        siteMapXML,
        currentLocale = request.getLocale().toLowerCase().replace('_', '-'),
        moreFiles = true;

    currentLocale = fixLocale(request.httpHeaders['x-is-path_info'], currentLocale);
    if (request.httpParameters.hasOwnProperty('locale')) {
        currentLocale = request.httpParameters.locale[0];
    }

    httpClient.open('GET', siteMapURL, 'storefront', '3131labs');

    // Send a request for the sitemap
    httpClient.setTimeout(30000);
    httpClient.send();

    //If calling sitemap from not current locale - go to 404
    if (httpClient.statusCode == 404 && siteMapName != 'sitemap_index.xml') {
        var countryCode = null;
        try {
            countryCode = (typeof currentLocale == 'string' && currentLocale.split('-').length && currentLocale.split('-').length > 1) ? currentLocale.split('-')[1] : null;
        } catch (e) {
            Logger.error('GoogleSiteMap.ds: Cannot split locale to country code');
        }
        if (countryCode && siteMapName.indexOf('hreflang-sitemap') !== -1 && siteMapName.indexOf(currentLocale.replace(/-/, '_') + '.xml') == -1 && siteMapName.indexOf(countryCode + '.xml') == -1) {
            if (siteMapName.indexOf('co.uk.xml') == -1 && currentLocale !== 'en-gb') {
                googleClassic();
                return;
            } else if (siteMapName.indexOf('.underarmour.eu-') !== -1 && currentLocale === 'en-gb') {
                googleClassic();
                return;
            }
        } else if ((siteMapName.indexOf('product-sitemap') !== -1 || siteMapName.indexOf('others-sitemap') !== -1) && siteMapName.indexOf(currentLocale + '.xml') == -1) {
            googleClassic();
            return;
        }
    }

    //If calling sitemap_index and call was successful
    if (httpClient.statusCode == 200 && siteMapName == 'sitemap_index.xml') {
        siteMapText = httpClient.getText();
        //If locale param exists, use it instead of currentLocale;
        if (request.httpParameters.hasOwnProperty('locale')) {
            currentLocale = request.httpParameters.locale[0];
        }
        //if locale is disabled - then show error
        if (Resource.msg('locales.disabled', 'globalexperience', null).toLowerCase().replace('_', '-').split('|').indexOf(currentLocale) !== -1) {
            app.getView().render('error/generalnotfound');
            return;
        }
        if ((new RegExp(httpHost + '/en-gb').test(siteMapText))) {
            siteMapText = siteMapText.replace('en-gb', currentLocale);
        }
        //ADD CUSTOM PRODUCT XML (MULTIPLE)
        let file = new File(File.IMPEX + File.SEPARATOR + 'src' + File.SEPARATOR + 'sitemaps' + File.SEPARATOR + 'product-sitemap-' + currentLocale + '.xml'),
            lastMod = new Date(file.lastModified()),
            additionalNode = '';

        if (file.exists()) {
            lastMod = new Date(file.lastModified());
            additionalNode = '';
            lastMod = new Calendar(lastMod);
            lastMod = StringUtils.formatCalendar(lastMod, "yyyy-MM-dd'T'hh:mm:ss+00:00");
            additionalNode = '<sitemap><loc>' + request.httpProtocol + '://' + httpHost + '/product-sitemap-' + currentLocale + '.xml</loc><lastmod>' + lastMod + '</lastmod></sitemap></sitemapindex>';
            siteMapText = siteMapText.replace('</sitemapindex>', additionalNode);
        }

        //ADD CUSTOM CATEGORY XML (MULTIPLE)
        file = new File(File.IMPEX + File.SEPARATOR + 'src' + File.SEPARATOR + 'sitemaps' + File.SEPARATOR + 'others-sitemap-' + currentLocale + '.xml');
        if (file.exists()) {
            lastMod = new Date(file.lastModified());
            additionalNode = '';
            lastMod = new Calendar(lastMod);
            lastMod = StringUtils.formatCalendar(lastMod, "yyyy-MM-dd'T'hh:mm:ss+00:00");
            additionalNode = '<sitemap><loc>' + request.httpProtocol + '://' + httpHost + '/others-sitemap-' + currentLocale + '.xml</loc><lastmod>' + lastMod + '</lastmod></sitemap></sitemapindex>';
            siteMapText = siteMapText.replace('</sitemapindex>', additionalNode);
        }

        //ADD FULL HREFLANG XML (SINGLE)
        file = new File(File.IMPEX + File.SEPARATOR + 'src' + File.SEPARATOR + 'sitemaps' + File.SEPARATOR + 'hreflang-sitemap-' + request.httpHost + '-' + currentLocale.replace(/[-]/, '_') + '.xml');
        var isHreflang = false,
            EULocaleHreflangFileSuffix = '';

        if (!file.exists()) {
            file = new File(File.IMPEX + File.SEPARATOR + 'src' + File.SEPARATOR + 'sitemaps' + File.SEPARATOR + 'hreflang-sitemap-' + request.httpHost + '.xml');
        }

        if (file.exists() && !checkToSkipHreflangLocale(currentLocale)) {
            isHreflang = true;
            lastMod = new Date(file.lastModified());
            additionalNode = '';
            lastMod = new Calendar(lastMod);
            lastMod = StringUtils.formatCalendar(lastMod, "yyyy-MM-dd'T'hh:mm:ss+00:00");
            EULocaleHreflangFileSuffix = getEULocaleHreflangFileSuffix(request.httpHost, currentLocale);
            additionalNode = '<sitemap><loc>' + request.httpProtocol + '://' + httpHost + '/' + file.name + '</loc><lastmod>' + lastMod + '</lastmod></sitemap></sitemapindex>';
            siteMapText = siteMapText.replace('</sitemapindex>', additionalNode);
        }
        siteMapText = customReplace(siteMapText, httpHost, httpHost + '/' + currentLocale, isHreflang);

        //if locale param exists, add it to urls
        if (request.httpParameters.hasOwnProperty('locale')) {
            siteMapText = siteMapText.replace('.xml', '.xml?locale=' + currentLocale, 'g');
        }
    }
    //ADD CORRECT LOCALE TO NATIVE SITEMAP FILES
    else if (httpClient.statusCode == 200) {
        siteMapText = httpClient.getText();

        let siteDefaultLocale = Site.getCurrent().getDefaultLocale().toLowerCase().replace('_', '-');

        if (siteMapText.indexOf(siteDefaultLocale) != -1) {
            siteMapText = siteMapText.replace(httpHost + '/' + siteDefaultLocale, httpHost + '/' + currentLocale, 'g');
        } else {
            siteMapText = siteMapText.replace(httpHost, httpHost + '/' + currentLocale, 'g');
        }
    } else if (httpClient.statusCode != 200 && (siteMapName.indexOf('hreflang-sitemap') != -1 ||
            siteMapName.indexOf('product-sitemap') != -1 ||
            siteMapName.indexOf('others-sitemap') != -1
        )) {
        var file = new File(File.IMPEX + File.SEPARATOR + 'src' + File.SEPARATOR + 'sitemaps' + File.SEPARATOR + siteMapName),
            fileReader = new FileReader(file, 'UTF-8');

        response.setBuffered(false);
        response.setContentType('text/xml');
        var out = response.writer;
        while (true) {
            var c = fileReader.readLine();
            if (c == null) {
                break;
            }
            out.write(c);
        }
        fileReader.close();
        return;
    } else {
        googleClassic();
        return;
    }

    response.setBuffered(false);
    response.setContentType('text/xml');
    var out = response.writer;
    if (siteMapText) {
        out.println(siteMapText);
    } else {
        googleClassic();
    }
    return;
}

/**
 * Replaces all occurencies of string except last one and first one
 */
function customReplace(str, regex, replace, isHreflang) {
    var count = 0;
    var reg = new RegExp(regex, 'g');
    return str.replace(reg, function (match, offset, str) {
        count++;
        if (count == 1) {
            return match;
        }
        var follow = str.slice(offset);
        var isLast = follow.match(reg).length == 1;
        return (isLast && isHreflang) ? match : replace;
    });
}

/**
 * Gets locale from x-is-path_info
 */
function fixLocale(str, currentLocale) {
    var resLocale = currentLocale;
    if (str) {
        var arr = str.split('/');
        if (arr.length > 1) {
            var regex = '^[A-z][A-z]-[A-z][A-z]$';
            if ((new RegExp(regex).test(arr[1]))) {
                resLocale = arr[1];
            }
        }
    }
    return resLocale;
}

/**
 * Checks whether hreflang sitemap should be skipped for this locale
 */
function checkToSkipHreflangLocale(locale) {
    const CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var co = CustomObjectMgr.getCustomObject('SiteData', 'SitemapData'),
        arrSkipLocales = [],
        locale = locale.replace(/_/, '-').toLowerCase();

    var sitemapJsonObj = JSON.parse(co.custom.data);
    //check for empty CO or empty sitemap JSON data
    if (empty(co) || empty(sitemapJsonObj)) {
        return false;
    }
    try {
        arrSkipLocales = sitemapJsonObj.skipHreflangLocales;
        if (arrSkipLocales.length > 0 && arrSkipLocales.indexOf(locale) !== -1) {
            return true;
        } else {
            return false;
        }
    } catch (ex) {
        return false;
    }
}

/**
 * Gets suffix for specific EY Locale hreflang file
 */
function getEULocaleHreflangFileSuffix(host, locale) {
    const HOST_PATTERN = 'underarmour.eu';
    if (!empty(host) && !empty(locale) && (host.toLowerCase().indexOf(HOST_PATTERN) !== -1)) {
        return '-' + locale.replace(/-/, '_').toLowerCase();
    }
    return '';
}

module.exports.Start = guard.ensure(['get', 'https'], start);
module.exports.Google = guard.ensure(['get', 'https'], google);
module.exports.GoogleClassic = guard.ensure(['get', 'https'], googleClassic);
