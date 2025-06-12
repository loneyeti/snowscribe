import { vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';

type SupabaseResponse<T = unknown> = {
  data: T | null;
  error: Error | null;
};

type MockSupabaseClient = SupabaseClient<Database>;

export const createMockSupabaseClient = <T = unknown>(
  mockData: T | null = null, 
  mockError: Error | null = null
) => {
  const mockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: mockData, error: mockError } as SupabaseResponse<T>),
    maybeSingle: vi.fn().mockResolvedValue({ data: mockData, error: mockError } as SupabaseResponse<T>),
    order: vi.fn().mockImplementation(() => ({
      data: Array.isArray(mockData) ? mockData : mockData ? [mockData] : null,
      error: mockError
    })),
    limit: vi.fn().mockReturnThis(),
    then: (resolve: (value: SupabaseResponse<T[]>) => void) => resolve({ 
      data: Array.isArray(mockData) ? mockData : mockData ? [mockData] : null,
      error: mockError 
    }),
  };

  const from = vi.fn(() => mockQueryBuilder);
  
  return {
    from,
    rpc: vi.fn().mockResolvedValue({ data: mockData, error: mockError } as SupabaseResponse<T>),
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    }
  } as unknown as MockSupabaseClient;
};
