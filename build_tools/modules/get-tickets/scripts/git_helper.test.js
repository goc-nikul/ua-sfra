const GitHelper = require('./git_helper');

describe('GitHelper', () => {
    describe('getIssueKeys', () => {
        const gitHelper = new GitHelper();
        it('should return an empty array if there is no parameters passed.', () => {
            const keys = gitHelper.getIssueKeys();
            expect(keys).toEqual([]);
        });

        it('should return an empty array if commitMessage is not a string', () => {
            const keys = gitHelper.getIssueKeys(1);
            expect(keys).toEqual([]);
        });

        it('should return an empty array if no JIRA ticket id is found', () => {
            const keys = gitHelper.getIssueKeys('This is a commit message without JIRA keys');
            expect(keys).toEqual([]);
        });

        it('should return an array of JIRA issue keys found in the commit message', () => {
            const keys = gitHelper.getIssueKeys('[EPMD-1234] I did something.');
            expect(keys).toEqual(['EPMD-1234']);
        });

        it('should remove duplicate JIRA issue keys from the array', () => {
            const keys = gitHelper.getIssueKeys('[EPMD-1234] I did something with ticket EPMD-1234');
            expect(keys).toEqual(['EPMD-1234']);
        });
    });
});
