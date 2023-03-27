# Paazl cartridge implementation details

Requirements FE:
* A unique basket ID is required on the checkout container in the html. (by default, it expects [data-basket-uuid="###"])
* The Paazl Widget should be placed inside the shipping form.
* In int_paazl_sfra/cartridge/static/default/js/paazl_checkout.js, make sure the css selectors match with your html
* If you have made changes to paazl_checkout.js, make sure to minify it before loading the minified version on the page
