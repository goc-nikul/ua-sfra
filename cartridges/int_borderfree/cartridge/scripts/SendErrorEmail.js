'use strict';


function getStaticValues() {
    const Util = require('*/cartridge/scripts/utils/Util');
    var borderfreeValues;
    try {
        borderfreeValues = Util.VALUE;
    } catch(e) {
        let exception = e;
        Util.log.error(e);
        return e;
    }
    return borderfreeValues;

}

function execute(args) {
    var borderfreeValues = getStaticValues();
    var emailLength = borderfreeValues.ERROR_EMAILS.length;
    if ((args.NonExistingAttributes.length > 0 || args.WrongAttributesType.length > 0) && emailLength > 0) {
        var cc = (emailLength > 1) ? borderfreeValues.ERROR_EMAILS.slice(1, emailLength).join(',') : null;

        var Mail = require('dw/net/Mail');
        var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
    
        var email = new Mail();
        var sub = dw.web.Resource.msg('resource.missedattributes.subject','borderfree',null);
        email.addTo(dw.system.Site.getCurrent().getCustomPreferenceValue('bfxErrorEmail')[0]);
        email.setSubject(dw.web.Resource.msg('resource.errorconfirmorder.subject','borderfree',null));
        email.setFrom(dw.system.Site.getCurrent().getCustomPreferenceValue('customerServiceEmail'));
        var context = {
            MailSubject: sub,
            NonExistingAttributes: args.NonExistingAttributes,
            WrongAttributesType: args.WrongAttributesType
        };
        email.setContent(renderTemplateHelper.getRenderedHtml(context, "mail/borderfree/missedattributes"), 'text/html', 'UTF-8');
        if (cc != null) {
            email.setCc(cc);
        }
        email.send();
    }

}

exports.execute = execute;
