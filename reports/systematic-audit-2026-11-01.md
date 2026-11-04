# Auditoria de navegação, históricos e fontes — 1 de novembro de 2026

Escopo: prévia local do Shielded Labs Portal em `127.0.0.1:4248`. Foram revisados os fluxos de atividade, registros de commits/repositórios/autores, projetos, pesquisa, FAQ, blog, equipe, marcos e associações de governança. As alterações permanecem locais.

## Alterações de navegação

- Removida a faixa superior de breadcrumb/Home e busca em todas as páginas.
- Busca global transferida para a última divisão do menu lateral, com resultados no próprio menu.
- Escolher um resultado abre a página e fecha o menu móvel. Limpar a busca, estado sem resultados e Escape foram conferidos.

## Problemas encontrados e corrigidos

| Fluxo | Problema | Resultado |
| --- | --- | --- |
| Célula de atividade → commits | A seleção filtrava dados, mas a lista ficava depois de todos os repositórios e fora da área visível. | A lista vem logo após o mapa; clique ou Enter leva ao histórico e posiciona o foco no título. O cabeçalho móvel não cobre esse título. |
| Busca nos commits de uma célula | Digitar apagava a seleção de dia/repositório e ampliava a busca silenciosamente. | Busca mantém a célula; os filtros seguem para o detalhe e são preservados ao voltar ou recarregar. |
| Perfil → retorno | O foco não voltava ao link original; o bloco de outros autores era remontado fechado. | Link de origem e estado aberto do bloco são preservados. |
| Datas e fontes de commits | Datas com fuso podiam ser agrupadas pelo texto original; hashes compartilhados conservavam os primeiros metadados encontrados. | Datas normalizadas em UTC; deduplicação usa a observação mais recente e conserva todos os repositórios de origem. |
| Resposta do GitHub | Campos e URLs incorretos podiam ser aceitos como uma observação válida. | Validação de SHA, URL/repositório, identidade, data e amostra. Uma resposta inválida mantém a observação anterior datada. |
| Proposta → grant | Apenas o título era usado para chamar um grant de correspondente, inclusive entre aplicações rejeitadas e aprovadas com o mesmo nome. | Relação limitada a mesmo título e programa, explicitamente sem confirmar financiamento daquela aplicação. Registro e fonte do ledger continuam acessíveis. |
| Pergunta NU7 → Overview | A URL era limpa, mas o seletor continuava mostrando a pergunta anterior. | Seletor sincroniza com navegação interna, menu global e histórico do navegador. |
| Manual Crosslink → capítulo | Links de capítulos levavam ao início do manual. Referências não importadas também eram convertidas indevidamente. | Capítulos mapeados para a seção exata; referências ausentes conservam o URL externo original. |
| FAQ → projeto | Um ID de FAQ de outro projeto podia exibir silenciosamente um FAQ diferente. | Estado explícito de documento indisponível com retorno ao FAQ do projeto. Área clicável do retorno alinhada ao texto e à seta. |
| Links antigos de FAQ | O redirecionamento descartava o tópico selecionado. | Projeto, tópico, consulta e pergunta expandida são preservados. Âncoras malformadas não provocam exceção. |
| Histórico do Crosslink | “Zcash and Staking Economics” não estava associado ao projeto. | Associação corrigida no catálogo, documento e importador, com link de volta ao Crosslink. |

## Evidência de validação

- Suíte completa: **95 testes em 19 arquivos**. Importador: **5 testes**. Lint, TypeScript/build e isolamento aprovados.
- A regressão de documento indisponível foi reexecutada após o ajuste da área clicável: **2 testes aprovados**.
- Inspeção do catálogo e dos links internos cobre todos os documentos importados, 12 membros e 8 marcos.
- Revisão das associações de governança: 37 resultados Q3 resolvem aplicações por ID; 218 grants usam nome e programa; 202 membros ZCAP têm identificadores únicos.
- Fixture GitHub: 548 registros e 548 hashes únicos, com URLs e datas consistentes.
- As seis fontes GitHub responderam ao vivo. Os seis repositórios e suas branches `main` foram confirmados pelo conector GitHub.
- O [commit de exemplo de 6 de outubro](https://github.com/ShieldedLabs/crosslink_monolith/commit/2adf0edeeaaab530b0746dec959cc1bf7a70110a) teve SHA, título, login do autor, data UTC e URL confirmados no GitHub.
- A API local e a interface concordaram na janela de 35 dias: Crosslink 100, Zero 75, Shielded transport 100 e Crosslink docs 6, totalizando **281** commits. Na janela de 84 dias, a visão por colaborador totalizou **348**.
- A célula Crosslink/06-out mostrou **15** commits. A busca “merge” dentro dela mostrou os **2** hashes esperados. Abertura de detalhe, retorno, histórico do navegador e recarga preservaram esse contexto.
- Testadas células vazias, Enter, inclusão de forks, filtros, links de fonte, capítulo específico do manual, migração de FAQ e retorno do ledger à proposta rejeitada.
- Conferência visual em desktop e em larguras móveis efetivas de 354 e 291 pixels, sem transbordamento horizontal da página. O mapa mantém sua própria rolagem horizontal.

## Cobertura e limites dos dados

- Atividade é uma **amostra de até 100 commits por branch acompanhada**, não o histórico completo. Células vazias não provam ausência de trabalho; forks podem conter trabalho herdado.
- O arquivo de propostas históricas é uma cópia identificada de **25 de outubro de 2026**, com 753 registros. Ele permanece datado até existir uma API pública independente para esse histórico.
- Na verificação, propostas em revisão (28), grants (218), pagamentos (913), membros ZCAP (202) e verificação Q3 foram atualizados pelas respectivas fontes. Os estados e datas são separados do arquivo histórico.
- O grafo completo de links internos foi verificado em testes. A disponibilidade externa foi confirmada para os seis repositórios, um commit representativo e os feeds usados pela API local; isso não equivale a recapturar todas as páginas históricas de terceiros.
- Nenhum deploy ou publicação no GitHub foi realizado nesta auditoria.

## Capturas da prévia validada

- [Navegação sem faixa superior e busca no fim do menu](/Users/maiconguimaraes/.codex/visualizations/2026/11/01/01a197eb-f468-79f0-83f1-215341c867b2/portal-sidebar-search.png)
- [Histórico da célula no desktop](/Users/maiconguimaraes/.codex/visualizations/2026/11/01/01a197eb-f468-79f0-83f1-215341c867b2/activity-audit-desktop.png)
- [Histórico com título visível no celular](/Users/maiconguimaraes/.codex/visualizations/2026/11/01/01a197eb-f468-79f0-83f1-215341c867b2/activity-audit-mobile.png)
