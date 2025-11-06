# Manager Product Service

Microserviço de gerenciamento de produtos da plataforma Barber's Forge.

## 📋 Descrição

Este é um microserviço desenvolvido em Kotlin com Spring Boot, responsável pelo gerenciamento de produtos na plataforma Barber's Forge.

## 🚀 Tecnologias

- **Kotlin** 1.9.25
- **Spring Boot** 3.5.7
- **Java** 21
- **PostgreSQL** (Banco de dados)
- **Flyway** (Migrations)
- **Gradle** (Gerenciamento de dependências)

## 📦 Pré-requisitos

- Java 21 ou superior
- Docker e Docker Compose (para execução do banco de dados)
- Gradle (wrapper incluído no projeto)

## ⚡ Execução Rápida

### 1. Configurar variáveis de ambiente

Copie o arquivo de exemplo e configure as credenciais:

```bash
copy .env.example .env
```

Edite o arquivo `.env` com suas configurações locais.

### 2. Subir o banco de dados
```bash
docker-compose up -d
```

### 3. Executar a aplicação
```bash
gradlew bootRun
```

Ou no Windows:
```bash
gradlew.bat bootRun
```

A aplicação estará disponível em: `http://localhost:8080`

## 📚 Documentação Completa

Para informações detalhadas sobre configuração, arquitetura e desenvolvimento, consulte a [documentação completa](docs/index.md).

### Acesso à documentação via MkDocs

Para visualizar a documentação de forma interativa:

```bash
pip install mkdocs
mkdocs serve
```

Acesse: `http://127.0.0.1:8000`

## 🛠️ Build

### Compilar o projeto
```bash
gradlew build
```

### Executar testes
```bash
gradlew test
```

## 🐳 Docker

### Construir imagem Docker
```bash
docker build -t manager-product-service .
```

## 📄 Licença

Este projeto é parte da plataforma Barber's Forge.

