# ======================================================================
# ESTÁGIO 1: A "COZINHA DO CONSTRUTOR" (Builder)
# Usamos uma imagem que já tem o Java 21 e o Gradle 8.x
# ======================================================================
FROM gradle:8.9-jdk21 AS builder

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia os arquivos de build primeiro para aproveitar o cache do Docker.
# Se esses arquivos não mudarem, o Docker não baixa as dependências de novo!
COPY build.gradle.kts settings.gradle.kts ./
COPY gradlew ./
COPY gradle/ ./gradle/

# Garante que o script do Gradle seja executável
RUN chmod +x ./gradlew

# Copia o resto do código-fonte da sua aplicação
COPY src/ ./src/

# Roda a tarefa do Spring Boot para construir o JAR executável ("fat jar")
# --no-daemon é importante para ambientes de CI/Docker
RUN ./gradlew bootJar --no-daemon

# ======================================================================
# ESTÁGIO 2: A "COZINHA DE ENTREGA" (Runner)
# Usamos uma imagem mínima, que tem SÓ o Java 21 para rodar (JRE).
# Sem compilador, sem Gradle, sem nada desnecessário. É mais seguro!
# ======================================================================
FROM eclipse-temurin:21-jre

# Set the working directory
WORKDIR /app

# Copia APENAS o .jar que foi construído lá no Estágio 1 (o "builder")
# para dentro deste novo container.
# O 'app.jar' é um nome genérico que estamos dando para ele.
COPY --from=builder /app/build/libs/*.jar app.jar

# Expõe a porta 8080 (que o Spring usa por padrão)
EXPOSE 8080

# O comando que será executado quando o container iniciar
ENTRYPOINT ["java", "-jar", "app.jar"]