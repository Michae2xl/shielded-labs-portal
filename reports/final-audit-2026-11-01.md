# Auditoria final do protótipo — 1 de novembro de 2026

## Resultado

O portal está apto à próxima etapa de preparar uma prévia para feedback. Não restou bloqueador funcional conhecido nos caminhos revisados. Isso não equivale a uma aprovação de produção ou a uma auditoria de segurança independente.

A versão validada está somente no preview local, em `127.0.0.1:4248`. Nenhum deploy, túnel público, commit, push ou mensagem para a Shielded Labs foi realizado nesta auditoria. O conjunto de alterações anteriores do usuário foi preservado.

## Correções desta passagem

| Área | Problema encontrado | Correção e verificação |
| --- | --- | --- |
| ZCAP → Voting | Dois links de arquivo abriam as propostas atuais. | Destinos agora incluem `lane=archive`; clique real a partir do membro confirmou Poll archive. |
| Aplicações Coinholder | URLs simples não viravam links e respostas explícitas como `None.` eram descartadas. | Parser preserva essas informações. O registro FPF #70 confirmou a referência ao grant anterior e a declaração de conflitos. |
| URLs de fontes | Pontuação como `):` era incluída no endereço; retirar todos os parênteses também poderia danificar URLs válidas. | Limpeza de pontuação e delimitadores desbalanceados, preservando parênteses válidos. Links da aplicação #70 conferidos na compilação final. |
| Links diretos inválidos | Um ID de poll usado em Overview/Insights produzia uma tela vazia. | Estado explícito de registro inexistente e retorno à seção, com regressão automatizada. |
| Células de atividade | Uma seleção expirada ou inválida passava silenciosamente a mostrar todos os commits. | Seleção permanece vazia, explica o motivo e oferece recuperação. Verificado no navegador com uma data fora da janela. |
| Filtros e forks | Filtros salvos ausentes pareciam desmarcados; links relacionados podiam perder o contexto de forks. | Opções indisponíveis ficam visíveis e URLs/cliques preservam `forks=1`. |
| Atualização de atividade | Uma falha HTTP podia ficar invisível; o motivo da falha de cada repositório era perdido. | Indicador de falha e motivos seguros por fonte, mantendo a última observação datada. Limite de API só é chamado de limite quando comprovado pela resposta. |
| Busca global | Espaços colados e múltiplos termos tinham comportamentos diferentes entre tipos de resultado. | Normalização consistente, escopo da busca explícito e foco restaurado ao limpar. Busca móvel → projeto → FAQ validada. |
| Contato → Privacidade | Abrir a política apagava o rascunho. | Rascunho, consentimento e estado de envio ficam em memória no ancestral About. Ida/volta validada; resposta tardia não apaga um novo rascunho. Não usa armazenamento persistente. |
| Dependências | A auditoria npm apontou sete dependências de produção afetadas, incluindo um alerta crítico. | Next 16.4.3, Zod 4.6.7, Tailwind/PostCSS 4.3.3, Vitest 4.1.12 e dependências transitivas corrigidas. `npm audit --omit=dev`: zero alertas. |
| Identificação e documentação | Requisições ainda usavam o antigo User-Agent, e README dizia que não havia remoto. | Identificação Shielded-Labs-Portal e README coerente com o repositório e os limites atuais. |

As versões corrigidas foram verificadas no registro npm. Entre as referências consultadas estão os avisos de [Next.js / otimização de imagens](https://github.com/advisories/GHSA-2464-fhr4-w9xw) e [Zod / consumo de memória](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5). Não foi aplicado `audit fix --force` nem um downgrade de ESLint para silenciar alertas.

## Cobertura e evidências

- **135 testes em 26 arquivos**, mais **5 testes do importador**; lint, TypeScript, build otimizado, isolamento e `git diff --check` passaram.
- Uma segunda revisão de código não encontrou novo bloqueador em contato, estado de atividade, fontes ou dependências.
- Navegador: todas as seções de governança e páginas principais; seis projetos com suas seções disponíveis; registros representativos de proposta, poll, grant, membro, commit, pessoa, marco e artigo.
- Interações: busca, filtros, detalhe/retorno, histórico do navegador, refresh com filtro ativo, células válidas/expiradas, FAQ expandido, menu móvel, modal de fontes, formulário inválido e rascunho ao consultar Privacidade.
- Os três simuladores carregaram em seus iframes. Foram exercitados alteração da delegação no Crosslink, cálculo de ações no Dynamic Fees, inclusão de evento simulado no NSM e reset do iframe. Nenhuma transação foi feita.
- Layout conferido na janela normal e com overrides de 375, 768 e 1440 px. O navegador aplica seu zoom existente, portanto a largura CSS efetiva é menor. Não houve transbordamento horizontal da página nas telas conferidas; o mapa de atividade mantém rolagem própria.
- As imagens inspecionadas no artigo carregaram, e nenhum erro de console foi registrado durante os caminhos exercitados.
- `/`, `/shielded-preview` e APIs válidas responderam 200; documento inexistente respondeu 404. CSP e `noindex, nofollow` estavam presentes. Detalhes em [evidência HTTP](final-audit-2026-11-01-http.json).

O grafo editorial/diretórios é coberto pelos testes; a navegação real usa registros representativos. Não foi aberto individualmente cada registro histórico nem recapturada toda página de terceiros.

## Estado das fontes na verificação final

Verificação HTTP às **19:26 UTC / 16:26 em São Paulo**:

| Fonte | Estado | Registros |
| --- | --- | ---: |
| GitHub, seis repositórios acompanhados | Atualizados | 548 commits na amostra total, incluindo forks |
| Aplicações Coinholder atuais, diretamente do FPF | Atualizada | 3 |
| ZCG em revisão | Atualizada | 28 |
| Grants | Atualizada | 218 |
| Linhas de pagamentos/marcos | Atualizada | 913 |
| Membros ZCAP | Atualizada | 202 |
| Resultados Q3 | Atualizada | 37 |
| Histórico de decisões ZCG | Snapshot de 25/10/2026 | 753 |

Durante a auditoria houve falha transitória de atualização do GitHub. O portal conservou as observações anteriores; na verificação final todos os feeds acima que suportam atualização responderam. Não foi comprovado o motivo da falha transitória anterior, portanto ela não foi classificada como rate limit.

## Limites que acompanham o ponto zero

1. **Histórico e conteúdo editorial:** as 753 decisões históricas não têm atualização independente; textos, equipe, marcos e FAQs têm datas de revisão próprias. Atualização de um feed não significa nova revisão editorial de tudo.
2. **Atividade:** no máximo 100 commits por branch acompanhada. A amostra não mede produtividade e células vazias não provam ausência de trabalho. Atualizações dependem de solicitações/portal visível; não há monitor contínuo.
3. **Contato:** enviar o formulário encaminha uma mensagem real ao serviço da Shielded Labs. A integração foi verificada com fornecedor simulado, incluindo falhas, duplicatas e limites; entrega real de email não foi testada. Antes do link de avaliação, convém decidir se esse envio ficará habilitado ou se o formulário será apenas demonstrativo.
4. **Dependências de desenvolvimento:** restam 16 alertas moderados na cadeia de lint por `minimatch < 11.0.1`; não estão na árvore de produção. A correção automática oferecida exige alteração incompatível. Devem ser acompanhados separadamente. Avisos de migração futura de middleware e de configuração Vite também permanecem, sem falha de build/testes.
5. **Privacidade e conteúdo institucional:** a política exibida é a cópia atribuída do site oficial. Antes de uma publicação definitiva, revisar sua adequação ao domínio, responsável e infraestrutura reais do portal.
6. **Serviços externos:** simuladores dependem de seus hosts; fontes públicas podem falhar ou limitar requisições. Alguns feeds de governança continuam vindo das APIs públicas do OpenZcash, identificadas nas fontes. Independência do repositório não significa independência de todas as fontes de dados.

## Próxima etapa: link para feedback

Preparar uma versão identificada como **protótipo para avaliação**, mantendo a página sem indexação. Definir controle de acesso/tempo de disponibilidade e o comportamento do contato antes de abrir o link. `noindex` não é autenticação. A prévia deve usar este build e um registro do conjunto exato de alterações, para permitir comparar o feedback com versões futuras.

Nada dessa publicação foi executado nesta passagem. Captura final: [Governance no desktop](/Users/maiconguimaraes/.codex/visualizations/2026/11/01/01a197eb-f468-79f0-83f1-215341c867b2/final-audit-governance-desktop.png).
