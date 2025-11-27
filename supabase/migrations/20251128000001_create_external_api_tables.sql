-- Migration: Crear tablas para API Externa
-- Fecha: 2025-11-28
-- Descripción: Tablas necesarias para API keys y webhooks

-- Tabla para API keys
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  permissions JSONB NOT NULL DEFAULT '[]',
  rate_limit JSONB NOT NULL DEFAULT '{"requests": 1000, "period": 3600}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,

  -- Índices para performance
  INDEX idx_api_keys_user_id (user_id),
  INDEX idx_api_keys_active (is_active),
  INDEX idx_api_keys_hash (key_hash)
);

-- Tabla para webhooks
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  secret TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  retry_policy JSONB NOT NULL DEFAULT '{"maxRetries": 3, "backoffMultiplier": 2}',
  filters JSONB,
  headers JSONB,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Índices para performance
  INDEX idx_webhooks_user_id (user_id),
  INDEX idx_webhooks_active (is_active),
  INDEX idx_webhooks_events (events)
);

-- Tabla para logs de webhooks (auditoría)
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  payload JSONB,
  response_status INTEGER,
  response_body TEXT,
  error_message TEXT,
  attempt INTEGER DEFAULT 1,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Índices para performance
  INDEX idx_webhook_logs_webhook_id (webhook_id),
  INDEX idx_webhook_logs_event (event),
  INDEX idx_webhook_logs_created_at (created_at)
);

-- Tabla para logs de API (auditoría)
CREATE TABLE IF NOT EXISTS api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time INTEGER, -- en ms
  ip_address INET,
  user_agent TEXT,
  request_body JSONB,
  response_body JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Índices para performance
  INDEX idx_api_logs_api_key_id (api_key_id),
  INDEX idx_api_logs_user_id (user_id),
  INDEX idx_api_logs_method (method),
  INDEX idx_api_logs_path (path),
  INDEX idx_api_logs_created_at (created_at)
);

-- Políticas RLS para api_keys
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own API keys" ON api_keys
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own API keys" ON api_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys" ON api_keys
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys" ON api_keys
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para webhooks
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own webhooks" ON webhooks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own webhooks" ON webhooks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own webhooks" ON webhooks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own webhooks" ON webhooks
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para webhook_logs
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view logs for their webhooks" ON webhook_logs
  FOR SELECT USING (
    webhook_id IN (
      SELECT id FROM webhooks WHERE user_id = auth.uid()
    )
  );

-- Políticas RLS para api_logs
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own API logs" ON api_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Función para validar permisos de API key
CREATE OR REPLACE FUNCTION validate_api_key_permissions(
  p_api_key_hash TEXT,
  p_resource TEXT,
  p_action TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_permissions JSONB;
  v_found BOOLEAN := FALSE;
BEGIN
  -- Obtener permisos de la API key
  SELECT permissions INTO v_permissions
  FROM api_keys
  WHERE key_hash = p_api_key_hash
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW());

  IF v_permissions IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Verificar si el permiso existe
  FOR i IN 0..jsonb_array_length(v_permissions) - 1 LOOP
    IF (v_permissions->i->>'resource' = p_resource) THEN
      IF (v_permissions->i->'actions') ? p_action THEN
        v_found := TRUE;
        EXIT;
      END IF;
    END IF;
  END LOOP;

  RETURN v_found;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para log de API requests
CREATE OR REPLACE FUNCTION log_api_request(
  p_api_key_id UUID,
  p_user_id UUID,
  p_method TEXT,
  p_path TEXT,
  p_status_code INTEGER,
  p_response_time INTEGER,
  p_ip_address INET,
  p_user_agent TEXT,
  p_request_body JSONB DEFAULT NULL,
  p_response_body JSONB DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO api_logs (
    api_key_id,
    user_id,
    method,
    path,
    status_code,
    response_time,
    ip_address,
    user_agent,
    request_body,
    response_body,
    error_message
  ) VALUES (
    p_api_key_id,
    p_user_id,
    p_method,
    p_path,
    p_status_code,
    p_response_time,
    p_ip_address,
    p_user_agent,
    p_request_body,
    p_response_body,
    p_error_message
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para log de webhooks
CREATE OR REPLACE FUNCTION log_webhook_delivery(
  p_webhook_id UUID,
  p_event TEXT,
  p_payload JSONB,
  p_response_status INTEGER,
  p_response_body TEXT,
  p_error_message TEXT,
  p_attempt INTEGER,
  p_delivered_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO webhook_logs (
    webhook_id,
    event,
    payload,
    response_status,
    response_body,
    error_message,
    attempt,
    delivered_at
  ) VALUES (
    p_webhook_id,
    p_event,
    p_payload,
    p_response_status,
    p_response_body,
    p_error_message,
    p_attempt,
    p_delivered_at
  ) RETURURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para actualizar updated_at en webhooks
CREATE OR REPLACE FUNCTION update_webhook_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER webhook_updated_at_trigger
  BEFORE UPDATE ON webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_webhook_updated_at();

-- Comentarios en las tablas
COMMENT ON TABLE api_keys IS 'API keys para acceso a la API externa';
COMMENT ON TABLE webhooks IS 'Configuraciones de webhooks para notificaciones';
COMMENT ON TABLE webhook_logs IS 'Logs de entregas de webhooks';
COMMENT ON TABLE api_logs IS 'Logs de requests a la API externa';

COMMENT ON COLUMN api_keys.key_hash IS 'Hash SHA-256 de la API key';
COMMENT ON COLUMN api_keys.permissions IS 'Permisos de la API key en formato JSON';
COMMENT ON COLUMN api_keys.rate_limit IS 'Límite de rate en formato JSON';
COMMENT ON COLUMN webhooks.events IS 'Array de eventos que trigger el webhook';
COMMENT ON COLUMN webhooks.secret IS 'Secret para firmar payloads de webhooks';
COMMENT ON COLUMN webhooks.retry_policy IS 'Política de reintentos en formato JSON';
