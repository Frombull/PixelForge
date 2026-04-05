# PROJECT_CONTEXT.md - PixelForge 3D

## Visão Geral

O **PixelForge 3D** é uma plataforma educacional interativa voltada ao ensino de
Computação Gráfica e Multimídia. Foi criada por **Marco Di Toro** (Inatel) em 2025 com o
objetivo de transformar conceitos matemáticos e técnicos abstratos em
visualizações manipuláveis em tempo real, para uso direto em sala de aula por
professores da área.

A plataforma conta com uma **área de Material Teórico**, onde os conceitos
abordados nas simulações são explicados de forma detalhada - com exemplos,
vídeos e links diretos para as simulações interativas dentro da própria
plataforma.

A landing page do site mostra cada módulo separado por Computação Gráfica e Multimidia, com links para o usuário acessar o que desejar. Cada card de módulo tem um nome, descrição e tags de conceitos abordados.

Em 2025, o projeto foi orientado por Prof. Me. Marcelo Vinícius Cysneiros Aragão, já agora em 2026 está sendo orientado pelo Prof. Ruan Patrick de Souza.

---

## Histórico e Versões

### Versão 1 — PixelForge (Legado · FETIN 2025)

- **Conquista:** 1º lugar na categoria Impacto Social na FETIN 2025.
- **Tecnologias:** Next.js · p5.js (canvas 2D) · Vercel (hospedagem).

#### Simulações e Funcionalidades

| Módulo | Descrição |
|---|---|
| **Canvas 2D Interativo** | Criação de polígonos com controles de transformação (translação, rotação, escala, cisalhamento), curvas de Bézier e keyframes para animação básica. Suporte a troca de cor, transparência e ajuste dos espaços RGB e HSV com color pickers. Permite alterar a origem da transformação para demonstrar escala a partir de pontos arbitrários do polígono. |
| **FFT no Domínio da Frequência** | Transformação de imagens em tempo real para o dominio da frequencia usando FFT, para visualizar um conceito geralmente difícil de abstrair em sala de aula. |
| **Aliasing** | Exibe um sinal original e um amostrado lado a lado. O usuário ajusta o sample rate e observa como os sinais se comparam, demonstrando o fenômeno do aliasing. |
| **Compressão de Imagens** | Compressão nos formatos JPG, PNG, WEBP e Fractal. Permite comparar qualidade visual e tamanho de arquivo antes e depois da compressão, ilustrando como algoritmos reduzem dados sem perda visual perceptível. |
| **Segmentação de Imagem** | Exemplo interativo para demonstrar o conceito de segmentação de imagem. |
| **Vetorial vs. Matricial** | Comparação entre imagens vetoriais e matriciais com zoom, evidenciando as diferenças de representação. |

#### Conceitos Abordados
Compressão de imagens (JPG/PNG/WEBP/Fractal) · Domínio da frequência (FFT) ·
Matrizes de transformação · Espaços de cores (RGB, CMYK, HSV) · Filtros de
imagem · Aliasing · Segmentação de imagem · Vetorial vs. Matricial.

---

### Versão 2 — PixelForge 3D (Atual · FETIN 2026)

- **URL:** https://www.pixelforge3d.com.br
- **Evolução:** Expansão para o ambiente tridimensional, abordando desafios de
  renderização e hardware.
- **Tecnologias:** Next.js · p5.js (canvas 2D) · Three.js (canvas 3D) · Vercel
  (hospedagem).
- **Diferencial Didático:** Foi criado um módulo no estilo de um editor 3D, similar a UI do Unity, Godot e Playcanvas com popups explicativos e documentação vinculada a cada ferramenta de interação.

#### Conceitos Abordados
Projeção ortográfica e perspectiva · Z-fighting · Algoritmos de visibilidade
(Z-buffer, A-buffer) · Frustum Culling · Operações booleanas entre objetos 3D
(CSG) · Transformações 3D (rotação, escala, cisalhamento, translação) · Espaços
de cores · Transparência.

---

## Modelo de Negócio (Viabilidade Econômica · FETIN 2026)

O projeto é **open source**, mas para a FETIN 2026 será apresentado um modelo de
negócio para demonstrar viabilidade econômica e concorrer nessa categoria.

O modelo simulado é **SaaS (Software as a Service)** com foco em instituições de
ensino **(B2B)**, com os seguintes planos sugeridos:

| Plano | Perfil | Descrição |
|---|---|---|
| **Acadêmico** | Gratuito / Básico | Acesso à plataforma sem custo. |
| **Educator Pro** | Professor (individual) | Plano pago para uso individual por docentes. |
| **Campus Edition** | Institucional | Licenciamento para instituições, com integração a LMS (Moodle, Canvas). |