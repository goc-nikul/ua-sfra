'use strict';


/**
 * Makes service calls to Atlassian/Jira.
 * @return {void}
 */
function getJiraService() {
    var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
    return LocalServiceRegistry.createService('jira.issue.http', {
        createRequest: function (svc, params) {
            return params || null;
        },
        parseResponse: function (svc, response) {
            return response;
        },
        filterLogMessage: function (logMsg) {
            return logMsg;
        }
    });
}

/**
 * Function that returns the base64 encoded string to be used for Basic Authentication
 * @returns {string} base64 encoded string
 */
function getAuthorizationHeader() {
    var StringUtils = require('dw/util/StringUtils');
    var Site = require('dw/system/Site').current;
    var user = Site.getCustomPreferenceValue('DeleteAccountJiraAPIUser');
    var password = Site.getCustomPreferenceValue('DeleteAccountJiraAPIPassword');
    return StringUtils.encodeBase64(user + ':' + password);
}

/**
 * Helper function to create a jira ticket
 * @param {string} ticketRequestBody Request Body
 * @returns {Object} API response
 */
function createIssue(ticketRequestBody) {
    const service = getJiraService();
    service.addHeader('Content-Type', 'application/json');
    service.addHeader('Authorization', 'Basic ' + getAuthorizationHeader());
    service.setRequestMethod('POST');

    var result = service.call(ticketRequestBody);
    if (!empty(result) && !empty(result.status) && result.status === 'OK' && !empty(result.object) && !empty(result.object.text)) {
        return JSON.parse(result.object.text);
    } else if (!empty(result) && result.msg) {
        var Logger = require('dw/system/Logger');
        Logger.error('Jira Issue Creation failed: ' + result.msg);
    }
    return null;
}

/**
 * Function that returns formatted date string
 * @returns {string} formatted current date-time
 */
function getCurrentTime() {
    var Calendar = require('dw/util/Calendar');
    var StringUtils = require('dw/util/StringUtils');
    var calendar = new Calendar();
    return StringUtils.formatCalendar(calendar, 'dd/MM/yyyy HH:mm:ss');
}

/**
 * Function that prepares jira issue creation request body and invokes function to trigger the API
 * @param {string} email email of customer that requests deletion
 * @returns {string} issue id
 */
function createAccountDeletionTicket(email) {
    const Resource = require('dw/web/Resource');
    const Site = require('dw/system/Site').current;
    const jiraProject = Site.getCustomPreferenceValue('DeleteAccountJiraProject');
    const jiraAssignee = Site.getCustomPreferenceValue('DeleteAccountJiraAssignee');

    const ticketRequestBody = {
        fields: {
            assignee: {
                id: jiraAssignee
            },
            description: {
                content: [
                    {
                        type: 'paragraph',
                        content: [
                            {
                                type: 'text',
                                text: Resource.msg('jira.deleteaccountticket.description.paragraph1', 'account', null)
                            }
                        ]
                    },
                    {
                        type: 'paragraph',
                        content: [
                            {
                                type: 'text',
                                text: Resource.msg('jira.deleteaccountticket.description.paragraph2', 'account', null)
                            }
                        ]
                    },
                    {
                        type: 'paragraph',
                        content: [
                            {
                                type: 'text',
                                text: Resource.msgf('jira.deleteaccountticket.description.paragraph3', 'account', null, email)
                            }
                        ]
                    }
                ],
                type: 'doc',
                version: 1
            },
            issuetype: {
                id: '3'
            },
            project: {
                key: jiraProject
            },
            summary: Resource.msgf('jira.deleteaccountticket.summary', 'account', null, getCurrentTime())
        },
        update: {}
    };
    var createIssueResponse = createIssue(JSON.stringify(ticketRequestBody));
    if (!empty(createIssueResponse) && createIssueResponse.id) {
        return createIssueResponse.key;
    }
    return null;
}

/**
 * Function to add watchers to given ticket
 * @param {string} issueID jira ticket ID
 * @param {Array} watchers watchers to be added to ticket
 */
function addWatchers(issueID, watchers) {
    const service = getJiraService();
    if (service.URL.endsWith('/')) {
        service.URL += issueID + '/watchers';
    } else {
        service.URL += '/' + issueID + '/watchers';
    }
    service.addHeader('Content-Type', 'application/json');
    service.addHeader('Authorization', 'Basic ' + getAuthorizationHeader());

    service.setRequestMethod('POST');

    for (var i = 0; i < watchers.length; i++) {
        var result = service.call('"' + watchers[i] + '"');
        if (!result.ok && result.msg) {
            var Logger = require('dw/system/Logger');
            Logger.error('Failed to add watcher ' + watchers[i]);
        }
    }
}

module.exports = {
    createAccountDeletionTicket: createAccountDeletionTicket,
    addWatchers: addWatchers
};
