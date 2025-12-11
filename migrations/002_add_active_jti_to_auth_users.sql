-- Adicionar coluna active_jti para rastrear token ativo do usuário
ALTER TABLE auth_users ADD COLUMN active_jti UUID DEFAULT NULL;
ALTER TABLE auth_users ADD COLUMN jti_expires_at TIMESTAMP DEFAULT NULL;

-- Índice para melhorar performance na busca por active_jti
CREATE INDEX idx_auth_users_active_jti ON auth_users(active_jti);
