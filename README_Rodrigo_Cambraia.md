# README — Rodrigo Cambraia

Esse arquivo é só para explicar, de forma simples, o que eu faria diferente se isso fosse um sistema rodando em produção e com algumas prioridades bem claras.

Hoje o template usa EF Core (com `DefaultContext`), AutoMapper (`IMapper`) e FluentValidation. Eu manteria isso no desafio, mas em produção eu consideraria trocar dependendo do contexto.

## OpenAPI (padrão) vs “Swagger” (ferramentas)

Quando falamos “Swagger” no dia a dia, quase sempre estamos falando de **ferramentas** (ex.: Swagger UI) que **mostram** a documentação.

O que a API realmente expõe é uma **especificação OpenAPI** (um JSON/YAML padronizado), que pode ser consumida por qualquer ferramenta compatível (Swagger UI, Postman, Insomnia, geradores de SDK, etc.).

Neste projeto, a especificação OpenAPI é gerada em runtime e fica disponível em:

- **OpenAPI JSON**: `GET /swagger/v1/swagger.json`
- **UI (visualizador)**: `GET /swagger`

### Enums numéricos (campos como `Role` e `Status`)

Alguns campos do contrato são **enums** que trafegam como **número**. Para quem consome a OpenAPI, é importante saber o significado de cada valor:

#### `UserRole`

- **0**: `None`
- **1**: `Customer`
- **2**: `Manager`
- **3**: `Admin`

#### `UserStatus`

- **0**: `Unknown`
- **1**: `Active`
- **2**: `Inactive`
- **3**: `Suspended`

## Dapper no lugar do EF Core

Se a aplicação precisasse de muita performance, eu usaria **Dapper** porque me dá mais controle do SQL e costuma ter menos custo por request.

Junto com isso, eu iria bem forte em:

- índices pensando nas consultas reais (cliente, filial, data, número da venda)
- revisão de query com plano de execução (`EXPLAIN`)
- paginação que não degrada com `OFFSET` gigante

O lado ruim é que você assume mais responsabilidade: schema, scripts e mais código manual.

## `implicit` e `explicit` no lugar do AutoMapper

Em vez de depender do AutoMapper para mapear request, comando, DTO e entidade, eu prefiro conversão nativa do C# em pontos bem definidos.

No fim, isso costuma ser **mais leve e previsível** do que bibliotecas externas, porque é só código compilado mesmo. Também dá mais controle: se amanhã mudar a regra de conversão, está tudo ali no seu código, e você não fica refém de mudanças de comportamento ou até de licenças que podem virar pagas.

Diferença prática:

- `implicit` converte sozinho, sem você pedir
- `explicit` só converte quando você faz cast

Exemplo:

```csharp
public sealed class MoneyDto
{
    public decimal Amount { get; init; }
    public string Currency { get; init; } = "BRL";
}

public readonly record struct Money(decimal Amount, string Currency)
{
    // Conversão automática (cuidado para não esconder custo/regra)
    public static implicit operator Money(MoneyDto dto)
        => new(dto.Amount, dto.Currency);

    // Conversão só com cast (mais seguro quando tem regra)
    public static explicit operator MoneyDto(Money money)
        => new() { Amount = money.Amount, Currency = money.Currency };
}

MoneyDto dto = new() { Amount = 10m, Currency = "BRL" };
Money money = dto;                 // implicit acontece aqui
MoneyDto dto2 = (MoneyDto)money;   // explicit exige cast
```

Eu uso `implicit` só quando a conversão é óbvia e sem surpresa. Se tiver chance de erro, perda de dados ou regra de negócio, eu prefiro `explicit` ou um método com nome (`ToDto()`, `ToCommand()`).

## Validação nativa do .NET no lugar do FluentValidation

Eu trocaria FluentValidation por validação nativa quando o objetivo for reduzir dependência, ficar mais alinhado ao pipeline padrão do ASP.NET Core e ter um caminho de execução mais simples.

Sobre performance, o FluentValidation é bom e resolve muita coisa com pouco código, mas ele ainda é uma biblioteca a mais no hot path da requisição. Em cenários de volume alto, eu prefiro o que é nativo porque costuma ser mais direto, com menos “camadas” e sem surpresas. E tem um ponto bem prático: usando o nativo, você diminui o risco de ficar preso a decisões de terceiros, como mudança de licença, feature virar paga ou o projeto mudar de rumo.

Normalmente eu iria de:

- `DataAnnotations` no request (`[Required]`, `[Range]`, etc.)
- validação de regras mais chatas no domínio ou em um serviço, não só no controller

O trade-off é que FluentValidation é bem bom para regras condicionais e testes mais diretos. Então a troca só vale a pena se o time realmente quiser padronizar no que é nativo.

## Como rodar o projeto local

### Opção 1. Docker (mais simples)

Pré-requisito: Docker Desktop rodando.

Com **um único comando**, rodando a partir da **raiz do repositório**, você sobe **backend + frontend** e fica pronto para testar:

```bash
docker compose -f template/backend/docker-compose.yml up -d --build
```

Depois veja quais portas a API pegou no seu host (o compose atual usa portas auto-atribuídas no host):

```bash
docker compose -f template/backend/docker-compose.yml ps
```

Em geral a WebApi usa as portas 8080 (HTTP) e 8081 (HTTPS) dentro do container. A URL final vai aparecer no `docker compose ps` como algo do tipo `http://localhost:PORTA`.

#### Acessar API (Swagger/OpenAPI)

- **Swagger UI**: `http://localhost:<WEBAPI_HTTP_PORT>/swagger`
- **OpenAPI JSON**: `http://localhost:<WEBAPI_HTTP_PORT>/swagger/v1/swagger.json`

#### Acessar Frontend (Angular)

O frontend é servido por Nginx em:

- **Frontend**: `http://localhost:4200`

Ele faz proxy de `/api` para o backend dentro do Docker, então você pode chamar:

- `http://localhost:4200/api/Auth`
- `http://localhost:4200/api/Users/...`
- `http://localhost:4200/api/Sales/...`

Para parar:

```bash
docker compose -f template/backend/docker-compose.yml down
```

## Publicação de eventos (simulada) com publisher neutro + Rebus

Para o desafio, os eventos de venda (`SaleCreated`, `SaleModified`, `SaleCancelled`, `ItemCancelled`) são publicados via uma abstração (`IIntegrationEventPublisher`) com uma implementação **neutra** (focada no que faz, não na tecnologia), hoje em modo **simulado (log-only)**:

- Implementação: `TopicIntegrationEventPublisher`
- Config: `IntegrationEvents:TopicName` (default `sales-events`)

O código contém a linha de publicação real via Rebus **comentada**, para indicar como seria integrar com um broker (ex.: Azure Service Bus / RabbitMQ) sem quebrar execução local por falha de conexão.

### Opção 2. Rodando com .NET (sem Docker)

Pré-requisitos: .NET SDK instalado e um banco disponível (**PostgreSQL** e **Redis**).

1. Suba PostgreSQL e Redis (do jeito que preferir).
2. Ajuste as connection strings em `template/backend/src/Ambev.DeveloperEvaluation.WebApi/appsettings.json`.
3. Rode a API:

```bash
cd template/backend/src/Ambev.DeveloperEvaluation.WebApi
dotnet run
```

## Uso de IA
Durante este desafio eu usei **IA como assistente de desenvolvimento** para acelerar tarefas repetitivas e manter consistência nas entregas, sem abrir mão das decisões técnicas e validações por minha conta.

### Qual IA eu usei e por quê
Eu usei o **Cursor (IDE) com um modelo GPT** como copiloto porque ele me ajudou a:

- **Iterar rápido em UI/UX** (Angular + Material), criando telas administrativas e refinando textos para PT-BR.
- **Aplicar padrões consistentes** no backend (.NET + MediatR + EF Core), gerando handlers/DTOs e conectando camadas.
- **Reduzir tempo de debugging** em erros de tipagem, integração e comportamento (ex.: problemas de update em EF Core).

### Como eu usei a IA (na prática)
- **Levantamento e refatoração guiada**: pedi para a IA localizar pontos do código (controllers/handlers/pages) e sugerir alterações mantendo o estilo do projeto.
- **Geração de boilerplate com revisão**: usei a IA para criar esqueletos (ex.: endpoints, requests/validators, telas), e eu revisei/ajustei detalhes de regra de negócio, segurança e performance.
- **Diagnóstico com evidência**: quando surgiram erros (ex.: exceções de update no EF Core), eu usei a IA para formar hipóteses, mas validei com build/test e correções mínimas orientadas pelo stacktrace.
- **Testes e verificação**: usei a IA para sugerir cenários de teste e escrevi/rodei testes (unit/integration) para garantir que mudanças importantes não quebrassem fluxos.

### Onde isso impactou o projeto
- **Backend**: criação e ajuste de endpoints, filtros, paginação, e implementação de cache/invalidação via Redis (version token).
- **Frontend**: telas de vendas/usuários e o dashboard administrativo, incluindo gráficos com Chart.js.

### O que eu não deleguei para a IA
- **Decisões de arquitetura e trade-offs** (ex.: estratégia de cache por versão e invalidação).
- **Revisão de segurança** (regras de autorização para Admin/Gestor) e validações.
- **Confirmação via build/test** antes de considerar uma mudança pronta.
