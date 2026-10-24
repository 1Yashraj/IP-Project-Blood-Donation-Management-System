package server;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import service.BloodBankService;

import java.io.*;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * Routes all /api/* HTTP requests to the appropriate BloodBankService method.
 * Member 3 – Integration & QA Lead
 */
public class ApiHandler implements HttpHandler {

    private final BloodBankService service;

    public ApiHandler(BloodBankService service) {
        this.service = service;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        // CORS headers so the frontend (opened as a file) can reach the API
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");
        exchange.getResponseHeaders().add("Content-Type", "application/json");

        String method = exchange.getRequestMethod();
        String path   = exchange.getRequestURI().getPath();

        // Pre-flight OPTIONS request (browser CORS check)
        if ("OPTIONS".equalsIgnoreCase(method)) {
            sendResponse(exchange, 200, "{}");
            return;
        }

        try {
            route(exchange, method, path);
        } catch (Exception e) {
            sendResponse(exchange, 500,
                "{\"error\":\"Internal server error: " + e.getMessage() + "\"}");
        }
    }

    private void route(HttpExchange ex, String method, String path) throws IOException {
        // GET /api/stock
        if ("GET".equals(method) && path.equals("/api/stock")) {
            sendResponse(ex, 200, service.getStockJson());
            return;
        }

        // GET /api/donors  or  GET /api/donors/search?bloodGroup=A+
        if ("GET".equals(method) && path.equals("/api/donors")) {
            String query = ex.getRequestURI().getQuery();
            if (query != null && query.startsWith("bloodGroup=")) {
                String bg = URLDecoder.decode(query.substring("bloodGroup=".length()),
                                              StandardCharsets.UTF_8);
                sendResponse(ex, 200, service.searchDonorsByBloodGroupJson(bg));
            } else {
                sendResponse(ex, 200, service.getAllDonorsJson());
            }
            return;
        }

        // GET /api/requests
        if ("GET".equals(method) && path.equals("/api/requests")) {
            sendResponse(ex, 200, service.getAllRequestsJson());
            return;
        }

        // GET /api/analytics
        if ("GET".equals(method) && path.equals("/api/analytics")) {
            sendResponse(ex, 200, service.getAnalyticsJson());
            return;
        }

        // GET /api/donations  or  GET /api/donations?donorId=1
        if ("GET".equals(method) && path.equals("/api/donations")) {
            String query = ex.getRequestURI().getQuery();
            if (query != null && query.startsWith("donorId=")) {
                int donorId = Integer.parseInt(query.substring("donorId=".length()));
                sendResponse(ex, 200, service.getDonationHistoryByDonorJson(donorId));
            } else {
                sendResponse(ex, 200, service.getAllDonationHistoryJson());
            }
            return;
        }

        // GET /api/camps
        if ("GET".equals(method) && path.equals("/api/camps")) {
            sendResponse(ex, 200, service.getAllCampsJson());
            return;
        }

        // GET /api/eligibility?donorId=1
        if ("GET".equals(method) && path.equals("/api/eligibility")) {
            String query = ex.getRequestURI().getQuery();
            if (query != null && query.startsWith("donorId=")) {
                int donorId = Integer.parseInt(query.substring("donorId=".length()));
                sendResponse(ex, 200, service.checkDonorEligibilityJson(donorId));
            } else {
                sendResponse(ex, 400, "{\"error\":\"Missing required query parameter: donorId\"}");
            }
            return;
        }

        // POST /api/donors  — register donor
        if ("POST".equals(method) && path.equals("/api/donors")) {
            Map<String, String> body = parseBody(ex);
            var donor = service.registerDonor(
                body.get("name"),
                Integer.parseInt(body.getOrDefault("age", "0")),
                body.get("bloodGroup"),
                body.get("phone"),
                body.get("lastDonationDate")
            );
            sendResponse(ex, 201, "{\"success\":true,\"donor\":" + donor.toJson() + "}");
            return;
        }

        // POST /api/donate  — record a donation (with eligibility check)
        if ("POST".equals(method) && path.equals("/api/donate")) {
            Map<String, String> body = parseBody(ex);
            int donorId = Integer.parseInt(body.getOrDefault("donorId", "0"));
            int units   = Integer.parseInt(body.getOrDefault("units", "1"));
            sendResponse(ex, 200, service.processDonation(donorId, units));
            return;
        }

        // POST /api/request  — submit a blood request
        if ("POST".equals(method) && path.equals("/api/request")) {
            Map<String, String> body = parseBody(ex);
            String result = service.processRequest(
                body.get("recipientName"),
                body.get("bloodGroup"),
                Integer.parseInt(body.getOrDefault("units", "1")),
                body.getOrDefault("reason", "")
            );
            sendResponse(ex, 200, result);
            return;
        }

        // POST /api/camps  — register a new camp
        if ("POST".equals(method) && path.equals("/api/camps")) {
            Map<String, String> body = parseBody(ex);
            String result = service.registerCamp(
                body.get("name"),
                body.get("venue"),
                body.get("date"),
                body.get("organizer")
            );
            sendResponse(ex, 201, result);
            return;
        }

        // 404 catch-all
        sendResponse(ex, 404, "{\"error\":\"Endpoint not found: " + path + "\"}");
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    /** Read request body and parse simple key=value pairs (application/x-www-form-urlencoded). */
    private Map<String, String> parseBody(HttpExchange ex) throws IOException {
        InputStream is  = ex.getRequestBody();
        String raw      = new String(is.readAllBytes(), StandardCharsets.UTF_8);
        Map<String, String> map = new HashMap<>();
        if (raw == null || raw.isEmpty()) return map;

        // Support both form-encoded and crude JSON key extraction
        if (raw.trim().startsWith("{")) {
            // Minimal JSON parser: extract "key":"value" and "key":number pairs
            raw = raw.replaceAll("[{}]", "");
            for (String pair : raw.split(",")) {
                pair = pair.trim();
                String[] kv = pair.split(":", 2);
                if (kv.length == 2) {
                    String key = kv[0].trim().replaceAll("\"", "");
                    String val = kv[1].trim().replaceAll("\"", "");
                    if (!val.equals("null")) map.put(key, val);
                }
            }
        } else {
            for (String pair : raw.split("&")) {
                String[] kv = pair.split("=", 2);
                if (kv.length == 2) {
                    map.put(
                        URLDecoder.decode(kv[0], StandardCharsets.UTF_8),
                        URLDecoder.decode(kv[1], StandardCharsets.UTF_8)
                    );
                }
            }
        }
        return map;
    }

    private void sendResponse(HttpExchange ex, int code, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        ex.sendResponseHeaders(code, bytes.length);
        try (OutputStream os = ex.getResponseBody()) {
            os.write(bytes);
        }
    }
}
