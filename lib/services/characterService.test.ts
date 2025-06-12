import { describe, expect, it, vi, beforeEach } from 'vitest';
import * as characterService from './characterService';
import { createClient } from '../supabase/server';
import { verifyProjectOwnership } from '../supabase/guards';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/database.types';

vi.mock('../supabase/server');
vi.mock('../supabase/guards');

const mockVerifyProjectOwnership = vi.mocked(verifyProjectOwnership);
const mockCreateClient = vi.mocked(createClient);

describe('characterService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCharacters', () => {
    it('should return characters for a valid project', async () => {
      // Arrange
      mockVerifyProjectOwnership.mockResolvedValueOnce({
        project: { id: 'project-123' },
        error: null,
        status: 200,
      });
      
      const mockCharacters = [{ id: '1', name: 'Test Character' }];
      
      // The fix: Add .order() to the mock chain
      const mockQueryBuilder = {
        order: vi.fn().mockResolvedValue({
          data: mockCharacters,
          error: null,
        }),
      };
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue(mockQueryBuilder), // .eq() now returns the object with .order()
        }),
      });

      mockCreateClient.mockResolvedValue({
        from: mockFrom,
      } as unknown as SupabaseClient<Database>);

      // Act
      const result = await characterService.getCharacters('project-123', 'user-123');
      
      // Assert
      expect(result).toEqual(mockCharacters);
      expect(mockFrom).toHaveBeenCalledWith('characters');
      expect(mockQueryBuilder.order).toHaveBeenCalledWith('created_at', { ascending: true });
    });

    it('should throw error when ownership check fails', async () => {
      // Arrange
      mockVerifyProjectOwnership.mockResolvedValueOnce({
        project: null,
        error: { message: 'Access denied' },
        status: 403,
      });

      // Act & Assert
      await expect(characterService.getCharacters('project-123', 'user-123'))
        .rejects.toThrow('Access denied');
    });
  });

  // Additional tests for other methods would go here
  // (getCharacter, createCharacter, updateCharacter, deleteCharacter)
});
