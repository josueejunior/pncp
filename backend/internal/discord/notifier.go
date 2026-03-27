// Package discord envia alertas para canais Discord via webhooks.
// Não tem dependência externa — usa apenas net/http.
package discord

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"time"
)

// Emojis e cores por tipo de alerta
const (
	ColorBlue   = 0x4f8ef7 // azul — novos editais
	ColorYellow = 0xf5a623 // amarelo — encerrando
	ColorGreen  = 0x3ecf8e // verde — resultado
	ColorPurple = 0xa78bfa // roxo — IA concluiu análise
)

type Notifier struct {
	webhookNovos      string
	webhookEncerrando string
	client            *http.Client
	log               *slog.Logger
}

func New() *Notifier {
	return &Notifier{
		webhookNovos:      os.Getenv("DISCORD_WEBHOOK_NOVOS"),
		webhookEncerrando: os.Getenv("DISCORD_WEBHOOK_ENCERRANDO"),
		client:            &http.Client{Timeout: 10 * time.Second},
		log:               slog.Default(),
	}
}

// ── Tipos de mensagem ─────────────────────────────────────────

type Embed struct {
	Title       string  `json:"title"`
	Description string  `json:"description"`
	Color       int     `json:"color"`
	URL         string  `json:"url,omitempty"`
	Fields      []Field `json:"fields,omitempty"`
	Footer      *Footer `json:"footer,omitempty"`
	Timestamp   string  `json:"timestamp,omitempty"`
}

type Field struct {
	Name   string `json:"name"`
	Value  string `json:"value"`
	Inline bool   `json:"inline"`
}

type Footer struct {
	Text string `json:"text"`
}

type Message struct {
	Username  string  `json:"username"`
	AvatarURL string  `json:"avatar_url,omitempty"`
	Embeds    []Embed `json:"embeds"`
}

// ── Alertas ───────────────────────────────────────────────────

type EditalInfo struct {
	NumeroControlePNCP string
	Titulo             string
	OrgaoNome          string
	EsferaID           string
	ModalidadeNome     string
	ValorGlobal        *float64
	OrcamentoSigiloso  bool
	DataFimVigencia    time.Time
	Score              int
	PNCPURL            string
}

// NotificarNovoEdital dispara alerta no canal de novos editais.
func (n *Notifier) NotificarNovoEdital(ctx context.Context, e EditalInfo) error {
	if n.webhookNovos == "" {
		return nil
	}

	valor := "🔒 Sigiloso"
	if !e.OrcamentoSigiloso && e.ValorGlobal != nil {
		valor = fmt.Sprintf("R$ %s", formatValor(*e.ValorGlobal))
	}

	esfera := map[string]string{"F": "Federal", "E": "Estadual", "M": "Municipal"}[e.EsferaID]
	diasRestantes := int(time.Until(e.DataFimVigencia).Hours() / 24)

	embed := Embed{
		Title:       fmt.Sprintf("🆕 Novo Edital de Software"),
		Description: fmt.Sprintf("**%s**\n%s", e.Titulo, e.OrgaoNome),
		Color:       ColorBlue,
		URL:         e.PNCPURL,
		Fields: []Field{
			{Name: "💰 Valor",      Value: valor,                                Inline: true},
			{Name: "🏛️ Esfera",    Value: esfera,                               Inline: true},
			{Name: "📋 Modalidade", Value: e.ModalidadeNome,                     Inline: true},
			{Name: "⏱️ Encerra em", Value: fmt.Sprintf("%d dias", diasRestantes), Inline: true},
			{Name: "🎯 Score",      Value: fmt.Sprintf("%d/100", e.Score),        Inline: true},
			{Name: "🆔 Controle",   Value: fmt.Sprintf("`%s`", e.NumeroControlePNCP), Inline: true},
		},
		Footer:    &Footer{Text: "PNCP Intel"},
		Timestamp: time.Now().Format(time.RFC3339),
	}

	return n.send(ctx, n.webhookNovos, Message{
		Username: "PNCP Intel",
		Embeds:   []Embed{embed},
	})
}

// NotificarEncerrando dispara alerta para editais com menos de N dias.
func (n *Notifier) NotificarEncerrando(ctx context.Context, e EditalInfo, diasRestantes int) error {
	if n.webhookEncerrando == "" {
		return nil
	}

	urgencia := "⚠️"
	color := ColorYellow
	if diasRestantes <= 2 {
		urgencia = "🚨"
		color = 0xf25f5c // vermelho
	}

	valor := "🔒 Sigiloso"
	if !e.OrcamentoSigiloso && e.ValorGlobal != nil {
		valor = fmt.Sprintf("R$ %s", formatValor(*e.ValorGlobal))
	}

	embed := Embed{
		Title:       fmt.Sprintf("%s Encerrando em %d dias", urgencia, diasRestantes),
		Description: fmt.Sprintf("**%s**\n%s", e.Titulo, e.OrgaoNome),
		Color:       color,
		URL:         e.PNCPURL,
		Fields: []Field{
			{Name: "💰 Valor",    Value: valor,                                   Inline: true},
			{Name: "🎯 Score",    Value: fmt.Sprintf("%d/100", e.Score),           Inline: true},
			{Name: "📅 Data",     Value: e.DataFimVigencia.Format("02/01/2006"),   Inline: true},
			{Name: "🆔 Controle", Value: fmt.Sprintf("`%s`", e.NumeroControlePNCP), Inline: false},
		},
		Footer:    &Footer{Text: "PNCP Intel"},
		Timestamp: time.Now().Format(time.RFC3339),
	}

	return n.send(ctx, n.webhookEncerrando, Message{
		Username: "PNCP Intel",
		Embeds:   []Embed{embed},
	})
}

// NotificarResultado avisa quando um edital tem resultado (vencedor definido).
func (n *Notifier) NotificarResultado(ctx context.Context, e EditalInfo, fornecedor string, valorFinal float64) error {
	webhook := n.webhookNovos // usa o mesmo canal de novos por padrão
	if webhook == "" {
		return nil
	}

	embed := Embed{
		Title:       "✅ Resultado Publicado",
		Description: fmt.Sprintf("**%s**\n%s", e.Titulo, e.OrgaoNome),
		Color:       ColorGreen,
		URL:         e.PNCPURL,
		Fields: []Field{
			{Name: "🏆 Vencedor",     Value: fornecedor,                          Inline: false},
			{Name: "💰 Valor Final",   Value: fmt.Sprintf("R$ %s", formatValor(valorFinal)), Inline: true},
			{Name: "🆔 Controle",      Value: fmt.Sprintf("`%s`", e.NumeroControlePNCP), Inline: true},
		},
		Footer:    &Footer{Text: "PNCP Intel"},
		Timestamp: time.Now().Format(time.RFC3339),
	}

	return n.send(ctx, webhook, Message{
		Username: "PNCP Intel",
		Embeds:   []Embed{embed},
	})
}

// NotificarAnaliseIA avisa quando o Gemini concluiu a análise de um lote.
func (n *Notifier) NotificarAnaliseIA(ctx context.Context, processados int, oportunidades int) error {
	webhook := n.webhookNovos
	if webhook == "" {
		return nil
	}

	embed := Embed{
		Title:       "🤖 Análise IA Concluída",
		Description: fmt.Sprintf("Gemini processou **%d editais** neste ciclo.", processados),
		Color:       ColorPurple,
		Fields: []Field{
			{Name: "📊 Processados",   Value: fmt.Sprintf("%d PDFs", processados),   Inline: true},
			{Name: "🎯 Oportunidades", Value: fmt.Sprintf("%d (score ≥ 80)", oportunidades), Inline: true},
		},
		Footer:    &Footer{Text: "PNCP Intel · Gemini 2.0 Flash"},
		Timestamp: time.Now().Format(time.RFC3339),
	}

	return n.send(ctx, webhook, Message{
		Username: "PNCP Intel IA",
		Embeds:   []Embed{embed},
	})
}

// ── Interno ───────────────────────────────────────────────────

func (n *Notifier) send(ctx context.Context, webhookURL string, msg Message) error {
	body, err := json.Marshal(msg)
	if err != nil {
		return fmt.Errorf("marshal discord msg: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, webhookURL, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("create discord request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := n.client.Do(req)
	if err != nil {
		return fmt.Errorf("discord request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("discord webhook retornou %d", resp.StatusCode)
	}

	n.log.Debug("discord: alerta enviado", "status", resp.StatusCode)
	return nil
}

func formatValor(v float64) string {
	if v >= 1_000_000 {
		return fmt.Sprintf("%.1fM", v/1_000_000)
	}
	if v >= 1_000 {
		return fmt.Sprintf("%.0fk", v/1_000)
	}
	return fmt.Sprintf("%.0f", v)
}
