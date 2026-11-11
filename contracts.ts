/** Contrats internes proposés, non branchés à un fournisseur. */
export type Money = { amountMinor: number; currency: 'EUR' };
export type Capability = 'search'|'availability'|'hold'|'embeddedPurchase'|'embeddedReservation'|'cancel'|'refund'|'webhooks';
export interface PartnerAdapter {
  readonly provider: string;
  readonly capabilities: ReadonlySet<Capability>;
  quote(request: {performanceId?:string; restaurantId?:string; startAt:string; timezone:string; partySize:number}): Promise<Quote>;
  hold(quoteId:string, idempotencyKey:string):Promise<{reference:string;expiresAt:string}>;
  confirm(holdReference:string, idempotencyKey:string):Promise<{reference:string;status:'pending'|'confirmed'|'failed'}>;
  status(reference:string):Promise<{status:'pending'|'confirmed'|'failed'|'cancelled'}>;
  cancel(reference:string,idempotencyKey:string):Promise<{status:'pending'|'cancelled'|'rejected'}>;
}
export interface Quote { id:string; expiresAt:string; total:Money|null; fees:Money|null; termsVersion:string; sourceCheckedAt:string; bookable:boolean; blockingReasons:string[] }
export type OrderState='quoted'|'holding'|'awaiting_payment'|'confirming'|'confirmed'|'expired'|'failed'|'partially_confirmed'|'cancelling'|'cancelled'|'refund_pending'|'refunded'|'manual_review';
// Tout adaptateur non configuré doit échouer explicitement, jamais fabriquer une confirmation.
export class UnconfiguredPartner { readonly capabilities=new Set<Capability>(); async quote():Promise<never>{throw new Error('PARTNER_NOT_CONFIGURED')} }
