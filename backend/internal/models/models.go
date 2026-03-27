package models

import "time"

// ── Órgão ────────────────────────────────────────────────────

type Orgao struct {
	CNPJ          string `json:"cnpj" db:"cnpj"`
	Nome          string `json:"nome" db:"nome"`
	EsferaID      string `json:"esfera_id" db:"esfera_id"`
	PoderID       string `json:"poder_id" db:"poder_id"`
	UF            string `json:"uf" db:"uf"`
	MunicipioNome string `json:"municipio_nome" db:"municipio_nome"`
}

// ── Edital ───────────────────────────────────────────────────

type Edital struct {
	NumeroControlePNCP string    `json:"numero_controle_pncp" db:"numero_controle_pncp"`
	OrgaoCNPJ          string    `json:"orgao_cnpj" db:"orgao_cnpj"`
	Ano                int       `json:"ano" db:"ano"`
	NumeroSequencial   int       `json:"numero_sequencial" db:"numero_sequencial"`
	ModalidadeNome     string    `json:"modalidade_nome" db:"modalidade_nome"`
	SituacaoNome       string    `json:"situacao_nome" db:"situacao_nome"`
	TipoNome           string    `json:"tipo_nome" db:"tipo_nome"`
	ObjetoCompra       string    `json:"objeto_compra" db:"objeto_compra"`
	DataPublicacao     time.Time `json:"data_publicacao" db:"data_publicacao"`
	DataFimVigencia    time.Time `json:"data_fim_vigencia" db:"data_fim_vigencia"`
	TemResultado       bool      `json:"tem_resultado" db:"tem_resultado"`
	Cancelado          bool      `json:"cancelado" db:"cancelado"`
	ValorGlobal        *float64  `json:"valor_global" db:"valor_global"`
	OrcamentoSigiloso  bool      `json:"orcamento_sigiloso" db:"orcamento_sigiloso"`
	StatusColeta       string    `json:"status_coleta" db:"status_coleta"`
	ColetadoEm         time.Time `json:"coletado_em" db:"coletado_em"`

	// Joins
	Orgao *Orgao  `json:"orgao,omitempty"`
	Score *Score  `json:"score,omitempty"`
}

// ── Item ─────────────────────────────────────────────────────

type Item struct {
	ID                    int      `json:"id" db:"id"`
	NumeroControlePNCP    string   `json:"numero_controle_pncp" db:"numero_controle_pncp"`
	NumeroItem            int      `json:"numero_item" db:"numero_item"`
	DescricaoRaw          string   `json:"descricao_raw" db:"descricao_raw"`
	SoftwareNome          *string  `json:"software_nome" db:"software_nome"`
	Fabricante            *string  `json:"fabricante" db:"fabricante"`
	TipoLicenca           *string  `json:"tipo_licenca" db:"tipo_licenca"`
	Quantidade            *float64 `json:"quantidade" db:"quantidade"`
	ValorUnitarioEstimado *float64 `json:"valor_unitario_estimado" db:"valor_unitario_estimado"`
	ValorTotal            *float64 `json:"valor_total" db:"valor_total"`
	OrcamentoSigiloso     bool     `json:"orcamento_sigiloso" db:"orcamento_sigiloso"`
	NCMCodigo             *string  `json:"ncm_codigo" db:"ncm_codigo"`
	SituacaoNome          *string  `json:"situacao_nome" db:"situacao_nome"`
	TemResultado          bool     `json:"tem_resultado" db:"tem_resultado"`
}

// ── Documento ────────────────────────────────────────────────

type Documento struct {
	ID                  int        `json:"id" db:"id"`
	NumeroControlePNCP  string     `json:"numero_controle_pncp" db:"numero_controle_pncp"`
	Sequencial          int        `json:"sequencial" db:"sequencial"`
	Tipo                string     `json:"tipo" db:"tipo"`
	Titulo              string     `json:"titulo" db:"titulo"`
	URLDownload         string     `json:"url_download" db:"url_download"`
	StatusProcessamento string     `json:"status_processamento" db:"status_processamento"`
	ProcessadoEm        *time.Time `json:"processado_em" db:"processado_em"`
}

// ── Extração IA ──────────────────────────────────────────────

type ExtracaoIA struct {
	ID                 int       `json:"id" db:"id"`
	DocumentoID        int       `json:"documento_id" db:"documento_id"`
	ModeloIA           string    `json:"modelo_ia" db:"modelo_ia"`
	SoftwareNome       *string   `json:"software_nome" db:"software_nome"`
	Fabricante         *string   `json:"fabricante" db:"fabricante"`
	TipoLicenca        *string   `json:"tipo_licenca" db:"tipo_licenca"`
	Quantidade         *float64  `json:"quantidade" db:"quantidade"`
	PrazoMeses         *int      `json:"prazo_meses" db:"prazo_meses"`
	ValorEstimado      *float64  `json:"valor_estimado" db:"valor_estimado"`
	OrcamentoSigiloso  bool      `json:"orcamento_sigiloso" db:"orcamento_sigiloso"`
	MarcaExigida       bool      `json:"marca_exigida" db:"marca_exigida"`
	PermiteEquivalente bool      `json:"permite_equivalente" db:"permite_equivalente"`
	CriterioJulgamento *string   `json:"criterio_julgamento" db:"criterio_julgamento"`
	RequistosTecnicos  []string  `json:"requisitos_tecnicos" db:"requisitos_tecnicos"`
	OrgaoUso           *string   `json:"orgao_uso" db:"orgao_uso"`
	Resumo             *string   `json:"resumo" db:"resumo"`
	Confianca          float64   `json:"confianca" db:"confianca"`
	ExtaidoEm          time.Time `json:"extraido_em" db:"extraido_em"`
}

// ── Resultado ────────────────────────────────────────────────

type Resultado struct {
	ID                  int       `json:"id" db:"id"`
	NumeroControlePNCP  string    `json:"numero_controle_pncp" db:"numero_controle_pncp"`
	FornecedorCNPJ      string    `json:"fornecedor_cnpj" db:"fornecedor_cnpj"`
	FornecedorNome      string    `json:"fornecedor_nome" db:"fornecedor_nome"`
	ValorFinal          float64   `json:"valor_final" db:"valor_final"`
	DataResultado       time.Time `json:"data_resultado" db:"data_resultado"`
}

// ── Score ────────────────────────────────────────────────────

type Score struct {
	NumeroControlePNCP string `json:"numero_controle_pncp" db:"numero_controle_pncp"`
	Score              int    `json:"score" db:"score"`
	ScorePrazo         int    `json:"score_prazo" db:"score_prazo"`
	ScoreValor         int    `json:"score_valor" db:"score_valor"`
	ScoreConcorrencia  int    `json:"score_concorrencia" db:"score_concorrencia"`
	ScoreEsfera        int    `json:"score_esfera" db:"score_esfera"`
	ScoreMarca         int    `json:"score_marca" db:"score_marca"`
}
