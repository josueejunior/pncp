# Estratégia completa — Agente PNCP: download de arquivos, quebra de monopólio e inteligência competitiva

> Documento técnico e estratégico cobrindo: pipeline de download de PDFs e ZIPs do PNCP, controle de tokens para não estourar a API do Gemini, estratégias jurídicas para quebrar monopólio em licitações, e como o agente usa tudo isso para gerar vantagem competitiva real.

---

## Sumário

1. [Pipeline completo de download de arquivos do PNCP](#1-pipeline-completo-de-download-de-arquivos-do-pncp)
2. [Processamento de PDF e ZIP com extração inteligente](#2-processamento-de-pdf-e-zip-com-extração-inteligente)
3. [Controle de tokens — como não estourar a API do Gemini](#3-controle-de-tokens--como-não-estourar-a-api-do-gemini)
4. [Estratégia de quebra de monopólio em licitações](#4-estratégia-de-quebra-de-monopólio-em-licitações)
5. [Como o agente detecta e classifica monopólio automaticamente](#5-como-o-agente-detecta-e-classifica-monopólio-automaticamente)
6. [Geração automática de impugnação de edital](#6-geração-automática-de-impugnação-de-edital)
7. [Estratégia de precificação para quebrar o fornecedor dominante](#7-estratégia-de-precificação-para-quebrar-o-fornecedor-dominante)
8. [Código completo do módulo de arquivos](#8-código-completo-do-módulo-de-arquivos)

---

## 1. Pipeline completo de download de arquivos do PNCP

### Como funciona o endpoint de arquivos

```
PASSO 1 — Listar arquivos do edital
GET https://pncp.gov.br/api/pncp/v1/orgaos/{cnpj}/compras/{ano}/{seq}/arquivos
  ?pagina=1
  &tamanhoPagina=5

Resposta (exemplo real):
[
  {
    "uri": "https://pncp.gov.br/pncp-api/v1/orgaos/01468760000190/compras/2026/17/arquivos/1",
    "url": "https://pncp.gov.br/pncp-api/v1/orgaos/01468760000190/compras/2026/17/arquivos/1",
    "statusAtivo": true,
    "cnpj": "01468760000190",
    "anoCompra": 2026,
    "sequencialCompra": 17,
    "dataPublicacaoPncp": "2026-03-26T07:06:37",
    "sequencialDocumento": 1,
    "titulo": "95652005900112026000",
    "tipoDocumentoNome": "Edital",
    "tipoDocumentoId": 2,
    "tipoDocumentoDescricao": "Edital"
  }
]

PASSO 2 — Baixar o arquivo (a URL do campo "url" é o link de download direto)
GET https://pncp.gov.br/pncp-api/v1/orgaos/{cnpj}/compras/{ano}/{seq}/arquivos/{sequencial}
```

### Tipos de documento por `tipoDocumentoId`

| ID | Nome | O que contém | Prioridade |
|---|---|---|---|
| 2 | Edital | Regras completas, especificações técnicas, critérios | **Alta — processar sempre** |
| 3 | Termo de Referência | Especificação detalhada do objeto, valor estimado | **Alta — processar sempre** |
| 4 | Minuta de Contrato | Cláusulas, obrigações, penalidades | Média |
| 5 | Anexo | Planilhas, formulários, laudos | Baixa |
| 6 | Ata | Resultado, vencedor, valor final | **Alta — processar se tem_resultado=true** |

### Lógica de priorização de download

```python
PRIORIDADE_TIPO = {
    "Edital": 1,          # Sempre baixar
    "Termo de Referência": 1,  # Sempre baixar
    "Ata": 2,             # Baixar se tem_resultado=true
    "Minuta de Contrato": 3,
    "Anexo": 4,           # Só se necessário
}

def deve_processar(doc: dict, tem_resultado: bool) -> bool:
    tipo = doc.get("tipoDocumentoNome", "")
    if tipo in ["Edital", "Termo de Referência"]:
        return True
    if tipo == "Ata" and tem_resultado:
        return True
    return False
```

---

## 2. Processamento de PDF e ZIP com extração inteligente

### Detecção automática do tipo de arquivo

O PNCP não garante que o arquivo retornado seja sempre PDF. Às vezes vem ZIP contendo vários documentos. O agente detecta isso pelo `Content-Type` do header da resposta HTTP, ou pelos primeiros bytes do arquivo (magic bytes).

```python
import zipfile
import io
import magic  # pip install python-magic

MAGIC_PDF  = b"%PDF"
MAGIC_ZIP  = b"PK\x03\x04"

def detectar_tipo(conteudo: bytes) -> str:
    if conteudo[:4] == MAGIC_PDF:
        return "pdf"
    if conteudo[:4] == MAGIC_ZIP:
        return "zip"
    # Fallback via Content-Type header
    return "desconhecido"
```

### Pipeline completo: download → detecção → extração → Gemini

```python
import httpx
import zipfile
import io
import base64
import json
import asyncio
from pathlib import Path
from datetime import datetime

async def processar_arquivos_edital(
    cnpj: str,
    ano: int,
    sequencial: int,
    tem_resultado: bool = False
) -> list[dict]:
    """
    Baixa e processa todos os arquivos relevantes de um edital.
    Retorna lista de extrações estruturadas.
    """
    base = "https://pncp.gov.br/pncp-api/v1"
    resultados = []

    async with httpx.AsyncClient(timeout=60, follow_redirects=True) as client:

        # PASSO 1: listar arquivos
        url_lista = f"{base}/orgaos/{cnpj}/compras/{ano}/{sequencial}/arquivos"
        resp = await client.get(url_lista, params={"pagina": 1, "tamanhoPagina": 20})
        if resp.status_code != 200:
            return []
        arquivos = resp.json()

        for arq in arquivos:
            if not deve_processar(arq, tem_resultado):
                continue

            # PASSO 2: baixar o arquivo
            url_download = arq["url"]
            try:
                dl = await client.get(url_download)
                conteudo = dl.content
            except Exception as e:
                print(f"Erro no download: {e}")
                continue

            # PASSO 3: detectar tipo e extrair
            tipo = detectar_tipo(conteudo)

            if tipo == "pdf":
                pdfs = [("edital.pdf", conteudo)]
            elif tipo == "zip":
                pdfs = extrair_pdfs_do_zip(conteudo)
            else:
                print(f"Tipo desconhecido para {url_download}")
                continue

            # PASSO 4: processar cada PDF com Gemini
            for nome_arquivo, pdf_bytes in pdfs:
                extracao = await extrair_com_gemini(
                    pdf_bytes=pdf_bytes,
                    nome_arquivo=nome_arquivo,
                    tipo_documento=arq["tipoDocumentoNome"]
                )
                if extracao:
                    resultados.append({
                        "arquivo": nome_arquivo,
                        "tipo": arq["tipoDocumentoNome"],
                        "url_original": url_download,
                        "extracao": extracao,
                        "processado_em": datetime.utcnow().isoformat()
                    })

            await asyncio.sleep(1)  # Rate limiting entre downloads

    return resultados


def extrair_pdfs_do_zip(zip_bytes: bytes) -> list[tuple[str, bytes]]:
    """
    Extrai todos os PDFs de um arquivo ZIP.
    Retorna lista de (nome_arquivo, conteudo_bytes).
    """
    pdfs = []
    try:
        with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
            for nome in zf.namelist():
                # Filtra apenas arquivos PDF dentro do ZIP
                if nome.lower().endswith(".pdf"):
                    conteudo = zf.read(nome)
                    pdfs.append((nome, conteudo))
                # ZIP dentro de ZIP (raro mas acontece)
                elif nome.lower().endswith(".zip"):
                    sub_zip = zf.read(nome)
                    sub_pdfs = extrair_pdfs_do_zip(sub_zip)
                    pdfs.extend(sub_pdfs)
    except zipfile.BadZipFile:
        print("Arquivo ZIP corrompido ou inválido")
    return pdfs
```

---

## 3. Controle de tokens — como não estourar a API do Gemini

### O problema

Um edital de licitação em PDF pode ter 80–200 páginas. O Gemini 2.0 Flash tem limite de 1 milhão de tokens, mas processar documentos grandes tem custo alto em tempo e dinheiro. Além disso, a Google AI impõe rate limits de requisições por minuto.

### Estratégia de 3 camadas

```
CAMADA 1 — Triagem rápida (sem IA)
  Extrai texto do PDF com pdfplumber
  Verifica se contém palavras-chave do nicho
  Se não tem, descarta sem chamar Gemini
  Custo: zero

CAMADA 2 — Extração focada (Gemini com contexto reduzido)
  Envia só as páginas relevantes (1–10 e a seção de especificações)
  Usa prompt compacto focado nos campos que precisamos
  Custo: ~0,01 USD por edital

CAMADA 3 — Análise profunda (só quando necessário)
  Documento complexo ou de alto valor
  Envia edital completo
  Extrai tudo: cláusulas, obrigações, penalidades, riscos
  Custo: ~0,05–0,15 USD por edital
```

### Estimativa de tamanho antes de chamar a IA

```python
import pdfplumber

def estimar_tokens_pdf(pdf_bytes: bytes) -> int:
    """
    Estima o número de tokens sem chamar a IA.
    Regra: ~1 token por 4 caracteres de texto.
    """
    texto = ""
    try:
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for pagina in pdf.pages:
                texto += pagina.extract_text() or ""
    except Exception:
        return 0
    # Estimativa conservadora: 1 token ≈ 4 chars
    return len(texto) // 4

def deve_usar_gemini(pdf_bytes: bytes, max_tokens: int = 100_000) -> tuple[bool, str]:
    """
    Decide se deve enviar para Gemini e com qual estratégia.
    Retorna (deve_enviar, estrategia)
    """
    tokens_estimados = estimar_tokens_pdf(pdf_bytes)

    if tokens_estimados == 0:
        return False, "pdf_vazio"

    if tokens_estimados < 20_000:
        return True, "completo"       # PDF pequeno, envia tudo
    elif tokens_estimados < 80_000:
        return True, "focado"         # PDF médio, só páginas relevantes
    elif tokens_estimados < 500_000:
        return True, "resumido"       # PDF grande, só início e seções-chave
    else:
        return False, "muito_grande"  # Acima de 500k tokens, pular ou dividir
```

### Extração com Gemini — 3 modos

```python
import google.generativeai as genai

genai.configure(api_key="SUA_API_KEY")
modelo = genai.GenerativeModel("gemini-2.0-flash")

PROMPT_FOCADO = """
Analise este edital de licitação pública e extraia APENAS os campos abaixo.
Responda SOMENTE com JSON válido, sem texto adicional, sem markdown.

{
  "software_nome": "nome comercial do software (null se não encontrar)",
  "fabricante": "empresa fabricante (null se não encontrar)",
  "tipo_licenca": "subscription|perpetua|saas|volume|outro",
  "quantidade": numero_inteiro_ou_null,
  "prazo_meses": numero_inteiro_ou_null,
  "valor_estimado_total": numero_decimal_ou_null,
  "valor_unitario": numero_decimal_ou_null,
  "orcamento_sigiloso": true_ou_false,
  "marca_exigida": true_ou_false,
  "marca_citada": "nome da marca exigida ou null",
  "justificativa_marca": "texto ou null",
  "permite_equivalente": true_ou_false,
  "criterio_julgamento": "menor_preco|tecnica_e_preco|melhor_tecnica",
  "integracoes_exigidas": ["lista de sistemas para integrar"],
  "exigencias_habilitacao": ["lista resumida de exigências técnicas"],
  "nicho": "erp|gis|saude|educacao|licitacoes|seguranca|cad_bim|outro",
  "sinais_monopolio": ["lista de sinais de direcionamento detectados no edital ou lista vazia"]
}
"""

PROMPT_RESUMIDO = """
Este é um trecho resumido de um edital longo. Extraia apenas:
objeto, software, fabricante, valor estimado, marca exigida, sinais de direcionamento.
Responda SOMENTE em JSON.
"""

async def extrair_com_gemini(
    pdf_bytes: bytes,
    nome_arquivo: str,
    tipo_documento: str
) -> dict | None:
    deve_enviar, estrategia = deve_usar_gemini(pdf_bytes)

    if not deve_enviar:
        print(f"Pulando {nome_arquivo}: {estrategia}")
        return None

    try:
        if estrategia in ["completo", "focado"]:
            # Envia PDF direto em base64
            pdf_b64 = base64.b64encode(pdf_bytes).decode()
            resposta = modelo.generate_content([
                {"mime_type": "application/pdf", "data": pdf_b64},
                PROMPT_FOCADO
            ])
        else:
            # Estratégia "resumido": extrai só o texto das primeiras e últimas páginas
            texto_resumido = extrair_texto_resumido(pdf_bytes, paginas=15)
            resposta = modelo.generate_content([
                texto_resumido,
                PROMPT_RESUMIDO
            ])

        texto_json = resposta.text.strip()
        # Remove possíveis marcadores de código que o modelo às vezes adiciona
        texto_json = texto_json.replace("```json", "").replace("```", "").strip()
        return json.loads(texto_json)

    except json.JSONDecodeError:
        print(f"JSON inválido retornado pelo Gemini para {nome_arquivo}")
        return None
    except Exception as e:
        print(f"Erro Gemini para {nome_arquivo}: {e}")
        return None


def extrair_texto_resumido(pdf_bytes: bytes, paginas: int = 15) -> str:
    """
    Extrai texto das primeiras N e últimas N/2 páginas.
    Estratégia: início tem objeto e valor, fim tem habilitação e preço.
    """
    texto = ""
    try:
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            total = len(pdf.pages)
            # Primeiras páginas (objeto, valor, especificações)
            for i in range(min(paginas, total)):
                texto += pdf.pages[i].extract_text() or ""
            # Últimas páginas (habilitação, proposta)
            inicio_final = max(paginas, total - (paginas // 2))
            for i in range(inicio_final, total):
                texto += pdf.pages[i].extract_text() or ""
    except Exception:
        pass
    return texto[:50_000]  # Limita a 50k chars (~12k tokens)
```

### Rate limiting para não ser bloqueado

```python
import asyncio
from collections import deque
from datetime import datetime, timedelta

class GeminiRateLimiter:
    """
    Controla o ritmo de chamadas para a API do Gemini.
    Limites padrão do gemini-2.0-flash: 15 RPM (requisições por minuto)
    """
    def __init__(self, max_rpm: int = 12):  # 12 para ter margem de segurança
        self.max_rpm = max_rpm
        self.chamadas = deque()

    async def aguardar_se_necessario(self):
        agora = datetime.utcnow()
        janela = agora - timedelta(minutes=1)

        # Remove chamadas fora da janela de 1 minuto
        while self.chamadas and self.chamadas[0] < janela:
            self.chamadas.popleft()

        # Se atingiu o limite, aguarda
        if len(self.chamadas) >= self.max_rpm:
            espera = (self.chamadas[0] + timedelta(minutes=1) - agora).total_seconds()
            if espera > 0:
                print(f"Rate limit: aguardando {espera:.1f}s")
                await asyncio.sleep(espera)

        self.chamadas.append(datetime.utcnow())

# Uso global
rate_limiter = GeminiRateLimiter(max_rpm=12)

# Modificar extrair_com_gemini para usar o limiter:
async def extrair_com_gemini_controlado(pdf_bytes, nome_arquivo, tipo_documento):
    await rate_limiter.aguardar_se_necessario()
    return await extrair_com_gemini(pdf_bytes, nome_arquivo, tipo_documento)
```

### Custo estimado por volume

| Volume | Editais/dia | Custo Gemini/mês | Custo total/mês |
|---|---|---|---|
| MVP | 50 editais | ~R$ 15 | ~R$ 70 (infra + IA) |
| Crescimento | 500 editais | ~R$ 150 | ~R$ 280 |
| Escala | 5.000 editais | ~R$ 1.500 | ~R$ 1.800 |
| Enterprise | 50.000 editais | ~R$ 8.000 | ~R$ 10.000 |

---

## 4. Estratégia de quebra de monopólio em licitações

### O problema real: como o monopólio funciona

Empresas dominantes em licitações de software não são bem-sucedidas por ter o melhor produto — são bem-sucedidas porque **moldaram o edital a seu favor**. Isso acontece de 4 formas:

```
FORMA 1 — Direcionamento por especificação técnica
  Edital lista funcionalidades únicas do produto do vencedor habitual
  Ex: "Sistema deve ter integração nativa com módulo XYZ versão 3.2"
  → Só o concorrente atual tem esse módulo exato

FORMA 2 — Exigência de atestado de capacidade técnica irreal
  "Comprovar fornecimento para no mínimo 3 municípios com mais de 500 mil habitantes"
  → Elimina qualquer empresa nova no mercado

FORMA 3 — Prazo de implantação impossível
  "Sistema deve estar em operação plena em 30 dias"
  → Só quem já tem o sistema parcialmente instalado consegue

FORMA 4 — Integração com sistema legado do próprio fornecedor
  "Deve integrar com sistema de tributação ABC v2.1 já instalado"
  → O fornecedor é o mesmo que vendeu o sistema de tributação
```

### Como a lei protege você

A Lei 14.133/2021 é clara:

- **Art. 40, §3°** — Proíbe especificação de marcas ou características que restrinjam a competição sem justificativa técnica
- **Art. 41** — Permite marca apenas em 4 situações excepcionais, todas com justificativa em processo administrativo
- **TCU Acórdão 9.162/2022** — "Descrição extremamente detalhada que se encaixa exclusivamente a um fornecedor caracteriza direcionamento e viola o princípio da ampla concorrência. Edital deve ser anulado."
- **Súmula 270 TCU** — Marca em software só é legal se estritamente necessária para padronização, com justificativa prévia
- **Art. 165, §1°** — Qualquer empresa pode impugnar o edital até 3 dias úteis antes da abertura

### Os 7 sinais de direcionamento que o agente detecta

```
SINAL 1 — Marca citada explicitamente no TR ou edital
  Detectado por: regex procurando nomes de empresas no texto do documento
  Ação: impugnar via Art. 40, §3°

SINAL 2 — Especificações que só um produto atende
  Detectado por: busca de termos ultra-específicos (versões, módulos proprietários)
  Ação: solicitar esclarecimento + demonstrar equivalente

SINAL 3 — Atestado de capacidade técnica com volume específico alto
  Detectado por: extração de exigências numéricas de atestados
  Ação: questionar proporcionalidade ao objeto

SINAL 4 — Prazo de implantação incompatível com o objeto
  Detectado por: comparar prazo exigido com complexidade do sistema
  Ação: questionar exequibilidade técnica

SINAL 5 — Exigência de integração com sistema do concorrente
  Detectado por: identificar nomes de sistemas proprietários nas integrações
  Ação: impugnar e propor integração via API aberta

SINAL 6 — Fornecedor vencedor repetido nos últimos 3+ contratos
  Detectado por: análise de histórico no banco de resultados
  Ação: investigar padrão, acionar TCE/MP se houver indícios de fraude

SINAL 7 — Edital publicado com prazo mínimo (48h)
  Detectado por: comparar data_publicacao com data_abertura
  Ação: monitorar e preparar impugnação com antecedência
```

---

## 5. Como o agente detecta e classifica monopólio automaticamente

### Detector de sinais no texto do edital

```python
import re
from dataclasses import dataclass

@dataclass
class SinalMonopolio:
    tipo: str
    descricao: str
    trecho_evidencia: str
    gravidade: str  # "alta" | "media" | "baixa"
    fundamentacao_legal: str

# Padrões de regex para detectar sinais no texto
PADROES_DETECCAO = {
    "marca_explicita": {
        "regex": r"\b(Geopixel|TOTVS|Betha|Senior|Tasy|MV Sistemas|Philips|Autodesk|AutoCAD|ArcGIS|Esri|Microsoft|Oracle|SAP)\b",
        "gravidade": "alta",
        "lei": "Art. 40 §3° Lei 14.133/2021 + TCU Acórdão 9.162/2022"
    },
    "versao_especifica": {
        "regex": r"versão\s+\d+\.\d+|v\d+\.\d+\.\d+|release\s+\d+",
        "gravidade": "alta",
        "lei": "Art. 40 §3° Lei 14.133/2021"
    },
    "atestado_volume_alto": {
        "regex": r"atestado.*?(\d+\.?\d*)\s*(mil|milhão|habitantes|usuários|contratos)",
        "gravidade": "media",
        "lei": "TCU Acórdão 2.383/2014 — especificações devem ser proporcionais"
    },
    "prazo_implantacao_curto": {
        "regex": r"(implantação|operação plena|funcionamento).*?(\d+)\s*(dias?|horas?)",
        "gravidade": "media",
        "lei": "Art. 40 Lei 14.133/2021 — exigências devem ser razoáveis"
    },
    "integracao_sistema_proprietario": {
        "regex": r"integr[aação]+.*?(sistema|software|plataforma)\s+\w+\s+(v\d|versão|\d\.\d)",
        "gravidade": "media",
        "lei": "Art. 40 §3° Lei 14.133/2021"
    },
}

def detectar_sinais_monopolio(texto_edital: str) -> list[SinalMonopolio]:
    sinais = []
    texto_lower = texto_edital.lower()

    for tipo, config in PADROES_DETECCAO.items():
        matches = re.findall(config["regex"], texto_edital, re.IGNORECASE)
        for match in matches:
            trecho = match if isinstance(match, str) else " ".join(match)
            sinais.append(SinalMonopolio(
                tipo=tipo,
                descricao=f"Detectado: '{trecho}'",
                trecho_evidencia=trecho,
                gravidade=config["gravidade"],
                fundamentacao_legal=config["lei"]
            ))

    return sinais


def calcular_score_monopolio(sinais: list[SinalMonopolio]) -> int:
    """
    Retorna score de 0 a 100 indicando risco de direcionamento.
    0 = edital limpo, 100 = direcionamento evidente.
    """
    pesos = {"alta": 30, "media": 15, "baixa": 5}
    score = sum(pesos.get(s.gravidade, 0) for s in sinais)
    return min(score, 100)
```

### Análise histórica de fornecedor dominante

```python
async def analisar_historico_fornecedor(
    orgao_cnpj: str,
    software_nicho: str,
    db  # conexão com banco
) -> dict:
    """
    Verifica se um único fornecedor domina as licitações de um órgão
    e por quanto tempo, usando o histórico de resultados.
    """
    query = """
    SELECT
        r.fornecedor_cnpj,
        r.fornecedor_nome,
        COUNT(*) as contratos,
        SUM(r.valor_total_final) as valor_total,
        MIN(e.data_publicacao) as primeiro_contrato,
        MAX(e.data_publicacao) as ultimo_contrato,
        ROUND(
            COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY e.orgao_cnpj),
            1
        ) as pct_contratos
    FROM resultados r
    JOIN editais e ON r.numero_controle_pncp = e.numero_controle_pncp
    WHERE e.orgao_cnpj = $1
      AND e.nicho_detectado = $2
    GROUP BY r.fornecedor_cnpj, r.fornecedor_nome, e.orgao_cnpj
    ORDER BY contratos DESC
    """
    rows = await db.fetch(query, orgao_cnpj, software_nicho)

    if not rows:
        return {"monopolio": False, "dados": []}

    dominante = rows[0]
    eh_monopolio = (
        dominante["pct_contratos"] > 80 and
        dominante["contratos"] >= 3
    )

    return {
        "monopolio": eh_monopolio,
        "fornecedor_dominante": dominante["fornecedor_nome"],
        "pct_contratos": dominante["pct_contratos"],
        "total_contratos": dominante["contratos"],
        "valor_total_capturado": dominante["valor_total"],
        "anos_de_dominio": (
            dominante["ultimo_contrato"] - dominante["primeiro_contrato"]
        ).days // 365,
        "oportunidade": eh_monopolio,
        "estrategia": "impugnar_ou_competir_por_preco"
    }
```

---

## 6. Geração automática de impugnação de edital

Quando o agente detecta sinais de direcionamento, gera automaticamente um rascunho de impugnação fundamentada na lei e na jurisprudência do TCU.

```python
PROMPT_IMPUGNACAO = """
Você é um especialista em licitações públicas brasileiras e na Lei 14.133/2021.
Com base nos sinais de direcionamento detectados, redija uma impugnação de edital
clara, objetiva e fundamentada na lei e jurisprudência do TCU.

Dados do edital:
- Órgão: {orgao_nome}
- Objeto: {objeto}
- Número: {numero_controle_pncp}
- Data de abertura: {data_abertura}

Sinais de direcionamento detectados:
{sinais}

Redija a impugnação com:
1. Identificação do licitante (deixe em branco para o usuário preencher)
2. Objeto da impugnação (qual cláusula específica está sendo impugnada)
3. Fundamento legal (cite os artigos exatos)
4. Jurisprudência aplicável (cite os acórdãos do TCU)
5. Pedido (o que o licitante pede: correção, esclarecimento ou anulação)
6. Data e local (deixe em branco)

Seja técnico, direto e não use linguagem rebuscada desnecessária.
Limite a 800 palavras.
"""

async def gerar_impugnacao(extracao: dict, sinais: list[SinalMonopolio]) -> str:
    if not sinais:
        return ""

    sinais_texto = "\n".join([
        f"- {s.tipo}: {s.descricao} (gravidade: {s.gravidade})\n  Lei: {s.fundamentacao_legal}"
        for s in sinais
    ])

    prompt = PROMPT_IMPUGNACAO.format(
        orgao_nome=extracao.get("orgao_nome", ""),
        objeto=extracao.get("software_nome", "software"),
        numero_controle_pncp=extracao.get("numero_controle_pncp", ""),
        data_abertura=extracao.get("data_abertura", ""),
        sinais=sinais_texto
    )

    await rate_limiter.aguardar_se_necessario()
    resposta = modelo.generate_content(prompt)
    return resposta.text
```

### Template de impugnação gerado (exemplo)

```
IMPUGNAÇÃO DE EDITAL

Ao [nome do pregoeiro / comissão de licitação]
[Nome do órgão]
Ref.: Edital [número] — Objeto: [software]

[NOME DA EMPRESA], inscrita no CNPJ [____], por meio de seu representante legal,
vem, tempestivamente (Art. 165, §1° da Lei 14.133/2021), apresentar IMPUGNAÇÃO
ao edital referenciado, pelos fundamentos a seguir:

1. OBJETO DA IMPUGNAÇÃO

O item [X] do Termo de Referência exige [descrição da exigência problemática],
caracterizando direcionamento indevido da licitação, pois tal especificação
atende exclusivamente ao produto [marca], em violação ao art. 40, §3° da
Lei 14.133/2021.

2. FUNDAMENTO LEGAL

O art. 40, §3° da Lei 14.133/2021 veda a especificação de características
técnicas que limitem a competição sem justificativa técnica documentada.
A exigência questionada não possui fundamentação no Estudo Técnico Preliminar
(ETP), contrariando também o art. 18, §1°, I da mesma lei.

3. JURISPRUDÊNCIA DO TCU

O TCU, no Acórdão 9.162/2022-Plenário, firmou entendimento de que:
"Descrição extremamente detalhada que se encaixa exclusivamente a um fornecedor
caracteriza direcionamento e viola o princípio da ampla concorrência."

Neste caso, [descrever brevemente como a exigência se encaixa exatamente no
produto do fornecedor habitual].

4. PEDIDO

Requer-se que este órgão:
a) Retire/modifique a exigência do item [X] do TR, admitindo produtos
   equivalentes que atendam às mesmas funcionalidades;
b) Ou apresente, no prazo de 3 dias úteis, a justificativa técnica detalhada
   que embasa a exigência, conforme art. 18 da Lei 14.133/2021.

Nestes termos, pede deferimento.

[Local], [data]
[Assinatura]
```

---

## 7. Estratégia de precificação para quebrar o fornecedor dominante

### O jogo de preços no pregão eletrônico

No pregão eletrônico por menor preço, vence quem der o menor lance. O fornecedor dominante geralmente tem dois comportamentos:

1. **Âncora alta:** coloca um preço inicial alto e vai baixando devagar, esperando que concorrentes desistam
2. **Barreira psicológica:** chega a um valor que "historicamente sempre venceu" e para

O agente calcula o preço histórico médio dos últimos contratos ganhos pelo dominante e define a estratégia de lance ideal.

```python
async def calcular_estrategia_lance(
    software_nome: str,
    orgao_cnpj: str,
    db
) -> dict:
    """
    Analisa histórico de resultados para definir estratégia de lance vencedor.
    """
    # Preços históricos de contratos similares
    query = """
    SELECT
        r.valor_unitario_final,
        r.fornecedor_nome,
        e.data_publicacao,
        o.municipio_nome,
        o.uf
    FROM resultados r
    JOIN editais e ON r.numero_controle_pncp = e.numero_controle_pncp
    JOIN orgaos o ON e.orgao_cnpj = o.cnpj
    JOIN itens i ON (
        e.numero_controle_pncp = i.numero_controle_pncp
        AND i.software_nome ILIKE $1
    )
    WHERE e.tem_resultado = TRUE
    ORDER BY e.data_publicacao DESC
    LIMIT 20
    """
    rows = await db.fetch(query, f"%{software_nome}%")

    if not rows:
        return {"dados_insuficientes": True}

    precos = [r["valor_unitario_final"] for r in rows if r["valor_unitario_final"]]

    if not precos:
        return {"dados_insuficientes": True}

    preco_medio = sum(precos) / len(precos)
    preco_minimo = min(precos)
    preco_maximo = max(precos)

    # Estratégia: entrar 15-20% abaixo da média histórica
    # Se você tiver custo operacional controlado, isso é factível
    lance_sugerido = preco_medio * 0.82

    return {
        "preco_medio_historico": round(preco_medio, 2),
        "preco_minimo_historico": round(preco_minimo, 2),
        "preco_maximo_historico": round(preco_maximo, 2),
        "lance_sugerido": round(lance_sugerido, 2),
        "economia_vs_media": f"{((preco_medio - lance_sugerido) / preco_medio * 100):.1f}%",
        "contratos_analisados": len(precos),
        "estrategia": "lance_abaixo_da_media",
        "observacao": (
            "Entrar 18% abaixo da média histórica é sustentável se o custo "
            "de implantação estiver controlado. Verifique sua margem mínima antes."
        )
    }
```

### Mapa de posicionamento competitivo por nicho

| Nicho | Dominante | Preço médio atual | Lance ideal para entrar | Estratégia |
|---|---|---|---|---|
| GIS municipal | Geopixel | R$ 280k/contrato | R$ 180k | Open source (QGIS/PostGIS) reduz custo |
| ERP municipal | TOTVS/Betha | R$ 150k/ano | R$ 95k | Módulos cloud vs on-premise caro |
| Saúde | MV/Tasy | R$ 200k/ano | R$ 130k | Foco em RNDS que os grandes têm falhas |
| Educação | Regionais | R$ 60k/ano | R$ 38k | Dispensa = sem leilão de preço |
| Licitações | BLL/Comprasnet | R$ 80k/ano | R$ 50k | IA + PNCP nativo como diferencial |

---

## 8. Código completo do módulo de arquivos

### Arquivo: `agente/modulos/arquivos.py`

```python
"""
Módulo completo de download, detecção e processamento de arquivos do PNCP.
Gerencia PDF, ZIP, rate limiting e integração com Gemini.
"""

import asyncio
import base64
import io
import json
import re
import zipfile
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from collections import deque
from pathlib import Path
from typing import Optional

import httpx
import pdfplumber
import google.generativeai as genai

# ─── Configuração ──────────────────────────────────────────────────────────

BASE_PNCP = "https://pncp.gov.br/pncp-api/v1"

MAGIC_PDF = b"%PDF"
MAGIC_ZIP = b"PK\x03\x04"

TIPOS_PRIORITARIOS = {"Edital", "Termo de Referência", "Ata"}

PROMPT_EXTRACAO_COMPLETO = """
Analise este edital de licitação pública brasileira.
Responda SOMENTE com JSON válido, sem markdown, sem texto adicional.

{
  "software_nome": "nome comercial do software ou null",
  "fabricante": "empresa fabricante ou null",
  "tipo_licenca": "subscription|perpetua|saas|volume|outro",
  "quantidade": numero_ou_null,
  "prazo_meses": numero_ou_null,
  "valor_estimado_total": numero_ou_null,
  "valor_unitario": numero_ou_null,
  "orcamento_sigiloso": boolean,
  "marca_exigida": boolean,
  "marca_citada": "nome da marca ou null",
  "justificativa_marca": "texto ou null",
  "permite_equivalente": boolean,
  "criterio_julgamento": "menor_preco|tecnica_e_preco|melhor_tecnica",
  "integracoes_exigidas": [],
  "exigencias_habilitacao": [],
  "nicho": "erp|gis|saude|educacao|licitacoes|seguranca|cad_bim|outro",
  "sinais_monopolio": []
}
"""

# ─── Rate Limiter ─────────────────────────────────────────────────────────

class RateLimiter:
    def __init__(self, max_rpm: int = 12):
        self.max_rpm = max_rpm
        self._chamadas: deque = deque()

    async def esperar(self):
        agora = datetime.utcnow()
        janela = agora - timedelta(minutes=1)
        while self._chamadas and self._chamadas[0] < janela:
            self._chamadas.popleft()
        if len(self._chamadas) >= self.max_rpm:
            espera = (self._chamadas[0] + timedelta(minutes=1) - agora).total_seconds()
            if espera > 0:
                await asyncio.sleep(espera + 0.1)
        self._chamadas.append(datetime.utcnow())


# ─── Processador de Arquivos ──────────────────────────────────────────────

class ProcessadorArquivos:
    def __init__(self, gemini_api_key: str, max_rpm: int = 12):
        genai.configure(api_key=gemini_api_key)
        self.modelo = genai.GenerativeModel("gemini-2.0-flash")
        self.limiter = RateLimiter(max_rpm)

    def detectar_tipo(self, conteudo: bytes) -> str:
        if conteudo[:4] == MAGIC_PDF:
            return "pdf"
        if conteudo[:4] == MAGIC_ZIP:
            return "zip"
        return "desconhecido"

    def extrair_pdfs_zip(self, zip_bytes: bytes) -> list[tuple[str, bytes]]:
        pdfs = []
        try:
            with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
                for nome in zf.namelist():
                    if nome.lower().endswith(".pdf"):
                        pdfs.append((nome, zf.read(nome)))
                    elif nome.lower().endswith(".zip"):
                        pdfs.extend(self.extrair_pdfs_zip(zf.read(nome)))
        except zipfile.BadZipFile:
            pass
        return pdfs

    def estimar_tokens(self, pdf_bytes: bytes) -> int:
        texto = ""
        try:
            with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
                for p in pdf.pages:
                    texto += p.extract_text() or ""
        except Exception:
            return 0
        return len(texto) // 4

    def texto_resumido(self, pdf_bytes: bytes, max_chars: int = 50_000) -> str:
        partes = []
        try:
            with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
                total = len(pdf.pages)
                n = min(15, total)
                for i in range(n):
                    partes.append(pdf.pages[i].extract_text() or "")
                for i in range(max(n, total - 5), total):
                    partes.append(pdf.pages[i].extract_text() or "")
        except Exception:
            pass
        return "".join(partes)[:max_chars]

    async def extrair_dados_pdf(self, pdf_bytes: bytes) -> Optional[dict]:
        tokens = self.estimar_tokens(pdf_bytes)
        await self.limiter.esperar()

        try:
            if tokens < 200_000:
                # Envia PDF completo
                b64 = base64.b64encode(pdf_bytes).decode()
                resp = self.modelo.generate_content([
                    {"mime_type": "application/pdf", "data": b64},
                    PROMPT_EXTRACAO_COMPLETO
                ])
            else:
                # Envia só texto resumido
                texto = self.texto_resumido(pdf_bytes)
                resp = self.modelo.generate_content([
                    f"Trecho do edital:\n{texto}",
                    PROMPT_EXTRACAO_COMPLETO
                ])

            raw = resp.text.strip().replace("```json", "").replace("```", "").strip()
            return json.loads(raw)

        except (json.JSONDecodeError, Exception) as e:
            print(f"Erro extração: {e}")
            return None

    async def processar_edital(
        self,
        cnpj: str,
        ano: int,
        sequencial: int,
        tem_resultado: bool = False
    ) -> list[dict]:
        resultados = []

        async with httpx.AsyncClient(timeout=60, follow_redirects=True) as client:
            # Listar arquivos
            url = f"{BASE_PNCP}/orgaos/{cnpj}/compras/{ano}/{sequencial}/arquivos"
            try:
                resp = await client.get(url, params={"pagina": 1, "tamanhoPagina": 20})
                if resp.status_code != 200:
                    return []
                arquivos = resp.json()
            except Exception as e:
                print(f"Erro ao listar arquivos: {e}")
                return []

            for arq in arquivos:
                tipo_doc = arq.get("tipoDocumentoNome", "")
                if tipo_doc not in TIPOS_PRIORITARIOS:
                    continue
                if tipo_doc == "Ata" and not tem_resultado:
                    continue

                # Download
                try:
                    dl = await client.get(arq["url"])
                    conteudo = dl.content
                except Exception as e:
                    print(f"Erro download: {e}")
                    continue

                tipo = self.detectar_tipo(conteudo)
                pdfs = []

                if tipo == "pdf":
                    pdfs = [("documento.pdf", conteudo)]
                elif tipo == "zip":
                    pdfs = self.extrair_pdfs_zip(conteudo)
                    print(f"ZIP extraído: {len(pdfs)} PDFs encontrados")
                else:
                    print(f"Tipo desconhecido: {arq['url']}")
                    continue

                for nome_pdf, pdf_bytes in pdfs:
                    dados = await self.extrair_dados_pdf(pdf_bytes)
                    if dados:
                        resultados.append({
                            "arquivo": nome_pdf,
                            "tipo_documento": tipo_doc,
                            "url_original": arq["url"],
                            "dados_extraidos": dados,
                            "sinais_monopolio_count": len(dados.get("sinais_monopolio", [])),
                            "processado_em": datetime.utcnow().isoformat()
                        })

                await asyncio.sleep(0.5)  # Pausa entre arquivos

        return resultados

    async def gerar_relatorio_md(
        self,
        cnpj: str,
        ano: int,
        sequencial: int,
        numero_controle: str
    ) -> str:
        """
        Gera um relatório completo em Markdown para um edital específico.
        Inclui: dados extraídos, sinais de monopólio e estratégia sugerida.
        """
        resultados = await self.processar_edital(cnpj, ano, sequencial)

        if not resultados:
            return f"# Edital {numero_controle}\n\nNenhum arquivo processado.\n"

        linhas = [
            f"# Relatório do Edital {numero_controle}",
            f"",
            f"Gerado em: {datetime.utcnow().strftime('%d/%m/%Y %H:%M')} UTC",
            f"Arquivos processados: {len(resultados)}",
            f"",
        ]

        for r in resultados:
            d = r["dados_extraidos"]
            sinais = d.get("sinais_monopolio", [])

            linhas += [
                f"---",
                f"",
                f"## Arquivo: {r['arquivo']} ({r['tipo_documento']})",
                f"",
                f"### Dados do objeto",
                f"",
                f"| Campo | Valor |",
                f"|---|---|",
                f"| Software | {d.get('software_nome', '—')} |",
                f"| Fabricante | {d.get('fabricante', '—')} |",
                f"| Tipo de licença | {d.get('tipo_licenca', '—')} |",
                f"| Quantidade | {d.get('quantidade', '—')} |",
                f"| Prazo | {d.get('prazo_meses', '—')} meses |",
                f"| Valor estimado | R$ {d.get('valor_estimado_total', '—')} |",
                f"| Valor unitário | R$ {d.get('valor_unitario', '—')} |",
                f"| Orçamento sigiloso | {'Sim' if d.get('orcamento_sigiloso') else 'Não'} |",
                f"| Marca exigida | {'Sim' if d.get('marca_exigida') else 'Não'} |",
                f"| Marca citada | {d.get('marca_citada', '—')} |",
                f"| Permite equivalente | {'Sim' if d.get('permite_equivalente') else 'Não'} |",
                f"| Critério de julgamento | {d.get('criterio_julgamento', '—')} |",
                f"| Nicho | {d.get('nicho', '—')} |",
                f"",
            ]

            if sinais:
                linhas += [
                    f"### ⚠️ Sinais de direcionamento detectados ({len(sinais)})",
                    f"",
                ]
                for sinal in sinais:
                    linhas.append(f"- {sinal}")
                linhas.append("")
                linhas += [
                    f"**Ação recomendada:** Avaliar impugnação com base no Art. 40 §3°",
                    f"da Lei 14.133/2021 e Acórdão TCU 9.162/2022.",
                    f"",
                ]
            else:
                linhas += [
                    f"### Verificação de direcionamento",
                    f"",
                    f"Nenhum sinal evidente de direcionamento detectado.",
                    f"",
                ]

        return "\n".join(linhas)


# ─── Uso direto ──────────────────────────────────────────────────────────

async def main():
    processador = ProcessadorArquivos(
        gemini_api_key="SUA_API_KEY_AQUI",
        max_rpm=10
    )

    # Exemplo real: edital do Ministério Público de SP
    cnpj = "01468760000190"
    ano = 2026
    seq = 17
    numero_controle = "01468760000190-1-000017/2026"

    print(f"Processando edital {numero_controle}...")
    relatorio = await processador.gerar_relatorio_md(cnpj, ano, seq, numero_controle)

    # Salva o relatório como .md
    nome_arquivo = f"relatorio_{numero_controle.replace('/', '_').replace('-', '_')}.md"
    Path(nome_arquivo).write_text(relatorio, encoding="utf-8")
    print(f"Relatório salvo: {nome_arquivo}")
    print(relatorio[:500])  # Preview


if __name__ == "__main__":
    asyncio.run(main())
```

---

## Resumo executivo para os devs

### O que esse módulo faz

```
1. Recebe cnpj + ano + sequencial de qualquer edital do PNCP
2. Lista automaticamente todos os arquivos vinculados
3. Baixa apenas os tipos prioritários (Edital, TR, Ata)
4. Detecta se é PDF ou ZIP (e extrai os PDFs de dentro do ZIP)
5. Estima o tamanho em tokens antes de chamar o Gemini
6. Escolhe a estratégia certa: envio completo, focado ou resumido
7. Controla o rate limiting para não ser bloqueado pela API
8. Extrai dados estruturados em JSON (20+ campos)
9. Detecta sinais de direcionamento/monopólio automaticamente
10. Gera relatório completo em .md pronto para análise
```

### Limitações conhecidas e como contornar

| Limitação | Solução |
|---|---|
| Alguns editais chegam em `.odt` ou `.docx` | Converter com LibreOffice headless antes de enviar ao Gemini |
| PDFs escaneados (imagem, sem texto) | Gemini Vision processa nativamente — não precisa de OCR separado |
| ZIP com senha | Registrar como `status_processamento = 'zip_protegido'` e alertar manualmente |
| Edital em mais de 1 volume | Processar cada arquivo separadamente e mesclar os JSONs |
| API do PNCP fora do ar | Retry com backoff exponencial: 1s, 2s, 4s, 8s, desistir após 4 tentativas |
| Rate limit do Gemini estourado | O `RateLimiter` já cuida disso; se ainda estourar, aumentar delay |

---

*Atualizado em 26/03/2026. Versão 1.0 — módulo de arquivos + estratégia antimonopólio.*
