// types/veriff.ts
export interface VeriffSessionResponse {
  status: string;
  verification: {
    id: string;
    url: string;
  };
}
