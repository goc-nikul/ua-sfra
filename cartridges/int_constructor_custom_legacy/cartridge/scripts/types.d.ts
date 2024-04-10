export type ProductJobParameters = {
  /**
   * Determines if master products that are online but with all variants out of stock should be included.
   * Note that this will affect performance.
   */
  includeMasterProductsOutOfStock?: boolean;

  /**
   * The search phrase that can be used to filter the products.
   */
  searchPhrase?: string;

  /**
   * The category id that will be used to filter the products.
   * Defaults to the root category if not provided.
   */
  categoryId?: string;

  /**
   * The list of ids to filter records by. Can be a the product id or variation group id.
   * Needs to be separated by commas (,). Example: `1, 2, 3`.
   * Note that there is a maximum of 30 IDs that can be specified.
   */
  ids?: string;
};

export type WriteProductXmlParameters = {
  /**
   * The last sync (without filters) date. If provided, it'll be used to filter the records.
   */
  lastSyncDate?: Date | null;

  /**
   * Determines if variants that are not online should be sent if the master product or any of its other variants are online.
   * Note that this will affect performance.
   */
  sendOfflineVariants?: boolean;
};

export type ApiPayloadParameters = {
  /**
   * The Salesforce Feed ID returned by the backend.
   * This will be available after the first call to the backend, and needs to be
   * passed to the backend on subsequent calls.
   */
  salesforceFeedId: string | undefined;

  /**
   * The Constructor index section.
   */
  section: string;

  /**
   * The feed type.
   */
  type: string;

  /**
   * The job execution context, containing shared job variables.
   */
  jobExecutionContext: object;

  /**
   * The credentials to use to authenticate with the backend.
   */
  credentials: {
    apiToken: string;
    apiKey: string;
  };

  /**
   * The total number of records that will be sent to the backend.
   */
  totalAmount: number;

  /**
   * The records that will be sent to the backend.
   */
  records: any[];
};
