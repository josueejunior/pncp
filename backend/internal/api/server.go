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

	writeJSON(w, edital)
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
		CNPJ  string `json:"cnpj"`
		Nome  string `json:"nome"`
		Esfera string `json:"esfera_id"`
		UF    string `json:"uf"`
	}
	err := s.db.QueryRow(ctx,
		`SELECT cnpj, nome, esfera_id, uf FROM orgaos WHERE cnpj = $1`, cnpj,
	).Scan(&orgao.CNPJ, &orgao.Nome, &orgao.Esfera, &orgao.UF)
	if err != nil {
		http.Error(w, "not found", 404)
		return
	}
	writeJSON(w, orgao)
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
