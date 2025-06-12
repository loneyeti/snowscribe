import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSupabaseClient } from '../../tests/mocks/supabase';
import { createClient } from '../supabase/server';
import { verifyProjectOwnership } from '../supabase/guards';
import * as projectService from './projectService';
import * as chapterService from './chapterService';

vi.mock('../supabase/server');
vi.mock('../supabase/guards');
vi.mock('./chapterService');

const mockCreateClient = vi.mocked(createClient);
const mockVerifyProjectOwnership = vi.mocked(verifyProjectOwnership);
const mockGetChaptersWithScenes = vi.mocked(chapterService.getChaptersWithScenes);

describe('projectService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProjectById', () => {
    it('should return a project with word count on success', async () => {
      // Arrange
      const mockProject = { 
        id: 'proj-1', 
        user_id: 'user-1', 
        title: 'My Novel', 
        genres: null,
        word_count: 250
      };
      mockVerifyProjectOwnership.mockResolvedValue({ 
        project: { id: 'proj-1' }, 
        error: null, 
        status: 200 
      });
      
      const mockSupabase = createMockSupabaseClient(mockProject);
      mockCreateClient.mockResolvedValue(mockSupabase);

      // Act
      const result = await projectService.getProjectById('proj-1', 'user-1');

      // Assert
      expect(result).toEqual({
        id: 'proj-1',
        user_id: 'user-1',
        title: 'My Novel',
        genres: null,
        wordCount: 250
      });
      expect(mockVerifyProjectOwnership).toHaveBeenCalledWith(mockSupabase, 'proj-1', 'user-1');
    });

    it('should throw an error if ownership check fails', async () => {
      // Arrange
      mockVerifyProjectOwnership.mockResolvedValue({ 
        project: null, 
        error: { message: 'Access Denied' }, 
        status: 403 
      });

      // Act & Assert
      await expect(projectService.getProjectById('proj-1', 'user-1'))
        .rejects.toThrow('Access Denied');
    });

    it('should handle empty chapters', async () => {
      // Arrange
      const mockProject = { 
        id: 'proj-1', 
        user_id: 'user-1', 
        title: 'My Novel', 
        genres: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      };
      
      mockVerifyProjectOwnership.mockResolvedValue({ 
        project: { id: 'proj-1' }, 
        error: null, 
        status: 200 
      });
      
      const mockSupabase = createMockSupabaseClient(mockProject);
      mockCreateClient.mockResolvedValue(mockSupabase);
      mockGetChaptersWithScenes.mockResolvedValue([]);

      // Act
      const result = await projectService.getProjectById('proj-1', 'user-1');

      // Assert
      expect(result).toEqual({
        ...mockProject,
        wordCount: 0
      });
    });
  });
});
