/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { useQueryErrorContext } from './use_query_error_context';
import { QueryExecutionStatus } from '../application/utils/state_management/types';

// Mock the assistant context store
const mockContextStore = {
  addContext: jest.fn(),
  removeContextById: jest.fn(),
};

// Mock window.assistantContextStore
Object.defineProperty(window, 'assistantContextStore', {
  value: mockContextStore,
  writable: true,
});

// Mock Redux store
const createMockStore = (queryStatusMap: any, query: any) => {
  const initialState = {
    query,
    queryStatusMap,
  };

  return createStore((state = initialState) => state);
};

describe('useQueryErrorContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should add error context when query errors exist', () => {
    const mockQuery = {
      query: 'source=ss4o_logs* | where serviceName="ad"',
      language: 'PPL',
      dataset: {
        id: 'test-dataset-id',
        title: 'ss4o_logs*',
        type: 'INDEX_PATTERN',
      },
    };

    const mockQueryStatusMap = {
      'cache-key-1': {
        status: QueryExecutionStatus.ERROR,
        error: {
          statusCode: 400,
          error: 'Bad Request',
          message: {
            details: "can't resolve Symbol(namespace=FIELD_NAME, name=duration) in type env",
            reason: 'Invalid Query',
            type: 'SemanticCheckException',
          },
        },
      },
    };

    const store = createMockStore(mockQueryStatusMap, mockQuery);

    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    renderHook(() => useQueryErrorContext(), {
      wrapper: Wrapper,
    });

    expect(mockContextStore.addContext).toHaveBeenCalledWith({
      id: 'query-error-context',
      description: 'Query execution error details',
      value: {
        hasErrors: true,
        errors: [
          {
            details: "can't resolve Symbol(namespace=FIELD_NAME, name=duration) in type env",
            type: 'SemanticCheckException',
            reason: 'Invalid Query',
            statusCode: 400,
            query: 'source=ss4o_logs* | where serviceName="ad"',
            language: 'PPL',
            dataset: {
              id: 'test-dataset-id',
              title: 'ss4o_logs*',
              type: 'INDEX_PATTERN',
            },
          },
        ],
      },
      categories: ['dynamic', 'query', 'error'],
    });
  });

  it('should remove error context when no errors exist', () => {
    const mockQuery = {
      query: 'source=ss4o_logs*',
      language: 'PPL',
      dataset: null,
    };

    const mockQueryStatusMap = {
      'cache-key-1': {
        status: QueryExecutionStatus.READY,
      },
    };

    const store = createMockStore(mockQueryStatusMap, mockQuery);

    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    renderHook(() => useQueryErrorContext(), {
      wrapper: Wrapper,
    });

    expect(mockContextStore.removeContextById).toHaveBeenCalledWith('query-error-context');
  });

  it('should handle missing context store gracefully', () => {
    // Temporarily remove the context store
    const originalStore = (window as any).assistantContextStore;
    delete (window as any).assistantContextStore;

    const mockQuery = { query: '', language: 'PPL', dataset: null };
    const mockQueryStatusMap = {};
    const store = createMockStore(mockQueryStatusMap, mockQuery);

    expect(() => {
      const Wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      renderHook(() => useQueryErrorContext(), {
        wrapper: Wrapper,
      });
    }).not.toThrow();

    // Restore the context store
    (window as any).assistantContextStore = originalStore;
  });
});
