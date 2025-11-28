import { useState, useCallback, useRef } from 'react';

// ========================================================================
// INTERFACES Y TIPOS
// ========================================================================

export interface Command {
  id: string;
  name: string;
  description: string;
  timestamp: Date;
  userId?: string;
  userRole?: string;

  execute(): Promise<void>;
  undo(): Promise<void>;
  canUndo(): boolean;
  getMetadata(): Record<string, any>;
}

export interface CommandHistory {
  past: Command[];
  present: Command | null;
  future: Command[];
}

export interface UseCommandManagerOptions {
  maxHistorySize?: number;
  enableLogging?: boolean;
  onCommandExecuted?: (command: Command) => void;
  onCommandUndone?: (command: Command) => void;
  onError?: (error: Error, command?: Command) => void;
}

export interface UseCommandManagerReturn {
  // Estado
  canUndo: boolean;
  canRedo: boolean;
  history: CommandHistory;
  isExecuting: boolean;

  // Acciones
  executeCommand: (command: Command) => Promise<void>;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  clearHistory: () => void;

  // Utilidades
  getCommandHistory: () => Command[];
  getLastCommand: () => Command | null;
  exportHistory: () => string;
}

// ========================================================================
// CLASES DE COMANDOS CONCRETOS
// ========================================================================

export abstract class BaseCommand implements Command {
  public readonly id: string;
  public readonly name: string;
  public readonly description: string;
  public readonly timestamp: Date;
  public readonly userId?: string;
  public readonly userRole?: string;

  constructor(
    name: string,
    description: string,
    userId?: string,
    userRole?: string
  ) {
    this.id = `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.name = name;
    this.description = description;
    this.timestamp = new Date();
    this.userId = userId;
    this.userRole = userRole;
  }

  abstract execute(): Promise<void>;
  abstract undo(): Promise<void>;
  abstract canUndo(): boolean;
  abstract getMetadata(): Record<string, any>;
}

// Comando para actualizar estado de oferta
export class UpdateOfferStatusCommand extends BaseCommand {
  constructor(
    private offerId: string,
    private oldStatus: string,
    private newStatus: string,
    private extraData?: any,
    userId?: string,
    userRole?: string
  ) {
    super(
      'Actualizar Estado de Oferta',
      `Cambiar estado de oferta de "${oldStatus}" a "${newStatus}"`,
      userId,
      userRole
    );
  }

  async execute(): Promise<void> {
    // TODO: Implementar lógica real con Supabase
    console.log(`Ejecutando: Cambiar estado a ${this.newStatus}`, this.extraData);
    // await supabase.from('property_sale_offers').update({ status: this.newStatus }).eq('id', this.offerId);
  }

  async undo(): Promise<void> {
    // TODO: Implementar lógica real con Supabase
    console.log(`Deshaciendo: Cambiar estado a ${this.oldStatus}`);
    // await supabase.from('property_sale_offers').update({ status: this.oldStatus }).eq('id', this.offerId);
  }

  canUndo(): boolean {
    return true;
  }

  getMetadata(): Record<string, any> {
    return {
      type: 'offer_status_update',
      offerId: this.offerId,
      oldStatus: this.oldStatus,
      newStatus: this.newStatus,
      extraData: this.extraData
    };
  }
}

// Comando para crear tarea
export class CreateTaskCommand extends BaseCommand {
  private createdTaskId?: string;

  constructor(
    private taskData: any,
    userId?: string,
    userRole?: string
  ) {
    super(
      'Crear Tarea',
      `Crear nueva tarea: ${taskData.task_type}`,
      userId,
      userRole
    );
  }

  async execute(): Promise<void> {
    // TODO: Implementar lógica real con Supabase
    console.log('Ejecutando: Crear tarea', this.taskData);
    // const result = await supabase.from('offer_tasks').insert(this.taskData).select().single();
    // this.createdTaskId = result.data?.id;
  }

  async undo(): Promise<void> {
    if (this.createdTaskId) {
      // TODO: Implementar lógica real con Supabase
      console.log('Deshaciendo: Eliminar tarea', this.createdTaskId);
      // await supabase.from('offer_tasks').delete().eq('id', this.createdTaskId);
    }
  }

  canUndo(): boolean {
    return !!this.createdTaskId;
  }

  getMetadata(): Record<string, any> {
    return {
      type: 'task_creation',
      taskData: this.taskData,
      createdTaskId: this.createdTaskId
    };
  }
}

// Comando para actualizar documento
export class UpdateDocumentCommand extends BaseCommand {
  constructor(
    private documentId: string,
    private oldData: any,
    private newData: any,
    userId?: string,
    userRole?: string
  ) {
    super(
      'Actualizar Documento',
      `Actualizar documento: ${newData.document_name || documentId}`,
      userId,
      userRole
    );
  }

  async execute(): Promise<void> {
    // TODO: Implementar lógica real con Supabase
    console.log('Ejecutando: Actualizar documento', this.newData);
    // await supabase.from('offer_documents').update(this.newData).eq('id', this.documentId);
  }

  async undo(): Promise<void> {
    // TODO: Implementar lógica real con Supabase
    console.log('Deshaciendo: Revertir documento', this.oldData);
    // await supabase.from('offer_documents').update(this.oldData).eq('id', this.documentId);
  }

  canUndo(): boolean {
    return true;
  }

  getMetadata(): Record<string, any> {
    return {
      type: 'document_update',
      documentId: this.documentId,
      oldData: this.oldData,
      newData: this.newData
    };
  }
}

// Comando para enviar comunicación
export class SendCommunicationCommand extends BaseCommand {
  private sentMessageId?: string;

  constructor(
    private messageData: any,
    userId?: string,
    userRole?: string
  ) {
    super(
      'Enviar Comunicación',
      `Enviar mensaje: ${messageData.subject || 'Sin asunto'}`,
      userId,
      userRole
    );
  }

  async execute(): Promise<void> {
    // TODO: Implementar lógica real con Supabase
    console.log('Ejecutando: Enviar comunicación', this.messageData);
    // const result = await supabase.from('offer_communications').insert(this.messageData).select().single();
    // this.sentMessageId = result.data?.id;
  }

  async undo(): Promise<void> {
    if (this.sentMessageId) {
      // TODO: Implementar lógica real con Supabase
      console.log('Deshaciendo: Eliminar comunicación', this.sentMessageId);
      // await supabase.from('offer_communications').delete().eq('id', this.sentMessageId);
    }
  }

  canUndo(): boolean {
    return !!this.sentMessageId;
  }

  getMetadata(): Record<string, any> {
    return {
      type: 'communication_sent',
      messageData: this.messageData,
      sentMessageId: this.sentMessageId
    };
  }
}

// ========================================================================
// HOOK PRINCIPAL
// ========================================================================

export const useCommandManager = (options: UseCommandManagerOptions = {}): UseCommandManagerReturn => {
  const {
    maxHistorySize = 50,
    enableLogging = true,
    onCommandExecuted,
    onCommandUndone,
    onError
  } = options;

  const [history, setHistory] = useState<CommandHistory>({
    past: [],
    present: null,
    future: []
  });

  const [isExecuting, setIsExecuting] = useState(false);
  const executionRef = useRef<Promise<void> | null>(null);

  // Logging function
  const logCommand = useCallback((action: string, command: Command) => {
    if (!enableLogging) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      command: {
        id: command.id,
        name: command.name,
        description: command.description,
        userId: command.userId,
        userRole: command.userRole,
        metadata: command.getMetadata()
      }
    };

    console.log('📋 Command Log:', logEntry);

    // TODO: Enviar a servicio de logging/analytics
    // analytics.track('command_executed', logEntry);
  }, [enableLogging]);

  // Execute command
  const executeCommand = useCallback(async (command: Command) => {
    if (isExecuting) {
      console.warn('Command execution already in progress');
      return;
    }

    setIsExecuting(true);

    try {
      // Evitar ejecución concurrente
      if (executionRef.current) {
        await executionRef.current;
      }

      executionRef.current = command.execute();
      await executionRef.current;

      // Actualizar historial
      setHistory(prev => ({
        past: [...prev.past.slice(-maxHistorySize + 1), prev.present].filter(Boolean),
        present: command,
        future: []
      }));

      // Logging y callbacks
      logCommand('execute', command);
      onCommandExecuted?.(command);

    } catch (error) {
      console.error('Command execution failed:', error);
      onError?.(error as Error, command);
    } finally {
      setIsExecuting(false);
      executionRef.current = null;
    }
  }, [isExecuting, maxHistorySize, logCommand, onCommandExecuted, onError]);

  // Undo command
  const undo = useCallback(async () => {
    if (!history.present || !history.present.canUndo() || isExecuting) {
      return;
    }

    setIsExecuting(true);

    try {
      if (executionRef.current) {
        await executionRef.current;
      }

      executionRef.current = history.present.undo();
      await executionRef.current;

      // Actualizar historial
      setHistory(prev => ({
        past: prev.past.slice(0, -1),
        present: prev.past[prev.past.length - 1] || null,
        future: [prev.present, ...prev.future]
      }));

      // Logging y callbacks
      logCommand('undo', history.present);
      onCommandUndone?.(history.present);

    } catch (error) {
      console.error('Command undo failed:', error);
      onError?.(error as Error, history.present);
    } finally {
      setIsExecuting(false);
      executionRef.current = null;
    }
  }, [history.present, isExecuting, logCommand, onCommandUndone, onError]);

  // Redo command
  const redo = useCallback(async () => {
    if (!history.future.length || isExecuting) {
      return;
    }

    setIsExecuting(true);

    try {
      if (executionRef.current) {
        await executionRef.current;
      }

      const commandToRedo = history.future[0];
      executionRef.current = commandToRedo.execute();
      await executionRef.current;

      // Actualizar historial
      setHistory(prev => ({
        past: [...prev.past, prev.present].filter(Boolean),
        present: commandToRedo,
        future: prev.future.slice(1)
      }));

      // Logging y callbacks
      logCommand('redo', commandToRedo);
      onCommandExecuted?.(commandToRedo);

    } catch (error) {
      console.error('Command redo failed:', error);
      onError?.(error as Error, history.future[0]);
    } finally {
      setIsExecuting(false);
      executionRef.current = null;
    }
  }, [history.future, isExecuting, logCommand, onCommandExecuted, onError]);

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory({
      past: [],
      present: null,
      future: []
    });
  }, []);

  // Getters
  const getCommandHistory = useCallback(() => {
    return [...history.past, history.present, ...history.future].filter(Boolean) as Command[];
  }, [history]);

  const getLastCommand = useCallback(() => {
    return history.present;
  }, [history.present]);

  const exportHistory = useCallback(() => {
    const commands = getCommandHistory();
    return JSON.stringify(commands.map(cmd => ({
      id: cmd.id,
      name: cmd.name,
      description: cmd.description,
      timestamp: cmd.timestamp.toISOString(),
      userId: cmd.userId,
      userRole: cmd.userRole,
      metadata: cmd.getMetadata()
    })), null, 2);
  }, [getCommandHistory]);

  return {
    // Estado
    canUndo: !!history.present && history.present.canUndo() && !isExecuting,
    canRedo: history.future.length > 0 && !isExecuting,
    history,
    isExecuting,

    // Acciones
    executeCommand,
    undo,
    redo,
    clearHistory,

    // Utilidades
    getCommandHistory,
    getLastCommand,
    exportHistory
  };
};


