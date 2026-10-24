package server;

import com.sun.net.httpserver.HttpServer;
import service.BloodBankService;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.util.concurrent.Executors;

/**
 * Starts the built-in Java HTTP server on port 8080.
 * Member 3 – Integration & QA Lead
 */
public class SimpleHttpServer {

    private static final int PORT = 8080;

    public static void start(BloodBankService service) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);
        server.createContext("/api", new ApiHandler(service));
        server.setExecutor(Executors.newFixedThreadPool(4));
        server.start();
        System.out.println("╔══════════════════════════════════════════════╗");
        System.out.println("║  Blood Bank Management System — Server UP    ║");
        System.out.println("║  API  →  http://localhost:" + PORT + "/api/stock     ║");
        System.out.println("║  Open frontend/index.html in your browser    ║");
        System.out.println("╚══════════════════════════════════════════════╝");
    }
}
