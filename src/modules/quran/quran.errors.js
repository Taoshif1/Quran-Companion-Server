export class QuranIntegrityError extends Error {
  constructor(message = "Official Quran content did not pass integrity validation") {
    super(message);
    this.name = "QuranIntegrityError";
    this.status = 502;
    this.code = "QURAN_INTEGRITY_CHECK_FAILED";
  }
}

