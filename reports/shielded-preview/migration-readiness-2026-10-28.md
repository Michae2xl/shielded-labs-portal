# Shielded Labs — cobertura e prontidão para migração

Revisão: 28 de outubro de 2026. Escopo: site público da Shielded Labs, inventário público do WordPress, implementação local do portal e consultas às fontes já conectadas. Nenhuma alteração no site público ou publicação foi realizada.

## Conclusão

**O portal ainda não substitui integralmente o site atual.** A interface e a consulta aos dados estão mais desenvolvidas do que a cobertura editorial e os fluxos institucionais. Projetos, governança, marcos e equipe têm páginas internas; isso não significa que todas as informações e funções de origem tenham sido migradas.

O critério para considerar uma área coberta deve ser: conteúdo preservado, acesso pelo menu e pela busca, detalhes legíveis, fontes e datas, ação correspondente e retorno à coleção. Um resumo ou link externo não equivale ao conteúdo completo dentro do portal.

## Inventário confirmado

- A API pública retornou **18 registros de página**. Um deles é `blank-for-testing`; os outros **17** compõem o inventário editorial de páginas.
- A API pública retornou **20 artigos**, em uma página de resultados. O índice do blog sozinho não apresenta todo esse acervo.
- Jobs aponta também para `/job/cryptographer/`, cujo detalhe informa que a vaga expirou.
- Categorias, autores, imagens, documentos, simuladores e destinos externos são dependências adicionais. Não estão incluídos nessa contagem de páginas e artigos.
- O sitemap inclui a página de teste. Ela deve ser tratada explicitamente como exclusão, sem entrar na navegação final.

Fontes: [páginas públicas](https://shieldedlabs.net/wp-json/wp/v2/pages?per_page=100&_fields=id,link,slug,title,modified_gmt), [artigos públicos](https://shieldedlabs.net/wp-json/wp/v2/posts?per_page=100&_fields=id,link,slug,title,date_gmt,modified_gmt,categories), [sitemap](https://shieldedlabs.net/sitemap_index.xml).

Os inventários locais foram salvos em `site-inventory-2026-10-28.json`, `site-content-map-2026-10-28.json` e `migration-url-map-2026-10-28.csv`, nesta pasta. São observações desta revisão, não fontes automaticamente atualizadas.

## Cobertura das páginas

| Origem | Situação no portal | Necessário para equivalência |
| --- | --- | --- |
| `/` — organização, missão e valores | Parcial: identidade visual e visão geral dos projetos | Criar About com missão, valores, natureza independente, financiamento e contexto institucional; acesso direto pela navegação. |
| `/projects/` | Parcial: os cinco projetos do índice e Epoch estão presentes | Completar os recursos de cada projeto; incluir contato para suporte a organizações. |
| `/crosslink/` | Parcial: objetivo, estágio, cinco marcos e commits | Incorporar os acessos a escopo, primeiros passos, livro técnico, FAQ, simulador e feature net. |
| `/roadmap/` | Parcial: cinco marcos históricos e produção em andamento | Preservar o contexto do planejamento, intervalos publicados, histórico de mudanças e evidência do estágio. |
| `/crosslink-faq/` | Ausente como conteúdo completo | FAQ interna pesquisável, incluindo pressupostos, privacidade, governança e referência à avaliação independente. |
| `/nsm/` | Parcial: resumo e termos | FAQ completa, referências individuais às ZIPs 233–235 e acesso claro ao simulador. Estados de adoção precisam de fonte própria. |
| `/fees/` | Parcial: resumo genérico de Dynamic Fees | Integrar a explicação, artigo introdutório e Dynamic Fees Lab. A referência principal atual do portal aponta apenas ao índice de projetos. |
| `/dynamic-fees-roadmap/` | Ausente | Incorporar fases e perguntas em aberto, com data e distinção entre proposta, experimento e entrega. |
| `/zero/` | Parcial: resumo e repositório | Acesso ao zero-indexer, documentação de operação e contato de suporte. |
| `/ironwood/` | Parcial: resumo, contexto de segurança e atribuição | Recursos de migração, impacto para usuários/operadores, auditorias e referências completas. Reconciliar texto antigo de ativação futura com fontes posteriores. |
| `/governance/` | Parcial, com consulta a dados ampliada | Completar guias de participação, carteiras, critérios para painéis, calendário e acompanhamento dos debates. Preservar a distinção entre consultas de protocolo e decisões de financiamento. |
| `/team/` | Parcial: 12 perfis, cargos e retratos | Reconciliar divergência entre fontes, preservar canais públicos dos perfis e implementar manutenção editorial. |
| `/board/` | Ausente | Separar conselho institucional de equipe operacional e de colaboradores observados no GitHub. |
| `/jobs/` | Apenas link externo em Team | Lista interna com estados aberta/encerrada, requisitos, detalhe e caminho de candidatura quando aplicável. |
| `/contact/` | Ausente | Informações de contato, suporte, interesse em doações e formulário funcional, conforme o fluxo aprovado pela organização. |
| `/privacy-policy/` | Ausente | Página acessível no rodapé, correspondente ao funcionamento real de formulários, cookies e serviços externos. |
| `/blog/` | Ausente como acervo | Leitor de artigos com autores, datas, imagens, categorias, histórico, referências e relações com projetos. |
| `/blank-for-testing/` | Sem equivalente, corretamente fora da navegação | Registrar exclusão deliberada da migração pública. |
| `/job/cryptographer/` | Sem detalhe interno | Preservar estado encerrado; não apresentar como vaga aberta. |

Os **20 artigos** ainda não têm um leitor integral dentro do portal. Alguns assuntos aparecem em resumos de projetos e marcos; isso não preserva o artigo, autoria, contexto e documentação completos. O CSV contém uma linha para cada artigo e para cada página inventariada.

## Diferenças encontradas nas fontes

1. **Equipe:** a página no navegador mostrou Judah Caruso como DevRel Engineer, totalizando 13 pessoas. A API pública e uma leitura HTTP separada retornaram 12, sem Judah; o portal contém essas 12. Não foi estabelecida a causa da divergência. Não adicionar nem remover pessoas automaticamente até reconciliar a fonte editorial canônica. [Equipe](https://shieldedlabs.net/team/)
2. **Vagas:** Jobs ainda apresenta Cryptographer, mas o detalhe diz que a listagem expirou. A automação deve consultar e respeitar o estado do detalhe. [Índice](https://shieldedlabs.net/jobs/), [detalhe](https://shieldedlabs.net/job/cryptographer/)
3. **Calendário:** Governance mantém a rodada de setembro sob “Upcoming Polls”. O novo portal deve derivar a classificação temporal das datas e preservar o evento como histórico. [Governança](https://shieldedlabs.net/governance/)
4. **Projetos:** Epoch tem artigo e equipe associados, mas continua ausente do índice público consultado. O portal já o inclui. [Projetos](https://shieldedlabs.net/projects/), [Epoch](https://shieldedlabs.net/epoch-future-proof-cryptography-for-zcash/)
5. **Conteúdo renderizado:** partes da página Contact vêm do tema/formulário, e não de um corpo completo na API de páginas. A importação não pode depender apenas de `content.rendered`.

Esses exemplos exigem comparação entre página, API e decisão editorial. Uma cópia automática indiscriminada reproduziria as inconsistências.

## Acesso e clareza das informações

### Já observado

- Navegação principal curta e menus de seção antes do conteúdo.
- Páginas internas de projetos, propostas, votos, grants, resultados, membros, equipe e marcos.
- Busca e filtros dentro das coleções; abertura de resultados sem popup.
- Nesta revisão, `Zcash Grants Hub` foi localizado na busca de Results, abriu seu registro completo de resultado e o retorno preservou a busca.
- Também foram reconferidos Crosslink e a abertura do resultado em 390 × 844; os dois estados ficaram sem transbordamento horizontal.
- Comparações separam votos ZCAP de peso em ZEC; resultado de votação permanece separado de pagamento e entrega.
- A revisão visual anterior deste mesmo trabalho registrou 34 estados em larguras de desktop, intermediária e celular, sem transbordamento horizontal. Isso é evidência local de layout, não de cobertura editorial ou publicação.

### Ainda insuficiente

- **Busca global incompleta:** procurar `Zcash Grants Hub` no cabeçalho retornou zero resultados, apesar de o registro existir em Results. O índice global inclui projetos, destinos de navegação, marcos e equipe; não todos os registros de governança ou conteúdo editorial.
- **Profundidade desigual:** os detalhes de propostas exibem os campos e resumos disponíveis nas fontes atuais. O corpo completo de toda proposta, seus anexos e discussão não está garantido dentro do portal. Há fallback para a aplicação original.
- **Participação:** consultar resultados está mais desenvolvido do que entender como participar, candidatar-se a um painel ou submeter uma proposta.
- **Projetos:** há contexto e progresso, mas faltam percursos completos para experimentar, instalar, contribuir ou buscar suporte.
- **Artigos e documentação:** precisam compartilhar a busca, o modelo de leitura e as relações com projetos, pessoas e marcos.

Referências locais: `src/app/shielded-preview/portal.tsx` (índice de busca), `governance.tsx` (detalhes e fallback), `project-detail.tsx` (fontes atualmente expostas) e `src/lib/shielded-preview/content.ts` (conteúdo editorial fixo).

## Automação: implementação versus proposta

| Fluxo | Estado verificado | Próximo passo |
| --- | --- | --- |
| Commits de seis repositórios selecionados | Implementado; 6/6 responderam nesta revisão | Inventário de repositórios mantido, releases, documentação de versões e persistência das observações. A amostra de até 100 commits por repositório não é o histórico completo. |
| Grants, pagamentos, fila de revisão, ZCAP e verificação Q3 | Consultas implementadas e respondendo | Operação durável com tratamento de falhas, histórico e monitoramento de frescor por fonte. |
| Histórico de propostas | Leitura do espelho local, 753 registros na consulta | Definir a fonte/infraestrutura publicada para não depender silenciosamente do banco desta máquina. |
| Artigos, páginas, equipe e conselho | Conteúdo fixo ou ausente; sem sincronização editorial | Conector de conteúdo com inventário, datas, diferenças entre versões e revisão antes de publicação. |
| Calendário e vagas | Sem ciclo de vida automático | Datas e estados estruturados, arquivamento de eventos encerrados e reconciliação de vagas. |
| Resumos de entregas e impacto | Curadoria fixa | Relacionar commits, releases, evidências e marcos; preparar resumo editorial verificável. |

O navegador consulta as fontes ao carregar e a cada cinco minutos enquanto está visível. O servidor mantém cache e reaproveita consultas concorrentes. **Isso é consulta periódica, não processamento contínuo independente de visitas.** Os caches atuais são em memória. Projetos, equipe, marcos e parte do histórico de governança continuam em arquivos versionados.

Na consulta desta revisão: 753 registros do espelho de propostas, 18 itens de revisão pública, 218 grants, 913 linhas dos programas de pagamentos e 202 nomes ZCAP. São contagens de registros, não de pessoas únicas, entregas ou pagamentos confirmados independentemente. Datas de consulta não certificam a atualidade de cada conteúdo original. Evidência: `source-health-2026-10-28.json`.

## Organização proposta para cobrir o site inteiro

Preservar o menu compacto, agrupando o conteúdo em destinos previsíveis:

- **Overview:** identidade breve, novidades relevantes e caminhos para as áreas principais.
- **Projects:** os seis projetos; cada um reúne visão geral, progresso, documentação/FAQ, atividade, artigos e formas de participar.
- **Governance:** propostas, votação, grants, resultados, ZCAP, insights e guias; calendário e discussões associados aos registros.
- **Updates:** artigos, anúncios e avisos de segurança; filtros por projeto, tema e autor.
- **Resources:** documentação, simuladores, auditorias e guias de operação/participação. O material também permanece acessível no projeto relacionado.
- **About:** missão, valores, equipe, conselho e vagas; comunidades relacionadas com afiliação descrita corretamente.
- **Rodapé:** contato, privacidade, fontes/metodologia e canais oficiais.

Code activity e Milestones continuam acessíveis diretamente por links próprios e dentro de Projects. A organização final pode manter esses dois atalhos no menu; o importante é evitar uma barra lateral com um item para cada documento.

O padrão de leitura deve responder, nesta ordem: **o que é → em que estado está → o que mudou → evidência → como participar**. A linguagem introdutória atende quem está chegando; especificações e dados completos ficam no mesmo percurso, sem duplicar o texto.

## Reaproveitamento do OpenZcash

- Preservar os adaptadores de grants, pagamentos, resultados, comunidades, regras de publicação e cálculos já usados.
- Reaproveitar os leitores e catálogos de Monthly/Narratives para conteúdo editorial, adaptando os modelos de autoria, revisão e fontes.
- Reaproveitar componentes de busca e normalização; ampliar o índice especificamente para todos os conteúdos e registros da Shielded Labs. O índice existente do OpenZcash também não é, sozinho, um mecanismo pronto de busca integral dos dados.
- Reaproveitar feeds e organização de recursos, com escopo editorial claro para a Shielded Labs.
- Manter uma fonte canônica por tipo de dado, em vez de criar uma segunda cópia manual que logo diverge.

## Sequência recomendada

1. **Fechar a cobertura:** concluir o mapa de URLs, importar os 20 artigos, páginas institucionais e recursos dos projetos; reconciliar equipe, vagas e informação histórica. Aceite: cada item de origem possui destino interno, recurso externo preservado ou exclusão explícita.
2. **Completar os percursos:** busca global integral, documentação/FAQ nos projetos, guias de participação e contato. Aceite: um usuário novo encontra uma resposta e a ação pertinente sem precisar adivinhar em qual aba procurar.
3. **Operar as atualizações:** coleta agendada independente de visitas, armazenamento persistente, detecção de mudanças e fila editorial. Estados objetivos podem ser calculados; opinião institucional, mudanças técnicas e atribuição de impacto exigem revisão.
4. **Preparar a migração pública:** preservar URLs conhecidas ou mapear redirecionamentos, migrar imagens e metadados, conectar formulários ao destino correto, verificar busca/indexação e testar restauração/retorno à versão anterior. A configuração local atual não é uma configuração pronta para publicação.

## Critérios para liberar a migração

- [ ] Todos os itens do inventário possuem tratamento explícito, sem perda de conteúdo relevante.
- [ ] Artigos preservam autoria, datas, imagens, referências e distinção entre fatos e posições da organização.
- [ ] Fontes divergentes reconciliadas; estados de eventos e vagas corretos.
- [ ] Busca global encontra documentos e registros, além de nomes de abas.
- [ ] Guias, projetos, resultados e formulários têm caminhos completos no desktop e no celular.
- [ ] Atualizações continuam funcionando sem um visitante manter a página aberta.
- [ ] Falhas preservam a última observação válida e sua data; nenhuma etiqueta de atualização mascara conteúdo antigo.
- [ ] URLs antigas, imagens, metadados, indexação e redirecionamentos conferidos.
- [ ] Formulário e canais operacionais validados com o destino autorizado; nenhum envio foi feito nesta revisão.
- [ ] Revisão editorial e técnica concluída sobre a versão a publicar.

## Limites desta revisão

Inventário público e implementação local, sem acesso administrativo ao CMS. As principais páginas e recursos foram lidos; os 20 artigos foram inventariados, não submetidos a uma revisão factual integral. Simuladores e aplicações externas foram identificados como dependências, sem certificação funcional. A divergência da equipe permanece aberta. Nenhum teste de entrega de formulário, migração de domínio ou publicação foi executado.
