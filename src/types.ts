export interface Regulation {
  regulationName: string;
  competentAuthority: string;
  lastAmendedDate: string;
  article: string;
  content: string;
  penalty: string;
}

export interface GroundingSource {
  uri: string;
  title?: string;
}
