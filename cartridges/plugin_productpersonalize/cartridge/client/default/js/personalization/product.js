'use strict';

/**
 * Save Personalization or updated hidden inputs
 */
function savePersonlization() {
    $('.personalize__form-action button').on('click', () => {
        $('input[type="hidden"][name="personalizationName"]').val($('input#personalizationNameInput').val());
        $('input[type="hidden"][name="personalizationNumber"]').val($('input#personalizationNumberInput').val());
        $('input[type="hidden"][name="personalizationSponsors"]').val($('input#personalizationSponsorsInput:checked').length > 0 ? 'Yes' : '');

        var weight = 0;
        $('input[type="hidden"][name^="personalization"]').each((index, item) => {
            if ($(item).val()) weight += $(item).data('weight');
        });
        $('div[data-option-id="personalizations"]').find('select option').removeAttr('selected', 'selected');
        $('div[data-option-id="personalizations"]').find('select option[data-value-id="' + weight + '"]').attr('selected', 'selected');
        $('.product-personalization button.personalize__action-btn').text(
            weight > 0
                ? $('div.product-personalization').data('edit-personalization')
                : $('div.product-personalization').data('add-personalization'));
    });
}

/**
 * Event after on click of Add to cart
 */
function onAddToCart() {
    $('body').on('product:afterAddToCart', function (e, data) {
        if ($('div.personalize__action').length > 0 && !data.error) {
            $('.product-personalization button.personalize__action-btn').text($('div.product-personalization').data('add-personalization'));

            // Reset options
            $('div[data-option-id="personalizations"]').find('select option').removeAttr('selected', 'selected');
            $('div[data-option-id="personalizations"]').find('select option[data-value-id="0"]').attr('selected', 'selected');
            $('div.personalize__jersey-number').html('');
            $('div.personalize__jersey-name span').text('');

            // clear forms
            $('input#personalizationNameInput').val('');
            $('input#personalizationNumberInput').val('');
            $('input#personalizationSponsorsInput').prop('checked', false);
            $('input[type="hidden"][name^="personalization"]').each((index, item) => $(item).val(''));
        }
    });
}

/**
 * Event after attribute selection
 */
function onAttibuteSelect() {
    $('body').on('product:afterAttributeSelect', (e, response) => {
        var isPersonalizationSet = $('div[data-option-id="personalizations"]').find('select option:selected').data('value-id') > 0;
        var isPersonalizationEligible = response.data.product.isPersonalizationEligible;
        if (isPersonalizationSet && isPersonalizationEligible) return;
        if ($('.personalize-pdp').length > 0) {
            $('.personalize-pdp').html(response.data.product.personlizeTemplate);
            // reload All JS Again
            require('base/util')(require('./product'));
        }
        response.container.find('.product-options').empty().html(response.data.product.optionsHtml);
    });
}

/**
 * Event afor initialising the personalisation div
 */
function initPersonaliseDiv() {
    var imageWidth = $('.personalize__image').width() ? $('.personalize__image').width() : 400;
    var value = '0.6em';
    $('.personalize__jersey').css({
        width: (0.325 * imageWidth) + 'px',
        'margin-left': (0.325 * imageWidth) / (-2) + 'px' // eslint-disable-line
    });

    $('.personalize__jersey-number').css({
        'font-size': (0.13 * imageWidth) + 'px',
        'line-height': value,
        height: (0.2875 * imageWidth) + 'px'
    });
}

/**
 * Event after Personalize button click
 */
function onClickPersonalize() {
    $('.personalize__action-btn').on('click', () => {
        if ($('.b-pdp-personalize-modal').length && !$('.b-pdp-personalize-modal').hasClass('show')) {
            $('#personalize-modal').modal('show');
            $('body').addClass('personalize-modal');
            $('.personalize__carousel').trigger('mainCarousel:update');
            initPersonaliseDiv();
        } else if ($('.product-quickview .personalize-container').length) {
            $('.personalize-container').spinner().start();
            setTimeout(function () {
                $('.personalize__carousel').trigger('mainCarousel:update');
                initPersonaliseDiv();
                // Initialize Images specific to name and number
                var userNameInput = $('input#personalizationNameInput');
                var userNumberInput = $('input#personalizationNumberInput');
                if (userNameInput.val().length) {
                    userNameInput.trigger('blur');
                }
                if (userNumberInput.val().length) {
                    userNumberInput.trigger('blur');
                }
                $('.personalize-container').spinner().stop();
            }, 500);
        }
    });
}

/**
 * Event after Personalize button click
 */
function updateSponsorsImg() {
    $('#personalizationSponsorsInput').on('click', () => {
        var altBackImg = $('.personalize-back-img').attr('data-sponsors-img');
        var altfrontImg = $('.personalize-front-img').attr('data-sponsors-img');
        var defaultBackImg = $('.personalize-back-img').attr('data-default-img');
        var defaultfrontImg = $('.personalize-front-img').attr('data-default-img');
        if ($('input#personalizationSponsorsInput:checked').length) {
            altBackImg ? $('.personalize-back-img').attr('src', altBackImg) : ''; // eslint-disable-line
            altfrontImg ? $('.personalize-front-img').attr('src', altfrontImg) : ''; // eslint-disable-line
        } else {
            defaultBackImg ? $('.personalize-back-img').attr('src', defaultBackImg) : ''; // eslint-disable-line
            defaultfrontImg ? $('.personalize-front-img').attr('src', defaultfrontImg) : ''; // eslint-disable-line
        }
    });
}
/**
 * update the User name
 * @param {Object} userValue - User input value
 * @param {Object} $this - event triggered input field
 */
function updateUserName(userValue, $this) {
    var error = false;
    var negativeWords = window.negativeWords;
    if (userValue) {
        var updatedValue = userValue.replace(/[^A-Z\s\-'ÃÁÀÂÇÉÊÍÕÓÔÚÜ]/gi, '');
        updatedValue = updatedValue.replace(/^\s+|\s+$/g, '').toUpperCase();
        var nameInput = $this;
        if (negativeWords) {
            var allWords = negativeWords.split(',');
            allWords.forEach(word => {
                var updatedWord = word.replace(/^\s+|\s+$/g, '').toUpperCase();
                var modifiedInput = updatedValue.replace(/[ÃÁÀÂ]/gi, 'a').replace(/[Ç]/gi, 'c').replace(/[ÉÊ]/gi, 'e').replace(/[Í]/gi, 'i').replace(/[ÕÓÔ]/gi, 'o').replace(/[ÚÜ]/gi, 'u').replace(/[^a-zA-Z]/gi, '').toUpperCase(); // eslint-disable-line
                if (updatedValue.indexOf(updatedWord) > -1 || modifiedInput.indexOf(updatedWord) > -1) {
                    error = true;
                    nameInput.parent('.personalize__form-row').addClass('error-field');
                    nameInput.parent('.personalize__form-row').find('.invalid-feedback').removeClass('hide');
                    $(nameInput).val('');
                    return false;
                }
                return true;
            });
        }
        if (!error) {
            $(nameInput).parent('.personalize__form-row').removeClass('error-field');
            $(nameInput).parent('.personalize__form-row').find('.invalid-feedback').addClass('hide');
            if (updatedValue.length <= 4) {
                $('.personalize__jersey-name span').css({
                    'font-size': 36 + 'px',
                    'white-space': 'nowrap'
                });
            } else if (updatedValue.length < 10) {
                $('.personalize__jersey-name span').css({
                    'font-size': 14 + 'px',
                    'white-space': 'nowrap'
                });
            } else if (updatedValue.length === 10) {
                $('.personalize__jersey-name span').css({
                    'font-size': 17 + 'px',
                    'white-space': 'nowrap'
                });
            } else if (updatedValue.length <= 12) {
                $('.personalize__jersey-name span').css({
                    'font-size': 15 + 'px',
                    'white-space': 'nowrap'
                });
            }
            $('.personalize__jersey-name span').text(updatedValue);
            $('input#personalizationNameInput').val(updatedValue);
        }
    } else {
        $('.personalize__jersey-name span').text('');
    }
}

/**
 * Event after for update user input Number
 * @param {Object} userValue - User input value
 */
function updateUserNumber(userValue) {
    var jerseyStyle = 'spfc';
    var updatedNumber = userValue.replace(/[^0-9]/gi, '');
    for (var i = 0; i <= 30; i++) {
        if ($('.personalize__modal').hasClass('style-' + i)) {
            if (i <= 5) {
                jerseyStyle = 'spfc';
                break;
            } else if ((i > 5 && i <= 9) || (i > 21 && i <= 26)) {
                jerseyStyle = 'tim';
                break;
            } else if ((i > 9 && i <= 21)) {
                jerseyStyle = 'ss18';
                break;
            } else if ((i > 26 && i < 28)) {
                jerseyStyle = 'oc19';
                break;
            } else if (i > 27) {
                jerseyStyle = 'oc20';
                break;
            }
        }
    }
    var newNumber = updatedNumber.toString();
    var svgHtml = '';
    for (var j = 0; j < newNumber.length; j++) {
        var number = newNumber[j];
        svgHtml += `<svg class="number-${number}"><use xlink:href="#num-${jerseyStyle}-${number}" /></svg>`;
    }
    if (newNumber !== userValue) {
        $('input#personalizationNumberInput').val(newNumber);
    }
    $('.personalize__jersey-number').html(svgHtml);
}
/**
 * validation for the input fields
 */
function personalizeInputValidation() {
    $('#personalizationNameInput, #personalizationNumberInput').on('blur', (event) => {
        var $this = event.target;
        var userValue = $this.value;
        if ($this.id === 'personalizationNameInput') {
            updateUserName(userValue, $($this));
        } else if ($this.id === 'personalizationNumberInput') {
            if (userValue) {
                updateUserNumber(userValue);
            } else {
                $('.personalize__jersey-number').empty();
            }
        }
    });
}

/**
 * Event after attribute Personalize Modal Close
 */
function afterPersonalizeModalClose() {
    $('#personalize-modal').on('hidden.bs.modal', function () {
        $('body').removeClass('personalize-modal');
    });
}

/**
 * Event after attribute Personalize Modal Close
 */
function cartPersonalizeContinue() {
    $('.cart-personalize-continue-btn').on('click', function () {
        $('.nav-item a[href="#tab-1"]').trigger('click');
    });
}

/**
 * Event after resizing window
 */
function onPageOrientationChange() {
    $(window).on('resize', function () {
        setTimeout(function () {
            initPersonaliseDiv();
        }, 300);
    });
}

/**
 * validation for the input fields max length
 */
function inputMaxLengthValidation() {
    $('#personalizationNameInput, #personalizationNumberInput').on('keyup', (event) => {
        var $this = event.target;
        var userValue = $this.value;
        var maxLength = $this.maxLength;
        if (userValue.length > maxLength) {
            $this.value = userValue.substr(0, maxLength);
        }
    });
}

/**
 * Event to initialise the methods
 */
function init() {
    $('body').on('personlize:editcart', function () {
        savePersonlization();
        onClickPersonalize();
        updateSponsorsImg();
        personalizeInputValidation();
        savePersonlization();
        cartPersonalizeContinue();
        onPageOrientationChange();
        inputMaxLengthValidation();
    });
}


module.exports = {
    init: init,
    savePersonlization: savePersonlization,
    onAddToCart: onAddToCart,
    onAttibuteSelect: onAttibuteSelect,
    onClickPersonalize: onClickPersonalize,
    personalizeInputValidation: personalizeInputValidation,
    updateUserName: updateUserName,
    updateSponsorsImg: updateSponsorsImg,
    afterPersonalizeModalClose: afterPersonalizeModalClose,
    cartPersonalizeContinue: cartPersonalizeContinue,
    onPageOrientationChange: onPageOrientationChange,
    inputMaxLengthValidation: inputMaxLengthValidation
};
