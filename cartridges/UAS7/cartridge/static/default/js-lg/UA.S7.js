/*global UA, $, Backbone */
/*jslint browser: true, maxerr: 50, indent: 4, plusplus: true, nomen: true */
UA.S7 = function () {
    'use strict';

    // Initialize local variables
    var api = {},
    
    // Seed the Akamai base / root url constants (used to render Scene 7 Preview Images)
    akamaiUrl = 'https://underarmour.scene7.com/is/image/Underarmour/',
    originUrl = 'https://origin-d4.scene7.com/is/image/Underarmour/',   
    
    // Initialize default variables
    s7MaterialImages = {};
        
    // Disable asynchronous ajax
    jQuery.ajaxSetup({
        async: true
    });

    //////////////////////////////////////////////////
    // Public Methods
    //////////////////////////////////////////////////

    // Build out the initialization function
    api.init = function () {

		////////////////////////////////////
		// Custom Events
		////////////////////////////////////
		
        // Listen for the process material images event
        jQuery("body").on("s7/process.material.images", function(e) {
        	
        	// Launch the function to process the image-setContents
        	api.processMaterialImages(e["ISCONTENTS"]);
        	
        });
            	

    };

    // This method is used to parse out a product material code
    // from an image file name (removing prefixes, etc).
    api.getMaterialCodeFromImageFileName = function (imageFileName) {

        // Initialize local variables
        var output, tmpFileName;

        // Remove the image file-prefixes
        tmpFileName = imageFileName.replace("PS", "");
        tmpFileName = tmpFileName.replace("V5-", "");

        // With the prefix removed, pull the material code
        output = tmpFileName.split("_");

        // return the material code
        return output[0];

    };    
    
    // This method is used to retrieve productAssetsFromScene7
    api.getProductMaterialAssetsFromScene7 = function (materialCode) {
    	
        // Initialize local variables
        var jsonUrl, isPrefix, materialAssets;

        // Set the prefixes used to identify image set information
        isPrefix = ["", "PS", "V5-"];

        // Loop over each prefix, and make a request to Scene 7
        isPrefix.forEach( function(thisPrefix) {

            // Build out the json url that will be used to retrieve assets from Scene 7
            jsonUrl = akamaiUrl + thisPrefix + materialCode + '_is?req=imageset,json&callback=?';

            // Since this is going out to S7, we've got to do a JSOP request via jQuery.
            // To view what the json looks like for a given image set request please visit
            // http://underarmour.scene7.com/is/image/Underarmour/1245952-731_is?req=imageset,json
            jQuery.ajax({
                type: 'GET',
                url: jsonUrl,
                async: false,
                dataType: 'jsonp'
            });

        });

    };

    /////////////////////////////////////////
    // Initialize the public tracking variables
    /////////////////////////////////////////

    // Used to track Scene7 Images
    api.s7MaterialImages = {};
    
    // Used to track the transaction counts for processed materials
    api.materialTransactionCounts = {};

    // This function is used to increment the transaction count for a given 
    // material code.  Transaction counts are incremented with each Scene 7 
    // image set request made. 
    api.incrementMaterialTransactionCount = function (materialCode) {
    	
    	// Does the current material code have a transaction count record?
    	if ( api.materialTransactionCounts.hasOwnProperty(materialCode) ) {
    		
    		// If so, then increment the transaction count
    		api.materialTransactionCounts[materialCode] ++;
    		
    	} else {
    		
    		// Otherwise, default the transaction count to 1
    		api.materialTransactionCounts[materialCode] = 1;
    		
    	}
    	
    };
    
    // This function is used to process the raw set of material images retrieves from Scene 7
    // into a format that's manageable for us to work through / iterate over.
    api.processMaterialImages = function (imagesObject) {
    	
        // Initialize local variables
        var materialCode, thisImage, output, event;

        // Initialize the output Object
        output = {};
        
        // Iterate over each of the S7 images
        for( thisImage in imagesObject ){

            // Pull the material code from the current filename
            materialCode = api.getMaterialCodeFromImageFileName(thisImage);

            // Initialize the images array if it does not already exist
            if (!api.s7MaterialImages.hasOwnProperty(materialCode)) {
                api.s7MaterialImages[materialCode] = [];
            }

            // Initialize the output array if it doesn't exist
            if (!output.hasOwnProperty(materialCode)) {
            	output[materialCode] = [];
            }
            
            // Append the image to the material images / output array
            api.s7MaterialImages[materialCode].push(thisImage);
            output[materialCode].push(thisImage);

        };

        /////////////////////////////////////////////////
        // Trigger the jQuery Event to Render the Images
        /////////////////////////////////////////////////
        
        // Initialize the jQuery custom jQuery event 
        event = jQuery.Event("s7/render.images");

        // Seed the processed images
        event["MATERIALCODES"] = output;
        
        // Trigger the render-images event
        jQuery("body").trigger(event);
        
    };

    // Return the API contents
    return api;

}();