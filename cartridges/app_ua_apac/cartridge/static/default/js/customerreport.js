(function (app, $) {
    app.customerreports = {
        initializeEvents: function () {
            var dateRangeSearchBox = $(".date-range-search");
            var searchReportBtn = dateRangeSearchBox.find(
                "[name='searchReport']"
            );
            var dateRangeInputs = dateRangeSearchBox.find("input");
            var reportsTable = $("#reports-table");
            var dateInputs = $(".datepicker");
            var csvExportBtn = $('button[name="exportCsv"]');
            var errComp = $('#error-records-not-found');
            dateInputs.datepicker({
                maxDate: 0
            }).on("change", function (e) {
                var curDate = $(this).datepicker("getDate");
                var maxDate = new Date();
                if (curDate > maxDate) {
                    $(this).datepicker("setDate", maxDate);
                }
            });

            searchReportBtn.on("click", function (e) {
                e.preventDefault();
                csvExportBtn.prop('disabled', false);
                errComp.addClass('hidden');
                dateRangeInputs
                    .removeClass("ui-state-error")
                    .parent()
                    .removeClass("ui-state-error-text");
                var dateRegex = /^(0?[1-9]|1[012])\/(0?[1-9]|[12]\d|3[01])\/\d{4}$/,
                    dateFrom = dateRangeSearchBox.find("#time-from"),
                    dateFromVal = dateFrom.val(),
                    dateTo = dateRangeSearchBox.find("#time-to");
                dateToVal = dateTo.val();
                if (
                    !dateRegex.test(dateFromVal) ||
                    !dateRegex.test(dateToVal)
                ) {
                    if (!dateRegex.test(dateFromVal)) {
                        dateFrom
                            .addClass("ui-state-error")
                            .parent()
                            .addClass("ui-state-error-text");
                    } else {
                        dateTo
                            .addClass("ui-state-error")
                            .parent()
                            .addClass("ui-state-error-text");
                    }
                } else if (new Date(dateFromVal) > new Date(dateToVal)) {
                    dateRangeInputs
                        .addClass("ui-state-error")
                        .parent()
                        .addClass("ui-state-error-text");
                    return false;
                }

                $.ajax({
                    url: $(this).data("handler-link"),
                    method: "POST",
                    data: { dateFrom: dateFromVal, dateTo: dateToVal },
                })
                    .done(function (response) {
                        if (typeof response != "object") {
                            if (!response.includes('data-report-customer') && !response.includes('error-msg')) {
                                errComp.removeClass('hidden');
                                csvExportBtn.prop('disabled', true);
                            }
                            reportsTable.find("tbody").html(response);
                        } else if (response.refreshPage) {
                            location.reload();
                        }
                    })
                    .fail(function () {
                        alert("Error occurred! Please refresh page.");
                        location.reload();
                    });
            });

            $(".export-reports").on("click", function () {
                if (csvExportBtn.prop('disabled')) {
                    alert("No records to download!")
                    return false;
                }
                var reportTypes = reportsTable.find("thead th[data-item-name]"),
                    reportRows = reportsTable.find("tr[data-report-customer]"),
                    csvData = [],
                    types = [],
                    csvHeader = "";

                for (var i = 0; i < reportTypes.length; i++) {
                    var itemName = $(reportTypes[i])
                    var reportT = itemName.text().replace('\n', '');

                    csvHeader += reportT + "|";
                    types.push(itemName.data("itemName"));
                }
                const csvHeaderNew = csvHeader.slice(0, csvHeader.lastIndexOf("|")) + '';
                csvData.push(csvHeaderNew);

                for (var i = 0; i < reportRows.length; i++) {
                    var $reportRow = $(reportRows[i]);
                    var rowData = "";
                    for (var j = 0; j < types.length; j++) {
                        var type = types[j].toLowerCase();
                        rowData +=
                            ($reportRow
                                .find("td[data-" + type + "]")
                                .data(type) || '') + "|";
                    }
                    const rowDataNew = rowData.slice(0, rowData.lastIndexOf("|")) + '';
                    csvData.push(rowDataNew);
                }

                var fileName =
                        "Account Deletion Report.csv",
                    buffer = csvData.join("\n"),
                    blob = new Blob([buffer], {
                        type: "text/csv;charset=utf8;",
                    });

                var $this = $(this);
                if (this.download !== undefined) {
                    $this.attr("href", URL.createObjectURL(blob));
                    $this.attr("download", fileName);
                } else {
                    $this.attr("href", URL.createObjectURL(blob));
                }
            });
        },
    };
})((window.app = window.app || {}), jQuery);

app.customerreports.initializeEvents();
