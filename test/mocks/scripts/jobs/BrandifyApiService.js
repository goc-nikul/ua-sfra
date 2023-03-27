const XML = require("../../dw/XML");

const storeData = `<poi>
    <name>Under Armour Factory House</name>
    <accessories>1</accessories>
    <address1>5220 Fashion Outlet Way</address1>
    <address2>Suite 1135</address2>
    <alterations></alterations>
    <authorizeddealer></authorizeddealer>
    <bho></bho>
    <bopis></bopis>
    <bra_fittings></bra_fittings>
    <channel>Retail</channel>
    <city>Rosemont</city>
    <clientkey>UAFS-5220FOWS11</clientkey>
    <comingsoon></comingsoon>
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
    <friclose>8:00 PM</friclose>
    <friopen>10:00 AM</friopen>
    <gmb_curbsidepickup></gmb_curbsidepickup>
    <graphic_tees></graphic_tees>
    <icon>UA_Outlet</icon>
    <imageurl></imageurl>
    <latitude>41.974961</latitude>
    <link></link>
    <longitude>-87.8671134</longitude>
    <lp_about></lp_about>
    <mens_apparel>1</mens_apparel>
    <mens_footwear>1</mens_footwear>
    <monclose>8:00 PM</monclose>
    <monopen>10:00 AM</monopen>
    <opendate></opendate>
    <personal_shopping></personal_shopping>
    <phone>847-678-7759</phone>
    <postalcode>60018</postalcode>
    <province></province>
    <rank></rank>
    <region></region>
    <reopen_date></reopen_date>
    <requires_masks_customers></requires_masks_customers>
    <requires_masks_staff>1</requires_masks_staff>
    <satclose>8:00 PM</satclose>
    <satopen>10:00 AM</satopen>
    <ship_to_home></ship_to_home>
    <specialhours>11/25/2021 CLOSED, 11/26/2021 7:00AM - 10:00PM, 12/24/2021 9:00AM - 6:00PM, 12/25/2021 CLOSED, 12/26/2021 10:00AM - 8:00PM, 12/31/2021 10:00AM - 6:00PM, 1/1/2022 10:00AM - 7:00PM</specialhours>
    <specialhourslocator></specialhourslocator>
    <state>IL</state>
    <stnum>210</stnum>
    <storefront_img></storefront_img>
    <subname>Fashion Outlets of Chicago</subname>
    <sunclose>7:00 PM</sunclose>
    <sunopen>10:00 AM</sunopen>
    <temp_closed></temp_closed>
    <thurclose>8:00 PM</thurclose>
    <thuropen>10:00 AM</thuropen>
    <tueclose>8:00 PM</tueclose>
    <tueopen>10:00 AM</tueopen>
    <uaoutlet>1</uaoutlet>
    <uaspeciality></uaspeciality>
    <uid>-2065461343</uid>
    <wedclose>8:00 PM</wedclose>
    <wedopen>10:00 AM</wedopen>
    <womens_apparel>1</womens_apparel>
    <womens_footwear>1</womens_footwear>
    <youth_apparel>1</youth_apparel>
    <youth_footwear>1</youth_footwear>
    </poi>
    `;


module.exports = {
    call: function (params) {
        return `<?xml version="1.0" encoding="UTF-8"?><response code="1"><collection name="poi" count="1">
        ${storeData}
        </collection></response>`;
    },
    storeData: new XML(storeData)
};

