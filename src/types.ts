export interface Regulation {
  regulationName: string;
  competentAuthority: string;
  lastAmendedDate: string;
  article: string;
  content: string;
  penalty: string;
}

export interface Policy {
  policyName: string;
  issuingAgency: string;
  publicationDate: string;
  status: string;
  summary: string;
  keyPoints: string[];
}

export interface GroundingSource {
  uri: string;
  title?: string;
}