-- ─────────────────────────────────────────────────────────────────────────
-- Índices de rendimiento — Auditoría 2026-08-14 (LOTE 1)
--
-- ESTADO: YA APLICADOS en la base de datos de producción (Neon). Este archivo
-- queda como DOCUMENTACIÓN/migración de referencia; es idempotente
-- (IF NOT EXISTS), así que volver a correrlo no rompe nada.
--
-- Verificado el 2026-08-14 con pg_indexes:
--   eternime_memories       → idx_memories_user_source   (user_id, source)
--   eternime_letters        → idx_letters_user           (user_id)
--   eternime_files          → idx_files_user             (user_id)
--   eternime_guide_messages → idx_guide_msgs_user        (user_id)
--   eternime_memory_heirs   → mh_benef_idx               (beneficiary_id)
--   eternime_users          → eternime_users_email_key   UNIQUE (email)
-- ─────────────────────────────────────────────────────────────────────────

-- Acelera countConversationMemories y listMemories (filtra por user_id/source).
CREATE INDEX IF NOT EXISTS idx_memories_user_source
  ON eternime_memories (user_id, source);

-- Listado/filtrado de cartas por usuario.
CREATE INDEX IF NOT EXISTS idx_letters_user
  ON eternime_letters (user_id);

-- Bóveda: listado de archivos por usuario.
CREATE INDEX IF NOT EXISTS idx_files_user
  ON eternime_files (user_id);

-- Historial de la guía por usuario (orden por created_at).
CREATE INDEX IF NOT EXISTS idx_guide_msgs_user
  ON eternime_guide_messages (user_id, created_at);

-- Asignación de recuerdos a herederos: búsqueda por beneficiario y por usuario.
CREATE INDEX IF NOT EXISTS mh_benef_idx
  ON eternime_memory_heirs (beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_memory_heirs_user
  ON eternime_memory_heirs (user_id);

-- Herederos por usuario.
CREATE INDEX IF NOT EXISTS idx_beneficiaries_user
  ON eternime_beneficiaries (user_id);

-- Unicidad de email para el upsert/búsqueda (ya existe como eternime_users_email_key).
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_uq
  ON eternime_users (email);
