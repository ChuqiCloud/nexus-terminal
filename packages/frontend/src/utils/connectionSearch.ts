import type { ConnectionInfo } from '../stores/connections.store';
import { createPinyinSearchTerms } from './pinyinSearch';

export interface ConnectionSearchResult {
  connection: ConnectionInfo;
  score: number;
}

export type ConnectionSearchSortBy = 'recent' | 'name';

export interface ConnectionSearchOptions {
  getAdditionalFields?: (connection: ConnectionInfo) => Array<string | null | undefined>;
  sortBy?: ConnectionSearchSortBy;
}

const normalize = (value: string | null | undefined): string => (value ?? '').trim().toLowerCase();

const getDisplayName = (connection: ConnectionInfo): string => connection.name?.trim() || connection.host;

const getEmptyQuerySortValue = (connection: ConnectionInfo): number => connection.last_connected_at ?? 0;

const compareConnectionName = (left: ConnectionInfo, right: ConnectionInfo): number => {
  const displayDiff = getDisplayName(left).localeCompare(getDisplayName(right), undefined, {
    numeric: true,
    sensitivity: 'base',
  });
  if (displayDiff !== 0) {
    return displayDiff;
  }

  const hostDiff = left.host.localeCompare(right.host, undefined, {
    numeric: true,
    sensitivity: 'base',
  });
  if (hostDiff !== 0) {
    return hostDiff;
  }

  return left.id - right.id;
};

const compareConnectionRecent = (left: ConnectionInfo, right: ConnectionInfo): number => {
  const recentDiff = getEmptyQuerySortValue(right) - getEmptyQuerySortValue(left);
  if (recentDiff !== 0) {
    return recentDiff;
  }

  return compareConnectionName(left, right);
};

const compareConnections = (
  left: ConnectionInfo,
  right: ConnectionInfo,
  sortBy: ConnectionSearchSortBy,
): number => (sortBy === 'name'
  ? compareConnectionName(left, right)
  : compareConnectionRecent(left, right));

const getFieldScore = (text: string, query: string): number => {
  if (!text || !query) {
    return 0;
  }

  if (text === query) {
    return 320;
  }

  if (text.startsWith(query)) {
    return 260 - Math.min(text.length - query.length, 40);
  }

  const includeIndex = text.indexOf(query);
  if (includeIndex >= 0) {
    return 220 - Math.min(includeIndex * 6, 90);
  }

  let queryIndex = 0;
  let firstMatchIndex = -1;
  let previousMatchIndex = -1;
  let gapPenalty = 0;

  for (let index = 0; index < text.length && queryIndex < query.length; index += 1) {
    if (text[index] !== query[queryIndex]) {
      continue;
    }

    if (firstMatchIndex === -1) {
      firstMatchIndex = index;
    }

    if (previousMatchIndex >= 0) {
      gapPenalty += index - previousMatchIndex - 1;
    }

    previousMatchIndex = index;
    queryIndex += 1;
  }

  if (queryIndex !== query.length || firstMatchIndex === -1) {
    return 0;
  }

  return Math.max(70, 180 - firstMatchIndex * 4 - gapPenalty * 3);
};

const getSearchTexts = (field: string | null | undefined): string[] => {
  const normalized = normalize(field);
  if (!normalized) {
    return [];
  }

  return Array.from(new Set([
    normalized,
    ...createPinyinSearchTerms(normalized),
  ]));
};

const scoreConnection = (
  connection: ConnectionInfo,
  query: string,
  options?: ConnectionSearchOptions,
): number => {
  const fields: Array<[string[], number]> = [
    [getSearchTexts(connection.name), 40],
    [getSearchTexts(connection.host), 28],
    [getSearchTexts(connection.username), 16],
    [getSearchTexts(connection.type), 10],
  ];

  const additionalFields = options?.getAdditionalFields?.(connection) ?? [];
  additionalFields.forEach((field) => {
    fields.push([getSearchTexts(field), 14]);
  });

  let bestScore = 0;

  for (const [fieldTexts, weight] of fields) {
    for (const fieldText of fieldTexts) {
      const fieldScore = getFieldScore(fieldText, query);
      if (fieldScore <= 0) {
        continue;
      }

      bestScore = Math.max(bestScore, fieldScore + weight);
    }
  }

  return bestScore;
};

export const searchConnections = (
  connections: ConnectionInfo[],
  rawQuery: string,
  limit = 8,
  options?: ConnectionSearchOptions,
): ConnectionSearchResult[] => {
  const query = normalize(rawQuery);
  const sortBy = options?.sortBy ?? 'recent';

  if (!query) {
    return [...connections]
      .sort((left, right) => compareConnections(left, right, sortBy))
      .slice(0, limit)
      .map((connection) => ({ connection, score: 0 }));
  }

  return connections
    .map((connection) => ({
      connection,
      score: scoreConnection(connection, query, options),
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => {
      const sortDiff = compareConnections(left.connection, right.connection, sortBy);
      if (sortDiff !== 0) {
        return sortDiff;
      }

      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.connection.id - right.connection.id;
    })
    .slice(0, limit);
};
