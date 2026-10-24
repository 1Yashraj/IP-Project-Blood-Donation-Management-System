import server.SimpleHttpServer;
import service.BloodBankService;

/**
 * Application entry point.
 * Run this class to start the Blood Bank Management System backend.
 *
 * Compile:
 *   javac -d out src/model/*.java src/service/*.java src/server/*.java src/Main.java
 *
 * Run:
 *   java -cp out Main
 */
public class Main {
    public static void main(String[] args) throws Exception {
        BloodBankService service = new BloodBankService();
        SimpleHttpServer.start(service);
        // Keep the process alive
        Thread.currentThread().join();
    }
}
