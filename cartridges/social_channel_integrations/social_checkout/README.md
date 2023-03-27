meta DELTA (only 2 ca's: one in Order + one in Shipment) rest of meta is already in ECOM (Shipment's tracking number, shipmentNo and shippingStatus)


the hook_meta.xml leverages the following data: (missing the ca grouping to make it visible in storefront) 
shipmentsInfo → Order custom attribute
trackingUrl → Shipment custom attribute
shipmentNo and shippingStatus → Shipment system attribute
Shipment's tracking number

# sample of usage:

PATCH HOST}}/s/Sites-{{SITE}}-Site/dw/shop/{{OCAPI_VERSION}}/orders/{{ORDER_ID<br>
{<br>
 "status": "new",<br>
 "c_shipmentsInfo": "{\"00000001\":{\"trackingNumber\":\"4442\",\"shippingStatus\":\"shipped\"},\"00000002\":{\"trackingNumber\":\"4432\",\"trackingUrl\":\"www.trackingparcel3.com (http://www.trackingparcel3.com/)\",\"shippingStatus\":\"shipped\"},\"00000003\":{\"trackingNumber\":\"3342\"}}"
}
<br>
<br>
the above sample will fail only cuz i.e. there's no 00000003 shipmentNo for the given order <br>
 "statusCode": "NOTEXISTS",<br>
 "statusMessage": "1 or more shipment(s) weren't updated cuz they didn't exist for the given order."<br>

OK sample, idem as above but without the last shipment<br>
PATCH HOST}}/s/Sites-{{SITE}}-Site/dw/shop/{{OCAPI_VERSION}}/orders/{{ORDER_ID<br>
{<br>
 "status": "new",<br>
 "c_shipmentsInfo": "{\"00000001\":{\"trackingNumber\":\"4442\",\"shippingStatus\":\"shipped\"},\"00000002\":{\"trackingNumber\":\"4432\",\"trackingUrl\":\"www.trackingparcel3.com (http://www.trackingparcel3.com/)\",\"shippingStatus\":\"shipped\"}}"
}
