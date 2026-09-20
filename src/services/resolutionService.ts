import {
  mapResolutionCase,
} from '../mappers/resolutionMapper';

import type {
  CreateResolutionCaseRequestDto,
  RawResolutionCaseDto,
  ResolutionCase,
  ResolutionCaseStatus,
} from '../types/resolution';

import {
  backstopRequestJson,
} from './backstopApi';

export const resolutionService = {
  async list(): Promise<
    ResolutionCase[]
  > {
    const response =
      await backstopRequestJson<{
        cases:
          RawResolutionCaseDto[];
      }>(
        '/api/resolution-cases',
      );

    return response.cases.map(
      mapResolutionCase,
    );
  },

  async create(
    input:
      CreateResolutionCaseRequestDto,
  ): Promise<
    ResolutionCase
  > {
    const response =
      await backstopRequestJson<RawResolutionCaseDto>(
        '/api/resolution-cases',
        {
          method:
            'POST',
          body:
            JSON.stringify(
              input,
            ),
        },
      );

    return mapResolutionCase(
      response,
    );
  },

  async setStatus(
    id: string,
    status:
      ResolutionCaseStatus,
  ): Promise<
    ResolutionCase
  > {
    const response =
      await backstopRequestJson<RawResolutionCaseDto>(
        `/api/resolution-cases/${encodeURIComponent(
          id,
        )}/status`,
        {
          method:
            'PATCH',
          body:
            JSON.stringify({
              status,
            }),
        },
      );

    return mapResolutionCase(
      response,
    );
  },

  async addNote(
    id: string,
    note: string,
  ): Promise<
    ResolutionCase
  > {
    const response =
      await backstopRequestJson<RawResolutionCaseDto>(
        `/api/resolution-cases/${encodeURIComponent(
          id,
        )}/notes`,
        {
          method:
            'POST',
          body:
            JSON.stringify({
              note,
            }),
        },
      );

    return mapResolutionCase(
      response,
    );
  },
};
