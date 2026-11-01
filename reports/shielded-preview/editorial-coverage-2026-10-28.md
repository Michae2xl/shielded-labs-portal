# Etapa 1 — acervo editorial e institucional

Implementação local em 28/10/2026. Não representa publicação nem migração do domínio.

Atualização posterior: contato, simuladores incorporados e capas dos artigos foram implementados na [etapa 2](integrations-2026-10-28.md). As pendências abaixo registram o estado ao concluir a etapa 1.

## Cobertura entregue

| Área | Conteúdo no portal | Acesso |
| --- | --- | --- |
| Blog | As 20 publicações retornadas pela API pública, com texto completo disponível na origem, coautoria, datas e imagens disponíveis | Blog → categoria → artigo; busca global e local |
| Crosslink | Visão geral, 23 perguntas e respostas, roadmap e manual de engenharia publicado | Projects → Crosslink → Resources & FAQs; Resources → Crosslink |
| Epoch | Apresentação do programa e publicação de lançamento | Resources → Epoch |
| NSM | Guia completo, 11 perguntas e respostas, referências aos ZIPs e simulador | Resources → NSM |
| Ironwood | Guia original, orientações, referências de auditoria e artigos relacionados | Resources → Ironwood |
| Zero | Escopo, suporte e repositórios publicados | Resources → Zero |
| Dynamic Fees | Apresentação, laboratório referenciado e roadmap | Resources → Dynamic Fees |
| Organização | Apresentação, missão e seis valores oficiais | About |
| Diretoria | Cinco integrantes publicados, retratos locais e perfis individuais | About → Board |
| Carreiras | Página institucional e detalhe da vaga Cryptographer, explicitamente encerrada | About → Careers |
| Contato | Endereço institucional e canal público; email abre no aplicativo do visitante | About → Contact; rodapé |
| Privacidade | Política publicada da organização, com contexto do contato por email neste portal | About → Privacy; rodapé |

## Comportamento

- Menus primeiro; nenhum novo popup ou segunda expansão para ler conteúdos.
- Artigos, guias e FAQs compartilham leitor com largura controlada, índice e informações da fonte.
- No celular, o índice vira um seletor compacto; texto aparece antes dos detalhes de procedência.
- Links entre artigos e páginas já importadas abrem o registro interno. Referências independentes e ferramentas externas mantêm sua origem explícita.
- Retorno preserva a categoria; URLs abrem registros diretamente; voltar/avançar continuam disponíveis.
- Publicações antigas preservam a data original. Datas de coleta não são apresentadas como publicação.
- O rodapé passa a oferecer Contato e Privacidade. Team & community aponta para Careers, sem anunciar vagas abertas.

## Procedência e limites

- Importador: `scripts/shielded-preview/import-editorial.py`; acervo tipado e catálogo em `src/lib/shielded-preview/editorial/`.
- Fontes: API WordPress pública da Shielded Labs, páginas institucionais verificadas e manual publicado em `shieldedlabs.github.io/zebra-crosslink/print.html`.
- O importador preserva texto, listas, tabelas, código e imagens disponíveis. Remove os widgets, estilos, scripts, formulários e shortcodes do tema antigo. O leitor renderiza apenas nós permitidos, sem executar HTML da origem.
- As duas imagens `IMG_6227-1.tif` e `IMG_6227.tif` retornaram 404 na própria origem. Registro em `editorial-media-issues.json`. As demais ilustrações importadas ficam no mesmo domínio do portal.
- A publicação de NSM de novembro de 2024 contém apenas uma nota de evento na origem; não foi inventada transcrição nem gravação.
- Ferramentas externas (simuladores, laboratório, repositórios, ZIPs e PDFs) continuam como referências; não foram clonadas nem descritas como integrações nativas.
- Contato não simula envio. Um formulário com entrega, proteção contra spam e política correspondente continua sendo uma integração futura.
- A política de privacidade preserva o texto institucional e informa a diferença do contato por email. Precisa ser validada pela organização antes da publicação do novo domínio.
- A divergência de cache da página Team identificada na auditoria anterior não foi usada para acrescentar ou remover integrantes sem confirmação.
- A atualização editorial é uma importação controlada. Não foi criada automação recorrente nem prometida atualização em tempo real.

## Verificação

- Quatro testes do importador: conteúdo ativo, shortcodes, títulos/âncoras e URLs.
- Nove testes TypeScript: cobertura, perguntas, autores, datas, vaga encerrada, links internos, busca, mídia local, acesso à API e erro de registro inexistente.
- TypeScript, lint dos arquivos alterados e compilação de produção.
- Todos os 40 registros testados pela API local responderam com o ID correto e conteúdo não vazio: `editorial-api-review.json`.
- Revisão de interface: filtro Security → artigo → índice → retorno ao filtro; Resources → Crosslink → FAQ; salto de pergunta no celular; About → Board → perfil; Careers → vaga encerrada; Contact e Privacy.
- Evidências finais de navegador e imagens acompanham este relatório em `editorial-browser-review.json` e `editorial-*.png`.

O restante do plano de migração (automação editorial/operacional, formulário de contato, SEO/redirecionamentos e publicação) permanece separado desta etapa de conteúdo.
