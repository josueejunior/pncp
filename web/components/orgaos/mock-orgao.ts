import type { Orgao } from "./types";

export const MOCK_ORGAO: Orgao = {
  cnpj: "46.392.130/0001-10",
  nome: "Prefeitura Municipal de São Paulo",
  sigla: "PMSP",
  esfera: "M",
  uf: "SP",
  site: "https://www.prefeitura.sp.gov.br",
  total_editais_software: 34,
  valor_total_historico: 1_840_000,
  ticket_medio: 54_117,
  editais_ativos: 3,
  taxa_renovacao: 78,
  ultima_contratacao: "2025-03-10",
  historico_anual: [
    { ano: 2021, total_editais: 5,  valor_total: 210_000, softwares: ["AutoCAD", "Microsoft 365"] },
    { ano: 2022, total_editais: 7,  valor_total: 320_000, softwares: ["AutoCAD", "Adobe CC", "Microsoft 365"] },
    { ano: 2023, total_editais: 9,  valor_total: 480_000, softwares: ["AutoCAD", "Adobe CC", "ArcGIS", "SAP"] },
    { ano: 2024, total_editais: 8,  valor_total: 390_000, softwares: ["AutoCAD", "Microsoft 365", "Tableau"] },
    { ano: 2025, total_editais: 5,  valor_total: 440_000, softwares: ["AutoCAD", "Adobe CC", "Microsoft 365"] },
  ],
  top_fornecedores: [
    { nome: "TechBR Soluções Ltda",    cnpj: "12.345.678/0001-00", vitorias: 12, valor_total: 620_000, softwares: ["AutoCAD", "Microsoft 365"] },
    { nome: "SoftGov Brasil",           cnpj: "98.765.432/0001-00", vitorias: 8,  valor_total: 380_000, softwares: ["Adobe CC", "ArcGIS"] },
    { nome: "Infomatic Tecnologia",     cnpj: "11.222.333/0001-00", vitorias: 6,  valor_total: 290_000, softwares: ["SAP", "Tableau"] },
    { nome: "DataSolutions Governo",    cnpj: "44.555.666/0001-00", vitorias: 5,  valor_total: 210_000, softwares: ["AutoCAD", "Bentley"] },
    { nome: "Sistemas Públicos S.A.",   cnpj: "77.888.999/0001-00", vitorias: 3,  valor_total: 140_000, softwares: ["Microsoft 365"] },
  ],
  softwares_frequentes: [
    { nome: "AutoCAD",          count: 14 },
    { nome: "Microsoft 365",    count: 11 },
    { nome: "Adobe Creative Cloud", count: 7 },
    { nome: "ArcGIS",           count: 5  },
    { nome: "SAP",              count: 4  },
    { nome: "Tableau",          count: 3  },
  ],
};
