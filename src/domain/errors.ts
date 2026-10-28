// Thrown by an adapter that can't serve a query at all (e.g. a date range outside its plan).
// The aggregator reports these sources as skipped, not failed.
export class UnsupportedQueryError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = "UnsupportedQueryError";
  }
}
