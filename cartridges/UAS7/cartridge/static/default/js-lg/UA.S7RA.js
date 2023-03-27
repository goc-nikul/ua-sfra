/*global UA, $, jQuery, Backbone */
/*jslint browser: true, maxerr: 50, indent: 4, plusplus: true, nomen: true */
UA.S7RA = function () {
    'use strict';

    // Initialize local variables
    var api = {},

    // Default the constants collection
    appConstants,

    // Used to manage whether or not the asset carousel is read-only
    assetCarouselIsReadOnly,

    // Initialize the variable used to track the current view-type being iteracted with
    currentViewType,
    
    // Initialize the variable used to store the current / selected tile
    $selectedCarouselItem,
    
    // Initialize the original productCode copy / content
    originalProductCodeText,
    
    // Initialize the processed productCode text
    processedProductCodeText,    
    
    // Initialize the jQuery object cache
    $cache = {},

    // Initialize the style-code and material-code being cached
    styleCode,
    materialCode,
    variationValue,
    
    // Initialize the assets collection for a given style
    s7Assets = {},
    
    // Initialize the variable used to store the s7 carousel reference
    $s7Carousel,

    // Initialize the variable used to store all view-type carousel references
    $viewTypeCarousels = {},

    // Initialize flags used to track initialization of the s7 asset dialog elements
    isS7CarouselInitialized,
    hasPurgedEmptyAssetFilterEntries,    
    
    // Initialize the variables used to store recipe categories, viewTypes, and Definitions
    recipeCategories,
    viewTypes,
    recipeDefinitions,
    
    // Capture the current query string structure
    queryStruct = UA.URL.getQueryStringAsStruct(),    
    
    // Initialize the variable used to store the original / read-only product definitions  
    originalProductImageDefinitions,
    
    // Initialize the variable used to store the current / working product definitions    
    productImageDefinitions,
    
    // Seed the Akamai base / root url constants (used to render Scene 7 Preview Images)
    akamaiUrl = 'https://underarmour.scene7.com/is/image/Underarmour/',
    originUrl = 'https://origin-d4.scene7.com/is/image/Underarmour/';

    // Helper Methods to show the data driving the display
    api.logProductImageDefinitions = function () { console.log(productImageDefinitions); };
    api.logOriginalProductImageDefinitions = function () { console.log(originalProductImageDefinitions); };    
    api.logRecipeDefinitions = function () { console.log(recipeDefinitions); };
    api.logViewTypes = function () { console.log(viewTypes); };
    api.logRecipeCategories = function () { console.log(recipeCategories); };
    api.logS7Assets = function () { console.log(s7Assets); };
    
    // This method is used to take-in the Scene7 assets for a given material and consolidate them
    // against previous image-set iterations (we need to query three image-sets before we can be done)
    api.consolidateScene7Assets = function(assetData) {
    	
    	// Initialize local variables
    	var thisMaterial;
    	
    	// Retrieve the material code for this iteration
    	for ( var materialCode in assetData ) {
    		    		
    		// Initialize the asset materials array to store Scene7 assets
    		if ( !s7Assets.hasOwnProperty(materialCode) ) s7Assets[materialCode] = [];
    		
    		// Create a reference to this material's assetArray
    		thisMaterial = assetData[materialCode];

    		// Loop over the collection of images
    		thisMaterial.forEach( function(thisImage, arrayIndex) {
    			
    			// Does this image exist in the current collection of assets?
    			if ( s7Assets[materialCode].indexOf(thisImage) === -1 ) {
    				
    				// Append the current image to the material array
    				s7Assets[materialCode].push(thisImage);
    				
    			}
    			
    		})
    		
    		// Sort the array alphabetically
    		s7Assets[materialCode].sort();
    		s7Assets[materialCode].reverse();
    		    		
    	};
    	
    	// Update the select filter to include S7 asset counts
    	api.updateSelectFilterWithS7AssetCounts(materialCode);
    	
    };
    
    // This function is used to determine if a product code is a style
    api.isStyle = function (productCode) {

        // Initialize local variables
        var delimiterCount;

        // Count the number of code delimiters present in the string
        delimiterCount = productCode.match(/-/g);
        
        // Was a delimiter found?  If not, 
        if ( delimiterCount !== null ) return false;
        
        // A style cannot be more than seven characters
        if ( productCode.length !== 7 ) return false;    
        
        // If all rules pass, then this is a style
        return true;

    };

    // This function is used to determine if a product code is a material
    api.isMaterial = function (productCode) {

        // Initialize local variables
        var objArray, delimiterCount;

        // Was a code-separator found?
        if ( productCode.indexOf("-") === -1 ) return false;

        // Count the number of code delimiters present in the string
        delimiterCount = productCode.match(/-/g);

        // If more than one delimeter is present, then this is not a material
        if ( delimiterCount.length != 1 ) return false;

        // A material has to at least by seven characters
        if ( productCode.length > 11 ) return false;

        // Split the array into style and material elements
        objArray = productCode.split("-");

        // Test the style code element of this product code
        if ( !api.isStyle(objArray[0]) ) return false;

        // Test that the material code is three characters
        if ( objArray[1].length !== 3 ) return false;

        // If all rules pass, then this is a style
        return true;

    };
    
    // This method disables the workspace display while content is being loaded
    api.disableWorkspaceDisplay = function () {
    	
        // Set the min-height to keep / maintain the height of the current document while loading
        $cache["workspace"].css("min-height", "500px");
        
        // Initialize the overlay
        $cache["workspace"].ObjectOverlay({
        	overlayText: false,
        	overlayEffect: ["grayscale", "blur"],
        	overlayEffectValue: ["1", "4px"]
        });               	
        
        // Show the overlay prior to requesting image definitions
        $cache["workspace"].ObjectOverlay("show");        
        
    	// Disable the select picker
    	$cache["select-filter"].prop("disabled", "disabled");        
    	$cache["select-filter"].selectpicker("refresh");  
        
    	// Show the loading icon
    	jQuery(".loading-data-icon").css("visibility", "visible");	         	    	
    	
    };

    // This method re-enables the workspace display
    api.enableWorkspaceDisplay = function () {
    	
        // Remove the overlay 
        $cache["workspace"].ObjectOverlay("hide");                    

    	// Enable the select picker
    	$cache["select-filter"].prop("disabled", "");        
    	$cache["select-filter"].selectpicker("refresh");          
        
    	// Hide the loading / in-progress icon
    	jQuery(".loading-data-icon").css("visibility", "hidden");	            	
    	
    };
    
    // This method is used to update the display of the alert object present
    api.showAlert = function (alertType, alertMessage, duration) {
    	
    	// Initialize local variables
    	var $alert, $alertContent;
    	
    	// Default the duration if it has not been defined
    	if ( duration === undefined ) duration = 5000;
    	
    	// Create a reference to the alert display
    	$alert = jQuery("#alert-pane");
    	    	
    	// Initialize the alert
    	$alert.alert();    	    	
    	
    	// Create a reference to the alert content element
    	$alertContent = $alert.find(".alert-content");
    	
    	// Render the message
    	$alertContent.html(alertMessage);
    	
    	// Remove all decorative classes for the current alert
    	$alert.removeClass("alert-success alert-info alert-warning alert-danger hide");

    	// Specify the current decorative class
    	$alert.addClass("alert-" + alertType);
    	
    	// Show the alert
    	$alert.show();
    	
		// Hide the message / fade it out    	
    	window.setTimeout(function() { 			
    		$alert.fadeOut(2000);
		}, duration);    	
    	
    };    
    
    // This method is used to render the ajax service response errors based on what
    // what returned by the "getProductImageDefinitions()" service.
    api.showServiceResponseErrors = function (response) {
    	
		// Default the error-item count
		var itemCount = 0;
		
		var verbContent = "is";
		var pluralSuffix = "s";

		// Add / summarize the total number of invalid styles / materials returned
    	if ( response.hasOwnProperty("INVALIDMATERIALS") ) itemCount = itemCount + response["INVALIDMATERIALS"].length;            		
    	if ( response.hasOwnProperty("INVALIDSTYLES") ) itemCount = itemCount + response["INVALIDSTYLES"].length;            		
		
		// Build out an alertMessage notifying the user that some of the materials that were submitted were invalid
		var alertMessage = "<b>Check Your Entries!</b> &nbsp; ";
		
		// Open the container for the invalid styles list
		alertMessage = alertMessage + '"';
		
		// If the invalidMaterials / styles message was passed, then output the materials that were identified
		if ( response.hasOwnProperty("INVALIDMATERIALS") ) alertMessage = alertMessage + response["INVALIDMATERIALS"].join(", ");
    	if ( response.hasOwnProperty("INVALIDMATERIALS") && response.hasOwnProperty("INVALIDSTYLES") ) alertMessage = alertMessage + ", ";
		if ( response.hasOwnProperty("INVALIDSTYLES") ) alertMessage = alertMessage + ' ' + response["INVALIDSTYLES"].join(", ");

		// Close the container for the invalid styles list		
		alertMessage = alertMessage + ' "';
				
		// Check the itemCount, and adjust the verb display
		if ( itemCount > 1)  verbContent = ' are';

		// Continue building out the error message
		alertMessage = alertMessage + " " + verbContent + " not ";
		
		// Determine if we need to add "a"
		if ( itemCount === 1)  {
		
			// Adjust the text items 
			pluralSuffix = "";
			alertMessage = alertMessage + "a ";

		}
		
		// Append the valid statement
		alertMessage = alertMessage + "valid ";

		// Append the material / style labels.
		if ( response.hasOwnProperty("INVALIDMATERIALS") ) alertMessage = alertMessage + 'material' + pluralSuffix;
    	if ( response.hasOwnProperty("INVALIDMATERIALS") && response.hasOwnProperty("INVALIDSTYLES") ) alertMessage = alertMessage + " / ";
		if ( response.hasOwnProperty("INVALIDSTYLES") ) alertMessage = alertMessage + 'style' + pluralSuffix;
		
		// Close out the alert message
		alertMessage = alertMessage + ".";
		
		// Show the alert message
		api.showAlert("danger", alertMessage);    	
    	    	
    };
    
    // This method is used to process the form submission logic
    api.processFormSubmission = function() {
    	
        // Initialize local variables
        var productCodeEntry;
    	    		
        // Capture the original productCode text
        originalProductCodeText = $cache["style-list"].val();

        // Capture the form-field value, and remove white space
        productCodeEntry = S($cache["style-list"].val()).collapseWhitespace().s;

        // If no value exists, then exit
        if ( productCodeEntry.length === 0 ) {
        	
        	// If so, then show an alert explaining that users should enter at least one style or material code
        	api.showAlert("warning", appConstants["messages"]["ENTER_A_STYLE_ERROR"]);

        	// Place the focus on the form field
        	jQuery("#style-list").focus();
        	            	
        	// Exit the function
        	return;	

        }

        // Check if the entry is at least a valid style or valid material
        if ( !api.isStyle(productCodeEntry) && !api.isMaterial(productCodeEntry) ) {
        	
        	// If so, then show an alert explaining that users should enter at least one style or material code
        	api.showAlert("warning", appConstants["messages"]["ENTER_A_STYLE_ERROR"]);

        	// Place the focus on the form field
        	jQuery("#style-list").focus();
        	            	
        	// Exit the function
        	return;	
        	
        	
        }
        
        // If the current input string matches the last processed one, then exit (no change was made)
        if( productCodeEntry === processedProductCodeText ) return;        

        // Update the style-field with the currated product-code entry
        jQuery("#style-list").val(productCodeEntry);
        
        // Reset the assetFilter purge flag (since we're loading a new product-code)
        hasPurgedEmptyAssetFilterEntries = false;        
        
        // Was a product-code previously specified, and has a new product-code been submitted?
        if( processedProductCodeText !== undefined ) {
        	
        	// Check if a new product code is being requested and un-saved changes exist
        	if ( productCodeEntry !== processedProductCodeText 
        			&& !_.isEqual(originalProductImageDefinitions, productImageDefinitions) ) {
        		
	            // Show the unsaved-changes modal and ask the user to confirm this decision
	            jQuery("#unsaved-changes-advance-modal").modal("show");      
	            
	            // Prevent the "scroll-bar" shifting when modals are shown
	            jQuery("body").css("overflow-y", "scroll");	            
        	
        	} else {
        	
            	// Process the product code entry
            	api.processProductCode();
            	
        	}        	        	
        	
        } else {
        	
        	// Process the product code entry
        	api.processProductCode();
        	
        }
            	
    };         
    
    // This method is used to infer / retrieve the product code from an image file-name
	api.getProductCodeFromImageFileName = function(imageFileName) {
    
		// Loop over the collection of materials
		for ( var thisMaterial in productImageDefinitions[styleCode]["MATERIALS"] ){
			
			// Return the material that was found in the image filename
			if ( imageFileName.indexOf(thisMaterial) !== -1 ) return thisMaterial;
			
		};
		
    };
    
    // This method is used process approved product-code submissions
    api.processProductCode = function () {
    	
        // Reset the form field contents with the updated productCodes array
    	var productCodeEntry = jQuery("#style-list").val();

        // Enable the UI Overlay display
        api.disableWorkspaceDisplay();

    	// Is this a valid material code?
    	if ( api.isMaterial(productCodeEntry) ) {
    		
    		// If so, record it
        	styleCode = productCodeEntry.split("-")[0];        		
    		materialCode = productCodeEntry;
    		variationValue = productCodeEntry.split("-")[1];
    		
    	} else {
    		
    		// Otherwise, set defaults
    		styleCode = productCodeEntry;
    		materialCode = "";
    		variationValue = "";
    		
    	}
    	                
        // Retrieve the product definitions for the identified productCodes                
        setTimeout(function() {
        
        	// Cache the product code text that was processed
        	processedProductCodeText = productCodeEntry;

        	// Process the product codes and retrieve the image definitions
        	api.getProductImageDefinitions(styleCode);

        }, 100);     	
    	
    };
    
    // This function is used to compare the form-field entry against the style / materials that were returned by Demandware
    api.validateFormEntryAgainstImageDefinitions = function () {
    	
    	// Initialize local variables
    	var validationMessage;
    	
    	// Was the form entry a material-code?
    	if ( api.isMaterial(materialCode) ) {
    		
    		// Is the form entry value missing from the materials array?
    		if ( !productImageDefinitions[styleCode]["MATERIALS"].hasOwnProperty(materialCode) ) {
   			
    			// Set the current form field value to the style code
    			$cache["style-list"].val(styleCode);
    			
    			// Reset the processed product code
    			processedProductCodeText = styleCode;
    			
    			// Set the error / validation message -- telling the user that their material was not found.
    			validationMessage = '<b>Whoops!</b> &nbsp;The material "' + materialCode + '" was not found, and the style default is being shown instead of your material.';
    			
    			// Reset the materialCode properties
    			materialCode = "";
    			variationValue = "";
    			    			    			
            	// If so, then show an alert explaining that no materials could be retrieved
            	api.showAlert("warning", validationMessage);    			
    			
    		}
    		    		
    	}
    	    	
    };    
    
    // This function is used to determine the total number of product images configured for a style or material
    api.getProductImageCount = function (productImages) {
    	
    	// Initialize local variables
    	var imageCount;
    	
    	// Default the image count
    	imageCount = 0;
    	
    	// Loop over each of the view types configured
    	for ( var thisViewType in productImages ) {
    		
    		// Derrive the count of all array elements for this image / variant
    		imageCount = imageCount + productImages[thisViewType].length;
    		
    	}
    	
    	// Return the calculate imageCount
    	return imageCount;
    	
    };
    
    // This method is used to calculate the total number of assets configured for a product code
    api.getTotalConfiguredAssetCount = function () {
    	
    	// Initialize local variables
    	var productCode, current, currentCount;  	
    	
    	// Retrieve the selected product-code value
    	productCode = $cache["select-filter"].val();
    	    	
    	// Retrieve the current collection of asset definitions
		current = api.getAssetViewTypes(productCode, productImageDefinitions);
		
		// Default the asset count
		currentCount = 0;
		
		// Loop over each view type and calculate total image-counts
		viewTypes.forEach( function(thisViewType, itemIndex) {
			currentCount = currentCount + current[thisViewType["VIEWTYPE"]].length;
		});
		
		// Return the current count
		return currentCount;
    	
    };    
    
    // This function is used to retrieve the materials-array contents for a given product code
    api.getAssetViewTypes = function(productCode, sourceData) {
    	
    	// Was a source-data argument defined?  If not, default to the current definitions-set
    	if ( arguments.length != 2 ) sourceData = productImageDefinitions;    
    	
    	// Is the current product-code a style or a material?
    	if ( api.isStyle(productCode) ) {

    		// If this is a style, then get the default
    		return sourceData[styleCode]["VIEWTYPES"];

    	} 
    	
    	// Otherwise, get the material-specific assets array containing view-types
    	return sourceData[styleCode]["MATERIALS"][productCode]["VIEWTYPES"];
    	
    };
    
    // This function is used to retrieve the images array for a given product code
    api.getAssetImagesArray = function(productCode, sourceData) {
    	
    	// Was a source-data argument defined?  If not, default to the current definitions-set
    	if ( arguments.length != 2 ) sourceData = productImageDefinitions;    	
    	
    	// Is the current product-code a style or a material?
    	if ( api.isStyle(productCode) ) {

    		// If this is a style, then get the default
    		return sourceData[styleCode]["IMAGES"];

    	} 
    	
    	// Otherwise, get the material-specific images array containing view-types
    	return sourceData[styleCode]["MATERIALS"][productCode]["IMAGES"];
    	
    };    
    
    // This function is used to seed the style / material-specific asset definitions
    api.setAssetViewTypes = function(productCode, assetDefinitions, viewTypeLabel) {

    	// Is the current product-code a style or a material?
    	if ( api.isStyle(productCode) ) {

    		// If this is a style, then set the asset definitions
    		productImageDefinitions[styleCode]["VIEWTYPES"][viewTypeLabel] = assetDefinitions;

    	} else {
    		
    		// Otherwise, set the material-specific asset definitions
    		productImageDefinitions[styleCode]["MATERIALS"][productCode]["VIEWTYPES"][viewTypeLabel] = assetDefinitions;
    		
    	}
        	
    };
    
    // This function is used to seed the images array for a given product code
    api.setAssetImagesArray = function(productCode, imagesArray) {
    	
    	// Is the current product-code a style or a material?
    	if ( api.isStyle(productCode) ) {

    		// If this is a style, then set the images array
    		productImageDefinitions[styleCode]["IMAGES"] = imagesArray;

    	} else {
    		
    		// Otherwise, set the material-specific images array
    		productImageDefinitions[styleCode]["MATERIALS"][productCode]["IMAGES"] = imagesArray;
    		
    	}    	
    	    	
    };     
    
    // This method is used to create the option content for the material selector
    api.getSelectOptionContent = function (imageCount, selectedText, productCode) {
    	
    	// Build out the option-content string using the function arguments
    	var output = '<option data-subtext=" ( ' + imageCount + ' / 0 ) " ' + selectedText + ' value="' + productCode + '"><b>' + productCode + '</b></option>'    	
    	
    	// Return the option content
    	return output;
    	
    };
    
    // This method iterates over all recipe categories and determines which category the current url is mapped to
    api.getRecipeCategoryFromUrl = function(imageUrl) {

    	// Initialize local variables
    	var output;

    	// Default the recipe category
    	output = appConstants["defaultRecipeCategory"];   
    	    	
    	// Iterate over the collection of recipe categories
    	recipeCategories.forEach( function(thisCategory, categoryIndex) {
    		
    		// If the current recipe category is found in the imageUrl, then return the found category
    		if ( imageUrl.indexOf(thisCategory["CATEGORYNAME"]) !== -1 ) {

    			// Seed the recipe category
    			output = thisCategory["CATEGORYNAME"];
    		
    		}
    		
    	});
    	
    	// Return the derrived recipe category
    	return output;

    };
    
    // This method is used to generate a recipe url using the view / category / filename
    api.getImageUrl = function (viewType, recipeCategory, fileName) {

    	// Initialize local variables
    	var output, thisRecipe;
    	
    	// Derrive the recipe fragment using the view-type / category combination
    	thisRecipe = recipeDefinitions["SOURCE"][viewType][recipeCategory];
    	
    	// Build out the recipe url and append the image file-name
    	//output = akamaiUrl + thisRecipe + "&$p_src=is{Underarmour/" + fileName + "}";
    	output = akamaiUrl  + fileName + thisRecipe;
    	
    	// Return the output 
    	return output;   	

    };
    
    // This method is used to retrieve a unique list / collection of view-types
    api.getUniqueImageNames = function (viewTypesCollection) {
    	
    	// Initialize local variables
    	var output = [];
    	
    	// Loop over each view type
    	for ( var thisViewType in viewTypesCollection ){
    		
    		// Loop over each asset associated to this view-type
    		viewTypesCollection[thisViewType].forEach( function(thisAsset, assetIndex) {
    			
    			// Filter out duplicete filenames from our output array
    			if ( output.indexOf(thisAsset["FILENAME"]) === -1 ){
    				output.push(thisAsset["FILENAME"]);
    			}
    			
    		});
    		
    	}
    	
    	// Return the filename array
    	return output;
    	
    };

    // This method is used to seed the view-types asset data for a given product-code
    api.setViewTypeAssetData = function (viewTypeLabel) {
    	
    	// Initialize local variables
    	var $carouselContainer, $carouselItems, $thisCarouselItem, $thisImage,
    		itemClassName, assetsArray, imagesArray, productCode, totalImages,
    		recipeCategory, recipeImageUrl;
    	
    	// Initialize the working arrays
    	assetsArray = [];
    	imagesArray = [];
    	
    	// Retrieve the selected product-code valuethisViewType
    	productCode = $cache["select-filter"].val();    	
    	
    	// Create an instance to the current carousel container / items
    	$carouselContainer = jQuery("#" + viewTypeLabel);

    	// Loop over the individual collection of carousel items
    	for( var arrayIndex=0; arrayIndex < 12; arrayIndex ++ ){
    		
    		// Create a reference to each item's class name
    		itemClassName = ".carousel-item.item" + arrayIndex;

    		// Retrieve each of the carousel items that match this class
    		$carouselItems = $carouselContainer.find(itemClassName);
    		
    		// Loop over the carousel-items, and retrieve the image urls and file-names used
    		$carouselItems.each( function(itemIndex, thisItem) {
    			
    			// Create a reference to the current item
    			$thisCarouselItem = jQuery(thisItem);
    			
    			// Don't process entries with the "bx-clone" class
    			if ( $thisCarouselItem.hasClass("bx-clone") ) return;
    			
    			// Create a reference to the current image
    			$thisImage = $thisCarouselItem.find("img");
    			
    			// Don't process images with the "ua-placeholder" class
    			if ( $thisImage.hasClass("ua-placeholder") ) return;
    			
    			// Derrive the recipe category applied to this image
    			recipeCategory = api.getRecipeCategoryFromUrl($thisImage.attr("src"));
    			
    			// Build out the recipe iamge url using the view-type and recipe-category
    			recipeImageUrl = api.getImageUrl(viewTypeLabel, recipeCategory, $thisImage.attr("title"));
    			
    			// Archive the current image
    			assetsArray.push({
    				FILENAME: $thisImage.attr("title"),
    				URL: recipeImageUrl
    			});
    			
    		});
    		
    	}

    	// Is the current product-code the root style?
    	if ( styleCode === productCode ) {
    		
    		// If so, then update the assets array for the specified view-type
        	productImageDefinitions[styleCode]["VIEWTYPES"][viewTypeLabel] = assetsArray;
        	productImageDefinitions[styleCode]["IMAGES"] = api.getUniqueImageNames(productImageDefinitions[styleCode]["VIEWTYPES"]);

    	} else {
    		
    		// Otherwise, update the assets array for the specified view-type / material combination
    		productImageDefinitions[styleCode]["MATERIALS"][productCode]["VIEWTYPES"][viewTypeLabel] = assetsArray;
        	productImageDefinitions[styleCode]["IMAGES"] = api.getUniqueImageNames(productImageDefinitions[styleCode]["MATERIALS"][productCode]["VIEWTYPES"]);
    		
    	}
    	
    	// With data updated, let's update / render the material roll-up display
    	api.renderMaterialRollupDisplay();
    	
    	// Toggle the global button display
    	api.toggleGlobalClearButton();
    	api.toggleGlobalResetButton();
    	api.toggleSaveAllButton();
    	
    };    

    // This method is used to show that a given material has been edited
    api.showMaterialAsEdited = function () {

        // Revert the styling of the carousel title
        jQuery(".panel-title-bar .carousel-title").addClass("has-changed");

        // Show the edited icon display
        jQuery(".edit-icon-label").show();

    };

    // This method is used to revert a material title back to its original state
    api.showMaterialAsUnChanged = function () {

        // Revert the styling of the carousel title
        jQuery(".panel-title-bar .carousel-title").removeClass("has-changed");

        // Hide the edited icon display
        jQuery(".edit-icon-label").hide();

    };

    // This method is used to enable the global clear button
    api.enableGlobalClearButton = function () {
    	
    	// Enable clear button and add the active treatment
    	jQuery(".btn-global-clear").addClass("carousel-button-enabled");
    	jQuery(".btn-global-clear").removeClass("disabled");
    	
    };    
    
    // This method is used to disable the global clear button
    api.disableGlobalClearButton = function () {
    	
    	// Disable clear button and remove the active treatment
    	jQuery(".btn-global-clear").removeClass("carousel-button-enabled");
    	jQuery(".btn-global-clear").addClass("disabled");
    	
    };
    
    // This method is used to enable the global reset button
    api.enableGlobalResetButton = function () {
    	
    	// Enable reset button and add the active treatment
    	jQuery(".btn-global-reset").addClass("carousel-button-enabled");
    	jQuery(".btn-global-reset").removeClass("disabled");
    	
    };    
    
    // This method is used to disable the global reset button
    api.disableGlobalResetButton = function () {
    	
    	// Disable reset button and remove the active treatment
    	jQuery(".btn-global-reset").removeClass("carousel-button-enabled");
    	jQuery(".btn-global-reset").addClass("disabled");
    	
    };      
    
    // This method is used to enable the global save button
    api.enableGlobalSaveButton = function () {
    	
    	// Enable reset button and add the active treatment
    	jQuery(".btn-global-save").addClass("carousel-button-enabled");
    	jQuery(".btn-global-save").removeClass("disabled");
    	
    };    
    
    // This method is used to disable the global save button
    api.disableGlobalSaveButton = function () {
    	
    	// Disable reset button and remove the active treatment
    	jQuery(".btn-global-save").removeClass("carousel-button-enabled");
    	jQuery(".btn-global-save").addClass("disabled");    	
    	
    };       
    
    // This method is used to enable the global save-all button
    api.enableGlobalSaveAllButton = function () {
    	
    	// Enable reset button and add the active treatment
    	jQuery(".btn-global-save-all").addClass("carousel-button-enabled");
    	jQuery(".btn-global-save-all").removeClass("disabled");
    	
    };    
    
    // This method is used to disable the global save-all button
    api.disableGlobalSaveAllButton = function () {
    	
    	// Disable reset button and remove the active treatment
    	jQuery(".btn-global-save-all").removeClass("carousel-button-enabled");
    	jQuery(".btn-global-save-all").addClass("disabled");    	
    	
    };     
    
    // This method is used to enable / disable the save button for a given material
    api.toggleGlobalSaveResetButtons = function () {
    	
    	// Has the current material / product code changed?
    	if ( api.hasProductCodeChanged() ) {
    		
    		// If so, enable the save / reset buttons
    		api.enableGlobalSaveButton();
    		api.enableGlobalResetButton();      		
    		
    		// Update the product-code title to show this product-code as editable
            api.showMaterialAsEdited();

    	} else {
    		
    		// Otherwise, disable them
    		api.disableGlobalSaveButton();
    		api.disableGlobalResetButton();    		
    		
    		// Update the product-code title to show this product-code as not having changed
            api.showMaterialAsUnChanged();

        }
    	
    };
    
    // This method is used to enable / disable the save button for a given material
    api.toggleGlobalResetButton = function () {
    	
    	// Has the current material / product code changed?
    	if ( api.hasProductCodeChanged() ) {
    		
    		// If so, enable the Reset Button
    		api.enableGlobalResetButton();

            // Update the product-code title to show this product-code as editable
            api.showMaterialAsEdited();

    	} else {
    		
    		// Otherwise, disable the Reset Button
    		api.disableGlobalResetButton();

            // Update the product-code title to show this product-code as not having changed
            api.showMaterialAsUnChanged();

    	}
    	
    };

    // This method is used to enable / disable the save-all button
    api.toggleSaveAllButton = function () {
    	
    	// Initialize local variables
    	var currentCount;
    	
    	// Default the count property
    	currentCount = 0;    	
    	
    	// If a change was made to the current product code, then increment the counter
    	if ( api.hasProductCodeChanged(styleCode) ) currentCount = currentCount + 1;
    	
    	// Loop over each material, and see if it's definition has changed
    	for ( var thisMaterialCode in productImageDefinitions[styleCode]["MATERIALS"] ) {
    		
    		// If a change was made to this material, then increment the counter
    		if ( api.hasProductCodeChanged(thisMaterialCode) ) currentCount = currentCount + 1;
    		
    		// Edit the loop if the counter is greater than 1
    		if ( currentCount > 1 ) break;
    		
    	}
    		
		// If there at least one image configured for this material?
		if ( currentCount > 0 ) {
		    		
    		// If so, then enable the global save-all button
    		api.enableGlobalSaveAllButton();    	
    		
		} else {
			
    		// Otherwise, disable the global save-all button
    		api.disableGlobalSaveAllButton();  	
			
		}
		
    } ;
    
    // This method is used to enable / disable the save button
    api.toggleGlobalClearButton = function () {
    	
    	// Initialize local variables
    	var productCode, current, currentCount;
    	
    	// Retrieve the selected product-code 
    	productCode = $cache["select-filter"].val();   

    	// Retrieve the current collection of assets for this code
    	current = api.getAssetViewTypes(productCode, productImageDefinitions);

    	// Default the count property
    	currentCount = 0;
    	
		// Loop over each view type and calculate total image-counts
		viewTypes.forEach( function(thisViewType, itemIndex) {

			// Calculate the total image-counts originally and for the current configuration
			currentCount = currentCount + current[thisViewType["VIEWTYPE"]].length;
			
		});
	
		// If there at least one image configured for this material?
		if ( currentCount !== 0 ) {
		    		
    		// If so, then enable the clear button
    		api.enableGlobalClearButton();    	
    		
		} else {
			
    		// Otherwise, disable the clear button
    		api.disableGlobalClearButton();  	
			
		}
		
    };
        
    // This method is used to enable the clear button
    api.enableClearButton = function ($clearButton) {
    	
    	// Enable clear button and add the active treatment
    	$clearButton.addClass("carousel-button-enabled");
    	$clearButton.removeClass("disabled");
    	
    };    
    
    // This method is used to disable the clear button
    api.disableClearButton = function ($clearButton) {
    	
    	// Disable clear button and remove the active treatment
    	$clearButton.removeClass("carousel-button-enabled");
    	$clearButton.addClass("disabled");
    	
    };
    
    // This method is used to enable the reset button
    api.enableResetButton = function ($resetButton) {
    	
    	// Enable reset button and add the active treatment
    	$resetButton.addClass("carousel-button-enabled");
    	$resetButton.removeClass("disabled");
    	
    };    
    
    // This method is used to disable the reset button
    api.disableResetButton = function ($resetButton) {
    	
    	// Disable reset button and remove the active treatment
    	$resetButton.removeClass("carousel-button-enabled");
    	$resetButton.addClass("disabled");
    	
    };    
    
    // This method is used to determine if the assets associated to a view-type have changed
    api.hasViewTypeChanged = function (viewTypeLabel) {
    	
    	// Initialize local variables
    	var productCode, original, current;
    	
    	// Retrieve the selected product-code 
    	productCode = $cache["select-filter"].val();    
    	
    	// Get the original and current assetViewType collections
    	current = api.getAssetViewTypes(productCode);
    	original = api.getAssetViewTypes(productCode, originalProductImageDefinitions);
    	
    	// Return whether both objects are equal (if they are not equal, return true)
    	return !_.isEqual(current[viewTypeLabel], original[viewTypeLabel]);
    	
    };

    // This method is used to determine if the assets associated to a product-code have changed
    api.hasProductCodeChanged = function (productCode) {
    	
    	// Initialize local variables
    	var original, current;
    	
    	// Default the product-code if one has not been provided
    	if ( arguments.length === 0 ) productCode = $cache["select-filter"].val();
    	
    	// Get the original and current assetViewType collections
    	current = api.getAssetViewTypes(productCode);
    	original = api.getAssetViewTypes(productCode, originalProductImageDefinitions);

    	// Return whether both objects are equal (if they are not equal, return true)
    	return !_.isEqual(current, original);
    	
    };

    // This method is used to reset the physical view-type data for a given productCode
    api.resetViewTypeAssetData = function(viewTypeLabel) {
    	
    	// Initialize local variables
    	var productCode, originalAssets, originalImages
    	
		// Get the current selected item
		productCode = $cache["select-filter"].val();
		
		// Retrieve the original / current image definitions
    	originalAssets = api.getAssetViewTypes(productCode, originalProductImageDefinitions);
    	originalImages = api.getAssetImagesArray(productCode, originalProductImageDefinitions);

    	// With the original values retrieved, re-set their values
    	api.setAssetImagesArray(productCode, _.clone(originalImages));
    	api.setAssetViewTypes(productCode, _.clone(originalAssets[viewTypeLabel]), viewTypeLabel);
    	      	    	
    };    
    
    // This method is used to reset all carousels with their original data    
    api.resetAllCarouselItems = function() {
		
		 // Iterate over each view-type
		 viewTypes.forEach( function(thisViewType, arrayIndex) {
			
			 // If this viewType hasn't changed, then don't reset it
	    	 if ( !api.hasViewTypeChanged(thisViewType["VIEWTYPE"]) ) return;
			 
			 // Create areference to the current carousel container
			 var $carouselContainer = jQuery("#" + thisViewType["VIEWTYPE"]);
			 
			 // Reset each of the carousels 
			 api.resetCarouselItems($carouselContainer);
			 			 
		 });        	
		 
    };
    
    // This method is used to reset a given carousel with its original set of display assets
    api.resetCarouselItems = function ($carouselContainer) {
    	
    	// Initialize local variables
    	var productCode, viewTypeLabel, materialViewTypes, imagesArray, $clearButton, $resetButton;
    	
    	// First, clear all the items in the current carousel
    	api.clearCarouselItems($carouselContainer, false);
    	
    	// Retrieve the selected product-code 
    	productCode = $cache["select-filter"].val();    	
    	
    	// Capture the view-type associated to this carousel
    	viewTypeLabel = $carouselContainer.attr("id");
    	    	
    	// Retrieve the view-types array contents for the current selection
    	materialViewTypes = api.getAssetViewTypes(productCode, originalProductImageDefinitions);
    	imagesArray = api.getAssetImagesArray(productCode, originalProductImageDefinitions);

        // Remove the edited treatment from all carousel items
        api.removeEditedTreatment(viewTypeLabel);

		// Render the specific view-type carousel for this view-type / material combination
		api.renderViewTypeCarousel(viewTypeLabel, materialViewTypes, imagesArray, true);

		// Update the image definition data with these changes
		api.resetViewTypeAssetData(viewTypeLabel);		
		
		// Create references to the carousel control buttons
		$clearButton = $carouselContainer.find(".btn-clear");
		$resetButton = $carouselContainer.find(".btn-reset");
		
    	// Disable / enable the clear and reset buttons
    	api.enableClearButton($clearButton);
    	api.disableResetButton($resetButton);
    	
		// Revert the styling on the view-type label
		api.revertViewTypeLabel(viewTypeLabel);    	
		
		// Update the global button display for this material
		api.toggleGlobalClearButton();
		api.toggleSaveAllButton();
		api.toggleGlobalResetButton();
		
		// Update the material-rollup display to include this change
		api.renderMaterialRollupDisplay();		

    };

    // For each view-type, remove the edited treatment
    api.removeEditedTreatments = function () {

        // Iterate over each view-type, and remove the edited treatment
        viewTypes.forEach( function(thisViewType, viewTypeIndex) {

            // Remove the edited treatment for each view-type
            api.removeEditedTreatment(thisViewType["VIEWTYPE"], true);

            // Revert the display of the view-type label for each carousel
            api.revertViewTypeLabel(thisViewType["VIEWTYPE"]);

        });

    };

    // This method is used to remove the edited treatment from carousel items
    api.removeEditedTreatment = function (viewTypeLabel, byPassChangeCheck) {

        // Initialize local variables
        var $carouselContainer, $carouselItems, $thisItem;

        // Don't apply the edited treatment if the view-type has not changed
        if ( !api.hasViewTypeChanged(viewTypeLabel) && byPassChangeCheck !== true ) return;

        // Create a reference to the current carousel container
        $carouselContainer = jQuery("#" + viewTypeLabel);

        // Loop over the collection of carousel items
        for ( var itemIndex=0; itemIndex < 12; itemIndex ++ ) {

            // Create a reference to the current carousel item being evaluated
            $carouselItems = $carouselContainer.find("ul.carousel li.item" + itemIndex);

            // Loop over the collection of carousel items that were found
            $carouselItems.each( function(itemIndex, thisItem) {

                // Create a reference to the current carousel item being evaluated
                $thisItem = jQuery(thisItem);

                // Otherwise, remove the edited border
                $thisItem.removeClass("carousel-item-edited");

            });

        }

    };

    // This method is used to clear-out / remove all asset images from the view-type carousels
    api.clearAllCarousels = function(setAssetDataFlag) {
    	
		// Default the set flag (the default is do not update data)
		if ( arguments.length === 0 ) setAssetDataFlag = false;
		
		 // Iterate over each view-type
		 viewTypes.forEach( function(thisViewType, arrayIndex) {
			
			 // Create areference to the current carousel container
			 var $carouselContainer = jQuery("#" + thisViewType["VIEWTYPE"]);
			 
			 // Clear each of the carousels (don't write asset-data while they are being set)
			 api.clearCarouselItems($carouselContainer, false);
			
			 // If the set-flag is enabled, then set the asset-data for the current view-type
			 if ( setAssetDataFlag ) api.setViewTypeAssetData(thisViewType["VIEWTYPE"]);
			 			 
		});    	
		 
		// Toggle the global display buttons
		api.toggleGlobalResetButton();
		api.toggleGlobalClearButton();	 		 
		api.toggleSaveAllButton();
    }

    // This method is used to clear a given carousel of display assets and reset each cell
    api.clearCarouselItems = function ($carouselContainer, setAssetData) {
    	
    	// Initialize local variables
    	var $carouselItems, itemClassLabel, $clearButton, $resetButton, viewTypeLabel;
    	    
    	// Default the set asset-data flag
    	if ( arguments.length === 1 ) setAssetData = true;
    	
    	// Loop over the collection of carousel items by their index
    	for ( var arrayIndex=0; arrayIndex < 12; arrayIndex ++ ){
    		
    		// Build out the item class label to identify series of items
    		itemClassLabel = ".carousel-item.item" + arrayIndex;
    		
    		// Retrieve each of the carousel items that match the item-class
        	$carouselItems = $carouselContainer.find(itemClassLabel);
    		
    		// Clear out and reset each of the carousel items
    		api.clearCarouselItem($carouselItems, false);

    	}
     	
    	// Create a reference to the current clear-button for this carousel
    	$clearButton = $carouselContainer.find(".btn-clear");
    	$resetButton = $carouselContainer.find(".btn-reset");
 	
    	// Capture the view-type associated to this carousel
    	viewTypeLabel = $carouselContainer.attr("id");    	    	
    	
    	// Should asset-data be set?  
    	if ( setAssetData === true ) {
    		
    		// Update the image definition data with these changes
    		api.setViewTypeAssetData(viewTypeLabel);	    	
    		    	    		
    	}

		// Denote that the current view-type is being edited
		api.showViewTypeLabelHasChanges(viewTypeLabel);       	
    	
		// Update the material-rollup display with this change
		api.renderMaterialRollupDisplay();		   
    	
    	// Disable the carousel-specific clear button
    	api.disableClearButton($clearButton);
    	
		// Enable the reset-button for this view-type
		api.enableResetButton($resetButton);
    			
    }

    // This method is used to render the view-type label in a manner that depicts the viewtype has saveable changes
    api.showViewTypeLabelHasChanges = function(viewTypeLabel) {
    	
    	// Initialize local variables
    	var $carouselContainer, $viewTypeDisplay;
    	
    	// Create a reference to the current carousel container
    	$carouselContainer = jQuery("#" + viewTypeLabel);
    	$viewTypeDisplay = $carouselContainer.find(".carousel-title");
    	$viewTypeDisplay.addClass("has-changed");

        // Update the product-code title to show this product-code as editable
        api.showMaterialAsEdited();

    };
    
    // This method is used to render the view-type label in a manner that depicts the viewtype has saveable changes
    api.revertViewTypeLabel = function(viewTypeLabel) {
    	
    	// Initialize local variables
    	var $carouselContainer, $viewTypeDisplay;
    	
    	// Create a reference to the current carousel container
    	$carouselContainer = jQuery("#" + viewTypeLabel);
    	$viewTypeDisplay = $carouselContainer.find(".carousel-title");
    	$viewTypeDisplay.removeClass("has-changed");
    	
    	// If the global clear button is not enabled, then no changes exist
    	if ( jQuery(".btn-global-reset").hasClass("disabled") ) {

            // Update the product-code title to show this product-code as not having changed
            api.showMaterialAsUnChanged();

    	}
    	
    };    
    
    // This method is used to clear-out a given carousel item and reset its display
    api.clearCarouselItem = function ($carouselItems, seedViewTypeData, updateOrInsert) {
    	
    	// Initialize local variables
    	var $carouselImage, $fileNameLabel, $thisCarouselItem, $infoIcon,
    		$carouselContainer, $resetButton, viewTypeLabel;
    	
    	// Default the "setViewType" flag
    	if ( arguments.length === 1) seedViewTypeData = true;

        // Default the update / insert argument
        if ( updateOrInsert === undefined ) updateOrInsert = "update";

    	// Loop over the carousel items, and reset the item state
    	$carouselItems.each( function(itemIndex, thisItem) {

    		// Create a reference to the current object
    		$thisCarouselItem = jQuery(thisItem);
            $infoIcon = $thisCarouselItem.find(".info-icon");

            // Is this an insert?  Then let's record the original values
            if ( updateOrInsert === "insert" ) {

                // Initialize the original recipe-category and label for the placeholder asset
                $thisCarouselItem.data("orig-file-name", "ua-placeholder");
                $thisCarouselItem.data("orig-recipe-category", "none");

            }

            // Seed and default the info-icon editable properties
            $infoIcon.removeData("file-name");
            $infoIcon.data("recipe-category", "none");

	    	// Create a reference to the carousel image
	    	$carouselImage = $thisCarouselItem.find("a.manage-image img");
	    	
	    	// Don't re-set this carousel item if it's already a placeholder
	    	if ( $carouselImage.hasClass("ua-placeholder") ) return;

	    	// Create an instance to the current filename label and clear its contents
	    	$fileNameLabel = $thisCarouselItem.find(".image-filename");
	    	$fileNameLabel.css("display", "none");
	    	$fileNameLabel.html("");
	    	
	    	// Reset the display of the carousel image
	    	$carouselImage.addClass("ua-placeholder");
	    	$carouselImage.attr("src", appConstants["carouselPlaceholderImageUrl"]).hide().fadeIn(250);
	    	$carouselImage.attr("title", "");
	    	
	    	// Disable each of the hover elements
	    	$thisCarouselItem.find(".hover-elements").css("display", "none");
    	    		
    	});        	   	    	
	    
    	// Derrive the parent carousel container for this collection of items
    	$carouselContainer = $thisCarouselItem.closest(".carousel-container");
    	$resetButton = $carouselContainer.find(".btn-reset");
    	
    	// Render the carousel item count for the current carousel
    	api.renderCarouselLabelDisplay($carouselContainer);
    	    	
    	// Capture the view-type associated to this carousel
    	viewTypeLabel = $carouselContainer.attr("id");    	    	
    	
    	// Only seed the view-type data if this action isn't being over-ridden
    	if ( seedViewTypeData ) {
    		
    		// Update the image definition data with these changes
    		api.setViewTypeAssetData(viewTypeLabel);	    	    		    	    	
        	
    	}
    	
    	// If a change has registered for this view-type, then enable the reset-button
    	if ( api.hasViewTypeChanged(viewTypeLabel) ) {
    	
    		// Enable the reset-button for this view-type
    		api.enableResetButton($resetButton);
    		
    		// Change the styling on the view-type label, to denite that it's being edited
    		api.showViewTypeLabelHasChanges(viewTypeLabel);
    		
    	} else {
    		
    		// Disable the reset-button for this view-type
    		api.disableResetButton($resetButton);    		
    		
    		// Otherwise, revert the view-type label treatment
    		api.revertViewTypeLabel(viewTypeLabel);    		
    		
    	}       	
    	    	
    };
     
    // This method is used to update the count / status of a given material roll-up
	api.renderMaterialRollupDisplay = function() {
		
		// Initialize local variables
		var original, current, currentCount, originalCount, productCode, 
			$selectedOption, $selectedAssetFilterOption, subtextLabel, s7AssetCount;
		
		// Initialize the image-counts
		currentCount = 0;
		originalCount = 0;
		s7AssetCount = 0;
				
		// Get the current selected item
		productCode = $cache["select-filter"].val();

		// Only calculate asset-counts for materials
		if ( api.isMaterial(productCode) ) {
			
			// If the current product code is a material, then capture the asset count
			if ( s7Assets.hasOwnProperty(productCode) ) s7AssetCount = s7Assets[productCode].length;
			
		}		
		
		// Retrieve the original / current image definitions
		original = api.getAssetViewTypes(productCode, originalProductImageDefinitions);
		current = api.getAssetViewTypes(productCode, productImageDefinitions);
		
		// Loop over each view type and calculate total image-counts
		viewTypes.forEach( function(thisViewType, itemIndex) {

			// Calculate the total image-counts originally and for the current configuration
			currentCount = currentCount + current[thisViewType["VIEWTYPE"]].length;
			originalCount = originalCount + original[thisViewType["VIEWTYPE"]].length;
			
		});
				
		// Retrieve the current option associated to the selected product-code
		$selectedOption = $cache["select-filter"].find('option[value="' + productCode + '"]');
		
		// Build out the subtext label for the current display
		subtextLabel = " ( " + currentCount + " / " + s7AssetCount + " ) ";
		
		// Has this material changed?
		if ( !_.isEqual(original, current) ) {

			// If so, then render the edit icon (showing that this has a pending change)
			$selectedOption.data("icon", "glyphicon glyphicon-edit");			
			
		} else {
		
			// Otherwise, remove the edit icon (since the displays are the same)
			$selectedOption.data("icon", "");			

		}
		
		// Update the sub-text label for this option
		$selectedOption.data("subtext", subtextLabel);
		
		// Is the current product-code being processed a material code?
		if ( api.isMaterial(productCode) ) {
		
			// Update the asset-filter to reflect the change
			$selectedAssetFilterOption = $cache["asset-filter"].find('option[value="' + productCode + '"]');		
			$selectedAssetFilterOption.data("subtext", subtextLabel);
				
			// Refresh the asset-filter display
			$cache["asset-filter"].selectpicker("refresh");			
			
		}
				
		// Refresh the select-filter display
		$cache["select-filter"].selectpicker("refresh");
		
		// Update the UI display with the configured count for this product code
		jQuery(".carousel-title .productcode-image-count").html(currentCount);
		
	};    
    
    // This method is used to update the carousel label display
    api.renderCarouselLabelDisplay = function ($carouselContainer) {
    	
    	// Initialize local variables
    	var itemCount, placeholderCount, assetCount;
    	
    	// Establish the counts of total assets displayed for this carousel
    	placeholderCount = $carouselContainer.find(".ua-placeholder").length;
    	itemCount = $carouselContainer.find(".carousel-item").length;
    	
    	// Calculate the total number of assets remaining
    	assetCount = (itemCount - placeholderCount) / 2;
    	
    	// Update the image count with the derrived asset-count
    	$carouselContainer.find(".image-count").html(assetCount);
    	
    };
        
    // This function is used to render the updated product images display
    api.renderProductImagesDisplay = function () {
    	
    	// Disable the UI display
		api.disableWorkspaceDisplay();    	
		
    	// Initialize and render the select filter
    	api.renderSelectFilter();

    	// Check if we have any viewType carousels rendered
    	if ( jQuery("#panel-workspace .carousel-container").length === 0 ) {

    		// If not, then render the initial set or carousels
    		setTimeout(function() {
        		api.renderViewTypeCarousels();
    		}, 100)    		

    	}
    	
    	// Re-enable the workspace display
		setTimeout(function() {
				    	
	    	// Reset the display fo each view-type label
	    	jQuery(".carousel-title").removeClass("has-changed");					
			
			// Clear each of the carousels that are visible
			api.clearAllCarousels();
			
	    	// Render the material assets for the selected product
	    	api.renderMaterialAssets(true);			
			
	    	// Re-enable the UI display
			api.enableWorkspaceDisplay();
			
		}, 100)
		
    };  
        
    // This method is used to enable / disable the carousel control buttons for a given viewType
    api.enableCarouselControlButtons = function (assetCount, viewTypeLabel) {
    	
    	// Initialize local variables
    	var $clearButton, $resetButton;
    	
    	// Initialize the button references
    	$clearButton = jQuery("#" + viewTypeLabel + " .btn-clear");
    	$resetButton = jQuery("#" + viewTypeLabel + " .btn-reset");
    	
    	// Are any assets enabled for this view-type?
    	if ( assetCount === 0 ) {
    		
            // If not, then disable the clear button
    		api.disableClearButton($clearButton);
    		
    	} else {
    		
            // Otherwise, enable the clear button
    		api.enableClearButton($clearButton); 
		
    	}

        // By default, the reset button should not be enabled
		api.disableResetButton($resetButton);	
    			
    };
    
    // This method is used to move a carousel item a given direction
    api.moveCarouselItem = function ($sourceCarouselItems, $carousel, sourceClassName, direction) {
    	
    	// Initialize local variables
    	var carouselIndex, targetCarouselIndex, targetClassName, viewTypeLabel, sourceImageUrl,
    		sourceImageFileName, sourceRecipeCategory, targetImageUrl, targetImageFileName, 
    		targetRecipeCategory, hasUAPlaceholder, $targetCarouselItems, $thisItem, $thisImage, 
    		$infoIcon, $recipeCategory, $fileName, $carouselContainer, $resetButton;
    	
    	// Identify the current carousel index
    	carouselIndex = parseInt(sourceClassName.replace("item", ""));
    	
    	// Calculate the next position of the current tile
    	if ( direction === "right") {
    		
    		// Wrap the target carousel-item if it's on the right edge
        	if ( carouselIndex === 11 ) {
        		targetCarouselIndex = 0;
        	} else {
        		targetCarouselIndex = carouselIndex + 1;
        	}
    		    		
    	} else {
    		
    		// Wrap the target carousel-item if it's on the left edge    		
        	if ( carouselIndex === 0 ) {
        		targetCarouselIndex = 11;
        	} else {
        		targetCarouselIndex = carouselIndex - 1;
        	}
    		
    	}
    	
    	// Capture the source data that will be applied to the targets
    	sourceImageUrl = $sourceCarouselItems.find("img").attr("src");
    	sourceImageFileName = $sourceCarouselItems.find(".info-icon").data("file-name");
    	sourceRecipeCategory = $sourceCarouselItems.find(".info-icon").data("recipe-category");    	
    	
    	// Build out the target class-name that will be used to retrieve the target elements
    	targetClassName = ".item" + targetCarouselIndex.toString();
    	
    	// Retrieve the target carousel items
    	$targetCarouselItems = $carousel.find(targetClassName);
    	
    	// Get the viewTypeLabel, as we need that to set the changed data
    	$carouselContainer = $carousel.closest(".carousel-container");
    	viewTypeLabel = $carouselContainer.attr("id");
    	
    	// Create a reference to the reset button (we may need to enable it)
    	$resetButton = $carouselContainer.find(".btn-reset");

    	// Capture the original taget data that will be applied to the source carousel items
    	targetImageUrl = $targetCarouselItems.find("img").attr("src");
    	targetImageFileName = $targetCarouselItems.find(".info-icon").data("file-name");
    	targetRecipeCategory = $targetCarouselItems.find(".info-icon").data("recipe-category"); 	
    	hasUAPlaceholder = $targetCarouselItems.find("img").hasClass("ua-placeholder");
    	
    	// Loop over the target items, and render them
    	$targetCarouselItems.each( function(itemIndex, thisItem) {
    		
    		// Create references to elements that need to be updated
    		$thisItem = jQuery(thisItem);
    		$thisImage = $thisItem.find("img");
    		$infoIcon = $thisItem.find(".info-icon");
    		$recipeCategory = $thisItem.find(".recipe-category");
    		$fileName = $thisItem.find(".image-filename");

    		// Remove the ua-placeholder class if it's present
    		$thisImage.removeClass("ua-placeholder");
    		
    		// Seed the data that should be applied to the target items
    		$thisImage.attr("src", sourceImageUrl).hide().fadeIn(500);
    		$thisImage.attr("title", sourceImageFileName);
    		$infoIcon.data("file-name", sourceImageFileName);
    		$infoIcon.data("recipe-category", sourceRecipeCategory);

    		// Update the mark-up for the tooltips / labels
    		$recipeCategory.html(sourceRecipeCategory);
    		$fileName.css("display", "block");
    		$fileName.html(sourceImageFileName);
    		
    	});
    	
    	// Loop over the source items, and render them
    	$sourceCarouselItems.each( function(itemIndex, thisItem) {
    		
    		// Create references to elements that need to be updated
    		$thisItem = jQuery(thisItem);
    		$thisImage = $thisItem.find("img");
    		$infoIcon = $thisItem.find(".info-icon");
    		$recipeCategory = $thisItem.find(".recipe-category");
    		$fileName = $thisItem.find(".image-filename");

            // Determine what kind of item is being rendered
    		if ( hasUAPlaceholder ) {

        		// Add the UA Place holder class
        		$thisImage.addClass("ua-placeholder");

                // Default the place-holder data elements
                $infoIcon.removeData("file-name");
                $infoIcon.data("recipe-category", "none");

        		// Render the place-holder specific treatment
        		$thisImage.attr("src", targetImageUrl);        		
        		$fileName.css("display", "none");
        		
        		// Hide any active hover-elements
        		$thisItem.find(".hover-elements").fadeOut(250);
        		
    		} else {
    			
        		// Remove the ua-placeholder class
        		$thisImage.removeClass("ua-placeholder");

        		// Seed the data that should be applied to the target items
        		$thisImage.attr("src", targetImageUrl).hide().fadeIn(500);
        		$thisImage.attr("title", targetImageFileName);        		
        		$infoIcon.data("file-name", targetImageFileName);
        		$infoIcon.data("recipe-category", targetRecipeCategory);

        		// Update the mark-up for the tooltips / labels
        		$recipeCategory.html(targetRecipeCategory);
        		$fileName.css("display", "block");
        		$fileName.html(targetImageFileName);        		
        		
    		}

    	}); 
    	
    	// Update the asset data for this view-type 
    	api.setViewTypeAssetData(viewTypeLabel);

        // Show and highlight which items were edited
        api.showCarouselItemsAsEdited(viewTypeLabel);
    	
    	// If a change has registered for this view-type, then enable the reset-button
    	if ( api.hasViewTypeChanged(viewTypeLabel) ) {
    	
    		// Enable the reset-button for this view-type
    		api.enableResetButton($resetButton);
    		
    		// Change the styling on the view-type label, to denite that it's being edited
    		api.showViewTypeLabelHasChanges(viewTypeLabel);
    		
    	} else {

    		// Disable the reset-button for this view-type
    		api.disableResetButton($resetButton);    	    		
    		
    		// Otherwise, revert the display of the view-type label
    		api.revertViewTypeLabel(viewTypeLabel);

    	}

    };

    // This method iterates over a collection of view-types, and identifies which items were edited
    api.showCarouselItemsAsEdited = function (viewTypeLabel) {

        // Initialize local variables
        var $carouselContainer, $carouselItems, $thisItem, $infoIcon;

        // Create a reference to the current carousel container
        $carouselContainer = jQuery("#" + viewTypeLabel);

        // Loop over the collection of carousel items
        for ( var itemIndex=0; itemIndex < 12; itemIndex ++ ) {

            // Create a reference to the current carousel item being evaluated
            $carouselItems = $carouselContainer.find("ul.carousel li.item" + itemIndex);

            // Loop over the collection of carousel items that were found
            $carouselItems.each( function(itemIndex, thisItem) {

                // Create a reference to the current carousel item being evaulated
                $thisItem = jQuery(thisItem);

                // Create a reference to the current item's info-icon
                $infoIcon = $thisItem.find(".info-icon");

                // Check if the file-name or recipe-category has changed for this asset
                if (
                    ($infoIcon.data("file-name") !== $thisItem.data("orig-file-name") && $infoIcon.data("file-name") !== undefined) ||
                    ($infoIcon.data("recipe-category") !== $thisItem.data("orig-recipe-category") && $infoIcon.data("recipe-category") !== undefined)
                ) {

                    // If so, then show the item as edited
                    $thisItem.addClass("carousel-item-edited");

                } else {

                    // Otherwise, remove the edited border
                    $thisItem.removeClass("carousel-item-edited");

                }

            });

        }

    };

    // This function is used to render the viewType assets for a given material
    api.renderMaterialAssets = function (backfillEmptyTiles) {
    	
    	// Initialize local variables
    	var productCode, currentCount, materialViewTypes, imagesArray;
    	
    	// Provide a default for the empty tiles flag
    	if ( arguments.length === 0 ) backfillEmptyTiles = false;
    	
    	// Retrieve the selected product-code value
    	productCode = $cache["select-filter"].val();
		
		// Default the asset count for this product code
		currentCount = api.getTotalConfiguredAssetCount();
				
    	// Render the product-code on the page
    	jQuery(".productcode-label").html(productCode);		
    	jQuery(".productcode-image-count").html(currentCount);		
    	
    	// Retrieve the view-types array contents for the current selection
    	materialViewTypes = api.getAssetViewTypes(productCode);
    	imagesArray = api.getAssetImagesArray(productCode);
    	
    	// Iterate over the viewTypes, and render an instance of the carousel-template
    	viewTypes.forEach( function(thisViewType, arrayIndex) {
    		
    		// Render the specific view-type carousel for this view-type / material combination
    		api.renderViewTypeCarousel(thisViewType["VIEWTYPE"], materialViewTypes, imagesArray, backfillEmptyTiles);

    	});
    	
    	// Toggle the global button display
    	api.toggleGlobalClearButton();
    	api.toggleGlobalResetButton();    
    	api.toggleSaveAllButton();
    	
    };      

    // This function is used to render the view-type / select picker for each view-type displayed
    api.renderViewTypeSelectPicker = function (viewTypeLabel) {

        // Initialize local variables
        var $selectPicker, thisViewTypeLabel, optionHTML;

        // Create a reference to the current select picker
        $selectPicker = jQuery("#" + viewTypeLabel + " select.viewtypepicker");

        // Create a data-reference to the select control's parent view-type
        $selectPicker.data("parent-view-type", viewTypeLabel);

        // Iterate over the viewTypes, and render an instance of the carousel-template
        viewTypes.forEach( function(thisViewType, arrayIndex) {

            // Initialize the view-type label
            thisViewTypeLabel = thisViewType["VIEWTYPE"];

            // Do not render the current view-type in the view-type select list
            if ( thisViewTypeLabel === viewTypeLabel ) return;

            // Build out the option-content string using the function arguments
            optionHTML = '<option value="' + thisViewTypeLabel + '">' + thisViewTypeLabel + '</option>';

            // Append the option mark-up to the select control
            $selectPicker.append(optionHTML);

        });

        // Remove the disabled element from the select picker
        $selectPicker.prop("disabled", "");

        // Initialize the select picker control
        $selectPicker.selectpicker({ width: 252 });

        // Listen for selection changes, and reder appropriately
        $selectPicker.on("change", function(e) {

            // Initialize local variables
            var $thisSelect, selectedViewTypes, $parentContainer, $goButton;

            // Create a reference to the current select control
            $thisSelect = jQuery(this);
            $parentContainer = $thisSelect.closest(".carousel-controls-bar");
            $goButton = $parentContainer.find(".btn-copy-assets");

            // Retrieve each of the view-types for this control
            selectedViewTypes = $thisSelect.val();

            // Were any view-types selected?
            if ( !selectedViewTypes ) {

                // If not, then disable the go button
                $goButton.addClass("disabled");

            } else {

                // Otherwise, enable the go button
                $goButton.removeClass("disabled");

            }

        });

    };

    // This function is used to render the view-type carousel display
    api.renderViewTypeCarousels = function () {
    	
    	// Initialize local variables
    	var $carouselTemplate, $titleTemplate, viewTypeLabel;
    	
    	// Create a reference to the carousel template
    	$carouselTemplate = jQuery("#carousel-template-container");    	
    	$titleTemplate = jQuery("#producttitle-template-container");    	
    	
    	// Clear the workspace before rendering
    	$cache["workspace"].empty();

    	// Append the page-template title to the display
		$cache["workspace"].append($titleTemplate.html());  	    	
    	
        ////////////////////////////////////
        // Global Action Buttons 
        //////////////////////////////////// 
        
        // Listen for the global-clear events
        jQuery(".btn-global-clear").on("click", function(e) {
        	api.clearAllCarousels(true);
        });

        // Listen for the global-clear events
        jQuery(".btn-global-reset").on("click", function(e) {

            // Show the s7 asset selection modal
            jQuery("#unsaved-changes-global-reset-modal").modal("show"); 
            
            // Prevent the "scroll-bar" shifting when modals are shown
            jQuery("body").css("overflow-y", "scroll");	  	            
            
        });		
		
        ////////////////////////////////////
        // Save a Material and Submit It's Changes
        //////////////////////////////////// 	        
        
        // Fire the method used to generate the post / output content
        jQuery(".btn-global-save-all").on("click", function(e) {
        	
        	// Submit the product image definitions for the entire style
            api.saveProductImageAssignments();    	
        	        	
        });

        // Fire the method used to generate the *.xml export
        jQuery(".btn-global-export").on("click", function(e) {

            // Submit the product image definitions for the entire style
            api.exportProductImageAssignments();

        });

        ////////////////////////////////////
        // Launch the Asset Browser
        ////////////////////////////////////

        // Listen for clicks to render the asset browser
        jQuery(".btn-view-assets").on("click", function(e) {

            // Remove the selected carousel item
            $selectedCarouselItem = undefined;

            // Render the Scene7 Assets Display
            api.renderScene7AssetsInPreviewDialog(true);

            // Show the asset selector modal display
            jQuery("#s7-asset-selector").modal("show");

            // Prevent the "scroll-bar" shifting when modals are shown
            jQuery("body").css("overflow-y", "scroll");

        });

    	// Iterate over the viewTypes, and render an instance of the carousel-template
    	viewTypes.forEach( function(thisViewType, arrayIndex) {
    		
    		// Create a copy of the carousel template
    		var $carouselCopy = $carouselTemplate.clone(true);

    		// Initialize the view-type label 
    		viewTypeLabel = thisViewType["VIEWTYPE"];

            // Seed the id / primary-key of the view-type
    		$carouselCopy.find(".carousel-container").data("view-type", viewTypeLabel);
    		$carouselCopy.find(".carousel-container").attr("id", viewTypeLabel);    		
    		
    		// Seed the view-type name and make it visible for merchandisers
    		$carouselCopy.find(".view-type-label").html(viewTypeLabel);
    		
    		// Append the customized carousel against the workspace
    		$cache["workspace"].append($carouselCopy.html());

    		// Initialize the slider for the newly-rendered carousel
    		$viewTypeCarousels[viewTypeLabel] = jQuery("#" + viewTypeLabel + " .carousel").bxSlider({
    		  minSlides: 3,
    		  maxSlides: 6,
    		  slideWidth: 190,
    		  slideMargin: 8,
    		  pager: false
    		});

            // Render the view-type select pickers for each view-type
            api.renderViewTypeSelectPicker(viewTypeLabel);

            // Initialize all buttons associated to this carousel
    		jQuery("#" + viewTypeLabel + " .btn").button();    	    		
    		
            ////////////////////////////////////
            // Listen for Manage / Select
            ////////////////////////////////////     		
    		
        	// Trigger the hover treatment on the carousel items
    		jQuery("#" + viewTypeLabel + " .manage-image").on("click", function(e) {
    		
    			// Prevent clicks to top
    			e.preventDefault();
    			
    			// Initialize local variables
    			var imageFileName, productCode, $itemContainer, $thisItem, $thisImage, $carouselImage;
    			
    			// Create a reference to the current object
    			$thisItem = jQuery(this);
    			
    			// Find the parent container
    			$itemContainer = $thisItem.closest(".carousel-item-container");
    			$thisImage = $itemContainer.find("img");
    			
    			// Identify the current carousel-item container, and cache it
    			$selectedCarouselItem = $thisItem.closest(".carousel-item");    			
    			
    			// Is this a product image?
    			if ( !$thisImage.hasClass("ua-placeholder") ) {
    		
    				// If so, then retrieve the image file-name
        			imageFileName = $itemContainer.find(".image-filename").html();    				
    			        			
        			// Retrieve the product code from the file-name
    				productCode = api.getProductCodeFromImageFileName(imageFileName);
    				
    				// Set the product code as active and update the display
    				$cache["asset-filter"].val(productCode);			
    				
    	        	// Default the recipe category filter to the recipe cateogry of the selected image
    	        	$cache["asset-rc-filter"].val($itemContainer.find(".recipe-category").html());      	        	
    	        	
    				// Using this selected material, render the Scene7 Assets in the 
    				// image preview dialog (ensuring that clicked assets show similar images)
    				api.renderScene7AssetsInPreviewDialog();
    				
    			} else {
    				
    				// Get all the carousel-images without the ua-placeholder class
    				$carouselImage = jQuery(".carousel-item-container img:not(.ua-placeholder)").first();
    				
    				// Was a product-image found on this page?
    				if ( $carouselImage.length === 1 ) {
    					
        				// If so, then retrieve the image file-name
            			imageFileName = $carouselImage.attr("title");       					
    					
            			// If so, then retrieve the product code from the product-image's file-name
        				productCode = api.getProductCodeFromImageFileName(imageFileName);
        				
        				// Set the product code as active and update the display
        				$cache["asset-filter"].val(productCode);
				
    					
    				} 

    	        	// Default the recipe category filter with the filter 
    	        	// being used to render the assets shown on-load
    	        	$cache["asset-rc-filter"].val("standard-10pad");				
    				
    				// Render assets for the default selection
    				api.renderScene7AssetsInPreviewDialog();
    				
    			}

                // Initialize the S7 Carousel events
                api.initS7CarouselEvents();

    			// Update the select-pickers in the display
	        	$cache["asset-rc-filter"].selectpicker("refresh");         			
				$cache["asset-filter"].selectpicker("refresh");    	
				
	            // Show the s7 asset selection modal
	            jQuery("#s7-asset-selector").modal("show"); 
	            
	            // Prevent the "scroll-bar" shifting when modals are shown
	            jQuery("body").css("overflow-y", "scroll");	  	            
    			
    		});	
    			
            ////////////////////////////////////
            // Carousel Item Hover Treatment
            //////////////////////////////////// 		
    		
        	// Trigger the hover treatment on the carousel items
    		jQuery("#" + viewTypeLabel + " .carousel-item").hover( function(e) {

    			// Create a reference to the current carousel-item container
    			var $carouselItem = jQuery(this);

    			// Does this carousel item have a product image?
    			if ( $carouselItem.find(".ua-placeholder").length === 0 ) {

    				// Don't show the left arrow on the first carousel item
        			if ( $carouselItem.hasClass("item0") ) {
        				$carouselItem.find(".left-icon").removeClass("hover-elements");
        				$carouselItem.find(".left-icon").css("display", "none");
        			}	    				
    				
    				// Don't show the right arrow on the last carousel item
        			if ( $carouselItem.hasClass("item11") ) {
        				$carouselItem.find(".right-icon").removeClass("hover-elements");
        				$carouselItem.find(".right-icon").css("display", "none");
        			}	    				
    				        			
            		// Show the hover-treatment display elements so that they're actionable
        			$carouselItem.find(".hover-elements").fadeIn(250);    				
        			
    			} else {
    				
    				// If not, then only show the manage treatment
        			$carouselItem.find(".manage-treatment").fadeIn(250);
    			    				
    			}
    			        		
        	}, function(e) {
    			
    			// Create a reference to the current carousel-item container
    			var $carouselItem = jQuery(this);
    			
    			// Hide the hover-treatment display elements from view       		
    			$carouselItem.find(".hover-elements").fadeOut(25);
    			
    		});    		
    		
            ////////////////////////////////////
            // Listen for Move (Left / Right)
            ////////////////////////////////////      		
    		
        	// Trigger the individual carousel item "move to right" event
    		jQuery("#" + viewTypeLabel + " .move-icon").on("click", function(e) {
    			
    			// Prevent default events from bubbling
    			e.preventDefault();
    			
    			// Initialize local variables
    			var $moveIcon, $thisCarouselItem, $carouselItems, $carousel, classArray;
    			
    			// Create a reference to the current carousel-item container
    			$moveIcon = jQuery(this);

    			// Create a reference to the current carousel item
    			$thisCarouselItem = $moveIcon.closest(".carousel-item");
    			$carousel = $thisCarouselItem.closest(".carousel");
    			
    			// Parse out the classes, so that we can find the itemClass
    			classArray = $thisCarouselItem.attr("class").split(/\s+/);
    			
    			// Loop over the class array, and find the "item"
    			classArray.forEach( function(thisClass, arrayIndex) {
    				
    				// Skip the class processing if it's not an item class
    				if ( thisClass.indexOf("carousel-item") !== -1 ) return;
    				
    				// Find each of the carousel items associated to this class
    				$carouselItems = $carousel.find("." + thisClass);

    				// Execute the function to move the contents of this item one position in the current carousel
    				api.moveCarouselItem($carouselItems, $carousel, thisClass, $moveIcon.data("direction"));
    				
    			});

    		});	
    		
            ////////////////////////////////////
            // Listen for Remove / Delete 
            ////////////////////////////////////     		
    		
        	// Trigger the individual carousel item remove / deletions
    		jQuery("#" + viewTypeLabel + " .remove-icon").on("click", function(e) {
    			
    			// Prevent default events from bubbling
    			e.preventDefault();
    			
    			// Initialize local variables
    			var $removeIcon, $thisCarouselItem, $carouselItems, $carousel, $carouselContainer,
    				$clearButton, classArray, $placeholderImages, $allCarouselItems;
    			
    			// Create a reference to the current carousel-item container
    			$removeIcon = jQuery(this);

    			// Create a reference to the current carousel item
    			$thisCarouselItem = $removeIcon.closest(".carousel-item");
    			$carouselContainer = $thisCarouselItem.closest(".carousel-container");    			
    			$carousel = $thisCarouselItem.closest(".carousel");
    			
    			// Parse out the classes, so that we can find the itemClass
    			classArray = $thisCarouselItem.attr("class").split(/\s+/);
    			
    			// Loop over the class array, and find the "item"
    			classArray.forEach( function(thisClass, arrayIndex) {
    				
    				// Skip the class processing if it's not an item class
    				if ( thisClass.indexOf("carousel-item") !== -1 ) return;
    				
    				// Find each of the carousel items associated to this class
    				$carouselItems = $carousel.find("." + thisClass);

    				// Execute the function to clear them out
    				api.clearCarouselItem($carouselItems);
    				
    			});
    			
    			// Count the number of placeholder images and overall tiles
    			$placeholderImages = $carousel.find(".ua-placeholder");
    			$allCarouselItems = $carousel.find(".carousel-item");

    	    	// Render the carousel item count for the current carousel
    	    	api.renderCarouselLabelDisplay($carouselContainer);

                // Update the edited treatment for this view-type
                api.showCarouselItemsAsEdited($carouselContainer.attr("id"));

    			// If the count of images and tiles is the same, then disable the "clear" button
    			if ( $placeholderImages.length === $allCarouselItems.length ) {
    				
    				// Create a reference to the container for this carousel
    				$carouselContainer = $carousel.closest(".carousel-container");
    				$clearButton = $carouselContainer.find(".btn-clear");
    				
    				// Disable the clear button
    				api.disableClearButton($clearButton);
    				
    			}
    			
    			// If the view-type hasn't changed, then revert the label display
    			if ( !api.hasViewTypeChanged(viewTypeLabel) ) {
    				
    	    		// Otherwise, revert the display of the view-type label
    	    		api.revertViewTypeLabel(viewTypeLabel);

    			} 
    			
    		});
    		
            ////////////////////////////////////
            // Launch the Detail Modal
            ////////////////////////////////////       		
    		
        	// Listen for detail-view-clicks, and render the asset-detail modal
    		jQuery("#" + viewTypeLabel + " .info-icon").on("click", function(e) {     		
    		
    			// Prevent default events from triggering
    			e.preventDefault();

    			// Initialize local variables
    			var $infoIcon, $thisCarouselItem, $carouselContainer, selectedOption, 
    				imageFileName, recipeCategory, viewTypeLabel, thumbnailUrl, detailUrl;
    			
    			// Create a reference to the current carousel-item container
    			$infoIcon = jQuery(this);

    			// Identify the current carousel-item container, and cache it
    			$thisCarouselItem = $infoIcon.closest(".carousel-item");
    			$selectedCarouselItem = $thisCarouselItem;
    			
    			// Get the view-type label for the current carousel
    			$carouselContainer = $infoIcon.closest(".carousel-container");
    			viewTypeLabel = $carouselContainer.attr("id");
    			
    			// Create a reference to the image file-name
    			imageFileName = $infoIcon.data("file-name");
    			recipeCategory = $infoIcon.data("recipe-category");
    			
    			// Generate the thumbnail and detail urls
    			thumbnailUrl = api.getImageUrl("standardProductCarousel", "standard-10pad", imageFileName);
    			detailUrl = api.getImageUrl(viewTypeLabel, recipeCategory, imageFileName);

    			// Seed the image filename and recipe category information
    			jQuery(".thumb-container .image-filename").html(imageFileName);
    			jQuery(".details-container .detail-view-type").html(viewTypeLabel);    			

    			// Pre-select the current recipe code
    			$cache["detail-rc-filter"].val(recipeCategory);
    			
    			// Clear out the selected recipe category treatment
    			$cache["detail-rc-filter"].find("option").data("icon", "");

    			// Update / show the selected recipe category as the default
    			selectedOption = $cache["detail-rc-filter"].find("option:selected");
    			selectedOption.data("icon", "glyphicon glyphicon-ok");  
    			
    			// Re-paint the recipe category filter
    			$cache["detail-rc-filter"].selectpicker("refresh");    			
    			
    	    	// Seed the original recipe category
    	    	jQuery(".btn-reset-recipe-category").data("orig-recipe-category", recipeCategory);
    	    	    			    			
    			// Seed in the modal dialog the original / detail versions of both images
    			jQuery(".original-image").attr("src", thumbnailUrl);
    			jQuery(".detail-image").attr("src", detailUrl);
    			    			
	            // Show the asset detail-view modal
	            jQuery("#detail-image-view").modal("show");
	           	            
	            // Prevent the "scroll-bar" shifting when modals are shown
	            jQuery("body").css("overflow-y", "scroll");    			
    			
    		});
    		
            ////////////////////////////////////
            // Show the Recipe Tool-Tip
            ////////////////////////////////////       		    		
    			    		
        	// Trigger the hover treatment on the carousel items
    		jQuery("#" + viewTypeLabel + " .info-icon").hover( function(e) {    		
    		
    			// Initialize local variables
    			var $infoIcon, $thisCarouselItem, $recipeCategory;
    			
    			// Create a reference to the current carousel-item container
    			$infoIcon = jQuery(this);

    			// Create a reference to the current carousel item
    			$thisCarouselItem = $infoIcon.closest(".carousel-item");
    			$recipeCategory = $thisCarouselItem.find(".recipe-category");
    			$recipeCategory.fadeIn(200);
    			
    		}, function(e) {    		
    		
    			// Initialize local variables
    			var $infoIcon, $thisCarouselItem, $recipeCategory;
    			
    			// Create a reference to the current carousel-item container
    			$infoIcon = jQuery(this);

    			// Create a reference to the current carousel item
    			$thisCarouselItem = $infoIcon.closest(".carousel-item");
    			$recipeCategory = $thisCarouselItem.find(".recipe-category");
    			$recipeCategory.fadeOut(200);    			
    			
    		});
    			
            ////////////////////////////////////
            // Listen for Clearing of Tiles
            //////////////////////////////////// 		
        	
        	// Listen for requests to clear a carousel of assets
    		jQuery("#" + viewTypeLabel + " .btn-clear").on("click", function(e) {

    			// Create a reference to the current / related carousel container
    			var $carouselContainer = jQuery(this).closest(".carousel-container");
    			
        		// Fire the method that is used to clear the carousel of its content
        		api.clearCarouselItems($carouselContainer);
        		
        	});
    		    		
            ////////////////////////////////////
            // Listen for Restoration of Tiles
            //////////////////////////////////// 		
    		
        	// Listen for requests to reset a carousel of assets
    		jQuery("#" + viewTypeLabel + " .btn-reset").on("click", function(e) {

    			// Create a reference to the current / related carousel container
    			var $carouselContainer = jQuery(this).closest(".carousel-container");

    			// Create a reference to the current view-type
    			var viewTypeLabel = $carouselContainer.attr("id");
    			
    			// Seed the view-type currently being processed
    			currentViewType = viewTypeLabel;
    			
	            // Show the unsaved-changes modal
	            jQuery("#unsaved-changes-reset-modal").modal("show");
	            
	            // Prevent the "scroll-bar" shifting when modals are shown
	            jQuery("body").css("overflow-y", "scroll");
    		            
        	});		
        			    		
    	});

        ////////////////////////////////////
        // Hide Alerts on Button Clicks
        ////////////////////////////////////

        // Any button click should hide the alert page
        jQuery("#panel-workspace button").on("click", function(e) {
            jQuery("#alert-pane").hide();
        });

        ////////////////////////////////////
        // Listen for Copy-Asset Clicks
        ////////////////////////////////////

        // Any button click should hide the alert page
        jQuery("#panel-workspace .btn-copy-assets").on("click", function(e) {

            // Initialize local variables
            var $carouselContainer, $thisGoButton, $viewTypeSelect, viewTypeAssets, productCode;

            // Derrive the current product-code / material being worked on
            productCode = $cache["select-filter"].val();

            // Create a reference to the current go button
            $thisGoButton = jQuery(this);

            // Create a reference to the current carousel container
            $carouselContainer = $thisGoButton.closest(".carousel-container");

            // Create a reference to the related / associated view-type select control
            $viewTypeSelect = $carouselContainer.find(".viewtypepicker");

            // Retrieve the view-type assets that will be copied to the select view-types
            viewTypeAssets = api.getViewTypeAssetsArray(productCode, $viewTypeSelect.data("parent-view-type"));

            // Copy the view-type assets to the selected / specified view-types
            api.copyAssetsToViewTypes(productCode, viewTypeAssets, $viewTypeSelect.val());

            // Remove the selected items from the display
            $viewTypeSelect.val("");

            // Refresh the display of the select picker
            $viewTypeSelect.selectpicker("refresh");

            // Disable the go button
            $thisGoButton.addClass("disabled");

        });

    };

    // This method retrieves the image / assets array for a given product code and view-type
    api.getViewTypeAssetsArray = function (productCode, viewTypeLabel) {

        // Initialize local variables
        var viewTypes;

        // Retrieve the asset view-types for the specific product code
        viewTypes = api.getAssetViewTypes(productCode);

        // Return the images array associated to the current view-type for this product code
        return viewTypes[viewTypeLabel];

    };

    // This method is used to copy the source assets to the target view-types, and apply recipes to them based on what was configured
    api.copyAssetsToViewTypes = function (productCode, sourceAssets, targetViewTypes) {

        // Initialize local variables
        var thisViewType, recipeCategory;

        // Iterate over each target view-type
        targetViewTypes.forEach( function(thisViewType, arrayIndex) {

            // Initialize the asset array
            var assetsArray = [];

            // Iterate over each asset, and build-out a new view-type asset array
            sourceAssets.forEach( function(thisAsset, assetIndex) {

                // Create a copy of the current asset
                var assetCopy = _.clone(thisAsset, true);

                // Calculate the recipe category for the current asset url
                recipeCategory = api.getRecipeCategoryFromUrl(thisAsset["URL"]);

                // Build out the asset url for the current view-type using the source recipe-category
                assetCopy["URL"] = api.getImageUrl(thisViewType, recipeCategory, thisAsset["FILENAME"]);

                // Add this asset to the assetsArray
                assetsArray.push(assetCopy);

            });

            // Copy the new assets array to the view-type for this product code
            api.setAssetViewTypes(productCode, assetsArray, thisViewType);

            // Render out the carousel for this view-type
            api.updateViewTypeCarouselItems(thisViewType, assetsArray);

            // Show the current collection of carousel items as edited (if changes were made)
            api.showCarouselItemsAsEdited(thisViewType);

            // Toggle the global save / reset buttons to reflect the changes made
            api.toggleGlobalSaveResetButtons();

        });

    };

    // This method is used to update the assets for a given carousel with new assets
    api.updateViewTypeCarouselItems = function(thisViewType, assetsArray) {

        // Initialize local variables
        var recipeCategory, recipeUrl, startTile, carouselTileClassName, $carousel, $carouselTiles;

        // Create a reference to the carousel associated to this view-type
        $carousel = jQuery("#" + thisViewType).find(".carousel");

        // For a given view-type, iterate over the different assets
        assetsArray.forEach( function(thisImage, arrayIndex) {

            // Pull the recipe category from the url
            recipeCategory = api.getRecipeCategoryFromUrl(thisImage["URL"]);

            // Retrieve the image recipeUrl for this image to display in the asset listing
            recipeUrl = api.getImageUrl(appConstants["defaultCarouselViewType"], recipeCategory, thisImage["FILENAME"]);

            // With the url identified, now seed the image url for the view-type specific carousel item
            api.renderCarouselItem(thisViewType, recipeUrl, thisImage, arrayIndex, "update");

        });

        // Set the start-tile position for the back-fill activity
        startTile = assetsArray.length;

        // Loop over the collection of remaining view-type tiles
        for ( var tileIndex = startTile; tileIndex < 12; tileIndex ++ ) {

            // Build out the class-name used to retrieve tiles to reset
            carouselTileClassName = ".carousel-item.item" + tileIndex;

            // Find the carousel tiles that map to this item-class
            $carouselTiles = $carousel.find(carouselTileClassName);

            // Clear the carousel-tile of any product-assets
            api.clearCarouselItem($carouselTiles, false, "update");

        }

    };

    // This method is used to update the display of each existing view-type carousel after a save
    api.updateViewTypeCarousels = function() {

        // Initialize local variables
        var viewTypeLabel, $carouselContainer;

        // Iterate over the viewTypes, and render an instance of the carousel-template
        viewTypes.forEach( function(thisViewType, arrayIndex) {

            // Initialize the current view-type label
            viewTypeLabel = thisViewType["VIEWTYPE"];

            // Reference the current carousel container
            $carouselContainer = jQuery("#" + viewTypeLabel);

            // Update and re-render the assets for each view-type
            api.resetCarouselItems($carouselContainer);

            // Check if the current carousel is on the first slide; if not, then automatically scroll to the first slide
            if ( $viewTypeCarousels[viewTypeLabel].getCurrentSlide() !== 0 ) $viewTypeCarousels[viewTypeLabel].goToSlide(0);

        });

    };

    // This method is used to render the carousel-items for a specific view-type
    api.renderViewTypeCarousel = function(viewTypeLabel, materialViewTypes, imagesArray, backfillEmptyTiles) {

    	// Initialize local variables
    	var $carousel, $assetCountLabel, $carouselTiles, recipeUrl, startTile, carouselTileClassName, recipeCategory;

		// Create a reference to the specific viewType carousel
		$carousel = jQuery("#" + viewTypeLabel);

		// Create a reference to the asset-count label 
		$assetCountLabel = $carousel.find(".image-count");
		
		// Seed the count of assets for each view type specific to this material
		$assetCountLabel.html(materialViewTypes[viewTypeLabel].length);
		
		// Toggle the carousel control buttons (enable / disable them based on the number of assets present)
		api.enableCarouselControlButtons(materialViewTypes[viewTypeLabel].length, viewTypeLabel);
		
		// For a given view-type, iterate over the different assets
		materialViewTypes[viewTypeLabel].forEach( function(thisImage, arrayIndex) {

			// Pull the recipe category from the url
			recipeCategory = api.getRecipeCategoryFromUrl(thisImage["URL"]);
			
			// Retrieve the image recipeUrl for this image to display in the asset listing
			recipeUrl = api.getImageUrl(appConstants["defaultCarouselViewType"], recipeCategory, thisImage["FILENAME"]);

			// With the url identified, now seed the image url for the view-type specific carousel item
			api.renderCarouselItem(viewTypeLabel, recipeUrl, thisImage, arrayIndex, "insert");
			
		});    	
    	
		// Should tiles that are not filled by the current material be reset?
    	if ( backfillEmptyTiles === true ) {

    		// Reset the view-type label
    		api.revertViewTypeLabel(viewTypeLabel);

    		// Set the start-tile position for the back-fill activity
    		startTile = materialViewTypes[viewTypeLabel].length;
    		
    		// Loop over the collection of remaining view-type tiles
    		for ( var tileIndex = startTile; tileIndex < 12; tileIndex ++ ) {
    			
    			// Build out the class-name used to retrieve tiles to reset
    			carouselTileClassName = ".carousel-item.item" + tileIndex;

    			// Find the carousel tiles that map to this item-class
    			$carouselTiles = $carousel.find(carouselTileClassName);
    					
    			// Clear the carousel-tile of any product-assets
    			api.clearCarouselItem($carouselTiles, false, "insert");

    		}
    		
    	}

        // Instruct the current carousel to return to the first slide
        if ( $viewTypeCarousels[viewTypeLabel].getCurrentSlide() !== 0 ) $viewTypeCarousels[viewTypeLabel].goToSlide(0);

    };

    // This function is used to render the current carousel item with the view-specific image
    api.renderCarouselItem = function(viewTypeLabel, imageUrl, imageObject, elementIndex, updateOrInsert) {
    	
    	// Initialize local variables
    	var $carouselContainer, $carouselItem, $thisImage,
    		$fileNameLabel, $recipeCategory, $infoIcon, $thisItem, 
    		recipeCategoryLabel, childClassLabel;

        // Describe the type of rendering that is being performed
        if ( updateOrInsert === undefined ) updateOrInsert = "update";

    	// Create a reference to the current carousel container
    	$carouselContainer = jQuery("#" + viewTypeLabel);

    	// Initialize the carousel-child position value
    	childClassLabel = "item" + elementIndex;
    	
    	// Retrieve the child element relative to the current image being displayed
    	$carouselItem = $carouselContainer.find(".carousel ." + childClassLabel);

        // Reset the edited state of the current carousel item
        $carouselItem.removeClass("carousel-item-edited");

    	// Loop over the collection of carousel items that were found
    	$carouselItem.each( function(itemIndex, thisItem) {

    		// Create a reference
    		$thisItem = jQuery(thisItem);
    		
    		// Find instances of the current image and filename label
        	$thisImage = $thisItem.find("img");
    		$fileNameLabel = $thisItem.find(".image-filename");

            // Only update images that have new / different urls
            if ( $thisImage.prop("src") !== imageUrl ) {

                // For each carousel item, set the imageUrl for this
                $thisImage.prop("src", imageUrl).fadeOut(0).fadeIn(0);

            }

    		// Enable and set the image file-name for this carousel item    		
    		$fileNameLabel.css("display","block");
    		$fileNameLabel.html(imageObject["FILENAME"]);    		

    		// Derrive the current recipe-category for this asset
    		recipeCategoryLabel = api.getRecipeCategoryFromUrl(imageUrl);
    		
    		// Create a reference to the recipe-category element
    		$recipeCategory = $thisItem.find(".recipe-category");    		
    		$infoIcon = $thisItem.find(".info-icon");
    		
    		// Seed the filename / recipe categoryfor this image
    		$infoIcon.data("file-name", imageObject["FILENAME"]);
    		$infoIcon.data("recipe-category", recipeCategoryLabel);

            // Is this an insert?  Then let's record the original values
            if ( updateOrInsert === "insert" ) {

                // Initialize the original recipe-category and label
                $thisItem.data("orig-file-name", imageObject["FILENAME"]);
                $thisItem.data("orig-recipe-category", recipeCategoryLabel);

            }

            // Seed the recipe category elements
    		$recipeCategory.html(recipeCategoryLabel);
    		
    		// Seed the file-name for this image in the title
    		$thisImage.prop("title", imageObject["FILENAME"]); 
    		
    		// Remove the ua-placeholder class
    		$thisImage.removeClass("ua-placeholder");
    		    		
    	});
    	    	
    };      
    
    // This function is used to update a given carousel item with a new definition
    api.updateCarouselItem = function(viewTypeLabel, recipeCategoryLabel, imageFileName, imageUrl, childClassLabel) {
    	
    	// Initialize local variables
    	var $carouselContainer, $carouselItem, $thisImage,
    		$fileNameLabel, $recipeCategory, $infoIcon, $thisItem, 
    		recipeCategoryLabel;
    
    	// Create a reference to the current carousel container
    	$carouselContainer = jQuery("#" + viewTypeLabel);

    	// Retrieve the child element relative to the current image being displayed
    	$carouselItem = $carouselContainer.find(".carousel ." + childClassLabel);

    	// Loop over the collection of carousel items that were found
    	$carouselItem.each( function(itemIndex, thisItem) {

    		// Create a reference
    		$thisItem = jQuery(thisItem);
    		
    		// Find instances of the current image and filename label
        	$thisImage = $thisItem.find("img");
    		$fileNameLabel = $thisItem.find(".image-filename");

    		// Enable and set the image file-name for this carousel item    		
    		$fileNameLabel.css("display","block");
    		$fileNameLabel.html(imageFileName);    		
    		
    		// Create a reference to the recipe-category element
    		$recipeCategory = $thisItem.find(".recipe-category");    		
    		$infoIcon = $thisItem.find(".info-icon");
    		
    		// Seed the filename / recipe category for this image
    		$infoIcon.data("file-name", imageFileName);
    		$infoIcon.data("recipe-category", recipeCategoryLabel);

    		// Seed the recipe category elements
    		$recipeCategory.html(recipeCategoryLabel);
    		
        	// For each carousel item, set the imageUrl for this
    		$thisImage.prop("src", imageUrl);   
    		
    		// Seed the file-name for this image in the title
    		$thisImage.prop("title", imageFileName); 
    		
    		// Remove the ua-placeholder class
    		$thisImage.removeClass("ua-placeholder");
    		    		
    	});
    	    	
    };      
    
	// Update the select filter to include S7 asset counts
	api.updateSelectFilterWithS7AssetCounts = function (productCode) {
		
		// Initialize local variables
		var $selectedOption, $assetFilterOption, subtextLabel, totalConfiguredImages;
		
		// Retrieve the current option associated to the selected product-code
		$selectedOption = $cache["select-filter"].find('option[value="' + productCode + '"]');
		
		// Build out the subtext label for the current display
		subtextLabel = $selectedOption.data("subtext");

		// Parse-out how many images are configured for each material
		totalConfiguredImages = subtextLabel.split(" ")[2];
		
		// Update the sub-text label display to include the S7 asset count
		subtextLabel = " ( " + totalConfiguredImages + " / " + s7Assets[productCode].length + " ) ";

		// Update the sub-text label for this option
		$selectedOption.data("subtext", subtextLabel);

		// Is this a material code, and is there at least one S7 asset displayed?
		if ( api.isMaterial(productCode) && s7Assets[productCode].length > 0 ) {
			
			// If so, then find the corresponding option and update the subtext
			$assetFilterOption = $cache["asset-filter"].find('option[value="' + productCode + '"]');
			$assetFilterOption.data("subtext", subtextLabel);
			$assetFilterOption.data("s7asset-count", s7Assets[productCode].length);
			
			
			// Refresh the asset filter
			$cache["asset-filter"].selectpicker("refresh");			
			
		}
		
		// Update the filter display to include the S7 counts
		$cache["select-filter"].selectpicker("refresh");
		
	} 
    
	// This function is used to render the select-control of recipe categories
	api.renderImageDetailsRecipeCategoryFilter = function () {
		
		// Initialize local variables
		var optionHTML;
		
    	// Clear the contents of the recipe category filter
    	$cache["detail-rc-filter"].empty();
    	$cache["asset-rc-filter"].empty();
    	
    	// Iterate over each of the recipe categories configured
    	recipeCategories.forEach( function(thisCategory, itemIndex) {
    		
    		// Build out the option HTML for the current recipe category
    		optionHTML = '<option value="' + thisCategory["CATEGORYNAME"] + '">' + thisCategory["CATEGORYNAME"] + '</option>';

    		// Append the optionHTML element to the select filter
    		$cache["detail-rc-filter"].append(optionHTML);
    		$cache["asset-rc-filter"].append(optionHTML);
    		
    	});
		
    	// Re-paint the select controls
    	$cache["detail-rc-filter"].selectpicker("refresh");    	
    	$cache["asset-rc-filter"].selectpicker("refresh");   
    	
	};
	
    // This function is used to render the updated select filter
    api.renderSelectFilter = function () {
    	
    	// Initialize local variables
    	var materialsCollection, selectedText, imageCount;
    	
    	// Create a reference to the materials object
    	materialsCollection = productImageDefinitions[styleCode]["MATERIALS"];
    	
    	// Clear the contents of the select filters
    	$cache["select-filter"].empty();
    	$cache["asset-filter"].empty();
    	
    	// If a material code is not defined, then default the style as selected
    	if ( materialCode.length === 0 ) {
    	
    		// Render the style as selected
    		selectedText = 'selected="selected"';
    		
    	}
    	
    	// Retrieve the count of elements for the default style
    	imageCount = api.getProductImageCount(api.getAssetViewTypes(styleCode));
    	
    	// Seed the core style property, and show it as selected (as the default style will initially be rendered)
    	$cache["select-filter"].append(api.getSelectOptionContent(imageCount, selectedText, styleCode));
    	
    	// Loop over the collection of materials, and render each option
    	for ( var thisMaterialCode in materialsCollection ) {

    		// Default the selected text string
    		selectedText = "";
    		
        	// If a material code is not defined, then default the style as selected
        	if ( materialCode.length != 0 && thisMaterialCode === materialCode) {

        		// Render the current material as selected
        		selectedText = 'selected="selected"';
        		
        	}

        	// Retrieve the count of elements for each of the individual materials
        	imageCount = api.getProductImageCount(api.getAssetViewTypes(thisMaterialCode));        	
        	
        	// Seed the core style property, and show it as selected (as the default style will initially be rendered)
        	$cache["select-filter"].append(api.getSelectOptionContent(imageCount, selectedText, thisMaterialCode));
        	$cache["asset-filter"].append(api.getSelectOptionContent(imageCount, selectedText, thisMaterialCode));
    		    		
    	}

    	// Re-enable the select filter
    	$cache["select-filter"].prop("disabled", "");
    	$cache["asset-filter"].prop("disabled", "");
    	
    	// Re-render the select picker and show the updated style / material values
    	$cache["select-filter"].selectpicker("refresh");
    	$cache["asset-filter"].selectpicker("refresh");

    };
    
    // This function is used to remove icons from the selectFilter display
    api.removeIconsFromSelectFilter = function () {
    	
    	// Initialize local variables
    	var $options;
    	
    	// Retrieve all the options associated to the select-filter
    	$options = $cache["select-filter"].find("option");
    	   
    	// Iterate over each of the options and remove the data-icon instance
    	$options.each( function(optionIndex, thisOption) {
    		jQuery(thisOption).removeData("icon");
    	});
    	
    	// Re-render the select picker and show the updated style / material values
    	$cache["select-filter"].selectpicker("refresh");

    };
    
    // This method is used to render changes to the image detail view driven by recipe category changes
    api.renderImageDetailRecipeChange = function () {
    	
    	// Initialize local variables
    	var $fileName, $viewType, $detailImage, imageUrl, recipeCategory, viewType, fileName;
    	
    	// Create references to the dialog objects that need to be interrogated
    	$fileName = jQuery("#detail-image-view .image-filename");
    	$viewType = jQuery("#detail-image-view .detail-view-type");
    	$detailImage = jQuery("#detail-image-view .detail-image");
    	
    	// Retrieve the values used to generate the recipe
    	recipeCategory = $cache["detail-rc-filter"].val();
    	viewType = $viewType.html();
    	fileName = $fileName.html()

    	// Get the recipe url for this combination
    	imageUrl = api.getImageUrl(viewType, recipeCategory, fileName);
    	
    	// Update the display with the generated recipe
    	$detailImage.attr("src", imageUrl);
    	
    };
		 
    // This method is used to update the display recipe of an asset displayed in the S7 Asset Selector
    api.renderS7AssetSelectorRecipeChange = function () {
    	
    	// Initialize local variables
    	var $selectedS7AssetImage, $selectedS7CarouselItem, 
    		imageUrl, recipeCategory, viewType, fileName;
    	
    	// Check if there is a selected s7 asset image in the dialog
    	$selectedS7AssetImage = jQuery(".s7-carousel-container img.selected-asset");
    	
    	// Exit if no selected asset was found
    	if ( !$selectedS7AssetImage.length ) return;
    	
    	// Create a reference to the carousel container for the active / selected current asset
    	$selectedS7CarouselItem = $selectedS7AssetImage.closest(".s7-carousel-item-container"); 	
    	
    	// Retrieve the values used to generate the recipe
    	viewType = appConstants["defaultCarouselViewType"];
    	recipeCategory = $cache["asset-rc-filter"].val();
    	fileName = $selectedS7CarouselItem.find(".image-filename").html();

    	// Get the recipe url for this combination
    	imageUrl = api.getImageUrl(viewType, recipeCategory, fileName);
    	
    	// Update the display with the generated recipe
    	$selectedS7AssetImage.attr("src", imageUrl);
    	
    };    
    
    // This method is used to render / pre-load the Scene7 assets in the preview modal
    api.renderScene7AssetsInPreviewDialog = function (readOnlyMode) {
    	
    	// Initialize local variables
    	var $s7Assets, productCode, tileUrl, $thisAsset, $itemContainer, $carouselItemTemplate,
            $fileName, materialAssets, $infoIcon, imageUrl, minTileColumnCount, columnsToRender;

        // Default the function argument
        if ( arguments.length === 0 ) readOnlyMode = false;

        // Default the minimum number of tile columns to render
        minTileColumnCount = 4;

        // Seed and Default whether the asset carousel is read only
        assetCarouselIsReadOnly = readOnlyMode;

        // Is this being rendered in read-only mode?
        if ( readOnlyMode === true ) {

            // If so, then hide the select image / recipe filters
            jQuery(".btn-select-image").hide();

            // Hide the editable title, and show the read-only title
            jQuery(".asset-browser-editable-title").hide();
            jQuery(".asset-browser-readonly-title").show();

        } else {

            // Otherwise, make sure these items are enabled
            jQuery(".btn-select-image").show();

            // Hide the read-only title, and show the editable title
            jQuery(".asset-browser-editable-title").show();
            jQuery(".asset-browser-readonly-title").hide();

        }

    	// Set the tile-url (used to back-render asset tiles)
    	tileUrl = appConstants["carouselPlaceholderImageUrl"];
    	
    	// Capture the product-code whose assets will be displayed
    	productCode = $cache["asset-filter"].val();
    	materialAssets = s7Assets[productCode];
    	
    	// If no s7Assets exist for this material, default the array to support alternate processing
    	if ( materialAssets === undefined ) materialAssets = [];

        // Remove all the asset tiles displayed in the s7 carousel
        jQuery(".s7-carousel").empty();

        // Calculate the total number of columns to render
        columnsToRender = Math.ceil(materialAssets.length / 2);

        // Ensure that the total is at least equal to the minimum tile count (4 columns)
        if ( columnsToRender < minTileColumnCount ) columnsToRender = minTileColumnCount;

        // Create a reference to the current carousel item template
        $carouselItemTemplate = jQuery(".s7-carousel-items-template");

        // Loop over the total number of columns to create, and append them to the carousel
        for ( var columnIndex = 0; columnIndex < columnsToRender; columnIndex ++ ) {

            // Append the carousel item template instances to the s7 carousel container
            jQuery(".s7-carousel").append($carouselItemTemplate.html());

        }

        // re-initialize the slider if it's already defined
        if ( $s7Carousel !== undefined ) {

            // Destroy the current slider
            $s7Carousel.reloadSlider();

        }

    	// Create a reference to the current s7 asset
    	$s7Assets = jQuery(".s7-carousel .s7-asset");

        // Only retrieve the info-icon if a selected carousel-item exists
        if ( readOnlyMode === false ) {

            // Create a reference to the information icon for the selected carousel-item
            $infoIcon = $selectedCarouselItem.find(".info-icon");

        }

    	// Loop over each of the s7 assets, and decorate them
    	$s7Assets.each( function(arrayIndex, thisItem) {

    		// Create a reference to the current asset
    		$thisAsset = jQuery(thisItem);
    		$itemContainer = $thisAsset.closest(".s7-carousel-item-container");
    		$fileName = $itemContainer.find(".image-filename");

    		// Determine if a placeholder or image-asset should be rendered?
    		if ( arrayIndex < materialAssets.length ) {

    			// Render an image asset if an asset matches the arrayIndex in the material-specific assets array
        		imageUrl = api.getImageUrl(appConstants["defaultCarouselViewType"], appConstants["defaultRecipeCategory"], materialAssets[arrayIndex])

    			// Clear and hide the filename display
    			$fileName.html(materialAssets[arrayIndex]);
    			$fileName.css("display", "block");

    			// Remove the placeholder reference
    			$thisAsset.removeClass("s7-placeholder");

    		} else {

    			// Otherwise, just render the placeholder tile
    			imageUrl = tileUrl;

    			// Clear and hide the filename display
    			$fileName.empty();
    			$fileName.css("display", "none");

    			// Add the placeholder reference
    			$thisAsset.addClass("s7-placeholder");

    		}

    		// Render the current asset
    		$thisAsset.attr("src", imageUrl);

            // If this asset is a placeholder, then don't check if it should be selected
            if ( $thisAsset.hasClass("s7-placeholder")) return;

            // If the info-icon hasn't been defined, then return
            if ( $infoIcon === undefined ) return;

            // Does the current asset being evaluated match the selected asset?
            if ( $infoIcon.data("file-name") === materialAssets[arrayIndex]) {

                // If so, then flag that asset as selected
                $thisAsset.addClass("selected-asset");

                // Enable the recipe filter for this display
                $cache["asset-rc-filter"].prop("disabled", "");
                $cache["asset-rc-filter"].selectpicker("refresh");

                // Update the S7 Asset with the current / active recipe
                api.renderS7AssetSelectorRecipeChange();

            }

    	});

        // re-initialize the slider if it's already defined
        if ( $s7Carousel !== undefined ) {

            // Initialize the S7 Carousel events
            api.initS7CarouselEvents();

        }

    };
    
    // HACK: This function is used to render the prototype-suppressed controls
    api.renderPrototypeSuppressedControls = function () {

    	// Trigger the re-display of the select control
        setTimeout(function(){

            // HACK: Force the display of the bootstrap select control
            jQuery(".bootstrap-select").show();

        }, 0);

    };      
    
    ///////////////////////////////////////////
    // Initialization Methods
    ///////////////////////////////////////////

    // Initialize this library
    api.init = function (constants) {

        // Seed / default the constants
        appConstants = constants;

        // Initialize the jQuery cache
        api.initJQueryCache();

        // Let's single-thread the following initialization methods
        // And ensure that the data loads before we initialize the UI
        api.getRecipeCategories();
    	api.getViewTypes();
    	api.getRecipeURLDefinitions();
        
        // Initialize the UI Controls
        api.initUIControls();

        // Remove the prototype JSON overrides
    	if(window.Prototype) {
    	    delete Object.prototype.toJSON;
    	    delete Array.prototype.toJSON;
    	    delete Hash.prototype.toJSON;
    	    delete String.prototype.toJSON;
    	};    	
    	                
        // Determine if the product-code should be set
        api.setProductCode();
        
    };

    // Specify in the product code input field whatever the current product code value is
    api.setProductCode = function () {

        // Initialize local variables
        var defaultImageName;
        
        // Check if a imageName was specified
        if (queryStruct.hasOwnProperty("productcode")) {

        	// Seed the style-list form field, and trigger a submission
        	$cache["style-list"].val(queryStruct["productcode"]);

        	// Process the form submission
        	api.processFormSubmission();        	
        	
        }

    };   
    
    // Initialize the jQuery Cache
    api.initJQueryCache = function () {

        // Create a reference to the submit / processing button
        $cache["btn-submit"] = jQuery(".btn-image-submit");

        // Create a reference to the workspace area
        $cache["workspace"] = jQuery("#panel-workspace");
        
        // Create a reference to the style form-field
        $cache["style-list"] = jQuery("#style-list");
        
        // Create a reference to the select filters
        $cache["select-filter"] = jQuery(".selectpicker");
        $cache["asset-filter"] = jQuery(".assetfilter");
        
        // Create reference to the select-category filters
        $cache["detail-rc-filter"] = jQuery("#detail-image-view .recipecategoryfilter");  
        $cache["asset-rc-filter"] = jQuery("#s7-asset-selector .recipecategoryfilter");
        
    };

    // This method initializes the S7 carousel events
    api.initS7CarouselEvents = function () {

        ////////////////////////////////////
        // S7 Assets Hover Treatment
        ////////////////////////////////////

        // Trigger the hover treatment on the carousel items
        jQuery(".s7-carousel-item-container").hover( function(e) {

            // Create a reference to the current carousel-item container
            var $carouselItem = jQuery(this);

            // Does this carousel item have a product image?
            if ( $carouselItem.find(".s7-placeholder").length === 0 ) {

                // Show the hover-treatment display elements so that they're actionable
                $carouselItem.find(".hover-elements").fadeIn(250);

            } else {

                // If not, then only show the manage treatment
                $carouselItem.find(".manage-treatment").fadeIn(250);

            }

        }, function(e) {

            // Create a reference to the current carousel-item container
            var $carouselItem = jQuery(this);

            // Hide the hover-treatment display elements from view
            $carouselItem.find(".hover-elements").fadeOut(25);

        });

        ////////////////////////////////////
        // Selecting a S7 Asset
        ////////////////////////////////////

        // Trigger the hover treatment on the carousel items
        jQuery("#s7-asset-selector .select-image").on("click", function(e) {

            // Prevent click-throughs
            e.preventDefault();

            // Initialize local variables
            var $thisItem, $s7Asset, $selectedS7Asset;

            // Create a reference to the current object
            $thisItem = jQuery(this);
            $s7Asset = $thisItem.find("img");

            // Don't act on placeholder assets
            if ( $s7Asset.hasClass("s7-placeholder") ) return;

            // Determine if a previously selected asset exists
            $selectedS7Asset = jQuery("#s7-asset-selector img.selected-asset");

            // Was a previously selected asset found?
            if ( $selectedS7Asset.length ) {

                // If so, then restore the original asset treatment
                $selectedS7Asset.attr("src", $selectedS7Asset.data("orig-src"));

            }

            // Remove the selected asset class from all images
            jQuery("#s7-asset-selector img.s7-asset").removeClass("selected-asset");

            // Flag this asset as selected
            $s7Asset.addClass("selected-asset");

            // Cache the original url
            $s7Asset.data("orig-src", $s7Asset.attr("src"));

            // Enable the recipe filter for this display
            $cache["asset-rc-filter"].prop("disabled", "");
            $cache["asset-rc-filter"].selectpicker("refresh");

            // Update the S7 Asset with the current / active recipe
            api.renderS7AssetSelectorRecipeChange();

        });

    };

    // Initialize the UI Button Controls
    api.initUIControls = function () {

        ////////////////////////////////////
        // Initialize the Style Select Picker
        ////////////////////////////////////     	
    	
		// Intialize the select-picker
    	 $cache["select-filter"].selectpicker({ width: 150 });  
    	 
    	 // Listen for selection changes, and reder appropriately
    	 $cache["select-filter"].on("change", function(e) {

    		 // Show the "working" treatment
    		 api.disableWorkspaceDisplay();
    		 
    		 setTimeout(function() {
    		        		 
        		 // Render the assets associated to the current material
        		 api.renderMaterialAssets(true);    			 
    			 
    		 }, 500)
    		 
    		 // Keep the asset filter in-sync with the select-filter
    		 $cache["asset-filter"].val($cache["select-filter"].val());
    		 $cache["asset-filter"].selectpicker("refresh");
    		 
    		 setTimeout(function() {

    			 // Re-enable the workspace display
    			 api.enableWorkspaceDisplay();
    			 
    		 }, 500)
    		     		 
    	 });
    	 
 		////////////////////////////////////
 		// Detail Recipe Category Management
 		////////////////////////////////////     	 
    	 
 		// Initialize the details-display recipe categories filter
    	$cache["detail-rc-filter"].selectpicker({ width: 193 });	    	 
    	
		// Listen for selection changes, and reder appropriately
		$cache["detail-rc-filter"].on("change", function(e) {
		
			// Update the image treatment to respect the recipe category change
			api.renderImageDetailRecipeChange();
		
		});   		
		
		// Listen for recipe-reset events from the image detail dialog
		jQuery("#detail-image-view .btn-reset-recipe-category").on("click", function(e) {
			
			$cache["detail-rc-filter"].val(jQuery(this).data("orig-recipe-category"));
			$cache["detail-rc-filter"].selectpicker("refresh");
			
			// Update the image treatment to respect the recipe category change
			api.renderImageDetailRecipeChange();			
			
		});
		
		// Listen for requests to update the image recipe for a given carousel item
		jQuery("#detail-image-view .btn-apply-recipe-category").on("click", function(e) {
			
			// Initialize local variables
			var recipeCategoryLabel, viewTypeLabel, classArray, imageFileName, 
				imageUrl, elementIndex, $resetButton;
		
			// Retrieve the constants needed to generate an image url
			recipeCategoryLabel = $cache["detail-rc-filter"].val();
			viewTypeLabel = jQuery(".details-container .detail-view-type").html();    
			imageFileName = jQuery(".thumb-container .image-filename").html();

    		// Create a reference to this view-type's reset button
    		$resetButton = jQuery("#" + viewTypeLabel).find(".btn-reset");			
			
			// Generate the carousel tile imageUrl that will be applied to the selected tile
			imageUrl = api.getImageUrl(appConstants["defaultCarouselViewType"], recipeCategoryLabel, imageFileName);
			
			// Parse out the classes, so that we can find the itemClass
			classArray = $selectedCarouselItem.attr("class").split(/\s+/);
			
			// Loop over the class array, and find the "item"
			classArray.forEach( function(thisClass, arrayIndex) {
				
				// Skip the class processing if it's not an item class
				if ( thisClass.indexOf("carousel-item") !== -1 ) return;
				
				// Execute the function to move the contents of this item one position in the current carousel
				api.updateCarouselItem(viewTypeLabel, recipeCategoryLabel, imageFileName, imageUrl, thisClass);
				
			});
			
			// Update the item data for this view-type
			api.setViewTypeAssetData(viewTypeLabel);
			
	    	// If a change has registered for this view-type, then enable the reset-button
	    	if ( api.hasViewTypeChanged(viewTypeLabel) ) {
	    		
	    		// Enable the reset-button for this view-type
	    		api.enableResetButton($resetButton);
	    		
	    		// Change the styling on the view-type label, to denite that it's being edited
	    		api.showViewTypeLabelHasChanges(viewTypeLabel);
	    		
	    	}  else {
	    		
	    		// Disable the reset-button for this view-type
	    		api.disableResetButton($resetButton);    		    		
	    		
	    		// Otherwise, revert the view-type label treatment
	    		api.revertViewTypeLabel(viewTypeLabel);    		
	    		
	    	}    		
			
		});
		
		////////////////////////////////////
		// S7 Asset Carousel Initialization
		//////////////////////////////////// 
		   	 
		// Initialize the asset-filter for the asset selection dialog
   	 	$cache["asset-filter"].selectpicker({ width: 150 });	
		
	   	 // Listen for selection changes, and reder appropriately
	   	 $cache["asset-filter"].on("change", function(e) {
	
 			// Remove the selected asset class from all images
 			jQuery("#s7-asset-selector img.s7-asset").removeClass("selected-asset");	   		 
	   		 
	   		// Load all the Scene7 Assets in the Preview Dialog
	   		api.renderScene7AssetsInPreviewDialog(assetCarouselIsReadOnly);
	   		  		 
	   		// Go to the original slize 
        	$s7Carousel.goToSlide(0);	
        	
	   	 }); 	 	

        // Initialize the S7 Carousel events
        api.initS7CarouselEvents();

        ////////////////////////////////////
        // Applying a Recipe to an S7 Asset
        ////////////////////////////////////  		
 		
 		// Initialize the asset-display recipe categories filter		
    	$cache["asset-rc-filter"].selectpicker({ width: 193 });			
		
		// Listen for selection changes, and reder appropriately
		$cache["asset-rc-filter"].on("change", function(e) {
		
			// Update the image treatment to respect the recipe category change
			api.renderS7AssetSelectorRecipeChange();
		
		});  		

		// Listen for requests to update the image recipe for a given carousel item
		jQuery("#s7-asset-selector .btn-select-image").on("click", function(e) {

			// Initialize local variables
			var $selectedS7Asset, $selectedS7CarouselItem, $carouselContainer, recipeCategoryLabel,
				viewTypeLabel, imageFileName, imageUrl, elementIndex, classArray, $resetButton;

			// Create a reference to the selected s7 asset
 			$selectedS7Asset = jQuery("#s7-asset-selector img.selected-asset");

 			// Was a selected asset found? If not, exit
 			if ( !$selectedS7Asset.length ) return;

 			// Create a reference to the carousel-related elements we need to query
 			$carouselContainer = $selectedCarouselItem.closest(".carousel-container");
 			$selectedS7CarouselItem = $selectedS7Asset.closest(".s7-carousel-item-container");

			// Retrieve the constants needed to generate an image url
			recipeCategoryLabel = $cache["asset-rc-filter"].val();
			viewTypeLabel = $carouselContainer.attr("id");
			imageFileName = $selectedS7CarouselItem.find(".image-filename").html();
    		$resetButton = jQuery("#" + viewTypeLabel).find(".btn-reset");

			// Take the display url for this asset
			imageUrl = $selectedS7Asset.attr("src");

			// Parse out the classes, so that we can find the itemClass
			classArray = $selectedCarouselItem.attr("class").split(/\s+/);

			// Loop over the class array, and find the "item"
			classArray.forEach( function(thisClass, arrayIndex) {

				// Skip the class processing if it's not an item class
				if ( thisClass.indexOf("carousel-item") !== -1 ) return;

				// Execute the function to move the contents of this item one position in the current carousel
				api.updateCarouselItem(viewTypeLabel, recipeCategoryLabel, imageFileName, imageUrl, thisClass);

			});

	    	// Render the carousel item count for the current carousel
	    	api.renderCarouselLabelDisplay($carouselContainer);

			// Update the item data for this view-type
			api.setViewTypeAssetData(viewTypeLabel);

            // Update the edited treatment for this view-type
            api.showCarouselItemsAsEdited(viewTypeLabel);

	    	// If a change has registered for this view-type, then enable the reset-button
	    	if ( api.hasViewTypeChanged(viewTypeLabel) ) {

	    		// Enable the reset-button for this view-type
	    		api.enableResetButton($resetButton);

	    		// Change the styling on the view-type label, to denite that it's being edited
	    		api.showViewTypeLabelHasChanges(viewTypeLabel);

	    	}  else {

	    		// Disable the reset-button for this view-type
	    		api.disableResetButton($resetButton);

	    		// Otherwise, revert the view-type label treatment
	    		api.revertViewTypeLabel(viewTypeLabel);

	    	}

		});
 		
        ////////////////////////////////////
        // Handle Style / Material Submissions
        //////////////////////////////////// 		
		
        // Listen to "enter" submits from the form field
         $cache["style-list"].on("keypress", function (event) {

            // Was the enter key pressed?
            if(event.which == "13"){
                            	
            	// Process the form submission
            	api.processFormSubmission();

            }
            
        });		
		
        // Initialize the submit button
        $cache["btn-submit"].on("click", function(e) {

        	// Process the form submission
        	api.processFormSubmission();

        }); 
               
        ////////////////////////////////////
        // Override the Close Behavior on Alerts
        ////////////////////////////////////         
        
		// Initialize the listener that allows us to close and re-use alerts
		jQuery(".alert .close").on("click", function(e) {
			
			// Prevent default behaviors from occurring
			e.stopPropagation();
			e.preventDefault();
			
			// Hide the message / fade it out
			jQuery(this).parent().fadeOut(500);

		});	        

        ////////////////////////////////////
        // Focus on the Style List
        //////////////////////////////////// 		
		
    	// Begin by placing the focus on the style listing
    	$cache["style-list"].focus();         	
    	   
        ////////////////////////////////////
        // Reset a View-Type Confirmation Trigger
        ////////////////////////////////////     	
    	
        // Force a re-load of the current material
        jQuery(".btn-discard-global-changes").on("click", function(e) {
        	
    		// Fire the method that is used to reset the entire material
    		api.resetAllCarouselItems(true);  

        }); 
    	
        // Force a re-load of the current view-type's display
        jQuery(".btn-discard-changes").on("click", function(e) {

    		// Create a reference to the current / active carousel container
    		var $carouselContainer = jQuery("#" + currentViewType);    	
        	
    		// Fire the method that is used to reset the carousel with its original content
    		api.resetCarouselItems($carouselContainer);   

        });        	
    	
        // When a user cancels loading a new style, re-display the active product-code
        jQuery(".btn-reset-product-code").on("click", function(e) {
        	
        	// Re-seed the previously selected style
        	$cache["style-list"].val(processedProductCodeText);
        	
        });
        
        // When a user cancels loading a new style, re-display the active product-code
        jQuery(".btn-discard-advance-changes").on("click", function(e) {
        	
        	// Process the current product-code
        	api.processProductCode();
        	
        });

        ////////////////////////////////////
        // Re-Display Bootstrap-Select 
        ////////////////////////////////////        

        // Re-display the suppressed select control
        jQuery("body").on("click", function(e) {
        	api.renderPrototypeSuppressedControls();
        });
        
        // Re-display the suppressed select control
        jQuery(".selectpicker").on("click", function(e) {
        	api.renderPrototypeSuppressedControls();
        });	

        ////////////////////////////////////
        // Custom Events
        ////////////////////////////////////

        // Listen for the custom render.images event
        jQuery("body").on("s7/render.images", function(e) {

        	// Consolidate the assets from Scene 7
        	api.consolidateScene7Assets(e["MATERIALCODES"]);
        	
        });
        			
        // Listen for the asset-select modal to be closed
        jQuery("#s7-asset-selector").on("hidden.bs.modal", function (e) {
        
			// Remove the selected asset class from all images
			jQuery("#s7-asset-selector img.s7-asset").removeClass("selected-asset");        

        });
			
        // Listen for the asset-select modal to be shown
        jQuery("#s7-asset-selector").on("shown.bs.modal", function (e) {

        	// Initialize local variables
        	var $options, $thisOption;
                	
        	// Has the carousel been initialized
        	if ( isS7CarouselInitialized !== true ) {
        		
        		// Initialize the slider for the newly-rendered carousel
        		$s7Carousel = jQuery("#s7-asset-selector .s7-carousel").bxSlider({
        		  minSlides: 3,
        		  maxSlides: 4,
        		  slideWidth: 188,
        		  slideMargin: 10,
        		  pager: false,
        		  hideControlOnEnd : true,
        		  infiniteLoop: false	  		  
        		});  
        		
        		// Once the carousel is initialized, show it
        		jQuery(".s7-carousel-container").css("visibility", "visible");
        		
        		// Flag it as initialized
        		isS7CarouselInitialized = true;        		
        		
        	}
        	
        	// Have empty entries been purged from the asset-filter?
        	if ( hasPurgedEmptyAssetFilterEntries !== true ) {
        		
        		// Create a reference to the current set of options
        		$options = $cache["asset-filter"].find("option");
        		
        		// Iterate over each otpion
        		$options.each( function(optionIndex, thisOption) {
        		
        			// Reference the current option
        			$thisOption = jQuery(thisOption);
        			
        			// Check if the current material has any s7 assets
        			if ( $thisOption.data("s7asset-count") === undefined ) {
        				
        				// If not, then let's remove it
        				$thisOption.remove();
        				
        			}
        			
        		});
        		        		
        		// Update the asset-filter display
        		$cache["asset-filter"].selectpicker("refresh");
        		
        		// Flag it as purged
        		hasPurgedEmptyAssetFilterEntries = true;
        		
        	}
        	
        	// Force the first page to always be displayed
        	$s7Carousel.goToSlide(0);
        	
        });    
        	
    }; 

    ///////////////////////////////////////////
    // Data Parsing Methods
    ///////////////////////////////////////////   
    
    // Generate the JSON document that will be submitted for processing
    api.generateImageAssignments = function () {
    	
    	// Initialize local variables
    	var output, sortedViewTypes, sortedMaterials, jsonOutput, styleAssets, materialCode, recipeCategory, recipeImageUrl;
    	
    	// Initialize the summary arrays
    	sortedViewTypes = [];
    	sortedMaterials = [];
    	
    	// Loop over each view type and capture each label
    	viewTypes.forEach( function(thisItem, itemIndex) {
    		sortedViewTypes.push(thisItem["VIEWTYPE"]);
    	});

    	// Sort the view-type labels
    	sortedViewTypes.sort();
    	
    	// Loop over each material and capture the material code
    	for ( var thisMaterial in productImageDefinitions[styleCode]["MATERIALS"]){
    		sortedMaterials.push(thisMaterial);
    	}
    	
    	// Initialize the output structure
    	output = {};

    	// Seed the style code
    	output["id"] = styleCode;
    	
    	// Create the image-groups
    	output.image_groups = [];
    	
    	// Loop over each of the sorted view-types
    	sortedViewTypes.forEach( function(thisViewType, itemIndex) {

    		// Create a reference to the current collection of assets for this view-type
    		styleAssets = productImageDefinitions[styleCode]["VIEWTYPES"][thisViewType];

    		// Create the base image object for this view-type
    		var viewTypeObj = {
    			images: [],
    			view_type: thisViewType
    		};
    		
    		// Loop over each asset that is found
    		styleAssets.forEach( function(thisAsset, itemIndex) {

                // Derrive the recipe category from the asset url
                recipeCategory = api.getRecipeCategoryFromUrl(thisAsset["URL"]);

                // Build out the asset url with the new / latest recipe definition
                thisAsset["URL"] = api.getImageUrl(thisViewType, recipeCategory, thisAsset["FILENAME"]);

				// Append this asset definition to the view type object
				viewTypeObj["images"].push(thisAsset["URL"].replace(akamaiUrl, ""));
    			
    		});    			
    		    		   
    		// Append the current view-type object to the image-groups array
        	output.image_groups.push(_.clone(viewTypeObj, true));           		
    		
    	});

		// Loop over each of the materials associated to this style
		sortedMaterials.forEach( function(thisMaterial, materialIndex) {
			
			// Create a reference to the current material code
			materialCode = thisMaterial.split("-")[1];
									
	    	// Loop over each of the sorted view-types
	    	sortedViewTypes.forEach( function(thisViewType, itemIndex) {	    			

        		// Create a reference to the current collection of assets for this view-type
        		var materialAssets = productImageDefinitions[styleCode]["MATERIALS"][thisMaterial]["VIEWTYPES"][thisViewType];

        		// Create the base image object for this view-type
        		var viewTypeObj = {
        			images: [],
        			variation_value: materialCode,
        			view_type: thisViewType
        		};
        		
        		// Loop over each asset that is found
        		materialAssets.forEach( function(thisAsset, itemIndex) {

                    // Derrive the recipe category from the asset url
                    recipeCategory = api.getRecipeCategoryFromUrl(thisAsset["URL"]);

                    // Build out the asset url with the new / latest recipe definition
                    thisAsset["URL"] = api.getImageUrl(thisViewType, recipeCategory, thisAsset["FILENAME"]);

    				// Append this asset definition to the view type object
    				viewTypeObj["images"].push(thisAsset["URL"].replace(akamaiUrl, ""));
        			
        		});
        		
        		// Append the current view-type object to the image-groups array
            	output.image_groups.push(_.clone(viewTypeObj, true));    
            			            	
			}); 		            	
            	
		});      	
 		
    	// Debugging (let's see and compare the output)
    	jsonOutput = JSON.stringify(output);

    	// Return the output
    	return output;
    	    	
    };
       
    ///////////////////////////////////////////
    // Ajax Service Methods
    ///////////////////////////////////////////    

    // This method generates an export of product image assignments
    api.exportProductImageAssignments = function () {

        // Initialize local variables
        var jsonUrl, imageAssignments;

        // Build out the collection of image assignments for this product code
        imageAssignments = api.generateImageAssignments();

        // Build out the URL used to save / process image assignments
        jsonUrl = appConstants["ajaxSaveProductImageAssignmentsUrl"];

        // Disable the workspace display
        api.disableWorkspaceDisplay();

        // Post the save operation
        jQuery.ajax({
            type: "POST",
            url: jsonUrl,
            data: { imageAssignments : JSON.stringify(imageAssignments), productCode : styleCode, generateExport: true },
            dataType: "json"
        }).success(function (response) {

            // Was the save processed successfully?
            if( response["RESULT"] === true ) {

                // If so, then show an alert explaining that the save was successful
                api.showAlert("success", appConstants["messages"]["SUCCESSFUL_EXPORT"]);

            } else {

                // If so, then show an alert explaining that no materials could be retrieved
                api.showAlert("danger", "<b>Whoops!</b>&nbsp;" + response["ERRORMESSAGE"]);

            }

        }).done(function() {

            // Record that the method has completed
            console.log("api.exportProductImageAssignments(): Completed.");

            // Re-enable the workspace display
            setTimeout(function() {
                api.enableWorkspaceDisplay();
            }, 1000);

        }).fail(function (e) {

            // If so, then show an alert explaining that no materials could be retrieved
            api.showAlert("danger", "<b>Whoops!</b>&nbsp;" + appConstants["messages"]["UNKNOWN_ERROR"]);

            // Re-enable the workspace display
            setTimeout(function() {
                api.enableWorkspaceDisplay();
            }, 1000);

        });

    };

    // This method saved image assignments to Demandware
    api.saveProductImageAssignments = function () {
    	
        // Initialize local variables
        var jsonUrl, imageAssignments;
        
        // Build out the collection of image assignments for this product code
        imageAssignments = api.generateImageAssignments();        
        
        // Build out the URL used to save / process image assignments
        jsonUrl = appConstants["ajaxSaveProductImageAssignmentsUrl"];

        // Disable the workspace display
        api.disableWorkspaceDisplay();
        
        // Post the save operation
        jQuery.ajax({
            type: "POST",
            url: jsonUrl,
            data: { imageAssignments : JSON.stringify(imageAssignments), productCode : styleCode, generateExport: false },
            dataType: "json"            	
        }).success(function (response) {
        	
        	// Was the save processed successfully?
        	if( response["RESULT"] === true ) {
        		
            	// If so, then show an alert explaining that the save was successful
            	api.showAlert("success", appConstants["messages"]["SUCCESSFUL_SAVE"]);   
            	
                // Reset the original recipe definition as the newly saved object
                originalProductImageDefinitions = _.clone(productImageDefinitions, true);
		
                // Disable the save-all (since the save was successful)
                api.disableGlobalSaveAllButton();
                api.disableGlobalResetButton();
                
                // Remove the "edit" icons from the select filter
                api.removeIconsFromSelectFilter();
                
                // Disable the reset buttons for each view-type
                jQuery(".btn-reset").addClass("disabled");
                jQuery(".btn-reset").removeClass("carousel-button-enabled");

        	} else {
        		
            	// If so, then show an alert explaining that no materials could be retrieved
            	api.showAlert("danger", "<b>Whoops!</b>&nbsp;" + response["ERRORMESSAGE"]);                
                
        	}
        	
        }).done(function() {

            // Record that the method has completed
            console.log("api.saveProductImageAssignments(): Completed.");

            // Restore the carousel title styles
            api.showMaterialAsUnChanged();

            // Remove the edited treatments for all view-type carousels
            api.removeEditedTreatments();

            // Update the view-type carousels with their related edits
            api.updateViewTypeCarousels();

            // Re-enable the workspace display
            setTimeout(function() {
            	api.enableWorkspaceDisplay();
            }, 1000);

        }).fail(function (e) {        	
        	
        	// If so, then show an alert explaining that no materials could be retrieved
        	api.showAlert("danger", "<b>Whoops!</b>&nbsp;" + appConstants["messages"]["UNKNOWN_ERROR"]);  

            // Re-enable the workspace display
            setTimeout(function() {
            	api.enableWorkspaceDisplay();
            }, 1000);

        });    
    
    };        
        
    // This method retrieves all recipe categories configured in Demandware
    api.getRecipeCategories = function () {

        // Initialize local variables
        var result, jsonUrl;

        // Build out the URL where the recipe json is stored
        jsonUrl = constants["ajaxGetRecipeCategoriesUrl"];

        // Retrieve the recipe JSON using the jsonUrl
        jQuery.getJSON(jsonUrl, function (data) {

            // Cache the recipe categories
            recipeCategories = data;

            // With the data retrieved, render the recipe category filter
            api.renderImageDetailsRecipeCategoryFilter();            
            
        }).done(function() {
        	
        	// Audit that the method has completed
            console.log("api.getRecipeCategories(): Completed.");

        }).fail(function(e) {

        	// Audit any errors
        	console.log(e);

        });

        // Return the json data
        //noinspection JSUnusedAssignment
        return result;

    };    
    
    // TODO: Migrate the getViewTypes function to a UA.S7API function
    // This method retrieves all active view-types configured in Demandware
    api.getViewTypes = function () {

        // Initialize local variables
        var result, jsonUrl;

        // Build out the URL where the view-type json is stored
        jsonUrl = constants["ajaxGetViewTypesUrl"];
        
        // Retrieve the recipe JSON using the jsonUrl
        jQuery.getJSON(jsonUrl, function (data) {

            // Cache the view types
            viewTypes = data;             
            
        }).done(function() {

        	// Record that the method has completed
            console.log("api.getViewTypes(): Completed.");

        }).fail(function(e) {
        
        	// Audit any errors
        	console.log(e);
        
        });

        // Return the json data
        //noinspection JSUnusedAssignment
        return result;

    };     
    
    // TODO: Migrate the getViewTypes function to a UA.S7API function
    // This method retrieves all recipe definitions configured in Demandware
    api.getRecipeURLDefinitions = function () {

        // Initialize local variables
        var result, jsonUrl;

        // Build out the URL where the recipe definition url values are stored
        jsonUrl = constants["ajaxGetRecipeUrlDefinitionUrl"];
        
        // Retrieve the recipe JSON using the jsonUrl
        jQuery.getJSON(jsonUrl, function (data) {

            // Cache the recipe definitions
        	recipeDefinitions = data;

        }).done(function() {

        	// Record that the method has completed
            console.log("api.getRecipeURLDefinitions(): Completed.");

        }).fail(function(e) {
        
        	// Audit any errors
        	console.log(e);
        
        });

        // Return the json data
        //noinspection JSUnusedAssignment
        return result;

    };         
    
    // This method retrieves the product asset definitions from Demandware
    api.getProductImageDefinitions = function (productCode) {
    	
        // Initialize local variables
        var jsonUrl;
        
        // Build out the URL where the view-type json is stored
        jsonUrl = appConstants["ajaxGetProductImageDefinitionsUrl"];
        
        // Post the save operation
        jQuery.ajax({
            type: "POST",
            url: jsonUrl,
            processData: false,
            data: "defaultViewType=&productCodes=" + productCode,
            dataType: "json"
        }).success(function (response) {
        	
            // Was the save processed successfully?
            if( response["RESULT"] === true ) {
            	
            	// Check if any invalid materials were found / identified?
            	if ( response.hasOwnProperty("INVALIDSTYLES") ) {
            		
            		// If so, then render the response errors based on what was returned by the server
            		api.showServiceResponseErrors(response);
            		
            	} else {
            		            		
                	// Cache the product image definitions
                	productImageDefinitions = _.clone(response["PRODUCTCODES"], true); 
                	
                	// Create a read-only copy of the product-image definitions
                	originalProductImageDefinitions = _.clone(productImageDefinitions, true); 

                	// Validate that the form entry is present in the image definition object
                	api.validateFormEntryAgainstImageDefinitions(productImageDefinitions);            		
                	                	
                	// Render the productImage display
                	api.renderProductImagesDisplay(productImageDefinitions);
                	
                	// Retrieve the Scene7 assets for this collection of materials
                	api.getScene7Assets(productImageDefinitions);
                	            		            		
            	}
            	            	
            } else {

            	// Log the error
                console.log(["Whoops!", response]);

            	// If so, then show an alert explaining that no materials could be retrieved
            	api.showAlert("danger", appConstants["messages"]["COULD_NOT_RETRIEVE_MATERIALS"], 20);
                                     
            }

        }).done(function() {

            // Hide the overlay (since the error occurred)
        	api.enableWorkspaceDisplay();            	
        	
            // Record that the method has completed
            console.log("api.getProductImageDefinitions(): Completed.");           

        }).fail(function (e) {

            // Hide the overlay (since the error occurred)
            api.enableWorkspaceDisplay();

            // Log the error to the console
            console.log(e.message);

        });

    };
        
    // This method is used to retrieve the collection of Scene7 assets associated
    // to each identified material found with this style
    api.getScene7Assets = function(productImageDefintions) {
    	
    	// Initialize local variables
    	var materialsCollection;
    	
    	// Create a reference to the materials object
    	materialsCollection = productImageDefinitions[styleCode]["MATERIALS"];
    	
    	// Loop over the collection of materials, and render each option
    	for ( var thisMaterialCode in materialsCollection ) {
			
    		// For each material code, let's query Scene 7 
    		UA.S7.getProductMaterialAssetsFromScene7(thisMaterialCode);    		
			    		
    	}    	
    		    	
    };    
    
    // Return the API contents
    return api;

}();

//////////////////////////////////////////////
// Open To-Do's / Refactoring Tasks
//////////////////////////////////////////////
// TODO: Remove all AJAX service calls to a UA.S7AJAX class.
