# Gerenciador Pé Na Estrada Tour

## Sobre o Projeto
Sistema completo de gestão de passeios, alocação inteligente de passageiros no mapa de assentos e controle financeiro, projetado especificamente para as necessidades operacionais da empresa "Pé Na Estrada Tour".

## Tecnologias
- **React**: Biblioteca de interface de usuário (UI).
- **TypeScript**: Tipagem estática para maior segurança e escalabilidade.
- **Firebase**: Backend como serviço (Firestore, Authentication, Hosting).
- **Tailwind CSS**: Estilização utilitária moderna e responsiva.

## Funcionalidades
- **Gestão de Frota Mista**: Criação de passeios utilizando diferentes tipos e quantidades de veículos.
- **Mapa de Alocação Interativo**: Distribuição visual de passageiros nas poltronas, com filtros inteligentes de alocados e desalocados.
- **Geração de Relatórios**: Exportação de PDFs profissionais (Resumo e Detalhado) utilizando tabelas automáticas e segregação por veículo.
- **Controle Financeiro**: Acompanhamento dinâmico da receita, custos e margem de lucro por passeio e em nível global.
- **Segurança de Acesso**: Proteção das rotas internas via Google Auth atrelada a uma *allowlist* rígida de administradores.
- **Formulário de Inscrição Público**: Link de captação de clientes integrado diretamente com o banco de dados.

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
