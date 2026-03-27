/**
 * Camada de acesso à API Go backend.
 * Em dev: http://localhost:8080
 * Em prod: variável de ambiente NEXT_PUBLIC_API_URL
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    next: { revalidate: 60 }, // cache de 60s no Next.js App Router
  });

  if (!res.ok) {
    throw new Error(`API ${path} retornou ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ── Tipos ────────────────────────────────────────────────────

export interface DashboardStats {
  editais_ativos:    number;
  oportunidades:     number;
  valor_total:       number;
  encerrando_hoje:   number;
  analisados_ia:     number;
  orgaos_monitorados:number;
}

export interface EditalAPI {
  id:               string; // numero_controle_pncp
  orgao_cnpj:       string;
  orgao_nome:       string;
  esfera_id:        "F" | "E" | "M";
  modalidade_nome:  string;
  situacao_nome:    string;
  objeto_compra:    string;
  data_publicacao:  string;
  data_fim_vigencia:string;
  tem_resultado:    boolean;
  valor_global:     number | null;
  orcamento_sigiloso: boolean;
  match_score:      number;
  analisado_ia:     boolean;
}

export interface EditalDetalhe extends EditalAPI {
  itens: ItemAPI[];
  documentos: DocumentoAPI[];
  extracao_ia: ExtracaoIA | null;
  resultado: ResultadoAPI | null;
}

export interface ItemAPI {
  numero_item:             number;
  descricao_raw:           string;
  software_nome:           string | null;
  fabricante:              string | null;
  tipo_licenca:            string | null;
  quantidade:              number | null;
  valor_unitario_estimado: number | null;
  valor_total:             number | null;
  orcamento_sigiloso:      boolean;
}

export interface DocumentoAPI {
  id:           number;
  sequencial:   number;
  tipo:         string;
  titulo:       string;
  url_download: string;
  status_processamento: string;
}

export interface ExtracaoIA {
  software_nome:       string | null;
  fabricante:          string | null;
  tipo_licenca:        string | null;
  quantidade:          number | null;
  prazo_meses:         number | null;
  valor_estimado:      number | null;
  orcamento_sigiloso:  boolean;
  marca_exigida:       boolean;
  permite_equivalente: boolean;
  criterio_julgamento: string | null;
  requisitos_tecnicos: string[];
  orgao_uso:           string | null;
  resumo:              string | null;
  confianca:           number;
}

export interface ResultadoAPI {
  fornecedor_cnpj:  string;
  fornecedor_nome:  string;
  valor_final:      number;
  data_resultado:   string;
}

export interface OrgaoAPI {
  cnpj:           string;
  nome:           string;
  esfera_id:      "F" | "E" | "M";
  uf:             string;
  total_editais:  number;
  valor_total:    number;
  editais_ativos: number;
}

export interface OrgaoDetalhe extends OrgaoAPI {
  historico: HistoricoAnual[];
  fornecedores: FornecedorAPI[];
}

export interface HistoricoAnual {
  ano:           number;
  total_editais: number;
  valor_total:   number;
}

export interface FornecedorAPI {
  cnpj:        string;
  nome:        string;
  vitorias:    number;
  valor_total: number;
}

export interface ListaEditaisResponse {
  data: EditalAPI[];
  page: number;
}

// ── Endpoints ────────────────────────────────────────────────

export const api = {
  // Dashboard
  dashboardStats: () =>
    apiFetch<DashboardStats>("/api/v1/dashboard/stats"),

  // Editais
  editais: (params?: {
    q?: string;
    esfera?: string;
    modalidade?: string;
    ia?: boolean;
    page?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.q)        qs.set("q",        params.q);
    if (params?.esfera)   qs.set("esfera",   params.esfera);
    if (params?.modalidade) qs.set("modalidade", params.modalidade);
    if (params?.ia)       qs.set("ia",       "true");
    if (params?.page)     qs.set("page",     String(params.page));
    const query = qs.toString();
    return apiFetch<ListaEditaisResponse>(`/api/v1/editais${query ? "?" + query : ""}`);
  },

  edital: (id: string) =>
    apiFetch<EditalDetalhe>(`/api/v1/editais/${encodeURIComponent(id)}`),

  // Órgãos
  orgaos: () =>
    apiFetch<OrgaoAPI[]>("/api/v1/orgaos"),

  orgao: (cnpj: string) =>
    apiFetch<OrgaoDetalhe>(`/api/v1/orgaos/${encodeURIComponent(cnpj)}`),

  orgaoHistorico: (cnpj: string) =>
    apiFetch<HistoricoAnual[]>(`/api/v1/orgaos/${encodeURIComponent(cnpj)}/historico`),
};
