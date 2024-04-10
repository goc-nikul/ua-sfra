/*
 * Export Customers Data in csv file
 *
 */
var Logger = require('dw/system/Logger');

function exportCustomersDataCSV(params) {

    const CustomerMgr = require('dw/customer/CustomerMgr');
    const Calendar = require('dw/util/Calendar');
    const CSVStreamWriter = require('dw/io/CSVStreamWriter');
    const File = require('dw/io/File');
    const FileWriter = require('dw/io/FileWriter');
    const StringUtils = require('dw/util/StringUtils');
    const Site = require('dw/system/Site');
    const collections = require('*/cartridge/scripts/util/collections');
    const siteID = Site.getCurrent().getID().toUpperCase();

    try {
        // Working folder to export CSV file
        var workingFolder = new File(File.IMPEX + '/src/customersDataCSV');
        if (!workingFolder.exists()) {
            workingFolder.mkdirs(); // Create folder if not existed
        }
        // CSV to export data
        var fileName = ['CustomersData_' + siteID + '_' + StringUtils.formatCalendar(new Calendar(), "yyyyMMddHHmmss") + '.csv'];
        var file = new File(workingFolder, fileName);
        var fw = new FileWriter(file);
        var csw = new CSVStreamWriter(fw);
        // Getting all customers profile
        const customersIterator = CustomerMgr.searchProfiles('', null);
        var customerData = [];
        // CSV field titles
        customerData.push('First Name');
        customerData.push('Last Name');
        customerData.push('Email');
        customerData.push('Country');
        customerData.push('Preffered Locale');
        customerData.push('Last Login Date');
        customerData.push('Account Creation Date');
        customerData.push('Inactive Days');
        customerData.push('Active Days');
        customerData.push('Home Phone');
        customerData.push('Business Phone');
        customerData.push('Mobile Phone');
        csw.writeNext(customerData);

        while (customersIterator.hasNext()) {
            var customer = customersIterator.next();
            // Start : Logic to get Customer's country and preferred Locale
            var addressBook = customer.getAddressBook();
            var preferredLocale = customer.preferredLocale;
            var plCountry = preferredLocale.split('_');
            var preferredAddress = addressBook.getPreferredAddress();
            if (empty(preferredAddress) && addressBook.getAddresses().length > 0) {
                preferredAddress = addressBook.getAddresses()[0];
            }
            var country = !empty(preferredAddress) ? preferredAddress.getCountryCode().value : (plCountry.length > 1 ? plCountry[1] : '');
            // End : Logic to get Customer's country and preferred Locale

            // Start : Logic to calculate active and inactive days
            var accountCreationDate = customer.getCreationDate();
            var lastLoginDate = customer.getLastLoginTime() || accountCreationDate;
            var currentDate = new Date(); // Current Day
            var oneDay = 1000 * 60 * 60 * 24; // miliseconds in a day
            var inactiveDays = Math.round(Math.abs(currentDate.getTime() - lastLoginDate.getTime()) / oneDay);
            var activeDays = Math.round(Math.abs(lastLoginDate.getTime() - accountCreationDate.getTime()) / oneDay);
            // End : Logic to calculate active and inactive days

            customerData = [];
            // Adding customer's data in CSV file
            customerData.push(customer.getFirstName());
            customerData.push(customer.getLastName());
            customerData.push(customer.getEmail());
            customerData.push(country);
            customerData.push(preferredLocale);
            customerData.push(lastLoginDate.toUTCString());
            customerData.push(accountCreationDate.toUTCString());
            customerData.push(inactiveDays);
            customerData.push(activeDays);
            customerData.push(customer.getPhoneHome());
            customerData.push(customer.getPhoneBusiness());
            customerData.push(customer.getPhoneMobile());
            csw.writeNext(customerData);
        }

        customersIterator.close();
        csw.close();
        fw.close();

        // Start : Logic to send email with export file link to email addresses added in Job Step
        if (!empty(params.emailList)) {
            var emailList = params.emailList.split(',');
            var Resource = require('dw/web/Resource');
            var template = new dw.util.Template('/mail/impexLocationUrl');
            var HashMap = require('dw/util/HashMap');
            var webdavURL = 'https://' + dw.system.System.getInstanceHostname() +'/on/demandware.servlet/webdav/Sites';
            var subjectText = Resource.msgf('email.customerdatabase.subject', 'common', null, siteID);
            var filePath = file.getFullPath();
            var fileFullPath = webdavURL + file.getFullPath();
            var map = new HashMap();
            map.put('data', {'filePath' : fileFullPath});
            var content = template.render(map).text;
            var mail = new dw.net.Mail();
            mail.addTo(emailList);
            mail.setFrom('system-notification@underarmour.com');
            mail.setSubject(subjectText);
            mail.setContent(content);
            mail.send();
        }
        // End : Logic to send email with export file link to email addresses added in Job Step
    } catch (e) {
        throw new Error('ExportCustomersDataCSV.js : Could not create csv file' + e);
    }
}
module.exports = {
    exportCustomersDataCSV: exportCustomersDataCSV
};
