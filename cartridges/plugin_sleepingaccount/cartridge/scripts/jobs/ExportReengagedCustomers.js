/* eslint-disable require-jsdoc */
/* eslint-disable no-unused-vars */
'use strict';

/**
 * @module feeds/customers
 */

/**
 * @type {dw.customer.CustomerMgr}
 */
const CustomerMgr = require('dw/customer/CustomerMgr');

/**
 * @type {module:models/export~Export}
 */
const Export = require('int_marketing_cloud/cartridge/scripts/models/export');

/**
 * @type {module:models/export~Export}
 */
var exportModel;

const Logger = require('dw/system/Logger');
const Calendar = require('dw/util/Calendar');

function beforeStep(parameters, stepExecution) {
    exportModel = new Export(parameters, function (em) {
        const emailIds = parameters.emailIds;
        const reengagementType = parameters.reengagementType || 'first';
        const reengagementDays = parameters.reengagementDays;

        const logger = Logger.getLogger(
            'AccountReengagement',
            'AccountReengagement'
        );

        const flagAttribute =
            reengagementType === 'second'
                ? 'isSecondEngagementSent'
                : 'isFirstEngagementSent';

        const reengagementCal = new Calendar();
        reengagementCal.add(
            Calendar.DAY_OF_YEAR,
            parseInt(reengagementDays, 10) * -1
        ); // eslint-disable-line radix
        const reengagementDate = reengagementCal.getTime();

        let query =
            '(custom.' +
            flagAttribute +
            ' = {0} OR custom.' +
            flagAttribute +
            ' != {1}) AND lastLoginTime < {2}';

        // Adding email query for testing purpose
        if (emailIds) {
            const emailQueryString = emailIds
                .split(',')
                .map(function (item) {
                    return "email = '" + item.trim() + "'";
                })
                .join(' OR ');
            query += ' AND (' + emailQueryString + ')';
        }

        logger.info('Query: {0}', query);
        logger.info(
            'Args: {0}',
            JSON.stringify([null, true, reengagementDate])
        );

        const searchProfiles = CustomerMgr.searchProfiles(
            query,
            'lastLoginTime asc',
            null,
            true,
            reengagementDate
        );

        return searchProfiles;
    });
    exportModel.writeHeader();
}

function getTotalCount(parameters, stepExecution) {
    return exportModel.dataIterator.getCount();
}

function read(parameters, stepExecution) {
    return exportModel.readNext();
}

/**
 * @param {dw.customer.Profile} profile - Customer's profile
 * @param parameters - Job parameters
 * @param stepExecution - stepExecution
 * @returns {void|Array}
 */
// eslint-disable-next-line consistent-return
function process(profile, parameters, stepExecution) {
    var skip = false;
    if (exportModel.isIncremental) {
        if (profile.lastModified < exportModel.lastExported) {
            skip = true;
        }
    }
    if (!skip) {
        let formattedSleepingDate;
        formattedSleepingDate = new Calendar(new Date(profile.lastLoginTime));
        formattedSleepingDate.add(
            formattedSleepingDate.DAY_OF_YEAR,
            parameters.sleepingAccountCutoffDays
        );
        var data = {
            AdditionalData: {
                email: profile.email,
                SleepingDate: formattedSleepingDate,
                RedirectButtonLink: '',
                SiteLanguage: '',
                SiteCountry: '',
                Source: '',
                Date: new Calendar(new Date())
            },
            Profile: profile
        };

        const reengagementType = parameters.reengagementType || 'first';
        const flagAttribute =
            reengagementType === 'second'
                ? 'isSecondEngagementSent'
                : 'isFirstEngagementSent';

        var tx = require('dw/system/Transaction');
        tx.begin();
        try {
            if (profile.custom[flagAttribute] !== true) {
                profile.custom[flagAttribute] = true; // eslint-disable-line no-param-reassign
            }
            const result = exportModel.buildRow(data);
            tx.commit();

            return result;
        } catch (e) {
            tx.rollback();
        }
    }
}

function write(lines, parameters, stepExecution) {
    for (var i = 0; i < lines.size(); i++) {
        exportModel.writeRow(lines.get(i));
    }
}

function afterStep(success, parameters, stepExecution) {
    exportModel.close();
}

module.exports = {
    beforeStep: beforeStep,
    getTotalCount: getTotalCount,
    read: read,
    process: process,
    write: write,
    afterStep: afterStep
};
