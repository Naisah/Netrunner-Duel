<!-- l10n-sync: source-file="04-design-vibes.md" -->
# Parte 4: Tematização orientada por design

---

Nesta parte, você vai usar os fluxos de planejamento e implementação do Copilot para projetar uma transformação visual completa. Isso é desenvolvimento orientado a design — comece com a visão, itere nos visuais e deixe o Copilot cuidar do trabalho pesado de CSS.

## Tarefa 1: Planeje o Tema Retrô

<!-- track:vscode:start -->
Mude para o modo **Plan** no GitHub Copilot Chat.
<!-- track:vscode:end -->

<!-- track:cli:start -->
Use `/plan` no GitHub Copilot CLI ou pressione **Shift+Tab** até ativar o modo de planejamento.
<!-- track:cli:end -->

Insira este prompt:

> Quero transformar esta página em uma experiência completa de arcade retrô. Planeje uma reformulação visual abrangente que inclua: efeito de linhas de varredura CRT no fundo, brilho neon pulsante no título como um letreiro, selo VS animado com mudanças de cor em gradiente, camada de brilho nas cartas de resultado dos usuários, animações flutuantes de entrada nos campos de texto, texto de carregamento que muda entre verde e roxo e efeitos de brilho ao passar o cursor pelos quadrados de contribuição. Mantenha o fundo escuro (#0a0a1a) com as cores de destaque verde (#5fed83) e roxo (#8a2be2). Use um tema escuro com a fonte de jogos retrô Press Start 2P do Google Fonts.

O Copilot vai gerar um plano de implementação detalhado com todos os efeitos visuais. **Não aceite imediatamente** — revise o plano e itere:

- Sugira ajustes na velocidade das animações (por exemplo, "Deixe a pulsação neon mais lenta, em cerca de 3 segundos").
- Pergunte sobre efeitos específicos (por exemplo, "Como a camada de brilho vai funcionar nas cartas?").
- Solicite mudanças na abordagem se algo não parecer correto

Quando estiver satisfeito com o plano, deixe o Copilot prosseguir com a implementação.

## Tarefa 2: Implemente o Tema

<!-- track:vscode:start -->
Mude para o modo **Agent** e peça ao Copilot para implementar o plano:
<!-- track:vscode:end -->

> Implemente o plano de tema de arcade retrô que acabamos de criar.

<!-- track:cli:start -->
Quando estiver satisfeito com o plano, peça ao Copilot CLI para implementá-lo.
<!-- track:cli:end -->

O Copilot vai adicionar múltiplas animações CSS, pseudo-elementos e transições na sua folha de estilos. Isso pode incluir:

- `@keyframes` para scanlines, pulso neon, shimmer e efeitos de float-in
- Pseudo-elementos (`::before`, `::after`) para efeitos de sobreposição
- CSS custom properties para as cores do tema
- Estados de transição e hover para elementos interativos

Depois que as alterações forem aplicadas, **verifique a pré-visualização no seu navegador** para ver a transformação completa do tema retrô arcade.

<!-- track:cli:start -->
Depois que as alterações forem aplicadas, use `/diff` para revisar as mudanças de estilo antes de aprová-las.
<!-- track:cli:end -->

## Tarefa 3: Ajuste Fino das Vibes

> **⚠️ Não está vendo as mudanças?** Se o novo tema ou as animações não aparecerem, pare o servidor de desenvolvimento (`Ctrl+C`), reinicie com `npm run dev` e atualize a página (`Ctrl+Shift+R`).

Mantenha a pré-visualização do navegador aberta e itere no design. Tente prompts como:

> O efeito das linhas de varredura está forte demais; reduza a opacidade para 0.03.

> Adicione um leve efeito de cintilação elétrica ao texto do título.

> O selo VS deve pulsar de forma mais intensa.

Isso é **desenvolvimento orientado a design** — você está iterando na saída visual em tempo real. Cada prompt refina a experiência até que fique perfeita. Não se contente com "bom o suficiente" — aperfeiçoe as vibes até que a página pareça pertencer a um gabinete de arcade.

## Tarefa 4: Atualize as Instruções

Suas instruções devem refletir as principais decisões de design para manter os próximos prompts alinhados.

<!-- track:vscode:start -->
Peça ao Copilot Chat:

> Adicione uma seção de guia de design ao `copilot-instructions.md` descrevendo o tema de arcade retrô: cores, fontes e estilo das animações.
<!-- track:vscode:end -->

<!-- track:cli:start -->
Peça ao Copilot CLI:

> Atualize as instruções do repositório com um guia de design breve para o tema de arcade retrô: cores, fontes, estilo das animações e a regra de que novos elementos de interface devem manter a estética neon.
<!-- track:cli:end -->

Faça commit das alterações nas instruções e no design quando a página estiver como você quer.

## ✅ Parte 4 Concluída

**O que você aprendeu:**

- Use fluxos de planejamento para criar um **sistema visual antes de implementá-lo**
- **Itere nos resultados visuais** com feedback rápido
- **Atualize as instruções após decisões importantes** para manter a identidade visual no Copilot
