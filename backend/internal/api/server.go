// Package api implementa a API HTTP que o frontend Next.js consome.
package api

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/cors"
)

type Server struct {
	db  *pgxpool.Pool
	log *slog.Logger
}

func New(db *pgxpool.Pool) *Server {
	return &Server{db: db, log: slog.Default()}
}

func (s *Server) Router() http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RealIP)

	// CORS — permite Next.js em localhost:3000
	c := cors.New(cors.Options{
		AllowedOrigins: []string{"http://localhost:3000", "https://pncp-intel.vercel.app"},
		AllowedMethods: []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders: []string{"Accept", "Content-Type"},
	})
	r.Use(c.Handler)

	// Health
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	})

	// API v1
	r.Route("/api/v1", func(r chi.Router) {
		// Dashboard
		r.Get("/dashboard/stats", s.handleDashboardStats)

		// Editais
		r.Get("/editais", s.handleListEditais)
		r.Get("/editais/{id}", s.handleGetEdital)

		// Órgãos
		r.Get("/orgaos", s.handleListOrgaos)
		r.Get("/orgaos/{cnpj}", s.handleGetOrgao)
		r.Get("/orgaos/{cnpj}/historico", s.handleOrgaoHistorico)
	})

	return r
}

// ── Dashboard ────────────────────────────────────────────────

func (s *Server) handleDashboardStats(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var stats struct {
		EditaisAtivos    int     `json:"editais_ativos"`
		Oportunidades    int     `json:"oportunidades"`
		ValorTotal       float64 `json:"valor_total"`
		EncerrandoHoje   int     `json:"encerrando_hoje"`
		AnalisadosIA     int     `json:"analisados_ia"`
		OrgaosMonit      int     `json:"orgaos_monitorados"`
	}

	s.db.QueryRow(ctx, `
		SELECT
			COUNT(*) FILTER (WHERE situacao_nome ILIKE '%vigente%' OR situacao_nome ILIKE '%publicada%'),
			COUNT(*) FILTER (WHERE score >= 80),
			COALESCE(SUM(valor_global) FILTER (WHERE NOT cancelado), 0),
			COUNT(*) FILTER (WHERE data_fim_vigencia::date = CURRENT_DATE)
		FROM editais
		WHERE NOT cancelado
	`).Scan(&stats.EditaisAtivos, &stats.Oportunidades, &stats.ValorTotal, &stats.EncerrandoHoje)

	s.db.QueryRow(ctx, `SELECT COUNT(DISTINCT numero_controle_pncp) FROM extracao_ia`).
		Scan(&stats.AnalisadosIA)

	s.db.QueryRow(ctx, `SELECT COUNT(*) FROM orgaos`).Scan(&stats.OrgaosMonit)

	writeJSON(w, stats)
}

// ── Editais ──────────────────────────────────────────────────

func (s *Server) handleListEditais(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	q := r.URL.Query()

	page, _ := strconv.Atoi(q.Get("page"))
	if page < 1 { page = 1 }
	limit := 50
	offset := (page - 1) * limit

	search    := q.Get("q")
	esfera    := q.Get("esfera")
	modalidade:= q.Get("modalidade")
	apenasIa  := q.Get("ia") == "true"

	rows, err := s.db.Query(ctx, `
		SELECT
			e.numero_controle_pncp, e.orgao_cnpj, o.nome as orgao_nome,
			o.esfera_id, e.modalidade_nome, e.situacao_nome, e.objeto_compra,
			e.data_publicacao, e.data_fim_vigencia, e.tem_resultado,
			e.valor_global, e.orcamento_sigiloso,
			COALESCE(sc.score, 0) as score,
			(ei.id IS NOT NULL) as analisado_ia
		FROM editais e
		JOIN orgaos o ON o.cnpj = e.orgao_cnpj
		LEFT JOIN scores sc ON sc.numero_controle_pncp = e.numero_controle_pncp
		LEFT JOIN documentos d ON d.numero_controle_pncp = e.numero_controle_pncp AND d.tipo = 'Edital'
		LEFT JOIN extracao_ia ei ON ei.documento_id = d.id
		WHERE e.cancelado = FALSE
		  AND ($1 = '' OR e.objeto_compra ILIKE '%' || $1 || '%' OR o.nome ILIKE '%' || $1 || '%')
		  AND ($2 = '' OR o.esfera_id = $2)
		  AND ($3 = '' OR e.modalidade_nome ILIKE '%' || $3 || '%')
		  AND (NOT $4 OR ei.id IS NOT NULL)
		ORDER BY e.data_fim_vigencia ASC NULLS LAST
		LIMIT $5 OFFSET $6
	`, search, esfera, modalidade, apenasIa, limit, offset)

	if err != nil {
		s.log.Error("list editais", "err", err)
		http.Error(w, "internal error", 500)
		return
	}
	defer rows.Close()

	type Row struct {
		ID              string   `json:"id"`
		OrgaoCNPJ       string   `json:"orgao_cnpj"`
		OrgaoNome       string   `json:"orgao_nome"`
		EsferaID        string   `json:"esfera_id"`
		ModalidadeNome  string   `json:"modalidade_nome"`
		SituacaoNome    string   `json:"situacao_nome"`
		ObjetoCompra    string   `json:"objeto_compra"`
		DataPublicacao  string   `json:"data_publicacao"`
		DataFimVigencia string   `json:"data_fim_vigencia"`
		TemResultado    bool     `json:"tem_resultado"`
		ValorGlobal     *float64 `json:"valor_global"`
		Sigiloso        bool     `json:"orcamento_sigiloso"`
		Score           int      `json:"match_score"`
		AnalisadoIA     bool     `json:"analisado_ia"`
	}

	var result []Row
	for rows.Next() {
		var row Row
		rows.Scan(
			&row.ID, &row.OrgaoCNPJ, &row.OrgaoNome, &row.EsferaID,
			&row.ModalidadeNome, &row.SituacaoNome, &row.ObjetoCompra,
			&row.DataPublicacao, &row.DataFimVigencia, &row.TemResultado,
			&row.ValorGlobal, &row.Sigiloso, &row.Score, &row.AnalisadoIA,
		)
		result = append(result, row)
	}

	writeJSON(w, map[string]any{"data": result, "page": page})
}

func (s *Server) handleGetEdital(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	ctx := r.Context()

	// Edital base
	var edital struct {
		NumeroControlePNCP string   `json:"numero_controle_pncp"`
		OrgaoCNPJ          string   `json:"orgao_cnpj"`
		OrgaoNome          string   `json:"orgao_nome"`
		EsferaID           string   `json:"esfera_id"`
		ModalidadeNome     string   `json:"modalidade_nome"`
		SituacaoNome       string   `json:"situacao_nome"`
		ObjetoCompra       string   `json:"objeto_compra"`
		DataPublicacao     string   `json:"data_publicacao"`
		DataFimVigencia    string   `json:"data_fim_vigencia"`
		TemResultado       bool     `json:"tem_resultado"`
		ValorGlobal        *float64 `json:"valor_global"`
		OrcamentoSigiloso  bool     `json:"orcamento_sigiloso"`
	}

	err := s.db.QueryRow(ctx, `
		SELECT e.numero_controle_pncp, e.orgao_cnpj, o.nome,
		       o.esfera_id, e.modalidade_nome, e.situacao_nome, e.objeto_compra,
		       e.data_publicacao, e.data_fim_vigencia, e.tem_resultado,
		       e.valor_global, e.orcamento_sigiloso
		FROM editais e
		JOIN orgaos o ON o.cnpj = e.orgao_cnpj
		WHERE e.numero_controle_pncp = $1
	`, id).Scan(
		&edital.NumeroControlePNCP, &edital.OrgaoCNPJ, &edital.OrgaoNome,
		&edital.EsferaID, &edital.ModalidadeNome, &edital.SituacaoNome, &edital.ObjetoCompra,
		&edital.DataPublicacao, &edital.DataFimVigencia, &edital.TemResultado,
		&edital.ValorGlobal, &edital.OrcamentoSigiloso,
	)
	if err != nil {
		http.Error(w, "not found", 404)
		return
	}

	// Itens
	type ItemRow struct {
		NumeroItem            int      `json:"numero_item"`
		DescricaoRaw          string   `json:"descricao_raw"`
		SoftwareNome          *string  `json:"software_nome"`
		Fabricante            *string  `json:"fabricante"`
		TipoLicenca           *string  `json:"tipo_licenca"`
		Quantidade            *float64 `json:"quantidade"`
		ValorUnitarioEstimado *float64 `json:"valor_unitario_estimado"`
		ValorTotal            *float64 `json:"valor_total"`
		OrcamentoSigiloso     bool     `json:"orcamento_sigiloso"`
	}
	var itens []ItemRow
	iRows, _ := s.db.Query(ctx, `
		SELECT numero_item, descricao_raw, software_nome, fabricante, tipo_licenca,
		       quantidade, valor_unitario_estimado, valor_total, orcamento_sigiloso
		FROM itens WHERE numero_controle_pncp = $1 ORDER BY numero_item
	`, id)
	if iRows != nil {
		defer iRows.Close()
		for iRows.Next() {
			var r ItemRow
			iRows.Scan(&r.NumeroItem, &r.DescricaoRaw, &r.SoftwareNome, &r.Fabricante,
				&r.TipoLicenca, &r.Quantidade, &r.ValorUnitarioEstimado, &r.ValorTotal, &r.OrcamentoSigiloso)
			itens = append(itens, r)
		}
	}

	// Documentos
	type DocRow struct {
		ID                  int    `json:"id"`
		Sequencial          int    `json:"sequencial"`
		Tipo                string `json:"tipo"`
		Titulo              string `json:"titulo"`
		URLDownload         string `json:"url_download"`
		StatusProcessamento string `json:"status_processamento"`
	}
	var docs []DocRow
	dRows, _ := s.db.Query(ctx, `
		SELECT id, sequencial, tipo, titulo, url_download, status_processamento
		FROM documentos WHERE numero_controle_pncp = $1 ORDER BY sequencial
	`, id)
	if dRows != nil {
		defer dRows.Close()
		for dRows.Next() {
			var r DocRow
			dRows.Scan(&r.ID, &r.Sequencial, &r.Tipo, &r.Titulo, &r.URLDownload, &r.StatusProcessamento)
			docs = append(docs, r)
		}
	}

	// Extração IA
	type IaRow struct {
		SoftwareNome       *string  `json:"software_nome"`
		Fabricante         *string  `json:"fabricante"`
		TipoLicenca        *string  `json:"tipo_licenca"`
		Quantidade         *float64 `json:"quantidade"`
		PrazoMeses         *int     `json:"prazo_meses"`
		ValorEstimado      *float64 `json:"valor_estimado"`
		OrcamentoSigiloso  bool     `json:"orcamento_sigiloso"`
		MarcaExigida       bool     `json:"marca_exigida"`
		PermiteEquivalente bool     `json:"permite_equivalente"`
		CriterioJulgamento *string  `json:"criterio_julgamento"`
		OrgaoUso           *string  `json:"orgao_uso"`
		Resumo             *string  `json:"resumo"`
		Confianca          float64  `json:"confianca"`
	}
	var ia *IaRow
	var iaRow IaRow
	iaErr := s.db.QueryRow(ctx, `
		SELECT ei.software_nome, ei.fabricante, ei.tipo_licenca,
		       ei.quantidade, ei.prazo_meses, ei.valor_estimado,
		       ei.orcamento_sigiloso, ei.marca_exigida, ei.permite_equivalente,
		       ei.criterio_julgamento, ei.orgao_uso, ei.resumo, ei.confianca
		FROM extracao_ia ei
		JOIN documentos d ON d.id = ei.documento_id
		WHERE d.numero_controle_pncp = $1
		ORDER BY ei.extraido_em DESC LIMIT 1
	`, id).Scan(
		&iaRow.SoftwareNome, &iaRow.Fabricante, &iaRow.TipoLicenca,
		&iaRow.Quantidade, &iaRow.PrazoMeses, &iaRow.ValorEstimado,
		&iaRow.OrcamentoSigiloso, &iaRow.MarcaExigida, &iaRow.PermiteEquivalente,
		&iaRow.CriterioJulgamento, &iaRow.OrgaoUso, &iaRow.Resumo, &iaRow.Confianca,
	)
	if iaErr == nil {
		ia = &iaRow
	}

	// Resultado
	type ResRow struct {
		FornecedorCNPJ string  `json:"fornecedor_cnpj"`
		FornecedorNome string  `json:"fornecedor_nome"`
		ValorFinal     float64 `json:"valor_final"`
		DataResultado  string  `json:"data_resultado"`
	}
	var resultado *ResRow
	var resRow ResRow
	resErr := s.db.QueryRow(ctx, `
		SELECT fornecedor_cnpj, fornecedor_nome, valor_final, data_resultado
		FROM resultados WHERE numero_controle_pncp = $1
	`, id).Scan(&resRow.FornecedorCNPJ, &resRow.FornecedorNome, &resRow.ValorFinal, &resRow.DataResultado)
	if resErr == nil {
		resultado = &resRow
	}

	// Score detalhado
	type ScoreRow struct {
		Score             int `json:"score"`
		ScorePrazo        int `json:"score_prazo"`
		ScoreValor        int `json:"score_valor"`
		ScoreConcorrencia int `json:"score_concorrencia"`
		ScoreEsfera       int `json:"score_esfera"`
		ScoreMarca        int `json:"score_marca"`
	}
	var scoreRow ScoreRow
	s.db.QueryRow(ctx, `
		SELECT score, score_prazo, score_valor, score_concorrencia, score_esfera, score_marca
		FROM scores WHERE numero_controle_pncp = $1
	`, id).Scan(&scoreRow.Score, &scoreRow.ScorePrazo, &scoreRow.ScoreValor,
		&scoreRow.ScoreConcorrencia, &scoreRow.ScoreEsfera, &scoreRow.ScoreMarca)

	writeJSON(w, map[string]any{
		"id":                 edital.NumeroControlePNCP,
		"orgao_cnpj":         edital.OrgaoCNPJ,
		"orgao_nome":         edital.OrgaoNome,
		"esfera_id":          edital.EsferaID,
		"modalidade_nome":    edital.ModalidadeNome,
		"situacao_nome":      edital.SituacaoNome,
		"objeto_compra":      edital.ObjetoCompra,
		"data_publicacao":    edital.DataPublicacao,
		"data_fim_vigencia":  edital.DataFimVigencia,
		"tem_resultado":      edital.TemResultado,
		"valor_global":       edital.ValorGlobal,
		"orcamento_sigiloso": edital.OrcamentoSigiloso,
		"itens":              itens,
		"documentos":         docs,
		"extracao_ia":        ia,
		"resultado":          resultado,
		"score":              scoreRow,
	})
}

// ── Órgãos ───────────────────────────────────────────────────

func (s *Server) handleListOrgaos(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	rows, err := s.db.Query(ctx, `
		SELECT o.cnpj, o.nome, o.esfera_id, o.uf,
		       COUNT(e.numero_controle_pncp) as total_editais,
		       COALESCE(SUM(e.valor_global), 0) as valor_total,
		       COUNT(e.numero_controle_pncp) FILTER (
		           WHERE e.situacao_nome ILIKE '%vigente%'
		       ) as editais_ativos
		FROM orgaos o
		LEFT JOIN editais e ON e.orgao_cnpj = o.cnpj AND NOT e.cancelado
		GROUP BY o.cnpj, o.nome, o.esfera_id, o.uf
		ORDER BY total_editais DESC
		LIMIT 100
	`)
	if err != nil {
		http.Error(w, "internal error", 500)
		return
	}
	defer rows.Close()

	type Row struct {
		CNPJ         string  `json:"cnpj"`
		Nome         string  `json:"nome"`
		EsferaID     string  `json:"esfera_id"`
		UF           string  `json:"uf"`
		TotalEditais int     `json:"total_editais"`
		ValorTotal   float64 `json:"valor_total"`
		EditaisAtivos int    `json:"editais_ativos"`
	}
	var result []Row
	for rows.Next() {
		var row Row
		rows.Scan(&row.CNPJ, &row.Nome, &row.EsferaID, &row.UF,
			&row.TotalEditais, &row.ValorTotal, &row.EditaisAtivos)
		result = append(result, row)
	}
	writeJSON(w, result)
}

func (s *Server) handleGetOrgao(w http.ResponseWriter, r *http.Request) {
	cnpj := chi.URLParam(r, "cnpj")
	ctx := r.Context()

	var orgao struct {
		CNPJ         string  `json:"cnpj"`
		Nome         string  `json:"nome"`
		EsferaID     string  `json:"esfera_id"`
		UF           string  `json:"uf"`
		TotalEditais int     `json:"total_editais"`
		ValorTotal   float64 `json:"valor_total"`
		EditaisAtivos int    `json:"editais_ativos"`
		TicketMedio  float64 `json:"ticket_medio"`
	}
	err := s.db.QueryRow(ctx, `
		SELECT o.cnpj, o.nome, o.esfera_id, o.uf,
		       COUNT(e.numero_controle_pncp),
		       COALESCE(SUM(e.valor_global), 0),
		       COUNT(e.numero_controle_pncp) FILTER (WHERE e.situacao_nome ILIKE '%vigente%'),
		       COALESCE(AVG(e.valor_global) FILTER (WHERE e.valor_global > 0), 0)
		FROM orgaos o
		LEFT JOIN editais e ON e.orgao_cnpj = o.cnpj AND NOT e.cancelado
		WHERE o.cnpj = $1
		GROUP BY o.cnpj, o.nome, o.esfera_id, o.uf
	`, cnpj).Scan(&orgao.CNPJ, &orgao.Nome, &orgao.EsferaID, &orgao.UF,
		&orgao.TotalEditais, &orgao.ValorTotal, &orgao.EditaisAtivos, &orgao.TicketMedio)
	if err != nil {
		http.Error(w, "not found", 404)
		return
	}

	// Top fornecedores
	type FornRow struct {
		CNPJ       string  `json:"cnpj"`
		Nome       string  `json:"nome"`
		Vitorias   int     `json:"vitorias"`
		ValorTotal float64 `json:"valor_total"`
	}
	var fornecedores []FornRow
	fRows, _ := s.db.Query(ctx, `
		SELECT r.fornecedor_cnpj, r.fornecedor_nome,
		       COUNT(*) as vitorias, COALESCE(SUM(r.valor_final), 0)
		FROM resultados r
		JOIN editais e ON e.numero_controle_pncp = r.numero_controle_pncp
		WHERE e.orgao_cnpj = $1
		GROUP BY r.fornecedor_cnpj, r.fornecedor_nome
		ORDER BY vitorias DESC
		LIMIT 10
	`, cnpj)
	if fRows != nil {
		defer fRows.Close()
		for fRows.Next() {
			var f FornRow
			fRows.Scan(&f.CNPJ, &f.Nome, &f.Vitorias, &f.ValorTotal)
			fornecedores = append(fornecedores, f)
		}
	}

	// Softwares mais comprados
	type SwRow struct {
		Nome  string `json:"nome"`
		Count int    `json:"count"`
	}
	var softwares []SwRow
	sRows, _ := s.db.Query(ctx, `
		SELECT COALESCE(i.software_nome, i.descricao_raw) as nome, COUNT(*) as c
		FROM itens i
		JOIN editais e ON e.numero_controle_pncp = i.numero_controle_pncp
		WHERE e.orgao_cnpj = $1 AND i.software_nome IS NOT NULL
		GROUP BY 1 ORDER BY 2 DESC LIMIT 8
	`, cnpj)
	if sRows != nil {
		defer sRows.Close()
		for sRows.Next() {
			var sw SwRow
			sRows.Scan(&sw.Nome, &sw.Count)
			softwares = append(softwares, sw)
		}
	}

	writeJSON(w, map[string]any{
		"cnpj":          orgao.CNPJ,
		"nome":          orgao.Nome,
		"esfera_id":     orgao.EsferaID,
		"uf":            orgao.UF,
		"total_editais": orgao.TotalEditais,
		"valor_total":   orgao.ValorTotal,
		"editais_ativos":orgao.EditaisAtivos,
		"ticket_medio":  orgao.TicketMedio,
		"fornecedores":  fornecedores,
		"softwares":     softwares,
	})
}

func (s *Server) handleOrgaoHistorico(w http.ResponseWriter, r *http.Request) {
	cnpj := chi.URLParam(r, "cnpj")
	ctx := r.Context()

	rows, err := s.db.Query(ctx, `
		SELECT EXTRACT(YEAR FROM data_publicacao) as ano,
		       COUNT(*) as total_editais,
		       COALESCE(SUM(valor_global), 0) as valor_total
		FROM editais
		WHERE orgao_cnpj = $1 AND NOT cancelado
		GROUP BY 1 ORDER BY 1
	`, cnpj)
	if err != nil {
		http.Error(w, "internal error", 500)
		return
	}
	defer rows.Close()

	type Row struct {
		Ano         int     `json:"ano"`
		TotalEditais int    `json:"total_editais"`
		ValorTotal  float64 `json:"valor_total"`
	}
	var result []Row
	for rows.Next() {
		var row Row
		rows.Scan(&row.Ano, &row.TotalEditais, &row.ValorTotal)
		result = append(result, row)
	}
	writeJSON(w, result)
}

// ── Helpers ──────────────────────────────────────────────────

func writeJSON(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(v)
}
