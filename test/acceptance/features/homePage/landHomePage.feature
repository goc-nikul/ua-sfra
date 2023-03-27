Feature: Land Home Page
    As a shopper, I want to land on the home Page

@homePage
    Scenario: Shopper is able to land on the home Page
        When shopper selects yes or no for tracking consent
        Then he is able to scroll and see sticky header
        Then he click on back to top button