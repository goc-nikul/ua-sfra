'use strict';

function encodeBase64(str) {
    return str;
}

function formatMoney(amount) {
    return '$' + amount.value;
}

function formatDate(date) {
    return date.toDateString();
}
function formatCalendar(calander) {
    return calander.toTimeString();
}

function format(str, ...params){
    return str.replace(/\{(\d+)\}/g, (match, index) => params[index]);
}

function stringToXml(string) {
    return string;
}

module.exports = {
    encodeBase64: encodeBase64,
    formatMoney: formatMoney,
    formatDate: formatDate,
    formatCalendar: formatCalendar,
    format: format,
    stringToXml: stringToXml
};
