import { AppShell } from "@/components/layout/AppShell";
import { IaAnalysisCard } from "@/components/editais/IaAnalysisCard";
import { StatusBadge, ModalidadeBadge, EsferaBadge } from "@/components/editais/StatusBadge";
import { MOCK_EDITAIS } from "@/components/editais/mock-data";
import { api } from "@/lib/api";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Building2,
  FileText,
  ExternalLink,
  Hash,
  Download,
} from "lucide-react";
import type { EsferaId, ModalidadeId, StatusId } from "@/components/editais/types";

interface Props {
  params: Promise<{ id: string }>;
}

async function getData(id: string) {
  try {
    const edital = await api.edital(id);
    const modalidade: ModalidadeId = edital.modalidade_nome.toLowerCase().includes("pregão") ? "pregao"
      : edital.modalidade_nome.toLowerCase().includes("dispensa") ? "dispensa"
      : edital.modalidade_nome.toLowerCase().includes("inexigibilidade") ? "inexigibilidade"
      : "concorrencia";

    const dias = Math.ceil((new Date(edital.data_fim_vigencia).getTime() - Date.now()) / 86400000);
    const status: StatusId = edital.tem_resultado ? "resultado"
      : dias < 0 ? "encerrado"
      : dias <= 5 ? "encerrando"
      : "ativo";

    return { edital, modalidade, status, diasRestantes: dias };
  } catch {
    // Fallback mock
    const mock = MOCK_EDITAIS.find((e) => e.id === id) ?? MOCK_EDITAIS[0];
    return {
      edital: {
        id: mock.id,
        orgao_cnpj: mock.orgao_cnpj,
        orgao_nome: mock.orgao,
        esfera_id: mock.esfera,
        modalidade_nome: mock.modalidade,
        situacao_nome: mock.status,
        objeto_compra: mock.titulo,
        data_publicacao: mock.data_abertura,
        data_fim_vigencia: mock.data_encerramento,
        tem_resultado: mock.status === "resultado",
        valor_global: mock.valor_estimado,
        orcamento_sigiloso: mock.orcamento_sigiloso,
        itens: [],
        documentos: [],
        extracao_ia: null,
        resultado: null,
      },
      modalidade: mock.modalidade,
      status: mock.status,
      diasRestantes: Math.ceil((new Date(mock.data_encerramento).getTime() - Date.now()) / 86400000),
    };
  }
}

export default async function EditalPerfilPage({ params }: Props) {
  const { id } = await params;
  const { edital, modalidade, status, diasRestantes } = await getData(id);

  return (
    <AppShell
      title={`Edital #${edital.id}`}
      subtitle={edital.orgao_nome}
    >
      <Link
        href="/editais"
        className="inline-flex items-center gap-2 text-sm mb-6 transition-colors duration-150 hover:text-white"
        style={{ color: "var(--muted-foreground)" }}
      >
        <ArrowLeft size={15} />
        Voltar para Editais
      </Link>

      {/* Header */}
      <div
        className="rounded-xl p-6 mb-6"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex flex-col gap-3 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <EsferaBadge esfera={edital.esfera_id as EsferaId} />
              <StatusBadge status={status} />
              <ModalidadeBadge modalidade={modalidade} />
            </div>
            <h1 className="text-xl font-semibold leading-snug" style={{ color: "var(--foreground)" }}>
              {edital.objeto_compra}
            </h1>
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
              <Building2 size={14} />
              {edital.orgao_nome}
            </div>
          </div>

          <div className="flex gap-4 lg:flex-col lg:items-end">
            {!edital.orcamento_sigiloso && edital.valor_global && (
              <div className="flex flex-col items-end">
                <span className="text-xs uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>
                  Valor Estimado
                </span>
                <span className="text-2xl font-mono font-bold tabular-nums" style={{ color: "var(--clr-green)" }}>
                  R$ {edital.valor_global.toLocaleString("pt-BR")}
                </span>
              </div>
            )}
            {diasRestantes >= 0 && (
              <div
                className="flex flex-col items-end px-4 py-2 rounded-lg"
                style={{
                  background: diasRestantes <= 5 ? "rgba(245,166,35,0.10)" : "rgba(79,142,247,0.08)",
                  border: `1px solid ${diasRestantes <= 5 ? "rgba(245,166,35,0.25)" : "var(--border)"}`,
                }}
              >
                <span className="text-xs uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>
                  Encerra em
                </span>
                <span
                  className="text-xl font-mono font-bold"
                  style={{ color: diasRestantes <= 5 ? "var(--clr-yellow)" : "var(--primary)" }}
                >
                  {diasRestantes === 0 ? "Hoje" : `${diasRestantes} dias`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Metadados */}
        <div
          className="mt-5 pt-5 grid grid-cols-2 sm:grid-cols-4 gap-4"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {[
            { icon: Hash,      label: "Nº Controle",  value: edital.id },
            { icon: FileText,  label: "CNPJ Órgão",   value: edital.orgao_cnpj },
            { icon: Calendar,  label: "Abertura",     value: new Date(edital.data_publicacao).toLocaleDateString("pt-BR") },
            { icon: Calendar,  label: "Encerramento", value: new Date(edital.data_fim_vigencia).toLocaleDateString("pt-BR") },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>
                <Icon size={11} />
                {label}
              </div>
              <span className="text-sm font-mono" style={{ color: "var(--foreground)" }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* IA Pulse — momento assinatura */}
      <div className="mb-6">
        <IaAnalysisCard extracao={edital.extracao_ia} />
      </div>

      {/* Itens + Ações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Itens do edital */}
        <div
          className="rounded-xl p-5"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--foreground)" }}>
            Itens do Edital
          </h3>
          {edital.itens.length === 0 ? (
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              Itens carregados após análise IA
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {edital.itens.map((item) => (
                <div
                  key={item.numero_item}
                  className="flex items-start justify-between gap-3 p-3 rounded-lg"
                  style={{ background: "rgba(79,142,247,0.05)", border: "1px solid var(--border)" }}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>
                      Item {item.numero_item}
                    </span>
                    <span className="text-sm" style={{ color: "var(--foreground)" }}>
                      {item.software_nome ?? item.descricao_raw}
                    </span>
                    {item.fabricante && (
                      <span className="text-xs" style={{ color: "var(--clr-ai)" }}>{item.fabricante}</span>
                    )}
                  </div>
                  {item.valor_total && (
                    <span className="text-sm font-mono font-semibold shrink-0" style={{ color: "var(--clr-green)" }}>
                      R$ {item.valor_total.toLocaleString("pt-BR")}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ações */}
        <div
          className="rounded-xl p-5 flex flex-col gap-3"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--foreground)" }}>
            Ações
          </h3>
          {[
            {
              icon: ExternalLink,
              label: "Abrir no PNCP",
              href: `https://pncp.gov.br/app/editais/${edital.id}`,
              color: "var(--primary)",
              bg: "rgba(79,142,247,0.10)",
              border: "rgba(79,142,247,0.25)",
            },
            {
              icon: Building2,
              label: "Ver Dossiê do Órgão",
              href: `/orgaos/${encodeURIComponent(edital.orgao_cnpj)}`,
              color: "var(--clr-ai)",
              bg: "rgba(167,139,250,0.10)",
              border: "rgba(167,139,250,0.25)",
            },
          ].map(({ icon: Icon, label, href, color, bg, border }) => (
            <Link
              key={label}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 hover:opacity-80"
              style={{ background: bg, border: `1px solid ${border}`, color }}
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}

          {/* Documentos */}
          {edital.documentos.length > 0 && (
            <div className="mt-2 flex flex-col gap-2">
              <span className="text-xs uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>
                Documentos
              </span>
              {edital.documentos.map((doc) => (
                <a
                  key={doc.id}
                  href={doc.url_download}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 hover:opacity-80"
                  style={{
                    background: "rgba(62,207,142,0.10)",
                    border: "1px solid rgba(62,207,142,0.25)",
                    color: "var(--clr-green)",
                  }}
                >
                  <Download size={15} />
                  {doc.titulo || doc.tipo}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
