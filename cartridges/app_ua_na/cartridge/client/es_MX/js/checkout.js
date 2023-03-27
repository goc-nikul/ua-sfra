'use strict';

var processInclude = require('base/util');
var adyenCheckout = require('adyen/adyenCheckout');

$(document).ready(function () {
    processInclude(require('./checkout/checkout'));
    processInclude(require('org/checkout/instore'));
    processInclude(require('org/checkout/holdAtLocation'));
    var error = new RegExp('[?&]'.concat(encodeURIComponent(name), '=([^&]*)')).exec(location.search // eslint-disable-line no-restricted-globals
    );
    var paymentStage = new RegExp('[?&]stage=payment([^&]*)').exec(location.search // eslint-disable-line no-restricted-globals
    );
    var isPayPal = new RegExp('[?&]isPayPal=true([^&]*)').exec(location.search // eslint-disable-line no-restricted-globals
    );

    if (error || paymentStage || isPayPal) {
        if (error) {
            $('.error-message').show();
            $('.error-message-text').text(decodeURIComponent(error[1]));
        }
        adyenCheckout.renderGenericComponent();
    }
    if ($('div[data-is-legendsoft]').data('is-legendsoft')) processInclude(require('legendsoft/checkout/suggestions').findSuggestionsFromPostalCode);
    if ($('.js-employee-terms-conditions').length > 0) {
        if ($('.js-employee-terms-conditions').is(':checked')) {
            $('.place-order').removeAttr('disabled');
        } else {
            $('.place-order').attr('disabled', 'disabled');
        }
    }

    if ($('.js-vip-click').length > 0) {
        if ($('.js-vip-click').is(':checked')) {
            $('.place-order').removeAttr('disabled');
            $('.klarna-place-order').removeAttr('disabled');
        } else {
            $('.place-order').attr('disabled', 'disabled');
            $('.klarna-place-order').attr('disabled', 'disabled');
        }
    }

    if ($('.customer-phonenumber').length > 0) {
        $('.validatePhoneField').trigger('keyup');
    }
    $(document).on('blur', '#dob', function () {
        var $this = $(this);
        var dateValue = $(this).val();
        // eslint-disable-next-line no-useless-escape
        var regEx = /^(0[1-9]|[12][0-9]|3[01])[\/](0[1-9]|1[012])[\/](19|20)\d\d$/;
        var errorMsg;
        if (!dateValue) {
            errorMsg = $this.data('missing-error');
        } else if (dateValue.length < 10 || !(regEx.test(dateValue.trim()))) {
            errorMsg = $this.data('pattern-mismatch');
        } else {
            const dateOfBirth = new Date(dateValue.split('/').reverse().join('-'));
            var date13YrsAgo = new Date();
            date13YrsAgo.setFullYear(date13YrsAgo.getFullYear() - 13);
            if (!(dateOfBirth <= date13YrsAgo)) {
                errorMsg = $this.data('under-age');
            }
        }
        if (errorMsg) {
            $this.addClass('is-invalid');
            $this.parents('.form-group').addClass('error-field');
            $this.parents('.form-group').find('.invalid-feedback').text(errorMsg);
        }
    });

    // RFC fields toggle
    var $rfcWrapper = $('#rfc-cfdi-details');
    if ($rfcWrapper.find('.rfc-value').text()) {
        $('#taxBillingInfo').prop('checked', true);
        $('.tax-billing').show();
        $('#taxBillingInfo').on('click', function () {
            if (($('#taxBillingInfo').is(':checked'))) {
                $('#taxBillingInfo').val(true);
                $(this).siblings('.tax-billing').show();
            } else {
                $('.tax-billing').hide();
                $('#taxBillingInfo').val(false);
            }
        });
    } else {
        $('.tax-billing').hide();
        $('#taxBillingInfo').on('click', function () {
            if (!($('#taxBillingInfo').is(':checked'))) {
                $(this).siblings('.tax-billing').hide();
                $('#taxBillingInfo').val(false);
                $('.rfcValue').val('');
                $('.social-razonValue').val('');
            } else {
                $('.tax-billing').show();
                $('#taxBillingInfo').val(true);
            }
        });
    }

    $('#usoCFDI').on('change', function () {
        var $regimenFiscal = $('#regimenFiscal');
        var $usoCFDI = $('#usoCFDI');
        var cfdiVal = $usoCFDI.val();
        var rfcLength = $('#rfc').val().length;
        var rfcType;
        if (rfcLength === 13) {
            rfcType = 'person';
        } else if (rfcLength === 12) {
            rfcType = 'company';
        }

        if (!rfcType || !cfdiVal) {
            // Drop regimenFiscal & hide all options
            $regimenFiscal.find('option').hide();
            $regimenFiscal[0].selectedIndex = 0;
            return;
        }

        var regimenFiscalMapJSON = $regimenFiscal.data('regimen-fiscal-map');
        var cfdiMapJSON = $usoCFDI.data('cfdi-map');
        // Filter regimenFiscal options, drop if selected one filtered out
        $regimenFiscal.find('option').each(function (i, option) {
            var optionVal = option.value;
            if (optionVal && optionVal in regimenFiscalMapJSON && regimenFiscalMapJSON[optionVal] && regimenFiscalMapJSON[optionVal][rfcType]
                && cfdiVal in cfdiMapJSON && 'regimenFiscal' in cfdiMapJSON[cfdiVal] && cfdiMapJSON[cfdiVal].regimenFiscal.includes(+optionVal)) {
                $(this).show();
            } else {
                if (option.selected) {
                    $regimenFiscal[0].selectedIndex = 0;
                }
                $(this).hide();
            }
        });
    });

    $('#rfc').on('change', function () {
        var $usoCFDI = $('#usoCFDI');
        var rfcLength = $('#rfc').val().length;
        var rfcType;
        if (rfcLength === 13) {
            rfcType = 'person';
        } else if (rfcLength === 12) {
            rfcType = 'company';
        }

        if (!rfcType) {
            // Drop usoCFDI & hide all options
            $usoCFDI.find('option').hide();
            $usoCFDI[0].selectedIndex = 0;
            $('#usoCFDI').trigger('change');
            return;
        }

        var cfdiMapJSON = $usoCFDI.data('cfdi-map');
        // Filter usoCFDI options, drop if selected one filtered out
        $usoCFDI.find('option').each(function (i, option) {
            var optionVal = option.value;
            if (optionVal && optionVal in cfdiMapJSON && cfdiMapJSON[optionVal] && cfdiMapJSON[optionVal][rfcType]) {
                $(this).show();
            } else {
                if (option.selected) {
                    $usoCFDI[0].selectedIndex = 0;
                }
                $(this).hide();
            }
        });

        $('#usoCFDI').trigger('change');
    });

    // Initial trigger for filtering out options based on preselected (previously saved) RFC
    $('#rfc').trigger('change');

    // Update RFC & RazonSocial on RFC checkbox checked
    $('#taxBillingInfo').on('click', function () {
        if (($('#taxBillingInfo').is(':checked'))) {
            var billingRFC = '';
            var billingRazonSocial = '';
            var $selectedBillingOption = $('.billing-address-section.default-address .billing-address-option').first();
            if ($selectedBillingOption.length) {
                billingRFC = $selectedBillingOption.data('rfc');
                billingRazonSocial = $selectedBillingOption.data('razonsocial');
            }
            if (billingRFC) {
                $('#rfc').val(billingRFC).trigger('change');
            }
            if (billingRazonSocial) {
                $('#social-razon').val(billingRazonSocial);
            }
        }
    });
});
$('.payment-options .nav-link').click(function () {
    let methodID = $(this).parent().attr('data-method-id');
    if (methodID) {
        $('#selectedPaymentOption').val(methodID);
    }
});
