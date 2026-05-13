# POS-API

Node.js/Express API for Point of Sale system with support for MySQL and PostgreSQL databases.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Architecture Overview](#architecture-overview)
  - [Folder Structure](#folder-structure)
  - [Layer Communication](#layer-communication)
- [Quick Start with Docker](#quick-start-with-docker)
- [Choosing Database (MySQL vs PostgreSQL)](#choosing-database-mysql-vs-postgresql)
  - [Switching Between Databases](#switching-between-databases)
- [Repository Pattern & Database Abstraction](#repository-pattern--database-abstraction)
  - [MySQL Repository Example](#mysql-repository-example)
  - [PostgreSQL Repository Example](#postgresql-repository-example)
- [Running Scripts in the Database](#running-scripts-in-the-database)
- [Connecting to Database from External Tools](#connecting-to-database-from-external-tools)
- [API Modules Overview](#api-modules-overview)
  - [Facturación Fiscal (ARCA)](#facturación-fiscal-arca)
  - [Impresión de Tickets](#impresión-de-tickets)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Detailed Architecture Documentation](./docs/ProjectDesign.md)

---

## Architecture Overview

The API follows a **Layered Architecture** with **Repository Pattern**:

```
┌─────────────────────────────────────────────────────────────┐
│                    CONTROLLERS                              │
│         (HTTP Request/Response Handling)                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     SERVICES                                │
│              (Business Logic Layer)                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   REPOSITORIES                              │
│              (Data Access Layer)                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE                                 │
│              (MySQL / PostgreSQL)                           │
└─────────────────────────────────────────────────────────────┘
```

### Folder Structure

```
src/
├── config/                 # Configuration (database, firebase)
├── controllers/           # HTTP handlers (Products, Customers, Sales, etc.)
├── routes/               # Express route definitions
├── services/             # Business logic (with ARCA, Printer services)
├── repositories/         # Data access (MySQL & PostgreSQL implementations)
├── models/               # TypeScript types
├── adapters/             # Data transformation
├── middlewares/          # Auth, validation, error handling
└── helpers/              # Utilities
```

### Layer Communication

1. **Controller** receives HTTP request → calls Service
2. **Service** contains business logic → calls Repository
3. **Repository** executes DB queries → returns data to Service
4. **Service** transforms data → returns to Controller
5. **Controller** sends JSON response to client

---

## Prerequisites

- [Docker](https://www.docker.com/get-started) and Docker Compose
- [Node.js](https://nodejs.org/) 18+ (for local development without Docker)

---

## Quick Start with Docker

### Option 1: Run with MySQL (Default)

```bash
cd api
docker-compose -f docker-compose.mysql.yml up -d
```

This will start:
- **MySQL 8.0** on port `3306`
- **API** on port `3000`

### Option 2: Run with PostgreSQL

```bash
cd api
docker-compose -f docker-compose.postgresql.yml up -d
```

This will start:
- **PostgreSQL 16** on port `5432`
- **API** on port `3000`

### Check if services are running

```bash
docker ps
```

### View logs

```bash
# All services
docker-compose -f docker-compose.mysql.yml logs

# Only API
docker-compose -f docker-compose.mysql.yml logs api

# Only Database
docker-compose -f docker-compose.mysql.yml logs mysql
```

### Stop services

```bash
# MySQL version
docker-compose -f docker-compose.mysql.yml down

# PostgreSQL version
docker-compose -f docker-compose.postgresql.yml down

# Stop and remove volumes (reset database)
docker-compose -f docker-compose.mysql.yml down -v
```

---

## Choosing Database (MySQL vs PostgreSQL)

The API uses the `DATABASE_TYPE` environment variable to determine which database to connect to.

### MySQL (`docker-compose.mysql.yml`)
```yaml
DATABASE_TYPE: mysql
DATABASE_URL: mysql          # container name
DATABASE_PORT: 3306
DATABASE_NAME: db_businessName
DATABASE_USER: root
DATABASE_PASSWORD: 1234root
```

### PostgreSQL (`docker-compose.postgresql.yml`)
```yaml
DATABASE_TYPE: postgresql
DATABASE_URL: postgres       # container name
DATABASE_PORT: 5432
DATABASE_NAME: db_businessName
DATABASE_USER: postgres
DATABASE_PASSWORD: postgres
```

### Switching Between Databases

The API supports both MySQL and PostgreSQL through environment variables. Here's how to switch:

#### Method 1: Using Docker Compose (Recommended)

Simply run a different docker-compose file:

```bash
# For MySQL
docker-compose -f docker-compose.mysql.yml up -d

# For PostgreSQL  
docker-compose -f docker-compose.postgresql.yml up -d
```

#### Method 2: Using .env file (Local Development)

Create a `.env` file in the `api/` directory:

```env
# For MySQL
DATABASE_TYPE=mysql
DATABASE_URL=localhost
DATABASE_PORT=3306
DATABASE_NAME=db_businessName
DATABASE_USER=root
DATABASE_PASSWORD=1234root

# For PostgreSQL
DATABASE_TYPE=postgresql
DATABASE_URL=localhost
DATABASE_PORT=5432
DATABASE_NAME=db_businessName
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
```

#### Method 3: Changing at Runtime

The database connection is made in `src/config/db.ts`:

```typescript
const databaseType = (process.env.DATABASE_TYPE || 'mysql') as DatabaseType;
```

You can change `DATABASE_TYPE` to `postgresql` or `mysql` and restart the API.

---

## Repository Pattern & Database Abstraction

The project follows the Repository Pattern with database-agnostic code. Each entity has:

1. **Interface** (`I*Repository.interface.ts`) - Defines the contract
2. **MySQL Implementation** (`mysql/*Repository.ts`) - MySQL specific code
3. **PostgreSQL Implementation** (`postgresql/*Repository.ts`) - PostgreSQL specific code

### Key Differences Handled

| Aspect | MySQL | PostgreSQL |
|--------|-------|------------|
| Parameter placeholders | `?` | `$1, $2, $3` |
| Case sensitivity | `LOWER()` | `ILIKE` |
| Affected rows | `res[0].affectedRows` | `res.rowCount` |
| Results | `res[0]` | `res.rows` |
| Connection | `pool.getConnection()` | `pool.connect()` |

### MySQL Repository Example

From `src/repositories/products/mysql/ProductsRepository.ts`:

```typescript
export class ProductsRepository implements IProductsRepository {
  async createProduct(request: CreateProductRequest): Promise<string> {
    const connection = await pool.getConnection();
    
    // Check if product exists (MySQL uses LOWER())
    const checkQuery = "SELECT * FROM products WHERE LOWER(name) LIKE LOWER(?)";
    const res = await connection.query(checkQuery, [name]);
    const exists = res[0]?.length > 0;

    if (exists) {
      connection.release();
      throw createHttpError(400, `Ya existe un producto con ese nombre`);
    }

    try {
      await connection.beginTransaction();

      const productId = uuidv4();
      // MySQL uses ? placeholders
      const query = `
        INSERT INTO products (id, code, name, description, stock, isEnabled)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      await connection.query(query, [productId, productCode, name, productDescription, productStock, productEnabled]);

      await connection.commit();
      return productId;
    } catch (error) {
      await connection.rollback();
      throw createHttpError(400, `Ha ocurrido un error al intentar crear el producto`);
    } finally {
      connection.release();
    }
  }

  async getProducts(filter: GetProductsRequest): Promise<GetProduct> {
    // MySQL uses ? for LIMIT/OFFSET
    const dataQuery = `
      SELECT * FROM products
      WHERE deletedAt IS NULL
      LIMIT ? OFFSET ?
    `;
    const [countResult, dataResult] = await Promise.all([
      connection.query(countQuery),
      connection.query(dataQuery, params),
    ]);

    const total = countResult[0][0]?.total;
    const data = dataResult[0];
    
    return { data, total };
  }
}
```

### PostgreSQL Repository Example

To create a PostgreSQL repository, follow this structure:

```typescript
// src/repositories/products/postgresql/ProductsRepository.ts
import { v4 as uuidv4 } from "uuid";
import createHttpError from "http-errors";

import pool from "../../../config/db";
import { IProductsRepository } from "../IProductsRepository.interface";
import { CreateProductRequest, GetProductsRequest, UpdateProductRequest } from "../../../models";
import { GetProduct } from "../models/GetProduct";

export class ProductsRepository implements IProductsRepository {
  async createProduct(request: CreateProductRequest): Promise<string> {
    const { name, code, description, stock, isEnabled } = request;
    const connection = await pool.connect();
    
    try {
      // PostgreSQL uses ILIKE for case-insensitive comparison
      const checkQuery = "SELECT * FROM products WHERE LOWER(name) ILIKE LOWER($1)";
      const res = await connection.query(checkQuery, [name]);
      const exists = res.rows?.length > 0;

      if (exists) {
        connection.release();
        throw createHttpError(400, `Ya existe un producto con ese nombre`);
      }

      await connection.query('BEGIN');

      const productId = uuidv4();
      const productCode = code ?? productId.substring(0, 8);
      
      // PostgreSQL uses $1, $2, $3... placeholders
      const query = `
        INSERT INTO products (id, code, name, description, stock, "isEnabled", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      `;
      await connection.query(query, [productId, productCode, name, description ?? "", stock ?? 0, isEnabled ?? true]);

      await connection.query('COMMIT');
      return productId;
    } catch (error) {
      await connection.query('ROLLBACK');
      throw createHttpError(400, `Ha ocurrido un error al intentar crear el producto`);
    } finally {
      connection.release();
    }
  }

  async getProducts(filter: GetProductsRequest): Promise<GetProduct> {
    const params: any[] = [];
    let fullWhereClause = "FROM products WHERE deletedAt IS NULL";
    
    // PostgreSQL uses $1, $2 for LIMIT/OFFSET
    const countQuery = `SELECT COUNT(*) as total ${fullWhereClause}`;
    const dataQuery = `
      SELECT * ${fullWhereClause}
      LIMIT $1 OFFSET $2
    `;
    
    params.push(filter.limit, filter.offset);

    const [countResult, dataResult] = await Promise.all([
      connection.query(countQuery),
      connection.query(dataQuery, params),
    ]);

    // PostgreSQL uses .rows for results
    const total = countResult.rows[0]?.total;
    const data = dataResult.rows;
    
    return { data, total };
  }

  async updateProduct(request: UpdateProductRequest): Promise<{ id: string }> {
    const { id, name, code, description, stock, isEnabled } = request;
    const connection = await pool.connect();
    
    try {
      await connection.query('BEGIN');

      // PostgreSQL uses $1, $2... placeholders
      const query = `
        UPDATE products  
        SET code = $1, name = $2, description = $3, stock = $4, "isEnabled" = $5, "updatedAt" = NOW()
        WHERE id = $6
      `;
      
      const res = await connection.query(query, [code, name, description ?? "", stock ?? 0, isEnabled ?? true, id]);

      // PostgreSQL uses .rowCount for affected rows
      if (res.rowCount === 0) {
        throw createHttpError(404, `No se encontró el producto`);
      }

      await connection.query('COMMIT');
      return { id: request.id };
    } catch (error) {
      await connection.query('ROLLBACK');
      throw createHttpError(400, `Ha ocurrido un error al intentar actualizar el producto`);
    } finally {
      connection.release();
    }
  }

  async deleteProduct(productId: string): Promise<string> {
    const connection = await pool.connect();
    
    try {
      await connection.query('BEGIN');

      // PostgreSQL uses $1 placeholder
      const query = `
        UPDATE products  
        SET deletedAt = NOW()
        WHERE id = $1
      `;
      
      const res = await connection.query(query, [productId]);

      if (res.rowCount === 0) {
        throw createHttpError(404, `No se encontró el producto a eliminar`);
      }

      await connection.query('COMMIT');
      return productId;
    } catch (error) {
      await connection.query('ROLLBACK');
      throw createHttpError(400, `Ha ocurrido un error al intentar eliminar el producto`);
    } finally {
      connection.release();
    }
  }
}
```

### Database Helper Functions

The project provides helper functions in `src/config/database.ts`:

```typescript
import { executeQuery, executeQueryWithResult, getConnection, isPg } from './database';

// Check which database is being used
if (isPg()) {
  // PostgreSQL specific logic
} else {
  // MySQL specific logic
}

// Execute a query
const results = await executeQuery('SELECT * FROM products WHERE id = $1', [id]);

// Get a connection for transactions
const connection = await getConnection();
await connection.query('BEGIN');
// ... do stuff
await connection.query('COMMIT');
```

---

## Running Scripts in the Database

### Option 1: Scripts Run Automatically on Container Start

Both Docker Compose files are configured to automatically execute SQL scripts when the database container starts:

- **MySQL**: Scripts in `db_scripts/` are mounted to `/docker-entrypoint-initdb.d/`
- **PostgreSQL**: Scripts in `db_scripts_postgres/` are mounted to `/docker-entrypoint-initdb.d/`

This means tables are created automatically on first run.

### Option 2: Execute Scripts Manually

#### For MySQL

**Using docker exec:**

```bash
# Enter MySQL container
docker exec -it pos-mysql mysql -uroot -p1234root db_businessName

# Execute a SQL file from host
docker exec -i pos-mysql mysql -uroot -p1234root db_businessName < db_scripts/create_tables.sql
```

**Using docker exec with interactive shell:**

```bash
# Open MySQL shell
docker exec -it pos-mysql mysql -uroot -p1234root

# Select database
USE db_businessName;

# Run queries
SELECT * FROM Products;
```

#### For PostgreSQL

**Using docker exec:**

```bash
# Enter PostgreSQL container
docker exec -it pos-postgres psql -U postgres -d db_businessName

# Execute a SQL file from host
docker exec -i pos-postgres psql -U postgres -d db_businessName < db_scripts_postgres/init.sql
```

**Using docker exec with interactive shell:**

```bash
# Open PostgreSQL shell
docker exec -it pos-postgres psql -U postgres -d db_businessName

# Run queries
SELECT * FROM "Products";
```

### Option 3: Connect with Database Client

See [Connecting to Database from External Tools](#connecting-to-database-from-external-tools) below.

---

## Setting Up the Database in Docker

### Quick Start: Create Database and Populate Test Data

After starting the MySQL container, follow these steps to create the database and populate it with test data:

#### Step 1: Start the MySQL Container

```bash
cd api
docker-compose -f docker-compose.mysql.yml up -d mysql
```

Wait a few seconds for MySQL to fully initialize.

#### Step 2: Create the Database and Tables

```bash
docker exec -i pos-mysql mysql -uroot -p1234root < db_scripts/create_tables.sql
```

This will:
- Create the database `db_businessName`
- Create the following tables:
  - `Products` - Product inventory
  - `Customers` - Customer information
  - `Sales` - Sales transactions
  - `SaleDetails` - Individual items in each sale

#### Step 3: Populate with Test Data (Optional)

```bash
docker exec -i pos-mysql mysql -uroot -p1234root db_businessName < db_scripts/populate_test_tables.sql
```

This will:
- Insert 20 sample products
- Insert 10 sample customers with Argentine fiscal data
- Generate 50 sample sales via stored procedure
- Insert corresponding sale details

#### Step 4: Verify the Data

```bash
# Enter MySQL container
docker exec -it pos-mysql mysql -uroot -p1234root db_businessName

# Run verification query
SELECT 'Products' AS TableName, COUNT(*) AS RecordCount FROM Products WHERE deletedAt IS NULL
UNION ALL
SELECT 'Customers', COUNT(*) FROM Customers WHERE deletedAt IS NULL
UNION ALL
SELECT 'Sales', COUNT(*) FROM Sales
UNION ALL
SELECT 'SaleDetails', COUNT(*) FROM SaleDetails;
```

Expected output:
```
+--------------+-------------+
| TableName    | RecordCount |
+--------------+-------------+
| Products     |          20 |
| Customers    |          10 |
| Sales        |          50 |
| SaleDetails  |         150 |
+--------------+-------------+
```

### All-in-One Command

If you want to create tables and populate test data in one step:

```bash
docker-compose -f docker-compose.mysql.yml up -d mysql && \
sleep 5 && \
docker exec -i pos-mysql mysql -uroot -p1234root < db_scripts/create_tables.sql && \
docker exec -i pos-mysql mysql -uroot -p1234root db_businessName < db_scripts/populate_test_tables.sql
```

### Troubleshooting

#### Error: "Can't connect to MySQL server"

- Make sure the container is running: `docker ps`
- Wait longer for MySQL to initialize (try `sleep 10`)

#### Error: "Unknown database"

- Make sure you've run `create_tables.sql` first

#### Error: "Table doesn't exist"

- The tables are created automatically on first container start via `docker-entrypoint-initdb.d/`
- If not, run `create_tables.sql` manually

### Reset the Database

To completely reset the database and start fresh:

```bash
# Stop and remove containers and volumes
docker-compose -f docker-compose.mysql.yml down -v

# Start fresh
docker-compose -f docker-compose.mysql.yml up -d

# Recreate tables and test data
docker exec -i pos-mysql mysql -uroot -p1234root < db_scripts/create_tables.sql
docker exec -i pos-mysql mysql -uroot -p1234root db_businessName < db_scripts/populate_test_tables.sql
```

---

## Database Scripts Available

### MySQL Scripts (`db_scripts/`)

| File | Description |
|------|-------------|
| `create_tables.sql` | Creates Products, Customers, Sales, SaleDetails tables |
| `populate_test_tables.sql` | Populates with test data (500 sales, 10 customers, 20 products) |

### PostgreSQL Scripts (`db_scripts_postgres/`)

| File | Description |
|------|-------------|
| `init.sql` | Creates Products, Customers, Sales, SaleDetails tables with indexes |

### Example: Populate MySQL with Test Data

```bash
# Run the populate script
docker exec -i pos-mysql mysql -uroot -p1234root db_businessName < db_scripts/populate_test_tables.sql
```

---

## Connecting to Database from External Tools

### MySQL

| Property | Value |
|----------|-------|
| Host | localhost |
| Port | 3306 |
| User | root |
| Password | 1234root |
| Database | db_businessName |

**Connection String:**
```
mysql://root:1234root@localhost:3306/db_businessName
```

### PostgreSQL

| Property | Value |
|----------|-------|
| Host | localhost |
| Port | 5432 |
| User | postgres |
| Password | postgres |
| Database | db_businessName |

**Connection String:**
```
postgresql://postgres:postgres@localhost:5432/db_businessName
```

### Recommended GUI Tools

- **MySQL**: [MySQL Workbench](https://www.mysql.com/products/workbench/), [DBeaver](https://dbeaver.io/), [TablePlus](https://tableplus.com/)
- **PostgreSQL**: [pgAdmin](https://www.pgadmin.org/), [DBeaver](https://dbeaver.io/), [TablePlus](https://tableplus.com/)

---

## API Modules Overview

The API is organized into several functional modules:

### Authentication (`/api/Auth`)
- User login/logout
- JWT token management

### Products (`/api/Products`)
- CRUD operations for products
- Stock management
- Product listing with filters

### Customers (`/api/Customers`)
- Customer management
- Fiscal information (CUIT, IVA category)

### Sales (`/api/Sales`)
- Sale creation and management
- Cart handling
- Sale history

### Facturación Fiscal (ARCA)

The ARCA (formerly AFIP) module handles electronic invoicing for Argentina:

**Routes:**
- `POST /api/Arca` - Create a new electronic invoice
- `POST /api/Arca/:id` - Send bill for an existing sale

**Key Files:**
- `src/services/arca/Arca.service.ts` - Main billing service
- `src/controllers/ArcaController.ts` - HTTP controller
- `src/routes/arca/ArcaRoutes.ts` - Route definitions

**Features:**
- Automatic CAE (Código de Autorización Electrónico) generation
- QR code generation for consumer invoices
- Support for different invoice types:
  - **Factura A** - For IVA Responsible (type 1)
  - **Factura B** - For Consumers/Final (type 6)
  - **Tique** - Simplified invoice

**IVA Categories Supported:**
| Category | ARCA Code | Invoice Type |
|----------|-----------|--------------|
| Responsable Inscripto | 1 | Factura A |
| Monotributista | 6 | Factura A |
| Exento | 4 | Factura B |
| Consumidor Final | 5 | Factura B |

**Configuration Required:**
```env
CUIT=27375614060
PtoVta=1
```

**Certificate Files Required:**
- `BusinessName.csr` - Certificate file
- `BusinessName.key` - Private key file

**Example Usage:**
```typescript
// Create a new bill
const result = await arcaService.postBill({
  cartItems: [
    { product: { price: 100, iva: 21 }, qty: 2 }
  ],
  customer: {
    ivaCategory: "Consumidor Final"
  }
});

// Result includes:
// - afip.CAE: Authorization code
// - afip.CAEFchVto: Expiration date
// - ptoVenta: Point of sale number
// - nroCbte: Invoice number
// - qrData: QR code URL
```

### Impresión de Tickets

The printing module handles thermal printer ticket generation:

**Routes:**
- `POST /api/Printer/:id` - Print ticket for a sale

**Key Files:**
- `src/services/printer/Printer.service.ts` - Main printing service
- `src/controllers/PrinterController.ts` - HTTP controller
- `src/routes/print/PrintRoutes.ts` - Route definitions

**Supported Printers:**
- **POS58** - 58mm thermal printer
- **USB001** - USB connected printers

**Configuration:**
The printer is configured in `docker-compose.yml`:
```yaml
volumes:
  - ./USB001:/app/USB001
  - ./POS58:/app/POS58
```

**Features:**
- Automatic ticket formatting
- QR code inclusion for fiscal invoices
- Different layouts based on customer IVA category
- Header with business information
- Itemized product listing
- Subtotal, IVA, and total calculation

**Example Ticket Layout:**
```
 ------------------------------ 
        Don Mario - Cnel. Vidal
        Ibáñez Narela Yazmín
        CUIT nro 27-37561406-0
        Ingresos brutos 27-37561406-0
        Sarmiento 106 Cnel. Vidal
        Inicio de Act.: 01/05/2023
        IVA Responsable inscripto
 --------------------------------

A CONSUMIDOR FINAL
P.V. Nro: 001
Nro. T. 0
Fecha: 06/03/2026 Hora: 10:30:00
 ------------------------------ 

Cant Descripción          IVA    Total
 ------------------------------ 
1    Producto A           21%   121.00
2    Producto B           21%   242.00

SUBTOTAL:                      363.00
TOTAL IVA:                      63.00
TOTAL:                         363.00

[QR CODE]
```

---

## Environment Variables

| Variable | Description | MySQL Default | PostgreSQL Default |
|----------|-------------|---------------|-------------------|
| `DATABASE_TYPE` | Database type | `mysql` | `postgresql` |
| `DATABASE_URL` | Database host | `mysql` | `postgres` |
| `DATABASE_PORT` | Database port | `3306` | `5432` |
| `DATABASE_NAME` | Database name | `db_businessName` | `db_businessName` |
| `DATABASE_USER` | Database user | `root` | `postgres` |
| `DATABASE_PASSWORD` | Database password | `1234root` | `postgres` |
| `JWT_SECRET` | JWT signing key | `business-name-jwt-key` | `business-name-jwt-key` |
| `JWT_ACCESS_EXPIRATION` | Access token expiry | `1h` | `1h` |
| `JWT_REFRESH_SECRET` | Refresh token secret | `business-name-refresh-jwt-key` | `business-name-refresh-jwt-key` |
| `JWT_REFRESH_EXPIRATION` | Refresh token expiry | `1d` | `1d` |
| `CUIT` | AFIP/ARCA CUIT | `27375614060` | `27375614060` |
| `PtoVta` | AFIP/ARCA Point of Sale | `1` | `1` |
| `NODE_ENV` | Node environment | `development` | `development` |
| `PORT` | API port | `3000` | `3000` |

---

## Project Structure

```
api/
├── db_scripts/                    # MySQL initialization scripts
│   ├── create_tables.sql          # Table creation
│   └── populate_test_tables.sql   # Test data
├── db_scripts_postgres/           # PostgreSQL initialization scripts
│   └── init.sql                  # Table creation with indexes
├── src/
│   ├── config/
│   │   ├── database.ts           # Database query utilities
│   │   └── db.ts                # Database connection pool
│   ├── controllers/              # HTTP controllers
│   │   ├── ArcaController.ts    # Facturación fiscal
│   │   ├── PrinterController.ts # Ticket printing
│   │   └── ...
│   ├── routes/                   # Route definitions
│   │   ├── arca/
│   │   ├── print/
│   │   └── ...
│   ├── services/                # Business logic
│   │   ├── arca/
│   │   │   └── Arca.service.ts  # ARCA/AFIP integration
│   │   ├── printer/
│   │   │   └── Printer.service.ts # Thermal printer
│   │   └── ...
│   ├── repositories/            # Data access layer
│   │   ├── products/
│   │   │   ├── IProductsRepository.interface.ts
│   │   │   └── mysql/
│   │   │       └── ProductsRepository.ts
│   │   └── ...
│   ├── models/                  # TypeScript types
│   ├── adapters/               # Data transformation
│   ├── middlewares/            # Express middlewares
│   └── helpers/                # Utility functions
├── docker-compose.mysql.yml     # MySQL + API compose file
├── docker-compose.postgresql.yml # PostgreSQL + API compose file
├── Dockerfile                  # API container definition
└── package.json                # Node.js dependencies
```

---

## Common Tasks

### Reset Database

```bash
# MySQL - remove volume and restart
docker-compose -f docker-compose.mysql.yml down -v
docker-compose -f docker-compose.mysql.yml up -d

# PostgreSQL - remove volume and restart
docker-compose -f docker-compose.postgresql.yml down -v
docker-compose -f docker-compose.postgresql.yml up -d
```

### View Database Logs

```bash
# MySQL logs
docker logs pos-mysql

# PostgreSQL logs
docker logs pos-postgres
```

### Rebuild API Container

```bash
docker-compose -f docker-compose.mysql.yml build --no-cache api
```

---

## Local Development (Without Docker)

If you want to run the API locally without Docker:

```bash
cd api

# Install dependencies
npm install

# Create .env file
cp .env.example .env  # or create manually

# Run TypeScript compiler
npm run build

# Start server
npm run dev
```

Make sure you have a local MySQL or PostgreSQL instance running and update the `.env` file with the correct connection details.
