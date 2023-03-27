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

module.exports = {
    encodeBase64: encodeBase64,
    formatMoney: formatMoney,
    formatDate: formatDate,
    formatCalendar: formatCalendar
};
