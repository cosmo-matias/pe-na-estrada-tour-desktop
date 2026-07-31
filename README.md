# Gerenciador Pé Na Estrada Tour

## Sobre o Projeto
Sistema completo de gestão de passeios, alocação inteligente de passageiros no mapa de assentos e controle financeiro, projetado especificamente para as necessidades operacionais da empresa "Pé Na Estrada Tour".

## Tecnologias
- **React**: Biblioteca de interface de usuário (UI).
- **TypeScript**: Tipagem estática para maior segurança e escalabilidade.
- **Firebase**: Backend como serviço (Firestore, Authentication, Hosting).
- **Tailwind CSS**: Estilização utilitária moderna e responsiva.

## Funcionalidades

- **Infraestrutura de Imagens:** Integração com a API do ImgBB para upload e hospedagem gratuita de imagens, substituindo o Firebase Storage.
- **Vitrine Pública (Client-Facing):** Modal de Detalhes dinâmico para os passeios (com descrição completa, expansão de imagem e redirecionamento de reserva direto para o WhatsApp oficial). Formulário de Inscrição Público com link de captação de clientes integrado diretamente com o banco de dados. Otimização para Redes Sociais (Open Graph) para compartilhamento no WhatsApp.
- **Painel Administrativo (CMS):** Sistema completo de Edição de Passeios e Gerenciador de Slideshow dinâmico gravado no Firestore para a capa do site. Segurança de Acesso com rotas internas protegidas via Google Auth e allowlist de administradores. Validação e Máscaras de Dados para CPF, WhatsApp e UF.
- **Motor de Alocação e Logística Avançada:** 
  - Gestão de Frota Mista com criação de passeios utilizando diferentes tipos e quantidades de veículos.
  - Agrupamento visual inteligente de famílias e dependentes (`grupoId`) no mapa de assentos.
  - Automação de Crianças de Colo: Cálculo de idade em tempo real (<= 3 anos), isenção na contagem de lotação do veículo e identificação visual (👶) nas listas. Alocação de assento compartilhado (Adulto + Bebê) com listagem separada para controle seguro do guia.
  - Sistema de Taxa de Ocupação Real ancorado no total de cadastros pagantes, com barra de progresso visual.
  - Sistema Dinâmico de Agentes com identificação visual e separação de Guias/Agentes de Turismo por veículo.
- **Módulos de Gestão:** Painel Financeiro integrado para acompanhamento dinâmico da receita, custos e margem de lucro. Exportação inteligente de listas de passageiros em PDF (Resumo e Detalhado) utilizando tabelas automáticas, segregadas por veículo, agentes responsáveis e crianças de colo.

## Instruções de Deploy

Para rodar o projeto localmente e implantar atualizações em produção, siga os comandos abaixo:

1. **Instalar dependências**:
   ```bash
   npm install
   ```

2. **Rodar localmente (desenvolvimento)**:
   ```bash
   npm run dev
   ```

3. **Gerar versão de produção (Build)**:
   ```bash
   npm run build
   ```

4. **Publicar no Firebase Hosting (Deploy)**:
   ```bash
   npx firebase-tools deploy --only hosting
   ```
