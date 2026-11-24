/** Why a request failed, in plain words, plus what to do about it. */
export type RequestErrorDescription = {
  title: string;
  /** What happened and what to do next. */
  description: string;
  /** The raw code and message, for the development lead. */
  technicalDetails: string;
};
