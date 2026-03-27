# Módulo de análise profunda de órgão — Agente PNCP

> Baseado na conversa real: você tem conhecimento interno das empresas dominantes na sua
> região, trabalhou nas duas, e quer usar isso para entrar no mercado. Este módulo
> implementa o "dossiê de órgão" — a análise completa que o agente faz antes de você
> entrar em qualquer pregão. Cobre: quem está enraizado, como eles operam, o jogo do
> pregoeiro, e o playbook passo a passo para vencer mesmo assim.

---

## Sumário

1. [O que o agente precisa saber sobre um órgão antes do pregão](#1-o-que-o-agente-precisa-saber-sobre-um-órgão-antes-do-pregão)
2. [Fontes de dados para montar o dossiê](#2-fontes-de-dados-para-montar-o-dossiê)
3. [Schema do dossiê de órgão](#3-schema-do-dossiê-de-órgão)
4. [Código completo — gerador de dossiê](#4-código-completo--gerador-de-dossiê)
5. [Como o agente detecta o nível de enraizamento](#5-como-o-agente-detecta-o-nível-de-enraizamento)
6. [O jogo do pregoeiro — o que o agente analisa](#6-o-jogo-do-pregoeiro--o-que-o-agente-analisa)
7. [Playbook de entrada — passo a passo gerado pelo agente](#7-playbook-de-entrada--passo-a-passo-gerado-pelo-agente)
8. [Exemplo real de dossiê gerado](#8-exemplo-real-de-dossiê-gerado)
9. [Prompt Gemini para análise profunda do edital](#9-prompt-gemini-para-análise-profunda-do-edital)
10. [Integração com o sistema principal](#10-integração-com-o-sistema-principal)

---

## 1. O que o agente precisa saber sobre um órgão antes do pregão

Quando você identificar um edital interessante, o agente deve responder
automaticamente 7 perguntas críticas:

```
PERGUNTA 1 — Quem domina esse órgão?
  → Qual CNPJ venceu os últimos N contratos para esse tipo de software?
  → Por quanto tempo esse fornecedor está consecutivo?
  → Qual o % de concentração (quanto do total foi pago para ele)?

PERGUNTA 2 — Como eles ganham sempre?
  → O edital tem especificações que só o produto deles atende?
  → Exige atestado de capacidade técnica desproporcional?
  → O prazo de implantação é viável para um novo entrante?

PERGUNTA 3 — Qual o preço que eles praticam?
  → Qual o valor médio dos últimos contratos?
  → O orçamento sigiloso foi revelado em algum documento?
  → Qual o preço mínimo já registrado para esse objeto?

PERGUNTA 4 — Quem é o pregoeiro?
  → Nome do servidor responsável pelas licitações de TI
  → Quantos anos no cargo (quanto mais tempo, mais enraizado o relacionamento)
  → Ele foi pregoeiro dos contratos anteriores com o mesmo fornecedor?

PERGUNTA 5 — Qual a saúde financeira do contrato atual?
  → O contrato está perto do vencimento? (ciclo de renovação)
  → Houve termos aditivos de prazo ou valor? (indicam insatisfação ou retenção)
  → Houve reclamações ou penalidades registradas?

PERGUNTA 6 — Qual a janela de oportunidade?
  → O PCA do órgão prevê essa contratação para quando?
  → Quantos dias até o encerramento do edital?
  → Qual a modalidade? (dispensa = mais fácil, pregão = mais trabalhoso)

PERGUNTA 7 — Qual a minha chance real?
  → Score de oportunidade (0-100)
  → Nível de enraizamento do concorrente (baixo/médio/alto/crítico)
  → Estratégia recomendada (preço/técnica/impugnar/visita/aguardar)
```

---

## 2. Fontes de dados para montar o dossiê

```
FONTE 1 — PNCP API de resultados
  Endpoint: /orgaos/{cnpj}/compras/{ano}/{seq}/itens/{n}/resultados
  O que dá: CNPJ do vencedor, valor final, quantidade, marca
  Limitação: só disponível quando tem_resultado=true

FONTE 2 — PNCP API de contratos
  Endpoint: /api/consulta/v1/contratos?cnpjOrgao={cnpj}&dataInicial={d}
  O que dá: todos os contratos firmados, valor, vigência, CNPJ contratado
  Limitação: paginação de 500/página

FONTE 3 — PNCP API de histórico
  Endpoint: /orgaos/{cnpj}/compras/{ano}/{seq}/historico
  O que dá: retificações, cancelamentos, log de operações
  Uso: detectar editais que foram alterados (suspeito de direcionamento)

FONTE 4 — PNCP Search API (busca textual)
  Endpoint: /api/search/?q={software}&orgao_id={id}&status=todos
  O que dá: todos os editais históricos desse órgão para esse software
  Filtro: status=todos captura até os cancelados e os sem resultado

FONTE 5 — Portal da Transparência Federal
  URL: portaldatransparencia.gov.br/contratos?cnpjContratado={cnpj_fornecedor}
  O que dá: todos os contratos do fornecedor dominante com o governo federal
  Uso: mapear o tamanho real do concorrente e outros clientes

FONTE 6 — Receita Federal (dados públicos via CNPJ.ws)
  URL: https://publica.cnpj.ws/cnpj/{cnpj_fornecedor}
  O que dá: data de abertura, quadro societário, endereço, situação cadastral
  Uso: saber se o fornecedor é uma empresa local, nacional, ou revendedor

FONTE 7 — PDF do edital (via Gemini)
  O que dá: especificações técnicas detalhadas, exigências de atestado,
            prazo de implantação, critérios de julgamento, marca citada
  Uso: detectar direcionamento e calcular viabilidade de participação
```

---

## 3. Schema do dossiê de órgão

```python
# models/dossie.py
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

@dataclass
class FornecedorHistorico:
    cnpj: str
    nome: str
    contratos_ganhos: int
    valor_total: float
    primeiro_contrato: datetime
    ultimo_contrato: datetime
    anos_consecutivos: int
    pct_participacao: float          # % do total pago pelo órgão
    eh_dominante: bool               # True se > 70% dos contratos
    tipo: str                        # "fabricante" | "revendedor" | "integrador"

@dataclass
class ContratoPrecedente:
    numero_controle: str
    objeto: str
    valor: float
    data_inicio: datetime
    data_fim: datetime
    fornecedor_cnpj: str
    fornecedor_nome: str
    tem_aditivo: bool
    meses_vigencia: int
    preco_unitario: Optional[float]
    quantidade: Optional[float]
    marca: Optional[str]

@dataclass
class SinalDirecoinamento:
    tipo: str          # "marca_citada" | "atestado_irreal" | "prazo_curto" | ...
    descricao: str
    trecho: str
    gravidade: str     # "alta" | "media" | "baixa"
    lei: str

@dataclass
class JanelaOportunidade:
    dias_ate_encerramento: int
    data_encerramento: Optional[datetime]
    modalidade: str
    valor_estimado: Optional[float]
    orcamento_sigiloso: bool
    valor_estimado_historico: float   # baseado nos contratos anteriores
    lancealvo: float                  # 18% abaixo da média histórica
    pca_previsto: bool                # se consta no PCA do ano

@dataclass
class DossieOrgao:
    # Identificação
    cnpj: str
    nome: str
    municipio: str
    uf: str
    esfera: str
    
    # Histórico de compras para esse nicho/software
    total_contratos_historico: int
    valor_total_historico: float
    software_mais_comprado: str
    
    # Mapa de fornecedores
    fornecedores: list[FornecedorHistorico]
    fornecedor_dominante: Optional[FornecedorHistorico]
    nivel_enraizamento: str    # "baixo" | "medio" | "alto" | "critico"
    
    # Contratos precedentes (últimos 5 anos)
    contratos: list[ContratoPrecedente]
    contrato_atual: Optional[ContratoPrecedente]
    meses_para_renovacao: Optional[int]
    
    # Análise do edital atual (se houver)
    edital_atual_id: Optional[str]
    sinais_direcionamento: list[SinalDirecoinamento]
    score_direcionamento: int     # 0-100
    
    # Janela de oportunidade
    janela: Optional[JanelaOportunidade]
    
    # Score e estratégia
    score_oportunidade: int       # 0-100
    estrategia_recomendada: str   # veja seção 7
    acoes_imediatas: list[str]
    
    # Metadados
    gerado_em: datetime
    fonte_dados: list[str]
```

---

## 4. Código completo — gerador de dossiê

```python
# agente/modulos/dossie_orgao.py

import asyncio
import json
from datetime import datetime, timedelta
from typing import Optional
import httpx

BASE_PNCP   = "https://pncp.gov.br/api/pncp/v1"
BASE_CONSULTA = "https://pncp.gov.br/api/consulta/v1"
BASE_SEARCH = "https://pncp.gov.br/api/search"
BASE_CNPJWS = "https://publica.cnpj.ws/cnpj"

async def gerar_dossie(
    cnpj_orgao: str,
    nicho: str,          # "gis" | "erp" | "saude" | "educacao" etc
    db,                  # conexão PostgreSQL
    gemini,              # instância do ProcessadorArquivos
) -> dict:
    """
    Gera o dossiê completo de um órgão para um nicho específico.
    Retorna dicionário pronto para salvar no banco e renderizar no dashboard.
    """
    async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:

        # ── PASSO 1: Dados do órgão ──────────────────────────────────────
        orgao = await buscar_dados_orgao(client, cnpj_orgao)

        # ── PASSO 2: Histórico de contratos (últimos 5 anos) ─────────────
        contratos = await buscar_contratos_historico(client, cnpj_orgao, anos=5)
        contratos_nicho = filtrar_por_nicho(contratos, nicho)

        # ── PASSO 3: Mapa de fornecedores ────────────────────────────────
        fornecedores = calcular_mapa_fornecedores(contratos_nicho)
        dominante = next((f for f in fornecedores if f["eh_dominante"]), None)

        # ── PASSO 4: Editais históricos no PNCP ──────────────────────────
        editais = await buscar_editais_historico(client, cnpj_orgao, nicho)

        # ── PASSO 5: Edital ativo (se houver) ────────────────────────────
        edital_ativo = next(
            (e for e in editais if e.get("situacaoCompraId") == 1), None
        )

        # ── PASSO 6: Análise do edital com IA (se houver) ─────────────────
        sinais = []
        score_dir = 0
        if edital_ativo:
            cnpj = edital_ativo["orgaoEntidade"]["cnpj"]
            ano = edital_ativo["anoCompra"]
            seq = edital_ativo["sequencialCompra"]
            resultados_ia = await gemini.processar_edital(cnpj, ano, seq)
            for r in resultados_ia:
                sinais_ia = r.get("dados_extraidos", {}).get("sinais_monopolio", [])
                sinais.extend(sinais_ia)
            score_dir = min(len(sinais) * 15, 100)

        # ── PASSO 7: Calcular janela e preço-alvo ────────────────────────
        preco_historico = calcular_preco_medio(contratos_nicho)
        janela = calcular_janela(edital_ativo, preco_historico)

        # ── PASSO 8: Score e estratégia ──────────────────────────────────
        nivel = calcular_nivel_enraizamento(dominante, contratos_nicho)
        score_op = calcular_score_oportunidade(janela, nivel, sinais, dominante)
        estrategia = definir_estrategia(nivel, score_dir, janela, score_op)
        acoes = gerar_acoes_imediatas(estrategia, edital_ativo, sinais, janela)

        return {
            "orgao": orgao,
            "cnpj": cnpj_orgao,
            "nicho": nicho,
            "total_contratos": len(contratos_nicho),
            "valor_total_historico": sum(c.get("valorGlobal", 0) for c in contratos_nicho),
            "fornecedores": fornecedores,
            "dominante": dominante,
            "nivel_enraizamento": nivel,
            "contratos": contratos_nicho[:10],   # últimos 10
            "edital_ativo": edital_ativo,
            "sinais_direcionamento": sinais,
            "score_direcionamento": score_dir,
            "janela": janela,
            "score_oportunidade": score_op,
            "estrategia": estrategia,
            "acoes_imediatas": acoes,
            "gerado_em": datetime.utcnow().isoformat(),
        }


# ── Funções auxiliares ────────────────────────────────────────────────────────

async def buscar_contratos_historico(client, cnpj_orgao: str, anos: int = 5) -> list:
    """Busca todos os contratos de um órgão nos últimos N anos."""
    contratos = []
    data_ini = (datetime.utcnow() - timedelta(days=anos * 365)).strftime("%Y%m%d")
    data_fim = datetime.utcnow().strftime("%Y%m%d")
    pagina = 1

    while True:
        url = (
            f"{BASE_CONSULTA}/contratos"
            f"?cnpjOrgao={cnpj_orgao}"
            f"&dataInicial={data_ini}&dataFinal={data_fim}"
            f"&pagina={pagina}&tamanhoPagina=500"
        )
        resp = await client.get(url)
        if resp.status_code != 200:
            break
        data = resp.json()
        contratos.extend(data.get("data", []))
        if data.get("paginasRestantes", 0) == 0:
            break
        pagina += 1
        await asyncio.sleep(0.3)

    return contratos


def filtrar_por_nicho(contratos: list, nicho: str) -> list:
    """Filtra contratos pelo nicho usando palavras-chave no objeto."""
    PALAVRAS_NICHO = {
        "gis":       ["geoprocessamento", "sig", "sistema informação geográfica",
                      "cadastro imobiliário", "geoprocessamento", "ctm", "mapeamento"],
        "erp":       ["gestão pública", "sistema integrado", "erp", "contabilidade",
                      "folha pagamento", "tributação", "iptu", "prefeitura sistema"],
        "saude":     ["prontuário", "saúde", "sus", "rnds", "regulação", "farmácia",
                      "agendamento", "ubs", "upa"],
        "educacao":  ["escolar", "matrícula", "educação", "aluno", "merenda",
                      "diário classe", "censo escolar"],
        "licitacoes":["licitação", "pregão", "transparência", "compras públicas",
                      "pncp", "lei 14133"],
        "cad_bim":   ["autocad", "autodesk", "revit", "archicad", "bim",
                      "aec collection", "civil 3d"],
    }
    palavras = PALAVRAS_NICHO.get(nicho, [nicho])
    resultado = []
    for c in contratos:
        obj = (c.get("objetoCompra") or "").lower()
        if any(p in obj for p in palavras):
            resultado.append(c)
    return resultado


def calcular_mapa_fornecedores(contratos: list) -> list:
    """Agrupa contratos por fornecedor e calcula dominância."""
    mapa = {}
    total_valor = sum(c.get("valorGlobal", 0) for c in contratos)

    for c in contratos:
        cnpj = c.get("cnpjContratado") or c.get("niFornecedor", "")
        nome = c.get("nomeRazaoSocialContratada") or c.get("nomeFornecedor", "Desconhecido")
        valor = c.get("valorGlobal", 0)
        data = c.get("dataAssinatura") or c.get("dataPublicacao", "")

        if cnpj not in mapa:
            mapa[cnpj] = {
                "cnpj": cnpj,
                "nome": nome,
                "contratos": 0,
                "valor_total": 0,
                "datas": [],
            }
        mapa[cnpj]["contratos"] += 1
        mapa[cnpj]["valor_total"] += valor
        mapa[cnpj]["datas"].append(data)

    resultado = []
    for cnpj, dados in sorted(mapa.items(), key=lambda x: -x[1]["valor_total"]):
        pct = (dados["valor_total"] / total_valor * 100) if total_valor > 0 else 0
        datas_ord = sorted(dados["datas"])
        resultado.append({
            "cnpj": cnpj,
            "nome": dados["nome"],
            "contratos_ganhos": dados["contratos"],
            "valor_total": round(dados["valor_total"], 2),
            "pct_participacao": round(pct, 1),
            "primeiro_contrato": datas_ord[0] if datas_ord else None,
            "ultimo_contrato": datas_ord[-1] if datas_ord else None,
            "eh_dominante": pct > 70 and dados["contratos"] >= 3,
        })
    return resultado


def calcular_nivel_enraizamento(dominante: Optional[dict], contratos: list) -> str:
    """
    Calcula o nível de enraizamento do fornecedor dominante.
    Retorna: "baixo" | "medio" | "alto" | "critico"
    """
    if not dominante:
        return "baixo"

    pct = dominante.get("pct_participacao", 0)
    qtd = dominante.get("contratos_ganhos", 0)

    if pct >= 90 and qtd >= 5:
        return "critico"
    elif pct >= 75 and qtd >= 3:
        return "alto"
    elif pct >= 50 and qtd >= 2:
        return "medio"
    else:
        return "baixo"


def calcular_preco_medio(contratos: list) -> float:
    """Calcula o preço médio histórico dos contratos do nicho."""
    valores = [c.get("valorGlobal", 0) for c in contratos if c.get("valorGlobal", 0) > 0]
    if not valores:
        return 0
    return sum(valores) / len(valores)


def calcular_janela(edital_ativo: Optional[dict], preco_historico: float) -> Optional[dict]:
    """Calcula a janela de oportunidade para o edital ativo."""
    if not edital_ativo:
        return None

    data_enc_str = edital_ativo.get("dataEncerramentoProposta")
    if data_enc_str:
        try:
            data_enc = datetime.fromisoformat(data_enc_str.replace("Z", ""))
            dias = (data_enc - datetime.utcnow()).days
        except Exception:
            dias = None
    else:
        dias = None

    valor_est = edital_ativo.get("valorTotalEstimado", 0) or 0
    sigiloso = edital_ativo.get("orcamentoSigiloso", False)
    valor_ref = valor_est if not sigiloso and valor_est > 0 else preco_historico
    lance_alvo = round(valor_ref * 0.82, 2)  # 18% abaixo

    return {
        "dias_ate_encerramento": dias,
        "data_encerramento": data_enc_str,
        "modalidade": edital_ativo.get("modalidadeLicitacaoNome", ""),
        "valor_estimado": valor_est if not sigiloso else None,
        "orcamento_sigiloso": sigiloso,
        "valor_estimado_historico": round(preco_historico, 2),
        "lance_alvo": lance_alvo,
        "urgente": dias is not None and dias <= 7,
    }


def calcular_score_oportunidade(
    janela: Optional[dict],
    nivel_enraizamento: str,
    sinais: list,
    dominante: Optional[dict],
) -> int:
    """Score 0-100: maior = melhor oportunidade para entrar."""
    score = 0

    # Prazo (30 pts)
    if janela:
        dias = janela.get("dias_ate_encerramento")
        if dias is not None:
            if 7 <= dias <= 15:
                score += 30
            elif 3 <= dias < 7:
                score += 20
            elif 15 < dias <= 30:
                score += 15
            elif dias > 30:
                score += 8

    # Enraizamento (25 pts) — paradoxalmente, enraizado = oportunidade
    # porque o órgão está cansado do mesmo fornecedor e pronto para trocar
    mapa_enr = {"critico": 25, "alto": 20, "medio": 10, "baixo": 5}
    score += mapa_enr.get(nivel_enraizamento, 0)

    # Valor (20 pts)
    if janela:
        val = janela.get("valor_estimado_historico", 0)
        if val >= 200_000:
            score += 20
        elif val >= 100_000:
            score += 15
        elif val >= 50_000:
            score += 10

    # Sinais de direcionamento (até -25 pts — edital muito travado)
    score -= min(len(sinais) * 8, 25)

    # Bônus: fornecedor dominante único (oportunidade de substituição)
    if dominante and dominante.get("contratos_ganhos", 0) >= 4:
        score += 15  # órgão maduro para diversificação

    return max(0, min(100, score))


def definir_estrategia(
    nivel: str,
    score_direcionamento: int,
    janela: Optional[dict],
    score_op: int,
) -> str:
    """
    Define a estratégia principal baseada no cenário.
    Retorna uma das estratégias abaixo.
    """
    if score_direcionamento >= 60:
        return "impugnar_edital"          # Edital muito direcionado — impugnar primeiro
    elif nivel == "critico" and score_op >= 50:
        return "entrar_preco_visitar"     # Enraizado mas alta oportunidade — entrar por preço e visitar
    elif nivel == "alto" and score_op >= 40:
        return "entrar_documentacao_perfeita"  # Enraizado — ser impecável nos documentos
    elif nivel in ("baixo", "medio"):
        return "entrar_preco_normal"      # Sem enraizamento — compete normalmente por preço
    elif janela and (janela.get("dias_ate_encerramento") or 99) < 3:
        return "aguardar_proximo"         # Muito urgente — preparar para o próximo
    else:
        return "monitorar"                # Aguardar mais informações


def gerar_acoes_imediatas(
    estrategia: str,
    edital_ativo: Optional[dict],
    sinais: list,
    janela: Optional[dict],
) -> list[str]:
    """Gera lista de ações concretas baseada na estratégia."""
    PLAYBOOKS = {
        "impugnar_edital": [
            "Baixar o Edital e o Termo de Referência completos (urgente)",
            "Identificar cláusula exata que configura direcionamento",
            "Gerar rascunho de impugnação com fundamento no Art. 40 §3° da Lei 14.133/2021",
            "Protocolar impugnação até 3 dias úteis antes da abertura",
            "Se negado, preparar representação ao TCE/TCU",
        ],
        "entrar_preco_visitar": [
            "Calcular o custo real de implantação para saber se suporta lance 18-22% abaixo",
            "Preparar proposta com documentação 100% completa e sem vírgula faltando",
            "Verificar todos os atestados exigidos — providenciar com antecedência",
            "Cadastrar empresa no SICAF e no portal de licitações do órgão",
            "Quando passar pela fase de preço: ir pessoalmente ao órgão antes da fase técnica",
            "Na visita: deixar nome, e-mail e telefone com o pregoeiro sem comentar o processo",
            "Não prometer nada além do que o edital pede — objetividade total",
        ],
        "entrar_documentacao_perfeita": [
            "Ler o edital 3 vezes e fazer checklist de cada exigência documental",
            "Preparar amostras/demos do sistema antes de precisar — eles vão pedir",
            "Ter argumentos prontos para cada tentativa de desclassificação",
            "Gravar todas as sessões do pregão (direito garantido pela lei)",
            "Registrar por escrito qualquer decisão questionável do pregoeiro via chat do sistema",
            "Se desclassificado injustamente: interpor recurso imediatamente com fundamentação",
        ],
        "entrar_preco_normal": [
            "Montar proposta competitiva com preço 10-15% abaixo da média histórica",
            "Garantir toda a documentação de habilitação atualizada",
            "Acompanhar o pregão em tempo real e estar pronto para contra-ofertas",
        ],
        "aguardar_proximo": [
            "Monitorar o resultado desse edital (quem vai ganhar, por qual preço)",
            "Registrar todos os detalhes do objeto e especificações para o próximo ciclo",
            "Iniciar relacionamento com o órgão agora — visita de apresentação",
            "Verificar o PCA do próximo ano para antecipar a renovação",
        ],
        "monitorar": [
            "Aguardar publicação do edital completo para análise",
            "Monitorar o PNCP diariamente para mudanças de status",
            "Pesquisar o pregoeiro e o setor de TI do órgão nas redes",
        ],
    }
    return PLAYBOOKS.get(estrategia, ["Analisar o edital manualmente"])
```

---

## 5. Como o agente detecta o nível de enraizamento

O agente classifica o fornecedor dominante em 4 níveis:

```
NÍVEL: BAIXO
  Critério: < 50% dos contratos ou < 2 contratos
  Significado: mercado aberto, competição normal
  Estratégia: entrar por preço + documentação padrão

NÍVEL: MÉDIO
  Critério: 50-75% dos contratos, 2-3 contratos consecutivos
  Significado: relacionamento existe mas não é exclusivo
  Estratégia: ser 15% mais barato + proposta técnica sólida

NÍVEL: ALTO
  Critério: 75-90% dos contratos, 3-4 contratos consecutivos
  Significado: fornecedor enraizado — vai tentar te derrubar na fase técnica
  Estratégia: documentação impecável + visita ao órgão durante o prazo de amostras

NÍVEL: CRÍTICO
  Critério: > 90% dos contratos, 5+ contratos consecutivos
  Significado: "vespeiro" — sistema de 3 produtos interligados, pregoeiro orientado
  Estratégia: impugnar o edital primeiro (se tiver sinal) OU entrar por preço e
              fazer visita estratégica antes da fase de julgamento técnico
```

### Sinais de enraizamento crítico (detectados pelo agente nos PDFs)

```python
SINAIS_CRITICO = [
    # O fornecedor oferece um pacote de 3+ sistemas integrados
    # e o edital pede integração nativa entre eles
    "integração nativa com sistema {X} já instalado",
    "compatível com banco de dados {X} versão {Y}",

    # Exige dados históricos que só quem já está no órgão tem
    "migração de dados do sistema atual sem custo adicional",
    "conversão da base existente inclusa",

    # Prazo impossível para novo entrante
    "implantação em funcionamento em até 30 dias",
    "sem período de transição",

    # Exige atestado com especificidade absurda
    "atestado de 3 clientes com mais de 50 mil habitantes",
    "experiência com integração com sistema {X} específico",
]
```

---

## 6. O jogo do pregoeiro — o que o agente analisa

Baseado na conversa do Rômulo (áudio transcrito): o pregoeiro recebe um "comando" de fazer o fornecedor habitual ganhar, mas não vai colocar o próprio pescoço em risco. Se você chegar com tudo certo, ele é obrigado a aceitar — aí vem a fase das armadilhas.

O agente detecta e documenta esses padrões:

```python
# análise comportamental do processo licitatório

PADROES_PREGOEIRO = {

    "desclassificacao_documental": {
        "descricao": "Desclassifica por algum documento 'faltando' ou 'incorreto'",
        "sinais": [
            "prazo de validade de certidão vencido por 1 dia",
            "formato de arquivo incorreto (PDF vs Word)",
            "assinatura eletrônica sem ICP-Brasil quando não exigido",
            "declaração em modelo diferente do anexo",
        ],
        "contramedida": (
            "Checar TODOS os documentos 48h antes da abertura. "
            "Ter versão atualizada de TUDO. "
            "Gravar a sessão em vídeo (direito legal)."
        ),
        "fundamentacao": "Art. 64 da Lei 14.133/2021 — saneamento de irregularidades"
    },

    "solicitacao_amostra_impossivel": {
        "descricao": "Pede demonstração ou amostra com prazo curto ou critérios vagos",
        "sinais": [
            "demo em 48h com todos os módulos funcionando",
            "amostra em ambiente do órgão (que você não tem acesso)",
            "critérios de avaliação da amostra não definidos no edital",
        ],
        "contramedida": (
            "ANTES de entregar a amostra, fazer a visita ao órgão. "
            "Registrar por escrito quais são os critérios exatos de avaliação. "
            "Se critérios forem vagos: questionar formalmente via chat do sistema."
        ),
        "fundamentacao": "Art. 17 §1° — critérios de julgamento devem estar no edital"
    },

    "habilitacao_surprise": {
        "descricao": "Exige documento de habilitação que não estava listado no edital",
        "sinais": [
            "solicita certidão estadual não prevista",
            "pede declaração adicional não mencionada",
            "exige registro em entidade não prevista no TR",
        ],
        "contramedida": (
            "Impugnar via recurso administrativo imediato. "
            "Citar Art. 67 da Lei 14.133/2021 — documentos não previstos não podem ser exigidos."
        ),
        "fundamentacao": "Art. 67 Lei 14.133/2021"
    },

    "lance_intimidacao": {
        "descricao": "Fornecedor dominante entra com lance muito abaixo para te assustar",
        "sinais": [
            "lance inicial 40%+ abaixo do valor estimado",
            "redução abrupta de preço após você entrar",
        ],
        "contramedida": (
            "Calcular ANTES o seu custo real mínimo viável. "
            "Não acompanhar lances abaixo do seu piso. "
            "Se o vencedor ofertar preço inexequível: pedir comprovação de exequibilidade."
        ),
        "fundamentacao": "Art. 59 §3° — preço inexequível pode ser desclassificado"
    },
}
```

### Query SQL para detectar padrão de pregoeiro

```sql
-- Detecta se o mesmo pregoeiro conduziu os pregões anteriores
-- que foram ganhos pelo fornecedor dominante
SELECT
    e.numero_controle_pncp,
    e.data_publicacao,
    r.fornecedor_nome,
    r.valor_total_final,
    h.usuario_nome AS pregoeiro,
    COUNT(*) OVER (
        PARTITION BY h.usuario_nome, r.fornecedor_cnpj
    ) AS vezes_mesmo_par
FROM editais e
JOIN resultados r ON e.numero_controle_pncp = r.numero_controle_pncp
JOIN historico h ON e.numero_controle_pncp = h.compra_numero_controle
WHERE e.orgao_cnpj = $1
  AND h.categoria_log = 'Contratação'
  AND h.tipo_log = 'Inclusão'
ORDER BY e.data_publicacao DESC;

-- Se vezes_mesmo_par >= 3: pregoeiro com padrão histórico com esse fornecedor
```

---

## 7. Playbook de entrada — passo a passo gerado pelo agente

O agente gera um playbook específico para cada cenário. Aqui estão os 4 cenários mais comuns:

### Cenário A — "Enraizamento crítico com edital direcionado"

```
SITUAÇÃO: Fornecedor tem 5+ contratos, edital com especificações direcionadas
ESTRATÉGIA: "impugnar_edital" → depois "entrar_preco_visitar"

PASSO 1 — Impugnar o edital (primeiros 3 dias úteis)
  □ Baixar Edital + Termo de Referência + ETP
  □ Identificar a cláusula específica que configura direcionamento
  □ Gerar impugnação com Art. 40 §3° + Acórdão TCU 9.162/2022
  □ Protocolar pelo sistema eletrônico do pregão
  □ Monitorar a resposta (órgão tem 3 dias úteis para responder)

PASSO 2 — Se a impugnação for aceita (edital retificado)
  □ Verificar se as alterações removeram o direcionamento
  □ Preparar proposta e participar normalmente

PASSO 3 — Se a impugnação for negada
  □ Decidir: vale a pena continuar ou escalar para TCE/TCU?
  □ Se continuar: participar com documentação impecável
  □ Registrar TUDO para representação posterior se for desclassificado injustamente

PASSO 4 — Durante o pregão
  □ Entrar com o lance alvo (18% abaixo da média histórica)
  □ Não acompanhar lances abaixo do seu piso mínimo
  □ Gravar a sessão

PASSO 5 — Após vencer a fase de preço
  □ Ir pessoalmente ao órgão ANTES de entregar amostras/documentos técnicos
  □ Deixar e-mail e telefone com o pregoeiro (sem comentar o processo)
  □ Estar disponível para qualquer questionamento no mesmo dia

PASSO 6 — Fase de habilitação/amostras
  □ Entregar TUDO dentro do prazo, com antecedência
  □ Acompanhar qualquer questionamento via chat do sistema
  □ Se tentarem desclassificar: recorrer imediatamente com fundamentação
```

### Cenário B — "Enraizamento alto, edital limpo"

```
SITUAÇÃO: Fornecedor domina mas edital sem direcionamento evidente
ESTRATÉGIA: "entrar_documentacao_perfeita"

PASSO 1 — Preparação (antes de o pregão abrir)
  □ Ler o edital 3x e fazer checklist de CADA exigência
  □ Reunir e atualizar TODOS os documentos de habilitação
  □ Preparar demo do sistema funcionando (eles vão pedir)
  □ Ter 2 atestados de capacidade técnica válidos e específicos

PASSO 2 — No pregão
  □ Entrar logo no início para mostrar presença
  □ Lance: 15-20% abaixo do valor estimado
  □ Monitorar a cada 5 minutos durante a fase de lances

PASSO 3 — Após vencer fase de preço
  □ Visita ao órgão: "vim apresentar minha empresa"
  □ Não fazer proposta de suborno implícita ou explícita (risco legal)
  □ Mostrar que é profissional e que vai entregar

PASSO 4 — Se desclassificado
  □ Interpor recurso com prazo (3 dias úteis)
  □ Recurso bem fundamentado força o pregoeiro a se justificar por escrito
  □ Pregoeiro não vai colocar o pescoço em risco: se você tiver razão, aceita
```

### Cenário C — "Mercado aberto, competição normal"

```
SITUAÇÃO: Sem fornecedor dominante ou entrada recente
ESTRATÉGIA: "entrar_preco_normal"

PASSO 1 — Proposta
  □ Lance 10-12% abaixo do estimado (margem conservadora)
  □ Documentação completa
  □ Acompanhar e reduzir se necessário

PASSO 2 — Diferencial técnico
  □ Apresentar diferenciais na proposta técnica se critério for "técnica e preço"
  □ Demonstrar capacidade de implantação no prazo

PASSO 3 — Pós-adjudicação
  □ Entregar impecavelmente
  □ Construir relacionamento para o próximo ciclo
```

### Cenário D — "Muito urgente — preparar para o próximo"

```
SITUAÇÃO: Edital fecha em < 3 dias, pouco tempo para se preparar
ESTRATÉGIA: "aguardar_proximo"

PASSO 1 — Agora
  □ Monitorar o resultado: quem vai ganhar e por qual preço
  □ Baixar e estudar o edital para entender as exigências

PASSO 2 — Relacionamento imediato
  □ Ir ao órgão fazer visita de apresentação (não relacionada ao pregão)
  □ Conhecer o secretário de TI, o pregoeiro, o gestor de contratos

PASSO 3 — Preparação para o próximo ciclo
  □ Verificar o PCA do órgão para o próximo ano
  □ Monitorar o prazo do contrato atual (quando vence?)
  □ Preparar toda a documentação com antecedência de 60 dias
```

---

## 8. Exemplo real de dossiê gerado

```
════════════════════════════════════════════════════════════════════
DOSSIÊ DE ÓRGÃO — GERADO PELO AGENTE PNCP
════════════════════════════════════════════════════════════════════

ÓRGÃO: Ministério Público do Estado de São Paulo
CNPJ:  01.468.760/0001-90
UF:    SP | Esfera: Estadual | Poder: Executivo

NICHO ANALISADO: CAD/BIM (software Autodesk)
EDITAL ATIVO:    90011/2026 — Autodesk AutoCAD + AEC Collection
ENCERRAMENTO:    14/04/2026 (19 dias restantes)
VALOR ESTIMADO:  Sigiloso (histórico: ~R$ 280k)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MAPA DE FORNECEDORES (últimos 5 anos):

1° Autodesk / revendedor autorizado SP
   Contratos: 6   Valor total: R$ 1,68M   Participação: 94%
   Série:     2019 → 2020 → 2021 → 2022 → 2024 → atual
   Status:    DOMINANTE — nível CRÍTICO

2° Outros (2 revendedores sem histórico com esse órgão)
   Contratos: 1   Valor total: R$ 108k    Participação: 6%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ANÁLISE DO EDITAL ATUAL (via IA):

Sinais de direcionamento detectados: 2
  → ALTA: "versão 2026 dos produtos Autodesk" (versão específica citada)
  → MÉDIA: prazo de vigência 36 meses com início em 30 dias
Score de direcionamento: 35/100 (moderado)

Marca exigida: SIM — "AutoCAD e AEC Collection Autodesk"
Justificativa no ETP: "padronização da frota de 12 licenças existentes"
Permite equivalente: NÃO

Observação: a exigência de marca é legal nesse caso (padronização
  documentada no ETP). Não impugnar — entrar por preço com produto
  original Autodesk (ser revendedor autorizado).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

JANELA DE OPORTUNIDADE:

Dias até encerramento:   19 dias (zona ideal: 7-15 = zona crítica logo)
Valor histórico médio:   R$ 280.000
Lance alvo sugerido:     R$ 229.600 (18% abaixo da média)
Lance mínimo viável:     você define baseado no seu custo de aquisição

Estratégia de preço:
  - Licença AutoCAD (12x): R$ 12.500/unidade → total R$ 150.000
  - Licença AEC Collection (4x): R$ 19.900/unidade → total R$ 79.600
  - Lance sugerido: R$ 229.600 total

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SCORE DE OPORTUNIDADE: 68/100

Decomposição:
  Prazo (30pts):         +22  (19 dias = boa janela)
  Enraizamento (25pts):  +25  (crítico = alto potencial de substituição)
  Valor (20pts):         +15  (R$ 280k = médio-alto)
  Sinais direcionamento: -10  (2 sinais moderados)
  Bônus dominância:      +16  (6 contratos = órgão maduro)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ESTRATÉGIA: entrar_preco_visitar

AÇÕES IMEDIATAS:
  □ [HOJE] Confirmar se você é revendedor autorizado Autodesk
            (obrigatório — marca exigida é justificada)
  □ [HOJE] Calcular custo real das 16 licenças pelo seu canal
  □ [ATÉ 48H] Baixar Edital completo + ETP + Termo de Referência
  □ [ATÉ 3 DIAS] Reunir documentação de habilitação completa:
      - Atestado de capacidade técnica como revendedor Autodesk
      - Certidão de parceiro autorizado Autodesk (carta de autorização)
      - Regularidade fiscal federal, estadual e municipal
      - SICAF atualizado
  □ [DIA DO PREGÃO] Entrar com lance de R$ 229.600
  □ [APÓS VENCER PREÇO] Ir ao órgão — deixar contato com pregoeiro
  □ [ANTES DA HABILITAÇÃO] Entregar todos documentos com 2 dias de antecedência

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALERTA ESPECIAL — CARTA DE AUTORIZAÇÃO DO FABRICANTE:

Para software com marca exigida e justificada (como Autodesk nesse caso),
o edital provavelmente exige carta de autorização do fabricante para
revenda. Providenciar ANTES de participar — sem isso, desclassificação
garantida na fase de habilitação.

════════════════════════════════════════════════════════════════════
Gerado em: 26/03/2026 15:47 UTC | Fonte: PNCP API + Gemini 2.0 Flash
════════════════════════════════════════════════════════════════════
```

---

## 9. Prompt Gemini para análise profunda do edital

```python
PROMPT_ANALISE_PROFUNDA = """
Você é um especialista em licitações públicas brasileiras com 15 anos de
experiência e conhecimento profundo da Lei 14.133/2021 e jurisprudência do TCU.

Analise este edital/termo de referência com foco em:

1. OBJETO E ESPECIFICAÇÕES
   - O que exatamente está sendo contratado?
   - As especificações são objetivas ou subjetivas?
   - Alguma característica exclui fornecedores concorrentes?

2. SINAIS DE DIRECIONAMENTO
   - Marca citada? (nome do software, versão específica)
   - Especificações que só um produto atende?
   - Atestados de capacidade técnica proporcionais ao objeto?
   - Prazo de implantação razoável para um novo entrante?
   - Exigência de integração com sistema proprietário existente?

3. ESTRATÉGIA PARA NOVO ENTRANTE
   - É possível participar sem ser o fornecedor atual?
   - Quais os principais riscos de desclassificação?
   - O que um novo participante DEVE providenciar antes do pregão?
   - Existe fundamento para impugnar? Qual cláusula específica?

4. PREÇO E VALOR
   - O valor estimado está indicado ou é sigiloso?
   - Se sigiloso, há alguma referência indireta ao valor?
   - Qual seria um lance competitivo razoável?

Responda em JSON com a seguinte estrutura:
{
  "objeto_resumido": "descrição em 1 frase",
  "software_nome": "nome do software",
  "fabricante": "empresa fabricante",
  "marca_exigida": true/false,
  "marca_justificada": true/false,
  "justificativa_marca": "texto ou null",
  "permite_equivalente": true/false,
  "sinais_direcionamento": [
    {"tipo": "...", "trecho": "...", "gravidade": "alta/media/baixa", "lei": "..."}
  ],
  "score_direcionamento": 0-100,
  "pode_participar": true/false,
  "motivo_nao_pode": "null ou explicação",
  "atestados_exigidos": ["lista"],
  "documentos_criticos": ["lista do que não pode faltar"],
  "prazo_implantacao_dias": número,
  "prazo_viavel_novo_entrante": true/false,
  "estrategia_recomendada": "texto",
  "riscos_desclassificacao": ["lista"],
  "fundamento_impugnacao": "null ou artigo + argumento",
  "valor_estimado": número ou null,
  "lance_sugerido": número ou null,
  "observacoes_criticas": "texto livre com alertas importantes"
}
"""
```

---

## 10. Integração com o sistema principal

### Endpoint de API para o frontend

```python
# api/routes/dossie.py
from fastapi import APIRouter, Depends
from ..services.dossie_service import DossieService

router = APIRouter(prefix="/api/v1/dossie")

@router.get("/{cnpj_orgao}")
async def get_dossie(
    cnpj_orgao: str,
    nicho: str = "erp",
    service: DossieService = Depends()
):
    """
    Retorna o dossiê completo de um órgão para um nicho.
    Se já existir no banco e for recente (< 6h), retorna do cache.
    Caso contrário, gera novo dossiê em tempo real.
    """
    # Tenta cache primeiro
    cached = await service.get_cached(cnpj_orgao, nicho)
    if cached and cached["idade_horas"] < 6:
        return {"source": "cache", "data": cached}

    # Gera novo dossiê
    dossie = await service.gerar(cnpj_orgao, nicho)
    await service.salvar(dossie)
    return {"source": "fresh", "data": dossie}


@router.get("/{cnpj_orgao}/relatorio")
async def get_relatorio_md(
    cnpj_orgao: str,
    nicho: str = "erp",
    service: DossieService = Depends()
):
    """
    Retorna o dossiê formatado como Markdown para download ou exibição.
    """
    dossie = await service.gerar(cnpj_orgao, nicho)
    md = formatar_dossie_markdown(dossie)
    return Response(
        content=md,
        media_type="text/markdown",
        headers={"Content-Disposition": f"attachment; filename=dossie_{cnpj_orgao}.md"}
    )
```

### Gerador de Markdown do dossiê

```python
def formatar_dossie_markdown(d: dict) -> str:
    orgao = d.get("orgao", {})
    dom = d.get("dominante")
    janela = d.get("janela", {})
    sinais = d.get("sinais_direcionamento", [])
    acoes = d.get("acoes_imediatas", [])

    linhas = [
        f"# Dossiê — {orgao.get('nome', d['cnpj'])}",
        f"",
        f"**CNPJ:** {d['cnpj']}  ",
        f"**Nicho:** {d['nicho']}  ",
        f"**Score de oportunidade:** {d['score_oportunidade']}/100  ",
        f"**Estratégia:** {d['estrategia']}  ",
        f"**Gerado em:** {d['gerado_em']}",
        f"",
        f"---",
        f"",
        f"## Fornecedor dominante",
        f"",
    ]

    if dom:
        linhas += [
            f"| Campo | Valor |",
            f"|---|---|",
            f"| Nome | {dom['nome']} |",
            f"| CNPJ | {dom['cnpj']} |",
            f"| Contratos ganhos | {dom['contratos_ganhos']} |",
            f"| Valor total | R$ {dom['valor_total']:,.2f} |",
            f"| Participação | {dom['pct_participacao']}% |",
            f"| Último contrato | {dom.get('ultimo_contrato', '—')} |",
            f"| Nível de enraizamento | **{d['nivel_enraizamento'].upper()}** |",
            f"",
        ]
    else:
        linhas += ["Nenhum fornecedor dominante identificado.\n"]

    linhas += [
        f"## Janela de oportunidade",
        f"",
        f"| Campo | Valor |",
        f"|---|---|",
        f"| Dias até encerramento | {janela.get('dias_ate_encerramento', '—')} |",
        f"| Modalidade | {janela.get('modalidade', '—')} |",
        f"| Valor estimado histórico | R$ {janela.get('valor_estimado_historico', 0):,.2f} |",
        f"| Lance alvo sugerido | R$ {janela.get('lance_alvo', 0):,.2f} |",
        f"| Urgente | {'SIM' if janela.get('urgente') else 'Não'} |",
        f"",
        f"## Sinais de direcionamento ({d['score_direcionamento']}/100)",
        f"",
    ]

    if sinais:
        for s in sinais:
            g = s if isinstance(s, str) else s.get("descricao", str(s))
            linhas.append(f"- {g}")
    else:
        linhas.append("Nenhum sinal evidente detectado.")

    linhas += [
        f"",
        f"## Ações imediatas",
        f"",
    ]
    for i, acao in enumerate(acoes, 1):
        linhas.append(f"{i}. {acao}")

    return "\n".join(linhas)
```

### Job automático — gerar dossiê para todos os editais com score > 60

```python
# jobs/dossie_job.py
async def job_gerar_dossies(db, gemini):
    """
    Roda diariamente: gera dossiê automático para todos os editais
    com score de oportunidade > 60 e que ainda não têm dossiê recente.
    """
    query = """
    SELECT DISTINCT e.orgao_cnpj, e.nicho_detectado
    FROM editais e
    LEFT JOIN dossies d ON (
        e.orgao_cnpj = d.cnpj
        AND e.nicho_detectado = d.nicho
        AND d.gerado_em > NOW() - INTERVAL '12 hours'
    )
    WHERE e.score_oportunidade >= 60
      AND e.cancelado = FALSE
      AND e.situacao_id = 1
      AND e.data_fim_vigencia > NOW()
      AND d.id IS NULL
    LIMIT 50
    """
    alvos = await db.fetch(query)

    for alvo in alvos:
        try:
            dossie = await gerar_dossie(
                alvo["orgao_cnpj"],
                alvo["nicho_detectado"],
                db,
                gemini
            )
            await db.execute(
                "INSERT INTO dossies (cnpj, nicho, dados, gerado_em) VALUES ($1, $2, $3, NOW())",
                alvo["orgao_cnpj"], alvo["nicho_detectado"], json.dumps(dossie)
            )
            print(f"Dossiê gerado: {alvo['orgao_cnpj']} / {alvo['nicho_detectado']}")
        except Exception as e:
            print(f"Erro: {e}")
        await asyncio.sleep(2)
```

---

## Resumo — o que o sistema entrega para você

```
Quando você abre o painel de um edital, o agente já montou:

1. QUEM ESTÁ LÁ — mapa de fornecedores com anos de domínio e % de concentração

2. COMO ELES GANHAM — sinais de direcionamento detectados no edital e no histórico

3. O QUE ELES COBRAM — preço médio histórico dos contratos anteriores

4. QUAL O SEU LANCE — lance alvo calculado 18% abaixo da média

5. O QUE VOCÊ PRECISA — lista exata de documentos e atestados para não ser derrubado

6. COMO JOGAR — playbook passo a passo baseado no nível de enraizamento

7. O QUE O PREGOEIRO VAI TENTAR — armadilhas previsíveis com contramedidas legais

8. QUANDO IR AO ÓRGÃO — o timing exato da visita estratégica
```

O seu conhecimento interno sobre como as empresas da sua região funcionam
é o maior diferencial. O agente dá o mapa do campo — você entra sabendo
exatamente o que vai encontrar.

---

*Versão 1.0 — 26/03/2026*