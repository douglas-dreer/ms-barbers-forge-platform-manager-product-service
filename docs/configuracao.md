# Configuração

Esta seção descreve todas as configurações necessárias para executar o Manager Product Service.

## 🗄️ Configuração do Banco de Dados

O serviço utiliza **PostgreSQL** como banco de dados principal. As configurações são gerenciadas através de variáveis de ambiente para maior segurança e flexibilidade entre ambientes.

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```properties
DATABASE_PROTOCOL=postgresql
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=manager_product_db
DATABASE_USERNAME=seu_usuario
DATABASE_PASSWORD=sua_senha
```

### Descrição das Variáveis

| Variável | Descrição | Valor Padrão | Obrigatório |
|----------|-----------|--------------|-------------|
| `DATABASE_PROTOCOL` | Protocolo de conexão JDBC | `postgresql` | Sim |
| `DATABASE_HOST` | Endereço do servidor do banco | `localhost` | Sim |
| `DATABASE_PORT` | Porta do servidor PostgreSQL | `5432` | Sim |
| `DATABASE_NAME` | Nome do banco de dados | `manager_product_db` | Sim |
| `DATABASE_USERNAME` | Usuário do banco de dados | - | Sim |
| `DATABASE_PASSWORD` | Senha do banco de dados | - | Sim |

### String de Conexão

A aplicação constrói a string de conexão automaticamente usando o formato:

```
jdbc:postgresql://localhost:5432/manager_product_db
```

Esta configuração está definida em `application.yaml`:

```yaml
spring:
  datasource:
    url: jdbc:${DATABASE_PROTOCOL}://${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}
    username: ${DATABASE_USERNAME}
    password: ${DATABASE_PASSWORD}
```

## 🐳 Configuração com Docker

O projeto inclui um arquivo `docker-compose.yml` para facilitar a configuração do banco de dados em ambiente de desenvolvimento.

### Subindo o Banco de Dados

```bash
docker-compose up -d
```

Este comando irá:
- Criar um container PostgreSQL
- Configurar as credenciais de acesso
- Criar o banco de dados necessário
- Expor a porta 5432

### Parando o Banco de Dados

```bash
docker-compose down
```

### Removendo Volumes (cuidado: apaga os dados!)

```bash
docker-compose down -v
```

## 🔄 Flyway - Migrations

O projeto utiliza **Flyway** para controle de versão do esquema do banco de dados.

### Configurações do Flyway

```yaml
spring:
  flyway:
    enabled: true
    baseline-on-migrate: true
```

### Localização das Migrations

As migrations SQL devem ser colocadas em:

```
src/main/resources/db/migration/
```

### Nomenclatura dos Arquivos

Os arquivos de migration devem seguir o padrão:

```
V{versão}__{descrição}.sql
```

Exemplos:
- `V1__create_products_table.sql`
- `V2__add_category_column.sql`
- `V3__create_index_on_name.sql`

### Executando Migrations

As migrations são executadas automaticamente ao iniciar a aplicação. O Flyway:

1. Verifica quais migrations já foram aplicadas
2. Executa apenas as novas migrations
3. Registra o histórico na tabela `flyway_schema_history`

### Baseline em Banco Existente

A configuração `baseline-on-migrate: true` permite que o Flyway trabalhe com bancos de dados existentes, criando um ponto de partida (baseline) antes de aplicar novas migrations.

## 🔧 JPA e Hibernate

### Configurações do JPA

```yaml
spring:
  jpa:
    database-platform: org.hibernate.dialect.PostgreSQLDialect
    hibernate:
      ddl-auto: validate
```

### DDL Auto: Validate

A configuração `ddl-auto: validate` garante que:

- O Hibernate **não** cria ou altera tabelas automaticamente
- Apenas **valida** se o schema do banco está compatível com as entidades
- As alterações devem ser feitas exclusivamente via Flyway migrations

Esta é uma prática recomendada para ambientes de produção, pois:
- Mantém controle total sobre alterações no banco
- Evita mudanças acidentais no schema
- Garante rastreabilidade através das migrations

## 🌍 Profiles do Spring

### Profile: Default (Produção)

Utiliza o arquivo `application.yaml` e carrega variáveis do arquivo `.env`:

```yaml
spring:
  config:
    import: "file:.env[.properties]"
```

### Profile: Dev (Desenvolvimento)

Para usar o profile de desenvolvimento, execute:

```bash
./gradlew bootRun --args='--spring.profiles.active=dev'
```

Ou no Windows:
```bash
gradlew.bat bootRun --args='--spring.profiles.active=dev'
```

O arquivo `application-dev.yaml` é carregado, permitindo configurações específicas para desenvolvimento.

## 🔐 Boas Práticas de Segurança

1. **Nunca commite o arquivo `.env`** - Adicione ao `.gitignore`
2. **Use variáveis de ambiente** em ambientes de produção
3. **Senhas complexas** para o banco de dados
4. **Restrinja acesso** ao banco apenas para IPs necessários
5. **Use secrets management** em ambientes cloud (AWS Secrets Manager, Azure Key Vault, etc.)

## 📊 Actuator - Monitoramento

O Spring Boot Actuator fornece endpoints de monitoramento:

### Health Check
```
GET http://localhost:8080/actuator/health
```

Retorna o status da aplicação e suas dependências (banco de dados, etc.)

### Outros Endpoints

Para habilitar mais endpoints do Actuator, adicione em `application.yaml`:

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics
```

## ⚙️ Configurações Adicionais

### Porta da Aplicação

Para alterar a porta padrão (8080), adicione:

```yaml
server:
  port: 8081
```

### Log Level

Para ajustar o nível de log:

```yaml
logging:
  level:
    br.com.barbers_forge: DEBUG
    org.springframework.web: INFO
    org.hibernate.SQL: DEBUG
```

### Timezone

Para configurar o timezone da aplicação:

```yaml
spring:
  jackson:
    time-zone: America/Sao_Paulo
```

## 🐛 Troubleshooting

### Erro de Conexão com Banco

**Problema**: `Connection refused` ou `Connection timeout`

**Solução**:
1. Verifique se o PostgreSQL está rodando: `docker ps`
2. Confirme as variáveis de ambiente no arquivo `.env`
3. Teste a conexão: `telnet localhost 5432`

### Erro de Migration

**Problema**: `Migration checksum mismatch`

**Solução**:
1. Nunca altere migrations já aplicadas
2. Crie uma nova migration para correções
3. Em desenvolvimento, você pode limpar: `docker-compose down -v`

### Erro de Validação do Schema

**Problema**: `Schema-validation: missing table`

**Solução**:
1. Certifique-se que todas as migrations foram executadas
2. Verifique o log do Flyway na inicialização
3. Confirme que `ddl-auto` está como `validate`

