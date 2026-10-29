import dotenv from "dotenv";

import fileRoutes from "./routes/file.routes";

import permissionRoutes from "./routes/permission.routes";

dotenv.config();

const startServer = async (): Promise<void> => {
  const { default: express } = await import("express");
  const { default: cors } = await import("cors");
  const { default: helmet } = await import("helmet");
  const { default: cookieParser } = await import("cookie-parser");
  const { connectDatabase } = await import("./config/database");
  const { errorHandler } = await import("./middleware/errorHandler");
  const { default: authRoutes } = await import("./routes/auth.routes");
  const { default: userRoutes } = await import("./routes/user.routes");
  const { default: vaultRoutes } = await import("./routes/vault.routes");

  const app = express();

  app.use(helmet());

  app.use(
    cors({
      origin: "http://localhost:5173",
      credentials: true,
    })
  );

  app.use(cookieParser());

  app.use(express.json({ limit: "1mb" }));

  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/vaults", vaultRoutes);
  app.use("/api/files", fileRoutes);
  app.use(
    "/api/permissions",
    permissionRoutes
  );

  app.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      service: "blockchain-passwordless-digital-vault-api",
    });
  });

  const PORT = process.env.PORT || 5000;

  app.use(errorHandler);

  try {
    await connectDatabase();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
};

startServer();