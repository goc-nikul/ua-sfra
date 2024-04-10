/* eslint-disable no-undef */

'use strict';

/**
 * Returns default name of current country, i.e. for Netherlands it will return Netherlands instead of Nederlands in Dutch locale.
 * @returns {countryDisplayName}: string
 */
function getDefaultCountryDisplayName() {
    const HashMap = require('dw/util/HashMap');
    const Template = require('dw/util/Template');

    const currLocale = request.getLocale();
    const context = new HashMap();
    const countryCode = require('dw/util/Locale').getLocale(currLocale).country;
    context.put('countryCode', countryCode);

    request.setLocale('en');
    const countryDisplayName = new Template('common/defaultCountryRenderer').render(context).text;
    request.setLocale(currLocale);

    return countryDisplayName;
}

/**
 * Returns the localized form values for FAQ Contact Us Page
 * @returns {resources}: Object containing the localized form values
 */
function getFAQResources() {
    const Resource = require('dw/web/Resource');
    const resources = {
        faqGeneral: Resource.msg('contactus.faq.general', 'contactUsFAQ', null),
        faqName: Resource.msg('contactus.faq.name', 'contactUsFAQ', null),
        faqEmail: Resource.msg('contactus.faq.email', 'contactUsFAQ', null),
        faqEmailConfirm: Resource.msg('contactus.faq.email.confirm', 'contactUsFAQ', null),
        faqTopic: Resource.msg('contactus.faq.topic', 'contactUsFAQ', null),
        faqSelectOne: Resource.msg('contactus.faq.select.one', 'contactUsFAQ', null),
        faqPrivacy: Resource.msg('contactus.faq.privacy', 'contactUsFAQ', null),
        faqOrderStatus: Resource.msg('contactus.faq.order.status', 'contactUsFAQ', null),
        faqProductInquiry: Resource.msg('contactus.faq.product.inquiry', 'contactUsFAQ', null),
        faqReturns: Resource.msg('contactus.faq.returns', 'contactUsFAQ', null),
        faqOther: Resource.msg('contactus.faq.other', 'contactUsFAQ', null),
        faqSubCat: Resource.msg('contactus.faq.sub.cat', 'contactUsFAQ', null),
        faqSubCatTitle: Resource.msg('contactus.faq.sub.cat.title', 'contactUsFAQ', null),
        faqPleaseSelect: Resource.msg('contactus.faq.please.select', 'contactUsFAQ', null),
        faqOrderNumber: Resource.msg('contactus.faq.order.number', 'contactUsFAQ', null),
        faqOrderNumberTitle: Resource.msg('contactus.faq.order.number.title', 'contactUsFAQ', null),
        faqDescription: Resource.msg('contactus.faq.description', 'contactUsFAQ', null),
        faqSendNote: Resource.msg('contactus.faq.send.note', 'contactUsFAQ', null),
        faqErrorEmailMatch: Resource.msg('contactus.faq.error.email.match', 'contactUsFAQ', null),
        faqInvalidEmail: Resource.msg('contactus.faq.invalid.email', 'contactUsFAQ', null),
        faqErrorSelectTopic: Resource.msg('contactus.faq.error.select.topic', 'contactUsFAQ', null),
        faqUnsubscribeEmail: Resource.msg('contactus.faq.unsubscribe.email', 'contactUsFAQ', null),
        faqAccountDeletion: Resource.msg('contactus.faq.account.deletion', 'contactUsFAQ', null),
        faqCancel: Resource.msg('contactus.faq.cancel', 'contactUsFAQ', null),
        faqStatus: Resource.msg('contactus.faq.status', 'contactUsFAQ', null),
        faqGeneralFeedback: Resource.msg('contactus.faq.general.feedback', 'contactUsFAQ', null),
        faqAvailability: Resource.msg('contactus.faq.availability', 'contactUsFAQ', null),
        faqProductDna: Resource.msg('contactus.faq.product.dna', 'contactUsFAQ', null),
        faqRefundStatus: Resource.msg('contactus.faq.refund.status', 'contactUsFAQ', null),
        faqUaLabel: Resource.msg('contactus.faq.ua.label', 'contactUsFAQ', null),
        invalidField: Resource.msg('error.message.required', 'forms', null),
        faqInquiryType: Resource.msg('contactus.faq.inquiry.type', 'contactUsFAQ', null),
        faqInquiryTypeOrderStatus: Resource.msg('contactus.faq.inquiry.type.order.status', 'contactUsFAQ', null),
        faqInquiryTypePaymentInquiry: Resource.msg('contactus.faq.inquiry.type.payment.inquiry', 'contactUsFAQ', null),
        faqInquiryTypeRefund: Resource.msg('contactus.faq.inquiry.type.refunds', 'contactUsFAQ', null),
        faqInquiryTypeProductInqury: Resource.msg('contactus.faq.inquiry.type.product.inquiry', 'contactUsFAQ', null),
        faqInquiryTypeAccountIssue: Resource.msg('contactus.faq.inquiry.type.account.issue', 'contactUsFAQ', null),
        faqInquiryTypeOther: Resource.msg('contactus.faq.inquiry.type.other', 'contactUsFAQ', null),
        faqPhone: Resource.msg('contactus.faq.phone', 'contactUsFAQ', null),
        faqConsent: Resource.msg('contactus.faq.consent', 'contactUsFAQ', null),
        faqInvalidInput: Resource.msg('contactus.faq.nonlatincharacters.error', 'contactUsFAQ', null)

    };

    return resources;
}

module.exports = {
    getDefaultCountryDisplayName: getDefaultCountryDisplayName,
    getFAQResources: getFAQResources
};
