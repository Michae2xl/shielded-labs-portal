# Revisão de organização e densidade — 1 nov 2026

Implementada e conferida na prévia local em `http://127.0.0.1:4248/shielded-preview`.

## Alterações

| Área | Resultado |
| --- | --- |
| Projetos | Coleção sem repetir os nomes em uma segunda navegação; seletor compacto no detalhe; pesquisa sem contagens redundantes. |
| Equipe | Cartões menores com foto, nome, função e acesso ao perfil; retirada a repetição do grupo no rodapé. |
| Marcos | Lista cronológica com datas alinhadas, substituindo a grade de cartões. |
| Blog | Lista com miniaturas, título, autoria e data; retirado o resumo duplicado e a contagem permanente. |
| Atividade | Mapa e commits antes do diretório de colaboradores; commits em lista; filtros legíveis em telas estreitas. |
| Governança | Navegação menor; resumo compacto no lugar dos cartões que repetiam o menu; listas, detalhes, ZCAP e Insights com menos espaços e rótulos repetidos. |
| Institucional | Organização, conselho, carreiras, contato, privacidade e leitura de documentos com espaçamentos consistentes. |

Mantidos o conteúdo das fontes, as distinções entre estados dos dados, a base das porcentagens, os filtros, as rotas dos registros e o acesso à metodologia.

## Verificação

- Lint, 95 testes em 19 arquivos e verificação de isolamento aprovados.
- Build final aprovado, incluindo a correção dos filtros móveis.
- 57 verificações de largura em telas e estados do desktop e celular, sem transbordamento horizontal da página. O mapa de atividade mantém sua rolagem interna intencional.
- Testados: busca de artigos e retorno preservando a consulta; filtro de equipe e retorno do perfil; filtro de marcos e retorno do detalhe; troca de projeto; abertura da pesquisa e das respostas do FAQ; célula de atividade, busca de commits e retorno ao filtro; seleção de pergunta do ZCAP e diretório de membros.
- Conferidas todas as seções principais de governança e páginas institucionais. O simulador carregou dentro do projeto em desktop e celular.
- Nenhum erro de console no registro consultado da prévia final.

Esta revisão valida apresentação e navegação local. Não inclui publicação no GitHub, deploy, envio de formulário ou nova auditoria independente de cada fonte externa.
