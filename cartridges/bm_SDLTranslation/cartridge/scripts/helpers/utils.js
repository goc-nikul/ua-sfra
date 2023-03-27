var Mail = require('dw/net/Mail');
var Site = require('dw/system/Site');
var ArrayList = require('dw/util/ArrayList');
var HashMap = require('dw/util/HashMap');
var Template = require('dw/util/Template');
var Logger = require('dw/system/Logger').getLogger('SDL_translation', '');

/**
 * getRenderedHtml - Render email
 * @param {Object} templateContext - Email pdict data
 * @param {string} templateName - email template
 * @returns {string} - render email
 */
function getRenderedHtml(templateContext, templateName) {
    var context = new HashMap();

    Object.keys(templateContext).forEach(function (key) {
        context.put(key, templateContext[key]);
    });

    var template = new Template(templateName);
    return template.render(context).text;
}

/**
 * send - send email
 * @param {Object} emailObj - email Object
 * @returns {Object} email send status
 */
function send(emailObj) {
    var email = new Mail();
    email.addTo(emailObj.to);
    email.setSubject(emailObj.subject);
    email.setFrom(emailObj.from);
    email.setContent(getRenderedHtml(emailObj.context, emailObj.template), 'text/html', 'UTF-8');
    return email.send();
}

/**
 * sendErrorEmail - Send Error email
 * @param {Object} error - error object
 * @param {Object} context - email context
 */
function sendErrorEmail(error, context) {
    // Get Email From and To
    var emailFrom = 'sdlEmailFrom' in Site.current.preferences.custom && Site.current.preferences.custom.sdlEmailFrom ? Site.current.preferences.custom.sdlEmailFrom : null;
    // If No Email From is Set, return.
    if (!emailFrom) {
        Logger.error('Email From is not set to send error e-mail. Please configure it in the Site Preference');
        return;
    }
    var emailTo = 'sdlEmailTo' in Site.current.preferences.custom && Site.current.preferences.custom.sdlEmailTo ? new ArrayList(Site.current.preferences.custom.sdlEmailTo) : null;

    // If No Email From is Set, return.
    if (!emailTo) {
        Logger.error('Email To is not set to send error e-mail. Please configure it in the Site Preference');
        return;
    }
    var emailObj = {
        to: emailTo,
        from: emailFrom,
        subject: 'Error Occurred in SDL!',
        context: { error: error.message, context: context },
        template: 'sdl/email/sdlErrorEmail'
    };
    var sendStatus = send(emailObj);
    if (sendStatus.code !== 'OK') {
        Logger.error('SDL was unable to send an email. Please contact administrator');
    }
}

module.exports = {
    sendErrorEmail: sendErrorEmail
};
