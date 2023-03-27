'use strict';

/* eslint-disable */

class Calendar {
    constructor(date) {
        this.date = date;
        this.DATE = 5;
        this.MONTH = 2;
        this.YEAR = 1;
        this.DAY_OF_WEEK = 7;
        this.SATURDAY = 7;
        this.SUNDAY = 1;
        this.time = date ? new Date(date) : new Date();
    }

    add(field, value) {
        if (field === this.DATE) {
            this.date.setDate(this.date.getDate() + value);
        }
    }

    before() {
        return false;
    }

    toTimeString() {
        return this.date;
    }

    get(field) {
        if (field === this.YEAR) {
            return new Date().getFullYear();
        } else if (field === this.MONTH) {
            return new Date().getMonth();
        } else if (field === this.DATE) {
            return new Date().getDate();
        }
        return 2;
    }
    getTime() {
        return {
            toISOString() {
                return {};
            },
            getDate() {
                return 1;
            },
            getMonth() {
                return 0;
            },
            getFullYear() {
                return 1990
            }
        };
    }

    set(year, month, date) {
        let time = new Date();
        if (date) {
            time.setDate(date);
        }
        if (month) {
            time.setMonth(month);
        }
        if (year) {
            time.setFullYear(year);
        }
        this.time = time;
    }
}

Calendar.YEAR = 1;

module.exports = Calendar;
