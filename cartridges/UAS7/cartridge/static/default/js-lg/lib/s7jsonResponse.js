// This function serves as the JSONP callback that is used to take the
// Scene7 image-set data, and massage it into a format that we can then
// use to compare our product asset-set.
var s7jsonResponse = function (imageSetData) {

    // Initialize local variables
    var isContentsString, isContents, isSCElement, isCElement, thisImageArray, thisImage, thisEvent;

    // Capture the image set contents
    isContentsString = imageSetData["IMAGE_SET"];

    // Default the image set contents array
    isContents = {};

    // Is the contents empty?  If so, exit
    if ( isContentsString.length === 0) return;

    // Otherwise, convert the contents to an array, iterate over it,
    // identify the material code owner, and record each asset entry
    isSCElement = isContentsString.split(";");

    // Iterate over each element of the semi-colon content string
    isSCElement.forEach( function(thisElement) {

        // Split the string again -- this time off of commas
        isCElement = thisElement.split(",");

        // Iterate over each of the elements
        isCElement.forEach (function(thisImageSetItem) {

            // Split the image set item contents (to remove the UnderArmour)
            thisImageArray = thisImageSetItem.split("/");

            // Capture the image file name
            thisImage = thisImageArray[1];
            
            // Add the image to the isContents object (preventing duplicates)
            isContents[thisImage] = true;

        });
        
    });

    // Process the material images into a manageable format
    event = jQuery.Event("s7/process.material.images");

    // Seed the image-set contents
    event["ISCONTENTS"] = isContents;
    
    // Process the event
    jQuery("body").trigger(event);
    
};