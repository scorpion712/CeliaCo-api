import express from "express";
import dotenv from "dotenv";

dotenv.config();

import { errorHandler, notFoundHandler } from "./middlewares";
import { authMiddleware } from "./auth";
import {
  helmetMiddleware,
  corsMiddleware,
  generalRateLimiter,
  authRateLimiter,
  requestLoggerMiddleware,
} from "./middlewares/securityMiddleware";
import { sanitizeBody } from "./middlewares/sanitizeMiddleware";
import AuthRoutes from "./routes/auth/AuthRoutes";
import FirebaseRoutes from "./routes/auth/FirebaseRoutes";
import SalesRoutes from "./routes/sales/SalesRoutes";
import ProductRoutes from "./routes/products/ProductRoutes";
import CustomersRoutes from "./routes/customers/CustomersRoutes";
import ArcaRoutes from "./routes/arca/ArcaRoutes";
// import PrinterRoutes from "./routes/print/PrintRoutes";
import DashboardRoutes from "./routes/dashboard/DashboardRoutes";
import CuentasRoutes from "./routes/cuentas/CuentasRoutes";
import CashBoxRoutes from "./routes/caja/CashBoxRoutes";
import CashRoutes from "./routes/caja/CashRoutes";

const app = express();

// ─── Security Middleware ───────────────────────────────────────────
// Apply in order: helmet → cors → rate limit → body parser → logger
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(generalRateLimiter);
app.use(express.json());
app.use(sanitizeBody); // Phase 2: XSS sanitization
app.use(requestLoggerMiddleware);

// ─── Health Check ────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Public Routes (no auth, rate-limited auth) ─────────────
app.use("/api/auth", authRateLimiter, AuthRoutes);
app.use("/api/auth", FirebaseRoutes);

// ─── Protected Routes (auth required) ────────────────────────────
app.use("/api/sales", SalesRoutes);
app.use("/api/products", ProductRoutes);
app.use("/api/customers", CustomersRoutes);
app.use("/api/arca", authMiddleware() as any, ArcaRoutes);
// app.use("/api/printer", authMiddleware() as any, PrinterRoutes);
app.use("/api/dashboard", DashboardRoutes);
app.use("/api/cuentas", CuentasRoutes);
app.use("/api/caja", CashBoxRoutes);
app.use("/api/cash", CashRoutes);

// ─── Error Handling (must be last) ───────────────────────────────
app.use(errorHandler);
app.use(notFoundHandler);

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

console.log(`Starting server on ${HOST}:${PORT}...`);

try {
  app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
  });
} catch (err) {
  console.error('Failed to start server:', err);
  process.exit(1);
}