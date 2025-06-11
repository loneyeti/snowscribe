import { describe, expect, it, vi } from 'vitest';
import * as characterService from './characterService';
import { createClient } from '../supabase/server';
import { verifyProjectOwnership } from '../supabase/guards';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/database.types';

// Mock the Supabase client and guards
vi.mock('../supabase/server');
vi.mock('../supabase/guards');

// Type the mocks
const mockVerifyProjectOwnership = vi.mocked(verifyProjectOwnership);
const mockCreateClient = vi.mocked(createClient);

describe('characterService', () => {
  describe('getCharacters', () => {
    it('should return characters for a valid project', async () => {
      // Mock verifyProjectOwnership to return success
      mockVerifyProjectOwnership.mockResolvedValueOnce({ 
        project: { id: 'project-123' },
        error: null,
        status: 200
      });
      
      // Mock Supabase response
      const mockCharacters = [{ id: '1', name: 'Test Character' }];
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ 
            data: mockCharacters, 
            error: null 
          })
        })
      });
      
      mockCreateClient.mockResolvedValue({
        from: mockFrom
      } as unknown as SupabaseClient<Database>);

      const result = await characterService.getCharacters('project-123', 'user-123');
      expect(result).toEqual(mockCharacters);
      expect(mockFrom).toHaveBeenCalledWith('characters');
    });

    it('should throw error if project ownership verification fails', async () => {
      mockVerifyProjectOwnership.mockResolvedValueOnce({ 
        project: null,
        error: { message: 'Not authorized' },
        status: 403
      });
      
      await expect(characterService.getCharacters('project-123', 'user-123'))
        .rejects.toThrow('Not authorized');
    });
  });

  describe('createCharacter', () => {
    it('should create a new character with valid data', async () => {
      mockVerifyProjectOwnership.mockResolvedValueOnce({ 
        project: { id: 'project-123' },
        error: null,
        status: 200
      });
      
      const mockCharacter = { id: '1', name: 'New Character' };
      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({ 
            data: mockCharacter, 
            error: null 
          })
        })
      });
      
      mockCreateClient.mockResolvedValue({
        from: mockFrom
      } as unknown as SupabaseClient<Database>);

      const result = await characterService.createCharacter(
        'project-123', 
        'user-123', 
        { name: 'New Character' }
      );
      
      expect(result).toEqual(mockCharacter);
    });
  });
});
