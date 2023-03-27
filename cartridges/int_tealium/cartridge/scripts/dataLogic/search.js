module.exports = function orderLogic(logicArgs) {
    if (logicArgs.pageType !== 'search') {
        return {};
    }

    return {
        page_finding_method: 'Search',
        search_term: logicArgs.searchTerm,
        search_method: 'searchbar',
        search_location: 'header',
        search_type: 'Regular',
        search_results_count: logicArgs.searchResultsCount
    };
};
