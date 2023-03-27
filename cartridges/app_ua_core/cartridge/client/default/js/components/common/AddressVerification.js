import Component from '../core/Component';

export default class AddressVerification extends Component {
    init() {
        this.settings = {
            fieldAddress1: 'input[name$="_address1"]',
            fieldAddress2: 'input[name$="_address2"]',
            selectState: 'select[name$="_stateCode"]',
            fieldCity: 'input[name$="_city"]',
            fieldPostal: 'input[name$="_postalCode"].shippingZipCode'
        };
        this.initConfig(this.settings);
        this.initializeCache();
        this.initializeEvents();
        this.updateAddressHash();
    }

    initializeCache() {
        this.cache = {};
        this.cache.$window = $(window);
        this.cache.$document = $(document);
        this.cache.$body = $('body');
        this.cache.$form = $('form.shipping-form:visible').find('.b-shipping-method_input:checked[data-pickup=false]').parents('form');
        this.cache.$fieldAddress1 = this.cache.$form.find(this.config.fieldAddress1);
        this.cache.$fieldAddress2 = this.cache.$form.find(this.config.fieldAddress2);
        this.cache.$selectState = this.cache.$form.find(this.config.selectState);
        this.cache.$fieldCity = this.cache.$form.find(this.config.fieldCity);
        this.cache.$fieldPostal = this.cache.$form.find(this.config.fieldPostal);
    }

    initializeEvents() {
        this.event('qas:AddressValidation', this.onSubmitAddressForm.bind(this), this.cache.$body);
        this.event('qas:checkIfAddressChanged', this.checkIfAddressChanged.bind(this), this.cache.$body);
        this.eventDelegate('change', this.config.fieldPostal, this.preFillAddressByPostal.bind(this), this.cache.$document);
    }

    preFillAddressByPostal() {
        var searchQuery = this.cache.$fieldPostal.val();

        if (this.cache.$form.is(':visible')) {
            if (searchQuery.length > 0 && searchQuery !== undefined && searchQuery !== '') {
                var address = this.getAddressFromForm();

                this.apiTypeDownSearch(searchQuery).then(response => {
                    if (response.result.address !== 'No matches') {
                        var parts = response.result.address.split(', ');
                        if (parts.length === 2) {
                            address.state = parts[1];
                            address.zipCode = parts[0];
                            address.city = '';
                        } else if (parts.length === 3) {
                            address.state = parts[2];
                            address.city = parts[1];
                            address.zipCode = parts[0];
                        } else if (parts.length === 4) {
                            address.state = parts[3];
                            address.city = parts[2];
                            address.zipCode = parts[0];
                        }
                        this.updateAddressInForm(address);
                    }
                });
            }
        }
    }

    addressToHash(address) {
        var { address1, address2, city, state, zipCode } = address;
        return `${address1}:${address2}:${city}:${state}:${zipCode}`;
    }

    updateAddressHash() {
        var address = this.getAddressFromForm();
        this.currentAddressHash = this.addressToHash(address);
    }

    isAddressChanged() {
        var address = this.getAddressFromForm();
        return this.currentAddressHash !== this.addressToHash(address);
    }

    checkIfAddressChanged() {
        window.addressVerificationChanged = this.isAddressChanged();
    }

    onSubmitAddressForm(e) {
        this.initializeCache();
        if (this.cache.$form.get(0).checkValidity()) {
            e.preventDefault();
            if (this.isAddressChanged()) {
                window.addressVerificationDone = false;
                var addressToVerify = this.getAddressFromForm();
                this.apiVerifyAddress(addressToVerify).then((response) => {
                    this.getHandlerByType(response.data.type).call(this, response.data, response.renderedTemplate);
                }).catch(() => {
                    this.errorVerification();
                });
            } else {
                this.setVerificationDone();
                this.updateNextStage();
                e.stopImmediatePropagation();
            }
        }
    }

    getHandlerByType(type) {
        var handler = this.errorVerification;
        var map = {
            warning: this.showBlockWarning,
            interaction: this.showBlockInteraction,
            picklist: this.showBlockPickList,
            success: this.showBlockSuccess
        };
        if (map[type]) {
            handler = map[type];
        }
        return handler;
    }

    showVerificationBlock(html) {
        $('.shipping-section').find('.js-cmp-addressVerification').html(html);
        $('#addressVerification').modal('show');
        $('body').find('.modal-backdrop').addClass('overlay');
        $('#addressVerification').closest('.b-checkout_page').find('.next-step-button').addClass('inactive-payment');
    }

    hideVerificationBlock() {
        $('body').trigger('shipping:lastTouchedCheckoutField');
        this.$el.html('');
        $('#addressVerification').modal('hide');
        $('body').find('.modal-backdrop').removeClass('overlay');
        $('#addressVerification').closest('.b-checkout_page').find('.next-step-button').removeClass('inactive-payment');
        $('.next-step-button button').removeAttr('data-clicked');
    }

    updateNextStage() {
        if (!window.notSubmitShippingForm) {
            $('.submit-shipping').trigger('click');
        } else {
            this.cache.$form.find('.shipping-save-button').trigger('click');
        }
    }

    onAction(action, callback) {
        return this.$el.find(`[data-action="${action}"]`).on('click', callback);
    }

    returnToForm() {
        this.cache.$fieldAddress1.focus();
        this.hideVerificationBlock();
        this.updateAddressHash();
    }

    showBlockInteraction(data, renderedTemplate) {
        this.showVerificationBlock(renderedTemplate);
        var name = 'address-verification';
        var errorName = 'Please Verify Your Address';
        var errorMsg = 'We\'ve found the addresses that may be a better match.';
        this.dataLayerBlockShowEvents(name, errorName, errorMsg);
        this.onAction('edit', this.returnToForm.bind(this));
        this.onAction('accept', () => {
            if (document.getElementById('keep-what-i-entered-qas-address').checked) {
                this.updateAddressInForm(data.original);
            } else {
                this.updateAddressInForm(data.address);
            }
            this.updateAddressHash();
            this.setVerificationDone();
            this.hideVerificationBlock();
            this.updateNextStage();
        });
    }

    showBlockPickList(data, renderedTemplate) {
        this.showVerificationBlock(renderedTemplate);
        var name = 'address-verification';
        var errorName = 'Please Verify Your Address';
        var errorMsg = 'We\'ve found the addresses that may be a better match.';
        this.dataLayerBlockShowEvents(name, errorName, errorMsg);
        this.onAction('cancel', this.returnToForm.bind(this));
        this.onAction('accept', () => {
            var moniker = this.$el.find('[type="radio"]:checked').val();
            this.apiGetAddressByMoniker(moniker).then(response => {
                this.updateAddressInForm(response.address);
                this.updateAddressHash();
                this.setVerificationDone();
                this.hideVerificationBlock();
                this.updateNextStage();
            }).catch(() => {
                this.updateAddressHash();
                this.setVerificationDone();
                this.hideVerificationBlock();
            });
        });
    }

    showBlockWarning(data, renderedTemplate) {
        this.showVerificationBlock(renderedTemplate);
        var name = 'address-verification';
        var errorName = 'Please Verify Your Address';
        var errorMsg = 'We\'re having trouble verifying your address with Postal Service records.';
        this.dataLayerBlockShowEvents(name, errorName, errorMsg);
        this.onAction('cancel', this.returnToForm.bind(this));
        this.onAction('save', () => {
            this.updateAddressHash();
            this.setVerificationDone();
            this.hideVerificationBlock();
            this.updateNextStage();
        });
    }

    showBlockSuccess() {
        this.setVerificationDone();
        this.updateNextStage();
    }
    dataLayerBlockShowEvents(name, errorName, errorMessage) {
        $('body').trigger('modalShown', { name: name, errorName: errorName, errorMessage: errorMessage });
        return;
    }
    errorVerification() {
        this.setVerificationDone();
    }

    setVerificationDone() {
        this.updateAddressHash();
        window.addressVerificationDone = true;
    }

    async apiVerifyAddress({ address1, address2, city, state, zipCode }) {
        return new Promise((success, error) => {
            $.ajax({
                url: this.config.verificationUrl,
                data: { address1, address2, city, state, zipCode },
                method: 'POST',
                success,
                error
            });
        });
    }

    async apiGetAddressByMoniker(moniker) {
        return new Promise((success, error) => {
            $.ajax({
                url: this.config.getUrl,
                data: { moniker },
                method: 'POST',
                success,
                error
            });
        });
    }

    async apiTypeDownSearch(query) {
        return new Promise((success, error) => {
            $.ajax({
                url: this.config.typeDownSearchUrl,
                data: { query },
                method: 'POST',
                success,
                error
            });
        });
    }

    getAddressFromForm() {
        return {
            address1: this.cache.$fieldAddress1.val(),
            address2: this.cache.$fieldAddress2.val(),
            city: this.cache.$fieldCity.val(),
            state: this.cache.$selectState.find('option:selected').val(),
            zipCode: this.cache.$fieldPostal.val()
        };
    }

    updateAddressInForm({ address1, address2, city, state, zipCode }) {
        var citystr = city.replace(/\"/g, ''); // eslint-disable-line
        var statestr = state.replace(/\"/g, ''); // eslint-disable-line
        if (address1) {
            this.cache.$fieldAddress1.val(address1.replace(/\w\S*/g, m => m.charAt(0).toUpperCase() + m.substr(1).toLowerCase()));
        }
        this.cache.$fieldAddress2.val(address2);

        if (citystr === '') {
            this.cache.$fieldCity.addClass('is-invalid');
            this.cache.$fieldCity.val('');
            this.cache.$fieldCity.next('.invalid-feedback').html(this.cache.$fieldCity.next('.invalid-feedback').data('empty-error'));
        } else {
            this.cache.$fieldCity.val(city.replace(/\w\S*/g, m => m.charAt(0).toUpperCase() + m.substr(1).toLowerCase()));
            this.cache.$fieldCity.removeClass('is-invalid');
            this.cache.$fieldCity.closest('.form-group').removeClass('error-field');
            this.cache.$fieldCity.next('.invalid-feedback').empty();
        }
        if (statestr === '') {
            this.cache.$selectState.addClass('is-invalid');
            this.cache.$selectState.val('');
            this.cache.$selectState.next('.invalid-feedback').html(this.cache.$fieldCity.next('.invalid-feedback').data('empty-error'));
        } else {
            this.cache.$selectState.val(state);
            this.cache.$selectState.removeClass('is-invalid');
            this.cache.$selectState.closest('.form-group').removeClass('error-field');
            this.cache.$selectState.next('.invalid-feedback').empty();
        }
        if (zipCode === '') {
            this.cache.$fieldPostal.addClass('is-invalid');
            this.cache.$fieldPostal.val('');
            this.cache.$fieldPostal.next('.invalid-feedback').html(this.cache.$fieldCity.next('.invalid-feedback').data('empty-error'));
        } else {
            this.cache.$fieldPostal.val(zipCode);
            this.cache.$fieldPostal.removeClass('is-invalid');
            this.cache.$fieldPostal.closest('.form-group').removeClass('error-field');
            this.cache.$fieldPostal.next('.invalid-feedback').empty();
        }

        this.cache.$selectState.trigger('change');
    }
}
