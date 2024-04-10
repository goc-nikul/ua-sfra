/* eslint spellcheck/spell-checker: 0 */

module.exports = function gridLogic(logicArgs) {
    if (['product-listing', 'search'].indexOf(logicArgs.pageType) === -1) {
      return {};
    }
    const searchResultsCount = logicArgs.searchResultsCount || '0';
    const searchShowMore = logicArgs.searchShowMore === '1' ? 'yes' : 'no';

    const PAGING_OFFSET = 12;
    const totalVisible = parseInt(searchResultsCount, 10) < PAGING_OFFSET
      ? searchResultsCount
      : PAGING_OFFSET.toString();

    return {
        grid_stack_count: '0', // number of stacks (grid divisions)
        grid_visible_count: totalVisible, // number of products loaded
        grid_total_count: searchResultsCount, // total number of products available for this query
        grid_has_loadmore: searchShowMore, // has load more button
        grid_double_ingrid: '0', // number of in grid content pieces two product spaces wide
        grid_single_ingrid: '0', // number of in grid content pieces one product space wide
        grid_video_count: '0', // number of videos on the page
        grid_has_guidedselling: 'no', // yes,no todo: get definition of guided selling
        grid_sort_order: 'Top Sellers', // sort value
        grid_paging_offset: PAGING_OFFSET.toString(), // if url took shopper to a pagination offset, the start product number
        grid_top_content: 'no', // yes, no if has header content
        sfTestVariants : logicArgs.ABTestData,
        features: logicArgs.features
    };
};
