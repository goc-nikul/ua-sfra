/**
 * Defines the raw job step parameters that are accepted in the sync products job.
 */
export type RawSyncProductsJobParameters = {
  /**
   * Determines if the feed should only contain products that have been modified since the last sync date (without filters).
   * Defaults to false.
   * Note that this can improve performance.
   */
  PartialByLastSyncDate: boolean;

  /**
   * Determines if variants that are not online should be sent if the master product or any of its other variants are online.
   * Note that this will affect performance.
   */
  SendOfflineVariants: boolean;

  /**
   * Determines if master products that are online but with all variants out of stock should be included.
   * Note that this will affect performance.
   */
  IncludeMasterProductsOutOfStock: boolean;

  /**
   * The ingestion strategy to use when sending data to the index.
   */
  IngestionStrategy: string;

  /**
   * Allows overriding the API key defined in the site preferences.
   * Useful to send data to multiple indexes from the same site (e.g. different locales).
   */
  ApiKeyOverride?: string;

  /**
   * The locale ID to use when filling product data (e.g. `en_US`).
   * Will fallback to the default catalog locale if not provided.
   */
  Locale?: string;

  /**
   * Defines which section of the index to write the data to.
   */
  Section?: string;

  /**
   * The list of ids to filter records by.
   * Needs to be separated by commas (,). Example: `1, 2, 3`.
   * Can be a the product id, variation id or variation group id.
   * Note that there is a maximum of 30 IDs that can be specified.
   */
  "Filters.Ids"?: string;

  /**
   * The category id that will be used to filter the products.
   * Defaults to the root category if not provided.
   */
  "Filters.CategoryId"?: string;

  /**
   * The search phrase that can be used to filter the products.
   */
  "Filters.SearchPhrase"?: string;
};

/**
 * The base parameters for a sync job.
 */
export type SyncJobBaseParameters = {
  credentials: Credentials;
  startedAt: Date;
  jobID: string;
  apiKeyOverride: string | null;
  locale: string | null;

  // Any additional parameters that are not part of the base parameters.
  [key: string]: unknown;
};

export type ReaderReadNextLineResult = {
  /**
   * The record that was just read. For example, this can be a `dw.catalog.Product` instance.
   */
  record: object;

  /**
   * Defines if the record is valid. If false, it won't be sent.
   */
  valid: boolean;

  /**
   * Defines any data that was computed to be used in the next steps, such as the transformation.
   * For example, this is useful if you want to compute the data for a product only once instead
   * of recomputing it for all variations in the transformation step.
   */
  data: object;
};

export type SyncAgentCreateArgs = {
  buildCustomApiPayload: SyncJobBuildCustomApiPayloadAdapter;
  transformer: SyncJobTransformerAdapter;
  parameters: SyncJobBaseParameters;
  reader: SyncJobReaderAdapter;
  type: FeedType;
};

export type SyncJobReaderAdapterCreateArgs = {
  parameters: SyncJobBaseParameters;
  [key: string]: unknown;
};

/**
 * The base implementation for a reader adapter during a sync job.
 *
 * To get the total count, a reader must implement either `readNextCountLine` or `getTotalCount`.
 */
export type SyncJobReaderAdapter = {
  /**
   * Creates a new reader adapter with the data.
   */
  create: (args: SyncJobReaderAdapterCreateArgs) => SyncJobReaderAdapter;

  /**
   * Resets the reader to the initial state.
   * Useful when the reader is used multiple times, for example for counting and then reading.
   */
  reset: () => void;

  /**
   * Reads the total count of records to sync.
   * @returns The total count of records to sync.
   */
  getTotalCount: undefined | (() => number);

  /**
   * Reads the count of records to sync, line by line.
   * @returns The next record to sync, or null if there are no more records to sync.
   */
  readNextCountLine: undefined | (() => ReaderReadNextLineResult | null);

  /**
   * @returns The next record to sync, or null if there are no more records to sync.
   */
  readNextRecordLine: () => ReaderReadNextLineResult | null;
};

/**
 * The base implementation for a transformer adapter during a sync job.
 *
 * The first argument is the record that was read.
 * The second argument is the data that was computed in the reader.
 */
export type SyncJobTransformerAdapter = (record: object, data: object) => object;

/**
 * The function called to build the custom API payload for the sync job.
 * Some parameters depend on the endpoint being used, so we use an adapter to build those.
 */
export type SyncJobBuildCustomApiPayloadAdapter =
  | undefined
  | ((parameters: SyncJobBaseParameters) => object);

/**
 * Defines the processed job step parameters that are accepted in the sync products job.
 */
export type SyncProductsJobParameters = SyncJobBaseParameters & {
  ingestionStrategy: string;
  searchPhrase: string | null;
  categoryId: string | null;
  ids: string[] | null;
  hasFilters: boolean;
  includeMasterProductsOutOfStock: boolean;
  partialByLastSyncDate: boolean;
  sendOfflineVariants: boolean;
  section: string | null;
  lastSyncDate: Date | null;
};

/**
 * Defines parameters passed to the api function when sending data to the backend.
 */
export type ApiSendDeltaV2Parameters = {
  salesforceFeedId: string | null;
  credentials: Credentials;
  records: unknown[];
  strategy: string;
  type: FeedType;
};

/**
 * Defines parameters passed to the api function when marking feeds as completed.
 */
export type ApiMarkFeedAsCompletedV2Parameters = {
  totalExecutionTimeMs: number;
  salesforceFeedId: string;
  sentChunksCount: number;
  credentials: Credentials;
};

export type Credentials = {
  apiToken: string;
  apiKey: string;
};

/**
 * The type, as defined in the `feedTypes` constant.
 */
export type FeedType = "product" | "category";
