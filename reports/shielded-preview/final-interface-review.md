# Revisão da interface — 28 de outubro de 2026

Escopo: portal local em `http://127.0.0.1:4246/shielded-preview`. Revisão visual e funcional das seis áreas da navegação final e das abas de governança. As notas abaixo são uma avaliação qualitativa da interface observada, não uma certificação de acessibilidade ou de publicação.

## Mudanças

- Menus de projetos, governança, equipe e marcos usam o mesmo componente, com estado ativo, foco visível e rolagem interna em telas pequenas.
- Overview concentra projetos, governança, atividade e marcos, com links diretos; a faixa de atalhos duplicados foi removida.
- Cartões de projeto usam título, estágio e resumo, sem repetir um segundo botão de detalhes.
- Detalhes mantêm introdução, informações de estágio, conteúdo e fontes na mesma distribuição visual.
- Painéis explicativos e rótulos repetidos foram reduzidos. As fontes, datas, bases de comparação e limites das amostras permanecem disponíveis.
- O rodapé concentra o acesso à metodologia. A navegação final não inclui Website proposal, Built on OpenZcash ou Internal preview.

## Auditoria visual

Notas de 0 a 10 para o escopo inspecionado. Referências indicam as regras aplicadas ou preservadas nesta revisão.

| Dimensão | Nota | Evidência e tratamento |
| --- | ---: | --- |
| Cores | 9 | Paleta monocromática, superfícies e bordas compartilhadas. [Tokens](~/openzcash/src/app/shielded-preview/portal.module.css:1). |
| Hierarquia tipográfica | 8 | Títulos de seção de 23–24 px, introduções e texto dos detalhes com escala consistente. [Overview](~/openzcash/src/app/shielded-preview/overview.module.css:18), [detalhes](~/openzcash/src/app/shielded-preview/governance-record.module.css:8). |
| Espaçamento | 8 | Menus, cartões e colunas seguem intervalos recorrentes; eliminada a faixa redundante do Overview. [Menus](~/openzcash/src/app/shielded-preview/section-menu.module.css:2), [cartões](~/openzcash/src/app/shielded-preview/portal.module.css:219). |
| Consistência dos componentes | 9 | Um componente controla os menus principais e secundários; o menu ativo também retorna à coleção. [SectionMenu](~/openzcash/src/app/shielded-preview/section-menu.tsx:33). |
| Responsividade | 8 | Navegação e detalhes conferidos em 1440×1000 e 390×844. Nenhuma largura da página excedeu a viewport nos estados inspecionados; menus extensos rolam internamente. [Regra móvel](~/openzcash/src/app/shielded-preview/section-menu.module.css:11). |
| Tema escuro | 9 | Superfícies, fontes, formulários, tabelas e detalhes mantêm o tema escuro da identidade. Não há outro tema oferecido pelo portal. [Base](~/openzcash/src/app/shielded-preview/portal.module.css:1). |
| Animação | 8 | Escudo original preservado; cartões não saltam no hover. Preferência por movimento reduzido respeitada. [Movimento reduzido](~/openzcash/src/app/shielded-preview/portal.module.css:42), [cartões](~/openzcash/src/app/shielded-preview/portal.module.css:221). |
| Acessibilidade | 8 | Estado ativo semântico, foco visível, controles dos menus com altura de 44 px; descrições do mapa preservadas para leitores de tela. [Menu](~/openzcash/src/app/shielded-preview/section-menu.module.css:3), [mapa](~/openzcash/src/app/shielded-preview/development.tsx:111). Inspeção limitada aos fluxos descritos abaixo. |
| Densidade de informação | 9 | Removidas instruções óbvias, atalhos repetidos e cartões de contexto desnecessários; fontes agrupadas ao final. [Fontes](~/openzcash/src/app/shielded-preview/governance.tsx:164). |
| Acabamento | 8 | Setas e títulos alinhados; hover e foco consistentes; inspeção do mapa só aparece com uma célula ativa. [Interações](~/openzcash/src/app/shielded-preview/development.tsx:128), [estados do menu](~/openzcash/src/app/shielded-preview/section-menu.module.css:4). |

## Verificação funcional observada

| Área | Verificação |
| --- | --- |
| Overview | Quatro áreas e acessos diretos; sem bloco de atalhos repetidos; desktop e celular. |
| Projetos | Seis projetos abrem diretamente no desktop; Dynamic Fees e menu no celular. |
| Proposals, Voting, Grants, Results | Coleção → primeiro registro → retorno pelo menu ativo no desktop; registros também abrem no celular. |
| Insights | Quatro visões no desktop e no celular; comparação encaminha à pergunta correspondente do ZCAP. |
| ZCAP | Base percentual alternável, busca de membros, detalhe direto e retorno preservando a busca no desktop; comparação e membro também no celular. |
| Code activity | Modos por dia e por colaborador, filtro de repositório, seleção de célula, limpeza de filtros e inclusão de forks; layout móvel inspecionado. |
| Milestones | Lista, filtro e detalhe direto; desktop e celular. |
| Team & community | Equipe, comunidades e detalhes; filtro de criptografia e perfil no celular. |
| Fontes | Rodapé abre Sources & methodology com limites da amostra, atribuição e datas. |

Nenhum dos estados inspecionados apresentou Internal preview, Built on OpenZcash, This preview ou Website proposal no conteúdo da navegação final. A rota antiga e não listada de proposta do site continua preservada como material de trabalho.

## Verificação do código

- ESLint: concluído sem erros nas áreas alteradas.
- Build de produção: concluído com `DISABLE_BACKGROUND_REFRESH=1 npm run build`.
- Testes existentes do portal: seis arquivos, 24 testes aprovados.
- `git diff --check`: aprovado.

Validação restrita à versão local; nenhuma publicação foi realizada. Dados e declarações históricas não foram revalidados externamente nesta revisão visual.

## Capturas

- [Overview](~/openzcash/reports/shielded-preview/final-cleanup-overview.png)
- [Governança](~/openzcash/reports/shielded-preview/final-cleanup-governance.png)
- [Projetos](~/openzcash/reports/shielded-preview/final-cleanup-projects.png)
- [Grants](~/openzcash/reports/shielded-preview/final-cleanup-grants.png)
- [Atividade](~/openzcash/reports/shielded-preview/final-cleanup-activity.png)
- [ZCAP no celular](~/openzcash/reports/shielded-preview/final-cleanup-zcap-mobile.png)
