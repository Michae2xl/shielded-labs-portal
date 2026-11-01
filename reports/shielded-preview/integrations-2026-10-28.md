# Etapa 2 — contato, simuladores e imagens das novidades

Implementação e revisão local em 28/10/2026. O domínio público não foi migrado ou publicado.

## Entregue

- **Contato:** formulário interno em About → Contact, também acessível pelo rodapé. Campos nome, email e mensagem, consentimento, validação, estado de envio, confirmação e erro com preservação do rascunho.
- **Integração de envio:** endpoint local encaminha somente os campos aceitos pelo formulário público Contact Form 7 nº 32 da Shielded Labs. Destino fixo; nenhuma credencial ou endereço de destinatário pode ser fornecido pelo visitante. Limite de mensagem de 2.000 caracteres confirmado no esquema público do formulário. Os resultados de antispam e validação do serviço são respeitados; somente `mail_sent` produz confirmação.
- **Repetição e falhas:** limite global de dez tentativas por dez minutos por instância; solicitações idênticas em andamento, confirmadas ou sem resultado conclusivo são reaproveitadas nessa janela. Timeout não é apresentado como sucesso. Não há registro do conteúdo das mensagens em logs da aplicação.
- **Simuladores:** Crosslink Economics Simulator, Zcash Network Sustainability Simulator e Dynamic Fees Lab abrem dentro do portal por Resources → Simulators, pelos recursos de cada projeto e pelos links importados dos artigos/guias. Os modelos originais permanecem hospedados nas fontes, em frames isolados. Não foram reimplementadas fórmulas.
- **Navegação dos modelos:** cenários de Crosslink e NSM preservados nos links internos; hosts fixos e parâmetros filtrados. O laboratório de taxas abre diretamente na calculadora e permite alternar entre proposta, gráfico de dificuldade/preço e laboratório completo. Voltar restaura a seção.
- **Imagens:** as 20 capas oficiais dos artigos foram importadas a partir dos metadados Open Graph publicados. Miniaturas na lista do Blog, imagem de abertura no leitor e três notícias recentes com imagens no Overview. Mídia servida localmente com dimensões e variantes responsivas.
- **Visual:** menus antes do conteúdo, leitor e formulário com largura controlada, setas internas consistentes e ausência de blocos de demonstração. Política de privacidade contextualizada para o encaminhamento do contato e os modelos externos.

## Fontes verificadas

- Formulário e configuração pública: https://shieldedlabs.net/contact/
- Esquema público: https://shieldedlabs.net/wp-json/contact-form-7/v1/contact-forms/32/feedback/schema
- Contrato de resposta: https://github.com/rocklobster-in/contact-form-7/blob/trunk/includes/rest-api.php
- Modelos: https://aphelionz.github.io/crosslink-economics-simulator/ ; https://zooko.github.io/zcash-network-sustainability-simulator/ ; https://fees.shieldedinfra.net/
- Capas: metadados `yoast_head_json.og_image` das publicações oficiais. O importador aceita `--featured-only` para atualização das capas sem reimportar os textos.

## Verificação realizada

- Compilação de produção e TypeScript aprovados; lint dos arquivos alterados aprovado.
- 30 testes de contato, biblioteca/API editorial, isolamento, imagens, origem dos frames, cenários e seções do laboratório; quatro testes Python do importador.
- 20 imagens e três registros novos responderam HTTP 200 no servidor local: `integrations-http-review.json`.
- Política de frames conferida no servidor: somente `/shielded-preview` permite os três hosts. A política geral permanece sem essa exceção.
- Interações reais nos modelos: Crosslink recalculou ao alterar participação; NSM acrescentou um evento editável ao cenário; calculadora ZIP-317 alterou de 10.000 para 20.000 zats ao passar de duas para quatro ações.
- 18 verificações no navegador, incluindo desktop de 1440 px e celular de 390 px, navegação entre projeto/modelo, seção de taxas e histórico: `integrations-browser-review.json`. Sem transbordamento horizontal nas telas medidas.
- O formulário foi testado com **respostas interceptadas localmente**, sem encaminhamento ao servidor nem envio de email: campos obrigatórios, estado ocupado, erro preservando rascunho, confirmação, limpeza e nova mensagem. A validação do endpoint real também foi testada com campos vazios, que não chegam ao serviço externo.

## Limites de comprovação

- **Nenhuma mensagem real foi enviada à Shielded Labs.** A entrega na caixa de entrada continua sem teste. O formulário está conectado ao serviço existente, não a um serviço de demonstração; os mocks existiram somente durante a revisão do navegador e foram removidos ao final.
- Os modelos e seus dados continuam dependendo dos hosts originais. A interface interna de cada modelo mantém o desenho de sua fonte. Uma indisponibilidade de dados externos, como cotação USD no laboratório, não é preenchida com valores inventados.
- Antes da publicação em várias instâncias, o limite local do contato deve ser complementado por um limite compartilhado na infraestrutura. A proteção do serviço original não é desativada ou contornada.
- Esta etapa não cria monitoramento recorrente, não altera contas de email e não publica mudanças no site oficial.
