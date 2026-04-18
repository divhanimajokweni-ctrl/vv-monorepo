import http from "node:http";
import { Server } from "socket.io";
import { logger } from "@ubuntu/observability";

const server = http.createServer();

const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true
  }
});

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("missing_token"));
    }

    // Replace with shared auth verification.
    socket.data.memberId = "verified-member";
    socket.data.tenantId = "verified-tenant";
    return next();
  } catch {
    return next(new Error("auth_failed"));
  }
});

io.on("connection", (socket) => {
  logger.info("realtime_connected", {
    memberId: socket.data.memberId,
    tenantId: socket.data.tenantId
  });

  socket.on("subscribe:village", (villageId: string) => {
    socket.join(`village:${villageId}`);
  });

  socket.on("disconnect", () => {
    logger.info("realtime_disconnected", {
      memberId: socket.data.memberId
    });
  });
});

server.listen(4001, () => {
  logger.info("realtime_listening", { port: 4001 });
});
