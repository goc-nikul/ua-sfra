# Changelog

# 4.0.0

Version 4 is a big update that aims to provide better performance and stability, along with setting up the cartridge for future improvements.

This update will contain heavy breaking changes, so please read the changelog carefully.

## New Features

- The cartridge does not use the file system anymore. Instead, all operations are done in memory.
- Replaced all provided jobs with simpler versions that use the chunk-oriented job architecture.
- Added support for reporting job execution progress (e.g. `8000 of 1000 was processed.`).
- Added retry support for API requests (by default, it will retry 3 times).
- Added test coverage for all cartridge files.

## Breaking changes

### Job names

The job names have changed on this update. The new names are:

- `ConstructorSyncProductData` -> `Constructor.SyncProducts`
- `ConstructorSyncInventoryData` -> `Constructor.PatchProducts`
- `ConstructorSyncCategoryData` -> `Constructor.SyncCategories`

With those new names, we aim to make the cartridge more consistent with the rest of the platform.

### Job architecture

Previously we used step-oriented jobs, where each step was responsible for a specific task (e.g. read, process, write, etc).

Now we're using chunk-oriented jobs, which allows the job to report progress on Salesforce so that you can track the execution. With this,
we first estimate how many records will be sent and then send them in chunks (of 1000 records by default).

With this change, you'll be able to see something like this on Salesforce: `8000 of 1000 was processed.`

Additionally, previously the jobs consisted of 3 steps: `writeData`, `sendDeltas` and `updateLastSyncDate`. Now, the jobs only contain one
step, which actually performs the whole sync.

### Job step parameters

Job steps have changed as mentioned above. When uploading the metadata zip file to create the new jobs, you'll need to update the parameters
to make sure you port over the job configuration correctly.

### Ingestion Strategy parameter

Previously, the ingestion strategy was defined in three separate custom site preferences:

- `Constructor_ProductIngestionStrategy`
- `Constructor_CategoryIngestionStrategy`
- `Constructor_InventoryIngestionStrategy`

Now since the jobs are much simpler, those site preferences were removed and you can specify the ingestion strategy on the job step configuration.

Also note that the option for categories was removed, since those should always do a `FULL` sync by default.

The cartridge will still fallback to a `DELTA` ingestion in case the sync was triggered with filters to avoid erasing the catalog.

### Functions & general architecture

To make the cartridge easier to test and maintain, we've changed the function names and the overall architecture.

Now we're aiming to have a more functional approach, where each function is exported from one file and can be tested independently.

The biggest changes here is how you transform data and how we abstract the job executions. Here's the highlights:

#### Product data

All product data functions are now extracted into separate files, so it's really easy to customize only what you need to change.

You'd previously find all transformations done in `customizeProductData.js`, and would need to overlay the whole file.

Now, for example, if you want to change how URLs are resolved, you can overlay only one small function:

- `cartridges/link_constructor_connect/cartridge/scripts/helpers/products/getUrl.js`

#### Facets & Metadata

Previously we had one function for facets and one for metadata. This caused issues with performance, since you likely needed to make
the same calculations twice to add a value to both facets and metadata.

Now, we have one function to build both facets and metadata, and two different implementations: one for master products and one for variations.

Take a look at:

- `cartridges/link_constructor_connect/cartridge/scripts/helpers/products/getFacetsAndMetadata.js`
- `cartridges/link_constructor_connect/cartridge/scripts/helpers/products/getFacetsAndMetadataForVariation.js`

#### Wrapping sync jobs

To make sync jobs simpler, we provided an abstraction called `SyncAgent`. This handles all the logic to implement a chunk-oriented job, including
calculating the total count, reading and processing the data, sending the chunks to Constructor and also updating any needed preferences.

In case you implemented custom jobs, you'll want to port them over to use the `SyncAgent` implementation.

It should be simple to use. You'll need to initialize it in `beforeStep` and use it in the next steps.

For example, take a look at how it's initialized for the products job:

```js
var syncAgent = null;

module.exports.beforeStep = function (rawParameters, stepExecution) {
  var parseProductParameters = require('*/cartridge/scripts/jobs/sync/products/parseProductParameters');
  var buildProductApiPayload = require('*/cartridge/scripts/jobs/sync/products/buildProductApiPayload');
  var transformProduct = require('*/cartridge/scripts/helpers/products/transformProduct');
  var ProductReader = require('*/cartridge/scripts/jobs/sync/products/productReader');
  var SyncAgent = require('*/cartridge/scripts/jobs/sync/syncAgent');
  var feedTypes = require('*/cartridge/scripts/constants/feedTypes');

  var parameters = parseProductParameters(rawParameters, stepExecution);

  syncAgent = SyncAgent.create({
    reader: ProductReader.create({ parameters: parameters }),
    buildCustomApiPayload: buildProductApiPayload,
    transformer: transformProduct,
    type: feedTypes.product,
    parameters: parameters
  });
};
```

Once initialized, it can handle any chunk-oriented job step for you. For example:

```js
module.exports.getTotalCount = function () {
  return syncAgent.getTotalCount();
};
```

Take a look at the sync products job for a full example:

- `cartridges/link_constructor_connect/cartridge/scripts/jobs/syncProducts.js`

## How to update

### 1. Installing the new cartridge

Taking in consideration the breaking changes above, here's a to-do list you can follow to update the cartridge:

1. Download the new cartridge version and upload it to your instance.
2. Upload and import the metadata zip file to create the new jobs.
3. From the old jobs, copy over the job step preferences to the new jobs.
4. Also copy over the scheduled runs for your jobs, to make sure they keep running.
5. Delete the old jobs.

### 2. Porting over customizations

You'll also need to port over your customizations, if you have any. Ideally, you should use the `link_constructor_connect_custom` overlay
cartridge already provided in the installation.

As mentioned above, function names have changed to make the cartridge easier to test and maintain. You likely customized facets and metadata,
so you'll need to mainly keep an eye on those customizations to make sure they are ported over correctly.

And if you used the former inventory job (now called `Constructor.PatchProducts`), you'll also need to port over your customizations to:

- `cartridges/link_constructor_connect/cartridge/scripts/helpers/products/transformPatchProduct.js`

### 3. Porting over custom jobs

Finally, if you added any new jobs (e.g. a job to send content to Constructor), you should rewrite it using the `SyncAgent` implementation
to handle sending your data. The previous implementation will not be compatible since we're using new endpoints.

Take a look at any sync job to see how it is implemented, for example:

- `cartridges/link_constructor_connect/cartridge/scripts/jobs/syncProducts.js`

In short, you'll need to:

1. Create a new file under `scripts/jobs` to hold the new job.
2. Implement the new job behavior using the `SyncAgent` abstraction.
3. Add your job to `jobs.xml`, and run `npm run package:metadata-file` to generate the new metadata zip file.
4. Upload and import the metadata zip file to create the new job.

# 3.1.0

### Changes

- Adds [SFCC typescript types](https://github.com/openmindlab/sfcc-dts) to the cartridge. Enabling powerful VScode intellisense support.

# 3.0.2

## Bug fixes

- Removes all relative require statements. Enabling file to be correctly overlaid.
- Adds a new `link_constructor_connect_custom` overlay boilerplate cartridge. Use it as the starting point for any customization :)

# 3.0.0

## New feature: send online variants toggle

By default, the cartridge always sends all variants for any given master product if the product or any of its variants are online.

You can now change this behavior by toggling the `SendOfflineVariants` option in the `writeFiles` step for both the products and inventory jobs.

If disabled, the cartridge will only send online variants. This can be helpful to increase performance and reduce the number of API calls.

## New feature: support for partial syncs based on last sync date

It's now possible to send partial syncs, taking into consideration the last sync date that ran without filters. If enabled, **only products or inventories that have been modified since the last sync will be sent**.

By default, the cartridge also keep track of the date that the sync jobs finished when ran without filters. This is done via a new site preference, called `Constructor_LastSyncDates`. Additionally, dates are always stored in UTC.

You can change this setting by toggling the `PartialByLastSyncDate` option in the `writeFiles` step for both the products and inventory jobs.

**Note:** this can massively improve performance. But be aware that if you're relying on this feature, you should still
do full syncs from time to time (e.g. weekly) to ensure data integrity.

**Note:** This also takes into consideration the locale used for those jobs, so each locale will have its own last sync date.

**Note:** for inventories, the cartridge will consider the inventory update date instead of the product date.

**Note:** if you modify data that does not belong to a product (e.g. search refinements, promotions, campaigns, etc)
you will need to do a full sync or clear the last sync date in the cartridge preferences.

## Quality of life improvements: filtering & ingestion strategies

If the site is configured to do `Full (Replace)` ingestions but you have filters selected OR are using partial syncs (by date),
the cartridge will automatically switch to `Patch (Update)` ingestions to avoid erasing items that should not be erased.

This means that `Full (Replace)` ingestions can only be done if:

- There are no filters
- You are not filtering by last sync date, or the last sync date is empty

## Bug fixes

- Fixes the ingestion types, allowing the user to use `Patch (Update)`.

# 2.0.1

## Changes

- Supports sending data for multiple locales in categories and products
  - To customize this, use the `Locale` param on the `writeFiles` job step
  - You can define the locale ID to fetch data from (e.g. `en_US`, `en_CA`)
  - If the locale data is not available, the cartridge will fallback to the default locale

# 2.0.0

## Changes

- Enabled support for parallel execution in Salesforce job steps
- Adds code to propagate information between job steps using `stepExecution.jobExecution.context`
- Add support for executing the cartridge jobs (of the same type) in parallel
- Add the option to delete files after sending the feeds (previously, we had `KEEP` or `ARCHIVE` only)
- Add the option to customize write & read folders that the cartridge should use

Context on why this is needed: the cartridge currently generates files with fixed names (e.g. `products.xml`), always on the same path. If we run jobs in parallel (e.g. to send data from many locales), job A could corrupt job B's XML file and it would break.

## Examples

We can now run job steps in parallel. For example, here's one scenario where we send data from the same Salesforce site to 4 different Constructor indexes, based on the location:

![image](https://github.com/Constructor-io/cartridge-salesforce/assets/22061051/ad01ff39-2014-4a96-a778-b0034afae6c2)

# 1.6.6

## Changes

- Adds a `Section` parameter for `sendDelta` type steps (sendProductDeltas & sendInventoryDeltas) and plumbs the data through to the Constructor API request

# 1.6.5

## Changes

- Removes unused category data, making the job a bit faster
- Adds `data` field to categories, allowing the user to send category metadata

# 1.6.4

## Changes

- Adds a new job preference (for both products and inventories) to include master products out of stock (non-orderable)
- Updates the maximum API chunk size to 1000, to send smaller and more reliable requests

## New job preference

### Param disabled (default)

<img width="508" alt="image" src="https://user-images.githubusercontent.com/22061051/235510393-639c6e60-ad54-4e80-86e2-5d6915465d96.png">

![image](https://user-images.githubusercontent.com/22061051/235664997-9f0635b5-737c-4d7a-8118-e41a4005b6f7.png)

<img width="596" alt="image" src="https://user-images.githubusercontent.com/22061051/235510488-a78015f7-1435-47eb-8c67-e9a3c1dd9319.png">

Note that:

- 18197 products were sent
- The job took 04 minutes 54 seconds to complete

### Param enabled

<img width="518" alt="image" src="https://user-images.githubusercontent.com/22061051/235511656-b238fb27-5998-48f1-9926-b1482979c202.png">

![image](https://user-images.githubusercontent.com/22061051/235665098-9b4337ec-e95d-445c-965c-78e3ae352c95.png)

<img width="585" alt="image" src="https://user-images.githubusercontent.com/22061051/235511689-6b4b0e21-7b83-4211-8b58-2f81f3fd836d.png">

Note that:

- 24040 products were sent (+ 5843 records)
- The job took 6 minutes 14 seconds to complete

# 1.6.3

## Changes

- Improved inventory sync job: now, all variations are considered when sending inventories.

# 1.6.2

## Changes

- Support to define the ingestion strategy in Constructor from the cartridge.
- Improved error logging.

## Ingestion strategies

Now it's possible to define the ingestion strategy in Constructor from a new site preference. You can define the strategy separately for the jobs to export products, categories, and inventory data.

### How does it work?

According to the setup documentation:

- Full (Replace): Will replace the entire catalog with the data sent.
- Patch (Update): Will update only the items that were sent by the cartridge.
- Patch Delta (Fail in case of additional items): Will partially update the catalog with the data sent, but does not require all fields. Fails if additional items are sent.
- Patch Delta (Create additional items): Will partially update the catalog with the data sent, but does not require all fields. Will create any additional items sent.
- Patch Delta (Ignore additional items): Will partially update the catalog with the data sent, but does not require all fields. Will ignore any additional items sent.

### How to use it

<img width="1471" alt="image" src="https://user-images.githubusercontent.com/22061051/229792184-17ef3693-c8e3-4897-9d1e-d8acdbe2d2f5.png">

When no values are selected, default values are sent. For example, in a product ingestion, we'll send `FULL`:

<img width="312" alt="image" src="https://user-images.githubusercontent.com/22061051/229792512-e697c46e-4f71-4e3f-9e2e-eb4ea3f3b850.png">

But in inventory ingestions, we'll default to patch_delta_fail:

<img width="352" alt="image" src="https://user-images.githubusercontent.com/22061051/229793490-1fc852b2-e603-4879-b755-f45c90ced3e7.png">

And when setting any other value, it'll override the default:

<img width="1454" alt="image" src="https://user-images.githubusercontent.com/22061051/229793631-9f5e237e-3fa3-4715-a2b1-abea3fd5ffd3.png">

<img width="377" alt="image" src="https://user-images.githubusercontent.com/22061051/229793661-8eb687c6-3ff7-46cd-90f6-5d19622bd5f3.png">

# 1.6.1

## Changes

- Improves the transformation of products by adding coalesces in case a few values are falsy
- Improves the product image transformation, getting more values from value types

# 1.6.0

## ⚠️ Breaking changes on description fields

Now the cartridge only sends one description field called `description`. Previously, it used to send two fields (`longDescription` and `shortDescription`).

This was changed to reduce data written and sent, ultimately improving performance.

Before:

- ⏱ Total execution time: ~ `15 min`
- 📦 Total data written on XML files: ~ `116 Mb`

<img width="1875" alt="image" src="https://user-images.githubusercontent.com/22061051/222532645-f0516d28-0fdd-44d2-99fd-40c0f5d7a355.png">

<img width="1491" alt="image" src="https://user-images.githubusercontent.com/22061051/222532059-71d0b3dc-dec7-4fac-8959-b614fd762e2a.png">

After:

- ⏱ Total execution time: ~ `13 min` (- 14%)
- 📦 Total data written on XML files: ~ `86 Mb` (- 26%)

<img width="1859" alt="image" src="https://user-images.githubusercontent.com/22061051/222532353-acee0841-d612-4e72-86f0-4b0d04e189c9.png">

<img width="1495" alt="image" src="https://user-images.githubusercontent.com/22061051/222532247-788b339f-58fa-43ed-8268-00243ab972c9.png">


## 🎨 Better image support

Image support was improved. Now, multiple view types are supported and scanned to find the product image.

Before:

<img width="1235" alt="image" src="https://user-images.githubusercontent.com/22061051/222531605-ffc0c15d-0664-4b46-95a4-c10bbca619aa.png">

After:

<img width="1207" alt="image" src="https://user-images.githubusercontent.com/22061051/222531668-00186e43-1397-446a-b060-2799fbab2676.png">


# 1.5.0

## Changes

This version removes the `Constructor_ToggleCategorySync` attribute since we have separated the category and product jobs.

To avoid syncing categories, you simply need to not run the category job now.

# 1.4.0

## Main changes

This version adds some new parameters to the sync products & sync inventories jobs:

- `SearchPhrase`: Allows filtering the content with a query.
- `CategoryId`: Allows filtering the content with a category id.
- `Ids`: Allows filtering the content with a list of ids (simple products, master products, variation groups or product sets).

<img width="1496" alt="image" src="https://user-images.githubusercontent.com/22061051/221066740-b2c5bffc-9d67-408e-81b8-7ab9977bda6a.png">

### Test setup

For the tests below, we're using the `coh_us_rt` catalog with indexes freshly rebuilt. There are around ~19k indexed items:

<img width="1496" alt="image" src="https://user-images.githubusercontent.com/22061051/221067009-1aef2217-bec5-43d0-bc8e-a84991c5adea.png">

### Parameter: `SearchPhrase`

The search phrase allows customizing the query that is used to fetch products.

- Defaults to `''` (empty string)

When setting it, only a subset of products matching the query will be returned:

<img width="499" alt="image" src="https://user-images.githubusercontent.com/22061051/221067470-06b084a1-80a5-4623-9493-c3d85d9715e6.png">

<img width="1038" alt="image" src="https://user-images.githubusercontent.com/22061051/221067411-27f279b5-0d2f-4fb5-9ea1-1c172f84b050.png">

### Parameter: `CategoryId`

The category id allows customizing the parent category that is used to fetch products.

- All products in or below that category will be included.
- Defaults to the root category.

When setting it, only a subset of products will be returned.

For this test, I've used the test catalog since products have more categories. Note that only one product belongs to the category `cloaks`:

<img width="1455" alt="image" src="https://user-images.githubusercontent.com/22061051/221068592-daa44570-558c-4ef1-aa6c-d87f0b107aac.png">

<img width="903" alt="image" src="https://user-images.githubusercontent.com/22061051/221068751-505a2780-dc47-44ad-95a0-a9c74c451db9.png">

And looking at the export, the product matches:

<img width="1496" alt="image" src="https://user-images.githubusercontent.com/22061051/221068845-ab1a8f9e-9a70-4a47-9633-0df043672685.png">

### Parameter: `Ids`

The ids filter allows filtering by a list of ids to fetch products. Ids must be separated by a comma (e.g. `1, 2, 3`), and will be trimmed automatically.

Note that there are some restrictions on which ids can be used:

- **✅ Simple product ids:** will return the simple product.
- **✅ Master product ids:** will return the master product + all variants.
- **✅ Variation group ids:** will return all variants associated with the variant group.
- **✅ Product set ids:** will return all products associated with the product set.
- **❌ Product bundle ids:** cannot be used.
- **❌ Variant ids:** cannot be used.

### Parameter: `Ids` with Simple Product

When setting it, will return only the simple product.

Here, I'm using the test catalog again due to the lack of simple products in coach catalog.

Let's filter by `product01`:

<img width="498" alt="image" src="https://user-images.githubusercontent.com/22061051/221071514-d349223e-88d0-4367-a879-a6e45dc0d19c.png">

<img width="1319" alt="image" src="https://user-images.githubusercontent.com/22061051/221071455-0bdbc710-08e5-4a4a-a46b-19de32d7fd75.png">

<img width="1910" alt="image" src="https://user-images.githubusercontent.com/22061051/221071570-ec44be9f-ee22-4914-aa80-9ea7fb966977.png">

### Parameter: `Ids` with Master Product

When setting it, will return only the master product + all variants.

Let's take the master product `1512` as an example. It has a lot of variations:

<img width="1881" alt="image" src="https://user-images.githubusercontent.com/22061051/221070837-18409255-5aad-4981-b3f2-af2c5e8f0927.png">

<img width="502" alt="image" src="https://user-images.githubusercontent.com/22061051/221071061-c7ccd782-7ea0-4c77-80d3-e6ab8a54b83a.png">

<img width="1315" alt="image" src="https://user-images.githubusercontent.com/22061051/221070083-9a99f91d-4147-4dc2-8f22-37808d7dfc2a.png">

Simplified JSON to demonstrate the result:

<img width="457" alt="image" src="https://user-images.githubusercontent.com/22061051/221070302-a3fbaedf-46d3-48f6-bae0-55e78c0c6dc5.png">

### Parameter: `Ids` with Variation Group

When setting it, will return only all variants.

The product above (`1512`) has 3 variation groups:

<img width="1885" alt="image" src="https://user-images.githubusercontent.com/22061051/221070532-9ea81b3b-8471-4fa4-8f6f-eadaa3f522ba.png">

Let's filter by `1512-KHA`:

<img width="500" alt="image" src="https://user-images.githubusercontent.com/22061051/221070961-554963a0-e8cf-46ab-a572-dfc4b1de531c.png">

<img width="1317" alt="image" src="https://user-images.githubusercontent.com/22061051/221070637-4c2fa533-98c7-4c94-be59-cd09c361724a.png">

Simplified JSON to demonstrate the result:

<img width="414" alt="image" src="https://user-images.githubusercontent.com/22061051/221070729-db5c5231-49f7-4b5b-8e7e-60274bd705e6.png">

### Parameter: `Ids` with Product Set

When setting it, will return only all products associated with the set.

Let's take as an example:

<img width="1888" alt="image" src="https://user-images.githubusercontent.com/22061051/221072096-8bd0b589-a510-4aa3-89c4-bd6e24e36370.png">

<img width="500" alt="image" src="https://user-images.githubusercontent.com/22061051/221072074-b6053aff-575f-4c53-b7c5-ba3cdc35ae8c.png">

<img width="1304" alt="image" src="https://user-images.githubusercontent.com/22061051/221072005-e0bdce1a-bdcb-4b39-a5d5-f081f624bd94.png">

<img width="1913" alt="image" src="https://user-images.githubusercontent.com/22061051/221072139-655dc8d0-031f-4c03-bc3e-1866f287f6c2.png">

# 1.3.0

## Main changes

The cartridge now uses [Custom Job Steps](https://documentation.b2c.commercecloud.salesforce.com/DOC1/index.jsp?topic=%2Fcom.demandware.dochelp%2Fcontent%2Fb2c_commerce%2Ftopics%2Fjobs%2Fb2c_step_types_json_syntax.html) to define the possible steps that the jobs can have.

Furthermore, cartridge jobs were broken down into 3 distinct jobs:
- ConstructorSyncProductData
- ConstructorSyncCategoryData
- ConstructorSyncInventoryData

So that it's now possible to control how to send categories, products, and inventories separately.

<img width="1496" alt="image" src="https://user-images.githubusercontent.com/22061051/220929262-59956c82-1ac3-48f8-88a4-98185ed233d3.png">

## New feature: `FileAction`

Introducing custom job steps also allows us to use parameters in jobs.

We've added the `FileAction` parameter to all job steps to send deltas (products, categories, inventories). This now allows the cartridge to:

- `ARCHIVE` (default): will move generated files to the archive folder after completing the job
- `KEEP`: will keep the files without any changes after completing the job

Additionally, if the job fails (e.g. our API rejected the deltas) the files will be moved to the error directory automatically.

### Overview

When opening the config for any `send*Deltas` job, you can see the new parameters:

<img width="1496" alt="image" src="https://user-images.githubusercontent.com/22061051/220932223-2d3d9220-3035-4b61-8734-e8e459b0500a.png">

### `FileAction: ARCHIVE`

After running the job, the residual file is moved to the archive folder:

<img width="1496" alt="image" src="https://user-images.githubusercontent.com/22061051/220938299-32d0e0de-0942-4005-8aee-d3cfdcc816c1.png">

<img width="1496" alt="image" src="https://user-images.githubusercontent.com/22061051/220938351-a54368da-91d5-4dcf-b273-a0266ccb1f8a.png">

### `FileAction: KEEP`

After running the job, the residual files are kept in the same directory with no changes:

<img width="1496" alt="image" src="https://user-images.githubusercontent.com/22061051/220939991-7c522658-d332-420f-bfd7-259ef248bc56.png">

### When the job fails

If the job fails (e.g. because sending the deltas failed), files are moved to the error directory:

<img width="1496" alt="image" src="https://user-images.githubusercontent.com/22061051/220940483-7bedd2e5-d170-4328-a302-1b8810da6a7a.png">

<img width="1496" alt="image" src="https://user-images.githubusercontent.com/22061051/220941160-767e2a88-24d1-49fe-9d94-f81ec4af9d13.png">

# 1.2.0

## New features

When searching for products, all of their variants are now included (regardless if they're categorized or not).

Those changes are [documented here](https://github.com/Constructor-io/cartridge-salesforce/pull/60).

## Performance changes

Performance is affected by this change, but should still be under acceptable times.

The tests are using the `coh_us_rt` catalog with indexes freshly rebuilt. There are around ~19k indexed items:

<img width="1496" alt="image" src="https://user-images.githubusercontent.com/22061051/221067009-1aef2217-bec5-43d0-bc8e-a84991c5adea.png">

When running the cartridge in the old cartridge version, the time is varying between ~ `25 sec` and ~ `58 sec`:

<img width="1453" alt="image" src="https://user-images.githubusercontent.com/22061051/219229829-2dee4d1d-38c1-4eee-8cca-c9481fee87d6.png">

With the new version, it's varying from `1 min 40 sec` to `2 min 46 sec`:

<img width="1463" alt="image" src="https://user-images.githubusercontent.com/22061051/219231212-59145e07-c3a0-4aac-92b8-689ba721b92f.png">

# 1.1.0

## New features

- Added a job to sync inventory changes to Constructor. Can be run periodically and only sends inventories (instead of the whole catalog data).
- Added a toggle to disable category sync (`Constructor_ToggleCategorySync`).

## Performance changes

The main focus of this version is the cartridge performance. We're now reading products using the [Product Index](https://help.salesforce.com/s/articleView?id=sf.b2b_commerce_configuration_settings_product_indexing.htm&language=en_US&type=5) and removing offline products to speed things up.

You can find all performance changes [documented here](https://github.com/Constructor-io/cartridge-salesforce/pull/56).

### Test setup

The tests are using the `coh_us_rt` catalog with indexes freshly rebuilt. There are around ~19k indexed items:

<img width="1496" alt="image" src="https://user-images.githubusercontent.com/22061051/221067009-1aef2217-bec5-43d0-bc8e-a84991c5adea.png">

### Before

When executing the job to export with the old cartridge version, here's how long it takes:

👉 **13 min 35 sec**

In total, here are some stats:

- 151497 products were sent
- 375 chunks (requests) were sent to the partnerships backend
- The cartridge wrote about ~116 MB to XML files

<img width="1903" alt="image" src="https://user-images.githubusercontent.com/22061051/216773159-b92b686e-b4d5-4ed0-b298-150625534629.png">

### After

With the new cartridge version, here's how long it takes:

👉 **00 min 35 sec**

In total, here are some stats:

- 7523 products were sent
- 15 chunks (requests) were sent to the partnerships backend
- The cartridge wrote about ~8 MB to XML files

<img width="1900" alt="image" src="https://user-images.githubusercontent.com/22061051/216741017-13306e65-41ca-4fe0-b698-d14997fb4533.png">

# 1.0.0

This is the initial cartridge version. It currently provides:

- A job to sync catalog data from Salesforce to Constructor
