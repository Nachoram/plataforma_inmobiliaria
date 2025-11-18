import { supabase } from './supabase';
import {
  OfferTask,
  OfferDocument,
  OfferTimeline,
  OfferFormalRequest,
  OfferCommunication,
  TaskFormData,
  DocumentRequestFormData,
  FormalRequestFormData,
  CommunicationFormData,
  TimelineEventData
} from '../components/sales/types';

// ========================================================================
// TASK MANAGEMENT FUNCTIONS
// ========================================================================

export const createOfferTask = async (
  offerId: string,
  taskData: TaskFormData,
  userId: string
): Promise<OfferTask> => {
  const { data, error } = await supabase
    .from('offer_tasks')
    .insert({
      offer_id: offerId,
      task_type: taskData.task_type,
      description: taskData.description,
      priority: taskData.priority,
      assigned_to: taskData.assigned_to || null,
      assigned_by: userId,
      due_date: taskData.due_date || null
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateOfferTask = async (
  taskId: string,
  updates: Partial<OfferTask>
): Promise<OfferTask> => {
  const { data, error } = await supabase
    .from('offer_tasks')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteOfferTask = async (taskId: string): Promise<void> => {
  const { error } = await supabase
    .from('offer_tasks')
    .delete()
    .eq('id', taskId);

  if (error) throw error;
};

export const getOfferTasks = async (offerId: string): Promise<OfferTask[]> => {
  const { data, error } = await supabase
    .from('offer_tasks')
    .select('*')
    .eq('offer_id', offerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// ========================================================================
// DOCUMENT MANAGEMENT FUNCTIONS
// ========================================================================

export const createDocumentRequest = async (
  offerId: string,
  documentData: DocumentRequestFormData,
  userId: string
): Promise<OfferDocument> => {
  const { data, error } = await supabase
    .from('offer_documents')
    .insert({
      offer_id: offerId,
      document_name: documentData.document_name,
      document_type: documentData.document_type,
      status: 'pendiente',
      is_required: documentData.is_required,
      notes: documentData.description,
      requested_by: userId
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const uploadOfferDocument = async (
  offerId: string,
  file: File,
  documentType: OfferDocument['document_type'],
  userId: string
): Promise<OfferDocument> => {
  // Subir archivo a Supabase Storage
  const fileExt = file.name.split('.').pop();
  const fileName = `${offerId}/${Date.now()}.${fileExt}`;
  const filePath = `offer-documents/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  // Obtener URL pública
  const { data: urlData } = supabase.storage
    .from('documents')
    .getPublicUrl(filePath);

  if (!urlData.publicUrl) throw new Error('No se pudo obtener la URL del archivo');

  // Crear registro en la base de datos
  const { data, error } = await supabase
    .from('offer_documents')
    .insert({
      offer_id: offerId,
      document_name: file.name,
      document_type: documentType,
      file_url: urlData.publicUrl,
      file_size: file.size,
      file_type: file.type,
      status: 'recibido'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const validateOfferDocument = async (
  documentId: string,
  isValid: boolean,
  notes: string | null,
  userId: string
): Promise<OfferDocument> => {
  const { data, error } = await supabase
    .from('offer_documents')
    .update({
      status: isValid ? 'validado' : 'rechazado',
      validated_by: userId,
      validated_at: new Date().toISOString(),
      notes: notes,
      updated_at: new Date().toISOString()
    })
    .eq('id', documentId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteOfferDocument = async (documentId: string): Promise<void> => {
  const { error } = await supabase
    .from('offer_documents')
    .delete()
    .eq('id', documentId);

  if (error) throw error;
};

export const getOfferDocuments = async (offerId: string): Promise<OfferDocument[]> => {
  const { data, error } = await supabase
    .from('offer_documents')
    .select('*')
    .eq('offer_id', offerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// ========================================================================
// TIMELINE FUNCTIONS
// ========================================================================

export const addTimelineEvent = async (
  offerId: string,
  eventData: TimelineEventData,
  userId: string,
  userRole: string
): Promise<OfferTimeline> => {
  const { data, error } = await supabase
    .from('offer_timeline')
    .insert({
      offer_id: offerId,
      event_type: eventData.event_type,
      event_title: eventData.event_title,
      event_description: eventData.event_description,
      triggered_by: userId,
      triggered_by_role: userRole,
      related_data: eventData.related_data
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getOfferTimeline = async (offerId: string): Promise<OfferTimeline[]> => {
  const { data, error } = await supabase
    .from('offer_timeline')
    .select('*')
    .eq('offer_id', offerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// ========================================================================
// FORMAL REQUESTS FUNCTIONS
// ========================================================================

export const createFormalRequest = async (
  offerId: string,
  requestData: FormalRequestFormData,
  userId: string,
  userRole: string
): Promise<OfferFormalRequest> => {
  const { data, error } = await supabase
    .from('offer_formal_requests')
    .insert({
      offer_id: offerId,
      request_type: requestData.request_type,
      request_title: requestData.request_title,
      request_description: requestData.request_description,
      required_documents: requestData.required_documents,
      requested_by: userId,
      requested_to: userRole === 'seller' ? null : null, // TODO: Determinar el destinatario apropiado
      due_date: requestData.due_date || null
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateFormalRequestStatus = async (
  requestId: string,
  newStatus: OfferFormalRequest['status'],
  responseData?: {
    response_text: string;
    response_documents?: string[];
  }
): Promise<OfferFormalRequest> => {
  const updateData: any = {
    status: newStatus,
    updated_at: new Date().toISOString()
  };

  if (responseData) {
    updateData.response_text = responseData.response_text;
    updateData.response_documents = responseData.response_documents;
    updateData.responded_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('offer_formal_requests')
    .update(updateData)
    .eq('id', requestId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getOfferFormalRequests = async (offerId: string): Promise<OfferFormalRequest[]> => {
  const { data, error } = await supabase
    .from('offer_formal_requests')
    .select('*')
    .eq('offer_id', offerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// ========================================================================
// COMMUNICATION FUNCTIONS
// ========================================================================

export const sendOfferMessage = async (
  offerId: string,
  messageData: CommunicationFormData,
  userId: string,
  userRole: string
): Promise<OfferCommunication> => {
  const { data, error } = await supabase
    .from('offer_communications')
    .insert({
      offer_id: offerId,
      message: messageData.message,
      message_type: messageData.message_type,
      author_id: userId,
      author_role: userRole,
      is_private: messageData.is_private || false,
      visible_to_buyer: !messageData.is_private,
      attachment_ids: messageData.attachment_ids
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateOfferMessage = async (
  messageId: string,
  updates: Partial<OfferCommunication>
): Promise<OfferCommunication> => {
  const { data, error } = await supabase
    .from('offer_communications')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', messageId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteOfferMessage = async (messageId: string): Promise<void> => {
  const { error } = await supabase
    .from('offer_communications')
    .delete()
    .eq('id', messageId);

  if (error) throw error;
};

export const getOfferCommunications = async (offerId: string): Promise<OfferCommunication[]> => {
  const { data, error } = await supabase
    .from('offer_communications')
    .select('*')
    .eq('offer_id', offerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// ========================================================================
// BULK OPERATIONS FOR INITIAL LOAD
// ========================================================================

export const getAllOfferData = async (offerId: string) => {
  const [offer, tasks, documents, timeline, formalRequests, communications] = await Promise.all([
    // Offer data (handled separately in main component)
    Promise.resolve(null),
    getOfferTasks(offerId),
    getOfferDocuments(offerId),
    getOfferTimeline(offerId),
    getOfferFormalRequests(offerId),
    getOfferCommunications(offerId)
  ]);

  return {
    tasks,
    documents,
    timeline,
    formalRequests,
    communications
  };
};
