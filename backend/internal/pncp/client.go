// Package pncp implementa o cliente para a API pública do Portal Nacional de Contratações Públicas.
// Documentação: https://treina.pncp.gov.br/api-docs
package pncp

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"time"
)

const (
	BaseURL    = "https://pncp.gov.br/api/pncp/v1"
	SearchURL  = "https://pncp.gov.br/api/search"
	PageSize   = 50
	MaxRetries = 3
)

// Client é o cliente HTTP para a API PNCP.
type Client struct {
	http    *http.Client
	baseURL string
}

func NewClient() *Client {
	return &Client{
		http: &http.Client{
			Timeout: 30 * time.Second,
		},
		baseURL: BaseURL,
	}
}

// ── Tipos da API ─────────────────────────────────────────────

type SearchResult struct {
	TotalRegistros int           `json:"totalRegistros"`
	TotalPaginas   int           `json:"totalPaginas"`
	Data           []EditalRaw   `json:"data"`
}

type EditalRaw struct {
	NumeroControlePNCP string  `json:"numeroControlePNCP"`
	OrgaoCNPJ          string  `json:"orgaoEntidade.cnpj"`
	OrgaoNome          string  `json:"orgaoEntidade.razaoSocial"`
	EsferaID           string  `json:"orgaoEntidade.esferaId"`
	PoderID            string  `json:"orgaoEntidade.poderId"`
	UF                 string  `json:"unidadeOrgao.ufSigla"`
	MunicipioNome      string  `json:"unidadeOrgao.municipioNome"`
	Ano                int     `json:"anoCompra"`
	NumeroSequencial   int     `json:"sequencialCompra"`
	ModalidadeNome     string  `json:"modalidadeLicitacaoNome"`
	SituacaoNome       string  `json:"situacaoCompraNome"`
	TipoNome           string  `json:"tipoInstrumentoConvocatorioNome"`
	ObjetoCompra       string  `json:"objetoCompra"`
	DataPublicacao     string    `json:"dataPublicacaoPncp"`
	DataFimVigencia    time.Time `json:"dataFimVigencia"`
	TemResultado       bool    `json:"temResultado"`
	ValorTotal         float64 `json:"valorTotalEstimado"`
	OrcamentoSigiloso  bool    `json:"orcamentoSigiloso"`
}

type ItemRaw struct {
	NumeroItem            int     `json:"numeroItem"`
	Descricao             string  `json:"descricao"`
	Quantidade            float64 `json:"quantidade"`
	ValorUnitarioEstimado float64 `json:"valorUnitarioEstimado"`
	ValorTotal            float64 `json:"valorTotal"`
	OrcamentoSigiloso     bool    `json:"orcamentoSigiloso"`
	NCMCodigo             string  `json:"ncmNbsCodigo"`
	SituacaoNome          string  `json:"situacaoCompraItemNome"`
	TemResultado          bool    `json:"temResultado"`
}

type DocumentoRaw struct {
	Sequencial  int    `json:"sequencialDocumento"`
	Tipo        string `json:"tipoDocumentoNome"`
	Titulo      string `json:"titulo"`
	URLDownload string `json:"url"`
}

type ResultadoRaw struct {
	FornecedorCNPJ string  `json:"niFornecedor"`
	FornecedorNome string  `json:"nomeRazaoSocialFornecedor"`
	ValorFinal     float64 `json:"valorTotal"`
	DataResultado  string  `json:"dataResultado"`
}

// ── Métodos ──────────────────────────────────────────────────

// SearchEditais busca editais de software no PNCP.
// termo: palavra-chave (ex: "software licença", "AutoCAD")
// pagina: começa em 1
func (c *Client) SearchEditais(ctx context.Context, termo string, pagina int) (*SearchResult, error) {
	params := url.Values{
		"q":               {termo},
		"tipos_documento": {"edital"},
		"ordenacao":       {"-data"},
		"tam_pagina":      {strconv.Itoa(PageSize)},
		"pagina":          {strconv.Itoa(pagina)},
	}

	resp, err := c.get(ctx, SearchURL+"?"+params.Encode())
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result SearchResult
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("decode search: %w", err)
	}
	return &result, nil
}

// GetItens retorna os itens de um edital.
func (c *Client) GetItens(ctx context.Context, cnpj string, ano, seq int) ([]ItemRaw, error) {
	path := fmt.Sprintf("/orgaos/%s/compras/%d/%d/itens?pagina=1&tamanhoPagina=500", cnpj, ano, seq)
	resp, err := c.get(ctx, c.baseURL+path)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var items []ItemRaw
	if err := json.NewDecoder(resp.Body).Decode(&items); err != nil {
		return nil, fmt.Errorf("decode itens: %w", err)
	}
	return items, nil
}

// GetDocumentos retorna a lista de arquivos de um edital.
func (c *Client) GetDocumentos(ctx context.Context, cnpj string, ano, seq int) ([]DocumentoRaw, error) {
	path := fmt.Sprintf("/orgaos/%s/compras/%d/%d/arquivos", cnpj, ano, seq)
	resp, err := c.get(ctx, c.baseURL+path)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var docs []DocumentoRaw
	if err := json.NewDecoder(resp.Body).Decode(&docs); err != nil {
		return nil, fmt.Errorf("decode documentos: %w", err)
	}
	return docs, nil
}

// GetResultado retorna o resultado de uma licitação.
func (c *Client) GetResultado(ctx context.Context, cnpj string, ano, seq int) (*ResultadoRaw, error) {
	path := fmt.Sprintf("/orgaos/%s/compras/%d/%d/resultado", cnpj, ano, seq)
	resp, err := c.get(ctx, c.baseURL+path)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, nil
	}

	var resultado ResultadoRaw
	if err := json.NewDecoder(resp.Body).Decode(&resultado); err != nil {
		return nil, fmt.Errorf("decode resultado: %w", err)
	}
	return &resultado, nil
}

// DownloadPDF faz o download de um PDF e retorna os bytes.
func (c *Client) DownloadPDF(ctx context.Context, urlDownload string) ([]byte, error) {
	resp, err := c.get(ctx, urlDownload)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	data, err := io.ReadAll(io.LimitReader(resp.Body, 50<<20)) // max 50MB
	if err != nil {
		return nil, fmt.Errorf("read pdf: %w", err)
	}
	return data, nil
}

// ── Utilitários internos ─────────────────────────────────────

func (c *Client) get(ctx context.Context, rawURL string) (*http.Response, error) {
	var (
		resp *http.Response
		err  error
	)
	for attempt := 0; attempt < MaxRetries; attempt++ {
		if attempt > 0 {
			select {
			case <-ctx.Done():
				return nil, ctx.Err()
			case <-time.After(time.Duration(attempt) * 2 * time.Second):
			}
		}

		req, reqErr := http.NewRequestWithContext(ctx, http.MethodGet, rawURL, nil)
		if reqErr != nil {
			return nil, fmt.Errorf("create request: %w", reqErr)
		}
		req.Header.Set("Accept", "application/json")
		req.Header.Set("User-Agent", "pncp-intel/1.0")

		resp, err = c.http.Do(req)
		if err != nil {
			continue
		}
		if resp.StatusCode == http.StatusTooManyRequests {
			resp.Body.Close()
			continue
		}
		if resp.StatusCode >= 500 {
			resp.Body.Close()
			continue
		}
		return resp, nil
	}
	return nil, fmt.Errorf("request failed after %d attempts: %w", MaxRetries, err)
}
