<!-- l10n-sync: source-file="03-agent-mode.md" -->
# Parte 3: Agent Mode — Construa o Jogo

---

Nesta parte, o Copilot passa de planejador a implementador. Em vez de escrever código linha por linha, você descreve o que deseja e deixa o Copilot trabalhar nos arquivos necessários.

## Tarefa 1: Conecte a Batalha

<!-- track:vscode:start -->
1. Mude para o modo **Agent** no Copilot Chat.
2. Insira este prompt:
<!-- track:vscode:end -->

<!-- track:cli:start -->
1. Volte ao fluxo padrão de programação do Copilot CLI (ou continue no autopilot se quiser que o Copilot prossiga até você pará-lo).
2. Se ajudar, mencione o arquivo da página para dar mais contexto: `@src/pages/index.astro`.
3. Insira este prompt:
<!-- track:cli:end -->

   > Adicione JavaScript do lado do cliente à página de batalha para que:
   > 1. Ao clicar no botão Battle, obtenha os dois nomes de usuário dos campos.
   > 2. Valide se ambos foram preenchidos (e mostre um erro caso contrário).
   > 3. Busque em paralelo na nossa API os dados de contribuição dos dois usuários.
   > 4. Exiba gráficos de contribuição em grades coloridas — cada dia deve ser um quadrado colorido usando a paleta do GitHub.
   > 5. Mostre um selo VS entre os dois usuários.
   > 6. Exiba o nome de usuário, o total de contribuições e o intervalo de datas de cada usuário.
   > 7. Gerencie os estados de carregamento e os erros.
   > 8. Acione a batalha também quando a tecla Enter for pressionada nos campos de entrada.
   >
   > Use interfaces do TypeScript para a estrutura de dados de contribuição.

<!-- track:vscode:start -->
3. Deixe o Agent Mode implementar as alterações em `index.astro`.
4. Revise as alterações propostas na visualização de diff antes de aceitá-las.
<!-- track:vscode:end -->

<!-- track:cli:start -->
4. Deixe o Copilot CLI implementar as alterações em `src/pages/index.astro`.
5. Use `/diff` para revisar as alterações geradas e depois aprove-as.
<!-- track:cli:end -->

## Tarefa 2: Teste a Batalha

1. Insira `octocat` e `torvalds` como os dois nomes de usuário e clique em **Battle**.
2. Você deve ver ambos os gráficos de contribuição renderizados lado a lado com grids coloridos.
3. Teste os casos de erro:
   - Deixe um ou ambos os campos vazios e clique em Battle — você deve ver um erro de validação.
   - Insira um nome de usuário inválido — o app deve exibir um erro da API.
4. Teste pressionando **Enter** em qualquer campo de entrada — deve disparar a batalha assim como clicar no botão.

## Tarefa 3: Itere com o Agent

Se algo não estiver totalmente correto, dê feedback de acompanhamento ao Copilot. Por exemplo:

- *"Os quadrados de contribuição estão grandes demais; deixe-os com 12x12px."*
- *"Adicione uma dica ao passar o cursor mostrando a data e a contagem de contribuições."*
- *"O estado de carregamento precisa de uma animação pulsante."*

<!-- track:vscode:start -->
O Agent Mode lida naturalmente com alterações em vários arquivos e iterações. Cada feedback de acompanhamento se baseia na conversa anterior, permitindo refinar a implementação aos poucos sem começar do zero.
<!-- track:vscode:end -->

<!-- track:cli:start -->
As sessões do Copilot CLI mantêm o histórico, então cada feedback de acompanhamento se baseia no anterior. Use `/session` ou `/context` para inspecionar o contexto que o Copilot está mantendo e execute `/review` após uma iteração maior para procurar bugs ou melhorias.
<!-- track:cli:end -->

## Dicas para o Agent Mode

- **Seja específico sobre o que você quer** — requisitos claros levam a resultados melhores.
- **Divida tarefas grandes em prompts menores** se o Agent sair do rumo.
- **Revise as alterações antes de aceitar** — use a visualização de diff para entender o que foi modificado.
- **Se os resultados não forem perfeitos, forneça feedback e itere** — o Agent aprende com suas correções dentro da conversa.

## ✅ Parte 3 Concluída

Você aprendeu a:

- Usar o **Agent Mode** para implementações complexas em múltiplos arquivos
- **Iterar nos resultados** com feedback direcionado
- Lidar com o **ciclo de vida completo de uma funcionalidade** — da implementação ao teste e refinamento — em uma única conversa
