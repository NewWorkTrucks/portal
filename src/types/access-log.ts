/** Where a row came from: a page load (proxy) or a card change (database). */
export type AccessLogSource = "page" | "card-write";

/** "blocked-phone" when the visit was turned away by the phone block (US-9.1). */
export type AccessLogOutcome = "allowed" | "blocked-phone";

export type AccessLogRow = {
  occurredAt: string;
  /** Empty when nobody was signed in. */
  personName: string;
  ipAddress: string | null;
  source: AccessLogSource;
  outcome: AccessLogOutcome;
  method: string;
  path: string;
  userAgent: string;
  details: Record<string, unknown>;
};

export type AccessLogFilterValues = {
  /** YYYY-MM-DD, US Central, included. */
  fromDate: string;
  /** YYYY-MM-DD, US Central, included. */
  toDate: string;
  /** A person's name from the results, or "" for everyone. */
  personName: string;
};

export type AccessLogFilterFormProps = {
  initialValues: AccessLogFilterValues;
  /** The people who appear in the current results. */
  personNames: string[];
  onSubmit: (filterValues: AccessLogFilterValues) => void;
};
