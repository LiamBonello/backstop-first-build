import {
  randomUUID,
} from 'node:crypto';

import type {
  QueryResultRow,
} from 'pg';

import type {
  CreateProtectedPurchaseRequestDto,
  ProtectedPurchaseRecordDto,
  ProtectionEvidenceSnapshot,
  ProtectionTermsDto,
  PurchaseLifecycleStatus,
  UpdateProtectedPurchaseDatesRequestDto,
} from '../src/types/purchase';

import {
  calculateProtectionDeadlines,
} from './protectionDates';

import {
  getDbPool,
} from './db/pool';

interface ProtectedPurchaseRow
  extends QueryResultRow {
  id: string;
  source_scan_id: string;
  merchant: string;
  domain: string;
  product: string;
  amount: string | null;
  currency: string | null;
  amount_label: string;
  purchase_date: string;
  delivery_date: string | null;
  return_deadline: string | null;
  warranty_deadline: string | null;
  renewal_deadline: string | null;
  protection_terms: unknown;
  lifecycle_status: PurchaseLifecycleStatus;
  lifecycle_updated_at: Date | null;
  evidence_snapshot: unknown;
  created_at: Date;
}

const selectColumns = `
  id,
  source_scan_id,
  merchant,
  domain,
  product,
  amount,
  currency,
  amount_label,
  purchase_date,
  delivery_date,
  return_deadline,
  warranty_deadline,
  renewal_deadline,
  protection_terms,
  lifecycle_status,
  lifecycle_updated_at,
  evidence_snapshot,
  created_at
`;

const mapRow = (
  row: ProtectedPurchaseRow,
): ProtectedPurchaseRecordDto => ({
  id:
    row.id,
  sourceScanId:
    row.source_scan_id,
  merchant:
    row.merchant,
  domain:
    row.domain,
  product:
    row.product,
  amount:
    row.amount === null
      ? null
      : Number(row.amount),
  currency:
    row.currency,
  amountLabel:
    row.amount_label,
  purchaseDate:
    row.purchase_date,
  deliveryDate:
    row.delivery_date,
  returnDeadline:
    row.return_deadline,
  warrantyDeadline:
    row.warranty_deadline,
  renewalDeadline:
    row.renewal_deadline,
  protectionTerms:
    row.protection_terms as ProtectionTermsDto,
  lifecycleStatus:
    row.lifecycle_status,
  lifecycleUpdatedAtIso:
    row.lifecycle_updated_at
      ? row.lifecycle_updated_at.toISOString()
      : null,
  evidenceSnapshot:
    row.evidence_snapshot as ProtectionEvidenceSnapshot | null,
  createdAtIso:
    row.created_at.toISOString(),
});

const getOwnedRecord = async (
  clientId: string,
  id: string,
): Promise<ProtectedPurchaseRecordDto | null> => {
  const result =
    await getDbPool().query<ProtectedPurchaseRow>(
      `
        SELECT ${selectColumns}
        FROM protected_purchases
        WHERE client_id = $1
          AND id = $2
        LIMIT 1
      `,
      [
        clientId,
        id,
      ],
    );

  const row =
    result.rows[0];

  return row
    ? mapRow(row)
    : null;
};

export const protectionRepository = {
  async list(
    clientId: string,
  ): Promise<ProtectedPurchaseRecordDto[]> {
    const result =
      await getDbPool().query<ProtectedPurchaseRow>(
        `
          SELECT ${selectColumns}
          FROM protected_purchases
          WHERE client_id = $1
          ORDER BY created_at DESC
        `,
        [clientId],
      );

    return result.rows.map(
      mapRow,
    );
  },

  async create(
    clientId: string,
    input: CreateProtectedPurchaseRequestDto,
  ): Promise<ProtectedPurchaseRecordDto> {
    const deadlines =
      calculateProtectionDeadlines(
        input.protectionTerms,
        {
          purchaseDate:
            input.purchaseDate,
          deliveryDate:
            input.deliveryDate,
        },
      );

    const result =
      await getDbPool().query<ProtectedPurchaseRow>(
        `
          INSERT INTO protected_purchases (
            id,
            client_id,
            source_scan_id,
            merchant,
            domain,
            product,
            amount,
            currency,
            amount_label,
            purchase_date,
            delivery_date,
            return_deadline,
            warranty_deadline,
            renewal_deadline,
            protection_terms,
            lifecycle_status,
            lifecycle_updated_at,
            evidence_snapshot
          )
          VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10, $11, $12,
            $13, $14, $15::jsonb, 'active',
            NULL, $16::jsonb
          )
          ON CONFLICT (client_id, source_scan_id)
          DO UPDATE SET
            merchant = EXCLUDED.merchant,
            domain = EXCLUDED.domain,
            product = EXCLUDED.product,
            amount = EXCLUDED.amount,
            currency = EXCLUDED.currency,
            amount_label = EXCLUDED.amount_label,
            purchase_date = EXCLUDED.purchase_date,
            delivery_date = EXCLUDED.delivery_date,
            return_deadline = EXCLUDED.return_deadline,
            warranty_deadline = EXCLUDED.warranty_deadline,
            renewal_deadline = EXCLUDED.renewal_deadline,
            protection_terms = EXCLUDED.protection_terms,
            evidence_snapshot = EXCLUDED.evidence_snapshot,
            updated_at = now()
          RETURNING ${selectColumns}
        `,
        [
          randomUUID(),
          clientId,
          input.sourceScanId,
          input.merchant,
          input.domain,
          input.product,
          input.amount,
          input.currency,
          input.amountLabel,
          input.purchaseDate,
          input.deliveryDate,
          deadlines.returnDeadline,
          deadlines.warrantyDeadline,
          deadlines.renewalDeadline,
          JSON.stringify(
            input.protectionTerms,
          ),
          JSON.stringify(
            input.evidenceSnapshot,
          ),
        ],
      );

    return mapRow(
      result.rows[0],
    );
  },

  async updateDates(
    clientId: string,
    id: string,
    input: UpdateProtectedPurchaseDatesRequestDto,
  ): Promise<ProtectedPurchaseRecordDto | null> {
    const current =
      await getOwnedRecord(
        clientId,
        id,
      );

    if (!current) {
      return null;
    }

    const deadlines =
      calculateProtectionDeadlines(
        current.protectionTerms,
        input,
      );

    const result =
      await getDbPool().query<ProtectedPurchaseRow>(
        `
          UPDATE protected_purchases
          SET
            purchase_date = $3,
            delivery_date = $4,
            return_deadline = $5,
            warranty_deadline = $6,
            renewal_deadline = $7,
            updated_at = now()
          WHERE client_id = $1
            AND id = $2
          RETURNING ${selectColumns}
        `,
        [
          clientId,
          id,
          input.purchaseDate,
          input.deliveryDate,
          deadlines.returnDeadline,
          deadlines.warrantyDeadline,
          deadlines.renewalDeadline,
        ],
      );

    const row =
      result.rows[0];

    return row
      ? mapRow(row)
      : null;
  },

  async setLifecycle(
    clientId: string,
    id: string,
    lifecycleStatus: PurchaseLifecycleStatus,
  ): Promise<ProtectedPurchaseRecordDto | null> {
    const result =
      await getDbPool().query<ProtectedPurchaseRow>(
        `
          UPDATE protected_purchases
          SET
            lifecycle_status = $3,
            lifecycle_updated_at =
              CASE
                WHEN $3 = 'active'
                  THEN NULL
                ELSE now()
              END,
            updated_at = now()
          WHERE client_id = $1
            AND id = $2
          RETURNING ${selectColumns}
        `,
        [
          clientId,
          id,
          lifecycleStatus,
        ],
      );

    const row =
      result.rows[0];

    return row
      ? mapRow(row)
      : null;
  },

  async remove(
    clientId: string,
    id: string,
  ): Promise<boolean> {
    const result =
      await getDbPool().query(
        `
          DELETE FROM protected_purchases
          WHERE client_id = $1
            AND id = $2
        `,
        [
          clientId,
          id,
        ],
      );

    return Boolean(
      result.rowCount,
    );
  },

  async importRecords(
    clientId: string,
    records: ProtectedPurchaseRecordDto[],
  ): Promise<void> {
    const pool =
      getDbPool();

    const client =
      await pool.connect();

    try {
      await client.query(
        'BEGIN',
      );

      for (const record of records) {
        await client.query(
          `
            INSERT INTO protected_purchases (
              id,
              client_id,
              source_scan_id,
              merchant,
              domain,
              product,
              amount,
              currency,
              amount_label,
              purchase_date,
              delivery_date,
              return_deadline,
              warranty_deadline,
              renewal_deadline,
              protection_terms,
              lifecycle_status,
              lifecycle_updated_at,
              evidence_snapshot,
              created_at
            )
            VALUES (
              $1, $2, $3, $4, $5, $6,
              $7, $8, $9, $10, $11, $12,
              $13, $14, $15::jsonb, $16, $17,
              $18::jsonb, $19
            )
            ON CONFLICT DO NOTHING
          `,
          [
            record.id,
            clientId,
            record.sourceScanId,
            record.merchant,
            record.domain,
            record.product,
            record.amount,
            record.currency,
            record.amountLabel,
            record.purchaseDate,
            record.deliveryDate,
            record.returnDeadline,
            record.warrantyDeadline,
            record.renewalDeadline,
            JSON.stringify(
              record.protectionTerms,
            ),
            record.lifecycleStatus,
            record.lifecycleUpdatedAtIso,
            record.evidenceSnapshot
              ? JSON.stringify(
                  record.evidenceSnapshot,
                )
              : null,
            record.createdAtIso,
          ],
        );
      }

      await client.query(
        'COMMIT',
      );
    } catch (error) {
      await client.query(
        'ROLLBACK',
      );

      throw error;
    } finally {
      client.release();
    }
  },
};
