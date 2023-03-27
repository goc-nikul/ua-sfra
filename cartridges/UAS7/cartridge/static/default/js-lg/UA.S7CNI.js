/*global UA, $, jQuery, Backbone */
/*jslint browser: true, maxerr: 50, indent: 4, plusplus: true, nomen: true */
UA.S7CNI = function () {
    'use strict';

    // Initialize local variables
    var api = {},

    // Default the constants collection
    appConstants,    
    
    // Initialize the variable used to store the "style clipboard"
    styleClipboard = '',
    
    // Initialize the variable used to store the array of productCodes to process
    productCodesArray = [],
    
    // Initialize the object used to store the product image definitions
    productImageDefinitions,

    // Initialize the original productCodes copy / content
    originalProductCodesText,
    
    // Initialize the processed productCodes text
    processedProductCodesText,
    
    // Initialize the jQuery object cache
    $cache = {},
    
    // Initialize the variable used to reference the slider display
    $productImageSlider,

    // Capture the current query string structure
    queryStruct = UA.URL.getQueryStringAsStruct(),      
    
    // Seed the Akamai base / root url constants (used to render Scene 7 Preview Images)
    akamaiUrl = 'https://underarmour.scene7.com/is/image/Underarmour/',
    originUrl = 'https://origin-d4.scene7.com/is/image/Underarmour/';

    // This method retrieves the product / material / asset definitions from Demandware
    api.getProductImageDefinitions = function (productCodesArray) {
    	
        // Initialize local variables
        var jsonUrl;
        
        // Build out the URL where the view-type json is stored
        jsonUrl = appConstants["ajaxGetProductImageDefinitionsUrl"];
        
        // Post the save operation
        jQuery.ajax({
            type: "POST",
            url: jsonUrl,
            processData: false,
            data: "defaultViewType=" + appConstants["defaultViewType"] + "&productCodes=" + productCodesArray,
            dataType: "json"
        }).success(function (response) {
        	
            // Was the save processed successfully?
            if( response["RESULT"] === true ) {

            	// Check if any invalid materials were found / identified?
            	if ( response.hasOwnProperty("INVALIDMATERIALS") || response.hasOwnProperty("INVALIDSTYLES") ) {
            		
            		// Default the error-item count
            		var itemCount = 0;
            		
            		var verbContent = "is";
            		var pluralSuffix = "s";
            		
            		// Add / summarize the total number of invalid styles / materials returned
                	if ( response.hasOwnProperty("INVALIDMATERIALS") ) itemCount = itemCount + response["INVALIDMATERIALS"].length;            		
                	if ( response.hasOwnProperty("INVALIDSTYLES") ) itemCount = itemCount + response["INVALIDSTYLES"].length;            		
            		
            		// Build out an alertMessage notifying the user that some of the materials that were submitted were invalid
            		var alertMessage = "<b>Check Your Entries!</b> &nbsp;";
            		
            		// If the invalidMaterials / styles message was passed, then output the materials that were identified
            		if ( response.hasOwnProperty("INVALIDMATERIALS") ) alertMessage = alertMessage + ' ' + response["INVALIDMATERIALS"].join(", ");
                	if ( response.hasOwnProperty("INVALIDMATERIALS") && response.hasOwnProperty("INVALIDSTYLES") ) alertMessage = alertMessage + ", ";
            		if ( response.hasOwnProperty("INVALIDSTYLES") ) alertMessage = alertMessage + ' ' + response["INVALIDSTYLES"].join(", ");
            		
            		// Check the itemCount, and adjust the verb display
            		if ( itemCount > 1)  verbContent = "are";

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
            		api.showAlert("warning", alertMessage);
            		
            	}
            	
            	// Cache the product image definitions
            	productImageDefinitions = response["PRODUCTCODES"];
                        	
                // Clear the workspace mark-up
                $cache["workspace"].html("").fadeOut(250);            	
            	
                // Show and re-enable the workspace
                setTimeout( function(){
                    $cache["workspace"].fadeIn(250);       
                }, 250)
     	
            	// Render the productImage display
            	api.renderProductImagesDisplay(productImageDefinitions);
            	
            } else {

            	// Log the error
                console.log(["Whoops!", response]);

            	// If so, then show an alert explaining that no materials could be retrieved
            	api.showAlert("danger", appConstants["messages"]["COULD_NOT_RETRIEVE_MATERIALS"]);
                
                // Hide the overlay (since the error occurred)
                jQuery("#panel-workspace").ObjectOverlay("hide");         
                
            	// Hide the loading icon
            	jQuery(".loading-data-icon").hide();	                
                
            }

        }).done(function() {

            // Hide the overlay (since the error occurred)
            jQuery("#panel-workspace").ObjectOverlay("hide");                 	
        	
            // Record that the method has completed
            console.log("api.getProductImageDefinitions(): Completed.");           

        }).fail(function (e) {

            // Hide the overlay (since the error occurred)
            jQuery("#panel-workspace").ObjectOverlay("hide");                 	
        	
            // Log the error to the console
            console.log(e.message);

        });

    };

    // This function is used to render the Scene7 Images Display
    api.renderScene7ImagesDisplay = function (materialObj) {    
    	
    	// Initialize local variables
    	var $templateContent, $s7ListGroup, imagesArray, productCode, dwImagesArray,
    		$defaultS7ListItem, $s7CarouselLink, imageUrl, imageLink, imageFound,
    		nonPSImagesArray, substringStart, substringStop, imageSuffix;
    
    	// Iterate over the keys in the material object
    	for ( var thisKey in materialObj ) {
    		
    		// Create a reference to the template content object container
    		$templateContent = jQuery("#" + thisKey);
    		
    		// Find the s7 list group
    		$s7ListGroup = $templateContent.find(".scene7-images");
    		
    		// Create a reference to the current imagesArray
    		imagesArray = materialObj[thisKey];
    		dwImagesArray = $templateContent.data("assets");
    		nonPSImagesArray = [];
    		
    		// Track the total number of Scene7 / Non-Hollow Man images
    		$templateContent.data("s7-assets", imagesArray);
    		$templateContent.data("nonPS-assets", nonPSImagesArray);
    		
    		// Were any images found?  If not, continue
    		if ( imagesArray.length === 0 ) continue;
    		
    		// Since we have images, flag that images exist
    		$templateContent.data("no-images", false);

    		// If more Scene 7 images than DW images exist, then flag / call out that new images exist
    		if ( imagesArray.length > dwImagesArray.length ) $templateContent.data("image-differences", true);
    		
    		// Find the default "no images found" list-item
   			$defaultS7ListItem = $templateContent.find(".no-images-found");    		
    		    		   			
   			// Remove the list item from the display
   			$defaultS7ListItem.remove();
   			
    		// Find the panel, remove the danger panel class, and add the default class
    		$s7ListGroup.parent(".panel").removeClass("panel-danger").addClass("panel-default");

    		// Remove the 100% width column definitions, and replace them with the two column grid view
    		$templateContent.find(".s7-image-listing").addClass("col-lg-6 col-md-6").removeClass("col-lg-12 col-md-12");
    		
    		// Show the Scene 7 image display
    		$templateContent.find(".s7-image-container").show();
    		
            // Create a reference to the modal carousel link
            $s7CarouselLink = $templateContent.find(".s7-modal-carousel-link");

            // Loop over the collection of images, and render the preview links
    		imagesArray.forEach( function(thisImage, arrayIndex) {
    			
    			// Default the image-found property
    			imageFound = "<span></span>";
    			
    			// Build out the image-url for this image
    			imageUrl = akamaiUrl + thisImage + appConstants["recipeSuffix"];
    			
    			// Calculate the image suffix
    			substringStart = thisImage.length-2;
    			substringStop = thisImage.length;
    			
    			// Calculate the image suffix for this display
    			imageSuffix = thisImage.substring(substringStart, substringStop)
    			
    			// Check if this image is a hollow-man image; if not, track it
    			if ( thisImage.substring(0,2) !== "PS" && (imageSuffix !== '_F' && imageSuffix !== '_B') ) {
    				nonPSImagesArray.push(thisImage);
    			}

    			// Derrive the product code this material is associated to
    			productCode = thisKey.replace("PS", "");

                // Attach the product code to the carousel link for reference during invocation
                $s7CarouselLink.data("product-code", productCode);
                                
    			// Check and see if the current image exists and was found in Demandware
    			if ( $templateContent.data("assets").indexOf(thisImage) > -1 ) imageFound = "<span class='image-found glyphicon glyphicon-ok'></span>";
    			
    			// Check and see if the current image is new and was not found in Demandware
    			if ( $templateContent.data("assets").indexOf(thisImage) === -1 &&  nonPSImagesArray.indexOf(thisImage) > -1 ) imageFound = "<span class='image-found glyphicon glyphicon-certificate'></span>";
    			
    			// Build out the image-link for the Scene 7 image that was found
    			imageLink = '<a href="#" data-image-filename="' + thisImage + '" data-product-code="' + productCode + '" data-src="' + imageUrl + '" class="list-group-item s7-image-link">' + imageFound + thisImage + '</a>';
    			
    			// Append the image link to the S7 list group
    			$s7ListGroup.append(imageLink);
    			
    		});

    		// Update the contents of the nonPS assets array
    		$templateContent.data("nonPS-assets", nonPSImagesArray);    		
    		
    		// If more non-hollow man Scene 7 images than DW images exist, then flag / call out that new images exist
    		if ( nonPSImagesArray.length > dwImagesArray.length ) $templateContent.data("new-images", true);
    		    		    		
    		// Ensure that the first S7 image is being rendered
    		api.renderFirstS7Image($templateContent);
    		
    		// Prevent clicks on empty list-items from being actionable
    		jQuery("a.panel-danger").on("click", function(e) {
    			
				// Prevent the default event from bubbling
				e.preventDefault();    			
    			
    		});
    		
    		// Attach the display events for the S7 image links
    		jQuery(".s7-image-link").on("click", function(e) {
    			
				// Prevent the default event from bubbling
				e.preventDefault();
				
				// Initialize local variables
				var $contentContainer, $previewImage, $previewImageLink, $imageFileName, $this, productCode;
				
				// We need access to the data elements on the clicked-link
				$this = jQuery(this);
				
				// Initialize the product code
				productCode = $this.data("product-code");
				
				// Create a reference to the content container for this specific product-code
				$contentContainer = jQuery("#" + productCode);
				
				// Find the preview image and image file-name
				$previewImage = $contentContainer.find(".s7-image");
				$imageFileName = $contentContainer.find(".s7-image-filename");
				$previewImageLink = $contentContainer.find(".s7-modal-carousel-link");
				
				// Change the image source url and file-name
				$previewImage.prop("src", $this.data("src"));
				$imageFileName.html($this.data("image-filename"));
				
				// Take the image-link with the image filename of the image being displayed
				$previewImageLink.data("image-filename", $this.data("image-filename"));
				$previewImageLink.data("product-code", productCode);
				
				// Remove the active class for each of the product-code's link items
				$contentContainer.find(".s7-image-link").removeClass("active");
				
				// Show the current product image as selected
				$this.addClass("active");
				
			});
    			
    	}
    	
    };

    // This function is used to render the first S7 Image for a list-group
	api.renderFirstS7Image = function ($templateContent) {
		
		// Initialize local variables
		var $s7Image, $s7ImageFileName, imageHTML, $firstImage, $s7ImageLink;
		
		// Create a reference to the S7Image and fileName
		$s7Image = $templateContent.find(".s7-image");
		$s7ImageFileName = $templateContent.find(".s7-image-filename");
        $s7ImageLink = $templateContent.find(".s7-modal-carousel-link");

		// If the image has been rendered, then exit
		if ( $s7Image.data("rendered") !== false ) return;
		
		// Retrieve the first anchor link in the Scene7 images listing
		$firstImage = $templateContent.find(".scene7-images a:first-child");
		
		// Seed the image and image-filename
		$s7Image.attr("src", $firstImage.data("src"));
		$s7ImageFileName.html($firstImage.data("image-filename"));

        // Take the image-link with the image filename of the image being displayed
        $s7ImageLink.data("product-code", $templateContent.prop("id"));
        $s7ImageLink.data("image-filename", $firstImage.data("image-filename"));

		// Build out the image-tag for the display image, adding the lazy-loading reference
		imageHTML = '<img width="252" height="230" class="lazy s7-image" data-original="' + $firstImage.data("src") + '" src="' + appConstants["lazyLoadingImageUrl"] + '">';

		// Replace the in-place image with the lazy-loading image
		$s7ImageLink.html(imageHTML);

        // Flag the first link-item as selected / active
		$firstImage.addClass("active");
		
		// Add logic to change the image border once the image loads
		$s7ImageLink.find(".s7-image").on("load", function(e) {
		
    		// Add the border to the S7 image
    		jQuery(this).addClass("s7-image-border");			
			
    		// Show the Scene 7 image filename 
    		$templateContent.find(".s7-image-filename").show();
    		
		});
		
    	// Initialize the lazy load display for the image mark-up
		$templateContent.find("img.lazy").lazyload({
	    	effect: "fadeIn",
	    	skip_invisible: false,
	    	threshold: 400
	    });		
	    					
	}
        
	// This function is used to render the product options in the show / filter select control
	api.renderProductMaterialFilterOptions = function (productCode, productImages) {
		
		// Initialize local variables
		var $materialOptionGroup, optionHTML;
		
		// Create a reference to the option group and empty it out
		$materialOptionGroup = jQuery(".materials-select-group");

		// Build out the option HTML
		optionHTML = '<option value="' + productCode + '">' + productCode + ' (' + productImages["IMAGES"].length + ')</option>';
		
		// Add the option HTML to the current element
		$materialOptionGroup.append(optionHTML);
		
	};
	
    // This function is used to render the updated product images display
    api.renderProductImagesDisplay = function (productImageDefinitions) {
    	
    	// Clear out the material option group
    	jQuery(".materials-select-group").empty();
    	
    	// Initialize the style clipboard
    	styleClipboard = "";    	
    	
    	// Loop over each of the product codes retrieved
    	jQuery.each( productImageDefinitions, function (productCode, productImages ) {

    		// Render the product image template content
    		api.renderProductImageTemplateContent(productCode, productImages);
    		
    		// For the current style, go ahead and render the style / material filter values
    		api.renderProductMaterialFilterOptions(productCode, productImages);    		
    	
    		// Append the current style to the clipboard
    		styleClipboard = styleClipboard + productCode + "\r\n";
    		
    		// Confirm that this object has a materials node
    		if ( productImages.hasOwnProperty("MATERIALS") ) {
    			
            	// Loop over each of the product codes retrieved
            	jQuery.each( productImages["MATERIALS"], function (materialCode, materialImages ) {
        		
            		// Render the product image template content
            		api.renderProductImageTemplateContent(materialCode, materialImages);        		        	
            		
            		// For the current style, go ahead and render the style / material filter values
            		api.renderProductMaterialFilterOptions(materialCode, materialImages);    	            		

            		// Append the current style to the clipboard
            		styleClipboard = styleClipboard + materialCode + "\r\n";
            		            		
            	});
    			    			
    		}
 		
    	});    		
			    	  	
    	// Hide the overlay once images have begun to load
    	setTimeout(function() {

            // Set the min-height to keep / maintain the height of the current document while loading
            $cache["workspace"].css("min-height", "0");    	
        	    		    		
    		// Hide the panel-workspace overlay
    		jQuery("#panel-workspace").ObjectOverlay("hide");

	    	// Hide the loading icon
	    	jQuery(".loading-data-icon").css("visibility", "hidden");	  
	    	
	    	// Remove the disabled property
			jQuery(".selectpicker").prop("disabled", "");    	    	

			// Re-enable the select-picker (since content has been painted)
			jQuery(".selectpicker").selectpicker("refresh");    			
			
			// Enable the clip-board copy button
			jQuery(".clipboard-copy").prop("disabled", "");
			
    	}, 100);
    	                	    	
    };
    
    // Build out the product-image template content
    api.renderProductImageTemplateContent = function (productCode, productImages) {

    	// Initialize local variables
    	var output;
    	
		// Set the template content, and return the mark-up object that will be displayed
    	output = api.customizeProductImageTemplateContent(productCode, productImages);

    	// Initialize the lazy load display for the image mark-up
	    output.find("img.lazy").lazyload({
	    	effect: "fadeIn",
	    	skip_invisible: false,
	    	threshold: 400
	    });
	    
	    ////////////////////////////////////////////
	    // Append the Click-Listeners for the Product Display
	    ////////////////////////////////////////////
	    
    	// Listen for clicks on the modal carousel for the Demandware Image Display
    	output.find(".modal-carousel-link").on("click", function(e) {
    		
    		// Prevent default events from running
    		e.preventDefault();
    		
    		// Initialize local variables
    		var $this, productCode, $productContent, $modalContent, $productTitle, 
    			$productImages, $imageLink, $carouselContent, $carouselItemTemplate, 
    			$carouselItem, $carouselImage, $carouselContainer;
    		
    		// Create a reference to the current element
    		$this = jQuery(this);

    		// Create a reference to the current product code
    		productCode = $this.data("product-code");

    		// Dont' launch the modal if a product-code wasn't defined
    		if ( $this.data("product-code") === "" ) return;
    		
    		// Retrieve the product and modal content
    		$productContent = jQuery("#" + productCode);
    		$modalContent = jQuery("#detail-image-view");
    		$carouselContent = jQuery("#detail-image-view .carousel");
    		$carouselContainer = jQuery("#detail-image-view .carousel-container");
    		$carouselItemTemplate = jQuery("#carousel-item-template .carousel-item");
    		
    		// Drop the product-code label / title 
    		$modalContent.find(".modal-title-prefix").html("Demandware Product");
    		$modalContent.find(".product-code-label").html(productCode);    		
    		
    		// Clear out the content of the carousel
    		$carouselContent.empty();
    		    		
    		// Retrieve the individual image links
    		$productImages = $productContent.find(".dw-image-link");
    		    		
    		// Loop over the image links
    		$productImages.each( function(arrayIndex, thisImageLink) {
    			
    			// Create a reference to the current image link
    			$imageLink = jQuery(thisImageLink);
    			
    			// Initialize the carousel item
    			$carouselItem = $carouselItemTemplate.clone();
    			        		
    			// Seed the file-name of the image currently being displayed
    			$carouselItem.find(".carousel-asset-label").html($imageLink.data("image-filename"));
    			    			    			
    			// Attach the product code and image-file name to the current item
    			$carouselItem.data("product-code", productCode);
    			$carouselItem.data("image-filename", $imageLink.data("image-filename"));
    			
    			// Build out a new image using the carousel image url 
    			$carouselImage = $carouselItem.find("img");
    			$carouselImage.attr("src", $imageLink.data("src"));
    			$carouselImage.attr("title", $imageLink.data("image-filename"));

    			// Append the image to the carousel item
    			$carouselItem.append($carouselImage);
    				
    			// Append the carousel item to the carousel
    			$carouselContent.append($carouselItem);
    			
    			// Check if the current image is the selected image; if so -- then select it as active
    			if ( $imageLink.data("image-filename") === $this.data("image-filename") ) {    			

    				// Specify the default slide to start / display
    				$productImageSlider.data("start-slide", arrayIndex);
    				
    			}
    			
    		});       		
    		
    		// Show the modal carousel
    		jQuery("#detail-image-view").modal('show');    	

            // Prevent the "scroll-bar" shifting when modals are shown
            jQuery("body").css("overflow-y", "scroll");	       		
    		
    	});
    	
    	// Listen for clicks on the modal carousel on the S7 Image Display
    	output.find(".s7-modal-carousel-link").on("click", function(e) {
    		
    		// Prevent default events from running
    		e.preventDefault();
    		
    		// Initialize local variables
    		var $this, productCode, $productContent, $modalContent, $productTitle, 
    			$productImages, $imageLink, $carouselContent, $carouselContent, 
    			$carouselItemTemplate, $carouselItem, $carouselImage, $carouselContainer;
    		
    		// Create a reference to the current element
    		$this = jQuery(this);

    		// Create a reference to the current product code
    		productCode = $this.data("product-code");
    		
    		// Dont' launch the modal if a product-code wasn't defined
    		if ( $this.data("product-code") === "" ) return;
    		
    		// Retrieve the product and modal content
    		$productContent = jQuery("#" + productCode);
    		$modalContent = jQuery("#detail-image-view");
    		$carouselContent = jQuery("#detail-image-view .carousel");
    		$carouselContainer = jQuery("#detail-image-view .carousel-container");
    		$carouselItemTemplate = jQuery("#carousel-item-template .carousel-item");
    		
    		// Clear out the content of the carousel
    		$carouselContent.empty();

    		// Drop the product-code label / title 
    		$modalContent.find(".modal-title-prefix").html("Scene 7");
    		$modalContent.find(".product-code-label").html(productCode);       		
    		
    		// Retrieve the individual image links
    		$productImages = $productContent.find(".s7-image-link");
    		
    		// Loop over the image links
    		$productImages.each( function(arrayIndex, thisImageLink) {
    			
    			// Create a reference to the current image link
    			$imageLink = jQuery(thisImageLink);
    			
    			// Initialize the carousel item
    			$carouselItem = $carouselItemTemplate.clone();
    			        		
    			// Seed the file-name of the image currently being displayed
    			$carouselItem.find(".carousel-asset-label").html($imageLink.data("image-filename"));
    			    			    			
    			// Attach the product code and image-file name to the current item
    			$carouselItem.data("product-code", productCode);
    			$carouselItem.data("image-filename", $imageLink.data("image-filename"));
    			
    			// Build out a new image using the carousel image url 
    			$carouselImage = $carouselItem.find("img");
    			$carouselImage.attr("src", $imageLink.data("src"));
    			$carouselImage.attr("title", $imageLink.data("image-filename"));

    			// Append the image to the carousel item
    			$carouselItem.append($carouselImage);
    				
    			// Append the carousel item to the carousel
    			$carouselContent.append($carouselItem);
    			
    			// Check if the current image is the selected image; if so -- then select it as active
    			if ( $imageLink.data("image-filename") === $this.data("image-filename") ) {    			

    				// Specify the default slide to start / display
    				$productImageSlider.data("start-slide", arrayIndex);
    				
    			}
    			
    		});
    		
    		// Show the modal carousel
    		jQuery("#detail-image-view").modal('show');    	

            // Prevent the "scroll-bar" shifting when modals are shown
            jQuery("body").css("overflow-y", "scroll");	
    	 		    		
    	}); 		
		
		// Capture any click events on Demandware image links
		output.find(".dw-image-link").on("click", function (e) {

			// Prevent the default event from bubbling
			e.preventDefault();
			
			// Initialize local variables
			var $contentContainer, $previewImage, $previewImageLink, $imageFileName, $this;
			
			// We need access to the data elements on the clicked-link
			$this = jQuery(this);
			
			// Create a reference to the content container for this specific product-code
			$contentContainer = jQuery("#" + $this.data("product-code"));
			
			// Find the preview image and image file-name
			$previewImage = $contentContainer.find(".product-image");
			$imageFileName = $contentContainer.find(".dw-image-filename");
			$previewImageLink = $contentContainer.find(".modal-carousel-link");
			
			// Change the image source url and file-name
			$previewImage.prop("src", $this.data("src"));
			$imageFileName.html($this.data("image-filename"));
						
			// Tag the image-link with the product code
			$previewImageLink.data("product-code", productCode);	
			
			// Take the image-link with the image filename of the image being displayed
			$previewImageLink.data("image-filename", $this.data("image-filename"));
			
			// Remove the active class for each of the product-code's link items
			$contentContainer.find(".dw-image-link").removeClass("active");
			
			// Show the current product image as selected
			$this.addClass("active");
			
		});
    	
		// Append the cloned template content
		$cache["workspace"].append(output);		
		
		// Is this a material code?
		if ( api.isMaterial(productCode) ) {
			
			// If so, then let's query Scene 7 for product images
			UA.S7.getProductMaterialAssetsFromScene7(productCode);
			
		}
		
    };
    
    // This function is used to render the template content for a given product image / product code
    api.customizeProductImageTemplateContent = function (productCode, productImages) {

    	// Initialize local variables
    	var $templateContent, $productTitle, $productImage, $imageLink,
    		$imageFileName, $dwImages, $loadingImage, imageListItemHTML,
    		imageFileNameUrl, imageHTML, firstImageFileName, activeClass, 
    		productAssets, recipeAssignmentUrl;    	
    	
		// Clone the template content
		$templateContent = $cache["product-container-template"].clone();
		
		// Attach the current product code to the template content
		$templateContent.attr("id", productCode);
		
		// Initialize the productAssets array
		productAssets = [];
		
		// Don't hide the template content
		$templateContent.removeClass("hide");
		
		// Create a reference to the current product title
		$productTitle = $templateContent.find(".product-title-link");
		
		// Create a reference to the current image display
		$imageLink = $templateContent.find(".modal-carousel-link");	
		$productImage = $templateContent.find(".product-image");
		$imageFileName = $templateContent.find(".dw-image-filename");
		
		// Create a reference to the Demandware Images listing
		$dwImages = $templateContent.find(".demandware-images");
		
		// Display the product code 
		$productTitle.html(productCode);
		
		// Assign the target window / frame for each link
		$productTitle.attr("target", "_" + productCode);
		
		// Build out the recipe assignment url -- specific to the current product code
		recipeAssignmentUrl = appConstants["recipeAssignmentUrl"] + "?productcode=" + productCode;
		
		// Add the href / url link for the productCode
		$productTitle.attr("href", recipeAssignmentUrl);
		
		// Does the current product code have an image to display?
		if ( productImages["DISPLAYURL"].length > 0 ) {

			// Tag the image-link with the product code
			$imageLink.data("product-code", productCode);	
			
			// Take the image-link with the image filename of the image being displayed
			$imageLink.data("image-filename", productImages["DISPLAYURL"][0]["FILENAME"]);
			
			// Build out the image-tag for the display image, adding the lazy-loading reference
			imageHTML = '<img width="252" height="230" class="lazy product-image" data-original="' + productImages["DISPLAYURL"][0]["URL"] + '" src="' + appConstants["lazyLoadingImageUrl"] + '">';

			// Replace the in-place image with the lazy-loading image
			$imageLink.html(imageHTML);
			
			// Show the filename associated to the image url
			$imageFileName.html(productImages["DISPLAYURL"][0]["FILENAME"]);
			
			// Capture the first image file-name
			firstImageFileName = productImages["DISPLAYURL"][0]["FILENAME"];
			
		} else {

			// Hide the Demandware image container
			$templateContent.find(".dw-image-container").hide();
			
			// Extend the width of the Demandware image listing container
			$templateContent.find(".dw-image-listing").addClass("col-lg-12 col-md-12").removeClass("col-lg-6 col-md-6");
						
		}    		

		// Clear-out the innerHTML for the Demandware / Scene 7 images
		$dwImages.html("");     	
    	
		// Were any images found?
		if ( productImages["IMAGES"].length > 0 ) {
		
    		// Iterate over the product images, and append the output to the dwImages section
    		productImages["IMAGES"].forEach( function(thisImage, arrayIndex) {
    			
    			// Default the active class
    			activeClass = "";
    			
    			// Pre-select the current image being displayed in the sample
    			if (thisImage == firstImageFileName ) activeClass = "active";
    			
    			// Retrieve the display URL associated to a given image
    			imageFileNameUrl = api.getImageFileNameUrl(thisImage, productImages["DISPLAYURL"]);

    			// Build out the image list element -- and include the imageFileName url (so we can toggle images)
    			imageListItemHTML = '<a href="#" data-pos="' + arrayIndex + '" data-image-filename="' + thisImage + '" data-product-code="' + productCode + '" data-src="' + imageFileNameUrl + '" class="list-group-item dw-image-link ' + activeClass + '">' + thisImage + '</a>';
    			
    			// Record the image associated to this product-code
    			productAssets.push(thisImage);    			
    			
    			// Append the imageList mark-up to the temporary variable
    			$dwImages.append(imageListItemHTML);
    			
    		});  		
			    			
		} else {
			
			// If no images were found, then change the display to reflect this
			$dwImages.parent(".panel-default").addClass("panel-danger").removeClass("panel-default");
			
			// Build out the image list element
			imageListItemHTML = '<a href="#" class="list-group-item panel-danger">No assets configured.</a>';
			
			// Append the imageList mark-up to the temporary variable
			$dwImages.append(imageListItemHTML);    			
			
		}	    	

		// Log the collection of assets for a given product
		$templateContent.data("assets", productAssets);
		
		// If images found found in Demandware, then flag this product as merchandised
		if ( productAssets.length > 0 ) {

			// Flag that this product was merchandised
			$templateContent.data("merchandised", true);

			// Flag that this product has images
			$templateContent.data("no-images", false);
		
		}
		
		// Is the current product code a style?  If so, then hide the Scene7 
		if ( api.isStyle(productCode) ) {
			
			// Hide the Scene 7 elements for all style displays
			$templateContent.find(".s7-content").hide();
			
		}
				
		// Return the output variable
		return $templateContent;
    	
    };
    
    // This function is used to identify the imageUrl for a given image fileName
    api.getImageFileNameUrl = function (thisImageFileName, productImages) {
    	
    	// Initialize local variables
    	var output = "";
    	
    	// Loop over the collection of product images
		productImages.forEach( function(thisImageObject, arrayIndex) {
			
			// Was a match for the image file-name found?
			if ( thisImageFileName === thisImageObject["FILENAME"] ) {

				// Update the output variable
				output = thisImageObject["URL"];

				// Exit the function
				return;
				
			}
			
		});
    	
    	// Return the retrieved image url
    	return output;
    	
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

    // This function is used to de-dupe an array of items
    api.dedupeArray = function (arrayObj) {

        // Initialize local variables
        var output, arrayIndex, itemValue;

        // Initialize the output
        output = [];

        // Iterate over the array, and remove duplicates
        jQuery.each(arrayObj, function(arrayIndex, itemValue) {
        
        	// Only add items that don't already exist in the array to the array
        	if (output.indexOf(itemValue) < 0) output.push(itemValue);

        });

        // Return the de-duped array
        return output;

    };

    // This function is used to iterate over a collection of product codes, and remove any
    // product codes that are already inherited by parent codes (ex. materials by styles)
    api.removeInheritedMaterialsFromArray = function (arrayObj) {

        // Initialize local variables
        var output, styleArray, materialArray;

        // Initialize the output and style arrays
        output = [];
        styleArray = [];
        materialArray = [];

        // Iterate over the array, and only include styles
        jQuery.each(arrayObj, function(arrayIndex, itemValue) {

            // Add styles to the style array
            if ( api.isStyle(itemValue) ) styleArray.push(itemValue);

            // Add materials to the materials array
            if ( api.isMaterial(itemValue) ) materialArray.push(itemValue);

        });

        // Duplicate the style array
        output = _.clone(styleArray);

        // Iterate over the material array, and only include materials whose styles are not referenced
        jQuery.each(materialArray, function(arrayIndex, itemValue) {

            // Add materials that are not inherited via an existing style
            if ( styleArray.indexOf(itemValue.split("-")[0]) === -1 ) output.push(itemValue);

        });

        // Sort the output array for formatting
        output.sort();

        // Return the de-duped array
        return output;

    };

    // This method iterates over
    api.removeNonProductCodesFromArray = function (arrayObj) {

        // Initialize local variables
        var output;

        // Initialize the output
        output = [];

        // Iterate over the array, and only include valid styles / materials
        jQuery.each(arrayObj, function(arrayIndex, itemValue) {
        
        	// Only add product / materials that have been validated to this array
            if ( api.isStyle(itemValue) || api.isMaterial(itemValue) ) output.push(itemValue);

        });

        // Return the de-duped array
        return output;

    };
    
    // This method is used to update the display of the alert object present
    api.showAlert = function (alertType, alertMessage) {
    	
    	// Initialize local variables
    	var $alert, $alertContent;
    	
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
    	
    };

    // HACK: This function is used to render the prototype-suppressed controls
    api.showPrototypeSuppressedControls = function () {

    	// Trigger the re-display of the select control
        setTimeout(function(){

            // HACK: Force the display of the bootstrap select control
            jQuery(".bootstrap-select").show();

        }, 0);

    };       
    
    // Check the UI display to see if all items are hidden
    api.checkUIForNoResultsDisplay = function() {
		
		// Initialize local variables
    	var visibilityCount = 0;
		
    	// Wrap this in a timeout, since we're using fadeIn / fadeOut to show and hide elements
    	setTimeout (function () {
    	
        	// Retrieve all the children in the panel-workspace
        	jQuery("#panel-workspace").find(".product-container-template").each( function(arrayIndex, thisItem) {

        		// Check if the current material is visible
        		if ( jQuery(thisItem).css("display") !== "none" ){
        			
        			// Increment the visibility-count
        			visibilityCount ++;
        			
        			// If so, then exit (at least one material is showing)
        			return;
        			
        		}     			            		
        	
        	});	
        	
        	// Are any items visible?
        	if ( visibilityCount === 0 ) {

        		// If the function doesn't exit, then display the "no results" message 
            	api.showAlert("warning", appConstants["messages"]["NO_RESULTS_MESSAGE"]);
        		
        	}
    		
    		
    	}, 300);
    	        	   	    	    	
    };
    
    // This method is used to process the form submission logic
    api.processFormSubmission = function() {
    	
        // Initialize local variables
        var styleList, startArray, dedupedArray, processedInput;

        // Capture the original productCodes text
        originalProductCodesText = $cache["style-list"].val();

        // Capture the form-field value, and remove white space
        styleList = S($cache["style-list"].val()).collapseWhitespace().s;

        // If no value exists, then exit
        if ( styleList.length === 0 ) {
        	
        	// If so, then show an alert explaining that users should enter at least one style or material code
        	api.showAlert("warning", appConstants["messages"]["ENTER_A_STYLE_ERROR"]);

        	// Place the focus on the form field
        	jQuery("#style-list").focus();
        	            	
        	// Exit the function
        	return;	

        }

        // Initialize the de-dupedArray
        dedupedArray = [];

        // Convert the style-list copy to an array, and remove non-product codes
        startArray = api.removeNonProductCodesFromArray(styleList.split(" "));

        // Remove duplicates from the array of productCodes
        dedupedArray = api.dedupeArray(startArray);

        // Remove any inherited material codes from this array
        dedupedArray = api.removeInheritedMaterialsFromArray(dedupedArray);

        // Were the maximum number of productCodes exceeded?
        if ( dedupedArray.length > appConstants["maximumProductCodes"] ) {

            // If so, then limit the listing to the initial collection of productCodes
            productCodesArray = dedupedArray.slice(0, appConstants["maximumProductCodes"]);

        } else {

            // Otherwise, default the style-list
            productCodesArray = dedupedArray;

        }

        // Build out the input string
        processedInput = productCodesArray.join(" ");
        
        // If the current input string matches the last processed one, then exit (no change was made)
        if( processedProductCodesText === processedInput ) return;        
        
        // Reset the form field contents with the updated productCodes array
        $cache["style-list"].val(processedInput);

        // If no product codes are set to be processed, then exit
        if ( productCodesArray.length === 0 ) {

        	// If so, then show an alert explaining that users should enter at least one style or material code
        	api.showAlert("warning", appConstants["messages"]["ENTER_A_STYLE_ERROR"]);

        	// Place the focus on the form field
        	jQuery("#style-list").focus();
        	
        	// Exit the function
        	return;

        }

        // Set the min-height to keep / maintain the height of the current document while loading
        $cache["workspace"].css("min-height", "500px");
        
        // Initialize the overlay
        $cache["workspace"].ObjectOverlay({
        	overlayText: false,
        	overlayEffect: ["grayscale", "blur"],
        	overlayEffectValue: ["1", "2px"]
        });               	
        
        // Show the overlay prior to requesting image definitions
        $cache["workspace"].ObjectOverlay("show");                    
        
    	// Show the loading icon
    	jQuery(".loading-data-icon").css("visibility", "visible");	            

		// Initialize the listner that allows us to close and re-use alerts
		jQuery('.alert .close').trigger("click");       	
    	
        // Retrieve the product definitions for the identified productCodes                
        setTimeout(function() {
        
        	// Cache the product codes text that was processed
        	processedProductCodesText = processedInput;
        	
        	// Process the product codes and retrieve the image definitions
        	api.getProductImageDefinitions(productCodesArray);

        }, 1000);    	
    	
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

        // Initialize the button controls
        api.initUIControls();
        
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
        	$cache["style-list"].val(unescape(queryStruct["productcode"]));

        	// Process the form submission
        	api.processFormSubmission();        	
        	
        }

    };    
    
    // Initialize the jQuery Cache
    api.initJQueryCache = function () {

        // Create a reference to the submit / processing button
        $cache["btn-submit"] = jQuery(".btn-image-submit");

        // Create a reference to the style-list form element
        $cache["style-list"] = jQuery("#style-list");

        // Create a reference to the panel workspace area
        $cache["workspace"] = jQuery("#panel-workspace");

        // Create a reference to the product container template properties
        $cache["product-container-template"] = jQuery(".product-container-template");

    };
   
    // Initialize the UI Button Controls
    api.initUIControls = function () {   	
    	
		// Intialize the select-picker
		jQuery(".selectpicker").selectpicker({ width: 245 });    	

        // Show the clipboard-url copy element
        jQuery("a#clipboard-url").removeClass("hide");		
		
        // Listen for clipboard-copy commands
        jQuery("a#clipboard-url").zclip({
            path: appConstants["zeroClipboardPath"],
            copy: function() { return styleClipboard; },
            afterCopy: function() { return false; }
        });		
        
		// Initialize the listner that allows us to close and re-use alerts
		jQuery('.alert .close').on("click", function(e) {
			
			// Prevent default behaviors from occurring
			e.stopPropagation();
			e.preventDefault();
			
			// Hide the message / fade it out
			jQuery(this).parent().fadeOut(750);

		});		
		
        // Listen to "enter" submits from the form field
        jQuery('#style-list').on('keypress', function (event) {

            // Was the enter key pressed?
            if(event.which == '13'){

            	// Process the form submission
            	api.processFormSubmission();
            	
            }
            
        });			
		
        // Initialize the submit button
        $cache["btn-submit"].on("click", function(e) {

        	// Process the form submission
        	api.processFormSubmission();

        });

		// Initialize the slider for the newly-rendered carousel
        $productImageSlider = jQuery(".carousel").bxSlider();    
        
        // Listen for changes in the selectPicker to filter the UI display
        jQuery(".selectpicker").on("change", function(e) {
        	
        	// Initialize local variables
        	var $selectControl, currentValue
        	
        	// Create a reference to the current select-control
        	$selectControl = jQuery(this);
        	
        	// Initialize the style clipboard
        	styleClipboard = "";
        	
        	// Iterate over the different select-control values
        	switch($selectControl.val()) {
        	
        		// Show all materials
	            case "show-all-materials":

	            	// Show the loading icon
	            	jQuery(".loading-data-icon").css("visibility", "visible");	              	
	            	
	            	// Retrieve all the children in the panel-workspace that are visible 
	            	jQuery("#panel-workspace").find(".product-container-template:hidden").fadeIn(400);

	            	// Hide the loading icon
	            	jQuery(".loading-data-icon").css("visibility", "hidden");	              	

	            	// Get all the style codes embedded in the current display 
	            	jQuery("#panel-workspace").find(".product-container-template").each( function(arrayIndex, thisItem) {
	            		styleClipboard = styleClipboard + jQuery(thisItem).attr("id") + "\r\n";    
	            	});		            	
	            	
	                break;

	            // Show un-merchandised materials
	            case "show-unconfigured-materials":
	            	
	            	// Show the loading icon
	            	jQuery(".loading-data-icon").css("visibility", "visible");	  
	            	
	            	// Retrieve all the children in the panel-workspace  
	            	jQuery("#panel-workspace").find(".product-container-template").each( function(arrayIndex, thisItem) {
	            		
	            		// Hide all merchandised materials -- showing materials that need to be merchandised
	            		if ( jQuery(thisItem).data("merchandised") === true || jQuery(thisItem).data("no-images") === true )  {
	            			
	            			// Hide the merchandised materials
	            			jQuery(thisItem).fadeOut(250);
	            			
	            		} else {
	            			
	            			// Add the current style to the clipboard
		            		styleClipboard = styleClipboard + jQuery(thisItem).attr("id") + "\r\n";    			
	            			
	            			// Ensure that non-merchandised materials show
	            			jQuery(thisItem).fadeIn(250);	            			

	            		}
	            			            		
	            	});	            	
	            	
            		// Check the UI display and see if no-results 
            		api.checkUIForNoResultsDisplay();	            	
	            	
	            	// Hide the loading icon
	            	jQuery(".loading-data-icon").css("visibility", "hidden");	              	
	            	
	                break;

	            // Show materials with image differrences
	            case "show-materials-with-image-differences":

	            	// Show the loading icon
	            	jQuery(".loading-data-icon").css("visibility", "visible");	  	            	
	            	
	            	// Retrieve all the children in the panel-workspace
	            	jQuery("#panel-workspace").find(".product-container-template").each( function(arrayIndex, thisItem) {
	            		
	            		// Hide all materials that have new images to evaluate
	            		if ( jQuery(thisItem).data("image-differences") === false ) {

	            			// Hide the materials without new images
	            			jQuery(thisItem).fadeOut(250);

	            		} else {
	            		
	            			// Add the current style to the clipboard
		            		styleClipboard = styleClipboard + jQuery(thisItem).attr("id") + "\r\n";               			
	            				            			
	            			// Ensure that materials that have image differences show            			
	            			jQuery(thisItem).fadeIn(250);	            			

	            		}

	            	});	            	
	            		 
            		// Check the UI display and see if no-results 
            		api.checkUIForNoResultsDisplay();
            			            	
	            	// Hide the loading icon
	            	jQuery(".loading-data-icon").css("visibility", "hidden");	  	            	
	            	
	            	break;

	            // Show materials with no images
	            case "show-materials-no-images":

	            	// Show the loading icon
	            	jQuery(".loading-data-icon").css("visibility", "visible");	  	            	
	            	
	            	// Retrieve all the children in the panel-workspace
	            	jQuery("#panel-workspace").find(".product-container-template").each( function(arrayIndex, thisItem) {
	            		
	            		// Hide all materials have images -- showing all materials that do not have images
	            		if ( jQuery(thisItem).data("no-images") === false ) {

	            			// Hide the materials with images
	            			jQuery(thisItem).fadeOut(250);

	            		} else {
	            			
	            			// Add the current style to the clipboard
		            		styleClipboard = styleClipboard + jQuery(thisItem).attr("id") + "\r\n";          			
	            			
	            			// Ensure that materials with no images show            				            			
	            			jQuery(thisItem).fadeIn(250);	            			

	            		}
	            			            		
	            	});	            	
	            	
            		// Check the UI display and see if no-results 
            		api.checkUIForNoResultsDisplay();	     	            	
	            	
	            	// Hide the loading icon
	            	jQuery(".loading-data-icon").css("visibility", "hidden");	  	            	
	            	
	            	break;

		            // Show materials with new-images
	            case "show-materials-with-new-images":

	            	// Show the loading icon
	            	jQuery(".loading-data-icon").css("visibility", "visible");	  	            	
	            	
	            	// Retrieve all the children in the panel-workspace
	            	jQuery("#panel-workspace").find(".product-container-template").each( function(arrayIndex, thisItem) {
	            		
	            		// Hide all materials that have new images to evaluate
	            		if ( jQuery(thisItem).data("new-images") === false ) {

	            			// Hide the materials without new images
	            			jQuery(thisItem).fadeOut(250);

	            		} else {
	            		
	            			// Add the current style to the clipboard
		            		styleClipboard = styleClipboard + jQuery(thisItem).attr("id") + "\r\n";              			
	            				            			
	            			// Ensure that materials with new images            			
	            			jQuery(thisItem).fadeIn(250);	            			

	            		}
	            		
	            	});	            	

            		// Check the UI display and see if no-results 
            		api.checkUIForNoResultsDisplay();	            		            		
	            	
	            	// Hide the loading icon
	            	jQuery(".loading-data-icon").css("visibility", "hidden");	  	            	
	            	
	            	break;	            	
	            
	           default:
	        	   
	            	// Show the loading icon
	            	jQuery(".loading-data-icon").css("visibility", "visible");	  	            	
	            	
	            	// Retrieve all the children in the panel-workspace
	            	jQuery("#panel-workspace").find(".product-container-template").each( function(arrayIndex, thisItem) {
	            		
	            		// Check if the selected value can be found in the current material / style identifier
	            		if ( jQuery(thisItem).attr("id").indexOf($selectControl.val()) === -1 ) {

	            			// Hide the materials that do not match
	            			jQuery(thisItem).fadeOut(250);

	            		} else {
	            		
	            			// Add the current style to the clipboard
		            		styleClipboard = styleClipboard + jQuery(thisItem).attr("id") + "\r\n";            			
	            				            			
	            			// Show the materials that do match           			
	            			jQuery(thisItem).fadeIn(250);	            			

	            		}
	            		
	            	});	            	

	           		// Check the UI display and see if no-results 
	           		api.checkUIForNoResultsDisplay();	            		            		
	            	
	            	// Hide the loading icon
	            	jQuery(".loading-data-icon").css("visibility", "hidden");	 
	        	   
	        	   break;

        	}        	
        	
        }); 
        
        ////////////////////////////////////
        // Re-Display Bootstrap-Select
        ////////////////////////////////////        

        // Re-display the suppressed select control
        jQuery("body").on("click", function(e) {
        	api.showPrototypeSuppressedControls();
        });
        
        // Re-display the suppressed select control
        jQuery(".selectpicker").on("click", function(e) {
        	api.showPrototypeSuppressedControls();
        });
        
        ////////////////////////////////////
        // Custom Events
        ////////////////////////////////////

        // Listen for the custom render.images event
        jQuery("body").on("s7/render.images", function(e) {

            // Render the Scene7 Images
            api.renderScene7ImagesDisplay(e["MATERIALCODES"]);

        });

        // Listen for the carousel modal to be shown
        jQuery("#detail-image-view").on("shown.bs.modal", function (e) {
	
			// Re-Initialize the carousel display
			$productImageSlider.reloadSlider({
			  minSlides: 1,
			  maxSlides: 1,
			  slideWidth: 550,
			  slideMargin: 10,
			  pager: true,
			  preloadImages: "all",
			  hideControlOnEnd : false,
			  infiniteLoop: true	 
			});	
			
			// Page the carousel to the "first" slide based on the selected image
			$productImageSlider.goToSlide($productImageSlider.data("start-slide"));
			
			// Show the carousel display (now that is has been initialized)
			jQuery(".carousel-container").css("visibility", "visible");					        	
			
        });
			
        // Listen for the carousel modal to be hidden
        jQuery("#detail-image-view").on("hidden.bs.modal", function (e) {
        	
			// Hide the carousel display (until it is initialized again)
			jQuery(".carousel-container").css("visibility", "hidden");
        	
        });       
        
        // Begin by placing the focus on the style listing
    	jQuery("#style-list").focus();        

    };

    // Return the API contents
    return api;

}();

//////////////////////////////////////////////
// Open To-Do's / Refactoring Tasks
//////////////////////////////////////////////
// TODO: Remove all AJAX service calls to a UA.S7AJAX class.
