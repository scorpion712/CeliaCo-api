-- Create Tables for PostgreSQL
-- This script is automatically executed when the PostgreSQL container starts

-- Products Table (extended for CeliaPOS)
CREATE TABLE IF NOT EXISTS Products (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    costPrice DECIMAL(12, 2) DEFAULT 0,
    salePrice DECIMAL(12, 2) DEFAULT 0,
    stock INT DEFAULT 0,
    category VARCHAR(100) DEFAULT '',
    isEnabled BOOLEAN DEFAULT TRUE,
    allowSaleWithoutStock BOOLEAN DEFAULT FALSE,
    stockMandatory BOOLEAN DEFAULT FALSE,
    createdAt TIMESTAMP DEFAULT NOW(),
    updatedAt TIMESTAMP DEFAULT NOW(),
    deletedAt TIMESTAMP
);

-- Customers Table
CREATE TABLE IF NOT EXISTS Customers (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    fiscalId VARCHAR(15) NOT NULL,
    idNumber VARCHAR(15) NOT NULL,
    ivaCategory VARCHAR(25) DEFAULT NULL,
    createdAt TIMESTAMP DEFAULT NOW(),
    deletedAt TIMESTAMP
);

-- Sales Table
CREATE TABLE IF NOT EXISTS Sales (
    id VARCHAR(36) PRIMARY KEY,
    createdAt TIMESTAMP NOT NULL,
    updatedAt TIMESTAMP NOT NULL,
    deletedAt TIMESTAMP DEFAULT NULL,
    total FLOAT NOT NULL,
    type INT NOT NULL,
    iva FLOAT NOT NULL, 
    customerId VARCHAR(36) DEFAULT NULL,
    cae VARCHAR(50) DEFAULT NULL,
    qrData VARCHAR(255) DEFAULT NULL,
    FOREIGN KEY (customerId) REFERENCES Customers(id)
);

-- SaleDetails Table
CREATE TABLE IF NOT EXISTS SaleDetails (
    id VARCHAR(36) PRIMARY KEY,
    saleId VARCHAR(36) NOT NULL,
    product VARCHAR(36) NOT NULL,
    amount INT NOT NULL,
    total FLOAT NOT NULL,
    iva FLOAT NOT NULL,
    category VARCHAR(36) DEFAULT NULL,
    FOREIGN KEY (saleId) REFERENCES Sales(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_code ON Products(code);
CREATE INDEX IF NOT EXISTS idx_products_name ON Products(name);
CREATE INDEX IF NOT EXISTS idx_products_category ON Products(category);
CREATE INDEX IF NOT EXISTS idx_products_deletedAt ON Products(deletedAt);
CREATE INDEX IF NOT EXISTS idx_customers_name ON Customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_deletedAt ON Customers(deletedAt);
CREATE INDEX IF NOT EXISTS idx_sales_customerId ON Sales(customerId);
CREATE INDEX IF NOT EXISTS idx_sales_createdAt ON Sales(createdAt);
CREATE INDEX IF NOT EXISTS idx_saledetails_saleId ON SaleDetails(saleId);

-- ═══════════════════════════════════════════════════════════════════
-- CUENTAS CORRIENTES TABLES
-- ═══════════════════════════════════════════════════════════════════

-- Cuentas Corrientes (Customer Account)
CREATE TABLE IF NOT EXISTS cuentas_corrientes (
    id VARCHAR(36) PRIMARY KEY,
    "clienteId" VARCHAR(36) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVA',
    total_comprado DECIMAL(12, 2) NOT NULL DEFAULT 0,
    total_entregado DECIMAL(12, 2) NOT NULL DEFAULT 0,
    saldo_actual DECIMAL(12, 2) NOT NULL DEFAULT 0,
    "limiteCredito" DECIMAL(12, 2),
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "deletedAt" TIMESTAMP
);

-- Ventas a Cuenta (Credit Sales)
CREATE TABLE IF NOT EXISTS ventas_cuenta (
    id VARCHAR(36) PRIMARY KEY,
    "cuentaId" VARCHAR(36) NOT NULL,
    "ventaId" VARCHAR(36),
    monto_total DECIMAL(12, 2) NOT NULL,
    monto_entregado DECIMAL(12, 2) NOT NULL DEFAULT 0,
    monto_pendiente DECIMAL(12, 2) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    "fechaVenta" TIMESTAMP NOT NULL DEFAULT NOW(),
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Entregas (Payments)
CREATE TABLE IF NOT EXISTS entregas_cuenta (
    id VARCHAR(36) PRIMARY KEY,
    "cuentaId" VARCHAR(36) NOT NULL,
    monto DECIMAL(12, 2) NOT NULL,
    "metodoPago" VARCHAR(50) NOT NULL,
    descripcion TEXT,
    "detalleAplicacion" JSONB,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Movimientos (Account Movements)
CREATE TABLE IF NOT EXISTS movimientos_cuenta (
    id VARCHAR(36) PRIMARY KEY,
    "cuentaId" VARCHAR(36) NOT NULL,
    tipo VARCHAR(30) NOT NULL,
    monto DECIMAL(12, 2) NOT NULL,
    "saldoAnterior" DECIMAL(12, 2) NOT NULL,
    "saldoNuevo" DECIMAL(12, 2) NOT NULL,
    descripcion TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════
-- INDEXES FOR CUENTAS CORRIENTES
-- ═══════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_cuentas_cliente ON cuentas_corrientes("clienteId");
CREATE INDEX IF NOT EXISTS idx_cuentas_estado ON cuentas_corrientes(estado);
CREATE INDEX IF NOT EXISTS idx_ventas_cuenta ON ventas_cuenta("cuentaId");
CREATE INDEX IF NOT EXISTS idx_ventas_cuenta_estado ON ventas_cuenta(estado);
CREATE INDEX IF NOT EXISTS idx_entregas_cuenta ON entregas_cuenta("cuentaId");
CREATE INDEX IF NOT EXISTS idx_movimientos_cuenta ON movimientos_cuenta("cuentaId");
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON movimientos_cuenta("createdAt");
