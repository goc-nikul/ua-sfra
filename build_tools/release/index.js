// Module Includes
const path = require('path');
const { Command } = require('commander');

// File includes
const JiraUpdater = require('./helpers/jiraUpdater.js');

const TYPE = {
    Staging: 'Staging',
    Production: 'Production',
}

async function action(type, options) {
    let jiraUpdater = new JiraUpdater(options.host, options.user, options.password);
    let version = options.version;
    let projectKeys = options.projects ? options.projects.split(',') : [];

    if (projectKeys.length < 1) {
        console.error(`ERROR: No project keys defined. Aborting operation...`);
        return;
    }

    let result = await jiraUpdater.getTicketsByVersion(version, projectKeys);
    console.log(`Number of tickets found: ${result.length}`);
    console.log(`Ticket IDs: ${result.join(', ')}`);

    const triggerActor =
        "TRIGGER_ACTOR" in process.env && process.env.TRIGGER_ACTOR
            ? process.env.TRIGGER_ACTOR
            : null;

    let comment = `[Automated Message${triggerActor ? " triggered by " + triggerActor : ""}] \n\n
    Ticket has been deployed to ${type} as part of release ${version} \n\n
    For any release related questions, please post at MS Teams channel: RLSE-SFRA \n`;

    for (issueKey of result) {
        await jiraUpdater.updateTicket(issueKey, comment, type);
    }
}

function main() {

    const program = new Command();
    program
        .command('staging')
        .option('-v, --version <type>', 'Release version')
        .option('-d, --host <type>', 'Jira host domain')
        .option('-u, --user <type>', 'Jira username')
        .option('-p, --password <type>', 'Jira password')
        .option('-k, --projects <type>', 'Project keys separated by commas')
        .action((options) => {
            action(TYPE.Staging, options);
        });
    program
        .command('production')
        .option('-v, --version <type>', 'Release version')
        .option('-d, --host <type>', 'Jira host domain')
        .option('-u, --user <type>', 'Jira username')
        .option('-p, --password <type>', 'Jira password')
        .option('-k, --projects <type>', 'Project keys separated by commas')
        .action((options) => {
            action(TYPE.Production, options);
        });
    program.parse(process.argv);
}


main();