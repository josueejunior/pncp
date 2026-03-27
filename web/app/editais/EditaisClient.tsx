"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { EditaisFilters, type Filters } from "@/components/editais/EditaisFilters";
import { EditaisTable } from "@/components/editais/EditaisTable";
import { MOCK_EDITAIS } from "@/components/editais/mock-data";
import { api, type EditalAPI } from "@/lib/api";
import type { Edital } from "@/components/editais/types";

// Mapeia EditalAPI (backend) → Edital (frontend)
function mapEdital(e: EditalAPI): Edital {
  const modalidade = e.modalidade_nome.toLowerCase().includes("pregão") ? "pregao"
    : e.modalidade_nome.toLowerCase().includes("dispensa") ? "dispensa"
    : e.modalidade_nome.toLowerCase().includes("inexigibilidade") ? "inexigibilidade"
    : "concorrencia";

  const status = e.tem_resultado ? "resultado"
    : (() => {
        const dias = Math.ceil((new Date(e.data_fim_vigencia).getTime() - Date.now()) / 86400000);
        if (dias < 0) return "encerrado";
        if (dias <= 5) return "encerrando";
        return "ativo";
      })();

  return {
    id: e.id,
    numero_controle_pncp: e.id,
    titulo: e.objeto_compra,
    orgao: e.orgao_nome,
    orgao_cnpj: e.orgao_cnpj,
    esfera: e.esfera_id,
    modalidade,
    status,
    valor_estimado: e.valor_global,
    orcamento_sigiloso: e.orcamento_sigiloso,
    data_abertura: e.data_publicacao,
    data_encerramento: e.data_fim_vigencia,
    softwares: [],
    analisado_ia: e.analisado_ia,
    match_score: e.match_score,
  };
}

// Converte MOCK para Edital (já está no tipo correto)
function useMockFallback(): Edital[] {
  return MOCK_EDITAIS;
}

export function EditaisClient() {
  const [filters, setFilters] = useState<Filters>({
    search: "",
    status: "all",
    modalidade: "all",
    esfera: "all",
    apenasIa: false,
  });

  const [editais, setEditais] = useState<Edital[]>([]);
  const [loading, setLoading] = useState(true);
  const mockData = useMockFallback();

  const fetchEditais = useCallback(async () => {
    try {
      const res = await api.editais({
        q:          filters.search || undefined,
        esfera:     filters.esfera !== "all" ? filters.esfera : undefined,
        modalidade: filters.modalidade !== "all" ? filters.modalidade : undefined,
        ia:         filters.apenasIa || undefined,
      });
      setEditais(res.data.map(mapEdital));
    } catch {
      // Backend não disponível — usa mock
      setEditais(mockData);
    } finally {
      setLoading(false);
    }
  }, [filters.search, filters.esfera, filters.modalidade, filters.apenasIa, mockData]);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(fetchEditais, 300); // debounce na busca
    return () => clearTimeout(timer);
  }, [fetchEditais]);

  // Filtros client-side para status (não tem no backend ainda)
  const filtered = useMemo(() => {
    if (filters.status === "all") return editais;
    return editais.filter((e) => e.status === filters.status);
  }, [editais, filters.status]);

  return (
    <div className="flex flex-col gap-5">
      <EditaisFilters
        filters={filters}
        onChange={setFilters}
        total={editais.length}
        filtered={filtered.length}
      />
      <EditaisTable editais={filtered} loading={loading} />
    </div>
  );
}
