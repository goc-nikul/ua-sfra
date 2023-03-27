'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const XML = require('../../../mocks/dw/XML');

const storeDataWithNoSpecialHours = `<poi>
    <name>Under Armour Factory House</name>
    <accessories>1</accessories>
    <address1>2716 N Greenwich Road</address1>
    <address2></address2>
    <alterations></alterations>
    <authorizeddealer></authorizeddealer>
    <bho>[]</bho>
    <bopis></bopis>
    <bra_fittings></bra_fittings>
    <channel>Retail</channel>
    <city>Wichita</city>
    <clientkey>WICHI-2716NGRWK-1</clientkey>
    <comingsoon>1</comingsoon>
    <connected_fitness></connected_fitness>
    <country>US</country>
    <custom_localpage></custom_localpage>
    <dealertype>Retail Dealer</dealertype>
    <event1_date></event1_date>
    <event1_description></event1_description>
    <event1_location></event1_location>
    <event1_name></event1_name>
    <event2_date></event2_date>
    <event2_description></event2_description>
    <event2_location></event2_location>
    <event2_name></event2_name>
    <fax></fax>
    <friclose></friclose>
    <friopen></friopen>
    <gmb_curbsidepickup></gmb_curbsidepickup>
    <graphic_tees>1</graphic_tees>
    <icon>UA_Outlet</icon>
    <imageurl></imageurl>
    <latitude>37.7314027</latitude>
    <link></link>
    <longitude>-97.2026017</longitude>
    <lp_about></lp_about>
    <mens_apparel>1</mens_apparel>
    <mens_footwear>1</mens_footwear>
    <monclose></monclose>
    <monopen></monopen>
    <opendate>February 4, 2022</opendate>
    <personal_shopping></personal_shopping>
    <phone>316-771-5843</phone>
    <postalcode>67226</postalcode>
    <province></province>
    <rank></rank>
    <region></region>
    <reopen_date></reopen_date>
    <requires_masks_customers></requires_masks_customers>
    <requires_masks_staff></requires_masks_staff>
    <satclose></satclose>
    <satopen></satopen>
    <ship_to_home></ship_to_home>
    <specialhours></specialhours>
    <specialhourslocator></specialhourslocator>
    <state>KS</state>
    <stnum>277</stnum>
    <storefront_img></storefront_img>
    <subname>Greenwich Place</subname>
    <sunclose></sunclose>
    <sunopen></sunopen>
    <temp_closed></temp_closed>
    <thurclose></thurclose>
    <thuropen></thuropen>
    <tueclose></tueclose>
    <tueopen></tueopen>
    <uaoutlet>1</uaoutlet>
    <uaspeciality></uaspeciality>
    <uid>-463695159</uid>
    <wedclose></wedclose>
    <wedopen></wedopen>
    <womens_apparel>1</womens_apparel>
    <womens_footwear>1</womens_footwear>
    <youth_apparel>1</youth_apparel>
    <youth_footwear>1</youth_footwear>
    </poi>
`;

describe('bc_jobs/cartridge/scripts/storelocator/UpdateBrandifyStores.js test', () => {
    const storeHoursJsonFormat = proxyquire('../../../../cartridges/bc_jobs/cartridge/scripts/storelocator/UpdateBrandifyStores', {
        'dw/util/HashMap': require('../../../mocks/dw/dw_util_HashMap'),
        'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
        'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
        'dw/system/System': require('../../../mocks/dw/dw_system_System'),
        'dw/io/XMLStreamWriter': require('../../../mocks/dw/dw_io_XMLStreamWriter'),
        'dw/io': {
            File: require('../../../mocks/dw/dw_io_File'),
            FileWriter: require('../../../mocks/dw/dw_io_FileWriter'),
            XMLStreamWriter: require('../../../mocks/dw/dw_io_XMLStreamWriter')
        },
        'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
        'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
        'bc_jobs/cartridge/scripts/services/BrandifyApiService': require('../../../mocks/scripts/jobs/BrandifyApiService')
    }).unitTestFunctions.storeHoursJsonFormat;

    it('Overrides current store hours with holiday', () => {
        const orgNow = Date.now;
        Date.now = () => new Date('12/20/2021').getTime();
        const storeData = require('../../../mocks/scripts/jobs/BrandifyApiService').storeData;
        const result = storeHoursJsonFormat(storeData.child('poi'));
        Date.now = orgNow;
        assert.equal(result.length, 7);
        assert.include(result[5], {
            friopen: '9:00AM',
            friclose: '6:00PM'
        });
        assert.isUndefined(result[6].satopen);
        assert.isUndefined(result[6].satclose);
    });

    it('Does not override store hours when no overrides exist in the current week', () => {
        const orgNow = Date.now;
        Date.now = () => new Date('12/08/2021').getTime();
        const storeData = require('../../../mocks/scripts/jobs/BrandifyApiService').storeData;
        const result = storeHoursJsonFormat(storeData.child('poi'));
        Date.now = orgNow;
        assert.equal(result.length, 7);
        const days = ['sun', 'mon', 'tue', 'wed', 'thur', 'fri', 'sat'];
        const expected = days.map(day => {
            let result = {};
            result[`${day}open`] = '10:00 AM';
            result[`${day}close`] = '8:00 PM';
            return result;
        });
        expected[0].sunclose = '7:00 PM';

        assert.deepEqual(result, expected);
    });

    it('Support stores with no special hours defined', () => {
        const orgNow = Date.now;
        Date.now = () => new Date('12/08/2021').getTime();
        const storeData = new XML(storeDataWithNoSpecialHours);
        const result = storeHoursJsonFormat(storeData.child('poi'));
        Date.now = orgNow;
        assert.equal(result.length, 7);
        const days = ['sun', 'mon', 'tue', 'wed', 'thur', 'fri', 'sat'];
        const expected = days.map(day => {
            let result = {};
            result[`${day}open`] = '';
            result[`${day}close`] = '';
            return result;
        });

        assert.deepEqual(result, expected);
    });
});
