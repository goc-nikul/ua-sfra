const JiraApi = require('jira-client');
const fs = require('fs');
const path = require('path');

const Utils = require('./utils.js');
const pwd = __dirname;

class JiraUpdater {
    constructor(host, user, password) {
        let config = {
            protocol: "https",
            host: host,
            username: user,
            password: password,
            apiVersion: "2",
            strictSSL: true,
        };

        this.jira = new JiraApi(config);
        this.transitions = require(path.join(pwd, '../transitions.json'));
    }

    /**
     * Execute query (project = "EPMD" OR project = "AGLA" OR project = "CSVT" OR project = "LOYAL" OR project = "MGP" OR project = "OMS" OR project = "OA" OR project = "FALX") and fixVersion="2023.12.0"
     * @param {string} version 
     * @param {Array} projectKeys 
     * @returns 
     */
    async getTicketsByVersion(version, projectKeys) {

        let getQuery = (projectKeys) => {
            let query = '';
            for (const id of projectKeys) {
                if (query.length > 0) query += ' OR ';
                query += `project = "${id}"`;
            }
            query = `(${query})`;
            query += ` AND fixVersion = "${version}"`;

            return query;
        }

        let query = getQuery(projectKeys), tickets;

        console.log(`Executing query: ${query}`);

        try {
            tickets = await this.jira.searchJira(query, {maxResults : 1000}); 
        } catch (error) {
            return;
        }
        
        let result = [];
        
        if(tickets && 'total' in tickets && tickets.total > 0){    
            for(const ticket of tickets.issues){
                result.push(ticket.key);
            }
        }

        return Utils.removeDuplicates(result);
    }

    /**
     * Add comment to JIRA
     * @param {Object} issue 
     * @param {string} comment 
     */
    async setComment(issue, comment){ 
        let updateStatus = await this.jira.addComment(issue.id, comment) ? true : false;

        if(updateStatus) console.log(`${issueKey}: Added release comment - ${comment}`);
    }
    
    /**
     * @description Set to Staging: Ready For Production > Staging
     * Set to Published: Ready For Production > Staging > Ready to Publish > Published
     * @param {Object} issue 
    * @param {Array} transitionOrder 
     */
    async setTransition(issue, transitionOrder) {
        if (issue == null) return;

        try {
            let getTransition = function (transitionNames, transitions) {

                if (Array.isArray(transitions)) {
                    return transitions.find((element) => {
                        for(let item of transitionNames) if (element.name.toLowerCase() == item.toLowerCase()) return element;                       
                    });
                }
            }

            let transitionNames = this.transitions.transitionNames,
                result,
                issueKey = issue.id

            for (let item of transitionOrder) {
                let transitionName = transitionNames[item];
                let transitions = await this.jira.listTransitions(issueKey);
                let nextTransition = getTransition(transitionName, transitions.transitions);

                if (nextTransition) {
                    result = issue ? await this.jira.transitionIssue(issue.id, {
                        'transition': nextTransition
                    }) : null;
                }
            }

            return true;
        } catch (error) {
            console.log(error);
        }

        return false;
    }

    /**
     * Main method to update ticket status.
     * @param {String} issueKey 
     * @param {string} comment 
     * @param {string} type - Staing or Production
     */
    async updateTicket(issueKey, comment, type) {

        try {
            console.log(`${issueKey}: Updating.`);

            let issue = await this.jira.getIssue(issueKey);
    
            if (!issue) {
                console.log(`Unable to retrieve issue object: ${issueKey}`);
                return;
            }

            // Sets the transtion order based on project key.
            let projectKey = issue.fields.project.key;

            if(projectKey in this.transitions){
                let projectTransition = this.transitions[projectKey];

                let transitionOrder = type in projectTransition ? projectTransition[type] : null;

                if(await this.setTransition(issue, transitionOrder)){
                    console.log(`${issueKey}: Completed updating transtion order.`);
                }
            }
    
            await this.setComment(issue, comment);
    
            console.log(`${issueKey}: Completed.`);
        } catch (error) {
            console.log(`Error: ${error.message}`);
        }

    }
}

module.exports = JiraUpdater;