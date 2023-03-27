'use strict';

/**
 * Function to clear the restriction when field is empty or no response
*/
function updateFieldsBackToNormal() {
    $('.ls-city:visible, .ls-locality:visible, .ls-state:visible, .colonyField:visible').val('');
    $('.ls-city:visible, .ls-locality:visible, .ls-state:visible, .colonyField:visible').removeClass('restrict-mouse-action');
    $('label.restrict-mouse-action').removeClass('restrict-mouse-action');
    var nameAttr;
    if ($('.b-account-address_book').length > 1) {
        nameAttr = 'dwfrm_internationalAddress_colony';
    } else if ($('#checkout-main').data('checkout-stage') === 'shipping') {
        nameAttr = 'dwfrm_shipping_shippingAddress_addressFields_colony';
    } else {
        nameAttr = 'dwfrm_billing_addressFields_colony';
    }

    var inputField = `<input type="text" class="b-input_row-input form-control colonyField" id="colony" name="${nameAttr}" required="" aria-required="true" value="" maxlength="25" data-pattern-invalid="Carácter no válido" data-missing-error="Completa este campo." autocomplete="family-name">`;
    $('.colonyField:visible').closest('.form-group').removeClass('b-colony_select-field b-colony').addClass('b-colony_text-field');
    $('.colonyField:visible').replaceWith($(inputField));
}

/**
 * Event to get suggestions from postal code
 */
function findSuggestionsFromPostalCode() {
    $('body').on('change', 'input[name$=\'_postalCode\']', function () {
        var url = $('div[data-legendsoft-url]').data('legendsoft-url');
        if (!url) return;
        url = url + '?postalcode=' + $(this).val();
        var $form = $(this).closest('form');
        if ($(this).val() !== '') {
            $.spinner().start();
            $.ajax({
                url: url,
                type: 'get',
                success: function (data) {
                    if (data && !data.error) {
                        var $formState = $form.find('.colonyField');
                        var $formStateError = $formState.data('missing-error');
                        var arrayHtml = '';
                        var selectID = '';
                        var selectName = '';
                        var selectBox;
                        var $lsCity = $('.ls-city:visible');
                        var $lsLocality = $('.ls-locality:visible');
                        var $lsState = $('.ls-state:visible');
                        var inputField;
                        if (data.cities != '' && data.cities != null) { // eslint-disable-line
                            $form.find('.ls-city').val(data.cities);
                            $lsCity.addClass('restrict-mouse-action');
                            $lsCity.siblings('label').addClass('restrict-mouse-action');
                        }
                        if (data.towns != '' && data.towns != null) { // eslint-disable-line
                            $form.find('.ls-locality').val(data.towns);
                            $lsLocality.addClass('restrict-mouse-action');
                            $lsLocality.siblings('label').addClass('restrict-mouse-action');
                        }
                        if (data.states != '' && data.states != null) { // eslint-disable-line
                            $form.find('[name$=_states_stateCode]').val(data.states).trigger('change');
                            $lsState.addClass('restrict-mouse-action');
                            $lsState.siblings('label').addClass('restrict-mouse-action');
                        }

                        $formState.closest('.form-group').removeClass('error-field').find('.invalid-feedback').empty();
                        $formState.removeClass('is-invalid');
                        var $colonyField = $form.find('.colonyField');
                        selectID = 'id="' + $colonyField.attr('id') + '"';
                        selectName = 'name="' + $colonyField.attr('name') + '"';
                        inputField = $('<input required class="form-control b-input_row-input colonyField" type="text" aria-required="true" ' + selectID + ' ' + selectName + ' />');
                        if (data.colonies.length > 1) {
                            arrayHtml = '<option value=""></option>';
                            for (var colVal in data.colonies) { // eslint-disable-line
                                arrayHtml += '<option value="' + data.colonies[colVal] + '" id="' + colVal + '">' + data.colonies[colVal] + '</option>';
                            }
                            selectBox = $('<select required data-missing-error="' + $formStateError + '" class="b-colony-select form-control colonyField" aria-required="true" autocomplete="colony" ' + selectID + ' ' + selectName + '>' + arrayHtml + '</select>');
                            $form.find('input.colonyField').replaceWith($(selectBox));
                            $form.find('select.colonyField').closest('.form-group').removeClass('b-colony_text-field').addClass('b-colony_select-field b-colony');
                            $form.find('select.colonyField').replaceWith($(selectBox));
                        } else {
                            $form.find('select.colonyField').closest('.form-group').removeClass('b-colony_select-field b-colony').addClass('b-colony_text-field');
                            $form.find('select.colonyField').replaceWith($(inputField));
                            if (data.colonies != '' && data.colonies != null) { // eslint-disable-line
                                $form.find('.colonyField').val(data.colonies);
                                $form.find('.colonyField').addClass('restrict-mouse-action');
                                $form.find('.colonyField').siblings('label').addClass('restrict-mouse-action');
                            }
                        }
                    }
                    $.spinner().stop();
                },
                error: function () {
                    $.spinner().stop();
                }
            });
        } else {
            updateFieldsBackToNormal();
        }
    });
}

module.exports = {
    findSuggestionsFromPostalCode: findSuggestionsFromPostalCode,
    updateFieldsBackToNormal: updateFieldsBackToNormal
};
