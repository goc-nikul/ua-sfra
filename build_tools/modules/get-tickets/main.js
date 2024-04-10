const core = require("@actions/core");
const GitHelper = require('./scripts/git_helper');

async function main() {

    try {
        const commitId = process.env.COMMIT_ID; // commit of the pull request merge commit
        const baseBranch = process.env.BRANCH ? process.env.BRANCH : 'develop'; // base/destination branch of the pull request merge commit

        if(!commitId || !baseBranch) {
            throw new Error(`Required parameters not provided - commitId: ${commitId} - baseBranch: ${baseBranch}`);
        }
        core.info(`Using commit hash: ${commitId} - base branch: ${baseBranch}`);

        let gitHelper = new GitHelper(baseBranch);
        let commit = await gitHelper.getCommit(commitId);
        let issueKeys = gitHelper.getIssueKeys(commit).join(',');

        core.info(`The following JIRA keys are found: ${issueKeys}`);
        core.setOutput('issueKeys', issueKeys);
    } catch (error) {
        core.error(error.message);
    }
}

main();

module.exports = {
    main: main
};