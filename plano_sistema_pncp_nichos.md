# Plano completo — Sistema de Inteligência PNCP para Software Público

> Documento de referência para desenvolvimento do sistema de monitoramento e prospecção de licitações de software no Portal Nacional de Contratações Públicas (PNCP). Cobre os 5 nichos priorizados, arquitetura do sistema, stack tecnológica, schema do banco, funil de vendas e roadmap de desenvolvimento.

---

## Sumário

1. [Contexto e oportunidade de mercado](#1-contexto-e-oportunidade-de-mercado)
2. [Arquitetura geral do sistema](#2-arquitetura-geral-do-sistema)
3. [APIs do PNCP — como usar cada endpoint](#3-apis-do-pncp--como-usar-cada-endpoint)
4. [Os 5 nichos priorizados](#4-os-5-nichos-priorizados)
   - [Nicho 1 — ERP / Gestão pública municipal](#nicho-1--erp--gestão-pública-municipal)
   - [Nicho 2 — GIS / Geoprocessamento municipal](#nicho-2--gis--geoprocessamento-municipal)
   - [Nicho 3 — Saúde pública — prontuário e gestão](#nicho-3--saúde-pública--prontuário-e-gestão)
   - [Nicho 4 — Gestão escolar / educação municipal](#nicho-4--gestão-escolar--educação-municipal)
   - [Nicho 5 — Software de licitações e transparência](#nicho-5--software-de-licitações-e-transparência)
5. [Schema do banco de dados](#5-schema-do-banco-de-dados)
6. [Stack tecnológica recomendada](#6-stack-tecnológica-recomendada)
7. [Pipeline de coleta e processamento com IA](#7-pipeline-de-coleta-e-processamento-com-ia)
8. [Funil de vendas para prefeituras](#8-funil-de-vendas-para-prefeituras)
9. [Roadmap de desenvolvimento](#9-roadmap-de-desenvolvimento)
10. [Queries de busca no PNCP por nicho](#10-queries-de-busca-no-pncp-por-nicho)

---

## 1. Contexto e oportunidade de mercado

O mercado de compras públicas no Brasil movimentou mais de R$ 1,5 trilhão em 2024, com mais de 1,2 milhão de licitações só no governo federal. Software é um dos segmentos que mais cresce dentro desse universo, impulsionado pela obrigatoriedade da Lei 14.133/2021 (Nova Lei de Licitações), que forçou todos os órgãos a modernizar sistemas de gestão, transparência e contratação.

### Por que construir esse sistema agora

- **PNCP centraliza tudo:** desde 2023, todos os órgãos são obrigados a publicar editais no Portal Nacional de Contratações Públicas, criando uma fonte unificada e pública de dados estruturados em JSON via API REST.
- **Informação é vantagem:** a maioria dos fornecedores ainda encontra licitações manualmente, via alertas genéricos ou por acaso. Um sistema inteligente gera vantagem competitiva real.
- **Gemini lê PDFs nativamente:** editais em PDF contêm especificações, preços e critérios que a API não expõe — a IA extrai isso de forma automática e estruturada.
- **Mercado fragmentado:** os 5.570 municípios brasileiros compram software de forma isolada. Nenhum player hoje tem visão consolidada de toda essa demanda.

### Números-chave do mercado

| Indicador | Valor |
|---|---|
| Total de municípios no Brasil | 5.570 |
| Municípios sem sistema GIS implantado | ~4.800 |
| Editais de software no PNCP (2024) | >15.000/ano estimado |
| Ticket médio de contrato de software municipal | R$ 80k–400k/ano |
| Duração média dos contratos | 12–60 meses |
| Limite para dispensa de licitação (serviços, 2025) | R$ 125.451,15 |

---

## 2. Arquitetura geral do sistema

```
┌─────────────────────────────────────────────────────────────┐
│  FONTES DE DADOS                                            │
│  PNCP Search API │ PNCP Itens API │ Documentos PDF         │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  MÓDULO COLETOR (Python + FastAPI + Celery)                 │
│  Paginação automática · Deduplicação · Rate limiting        │
│  Retry logic · Status tracking por edital                   │
└────────────────────────────┬────────────────────────────────┘
                             │
               ┌─────────────┴─────────────┐
               ▼                           ▼
┌──────────────────────┐     ┌─────────────────────────────┐
│  Gemini PDF Reader   │     │  Classificador Semântico     │
│  Extrai: software,   │     │  Embeddings por categoria    │
│  qtd, valor, prazo   │     │  Detecta padrões de demanda  │
└──────────────────────┘     └─────────────────────────────┘
               │                           │
               └─────────────┬─────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  ARMAZENAMENTO                                              │
│  PostgreSQL (Supabase) │ Vector DB (ChromaDB)               │
│  Tabelas: orgaos, editais, itens, documentos,               │
│           extracao_ia, resultados, software_catalog         │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  INTELIGÊNCIA DE MERCADO                                    │
│  Ranking de demanda · Análise temporal · Perfil de órgão    │
│  Score de oportunidade · Preço estimado · Mapa competitivo  │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  OUTPUT                                                     │
│  Dashboard Next.js · Alertas Telegram · Email Resend        │
│  Relatórios IA · Score por edital · API para clientes       │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. APIs do PNCP — como usar cada endpoint

### 3.1 Busca principal

```
GET https://pncp.gov.br/api/search/
  ?q={termo}
  &tipos_documento=edital
  &ordenacao=-data
  &pagina=1
  &tam_pagina=50
  &status=todos
```

**Campos críticos do retorno:**

| Campo | O que representa | Como usar |
|---|---|---|
| `numero_controle_pncp` | Chave única global | ID primário no banco |
| `orgao_cnpj` | CNPJ do órgão | Montar URLs filhas da API |
| `numero_sequencial` | Número da compra no ano | Compor endpoints de itens/docs |
| `data_fim_vigencia` | Encerramento do edital | Ordenar por urgência |
| `tem_resultado` | Se já tem vencedor | `true` = dados de preço disponíveis |
| `modalidade_licitacao_nome` | Tipo de licitação | Dispensa/Inexigibilidade = menos concorrência |
| `esfera_id` | F=Federal, E=Estadual, M=Municipal | Segmentar por mercado |
| `valor_global` | Valor total estimado | Filtrar por ticket mínimo |

### 3.2 Itens do edital

```
GET https://pncp.gov.br/api/pncp/v1/orgaos/{cnpj}/compras/{ano}/{seq}/itens
  ?pagina=1
  &tamanhoPagina=20
```

**Campos críticos:**

| Campo | O que representa |
|---|---|
| `descricao` | Nome do item (às vezes só "Software" — use IA para enriquecer) |
| `valorUnitarioEstimado` | Preço unitário estimado (0 se sigiloso) |
| `quantidade` | Quantas licenças/unidades |
| `orcamentoSigiloso` | Se `true`, buscar valor no PDF |
| `ncmNbsCodigo` | `84714900` = software — filtro poderoso |
| `situacaoCompraItem` | 1 = em andamento |
| `temResultado` | Se o item já foi adjudicado |

### 3.3 Documentos (PDFs)

```
GET https://pncp.gov.br/api/pncp/v1/orgaos/{cnpj}/compras/{ano}/{seq}/arquivos
```

Retorna lista de arquivos. Filtre pelo tipo `"Edital"` para pegar o documento principal. URL de download segue o padrão:

```
https://pncp.gov.br/pncp-api/v1/orgaos/{cnpj}/compras/{ano}/{seq}/arquivos/{sequencial}
```

### 3.4 Resultados (vencedores)

```
GET https://pncp.gov.br/api/pncp/v1/orgaos/{cnpj}/compras/{ano}/{seq}/itens/{num}/resultados
```

Disponível quando `tem_resultado = true`. Contém CNPJ do vencedor, valor final, quantidade homologada — **dado mais valioso para inteligência competitiva e precificação**.

### 3.5 Log de manutenção

```
GET https://pncp.gov.br/api/pncp/v1/orgaos/{cnpj}/compras/{ano}/{seq}/historico
```

Registra inclusão, cancelamento, alteração de edital. Use para detectar retificações e reabertura de prazos.

---

## 4. Os 5 nichos priorizados

---

### Nicho 1 — ERP / Gestão pública municipal

#### Resumo do nicho

| Indicador | Valor |
|---|---|
| Volume de editais | ★★★★★ 95% |
| Concorrência | Alta |
| Ticket médio | R$ 80k–400k/ano |
| Recorrência | Anual garantida |
| Mercado total | 5.570 prefeituras como clientes potenciais |

#### O que é comprado

Software integrado de gestão municipal contratado em modelo SaaS (Software as a Service), sem limitação de usuários, incluindo instalação, conversão de dados, testes, customização e manutenção mensal. Cobre os seguintes módulos principais:

- Contabilidade pública (SICON, LRF)
- Recursos humanos e folha de pagamento
- Patrimônio e almoxarifado
- Tributação (IPTU, ISS, ITBI)
- Protocolo e processos administrativos
- Licitações e contratos (integração PNCP obrigatória pela Lei 14.133/2021)
- Saúde (prontuário, farmácia, regulação)
- Educação (matrícula, merenda, transporte escolar)

#### Concorrentes principais

| Empresa | Posicionamento | Fraqueza explorável |
|---|---|---|
| TOTVS | Líder nacional, foco em médios e grandes | Caro, suporte ruim para pequenos |
| Betha Sistemas | Líder em municípios do Sul | Regional, sem presença no Norte/NE |
| Senior Sistemas | Forte em RH | Fraco em módulos de saúde |
| Tecnos | Municípios pequenos de SP/MG | Produto legado, sem mobile |
| OMD | Interior de SP | Sem SaaS moderno |

#### Diferenciais para construir

- Onboarding em menos de 30 dias (concorrentes levam 6 meses)
- Interface mobile para secretários e servidores de campo
- Integração nativa com PNCP (obrigatório desde 2023, muitos ERP ainda não têm)
- Módulo de transparência com gerador de portais automático (Lei de Acesso à Informação)
- Preço por habitante (R$ 2–5/hab/mês) — mais palatável para prefeitos do que valor fixo alto

#### Queries PNCP para monitorar

```
/api/search?q=software+gestão+pública+municipal
/api/search?q=sistema+integrado+prefeitura+saas
/api/search?q=locação+software+gestão+municipal
/api/search?q=ERP+prefeitura+contabilidade+folha
/api/search?q=sistema+tributação+IPTU+municipal
```

#### Argumento de venda principal

> "A Lei 14.133/2021 exige integração com o PNCP e modernização dos processos. Sua prefeitura está em conformidade? Identificamos X editais de prefeituras similares à sua que já migraram nos últimos 12 meses."

---

### Nicho 2 — GIS / Geoprocessamento municipal

#### Resumo do nicho

| Indicador | Valor |
|---|---|
| Volume de editais | ★★★☆☆ 60% |
| Concorrência | **Baixa** — principal vantagem |
| Ticket médio | R$ 100k–600k (implantação + 5 anos SaaS) |
| Recorrência | 1–5 anos por contrato |
| Mercado total | ~4.800 municípios sem GIS implantado |
| TAM estimado | R$ 1,3 bilhão |

#### O que é comprado

Serviço completo de atualização e manutenção do sistema de geoprocessamento, constituído pela implantação de Sistema de Informações Geográficas (SIG) para gestão do Cadastro Técnico Multifinalitário (CTM), com integração ao cadastro imobiliário municipal, planta genérica de valores (PGV) e demais informações geográficas relacionadas a IPTU, ITBI, ISS e taxas municipais.

Contrato típico inclui:

- Aerolevantamento / mapeamento por drone ou satélite
- Atualização do cadastro imobiliário
- Implantação do SIG web (acesso pelo navegador, sem instalar)
- Planta Genérica de Valores (base para cálculo do IPTU)
- Treinamento de servidores
- Suporte técnico e manutenção pelo período contratado (12 meses, prorrogável até 60)

#### O argumento financeiro que fecha qualquer contrato

Um município de 70 mil habitantes com cadastro desatualizado identificou, após um projeto de geoprocessamento:

- **950 mil m² de área construída** não cadastrada
- **1.400 novos imóveis** que não estavam no cadastro
- **R$ 10 milhões/ano adicionais** de IPTU sem criar nenhum imposto novo

**O projeto se paga com a própria arrecadação recuperada.** Esse é o argumento para o secretário de fazenda e para o prefeito — o GIS não é um custo, é um investimento com ROI mensurável em meses.

#### Concorrentes reais

| Empresa | Posição | Clientes | Fraqueza |
|---|---|---|---|
| **Geopixel** | Líder de mercado | 100+ prefeituras | Caro, foca em municípios grandes (70k+ hab.) |
| **Habeas Data** | Regional Sul/Nordeste | Dezenas | Sem SaaS moderno, produto legado |
| **Esri / ArcGIS** | Global, revendido por parceiros | Grandes órgãos | Inacessível para municípios pequenos (R$ 200k+/ano só de licença) |
| **Regionais** (Geosolid, Geodados, GIS Soluções) | Local/estadual | Poucos | Sem produto escalável, sem SaaS |

**O ponto cego da Geopixel:** foca em municípios acima de 70 mil habitantes. Existem **~3.200 municípios de 10k–50k habitantes** sem atendimento especializado, com orçamentos que cabem em dispensa de licitação (até R$ 125k) ou pregão simplificado.

#### Brechas de mercado

1. **Municípios pequenos (10k–50k hab.):** ignorados pelos líderes, orçamento compatível com dispensa de licitação
2. **Open source como diferenciador:** solução baseada em QGIS + PostGIS entrega 90% da funcionalidade por 40% do preço dos concorrentes proprietários
3. **IA para detecção automática:** integração com imagens de satélite para detectar construções novas sem precisar de voo de drone — custo menor, atualização contínua
4. **Norte e Centro-Oeste:** PA, AM, TO, MT, MS têm centenas de prefeituras com crescimento urbano acelerado e nenhum GIS implantado; concorrentes estão concentrados em SP, PR e SC

#### Stack técnica específica para GIS

| Componente | Tecnologia | Função |
|---|---|---|
| Banco geoespacial | PostgreSQL + PostGIS | Armazenar geometrias de lotes, edificações |
| Mapas no frontend | Mapbox GL JS ou Leaflet | Mapa interativo 100% web |
| Análise espacial | GDAL + Shapely (Python) | Buffer, intersect, overlay, projeções |
| Imagens de satélite | Google Earth Engine API | Detecção de mudanças, atualização contínua |
| Serviço de tiles | GeoServer (open source) | Servir camadas de mapa em WMS/WFS |
| Alternativa ao ArcGIS | QGIS + PostGIS | Open source, auditável, sem licença |

#### Módulos do produto (ordem de construção)

1. **Cadastro Técnico Multifinalitário (CTM)** com mapa interativo — o core
2. **Painel "Cadastro vs Satélite"** mostrando divergências — o argumento de venda
3. **Relatório de IPTU potencial** não arrecadado — o que fecha o contrato
4. **App mobile para fiscalização** em campo — diferenciador técnico
5. **Integração com sistemas tributários** municipais — fidelização

#### Queries PNCP para monitorar

```
/api/search?q=geoprocessamento+cadastro+imobiliário
/api/search?q=sistema+informações+geográficas+prefeitura
/api/search?q=CTM+multifinalitário+mapeamento
/api/search?q=planta+genérica+valores+SIG
/api/search?q=aerolevantamento+cadastro+municipal
/api/search?q=BIM+geoprocessamento+plano+diretor
```

---

### Nicho 3 — Saúde pública — prontuário e gestão

#### Resumo do nicho

| Indicador | Valor |
|---|---|
| Volume de editais | ★★★★☆ 80% |
| Concorrência | Média |
| Ticket médio | R$ 50k–300k/ano |
| Recorrência | Muito alta — sistemas críticos não são trocados |
| Urgência | RNDS obrigatória cria demanda constante |

#### O que é comprado

- Prontuário Eletrônico do Paciente (PEP) para UBS, UPA, hospitais municipais
- Sistema de regulação de leitos e consultas especializadas
- Gestão de farmácia básica e dispensação de medicamentos
- Agendamento online de consultas e exames
- Integração com RNDS (Rede Nacional de Dados em Saúde — obrigatório pelo Ministério da Saúde)
- Sistema de gestão de vigilância epidemiológica
- Notificação compulsória de doenças (SINAN integrado)

#### Por que a RNDS é oportunidade

A Rede Nacional de Dados em Saúde (RNDS) tornou obrigatória a troca eletrônica de dados clínicos entre todos os estabelecimentos de saúde e o governo federal. Todo município que ainda usa papel ou sistema sem integração RNDS **precisa trocar o sistema**. Isso criou uma onda de licitações a partir de 2023 que ainda está em andamento.

#### Concorrentes

| Empresa | Posicionamento |
|---|---|
| MV (Sistemas) | Hospitais de médio/grande porte |
| Philips Tasy | Grandes hospitais, muito caro |
| Wareline / Olient | Prefeituras pequenas e médias |
| eSaúde / GovHealth | Redes municipais de saúde |

**Fraqueza comum:** integração com RNDS ainda falha ou parcial na maioria dos players menores.

#### Barreira de entrada

Integração com DATASUS (sistemas federais) é complexa e requer cadastro de fornecedor na RNDS. Planejar 2–3 meses só para homologação técnica antes de começar a vender.

#### Queries PNCP para monitorar

```
/api/search?q=prontuário+eletrônico+saúde+municipal
/api/search?q=sistema+gestão+saúde+SaaS+prefeitura
/api/search?q=RNDS+integração+prontuário
/api/search?q=regulação+leitos+sistema+municipal
/api/search?q=farmácia+básica+software+prefeitura
/api/search?q=agendamento+consultas+UBS+sistema
```

---

### Nicho 4 — Gestão escolar / educação municipal

#### Resumo do nicho

| Indicador | Valor |
|---|---|
| Volume de editais | ★★★★☆ 75% |
| Concorrência | Média-baixa |
| Ticket médio | R$ 30k–150k/ano |
| Recorrência | Anual (renovação no início de cada ano letivo) |
| Vantagem | Ticket menor = dispensa de licitação mais frequente |

#### O que é comprado

- Sistema de matrícula escolar online
- Diário de classe eletrônico
- Gestão de merenda escolar (PNAE — Programa Nacional de Alimentação Escolar)
- Controle de transporte escolar
- Frequência de alunos e professores
- Boletim online para pais e responsáveis
- Integração com Censo Escolar (INEP/MEC — obrigatório)

#### Por que esse nicho é atraente

- Alta frequência de editais — toda secretaria de educação precisa do sistema
- Ticket menor significa que muitos contratos caem em **dispensa de licitação** (até R$ 125k), o que significa **menos concorrência** e processo mais rápido
- Ciclo anual previsível: contratos são renovados ou licitados entre outubro e fevereiro, antes do início do ano letivo
- O Censo Escolar federal obriga integração, o que cria lock-in para quem já está implantado

#### Queries PNCP para monitorar

```
/api/search?q=software+gestão+escolar+municipal
/api/search?q=sistema+matrícula+diário+eletrônico
/api/search?q=locação+software+educação+prefeitura
/api/search?q=merenda+escolar+sistema+PNAE
/api/search?q=transporte+escolar+software
```

---

### Nicho 5 — Software de licitações e transparência

#### Resumo do nicho

| Indicador | Valor |
|---|---|
| Volume de editais | ★★★☆☆ 55% |
| Concorrência | Média |
| Ticket médio | R$ 40k–200k/ano |
| Recorrência | Alta — sistemas regulatórios não são descontinuados |
| Urgência | Lei 14.133/2021 forçou atualização de todos os órgãos |

#### O que é comprado

- Plataforma de pregão eletrônico (para órgãos realizarem licitações)
- Portal de transparência (LAI — Lei de Acesso à Informação)
- Sistema de controle interno e compliance
- Integração com PNCP (obrigatória desde 2023)
- Software de planejamento de compras (DFD, PCA, ETP automatizados)
- Sistema de gestão de contratos e aditivos

#### Por que a Lei 14.133/2021 é o gatilho

A Nova Lei de Licitações tornou obrigatório o uso do PNCP para publicação de todos os editais e contratos. Municípios que usavam sistemas antigos **precisaram migrar até 2023**. Muitos ainda estão em processo de migração ou com sistemas não integrados. Isso gerou uma demanda contínua por novas plataformas.

#### Concorrentes

| Empresa | Posicionamento |
|---|---|
| BLL Compras | Maior plataforma nacional, gratuita para órgãos |
| Comprasnet (Serpro) | Governo federal, usado por estados e municípios |
| Portal de Compras Públicas | Marketplace privado |
| Licitacon (TCE-SP) | Estado de SP |

**Diferencial possível:** plataforma com IA para análise de propostas, detecção de conluio e geração automática de atas — algo que os sistemas atuais não têm.

#### Queries PNCP para monitorar

```
/api/search?q=sistema+licitações+pregão+eletrônico
/api/search?q=portal+transparência+LAI+prefeitura
/api/search?q=software+planejamento+compras+PCA
/api/search?q=integração+PNCP+sistema+gestão
/api/search?q=controle+interno+compliance+municipal
```

---

## 5. Schema do banco de dados

### DDL completo (PostgreSQL)

```sql
-- Órgãos públicos
CREATE TABLE orgaos (
  cnpj           TEXT PRIMARY KEY,
  nome           TEXT NOT NULL,
  esfera_id      CHAR(1),  -- F=Federal, E=Estadual, M=Municipal
  poder_id       CHAR(1),  -- E=Executivo, L=Legislativo, J=Judiciário
  uf             CHAR(2),
  municipio_id   INT,
  municipio_nome TEXT
);

-- Editais coletados do PNCP
CREATE TABLE editais (
  numero_controle_pncp TEXT PRIMARY KEY,
  orgao_cnpj           TEXT REFERENCES orgaos(cnpj),
  ano                  SMALLINT,
  numero_sequencial    INT,
  modalidade_nome      TEXT,
  situacao_nome        TEXT,
  tipo_nome            TEXT,
  data_publicacao      TIMESTAMPTZ,
  data_fim_vigencia    TIMESTAMPTZ,
  tem_resultado        BOOLEAN DEFAULT FALSE,
  cancelado            BOOLEAN DEFAULT FALSE,
  valor_global         NUMERIC(15,2),
  -- Campos de controle interno (não vêm da API)
  status_coleta        TEXT DEFAULT 'pendente',  -- pendente|coletando|completo|erro
  coletado_em          TIMESTAMPTZ DEFAULT now(),
  nicho_detectado      TEXT  -- erp|gis|saude|educacao|licitacoes|outro
);

-- Itens de cada edital
CREATE TABLE itens (
  id                       SERIAL PRIMARY KEY,
  numero_controle_pncp     TEXT REFERENCES editais,
  numero_item              SMALLINT,
  descricao_raw            TEXT,     -- exatamente como veio da API
  software_nome            TEXT,     -- normalizado pela IA
  fabricante               TEXT,     -- extraído pela IA
  tipo_licenca             TEXT,     -- subscription|perpetua|saas|volume
  quantidade               NUMERIC(10,4),
  valor_unitario_estimado  NUMERIC(15,2),
  valor_total              NUMERIC(15,2),
  orcamento_sigiloso       BOOLEAN,
  ncm_codigo               TEXT,     -- 84714900 = software
  situacao_nome            TEXT,
  tem_resultado            BOOLEAN DEFAULT FALSE,
  UNIQUE (numero_controle_pncp, numero_item)
);

-- Documentos (PDFs) vinculados a cada edital
CREATE TABLE documentos (
  id                   SERIAL PRIMARY KEY,
  numero_controle_pncp TEXT REFERENCES editais,
  sequencial           INT,
  tipo                 TEXT,  -- Edital|Anexo|Ata|Contrato
  titulo               TEXT,
  url_download         TEXT,
  status_processamento TEXT DEFAULT 'pendente',
  processado_em        TIMESTAMPTZ
);

-- Extração estruturada feita pelo Gemini
CREATE TABLE extracao_ia (
  id               SERIAL PRIMARY KEY,
  documento_id     INT REFERENCES documentos UNIQUE,
  software_nome    TEXT,
  fabricante       TEXT,
  tipo_licenca     TEXT,
  prazo_meses      SMALLINT,
  valor_estimado   NUMERIC(15,2),
  marca_exigida    BOOLEAN,
  permite_equiv    BOOLEAN,
  requisitos_json  JSONB,
  confianca        NUMERIC(3,2),  -- 0.00 a 1.00
  modelo_ia        TEXT,
  criado_em        TIMESTAMPTZ DEFAULT now()
);

-- Resultados (vencedores de licitações)
CREATE TABLE resultados (
  id                       SERIAL PRIMARY KEY,
  numero_controle_pncp     TEXT REFERENCES editais,
  item_numero              SMALLINT,
  fornecedor_cnpj          TEXT,
  fornecedor_nome          TEXT,
  valor_unitario_final     NUMERIC(15,2),
  valor_total_final        NUMERIC(15,2),
  quantidade_homologada    NUMERIC(10,4),
  data_homologacao         DATE
);

-- Catálogo normalizado de softwares
CREATE TABLE software_catalog (
  id               SERIAL PRIMARY KEY,
  nome_normalizado TEXT UNIQUE NOT NULL,
  fabricante       TEXT,
  categoria        TEXT,    -- erp|gis|saude|educacao|licitacoes|seguranca|outro
  subcategoria     TEXT,
  aliases          TEXT[],  -- variações de nome encontradas nos editais
  atualizado_em    TIMESTAMPTZ DEFAULT now()
);

-- Agregação diária de demanda por software
CREATE TABLE demanda_diaria (
  id                 SERIAL PRIMARY KEY,
  software_id        INT REFERENCES software_catalog,
  data               DATE,
  editais_abertos    INT DEFAULT 0,
  editais_encerrados INT DEFAULT 0,
  valor_medio        NUMERIC(15,2),
  quantidade_total   NUMERIC(12,2),
  UNIQUE (software_id, data)
);
```

### Índices essenciais

```sql
-- Busca por editais ativos próximos do vencimento
CREATE INDEX ON editais (data_fim_vigencia) WHERE cancelado = FALSE;

-- Relacionamento com órgão
CREATE INDEX ON editais (orgao_cnpj);

-- Editais com resultado para análise de preço
CREATE INDEX ON editais (tem_resultado) WHERE tem_resultado = TRUE;

-- Busca por nome de software
CREATE INDEX ON itens (software_nome);

-- Filtro por NCM (tudo que é software = 84714900)
CREATE INDEX ON itens (ncm_codigo);

-- Séries temporais de demanda
CREATE INDEX ON demanda_diaria (software_id, data DESC);

-- Busca por variações de nome (GIN para arrays)
CREATE INDEX ON software_catalog USING GIN (aliases);

-- Busca por nicho detectado
CREATE INDEX ON editais (nicho_detectado);
```

### Queries analíticas prontas

```sql
-- Ranking de softwares mais demandados (últimos 12 meses)
SELECT
  software_nome,
  COUNT(*) AS total_editais,
  SUM(quantidade) AS total_licencas,
  AVG(valor_unitario_estimado) AS preco_medio
FROM itens
WHERE software_nome IS NOT NULL
  AND numero_controle_pncp IN (
    SELECT numero_controle_pncp FROM editais
    WHERE data_publicacao > NOW() - INTERVAL '12 months'
  )
GROUP BY software_nome
ORDER BY total_editais DESC
LIMIT 20;

-- Editais abertos nos próximos 15 dias (oportunidades urgentes)
SELECT
  e.numero_controle_pncp,
  o.nome AS orgao,
  o.municipio_nome,
  o.uf,
  e.data_fim_vigencia,
  e.modalidade_nome,
  e.nicho_detectado
FROM editais e
JOIN orgaos o ON e.orgao_cnpj = o.cnpj
WHERE e.data_fim_vigencia BETWEEN NOW() AND NOW() + INTERVAL '15 days'
  AND e.cancelado = FALSE
  AND e.situacao_nome = 'Divulgada no PNCP'
ORDER BY e.data_fim_vigencia ASC;

-- Fornecedores que mais vencem (mapa de concorrência)
SELECT
  r.fornecedor_cnpj,
  r.fornecedor_nome,
  COUNT(*) AS contratos_ganhos,
  SUM(r.valor_total_final) AS receita_total,
  e.nicho_detectado
FROM resultados r
JOIN editais e ON r.numero_controle_pncp = e.numero_controle_pncp
GROUP BY 1, 2, 5
ORDER BY contratos_ganhos DESC;

-- Órgãos com ciclo de renovação iminente
SELECT
  o.nome,
  o.municipio_nome,
  o.uf,
  i.software_nome,
  MAX(e.data_fim_vigencia) AS ultimo_contrato,
  AVG(ex.prazo_meses) AS prazo_medio_meses
FROM itens i
JOIN editais e ON i.numero_controle_pncp = e.numero_controle_pncp
JOIN orgaos o ON e.orgao_cnpj = o.cnpj
JOIN documentos d ON e.numero_controle_pncp = d.numero_controle_pncp
JOIN extracao_ia ex ON d.id = ex.documento_id
WHERE e.tem_resultado = TRUE
GROUP BY o.nome, o.municipio_nome, o.uf, i.software_nome
HAVING MAX(e.data_fim_vigencia) < NOW() + INTERVAL '3 months'
ORDER BY MAX(e.data_fim_vigencia) ASC;
```

---

## 6. Stack tecnológica recomendada

### Frontend

| Tecnologia | Versão | Função |
|---|---|---|
| **Next.js** | 14 (App Router) | Framework principal, SSR, API routes |
| **React** | 19 | UI components |
| **Tailwind CSS** | 3 | Estilização utilitária |
| **shadcn/ui** | latest | Componentes prontos (tabelas, filtros, modais) |
| **Recharts** | 2 | Gráficos de demanda e ranking |
| **TanStack Table** | 8 | Tabelas com sort/filter/paginate |
| **TanStack Query** | 5 | Cache e gerenciamento de dados da API |
| **Mapbox GL JS** | 3 | Mapas interativos (nicho GIS) |

### Backend

| Tecnologia | Função |
|---|---|
| **Python 3.12** | Linguagem base do backend e coleta |
| **FastAPI** | Framework web assíncrono, docs automáticas |
| **Pydantic v2** | Validação e serialização de dados |
| **Celery** | Fila de tarefas assíncronas (coleta + PDFs) |
| **Redis (Upstash)** | Broker do Celery + cache de queries |
| **httpx** | Requisições HTTP assíncronas para PNCP API |

### IA e processamento

| Tecnologia | Função |
|---|---|
| **Google Gemini 2.0 Flash** | Leitura de PDFs, extração estruturada em JSON |
| **text-embedding-004** | Embeddings para classificação semântica |
| **ChromaDB** | Vector database para busca por similaridade |
| **Langchain** | Orquestração de chains de extração |

Prompt padrão para extração de edital via Gemini:

```python
PROMPT_EXTRACAO = """
Você é um analisador especializado em editais de licitação pública brasileira.
Analise o edital em PDF e extraia APENAS os dados listados, sem adicionar inferências.
Retorne SOMENTE JSON válido, sem markdown, sem texto adicional.

{
  "software_nome": "nome comercial exato do software",
  "fabricante": "empresa fabricante",
  "tipo_licenca": "subscription|perpetua|saas|volume|outro",
  "quantidade": número_inteiro,
  "prazo_meses": número_inteiro,
  "valor_estimado_total": número_ou_null,
  "valor_unitario": número_ou_null,
  "orcamento_sigiloso": boolean,
  "marca_exigida": boolean,
  "justificativa_marca": "texto se exigida, null caso contrário",
  "permite_equivalente": boolean,
  "habilitacao_tecnica": "principais exigências para participar",
  "criterio_julgamento": "menor_preco|melhor_tecnica|tecnica_e_preco",
  "integrações_exigidas": ["lista de sistemas para integrar"],
  "nicho": "erp|gis|saude|educacao|licitacoes|seguranca|outro"
}
"""
```

### Banco de dados

| Tecnologia | Função |
|---|---|
| **PostgreSQL 16** via Supabase | Banco principal, auth inclusa, realtime |
| **PostGIS** | Extensão geoespacial (nicho GIS) |
| **ChromaDB** | Vector DB para embeddings |

### Infraestrutura

| Serviço | Função | Custo estimado |
|---|---|---|
| **Vercel** | Deploy do frontend Next.js | Grátis até escalar |
| **Railway** | Deploy do FastAPI + Celery | ~R$ 50/mês |
| **Supabase** | PostgreSQL gerenciado + auth | Grátis até 500MB |
| **Upstash** | Redis serverless (fila Celery) | ~R$ 5/mês |
| **Resend** | Email transacional (alertas) | Grátis até 3k/mês |
| **Telegram Bot API** | Alertas instantâneos | Grátis |

**Custo total MVP: ~R$ 55–80/mês**

---

## 7. Pipeline de coleta e processamento com IA

### Fluxo completo

```
1. SCHEDULER (a cada 6h)
   └── Dispara job de coleta por nicho

2. COLETOR
   ├── GET /api/search?q={termo}&pagina=1..N
   ├── Filtra por numero_controle_pncp não visto
   ├── Salva em editais com status_coleta='pendente'
   └── Enfileira jobs de detalhe no Celery

3. DETAIL WORKER (por edital)
   ├── GET /orgaos/{cnpj}/compras/{ano}/{seq}/itens
   ├── GET /orgaos/{cnpj}/compras/{ano}/{seq}/arquivos
   ├── Salva itens e documentos
   └── Se tem_resultado=true: enfileira resultado

4. PDF WORKER (por documento tipo Edital)
   ├── Download do PDF
   ├── Converte para base64
   ├── Envia para Gemini 2.0 Flash com PROMPT_EXTRACAO
   ├── Parseia JSON retornado
   └── Salva em extracao_ia

5. RESULTADO WORKER (editais com vencedor)
   ├── GET /orgaos/{cnpj}/compras/{ano}/{seq}/itens/{n}/resultados
   ├── Salva em resultados
   └── Atualiza score de concorrente

6. ALERTA WORKER (a cada hora)
   ├── Query: editais_abertos WHERE data_fim_vigencia < NOW() + 24h
   ├── Gera resumo via Gemini
   └── Envia Telegram + email
```

### Score de oportunidade (0–100)

Calculado automaticamente para cada edital novo:

| Critério | Peso | Lógica |
|---|---|---|
| Prazo para encerrar | 30% | 7–15 dias = 100pts, <3 dias ou >30 dias = 0 |
| Valor estimado | 25% | Acima de R$ 50k = máximo |
| Órgão sem fornecedor fixo | 20% | Sem vencedor repetido nos últimos 3 anos |
| Esfera municipal | 15% | Municipal = menos concorrência especializada |
| Sem exigência de marca | 10% | `marca_exigida=false` = mais competição possível |

---

## 8. Funil de vendas para prefeituras

### Etapa 1 — Identificação do alvo via PNCP

Use o agente para identificar prefeituras que:
- Nunca publicaram edital de GIS ou ERP nos últimos 3 anos
- Publicaram mas sem resultado (licitação deserta = problema de preço ou especificação)
- Publicaram com um único vencedor repetido (substituição possível)

### Etapa 2 — O argumento financeiro (abre qualquer porta)

Nunca comece pela solução. Comece pelo problema fiscal:

> "Prefeituras com cadastro imobiliário desatualizado perdem, em média, 30% da arrecadação potencial de IPTU. Identificamos imóveis na sua cidade que provavelmente não estão cadastrados. Podemos mostrar isso em uma demonstração de 20 minutos, sem compromisso."

### Etapa 3 — Hierarquia de decisão em uma prefeitura

```
Secretaria de Fazenda
└── Dono do orçamento
└── Argumento: "aumentar arrecadação sem criar imposto novo"
└── KPI: R$ recuperado de IPTU por real investido

Secretaria de Planejamento Urbano
└── Usuário final do sistema
└── Argumento: "gestão territorial moderna, plano diretor atualizado"
└── KPI: tempo economizado em processos manuais

Prefeito / Gabinete
└── Decisor final, assina o contrato
└── Argumento: "cidade inteligente, Tribunal de Contas satisfeito"
└── KPI: zero risco de apontamento de irregularidade no TCE
```

### Etapa 4 — Modalidades de contratação (do mais fácil ao mais complexo)

| Modalidade | Limite (2025) | Prazo médio | Estratégia |
|---|---|---|---|
| Dispensa de licitação | R$ 125.451,15 | 3–7 dias | Mais fácil — enviar proposta diretamente |
| Adesão a Ata (carona) | Sem limite | 15–30 dias | Aproveitar pregão vencido por outro órgão |
| Pregão eletrônico | Acima de R$ 125k | 30–60 dias | Participar do edital publicado |
| Contrato emergencial | Qualquer valor | 72h | Situações de calamidade ou falha crítica |

### Etapa 5 — Como ganhar o pregão

Diferenciadores técnicos que devem estar no produto e ser exigidos nos editais (dentro da legalidade):

- Plataforma 100% web, sem instalação local
- Suporte técnico em português, horário comercial, SLA documentado
- Treinamento de servidores incluído no contrato
- Código-fonte em custódia ou tecnologia open source auditável
- Integração nativa com PNCP e sistemas federais (SIOPS, SIOPE, RREO, etc.)
- Atualização automática para novas legislações sem custo adicional
- Backup diário com armazenamento em território nacional (LGPD)

### Etapa 6 — Modelo de receita (SaaS + implantação)

```
Projeto de implantação (único):
├── Levantamento de dados: R$ 20k–80k
├── Configuração e migração: R$ 15k–60k
├── Treinamento: R$ 5k–20k
└── TOTAL: R$ 40k–160k (pagamento único ou em 3x)

SaaS anual (recorrente):
├── Licença de uso: R$ 24k–80k/ano
├── Suporte técnico: incluso
├── Atualizações: incluso
└── Renovação automática por até 5 anos (cláusula no contrato)

Receita total por município (5 anos):
├── Implantação: R$ 100k (média)
├── SaaS 5 anos: R$ 250k (R$ 50k/ano)
└── TOTAL: R$ 350k por cliente
```

---

## 9. Roadmap de desenvolvimento

### MVP — 8 semanas (2 devs)

| Semana | Entregável |
|---|---|
| 1–2 | Coletor Python: PNCP API → PostgreSQL, deduplicação, paginação |
| 3 | Dashboard básico Next.js: listagem de editais com filtros por nicho |
| 3–4 | Sistema de alertas Telegram com resumo automático |
| 4–5 | Integração Gemini para leitura de PDFs e extração JSON |
| 5–6 | Analytics de demanda: ranking, gráficos, mapa de concorrentes |
| 6–7 | Score de oportunidade e painel de priorização |
| 7–8 | Multi-tenant + autenticação (Supabase Auth) + planos de assinatura |

### Fase 2 — Expansão (semanas 9–16)

- API pública para clientes (webhook de alertas configuráveis)
- Módulo de inteligência competitiva (mapa de vencedores por nicho)
- Estimativa de preço baseada em histórico de resultados
- Integração com CRM (HubSpot ou Pipedrive) para equipes de vendas
- Mobile app para acompanhamento de editais em tempo real

### Fase 3 — Plataforma (semanas 17–24)

- Marketplace de documentação (termo de referência, proposta técnica por nicho)
- Assistente IA para redigir proposta comercial baseada no edital
- Módulo de compliance (checklist de habilitação por modalidade)
- Dashboard para órgãos públicos (visão dos fornecedores que monitoram seus editais)

---

## 10. Queries de busca no PNCP por nicho

### Consulta consolidada por nicho

```python
QUERIES_POR_NICHO = {
    "erp": [
        "software gestão pública municipal",
        "sistema integrado prefeitura saas",
        "locação software gestão municipal",
        "ERP prefeitura contabilidade folha",
        "sistema tributação IPTU municipal",
        "software administração pública integrado",
    ],
    "gis": [
        "geoprocessamento cadastro imobiliário",
        "sistema informações geográficas prefeitura",
        "CTM multifinalitário mapeamento",
        "planta genérica valores SIG",
        "aerolevantamento cadastro municipal",
        "BIM geoprocessamento plano diretor",
        "georreferenciamento cadastro técnico",
    ],
    "saude": [
        "prontuário eletrônico saúde municipal",
        "sistema gestão saúde SaaS prefeitura",
        "RNDS integração prontuário",
        "regulação leitos sistema municipal",
        "farmácia básica software prefeitura",
        "agendamento consultas UBS sistema",
        "vigilância epidemiológica software",
    ],
    "educacao": [
        "software gestão escolar municipal",
        "sistema matrícula diário eletrônico",
        "locação software educação prefeitura",
        "merenda escolar sistema PNAE",
        "transporte escolar software",
        "censo escolar integração sistema",
    ],
    "licitacoes": [
        "sistema licitações pregão eletrônico",
        "portal transparência LAI prefeitura",
        "software planejamento compras PCA",
        "integração PNCP sistema gestão",
        "controle interno compliance municipal",
        "plataforma compras públicas municipal",
    ],
}

# NCM para filtrar tudo que é software, independente do nicho
NCM_SOFTWARE = "84714900"
```

### Script de coleta base

```python
import httpx
import asyncio
from datetime import datetime

BASE_URL = "https://pncp.gov.br/api/search/"

async def coletar_editais(query: str, max_paginas: int = 20):
    editais = []
    async with httpx.AsyncClient(timeout=30) as client:
        for pagina in range(1, max_paginas + 1):
            resp = await client.get(BASE_URL, params={
                "q": query,
                "tipos_documento": "edital",
                "ordenacao": "-data",
                "pagina": pagina,
                "tam_pagina": 50,
                "status": "todos",
            })
            data = resp.json()
            items = data.get("items", [])
            if not items:
                break
            editais.extend(items)
            # Respeitar rate limiting
            await asyncio.sleep(0.5)
    return editais

async def coletar_itens(cnpj: str, ano: int, seq: int):
    url = f"https://pncp.gov.br/api/pncp/v1/orgaos/{cnpj}/compras/{ano}/{seq}/itens"
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(url, params={"pagina": 1, "tamanhoPagina": 50})
        return resp.json()

async def coletar_documentos(cnpj: str, ano: int, seq: int):
    url = f"https://pncp.gov.br/api/pncp/v1/orgaos/{cnpj}/compras/{ano}/{seq}/arquivos"
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(url)
        return resp.json()
```

---

*Documento gerado em 26/03/2026. Dados de mercado baseados em pesquisa realizada no PNCP e fontes públicas. Atualizar trimestralmente.*
