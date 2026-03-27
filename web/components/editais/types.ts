export type ModalidadeId = "pregao" | "dispensa" | "inexigibilidade" | "concorrencia";
export type EsferaId = "F" | "E" | "M";
export type StatusId = "ativo" | "encerrando" | "encerrado" | "resultado";

export interface Edital {
  id: string;
  numero_controle_pncp: string;
  titulo: string;
  orgao: string;
  orgao_cnpj: string;
  esfera: EsferaId;
  modalidade: ModalidadeId;
  status: StatusId;
  valor_estimado: number | null;
  orcamento_sigiloso: boolean;
  data_abertura: string;
  data_encerramento: string;
  softwares: string[];
  analisado_ia: boolean;
  match_score: number; // 0-100
}
