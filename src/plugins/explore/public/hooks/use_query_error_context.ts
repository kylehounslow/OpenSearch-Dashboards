/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../application/utils/state_management/store';
import { selectQueryStatusMap } from '../application/utils/state_management/selectors';
import { QueryExecutionStatus } from '../application/utils/state_management/types';

/**
 * Hook that captures query error information and provides it to the AI assistant context
 */
export function useQueryErrorContext(): void {
  const query = useSelector((state: RootState) => state.query);
  const queryStatusMap = useSelector(selectQueryStatusMap);

  useEffect(() => {
    const contextStore = (window as any).assistantContextStore;
    if (!contextStore) return;

    // Find any query errors in the status map
    const queryErrors = Object.entries(queryStatusMap)
      .filter(([, status]) => status.status === QueryExecutionStatus.ERROR && status.error)
      .map(([cacheKey, status]) => ({
        cacheKey,
        error: status.error,
        query: query.query,
        language: query.language,
        dataset: query.dataset,
      }));

    if (queryErrors.length > 0) {
      // Add query error context for the AI assistant
      contextStore.addContext({
        id: 'query-error-context',
        description: 'Query execution error details',
        value: {
          hasErrors: true,
          errors: queryErrors.map(({ error, query: queryString, language, dataset }) => ({
            details: error?.message?.details || 'Unknown error',
            type: error?.message?.type || 'Unknown',
            reason: error?.message?.reason || 'Query execution failed',
            statusCode: error?.statusCode,
            query: queryString,
            language,
            dataset: dataset
              ? {
                  id: dataset.id,
                  title: dataset.title,
                  type: dataset.type,
                }
              : null,
          })),
        },
        categories: ['dynamic', 'query', 'error'],
      });
    } else {
      // Remove error context if no errors exist
      contextStore.removeContextById('query-error-context');
    }
  }, [query, queryStatusMap]);
}
