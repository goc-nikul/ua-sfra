/**
 * @class app.orderreports
 * @description Loads bm order report functionality
 */
(function (app, $) {
	var $cache = $cache || {};

	function initializeCache() {
		$cache.timeRangeAccordion = $("#time-range-accordion");
		$cache.timeRangeInputs = $cache.timeRangeAccordion.find("input");
		$cache.timeRange = {
				'from' : $cache.timeRangeAccordion.find("#time-from"),
				'to' : $cache.timeRangeAccordion.find("#time-to")
		};
		$cache.searchReportBtn = $cache.timeRangeAccordion.find("[name='searchReport']");
		$cache.reportsTable = $('#reports-table');
	}
	
	//	orders list accordions init
	function initializeOrdersListAccordion(scope) {
		if (!scope) {
			scope = '#wraper';
		}
		
		$(scope).find( ".orders-accordion" ).accordion({
			collapsible: true,
			active: false,
			heightStyle: "content",
			icons : null
		});
	}
	
	function initializeDom() {
		
		//	orders list accordions init
		initializeOrdersListAccordion();
		
		//init time range accordion
		$(function() {
			$( "#time-range-accordion" ).accordion({
				collapsible: true,
				active: false,
				heightStyle: "content",
				icons : {header: "ui-icon-circle-arrow-e", activeHeader: "ui-icon-circle-arrow-s"}			
			});
		});
		
		// init Date input fields
		$(function() {
			var today = $cache.timeRange.to.val(), 
				dateFormat = 'mm/dd/yy';
			
			$cache.timeRange.from.datepicker({
				dateFormat : dateFormat,
				maxDate : today,
				onClose : function( selectedDate ) {
					$cache.timeRange.to.datepicker( "option", "minDate", selectedDate );
				}
			}).on("change", function(e) {
                var curDate = $(this).datepicker("getDate");
                var maxDate = new Date(today);
                if (curDate > maxDate) {
                    $(this).datepicker("setDate", maxDate);
                }
            });
			$cache.timeRange.to.datepicker({
				dateFormat : dateFormat,
				maxDate : today,
				onClose : function( selectedDate ) {
					$cache.timeRange.from.datepicker( "option", "maxDate", selectedDate );
				}
			}).on("change", function(e) {
                var curDate = $(this).datepicker("getDate");
                var maxDate = new Date(today);
                if (curDate > maxDate) {
                    $(this).datepicker("setDate", maxDate);
                }
            });
		});
	}
	
	function initializeEvents() {
		
		/* Search  reports by time range */
		$cache.searchReportBtn.on('click', function(e) {
			e.preventDefault();
			
			var dateRegex = /^(0?[1-9]|1[012])\/(0?[1-9]|[12]\d|3[01])\/\d{4}$/,
				dateFrom = $cache.timeRangeAccordion.find("#time-from"),
				dateFromVal = dateFrom.val(),
				dateTo = $cache.timeRangeAccordion.find("#time-to")
				dateToVal = dateTo.val();
			
			$cache.timeRangeInputs.removeClass("ui-state-error").parent().removeClass('ui-state-error-text');
			
			if (!dateRegex.test(dateFromVal) || !dateRegex.test(dateToVal)) {
				if (!dateRegex.test(dateFromVal)) {
					dateFrom.addClass('ui-state-error').parent().addClass('ui-state-error-text');
				} else {
					dateTo.addClass('ui-state-error').parent().addClass('ui-state-error-text');
				}
				return false;
			} else if (new Date(dateFromVal) > new Date(dateToVal)) {
				$cache.timeRangeInputs.addClass("ui-state-error").parent().addClass('ui-state-error-text');
				return false;
			} 
			
			$.ajax({
				url : $(this).data("handler-link"),
				method: "POST",
				data: {'dateFrom' : dateFromVal, 'dateTo' : dateToVal}
			})
			.done(function (response) {
				if (typeof response !='object') {
					$cache.reportsTable.find("tbody").replaceWith(response);
					initializeOrdersListAccordion();
				} else if (response.refreshPage) {
					location.reload();
				}
			})
			.fail(function () {
				alert('Error occurred! Please refresh page.');
				location.reload();
			})
		})
		
		/* Update selected Date info */
		$cache.reportsTable.on('click', '.refresh-day-data', function(e) {
			e.preventDefault();
			
			$.ajax({
				url : $(this).attr('href'),
				method: "POST"
			})
			.done(function (response) {
				if (typeof response !='object') {
					var reportDate = $(response).data('report-date'),
						reportRowSelector = "tr[data-report-date='"+reportDate+"']";
					$cache.reportsTable.find(reportRowSelector).replaceWith(response);
					
					initializeOrdersListAccordion(reportRowSelector);
				} else if (response.refreshPage) {
					location.reload();
				}
			})
			.fail(function () {
				alert('Error occurred! Please refresh page.');
				location.reload();
			})
		})
		
		/*
		 * 
		 * Generate Orders Report .csv file with report information
		 * dispalyed on screen
		 *  
		 */
		$(".export-reports").on('click', function() {
		    var reportTypes = $cache.reportsTable.find("thead th[data-report-type]"),
		    	reportRows = $cache.reportsTable.find("tr[data-report-date]"),
		    	csvData = [],
		    	types = [],
		    	csvHeader = 'Date';

		    // Get header for csv file
		    for (var i = 0; i < reportTypes.length; i++ ) {
		    	var reportT = $(reportTypes[i]).data('report-type');
		    	csvHeader += ("|" + reportT);
		    	types.push(reportT);
		    }
		    csvData.push(csvHeader);
		    
		    // Get report data from table
		    for (var i = 0; i < reportRows.length; i++ ) {
		    	var $reportRow = $(reportRows[i]),
		    		rowData = "" + $reportRow.data("report-date"); 
		    	
		    	for (var j = 0; j < types.length; j++) {
		    		var type = types[j].toLowerCase();
		    		rowData += ("|" + ($reportRow.find('td[data-'+type+']').data(type) || 0));
		    	}
		    	csvData.push(rowData);
		    }

		    /*	Generate file */
		    var timeRangeStart = reportRows.last().data("report-date").replace(/\D/g,''),
		    	timeRangeEnd = reportRows.first().data("report-date").replace(/\D/g,''),
		    	fileName = "OrdersReport_" + timeRangeStart +"_"+ timeRangeEnd + ".csv",
		    	buffer = csvData.join("\n"),
		    	blob = new Blob([buffer], {"type": "text/csv;charset=utf8;"});
		  
		    /*	Download generated file */
		    var $this = $(this);
		    if(this.download !== undefined) { // feature detection
		    	// Browsers that support HTML5 download attribute
		    	$this.attr("href", URL.createObjectURL(blob));
		    	$this.attr("download", fileName);
		    } else {
		    	$this.attr("href", URL.createObjectURL(blob));
	    	}
	    
		});
	}

	app.orderreports = {
		init : function(){
			initializeCache();
			initializeDom();
			initializeEvents();
		}
	};
}(window.app = window.app || {}, jQuery));

app.orderreports.init();