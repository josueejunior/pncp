-- ============================================================
-- PNCP Intel — Schema PostgreSQL
-- ============================================================

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Órgãos ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orgaos (
  cnpj           TEXT PRIMARY KEY,
  nome           TEXT NOT NULL,
  esfera_id      CHAR(1),           -- F=Federal, E=Estadual, M=Municipal
  poder_id       CHAR(1),           -- E=Executivo, L=Legislativo, J=Judiciário
  uf             CHAR(2),
  municipio_nome TEXT,
  criado_em      TIMESTAMPTZ DEFAULT now()
);

-- ── Editais ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS editais (
  numero_controle_pncp  TEXT PRIMARY KEY,
  orgao_cnpj            TEXT REFERENCES orgaos(cnpj),
  ano                   SMALLINT NOT NULL,
  numero_sequencial     INT      NOT NULL,
  modalidade_nome       TEXT,
  situacao_nome         TEXT,
  tipo_nome             TEXT,
  objeto_compra         TEXT,
  data_publicacao       TIMESTAMPTZ,
  data_fim_vigencia     TIMESTAMPTZ,
  tem_resultado         BOOLEAN  DEFAULT FALSE,
  cancelado             BOOLEAN  DEFAULT FALSE,
  valor_global          NUMERIC(15,2),
  orcamento_sigiloso    BOOLEAN  DEFAULT FALSE,
  status_coleta         TEXT     DEFAULT 'pendente',  -- pendente|coletando|completo|erro
  coletado_em           TIMESTAMPTZ DEFAULT now(),
  atualizado_em         TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_editais_orgao       ON editais(orgao_cnpj);
CREATE INDEX idx_editais_fim         ON editais(data_fim_vigencia) WHERE cancelado = FALSE;
CREATE INDEX idx_editais_status      ON editais(status_coleta);
CREATE INDEX idx_editais_resultado   ON editais(tem_resultado);

-- ── Itens ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS itens (
  id                      SERIAL PRIMARY KEY,
  numero_controle_pncp    TEXT REFERENCES editais,
  numero_item             SMALLINT,
  descricao_raw           TEXT,           -- campo original da API — nunca sobrescrever
  software_nome           TEXT,           -- preenchido pela IA
  fabricante              TEXT,
  tipo_licenca            TEXT,
  quantidade              NUMERIC(10,4),
  valor_unitario_estimado NUMERIC(15,2),
  valor_total             NUMERIC(15,2),
  orcamento_sigiloso      BOOLEAN DEFAULT FALSE,
  ncm_codigo              TEXT,
  situacao_nome           TEXT,
  tem_resultado           BOOLEAN DEFAULT FALSE,
  UNIQUE(numero_controle_pncp, numero_item)
);

-- ── Documentos ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documentos (
  id                    SERIAL PRIMARY KEY,
  numero_controle_pncp  TEXT REFERENCES editais,
  sequencial            INT,
  tipo                  TEXT,   -- "Edital", "Anexo", "Termo de Referência"
  titulo                TEXT,
  url_download          TEXT,
  status_processamento  TEXT DEFAULT 'pendente',  -- pendente|processando|concluido|erro
  processado_em         TIMESTAMPTZ,
  UNIQUE(numero_controle_pncp, sequencial)
);

-- ── Extração IA ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS extracao_ia (
  id                   SERIAL PRIMARY KEY,
  documento_id         INT REFERENCES documentos UNIQUE,
  modelo_ia            TEXT DEFAULT 'gemini-2.0-flash',
  software_nome        TEXT,
  fabricante           TEXT,
  tipo_licenca         TEXT,
  quantidade           NUMERIC(10,4),
  prazo_meses          SMALLINT,
  valor_estimado       NUMERIC(15,2),
  orcamento_sigiloso   BOOLEAN,
  marca_exigida        BOOLEAN,
  permite_equivalente  BOOLEAN,
  criterio_julgamento  TEXT,
  requisitos_tecnicos  TEXT[],
  orgao_uso            TEXT,
  resumo               TEXT,
  confianca            NUMERIC(3,2),  -- 0.00–1.00
  extraido_em          TIMESTAMPTZ DEFAULT now()
);

-- ── Resultados ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resultados (
  id                    SERIAL PRIMARY KEY,
  numero_controle_pncp  TEXT REFERENCES editais UNIQUE,
  fornecedor_cnpj       TEXT,
  fornecedor_nome       TEXT,
  valor_final           NUMERIC(15,2),
  data_resultado        TIMESTAMPTZ,
  coletado_em           TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_resultados_fornecedor ON resultados(fornecedor_cnpj);

-- ── Catálogo de Softwares ────────────────────────────────────
CREATE TABLE IF NOT EXISTS software_catalog (
  id               SERIAL PRIMARY KEY,
  nome_normalizado TEXT UNIQUE NOT NULL,
  fabricante       TEXT,
  categoria        TEXT,   -- CAD, GIS, ERP, Office, BI, Security...
  aliases          TEXT[]  -- variantes encontradas nos editais
);

-- ── Score de Oportunidade ────────────────────────────────────
CREATE TABLE IF NOT EXISTS scores (
  numero_controle_pncp TEXT PRIMARY KEY REFERENCES editais,
  score                SMALLINT NOT NULL CHECK (score BETWEEN 0 AND 100),
  score_prazo          SMALLINT,  -- 0-30 pts
  score_valor          SMALLINT,  -- 0-25 pts
  score_concorrencia   SMALLINT,  -- 0-20 pts
  score_esfera         SMALLINT,  -- 0-15 pts
  score_marca          SMALLINT,  -- 0-10 pts
  calculado_em         TIMESTAMPTZ DEFAULT now()
);

-- ── Demanda Diária (pré-computada para dashboard) ────────────
CREATE TABLE IF NOT EXISTS demanda_diaria (
  data             DATE         NOT NULL,
  software_nome    TEXT         NOT NULL,
  editais_abertos  INT          DEFAULT 0,
  valor_total      NUMERIC(15,2) DEFAULT 0,
  PRIMARY KEY(data, software_nome)
);
