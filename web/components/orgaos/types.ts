export interface OrgaoHistorico {
  ano: number;
  total_editais: number;
  valor_total: number;
  softwares: string[];
}

export interface OrgaoFornecedor {
  nome: string;
  cnpj: string;
  vitorias: number;
  valor_total: number;
  softwares: string[];
}

export interface Orgao {
  cnpj: string;
  nome: string;
  sigla: string;
  esfera: "F" | "E" | "M";
  uf: string;
  site?: string;
  total_editais_software: number;
  valor_total_historico: number;
  ticket_medio: number;
  editais_ativos: number;
  taxa_renovacao: number; // %
  historico_anual: OrgaoHistorico[];
  top_fornecedores: OrgaoFornecedor[];
  softwares_frequentes: { nome: string; count: number }[];
  ultima_contratacao: string;
}
