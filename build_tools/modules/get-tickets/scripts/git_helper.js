const simpleGit = require('simple-git');

class GitHelper {
    constructor(branch, baseDir) {
        this.options = {}, this.git;
        this.branch = branch;
        if(baseDir) {
            this.git = simpleGit({
                baseDir: baseDir
            });
        }else{
            this.git = simpleGit();
        }
    }
    /**
     * 
     * @param {string} commitHash - hash of the PR merge commit
     * @returns {string} - commit details in string format
     */
    async getCommit(commitHash){
        const options = { '--format': '%b%s' }; // retrieve the body and the subject
        let commit = await this.git.show(commitHash, options);

        return commit;
    }

    /**
     * 
     * @param {string} commitMessage 
     * @returns {array} array of JIRA issue keys
     */
    getIssueKeys(commitMessage) {
        if(!commitMessage || typeof commitMessage !== 'string') return [];

        let removeDups = (arr) => {
            if(!Array.isArray(arr)) return [];

            return  arr.filter(function (item, pos) {
                return arr.indexOf(item) == pos;
            });
        } 

        const regex = /[A-Z]{2,}-\d+/gm;

        let keys = commitMessage.match(regex);

        return removeDups(keys);
    }
}

module.exports = GitHelper;