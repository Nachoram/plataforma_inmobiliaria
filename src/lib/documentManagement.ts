import { supabase } from './supabase';

export interface PropertyDocument {
  id: string;
  property_id: string;
  document_type: string;
  document_label: string;
  file_path: string;
  file_name: string;
  original_file_name: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  uploaded_at: string;
  status: 'uploaded' | 'verified' | 'rejected';
}

export interface ApplicationDocument {
  id: string;
  application_id: string;
  document_type: string;
  document_label: string;
  file_path: string;
  file_name: string;
  original_file_name: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  uploaded_at: string;
  status: 'uploaded' | 'verified' | 'rejected';
}

/**
 * Get all documents for a property
 */
export const getPropertyDocuments = async (propertyId: string): Promise<PropertyDocument[]> => {
  const { data, error } = await supabase
    .from('property_documents')
    .select('*')
    .eq('property_id', propertyId)
    .order('uploaded_at', { ascending: false });

  if (error) {
    console.error('Error fetching property documents:', error);
    throw error;
  }

  return data || [];
};

/**
 * Get all documents for an application
 */
export const getApplicationDocuments = async (applicationId: string): Promise<ApplicationDocument[]> => {
  const { data, error } = await supabase
    .from('application_documents')
    .select('*')
    .eq('application_id', applicationId)
    .order('uploaded_at', { ascending: false });

  if (error) {
    console.error('Error fetching application documents:', error);
    throw error;
  }

  return data || [];
};

/**
 * Upload a document for a property
 */
export const uploadPropertyDocument = async (
  propertyId: string,
  file: File,
  documentType: string,
  documentLabel: string
): Promise<PropertyDocument> => {
  try {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('User not authenticated');

    // Create a unique file path
    // property-documents/{property_id}/{document_type}/{timestamp}_{filename}
    const fileExt = file.name.split('.').pop();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const timestamp = new Date().getTime();
    const fileName = `${timestamp}_${cleanFileName}`;
    const filePath = `property-documents/${propertyId}/${documentType}/${fileName}`;

    // Upload to Storage
    const { error: uploadError } = await supabase.storage
      .from('user-documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Save to Database
    const { data, error: dbError } = await supabase
      .from('property_documents')
      .insert({
        property_id: propertyId,
        document_type: documentType,
        document_label: documentLabel,
        file_path: filePath,
        file_name: fileName,
        original_file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: user.id,
        status: 'uploaded'
      })
      .select()
      .single();

    if (dbError) {
      // Cleanup storage if DB insert fails
      await supabase.storage.from('user-documents').remove([filePath]);
      throw dbError;
    }

    return data;
  } catch (error) {
    console.error('Error uploading property document:', error);
    throw error;
  }
};

/**
 * Upload a document for an application
 */
export const uploadApplicationDocument = async (
  applicationId: string,
  file: File,
  documentType: string,
  documentLabel: string
): Promise<ApplicationDocument> => {
  try {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('User not authenticated');

    // Create a unique file path
    // application-documents/{application_id}/{document_type}/{timestamp}_{filename}
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const timestamp = new Date().getTime();
    const fileName = `${timestamp}_${cleanFileName}`;
    const filePath = `application-documents/${applicationId}/${documentType}/${fileName}`;

    // Upload to Storage
    const { error: uploadError } = await supabase.storage
      .from('user-documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Save to Database
    const { data, error: dbError } = await supabase
      .from('application_documents')
      .insert({
        application_id: applicationId,
        document_type: documentType,
        document_label: documentLabel,
        file_path: filePath,
        file_name: fileName,
        original_file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: user.id,
        status: 'uploaded'
      })
      .select()
      .single();

    if (dbError) {
      // Cleanup storage if DB insert fails
      await supabase.storage.from('user-documents').remove([filePath]);
      throw dbError;
    }

    return data;
  } catch (error) {
    console.error('Error uploading application document:', error);
    throw error;
  }
};

/**
 * Delete a property document
 */
export const deletePropertyDocument = async (documentId: string): Promise<void> => {
  try {
    // Get document info first to get file path
    const { data: doc, error: fetchError } = await supabase
      .from('property_documents')
      .select('file_path')
      .eq('id', documentId)
      .single();

    if (fetchError) throw fetchError;
    if (!doc) throw new Error('Document not found');

    // Delete from Storage
    const { error: storageError } = await supabase.storage
      .from('user-documents')
      .remove([doc.file_path]);

    if (storageError) {
      console.warn('Error deleting file from storage (continuing to delete record):', storageError);
    }

    // Delete from Database
    const { error: dbError } = await supabase
      .from('property_documents')
      .delete()
      .eq('id', documentId);

    if (dbError) throw dbError;

  } catch (error) {
    console.error('Error deleting property document:', error);
    throw error;
  }
};

/**
 * Delete an application document
 */
export const deleteApplicationDocument = async (documentId: string): Promise<void> => {
  try {
    // Get document info first
    const { data: doc, error: fetchError } = await supabase
      .from('application_documents')
      .select('file_path')
      .eq('id', documentId)
      .single();

    if (fetchError) throw fetchError;
    if (!doc) throw new Error('Document not found');

    // Delete from Storage
    const { error: storageError } = await supabase.storage
      .from('user-documents')
      .remove([doc.file_path]);

    if (storageError) {
      console.warn('Error deleting file from storage (continuing to delete record):', storageError);
    }

    // Delete from Database
    const { error: dbError } = await supabase
      .from('application_documents')
      .delete()
      .eq('id', documentId);

    if (dbError) throw dbError;

  } catch (error) {
    console.error('Error deleting application document:', error);
    throw error;
  }
};


