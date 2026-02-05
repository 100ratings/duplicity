# Sistema de Desenhos Customizados - Duplicity

Este sistema permite que você crie, salve e gerencie seus próprios desenhos manuscritos para usar no aplicativo Duplicity.

## Como Funciona

O sistema funciona de forma simples e intuitiva:

1. **Desenhe no Canvas**: Use o canvas normalmente para desenhar seus caracteres
2. **Capture a Área**: Selecione a área do seu desenho
3. **Ajuste o Tamanho**: Ajuste as dimensões para que fique perfeito
4. **Salve**: Escolha qual caractere representa e salve

## Como Usar

### 1. Acessar o Painel de Configurações

- Toque 5 vezes no botão PRETO da barra de ferramentas
- O painel de configurações será aberto

### 2. Criar um Novo Desenho

1. No painel de configurações, role até "Desenhos Customizados"
2. Clique em **"Capturar Novo"**
3. Desenhe o caractere desejado no canvas usando qualquer cor
4. Clique em **"Capturar Área"**
5. Arraste no canvas para selecionar a área do seu desenho
6. Ajuste a largura e altura usando os botões +/-
7. Selecione qual caractere este desenho representa (A, 2, 3, etc)
8. Escolha o índice da variante (0-4) - isso permite ter 5 versões diferentes de cada caractere
9. Clique em **"Salvar Desenho"**

### 3. Gerenciar Seus Desenhos

1. No painel de configurações, clique em **"Gerenciar Desenhos"**
2. Você verá todos os seus desenhos customizados organizados
3. Para excluir um desenho, clique em "Excluir" no cartão do desenho

### 4. Ativar/Desativar Desenhos Customizados

- No painel de configurações, clique no botão **"Usar Desenhos Customizados"**
- Quando ativado (ON), o sistema usará seus desenhos no lugar dos originais
- Quando desativado (OFF), o sistema usa os desenhos originais

## Dicas para Melhores Resultados

### Tamanho dos Desenhos

- **Recomendado**: Largura entre 40-80px, Altura entre 80-120px
- Desenhos muito pequenos podem ficar pixelados
- Desenhos muito grandes ocupam mais espaço na tela

### Proporções

- Mantenha proporções consistentes entre seus desenhos
- Números geralmente são mais altos que largos
- Naipes podem ser quadrados ou ligeiramente retangulares

### Clareza

- Use traços bem definidos
- Evite traços muito finos que podem sumir ao redimensionar
- Teste diferentes tamanhos antes de salvar

### Organização

- Crie todas as 5 variantes de cada caractere para máxima aleatoriedade
- Isso evita repetições visuais nos resultados do Duplicity

## Importar/Exportar Desenhos

### Exportar

1. Abra "Gerenciar Desenhos"
2. Clique em "Exportar Desenhos"
3. Um arquivo JSON será baixado com todos os seus desenhos

### Importar

1. Abra "Gerenciar Desenhos"
2. Clique em "Importar Desenhos"
3. Selecione o arquivo JSON anteriormente exportado
4. Todos os desenhos serão restaurados

## Caracteres Disponíveis

Você pode criar desenhos customizados para:

### Valores de Cartas
- A, 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K

### Naipes
- ♠️ (Espadas - S)
- ♥️ (Copas - H)
- ♣️ (Paus - C)
- ♦️ (Ouros - D)

### Números
- 0, 1, 2, 3, 4, 5, 6, 7, 8, 9

## Variantes

Cada caractere pode ter até 5 variantes (0, 1, 2, 3, 4). O sistema escolhe aleatoriamente entre as variantes disponíveis, garantindo que não se repitam na mesma linha do Duplicity.

## Armazenamento

Todos os seus desenhos são salvos no banco de dados Supabase e ficam disponíveis mesmo após fechar o aplicativo. Os desenhos são armazenados como imagens em formato base64, garantindo portabilidade e backup automático.

## Solução de Problemas

**Problema**: Desenho ficou muito pequeno/grande
- **Solução**: Ajuste o tamanho no painel de captura antes de salvar

**Problema**: Desenho aparece cortado
- **Solução**: Ao capturar, selecione uma área maior que inclua todo o desenho

**Problema**: Variantes não aparecem aleatoriamente
- **Solução**: Certifique-se de criar pelo menos 2 variantes de cada caractere

**Problema**: Desenhos não aparecem no Duplicity
- **Solução**: Verifique se o botão "Usar Desenhos Customizados" está ativado (ON)
