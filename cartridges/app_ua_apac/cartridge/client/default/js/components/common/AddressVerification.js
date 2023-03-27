import Component from 'org/components/common/AddressVerification';

export default class AddressVerification extends Component {
    getAddressFromForm() {
        this.config.fieldAddress1 = 'input[name$="_address1"]';
        this.config.fieldAddress2 = 'input[name$="_address2"]';
        this.config.fieldPostal = 'input[name$="_postalCode"].shippingZipCode';
        var countryCode = $('select[name$="_country"]').find('option:selected').val();
        switch (countryCode) {
            case 'AU':
                if ($('input[name$="_businessName"]').val().trim() !== '') {
                    this.config.fieldAddress1 = 'input[name$="_businessName"]';
                    this.config.fieldAddress2 = 'input[name$="_address1"]';
                }
                this.config.fieldCity = 'input[name$="_suburb"]';
                this.config.selectState = 'select[name$="_stateCode"]';
                break;
            case 'NZ':
                this.config.fieldCity = 'input[name$="_suburb"]';
                this.config.selectState = 'input[name$="_city"]';
                break;
            case 'MY':
                this.config.fieldCity = 'input[name$="_city"]';
                this.config.selectState = 'select[name$="_stateCode"]';
                this.config.fieldPostal = 'select[name$="_postalCode"].shippingZipCode';
                break;
            case 'SG':
                this.config.fieldCity = 'input[name$="_city"]';
                break;
            default:
                break;
        }
        super.initializeCache();
        return {
            address1: this.cache.$fieldAddress1.val(),
            address2: this.cache.$fieldAddress2.val(),
            city: this.cache.$fieldCity.val(),
            state: this.cache.$selectState.val(),
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
        this.cache.$selectState.trigger('change');
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
    }
}
