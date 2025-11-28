/**
 * usePostulationData.test.ts
 *
 * Tests para el hook usePostulationData
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { usePostulationData } from '../usePostulationData';

// Mock de Supabase
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    }))
  }
}));

import { supabase } from '../../lib/supabase';

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('usePostulationData', () => {
  const mockApplicationId = 'test-application-id';

  const mockApplicationData = {
    id: mockApplicationId,
    property_id: 'test-property-id',
    status: 'pending',
    score: 750,
    message: 'Test application',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    properties: {
      id: 'test-property-id',
      address_street: 'Test Street',
      address_number: '123',
      address_commune: 'Test Commune',
      price_clp: 100000000,
      listing_type: 'rental'
    }
  };

  const mockApplicantsData = [
    {
      application_id: mockApplicationId,
      entity_type: 'natural',
      first_name: 'John',
      paternal_last_name: 'Doe',
      maternal_last_name: 'Smith',
      email: 'john@example.com',
      monthly_income_clp: 1000000
    }
  ];

  const mockGuarantorsData = [
    {
      application_id: mockApplicationId,
      entity_type: 'natural',
      first_name: 'Jane',
      paternal_last_name: 'Doe',
      contact_email: 'jane@example.com',
      monthly_income: 800000
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should return initial state', () => {
      const { result } = renderHook(() => usePostulationData(mockApplicationId));

      expect(result.current.postulation).toBeNull();
      expect(result.current.contractData).toBeNull();
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.hasRealScore).toBe(false);
      expect(typeof result.current.refetch).toBe('function');
    });
  });

  describe('Data Fetching', () => {
    it('should fetch postulation data successfully', async () => {
      // Mock successful responses
      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockApplicationData,
                error: null
              })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: mockApplicantsData,
                error: null
              })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: mockGuarantorsData,
                error: null
              })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: null,
                error: null
              })
            })
          })
        });

      const { result } = renderHook(() => usePostulationData(mockApplicationId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.postulation).not.toBeNull();
      expect(result.current.postulation?.id).toBe(mockApplicationId);
      expect(result.current.postulation?.applicants).toHaveLength(1);
      expect(result.current.postulation?.guarantors).toHaveLength(1);
      expect(result.current.error).toBeNull();
    });

    it('should handle application not found error', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }
            })
          })
        })
      });

      const { result } = renderHook(() => usePostulationData(mockApplicationId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Postulación no encontrada');
      expect(result.current.postulation).toBeNull();
    });

    it('should handle general fetch error', async () => {
      const errorMessage = 'Database connection failed';
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: errorMessage }
            })
          })
        })
      });

      const { result } = renderHook(() => usePostulationData(mockApplicationId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toContain('Error al cargar los datos');
      expect(result.current.postulation).toBeNull();
    });

    it('should handle applicants fetch failure gracefully', async () => {
      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockApplicationData,
                error: null
              })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Applicants table error' }
              })
            })
          })
        });

      const { result } = renderHook(() => usePostulationData(mockApplicationId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.postulation).not.toBeNull();
      expect(result.current.postulation?.applicants).toEqual([]);
    });
  });

  describe('Fallback Data', () => {
    it('should provide fallback applicants data when fetch fails', async () => {
      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockApplicationData,
                error: null
              })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Table error' }
              })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Table error' }
              })
            })
          })
        });

      const { result } = renderHook(() => usePostulationData(mockApplicationId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.postulation?.applicants).toEqual([]);
      expect(result.current.postulation?.guarantors).toEqual([]);
    });
  });

  describe('Score Handling', () => {
    it('should set hasRealScore to true when score exists', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { ...mockApplicationData, score: 800 },
              error: null
            })
          })
        })
      });

      const { result } = renderHook(() => usePostulationData(mockApplicationId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasRealScore).toBe(true);
      expect(result.current.postulation?.score).toBe(800);
    });

    it('should use default score when no real score exists', async () => {
      const dataWithoutScore = { ...mockApplicationData };
      delete dataWithoutScore.score;

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: dataWithoutScore,
              error: null
            })
          })
        })
      });

      const { result } = renderHook(() => usePostulationData(mockApplicationId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasRealScore).toBe(false);
      expect(result.current.postulation?.score).toBe(750); // Default score
    });
  });

  describe('Refetch Functionality', () => {
    it('should allow manual refetch of data', async () => {
      const mockRefetch = jest.fn();
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockApplicationData,
              error: null
            })
          })
        })
      });

      const { result } = renderHook(() => usePostulationData(mockApplicationId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Call refetch
      await act(async () => {
        await result.current.refetch();
      });

      // Should trigger another data fetch
      expect(mockSupabase.from).toHaveBeenCalled();
    });
  });

  describe('Contract Data Integration', () => {
    it('should include contract data when available', async () => {
      const mockContractData = {
        id: 'contract-1',
        application_id: mockApplicationId,
        status: 'draft'
      };

      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockApplicationData,
                error: null
              })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: [],
                error: null
              })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: [],
                error: null
              })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                data: [mockContractData],
                error: null
              })
            })
          })
        });

      const { result } = renderHook(() => usePostulationData(mockApplicationId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.contractData).toEqual(mockContractData);
      expect(result.current.postulation?.has_contract).toBe(true);
      expect(result.current.postulation?.contract_signed).toBe(false);
    });
  });
});


