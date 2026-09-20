export type ResolutionIssueType =
  | 'return_refused'
  | 'refund_overdue'
  | 'merchant_unresponsive'
  | 'unexpected_renewal'
  | 'warranty_problem'
  | 'item_not_as_described'
  | 'other';

export type ResolutionCaseStatus =
  | 'draft'
  | 'merchant_contacted'
  | 'awaiting_response'
  | 'escalated'
  | 'refund_promised'
  | 'resolved'
  | 'closed';

export type ResolutionCaseEventType =
  | 'created'
  | 'status'
  | 'note';

export interface RawResolutionCaseEventDto {
  id: string;
  eventType: ResolutionCaseEventType;
  detail: string;
  createdAtIso: string;
}

export interface RawResolutionCaseDto {
  id: string;
  purchaseId: string;
  issueType: ResolutionIssueType;
  amountInDispute: number | null;
  currency: string | null;
  desiredOutcome: string;
  status: ResolutionCaseStatus;
  createdAtIso: string;
  updatedAtIso: string;
  merchant: string;
  domain: string;
  product: string;
  purchaseAmountLabel: string;
  purchaseDate: string;
  deliveryDate: string | null;
  returnDeadline: string | null;
  warrantyDeadline: string | null;
  renewalDeadline: string | null;
  evidenceAvailable: boolean;
  events: RawResolutionCaseEventDto[];
}

export interface CreateResolutionCaseRequestDto {
  purchaseId: string;
  issueType: ResolutionIssueType;
  amountInDispute: number | null;
  currency: string | null;
  desiredOutcome: string;
  initialNote: string | null;
}

export interface UpdateResolutionCaseStatusRequestDto {
  status: ResolutionCaseStatus;
}

export interface AddResolutionCaseNoteRequestDto {
  note: string;
}

export interface ResolutionCaseEvent {
  id: string;
  type: ResolutionCaseEventType;
  label: string;
  detail: string;
  dateLabel: string;
}

export interface ResolutionCase {
  id: string;
  purchaseId: string;
  issueType: ResolutionIssueType;
  issueLabel: string;
  amountInDispute: number | null;
  currency: string | null;
  amountInDisputeLabel: string;
  desiredOutcome: string;
  status: ResolutionCaseStatus;
  statusLabel: string;
  statusTone:
    | 'neutral'
    | 'warning'
    | 'positive';
  createdAtLabel: string;
  updatedAtLabel: string;
  merchant: string;
  domain: string;
  product: string;
  purchaseAmountLabel: string;
  purchaseDate: string;
  purchaseDateLabel: string;
  deliveryDate: string | null;
  returnDeadline: string | null;
  returnDeadlineLabel: string | null;
  warrantyDeadline: string | null;
  renewalDeadline: string | null;
  evidenceAvailable: boolean;
  recommendedAction: string;
  messageDraft: string;
  events: ResolutionCaseEvent[];
}
