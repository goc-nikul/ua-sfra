# Social channels feeds generation

This folder contains the Social Channels Feeds integration layer with Salesforce B2C Commerce.

## Dependencies
with demandware-library custom feeds cartridges: bc_library !

## User Interface
You can find the user interface under Administration -> Integration

For the most part it should be self-explaining, you can create feeds, edit feeds, remove feeds or modify existing feeds as you like.

## Technical outline
The functionality uses the Integration Framework, there is a component CustomFeeds which can be added to any workflow. The configuration is represented by custom objects of type SalesChannelFeedConfig, all configured feeds are exported by the workflow component.

The component functionality uses the search functionality to iterate over all available products, handlers which are created using the configuration stored in the custom objects are then writing hte export files into the configured locations. Feed setup

Go to Admistration -> Operations -> Jobs and create new schedules. Configure the scheduling as desired and add the component CustomFeeds. If you run it now, you should see a successful execution with nothing being processed.

Now the feeds need to be configured, therefore you need ot go to any site -> Custom object -> Custom object editor -> SalesChannelFeedConfig -> "New". Now define the feed as desired and click "Apply/Create". Feed configuration

## XML feeds
For XML feeds the type XML must be selected. The template is basically comprised of three parts, the header, the element and the footer which are separated by dividers as outlined below.

Header
{{block type="product"}}
Element
{{/block}}
Footer
The Element block will be rendered for each product and allows to access product attributes.

System attributes:

{{var:name}}
Custom attributes:

{{var:custom:color format="<a format>"}}
The following system attributes are supported:

brand
EAN
ID
name
shortDescription
longDescription
pageDescription
pageKeywords
pageURL
ageTitle
taxClassID
UPC
On top of the the following special attributes are supported which are treated like system attributes:

price - the formatted price including currency
pricevalue - the price as number, support options formatting (i.e. format="#.00" to alway get two decimals)
url - the URL to the product
image - link to image (supports format parameter which allows to specify the view type, defaults to view type "medium")
category - the display name of the primary category or empty
Example using a format for a value (only supported for certain types)

{{var:custom:color format="<a format>"}}

## CSV feeds
CSV feed configuration works similar to XML feeds, the field syntax is sligtly different though ("." instead of ":" and no leading "var:"). The following exaple should illustrate it quite well:

separator ;
SKU;Name;Price in EUR;Color
ID;name;pricevalue format="#,##0.00";custom.color
The line specifying the separator is optional, if it is omited "," will be used.

The next line defines the header and will be printed into the CSV without modifications.

The last line is the definition of the fields, the same fields as for XML feeds can be used. Custom attributes are prefixed with "custom.".

## Storage location of the feeds
The feeds are placed in a folder specified as Folder name. This supports all locations which are supported by dw.io.File. Here are two common use cases:

## Export the file to IMPEX directory (not accessible from the outside world unless a Busniess Manager account with proper permissions exists) and push to FTP server or something similar.
IMPEX/src/feeds
Export the file to the content static directory to make it publicly accessible.
LIBRARIES/SiteGenesis/default/feeds
Feed will then be available under i.e.: https://dev01-web-realm.demandware.net/on/demandware.static/Sites-Site/Sites-SiteGenesis-Library/default/v1374716564121/feeds/mycsv_20130801062925.csv

The filename can (and must) be specified as well, it additionally supports two placeholders:

{{countrycode}} - get replaced with the two digit country code
{{timestamp}} - gets replaced with the timestamp, supports optional format="<a date format>", i.e. {{timestamp format="yyyyMMdd"}})
It is also possible to specify the character encoding of the feed, the default is UTF-8.
