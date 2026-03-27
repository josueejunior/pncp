// Package gemini processa PDFs de editais usando Gemini 2.0 Flash.
// O modelo recebe o PDF em base64 e retorna JSON estruturado com os campos extraídos.
package gemini

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

const (
	geminiModel = "gemini-2.0-flash"
	geminiAPI   = "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s"
	// Máximo de PDFs processados por ciclo (respeita quota Gemini)
	batchSize = 10
)

// ExtractionResult é o JSON que o Gemini devolve.
type ExtractionResult struct {
	SoftwareNome       string   `json:"software_nome"`
	Fabricante         string   `json:"fabricante"`
	TipoLicenca        string   `json:"tipo_licenca"` // subscription|perpetua|saas|volume
	Quantidade         float64  `json:"quantidade"`
	PrazoMeses         int      `json:"prazo_meses"`
	ValorEstimado      *float64 `json:"valor_estimado"`
	OrcamentoSigiloso  bool     `json:"orcamento_sigiloso"`
	MarcaExigida       bool     `json:"marca_exigida"`
	PermiteEquivalente bool     `json:"permite_equivalente"`
	CriterioJulgamento string   `json:"criterio_julgamento"`
	RequistosTecnicos  []string `json:"requisitos_tecnicos"`
	OrgaoUso           string   `json:"orgao_uso"`
	Resumo             string   `json:"resumo"`
}

var prompt = `Você é um analisador especializado em editais de licitação pública brasileira de software.
Analise o edital em PDF e extraia os dados abaixo em JSON. Seja preciso; use null para campos não encontrados.

Responda APENAS com o JSON válido, sem markdown, sem explicação:

{
  "software_nome": "nome comercial exato do software",
  "fabricante": "empresa fabricante/desenvolvedora",
  "tipo_licenca": "subscription|perpetua|saas|volume|outro",
  "quantidade": número (licenças/usuários/acessos),
  "prazo_meses": número (duração do contrato em meses),
  "valor_estimado": número ou null (valor total em reais),
  "orcamento_sigiloso": boolean,
  "marca_exigida": boolean (true se o edital exige marca/fabricante específico),
  "permite_equivalente": boolean (true se aceita produto equivalente),
  "criterio_julgamento": "menor_preco|melhor_tecnica|tecnica_preco",
  "requisitos_tecnicos": ["lista de requisitos técnicos obrigatórios"],
  "orgao_uso": "departamento/secretaria que vai usar o software",
  "resumo": "2-3 frases em português explicando a oportunidade comercial para um revendedor de software"
}`

type Worker struct {
	db     *pgxpool.Pool
	apiKey string
	client *http.Client
	log    *slog.Logger
}

func New(db *pgxpool.Pool) *Worker {
	return &Worker{
		db:     db,
		apiKey: os.Getenv("GEMINI_API_KEY"),
		client: &http.Client{Timeout: 60 * time.Second},
		log:    slog.Default(),
	}
}

// ProcessPendentes busca documentos pendentes e os processa em lote.
func (w *Worker) ProcessPendentes(ctx context.Context) (int, error) {
	if w.apiKey == "" {
		return 0, fmt.Errorf("GEMINI_API_KEY não configurada")
	}

	// Busca documentos do tipo "Edital" pendentes
	rows, err := w.db.Query(ctx, `
		SELECT id, url_download, numero_controle_pncp
		FROM documentos
		WHERE tipo ILIKE '%edital%'
		  AND status_processamento = 'pendente'
		ORDER BY id ASC
		LIMIT $1
	`, batchSize)
	if err != nil {
		return 0, fmt.Errorf("query documentos pendentes: %w", err)
	}
	defer rows.Close()

	type docRow struct {
		ID                 int
		URLDownload        string
		NumeroControlePNCP string
	}

	var docs []docRow
	for rows.Next() {
		var d docRow
		if err := rows.Scan(&d.ID, &d.URLDownload, &d.NumeroControlePNCP); err != nil {
			continue
		}
		docs = append(docs, d)
	}

	if len(docs) == 0 {
		return 0, nil
	}

	processed := 0
	for _, doc := range docs {
		// Marca como processando
		w.db.Exec(ctx, `UPDATE documentos SET status_processamento = 'processando' WHERE id = $1`, doc.ID)

		result, err := w.processDocument(ctx, doc.URLDownload)
		if err != nil {
			w.log.Error("gemini: erro processando documento", "id", doc.ID, "err", err)
			w.db.Exec(ctx, `UPDATE documentos SET status_processamento = 'erro' WHERE id = $1`, doc.ID)
			continue
		}

		if err := w.saveExtraction(ctx, doc.ID, result); err != nil {
			w.log.Error("gemini: erro salvando extração", "id", doc.ID, "err", err)
			continue
		}

		// Atualiza item com dados extraídos pela IA
		w.db.Exec(ctx, `
			UPDATE itens SET
				software_nome = $2,
				fabricante    = $3,
				tipo_licenca  = $4
			WHERE numero_controle_pncp = $1
			  AND software_nome IS NULL
		`, doc.NumeroControlePNCP, result.SoftwareNome, result.Fabricante, result.TipoLicenca)

		w.db.Exec(ctx, `
			UPDATE documentos SET
				status_processamento = 'concluido',
				processado_em        = now()
			WHERE id = $1
		`, doc.ID)

		processed++
		w.log.Info("gemini: documento processado",
			"id", doc.ID,
			"software", result.SoftwareNome,
			"confianca", result.calcConfianca(),
		)

		// Respeita rate limit: 1 req/s no free tier
		select {
		case <-ctx.Done():
			return processed, ctx.Err()
		case <-time.After(1100 * time.Millisecond):
		}
	}

	return processed, nil
}

// processDocument faz o download do PDF e envia para o Gemini.
func (w *Worker) processDocument(ctx context.Context, pdfURL string) (*ExtractionResult, error) {
	// Download do PDF
	pdfBytes, err := w.downloadPDF(ctx, pdfURL)
	if err != nil {
		return nil, fmt.Errorf("download pdf: %w", err)
	}

	// Encode em base64
	pdfB64 := base64.StdEncoding.EncodeToString(pdfBytes)

	// Monta request para Gemini
	reqBody := map[string]any{
		"contents": []map[string]any{
			{
				"parts": []map[string]any{
					{"text": prompt},
					{
						"inline_data": map[string]any{
							"mime_type": "application/pdf",
							"data":      pdfB64,
						},
					},
				},
			},
		},
		"generationConfig": map[string]any{
			"temperature":     0.1, // baixa temperatura = respostas consistentes
			"maxOutputTokens": 1024,
			"responseMimeType": "application/json",
		},
	}

	body, _ := json.Marshal(reqBody)
	url := fmt.Sprintf(geminiAPI, geminiModel, w.apiKey)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := w.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("gemini api call: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("gemini retornou %d: %s", resp.StatusCode, string(respBody))
	}

	// Parse resposta Gemini
	var geminiResp struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text string `json:"text"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&geminiResp); err != nil {
		return nil, fmt.Errorf("decode gemini response: %w", err)
	}

	if len(geminiResp.Candidates) == 0 || len(geminiResp.Candidates[0].Content.Parts) == 0 {
		return nil, fmt.Errorf("gemini retornou resposta vazia")
	}

	rawJSON := geminiResp.Candidates[0].Content.Parts[0].Text

	var result ExtractionResult
	if err := json.Unmarshal([]byte(rawJSON), &result); err != nil {
		return nil, fmt.Errorf("parse json extraído: %w — raw: %s", err, rawJSON)
	}

	return &result, nil
}

func (w *Worker) saveExtraction(ctx context.Context, docID int, r *ExtractionResult) error {
	_, err := w.db.Exec(ctx, `
		INSERT INTO extracao_ia (
			documento_id, modelo_ia,
			software_nome, fabricante, tipo_licenca,
			quantidade, prazo_meses, valor_estimado,
			orcamento_sigiloso, marca_exigida, permite_equivalente,
			criterio_julgamento, requisitos_tecnicos, orgao_uso,
			resumo, confianca
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
		ON CONFLICT (documento_id) DO UPDATE SET
			software_nome   = EXCLUDED.software_nome,
			fabricante      = EXCLUDED.fabricante,
			confianca       = EXCLUDED.confianca,
			extraido_em     = now()
	`,
		docID, geminiModel,
		nullStr(r.SoftwareNome), nullStr(r.Fabricante), nullStr(r.TipoLicenca),
		r.Quantidade, r.PrazoMeses, r.ValorEstimado,
		r.OrcamentoSigiloso, r.MarcaExigida, r.PermiteEquivalente,
		nullStr(r.CriterioJulgamento), r.RequistosTecnicos, nullStr(r.OrgaoUso),
		nullStr(r.Resumo), r.calcConfianca(),
	)
	return err
}

func (w *Worker) downloadPDF(ctx context.Context, url string) ([]byte, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "pncp-intel/1.0")

	resp, err := w.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	return io.ReadAll(io.LimitReader(resp.Body, 50<<20)) // max 50MB
}

// calcConfianca retorna um score de confiança baseado nos campos preenchidos.
func (r *ExtractionResult) calcConfianca() float64 {
	filled := 0
	total := 8
	if r.SoftwareNome != "" { filled++ }
	if r.Fabricante != ""   { filled++ }
	if r.TipoLicenca != ""  { filled++ }
	if r.Quantidade > 0     { filled++ }
	if r.PrazoMeses > 0     { filled++ }
	if r.ValorEstimado != nil { filled++ }
	if r.CriterioJulgamento != "" { filled++ }
	if r.Resumo != ""       { filled++ }
	return float64(filled) / float64(total)
}

func nullStr(s string) interface{} {
	if s == "" {
		return nil
	}
	return s
}
