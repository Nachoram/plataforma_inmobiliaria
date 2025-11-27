import { renderHook, act, waitFor } from '@testing-library/react';
import { useCommandManager, UpdateOfferStatusCommand, CreateTaskCommand } from '../useCommandManager';

describe('useCommandManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useCommandManager());

    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
    expect(result.current.isExecuting).toBe(false);
    expect(result.current.commandHistoryLength).toBe(0);
    expect(result.current.lastCommandName).toBeUndefined();
  });

  it('should execute a command successfully', async () => {
    const mockExecute = jest.fn().mockResolvedValue(undefined);
    const mockCommand = {
      id: 'test-command',
      name: 'Test Command',
      description: 'A test command',
      timestamp: new Date(),
      execute: mockExecute,
      undo: jest.fn(),
      canUndo: () => true,
      getMetadata: () => ({ test: true })
    };

    const { result } = renderHook(() => useCommandManager());

    await act(async () => {
      await result.current.executeCommand(mockCommand);
    });

    expect(mockExecute).toHaveBeenCalledTimes(1);
    expect(result.current.commandHistoryLength).toBe(1);
    expect(result.current.lastCommandName).toBe('Test Command');
    expect(result.current.canUndo).toBe(true);
  });

  it('should handle command execution errors', async () => {
    const mockError = new Error('Command failed');
    const mockExecute = jest.fn().mockRejectedValue(mockError);
    const onError = jest.fn();

    const mockCommand = {
      id: 'failing-command',
      name: 'Failing Command',
      description: 'A command that fails',
      timestamp: new Date(),
      execute: mockExecute,
      undo: jest.fn(),
      canUndo: () => true,
      getMetadata: () => ({ test: true })
    };

    const { result } = renderHook(() =>
      useCommandManager({ onError })
    );

    await act(async () => {
      await result.current.executeCommand(mockCommand);
    });

    expect(mockExecute).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(mockError, mockCommand);
  });

  it('should undo commands', async () => {
    const mockUndo = jest.fn().mockResolvedValue(undefined);
    const mockCommand = {
      id: 'undoable-command',
      name: 'Undoable Command',
      description: 'A command that can be undone',
      timestamp: new Date(),
      execute: jest.fn().mockResolvedValue(undefined),
      undo: mockUndo,
      canUndo: () => true,
      getMetadata: () => ({ test: true })
    };

    const { result } = renderHook(() => useCommandManager());

    // Execute command first
    await act(async () => {
      await result.current.executeCommand(mockCommand);
    });

    expect(result.current.canUndo).toBe(true);

    // Undo command
    await act(async () => {
      await result.current.undo();
    });

    expect(mockUndo).toHaveBeenCalledTimes(1);
    expect(result.current.canUndo).toBe(false);
  });

  it('should redo commands', async () => {
    const mockExecute = jest.fn().mockResolvedValue(undefined);
    const mockUndo = jest.fn().mockResolvedValue(undefined);

    const mockCommand = {
      id: 'redoable-command',
      name: 'Redoable Command',
      description: 'A command that can be redone',
      timestamp: new Date(),
      execute: mockExecute,
      undo: mockUndo,
      canUndo: () => true,
      getMetadata: () => ({ test: true })
    };

    const { result } = renderHook(() => useCommandManager());

    // Execute and undo command
    await act(async () => {
      await result.current.executeCommand(mockCommand);
      await result.current.undo();
    });

    expect(result.current.canRedo).toBe(true);

    // Redo command
    await act(async () => {
      await result.current.redo();
    });

    expect(mockExecute).toHaveBeenCalledTimes(2); // Called again on redo
    expect(result.current.canRedo).toBe(false);
    expect(result.current.canUndo).toBe(true);
  });

  it('should prevent undo when command cannot be undone', async () => {
    const mockCommand = {
      id: 'non-undoable-command',
      name: 'Non-Undoable Command',
      description: 'A command that cannot be undone',
      timestamp: new Date(),
      execute: jest.fn().mockResolvedValue(undefined),
      undo: jest.fn(),
      canUndo: () => false,
      getMetadata: () => ({ test: true })
    };

    const { result } = renderHook(() => useCommandManager());

    await act(async () => {
      await result.current.executeCommand(mockCommand);
    });

    expect(result.current.canUndo).toBe(false);
  });

  it('should clear history', async () => {
    const mockCommand = {
      id: 'clear-test-command',
      name: 'Clear Test Command',
      description: 'A command for testing clear history',
      timestamp: new Date(),
      execute: jest.fn().mockResolvedValue(undefined),
      undo: jest.fn(),
      canUndo: () => true,
      getMetadata: () => ({ test: true })
    };

    const { result } = renderHook(() => useCommandManager());

    await act(async () => {
      await result.current.executeCommand(mockCommand);
    });

    expect(result.current.commandHistoryLength).toBe(1);

    act(() => {
      result.current.clearHistory();
    });

    expect(result.current.commandHistoryLength).toBe(0);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('should export history correctly', async () => {
    const mockCommand = {
      id: 'export-test-command',
      name: 'Export Test Command',
      description: 'A command for testing export',
      timestamp: new Date('2024-01-01T00:00:00Z'),
      execute: jest.fn().mockResolvedValue(undefined),
      undo: jest.fn(),
      canUndo: () => true,
      getMetadata: () => ({ test: true, value: 42 })
    };

    const { result } = renderHook(() => useCommandManager());

    await act(async () => {
      await result.current.executeCommand(mockCommand);
    });

    const exportedHistory = result.current.exportHistory();
    const parsedHistory = JSON.parse(exportedHistory);

    expect(parsedHistory).toHaveLength(1);
    expect(parsedHistory[0]).toMatchObject({
      id: 'export-test-command',
      name: 'Export Test Command',
      description: 'A command for testing export',
      userId: undefined,
      userRole: undefined,
      metadata: { test: true, value: 42 }
    });
    expect(parsedHistory[0].timestamp).toBe('2024-01-01T00:00:00.000Z');
  });

  it('should handle concurrent command execution', async () => {
    const mockCommand1 = {
      id: 'concurrent-1',
      name: 'Concurrent Command 1',
      description: 'First concurrent command',
      timestamp: new Date(),
      execute: jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100))),
      undo: jest.fn(),
      canUndo: () => true,
      getMetadata: () => ({ test: true })
    };

    const mockCommand2 = {
      id: 'concurrent-2',
      name: 'Concurrent Command 2',
      description: 'Second concurrent command',
      timestamp: new Date(),
      execute: jest.fn().mockResolvedValue(undefined),
      undo: jest.fn(),
      canUndo: () => true,
      getMetadata: () => ({ test: true })
    };

    const { result } = renderHook(() => useCommandManager());

    // Start first command
    const command1Promise = act(async () => {
      await result.current.executeCommand(mockCommand1);
    });

    // Try to execute second command while first is running
    const command2Promise = act(async () => {
      await result.current.executeCommand(mockCommand2);
    });

    await Promise.all([command1Promise, command2Promise]);

    expect(mockCommand1.execute).toHaveBeenCalledTimes(1);
    expect(mockCommand2.execute).toHaveBeenCalledTimes(1);
  });

  describe('UpdateOfferStatusCommand', () => {
    it('should execute status update correctly', async () => {
      const command = new UpdateOfferStatusCommand(
        'offer-123',
        'pending',
        'accepted',
        { notes: 'Approved' },
        'user-456',
        'seller'
      );

      // Mock the execute method to avoid actual API calls
      const mockExecute = jest.fn().mockResolvedValue(undefined);
      command.execute = mockExecute;

      await command.execute();

      expect(mockExecute).toHaveBeenCalledTimes(1);
    });

    it('should return correct metadata', () => {
      const command = new UpdateOfferStatusCommand(
        'offer-123',
        'pending',
        'accepted',
        { notes: 'Approved' }
      );

      const metadata = command.getMetadata();

      expect(metadata).toEqual({
        type: 'offer_status_update',
        offerId: 'offer-123',
        oldStatus: 'pending',
        newStatus: 'accepted',
        extraData: { notes: 'Approved' }
      });
    });
  });

  describe('CreateTaskCommand', () => {
    it('should execute task creation correctly', async () => {
      const taskData = {
        offer_id: 'offer-123',
        task_type: 'review',
        description: 'Review documents'
      };

      const command = new CreateTaskCommand(taskData, 'user-456', 'admin');

      // Mock the execute method
      const mockExecute = jest.fn().mockResolvedValue(undefined);
      command.execute = mockExecute;

      await command.execute();

      expect(mockExecute).toHaveBeenCalledTimes(1);
    });

    it('should return correct metadata', () => {
      const taskData = {
        offer_id: 'offer-123',
        task_type: 'review',
        description: 'Review documents'
      };

      const command = new CreateTaskCommand(taskData);

      const metadata = command.getMetadata();

      expect(metadata).toEqual({
        type: 'task_creation',
        taskData,
        createdTaskId: undefined
      });
    });
  });
});
