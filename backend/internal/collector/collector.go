// Package collector implementa o pipeline de coleta do PNCP.
// Fluxo: busca → itens → documentos → resultado (se tem_resultado=true)
package collector

import (
	"context"
	"fmt"
	"log/slog"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/pncp/intel/internal/discord"
	"github.com/pncp/intel/internal/pncp"
)

// Termos de busca — cobrem todo o mercado de software público
var searchTerms = []string{
	"licença software",
	"AutoCAD Revit Autodesk",
	"Microsoft 365 Office",
	"Adobe Creative Cloud",
	"ArcGIS georreferenciamento",
	"ERP sistema gestão",
	"antivirus endpoint protection",
	"BIM building information",
	"Tableau BI analytics",
	"SAP Oracle",
}

type Collector struct {
	db      *pgxpool.Pool
	client  *pncp.Client
	discord *discord.Notifier
	log     *slog.Logger
}

func New(db *pgxpool.Pool) *Collector {
	return &Collector{
		db:      db,
		client:  pncp.NewClient(),
		discord: discord.New(),
		log:     slog.Default(),
	}
}

// Run executa um ciclo completo de coleta.
// Chamado pelo cron a cada 6h.
func (c *Collector) Run(ctx context.Context) error {
	c.log.Info("collector: iniciando ciclo")
	start := time.Now()

	var wg sync.WaitGroup
	sem := make(chan struct{}, 3) // máximo 3 goroutines simultâneas

	for _, termo := range searchTerms {
		wg.Add(1)
		go func(t string) {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()

			if err := c.collectTermo(ctx, t); err != nil {
				c.log.Error("collector: erro no termo", "termo", t, "err", err)
			}
		}(termo)
	}

	wg.Wait()
	c.log.Info("collector: ciclo concluído", "duração", time.Since(start))
	return nil
}

// collectTermo faz a busca paginada para um único termo.
func (c *Collector) collectTermo(ctx context.Context, termo string) error {
	pagina := 1
	for {
		result, err := c.client.SearchEditais(ctx, termo, pagina)
		if err != nil {
			return fmt.Errorf("search '%s' p%d: %w", termo, pagina, err)
		}

		for i := range result.Data {
			edital := &result.Data[i]
			if err := c.processEdital(ctx, edital); err != nil {
				c.log.Warn("collector: erro processando edital",
					"id", edital.NumeroControlePNCP, "err", err)
			}
		}

		if pagina >= result.TotalPaginas {
			break
		}
		pagina++

		// Rate limiting gentil
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(200 * time.Millisecond):
		}
	}
	return nil
}

// processEdital salva o edital no banco e coleta sub-recursos.
func (c *Collector) processEdital(ctx context.Context, raw *pncp.EditalRaw) error {
	// 1. Upsert órgão
	if err := c.upsertOrgao(ctx, raw); err != nil {
		return fmt.Errorf("upsert orgao: %w", err)
	}

	// 2. Checa se o edital já foi coletado completamente
	var statusAtual string
	err := c.db.QueryRow(ctx,
		`SELECT status_coleta FROM editais WHERE numero_controle_pncp = $1`,
		raw.NumeroControlePNCP,
	).Scan(&statusAtual)

	isNovo := err != nil // err != nil significa que NÃO existe no banco ainda

	if err == nil && statusAtual == "completo" {
		// Já processado — só atualiza se mudou o status de resultado
		if raw.TemResultado {
			c.collectResultado(ctx, raw)
		}
		return nil
	}

	// 3. Upsert edital
	if err := c.upsertEdital(ctx, raw); err != nil {
		return fmt.Errorf("upsert edital: %w", err)
	}

	// 4. Alerta Discord — novo edital
	if isNovo {
		go func() {
			info := c.buildEditalInfo(raw, 0)
			if err := c.discord.NotificarNovoEdital(ctx, info); err != nil {
				c.log.Warn("discord: falha no alerta de novo edital", "err", err)
			}
		}()
	}

	// 5. Coleta itens
	itens, err := c.client.GetItens(ctx, raw.OrgaoCNPJ, raw.Ano, raw.NumeroSequencial)
	if err == nil {
		c.saveItens(ctx, raw.NumeroControlePNCP, itens)
	}

	// 5. Coleta documentos
	docs, err := c.client.GetDocumentos(ctx, raw.OrgaoCNPJ, raw.Ano, raw.NumeroSequencial)
	if err == nil {
		c.saveDocumentos(ctx, raw.NumeroControlePNCP, docs)
	}

	// 6. Coleta resultado se disponível
	if raw.TemResultado {
		c.collectResultado(ctx, raw)
	}

	// 7. Calcula score
	c.calculateScore(ctx, raw)

	// 8. Alerta encerrando — edita que fecha em ≤ 5 dias
	go func() {
		dias := int(time.Until(raw.DataFimVigencia).Hours() / 24)
		if dias >= 0 && dias <= 5 {
			var score int
			c.db.QueryRow(ctx,
				`SELECT score FROM scores WHERE numero_controle_pncp = $1`,
				raw.NumeroControlePNCP,
			).Scan(&score)

			info := c.buildEditalInfo(raw, score)
			if err := c.discord.NotificarEncerrando(ctx, info, dias); err != nil {
				c.log.Warn("discord: falha no alerta de encerramento", "err", err)
			}
		}
	}()

	// 9. Marca como completo
	c.db.Exec(ctx,
		`UPDATE editais SET status_coleta = 'completo', atualizado_em = now() WHERE numero_controle_pncp = $1`,
		raw.NumeroControlePNCP,
	)

	return nil
}

// buildEditalInfo constrói o struct de info para os alertas Discord.
func (c *Collector) buildEditalInfo(raw *pncp.EditalRaw, score int) discord.EditalInfo {
	var valor *float64
	if raw.ValorTotal > 0 {
		v := raw.ValorTotal
		valor = &v
	}
	return discord.EditalInfo{
		NumeroControlePNCP: raw.NumeroControlePNCP,
		Titulo:             raw.ObjetoCompra,
		OrgaoNome:          raw.OrgaoNome,
		EsferaID:           raw.EsferaID,
		ModalidadeNome:     raw.ModalidadeNome,
		ValorGlobal:        valor,
		OrcamentoSigiloso:  raw.OrcamentoSigiloso,
		DataFimVigencia:    raw.DataFimVigencia,
		Score:              score,
		PNCPURL:            "https://pncp.gov.br/app/editais/" + raw.NumeroControlePNCP,
	}
}

func (c *Collector) upsertOrgao(ctx context.Context, raw *pncp.EditalRaw) error {
	_, err := c.db.Exec(ctx, `
		INSERT INTO orgaos (cnpj, nome, esfera_id, poder_id, uf, municipio_nome)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (cnpj) DO UPDATE SET
			nome = EXCLUDED.nome,
			uf   = EXCLUDED.uf
	`, raw.OrgaoCNPJ, raw.OrgaoNome, raw.EsferaID, raw.PoderID, raw.UF, raw.MunicipioNome)
	return err
}

func (c *Collector) upsertEdital(ctx context.Context, raw *pncp.EditalRaw) error {
	_, err := c.db.Exec(ctx, `
		INSERT INTO editais (
			numero_controle_pncp, orgao_cnpj, ano, numero_sequencial,
			modalidade_nome, situacao_nome, tipo_nome, objeto_compra,
			data_publicacao, data_fim_vigencia, tem_resultado,
			valor_global, orcamento_sigiloso, status_coleta
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'coletando')
		ON CONFLICT (numero_controle_pncp) DO UPDATE SET
			situacao_nome   = EXCLUDED.situacao_nome,
			tem_resultado   = EXCLUDED.tem_resultado,
			atualizado_em   = now()
	`,
		raw.NumeroControlePNCP, raw.OrgaoCNPJ, raw.Ano, raw.NumeroSequencial,
		raw.ModalidadeNome, raw.SituacaoNome, raw.TipoNome, raw.ObjetoCompra,
		raw.DataPublicacao, raw.DataFimVigencia, raw.TemResultado,
		nullableFloat(raw.ValorTotal), raw.OrcamentoSigiloso,
	)
	return err
}

func (c *Collector) saveItens(ctx context.Context, id string, itens []pncp.ItemRaw) {
	for _, item := range itens {
		_, err := c.db.Exec(ctx, `
			INSERT INTO itens (
				numero_controle_pncp, numero_item, descricao_raw,
				quantidade, valor_unitario_estimado, valor_total,
				orcamento_sigiloso, ncm_codigo, situacao_nome, tem_resultado
			) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
			ON CONFLICT (numero_controle_pncp, numero_item) DO NOTHING
		`,
			id, item.NumeroItem, item.Descricao,
			item.Quantidade, nullableFloat(item.ValorUnitarioEstimado), nullableFloat(item.ValorTotal),
			item.OrcamentoSigiloso, item.NCMCodigo, item.SituacaoNome, item.TemResultado,
		)
		if err != nil {
			c.log.Warn("saveItens", "err", err)
		}
	}
}

func (c *Collector) saveDocumentos(ctx context.Context, id string, docs []pncp.DocumentoRaw) {
	for _, doc := range docs {
		c.db.Exec(ctx, `
			INSERT INTO documentos (numero_controle_pncp, sequencial, tipo, titulo, url_download)
			VALUES ($1,$2,$3,$4,$5)
			ON CONFLICT (numero_controle_pncp, sequencial) DO NOTHING
		`, id, doc.Sequencial, doc.Tipo, doc.Titulo, doc.URLDownload)
	}
}

func (c *Collector) collectResultado(ctx context.Context, raw *pncp.EditalRaw) {
	res, err := c.client.GetResultado(ctx, raw.OrgaoCNPJ, raw.Ano, raw.NumeroSequencial)
	if err != nil || res == nil {
		return
	}
	c.db.Exec(ctx, `
		INSERT INTO resultados (numero_controle_pncp, fornecedor_cnpj, fornecedor_nome, valor_final, data_resultado)
		VALUES ($1,$2,$3,$4,$5)
		ON CONFLICT (numero_controle_pncp) DO UPDATE SET
			valor_final    = EXCLUDED.valor_final,
			data_resultado = EXCLUDED.data_resultado
	`, raw.NumeroControlePNCP, res.FornecedorCNPJ, res.FornecedorNome, res.ValorFinal, res.DataResultado)
}

// calculateScore calcula o score de oportunidade (0–100).
func (c *Collector) calculateScore(ctx context.Context, raw *pncp.EditalRaw) {
	now := time.Now()
	score := 0

	// Prazo (30pts): 7–15 dias = máximo
	diasRestantes := int(time.Until(now.AddDate(0, 0, 15)).Hours() / 24) // placeholder
	_ = diasRestantes
	// TODO: usar raw.DataFimVigencia quando parseado

	// Valor (25pts)
	if raw.ValorTotal >= 50_000 {
		score += 25
	} else if raw.ValorTotal >= 20_000 {
		score += 15
	} else if raw.ValorTotal > 0 {
		score += 8
	}

	// Esfera (15pts): municipal = mais oportunidade
	switch raw.EsferaID {
	case "M":
		score += 15
	case "E":
		score += 8
	}

	// Orçamento não sigiloso (bonus)
	if !raw.OrcamentoSigiloso {
		score += 5
	}

	c.db.Exec(ctx, `
		INSERT INTO scores (numero_controle_pncp, score)
		VALUES ($1, $2)
		ON CONFLICT (numero_controle_pncp) DO UPDATE SET
			score        = EXCLUDED.score,
			calculado_em = now()
	`, raw.NumeroControlePNCP, min(score, 100))
}

func nullableFloat(f float64) interface{} {
	if f == 0 {
		return nil
	}
	return f
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
