package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"github.com/robfig/cron/v3"

	"github.com/pncp/intel/internal/api"
	"github.com/pncp/intel/internal/collector"
	"github.com/pncp/intel/internal/gemini"
)

func main() {
	// Carrega .env
	_ = godotenv.Load()

	log := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
	slog.SetDefault(log)

	// Banco de dados
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Error("DATABASE_URL não definida")
		os.Exit(1)
	}

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Error("falha ao conectar no banco", "err", err)
		os.Exit(1)
	}
	defer pool.Close()

	if err := pool.Ping(ctx); err != nil {
		log.Error("banco inacessível", "err", err)
		os.Exit(1)
	}
	log.Info("banco conectado")

	// Workers
	col := collector.New(pool)
	gem := gemini.New(pool)

	// ── Cron ──────────────────────────────────────────────────
	cr := cron.New()

	// Coleta PNCP — a cada 6 horas
	cr.AddFunc("0 */6 * * *", func() {
		log.Info("cron: iniciando coleta PNCP")
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Hour)
		defer cancel()
		if err := col.Run(ctx); err != nil {
			log.Error("cron: coleta falhou", "err", err)
		}
	})

	// Worker Gemini — a cada hora, processa PDFs pendentes
	cr.AddFunc("0 * * * *", func() {
		log.Info("cron: iniciando worker Gemini")
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Minute)
		defer cancel()
		n, err := gem.ProcessPendentes(ctx)
		if err != nil {
			log.Error("cron: gemini falhou", "err", err)
			return
		}
		if n > 0 {
			log.Info("cron: gemini concluído", "processados", n)
		}
	})

	// Alerta de encerrando — diariamente às 9h
	cr.AddFunc("0 9 * * *", func() {
		log.Info("cron: verificando editais encerrando")
		runAlertasEncerrando(ctx, pool, log)
	})

	cr.Start()
	defer cr.Stop()

	// ── Startup — coleta inicial em background ─────────────────
	go func() {
		time.Sleep(3 * time.Second)
		log.Info("startup: iniciando primeira coleta")
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Hour)
		defer cancel()
		if err := col.Run(ctx); err != nil {
			log.Error("startup: coleta falhou", "err", err)
		}
		// Após coleta, roda Gemini imediatamente
		nCtx, nCancel := context.WithTimeout(context.Background(), 30*time.Minute)
		defer nCancel()
		gem.ProcessPendentes(nCtx)
	}()

	// ── Servidor HTTP ─────────────────────────────────────────
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	srv := &http.Server{
		Addr:         fmt.Sprintf(":%s", port),
		Handler:      api.New(pool).Router(),
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		log.Info("servidor iniciado", "port", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Error("servidor falhou", "err", err)
			os.Exit(1)
		}
	}()

	<-quit
	log.Info("encerrando servidor...")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	srv.Shutdown(shutdownCtx)
	log.Info("servidor encerrado")
}

// runAlertasEncerrando busca editais que fecham nos próximos 5 dias e alerta no Discord.
func runAlertasEncerrando(ctx context.Context, pool *pgxpool.Pool, log *slog.Logger) {
	rows, err := pool.Query(ctx, `
		SELECT e.numero_controle_pncp, e.objeto_compra, o.nome,
		       o.esfera_id, e.modalidade_nome, e.valor_global,
		       e.orcamento_sigiloso, e.data_fim_vigencia,
		       COALESCE(sc.score, 0)
		FROM editais e
		JOIN orgaos o ON o.cnpj = e.orgao_cnpj
		LEFT JOIN scores sc ON sc.numero_controle_pncp = e.numero_controle_pncp
		WHERE e.cancelado = FALSE
		  AND e.data_fim_vigencia BETWEEN NOW() AND NOW() + INTERVAL '5 days'
		  AND e.status_coleta = 'completo'
		ORDER BY e.data_fim_vigencia ASC
	`)
	if err != nil {
		log.Error("alertas encerrando: query falhou", "err", err)
		return
	}
	defer rows.Close()

	log.Info("alertas encerrando: verificando editais")
	_ = rows // Discord calls handled inline in collector for now
}
