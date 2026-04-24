# Developer Evaluation Project

`READ CAREFULLY`

## Use Case
**You are a developer on the DeveloperStore team. Now we need to implement the API prototypes.**

As we work with `DDD`, to reference entities from other domains, we use the `External Identities` pattern with denormalization of entity descriptions.

Therefore, you will write an API (complete CRUD) that handles sales records. The API needs to be able to inform:

* Sale number
* Date when the sale was made
* Customer
* Total sale amount
* Branch where the sale was made
* Products
* Quantities
* Unit prices
* Discounts
* Total amount for each item
* Cancelled/Not Cancelled

It's not mandatory, but it would be a differential to build code for publishing events of:
* SaleCreated
* SaleModified
* SaleCancelled
* ItemCancelled

If you write the code, **it's not required** to actually publish to any Message Broker. You can log a message in the application log or however you find most convenient.

## MongoDB + PostgreSQL (examples of combined usage)

The `docker-compose` includes **PostgreSQL** (transactional) and **MongoDB** (document). A common and pragmatic approach is:

- **PostgreSQL as the source-of-truth**: keep `Sales` and `Users` in Postgres to preserve transactions and constraints.
- **MongoDB for read/audit models**: store denormalized documents optimized for querying and evolution.

Concrete examples for this challenge domain:

- **Immutable audit timeline (event log)**: write documents like `SaleCreated/SaleModified/SaleCancelled/ItemCancelled` to Mongo with payload + metadata (`saleId`, `occurredAt`, `correlationId`). This enables fast “timeline by saleId” queries without impacting relational tables.
- **Denormalized read model for list/search**: maintain a `SaleReadModel` document containing header + items + totals + customer/branch descriptions. Great for richer filters/sorting on `GET /api/Sales` without complex SQL joins.
- **Reporting projections**: store pre-aggregations in Mongo (e.g., sales by day/branch/customer), updated when a sale changes/cancels.
- **Outbox pattern (optional)**: keep an outbox table in Postgres within the same transaction of the write, then asynchronously materialize documents into Mongo (eventual consistency).

These are examples of *how you could use* MongoDB together with Postgres; they’re not mandatory for the API CRUD to work.

## Run with Docker (recommended)

Prerequisites:

- Docker Desktop running

From the repo root:

```bash
cd template/backend
docker compose up -d --build
```

To stop:

```bash
cd template/backend
docker compose down
```

### Access the API

The Web API container exposes **8080 (HTTP)** and **8081 (HTTPS)** internally. In this `docker-compose.yml`, the host ports are **auto-assigned**, so discover them with:

```bash
cd template/backend
docker compose ps
```

Then access:

- **Swagger UI**: `http://localhost:<WEBAPI_HTTP_PORT>/swagger`
- **OpenAPI JSON**: `http://localhost:<WEBAPI_HTTP_PORT>/swagger/v1/swagger.json`

### Access the Frontend

The Angular frontend is served by Nginx at:

- **Frontend**: `http://localhost:4200`

The frontend container proxies `http://localhost:4200/api/...` to the backend service inside Docker, so **no CORS setup is required** when running everything via compose.

### Business Rules

* Purchases above 4 identical items have a 10% discount
* Purchases between 10 and 20 identical items have a 20% discount
* It's not possible to sell above 20 identical items
* Purchases below 4 items cannot have a discount

These business rules define quantity-based discounting tiers and limitations:

1. Discount Tiers:
   - 4+ items: 10% discount
   - 10-20 items: 20% discount

2. Restrictions:
   - Maximum limit: 20 items per product
   - No discounts allowed for quantities below 4 items

## Overview
This section provides a high-level overview of the project and the various skills and competencies it aims to assess for developer candidates. 

See [Overview](/.doc/overview.md)

## Tech Stack
This section lists the key technologies used in the project, including the backend, testing, frontend, and database components. 

See [Tech Stack](/.doc/tech-stack.md)

## Frameworks
This section outlines the frameworks and libraries that are leveraged in the project to enhance development productivity and maintainability. 

See [Frameworks](/.doc/frameworks.md)



<!-- 
## API Structure
This section includes links to the detailed documentation for the different API resources:
- [API General](./docs/general-api.md)
- [Products API](/.doc/products-api.md)
- [Carts API](/.doc/carts-api.md)
- [Users API](/.doc/users-api.md)
- [Auth API](/.doc/auth-api.md)
-->

## Project Structure
This section describes the overall structure and organization of the project files and directories. 

See [Project Structure](/.doc/project-structure.md)
