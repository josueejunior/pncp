\*\*ADDENDUM - NOVAS DESCOBERTAS\*\*



\_Ultimate AI Agent Architecture Guide\_



Atualização: Março 2026 | Seções 32 \& 33



\# \*\*32\\. AlphaEvolve - O Agente que Escreve Seus Próprios Algoritmos\*\*



Em maio de 2025, o Google DeepMind apresentou o AlphaEvolve: um agente de codificação evolutivo que combina as capacidades generativas de modelos Gemini com avaliadores automatizados em um loop evolutivo iterativo. A arquitetura representa uma mudança de paradigma - o agente não apenas resolve problemas, ele descobre os procedimentos de busca necessários para encontrar as soluções. Em março de 2026, o sistema quebrou recordes décades de Teoria de Ramsey que haviam resistido a décadas de esforço humano especializado, com um único meta-algoritmo unificado.



| \*\*⚡ Resultado Chave: Teoria de Ramsey (Março 2026)\*\*                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

| AlphaEvolve melhorou os limites inferiores de 5 números de Ramsey clássicos de uma vez:<br><br>R(3,13): 60 → 61 (recorde anterior mantido por 11 anos)<br><br>R(3,18): 99 → 100 (recorde anterior mantido por 20 anos)<br><br>R(4,13): 138 → 139 (recorde anterior mantido por 11 anos)<br><br>R(4,14): 147 → 148 (recorde anterior mantido por 11 anos)<br><br>R(4,15): 158 → 159 (recorde anterior mantido por 6 anos)<br><br>Além disso, cobriu 28 valores R(r,s) no total - igualando os melhores limites conhecidos<br><br>para todos os números de Ramsey cujos valores exatos já foram determinados. |



\## \*\*32.1 Arquitetura Central: O Loop Evolutivo\*\*



O AlphaEvolve opera em quatro componentes principais organizados em um ciclo contínuo de geração-avaliação-seleção-mutação:



| \*\*Componente\*\*              | \*\*Função\*\*                                                                                                                                                                                                                                                |

| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

| 1\\. LLM Ensemble            | Gemini Flash (geração rápida de candidatos) + Gemini Pro (refinamento de alta qualidade). O ensemble combina velocidade e qualidade criativa - Flash produz volume; Pro refina os mais promissores.                                                       |

| 2\\. Program Database        | Memória evolutiva que armazena todos os algoritmos já testados com seus scores. Serve de reservatório de inspiração - o sistema nunca parte do zero, sempre busca padrões de vitórias anteriores.                                                         |

| 3\\. Avaliadores Automáticos | Funções de avaliação definidas pelo usuário que retornam métricas escalares. Para Ramsey: verificam se um grafo é um grafo testemunha válido. Para álgebra linear: contam operações de multiplicação. O avaliador é a 'lei da física' do espaço de busca. |

| 4\\. Motor Evolutivo         | Seleciona os melhores candidatos do banco, instrui o LLM a propor mutações, avalia os resultantes, e atualiza o banco. Cada ciclo pode exigir até 15 mutações sucessivas para um único avanço.                                                            |



\## \*\*32.2 O Princípio Arquitetural Chave: Meta-Algoritmo\*\*



A distinção mais importante do AlphaEvolve não é que ele resolve problemas - é que ele descobre os procedimentos de busca para encontrá-los. Em Teoria de Ramsey, décadas de progresso exigiam que especialistas humanos projetassem um algoritmo de busca especializado do zero para cada número específico. O AlphaEvolve opera como um único meta-algoritmo que descobre automaticamente esses procedimentos específicos de domínio.



\\# Pseudocódigo do Loop Central do AlphaEvolve



def alphaevolve\_loop(problem\_skeleton, evaluator\_fn, max\_iterations=10000):



program\_db = initialize\_with\_skeleton(problem\_skeleton)



for iteration in range(max\_iterations):



\\# 1. Selecionar candidatos promissores do banco



parents = select\_top\_programs(program\_db, strategy='tournament')



\\# 2. LLM propõe mutações



prompt = build\_mutation\_prompt(parents, iteration\_context)



candidates = gemini\_flash.generate(prompt, n=20) # volume rápido



candidates += gemini\_pro.generate(prompt, n=5) # qualidade



\\# 3. Avaliação automática (sem humano no loop)



for candidate in candidates:



score = evaluator\_fn(candidate) # ex: conta multiplicações, verifica grafo



program\_db.add(candidate, score)



\\# 4. Poda: mantém diversidade + qualidade



program\_db.prune(keep\_best=0.3, keep\_diverse=0.2)



return program\_db.get\_best()



\\# Para Ramsey: o avaliador verifica se um grafo é testemunha válida



def ramsey\_evaluator(graph\_construction\_code):



graph = execute\_code(graph\_construction\_code)



return verify\_ramsey\_witness(graph) # booleano + tamanho do grafo



\## \*\*32.3 Capacidades Demonstradas\*\*



| \*\*Domínio\*\*                   | \*\*Resultado\*\*                          | \*\*Impacto\*\*                                            |

| ----------------------------- | -------------------------------------- | ------------------------------------------------------ |

| Teoria de Ramsey              | 5 recordes mundiais simultâneos        | Alguns desses recordes resistiram por 20 anos          |

| Multiplicação de matrizes 4×4 | 48 multiplicações (vs. 56 de Strassen) | Melhora um algoritmo de 56 anos em matemática complexa |

| FlashAttention Kernel         | +32,5% de speedup em GPUs              | Acelerou treino do próprio Gemini em 23%               |

| Data centers Google           | Recuperou 0,7% de compute global       | Impacto real em infraestrutura em produção             |

| Número de beijo (11D)         | Nova configuração de 593 esferas       | Avanço em problema de 300 anos em geometria            |

| 50+ problemas abertos         | 75% redescobriu SOTA; 20% melhorou     | Escala e generalidade sem precedentes                  |



\## \*\*32.4 Lição Arquitetural para Construtores de Agentes\*\*



O AlphaEvolve redefine o que um agente pode ser. A maioria dos agentes atuais usa ferramentas existentes. O AlphaEvolve gera as ferramentas. Isso tem implicações diretas para qualquer sistema de agentes:



\- \*\*Avaliadores automáticos são o componente crítico:\*\*

\- Se um problema pode ser verificado automaticamente, ele é candidato para exploração evolutiva. A qualidade do avaliador define o teto do sistema.

\- \*\*Memória evolutiva é superior à memória episódica simples:\*\*

\- O Program Database não apenas lembra - seleciona e cruza as melhores soluções passadas para gerar novas.

\- \*\*Ensemble de LLMs com papéis distintos:\*\*

\- Flash para exploração em volume, Pro para refinamento preciso - o padrão de separar velocidade de qualidade é replicável em qualquer arquitetura multi-agente.



| \*\*🔗 Referências\*\*                                                                                                                                                                                                                                                                                                                                                                         |

| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |

| Paper original AlphaEvolve: Novikov et al., 2025 (Google DeepMind)<br><br>Paper Ramsey: 'Reinforced Generation of Combinatorial Structures: Ramsey Numbers'<br><br>Nagda, Raghavan, Thakurta - arxiv.org/abs/2603.09172<br><br>Blog Google DeepMind: deepmind.google/blog/alphaevolve-a-gemini-powered-coding-agent<br><br>Paper exploração matemática em escala: arxiv.org/abs/2511.02864 |



\# \*\*33\\. OpenViking - Banco de Contexto com Paradigma de Sistema de Arquivos\*\*



OpenViking é um banco de dados de contexto open-source desenvolvido pela Volcengine (divisão de cloud da ByteDance), lançado no início de 2026 e licenciado sob Apache 2.0. O projeto alcançou mais de 13.300 estrelas no GitHub em menos de uma semana após o lançamento, sinalizando que ele resolve um problema real e generalizado no desenvolvimento de agentes. A ideia central: a gestão de contexto é um problema de banco de dados, não de engenharia de prompts.



| \*\*📊 Benchmark: LoCoMo10 (1.540 casos, diálogos de longa duração)\*\*                                                                                                                                                                                                                                             |

| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

| Taxa de conclusão Tokens de entrada<br><br>OpenClaw (sem OpenViking): 35,65% 24.611.530<br><br>OpenClaw + OpenViking: 52,08% 4.264.396<br><br>OpenClaw + OpenViking (full): 51,23% 2.099.622<br><br>→ Melhoria de +46% na taxa de conclusão de tarefas<br><br>→ Redução de 80%+ nos tokens consumidos por busca |



\## \*\*33.1 O Problema que OpenViking Resolve\*\*



Agentes de IA em produção acumulam contexto de múltiplas fontes: memórias de conversas, documentos externos, habilidades aprendidas, preferências do usuário. O modelo tradicional de RAG armazena tudo como vetores planos em um banco de dados - um modelo que falha em escala por quatro razões estruturais:



\- Fragmentação: memórias no código, recursos em bancos vetoriais, habilidades espalhadas em prompts - impossível gerenciar de forma unificada.

\- Demanda crescente: tarefas longas geram contexto em cada execução; truncação simples causa perda de informação.

\- Recuperação deficiente: RAG plano carece de visão global; não entende o contexto completo de onde uma informação reside.

\- Invisibilidade: a cadeia de recuperação do RAG tradicional é uma caixa preta - impossível depurar por que uma resposta falhou.



\## \*\*33.2 Arquitetura: O Paradigma de Sistema de Arquivos\*\*



OpenViking abandona o armazenamento vetorial fragmentado e adota um sistema de arquivos virtual acessível via protocolo viking://. Todo o contexto - memória, recursos, habilidades - é organizado em uma hierarquia de diretórios com URIs únicos.



viking://



├── resources/ # Documentação de projetos, repositórios, web



│ ├── .abstract # L0: Resumo de uma frase (\~100 tokens)



│ ├── .overview # L1: Visão geral com pontos-chave (\~2k tokens)



│ └── my\_project/



│ ├── .abstract



│ ├── .overview



│ ├── docs/



│ │ ├── api/



│ │ │ ├── auth.md # L2: Conteúdo completo (sob demanda)



│ │ │ └── endpoints.md



│ └── src/



├── user/ # Preferências, memórias, hábitos



│ └── memories/



└── agent/ # Habilidades, instruções, memória de tarefas



├── skills/



└── memories/



O agente navega essa estrutura com operações familiares de terminal (ls, find, tree) em vez de depender exclusivamente de busca semântica. Cada objeto de contexto é endereçável, versionável e linkável - ao contrário de fragmentos anônimos em um vetor store.



\## \*\*33.3 Carregamento de Contexto em Três Camadas (L0/L1/L2)\*\*



Cada item de contexto é automaticamente processado e armazenado em três versões quando é escrito no sistema:



| \*\*Camada\*\*      | \*\*Tamanho\*\*      | \*\*Conteúdo\*\*                                   | \*\*Quando Carregar\*\*                                  |

| --------------- | ---------------- | ---------------------------------------------- | ---------------------------------------------------- |

| L0 Abstract     | \~100 tokens      | Resumo de uma única frase                      | Sempre - verificação de relevância rápida            |

| L1 Overview     | \~2k tokens       | Visão geral com pontos-chave e cenários de uso | Quando L0 indica relevância - planejamento e seleção |

| L2 Full Content | Tamanho original | Conteúdo original completo                     | Apenas quando necessário - leitura profunda          |



\## \*\*33.4 Recuperação Recursiva por Diretório\*\*



Ao invés de uma única busca vetorial plana, o OpenViking usa uma estratégia de quatro etapas que combina precisão semântica com consciência estrutural:



\- Análise de Intenção: gera múltiplas condições de recuperação a partir da query.

\- Posicionamento inicial: recuperação vetorial identifica o diretório de alta pontuação (o 'balde' de contexto mais provável).

\- Exploração refinada: segunda recuperação dentro desse diretório específico; resultados de alta pontuação vão para o conjunto candidato.

\- Descida recursiva: se subdirectórios existem, repete a recuperação secundária em cada nível até o conteúdo completo relevante ser encontrado.



\\# Pseudocódigo: Estratégia de Recuperação Recursiva do OpenViking



def recursive\_directory\_retrieval(query, root='viking://'):



\\# 1. Análise de intenção - gera múltiplas condições



intent\_conditions = llm.analyze\_intent(query)



\\# 2. Busca vetorial global para identificar diretório âncora



top\_dir = vector\_search(intent\_conditions, scope=root, top\_k=1)



candidates = \\\[\\]



\\# 3. Recuperação secundária dentro do diretório



local\_results = vector\_search(intent\_conditions, scope=top\_dir, top\_k=5)



candidates.extend(local\_results)



\\# 4. Descida recursiva em subdirectórios



for subdir in list\_subdirectories(top\_dir):



sub\_results = vector\_search(intent\_conditions, scope=subdir)



candidates.extend(sub\_results)



\\# 5. Carregamento em camadas: L0 primeiro, L2 sob demanda



result = \\\[\\]



for candidate in rank(candidates):



abstract = load\_L0(candidate) # sempre



if is\_relevant(abstract, query):



overview = load\_L1(candidate) # se necessário



if needs\_full\_content(overview, query):



result.append(load\_L2(candidate)) # raramente



else:



result.append(overview)



return result



\## \*\*33.5 Auto-Iteração de Memória\*\*



Ao final de cada sessão, o OpenViking executa um loop de auto-evolução que separa a plataforma de sistemas de memória passivos:



\- Extração automática de memórias de logs de conversas, chamadas de ferramentas e rastros de execução.

\- Atualização de viking://user/memories/ com preferências detectadas do usuário.

\- Atualização de viking://agent/memories/ com experiências operacionais - padrões de uso de ferramentas, dicas de execução, armadilhas encontradas.

\- Resultado: um substrato de contexto persistente que evolui entre sessões, não apenas um arquivo de histórico de chat.



\## \*\*33.6 Integração e Instalação\*\*



\\# Instalação



pip install openviking --upgrade --force-reinstall



\\# CLI opcional (Rust)



curl -fsSL <https://raw.githubusercontent.com/volcengine/OpenViking/main/crates/ov\_cli/install.sh> | bash



\\# Requer:



\\# - Python 3.10+, Go 1.22+, GCC 9+ ou Clang 11+



\\# - Modelo de Embedding (ex: OpenAI text-embedding-3-large)



\\# - VLM para compreensão de imagem/conteúdo (OpenAI, Anthropic via LiteLLM, Ollama)



\\# Suporta: Linux, macOS, Windows



\\# Licença: Apache 2.0



\\# Uso básico



from openviking import SyncOpenViking



ov = SyncOpenViking(config='ov.conf')



\\# Escrever contexto (automaticamente cria L0/L1/L2)



ov.write('viking://resources/my\_project/docs/auth.md', content=doc\_text)



\\# Recuperação - retorna a profundidade certa automaticamente



results = ov.find('como fazer autenticação OAuth?')



\\# Navegação estrutural



files = ov.ls('viking://resources/my\_project/')



\## \*\*33.7 Comparação: OpenViking vs RAG Tradicional\*\*



| \*\*Dimensão\*\*    | \*\*RAG Tradicional\*\*               | \*\*OpenViking\*\*                                   |

| --------------- | --------------------------------- | ------------------------------------------------ |

| Organização     | Vetores planos sem hierarquia     | Filesystem hierárquico com URIs                  |

| Recuperação     | Busca semântica única             | Busca semântica + navegação estrutural recursiva |

| Profundidade    | Sempre carrega chunk completo     | L0→L1→L2 conforme necessidade                    |

| Depuração       | Caixa preta - impossível rastrear | Rastros visuais do caminho de recuperação        |

| Memória         | Registros de interação passivos   | Auto-evolução entre sessões                      |

| Tokens          | Baseline (100%)                   | \~20% (redução de 80%+)                           |

| Task Completion | \~35% (baseline)                   | \~52% (+46% de melhora)                           |

| Maturidade      | Produção ampla                    | Alpha (v0.1.x) - arquitetura sólida              |



| \*\*🔗 Referências\*\*                                                                                                                                                                                                                                             |

| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

| GitHub: github.com/volcengine/OpenViking (Apache 2.0)<br><br>PyPI: pip install openviking<br><br>Criado por: Volcengine (divisão de cloud da ByteDance)<br><br>Benchmark: LoCoMo10 long-range dialogue dataset, 1.540 casos<br><br>Documentação: openviking.ai |



\# \*\*Integração no Cognitive Stack Completo\*\*



As descobertas das Seções 32 e 33 se encaixam na tabela de mapeamento cognitivo do documento original (Seção 31.7), expandindo duas linhas existentes e adicionando um novo conceito de agência evolutiva:



| \*\*Cognição Humana\*\*     | \*\*Arquitetura Original\*\*         | \*\*Expansão 2026\*\*                                                                      |

| ----------------------- | -------------------------------- | -------------------------------------------------------------------------------------- |

| Memória de Longo Prazo  | Engram + Episodic Memory + RAG   | OpenViking: filesystem hierárquico L0/L1/L2 com auto-evolução (Seção 33)               |

| Meta-Cognição           | Epistemic Horizon Mapping (31.3) | AlphaEvolve: agente que descobre seus próprios procedimentos de busca (Seção 32)       |

| Criatividade / Invenção | (não mapeado anteriormente)      | AlphaEvolve: geração evolutiva de algoritmos via LLM + avaliador automático            |

| Gestão de Atenção       | mHC Manifold Controller          | OpenViking: carregamento L0 como filtro de atenção antes de carregar contexto completo |



\*\*Prioridade de Adoção Recomendada\*\*



Para equipes que já têm o stack básico funcionando (Seções 1-18 do documento original):



\- \*\*OpenViking PRIMEIRO - substitui o sistema de memória/RAG existente. O ganho de 80% em tokens se traduz diretamente em redução de custo imediata. Pré-requisito: Python 3.10+ e um modelo de embedding já disponível.\*\*

\- \*\*AlphaEvolve PATTERN depois - mesmo sem acesso ao sistema completo do DeepMind, o padrão arquitetural (LLM proposal → automatic evaluator → evolutionary selection → memory database) pode ser replicado para domínios específicos do seu produto.\*\*



─────────────────────────────────────────────────────────



\_Addendum gerado em Março 2026 | Baseado em fontes primárias: Google DeepMind, volcengine/OpenViking, arxiv.org/abs/2603.09172\_

