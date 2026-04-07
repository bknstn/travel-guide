export type BotUserState = 'idle' | 'awaiting_ai_brief';

export type PurchaseStatus =
  | 'paid'
  | 'fulfilled'
  | 'awaiting_bot_start'
  | 'delivery_failed'
  | 'refunded';

export type DeliveryJobStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

export interface GuideCatalogItem {
  slug: string;
  instagramAlias: string;
  title: string;
  destination: string;
  shortDescription: string;
  fullDescription: string;
  priceLabel: string;
  priceMinorUnits: number;
  currency: 'RUB' | 'USD' | 'EUR';
  tributeProductId: number;
  tributePaymentUrl: string;
  tags: string[];
  curatorSynopsis: string;
}

export interface GuideRecommendation {
  slug: string;
  reason: string;
}

export interface TributePurchasePayload {
  product_id: number;
  product_name?: string;
  amount: number;
  currency: string;
  trb_user_id?: string;
  telegram_user_id: number;
  telegram_username?: string;
  purchase_id: number;
  transaction_id?: number;
  purchase_created_at?: string;
  refund_reason?: string;
  refunded_at?: string;
}

export interface TributeWebhookEvent {
  name: 'new_digital_product' | 'digital_product_refunded';
  created_at: string;
  sent_at: string;
  payload: TributePurchasePayload;
}

export interface BotUserRecord {
  telegramUserId: number;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  locale?: string | null;
  state: BotUserState;
}

export interface PurchaseRecord {
  id: number;
  guideSlug: string;
  tributePurchaseId: number;
  tributeProductId: number;
  tributeTransactionId?: number | null;
  telegramUserId: number;
  telegramUsername?: string | null;
  amount: number;
  currency: string;
  status: PurchaseStatus;
  lastError?: string | null;
  fulfilledAt?: Date | null;
  telegramMessageId?: number | null;
  purchaseCreatedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliveryJobRecord {
  id: number;
  purchaseId: number;
  telegramUserId: number;
  status: DeliveryJobStatus;
  attempts: number;
  reason?: string | null;
  lastError?: string | null;
  nextAttemptAt?: Date | null;
  claimedAt?: Date | null;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
