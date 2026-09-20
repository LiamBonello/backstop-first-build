import {
  randomUUID,
} from 'node:crypto';

import type {
  PoolClient,
  QueryResultRow,
} from 'pg';

import type {
  CreateResolutionCaseRequestDto,
  RawResolutionCaseDto,
  RawResolutionCaseEventDto,
  ResolutionCaseEventType,
  ResolutionCaseStatus,
} from '../src/types/resolution';

import {
  getDbPool,
} from './db/pool';

interface ResolutionCaseRow
  extends QueryResultRow {
  id: string;
  protected_purchase_id: string;
  issue_type:
    CreateResolutionCaseRequestDto['issueType'];
  amount_in_dispute: string | null;
  currency: string | null;
  desired_outcome: string;
  status: ResolutionCaseStatus;
  created_at: Date;
  updated_at: Date;
  merchant: string;
  domain: string;
  product: string;
  purchase_amount_label: string;
  purchase_date: string;
  delivery_date: string | null;
  return_deadline: string | null;
  warranty_deadline: string | null;
  renewal_deadline: string | null;
  evidence_available: boolean;
}

interface ResolutionEventRow
  extends QueryResultRow {
  id: string;
  resolution_case_id: string;
  event_type:
    ResolutionCaseEventType;
  detail: string;
  created_at: Date;
}

const statusEventLabels: Record<
  ResolutionCaseStatus,
  string
> = {
  draft:
    'Case moved back to draft.',
  merchant_contacted:
    'Merchant contact recorded.',
  awaiting_response:
    'Case is awaiting the merchant response.',
  escalated:
    'Case marked as escalated.',
  refund_promised:
    'Merchant refund promise recorded.',
  resolved:
    'Case marked as resolved.',
  closed:
    'Case closed.',
};

const selectCaseColumns = `
  resolution.id,
  resolution.protected_purchase_id,
  resolution.issue_type,
  resolution.amount_in_dispute,
  resolution.currency,
  resolution.desired_outcome,
  resolution.status,
  resolution.created_at,
  resolution.updated_at,
  purchase.merchant,
  purchase.domain,
  purchase.product,
  purchase.amount_label AS purchase_amount_label,
  purchase.purchase_date::text AS purchase_date,
  purchase.delivery_date::text AS delivery_date,
  purchase.return_deadline::text AS return_deadline,
  purchase.warranty_deadline::text AS warranty_deadline,
  purchase.renewal_deadline::text AS renewal_deadline,
  (purchase.evidence_snapshot IS NOT NULL) AS evidence_available
`;

const mapEvent = (
  row: ResolutionEventRow,
): RawResolutionCaseEventDto => ({
  id:
    row.id,
  eventType:
    row.event_type,
  detail:
    row.detail,
  createdAtIso:
    row.created_at.toISOString(),
});

const loadEvents = async (
  caseIds: string[],
): Promise<
  Map<
    string,
    RawResolutionCaseEventDto[]
  >
> => {
  const grouped =
    new Map<
      string,
      RawResolutionCaseEventDto[]
    >();

  if (
    caseIds.length === 0
  ) {
    return grouped;
  }

  const result =
    await getDbPool().query<ResolutionEventRow>(
      `
        SELECT
          id,
          resolution_case_id,
          event_type,
          detail,
          created_at
        FROM resolution_case_events
        WHERE resolution_case_id = ANY($1::uuid[])
        ORDER BY created_at ASC
      `,
      [caseIds],
    );

  for (
    const row of
    result.rows
  ) {
    const events =
      grouped.get(
        row.resolution_case_id,
      ) ?? [];

    events.push(
      mapEvent(
        row,
      ),
    );

    grouped.set(
      row.resolution_case_id,
      events,
    );
  }

  return grouped;
};

const mapCase = (
  row: ResolutionCaseRow,
  events:
    RawResolutionCaseEventDto[],
): RawResolutionCaseDto => ({
  id:
    row.id,
  purchaseId:
    row.protected_purchase_id,
  issueType:
    row.issue_type,
  amountInDispute:
    row.amount_in_dispute ===
    null
      ? null
      : Number(
          row.amount_in_dispute,
        ),
  currency:
    row.currency,
  desiredOutcome:
    row.desired_outcome,
  status:
    row.status,
  createdAtIso:
    row.created_at.toISOString(),
  updatedAtIso:
    row.updated_at.toISOString(),
  merchant:
    row.merchant,
  domain:
    row.domain,
  product:
    row.product,
  purchaseAmountLabel:
    row.purchase_amount_label,
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
  evidenceAvailable:
    row.evidence_available,
  events,
});

const listRows = async (
  clientId: string,
): Promise<
  ResolutionCaseRow[]
> => {
  const result =
    await getDbPool().query<ResolutionCaseRow>(
      `
        SELECT
          ${selectCaseColumns}
        FROM resolution_cases AS resolution
        INNER JOIN protected_purchases AS purchase
          ON purchase.id = resolution.protected_purchase_id
        WHERE resolution.client_id = $1
        ORDER BY resolution.updated_at DESC
      `,
      [clientId],
    );

  return result.rows;
};

const getOwnedCaseRow = async (
  clientId: string,
  id: string,
  client?: PoolClient,
): Promise<
  ResolutionCaseRow | null
> => {
  const executor =
    client ??
    getDbPool();

  const result =
    await executor.query<ResolutionCaseRow>(
      `
        SELECT
          ${selectCaseColumns}
        FROM resolution_cases AS resolution
        INNER JOIN protected_purchases AS purchase
          ON purchase.id = resolution.protected_purchase_id
        WHERE resolution.client_id = $1
          AND resolution.id = $2
        LIMIT 1
      `,
      [
        clientId,
        id,
      ],
    );

  return (
    result.rows[0] ??
    null
  );
};

const hydrateSingle = async (
  row:
    ResolutionCaseRow,
): Promise<
  RawResolutionCaseDto
> => {
  const events =
    await loadEvents([
      row.id,
    ]);

  return mapCase(
    row,
    events.get(
      row.id,
    ) ?? [],
  );
};

export const resolutionRepository = {
  async list(
    clientId: string,
  ): Promise<
    RawResolutionCaseDto[]
  > {
    const rows =
      await listRows(
        clientId,
      );

    const events =
      await loadEvents(
        rows.map(
          (row) =>
            row.id,
        ),
      );

    return rows.map(
      (row) =>
        mapCase(
          row,
          events.get(
            row.id,
          ) ?? [],
        ),
    );
  },

  async create(
    clientId: string,
    input:
      CreateResolutionCaseRequestDto,
  ): Promise<
    RawResolutionCaseDto | null
  > {
    const pool =
      getDbPool();

    const client =
      await pool.connect();

    try {
      await client.query(
        'BEGIN',
      );

      const ownedPurchase =
        await client.query<{
          id: string;
        }>(
          `
            SELECT id
            FROM protected_purchases
            WHERE client_id = $1
              AND id = $2
            LIMIT 1
          `,
          [
            clientId,
            input.purchaseId,
          ],
        );

      if (
        !ownedPurchase.rows[0]
      ) {
        await client.query(
          'ROLLBACK',
        );

        return null;
      }

      const existing =
        await client.query<{
          id: string;
        }>(
          `
            SELECT id
            FROM resolution_cases
            WHERE client_id = $1
              AND protected_purchase_id = $2
            LIMIT 1
          `,
          [
            clientId,
            input.purchaseId,
          ],
        );

      let caseId =
        existing.rows[0]?.id ??
        null;

      if (!caseId) {
        caseId =
          randomUUID();

        await client.query(
          `
            INSERT INTO resolution_cases (
              id,
              client_id,
              protected_purchase_id,
              issue_type,
              amount_in_dispute,
              currency,
              desired_outcome
            )
            VALUES (
              $1, $2, $3, $4, $5, $6, $7
            )
          `,
          [
            caseId,
            clientId,
            input.purchaseId,
            input.issueType,
            input.amountInDispute,
            input.currency,
            input.desiredOutcome,
          ],
        );

        await client.query(
          `
            INSERT INTO resolution_case_events (
              id,
              client_id,
              resolution_case_id,
              event_type,
              detail
            )
            VALUES (
              $1, $2, $3, 'created', $4
            )
          `,
          [
            randomUUID(),
            clientId,
            caseId,
            'Resolution case created from the protected purchase.',
          ],
        );

        if (
          input.initialNote
        ) {
          await client.query(
            `
              INSERT INTO resolution_case_events (
                id,
                client_id,
                resolution_case_id,
                event_type,
                detail
              )
              VALUES (
                $1, $2, $3, 'note', $4
              )
            `,
            [
              randomUUID(),
              clientId,
              caseId,
              input.initialNote,
            ],
          );
        }
      }

      await client.query(
        'COMMIT',
      );

      const row =
        await getOwnedCaseRow(
          clientId,
          caseId,
        );

      return row
        ? await hydrateSingle(
            row,
          )
        : null;
    } catch (error) {
      await client.query(
        'ROLLBACK',
      );

      throw error;
    } finally {
      client.release();
    }
  },

  async setStatus(
    clientId: string,
    id: string,
    status:
      ResolutionCaseStatus,
  ): Promise<
    RawResolutionCaseDto | null
  > {
    const pool =
      getDbPool();

    const client =
      await pool.connect();

    try {
      await client.query(
        'BEGIN',
      );

      const result =
        await client.query<ResolutionCaseRow>(
          `
            UPDATE resolution_cases AS resolution
            SET
              status = $3,
              updated_at = now()
            FROM protected_purchases AS purchase
            WHERE resolution.client_id = $1
              AND resolution.id = $2
              AND purchase.id = resolution.protected_purchase_id
            RETURNING
              ${selectCaseColumns}
          `,
          [
            clientId,
            id,
            status,
          ],
        );

      const row =
        result.rows[0];

      if (!row) {
        await client.query(
          'ROLLBACK',
        );

        return null;
      }

      await client.query(
        `
          INSERT INTO resolution_case_events (
            id,
            client_id,
            resolution_case_id,
            event_type,
            detail
          )
          VALUES (
            $1, $2, $3, 'status', $4
          )
        `,
        [
          randomUUID(),
          clientId,
          id,
          statusEventLabels[
            status
          ],
        ],
      );

      await client.query(
        'COMMIT',
      );

      return await hydrateSingle(
        row,
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

  async addNote(
    clientId: string,
    id: string,
    note: string,
  ): Promise<
    RawResolutionCaseDto | null
  > {
    const pool =
      getDbPool();

    const client =
      await pool.connect();

    try {
      await client.query(
        'BEGIN',
      );

      const row =
        await getOwnedCaseRow(
          clientId,
          id,
          client,
        );

      if (!row) {
        await client.query(
          'ROLLBACK',
        );

        return null;
      }

      await client.query(
        `
          INSERT INTO resolution_case_events (
            id,
            client_id,
            resolution_case_id,
            event_type,
            detail
          )
          VALUES (
            $1, $2, $3, 'note', $4
          )
        `,
        [
          randomUUID(),
          clientId,
          id,
          note,
        ],
      );

      await client.query(
        `
          UPDATE resolution_cases
          SET updated_at = now()
          WHERE client_id = $1
            AND id = $2
        `,
        [
          clientId,
          id,
        ],
      );

      await client.query(
        'COMMIT',
      );

      const updated =
        await getOwnedCaseRow(
          clientId,
          id,
        );

      return updated
        ? await hydrateSingle(
            updated,
          )
        : null;
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
