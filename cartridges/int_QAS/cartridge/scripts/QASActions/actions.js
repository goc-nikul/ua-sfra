var AddressGet = require('./actions/AddressGet');
var AddressRefine = require('./actions/AddressRefine');
var AddressSearch = require('./actions/AddressSearch');
var AddressTypeDownSearch = require('./actions/AddressTypeDownSearch');

module.exports = {
    get: new AddressGet(),
    search: new AddressSearch(),
    refine: new AddressRefine(),
    typeDownSearch: new AddressTypeDownSearch()
};
