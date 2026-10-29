import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;

import java.awt.Desktop;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URI;

/**
 * GameLauncher - Optional Java Runner for Emoji Memory Master.
 * Starts an embedded HTTP server and opens default web browser automatically.
 */
public class GameLauncher {
    private static final int PORT = 8080;

    public static void main(String[] args) {
        try {
            HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);
            server.createContext("/", new StaticFileHandler());
            server.setExecutor(null); // Default executor
            server.start();

            String gameUrl = "http://localhost:" + PORT + "/index.html";
            System.out.println("=================================================");
            System.out.println("🎮 Emoji Memory Master Java Server Running!");
            System.out.println("👉 Access Game URL: " + gameUrl);
            System.out.println("=================================================");

            // Open default system browser automatically
            if (Desktop.isDesktopSupported() && Desktop.getDesktop().isSupported(Desktop.Action.BROWSE)) {
                Desktop.getDesktop().browse(new URI(gameUrl));
            }
        } catch (Exception e) {
            System.err.println("Failed to launch Java server: " + e.getMessage());
            e.printStackTrace();
        }
    }

    static class StaticFileHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String path = exchange.getRequestURI().getPath();
            if (path.equals("/")) {
                path = "/index.html";
            }

            File file = new File("." + path).getCanonicalFile();
            if (!file.exists() || file.isDirectory()) {
                String response = "404 - File Not Found";
                exchange.sendResponseHeaders(404, response.length());
                OutputStream os = exchange.getResponseBody();
                os.write(response.getBytes());
                os.close();
                return;
            }

            // Determine content type
            String contentType = "text/plain";
            if (path.endsWith(".html")) contentType = "text/html";
            else if (path.endsWith(".css")) contentType = "text/css";
            else if (path.endsWith(".js")) contentType = "application/javascript";
            else if (path.endsWith(".png")) contentType = "image/png";
            else if (path.endsWith(".jpg") || path.endsWith(".jpeg")) contentType = "image/jpeg";

            exchange.getResponseHeaders().set("Content-Type", contentType);
            exchange.sendResponseHeaders(200, file.length());

            OutputStream os = exchange.getResponseBody();
            FileInputStream fs = new FileInputStream(file);
            byte[] buffer = new byte[4096];
            int count;
            while ((count = fs.read(buffer)) >= 0) {
                os.write(buffer, 0, count);
            }
            fs.close();
            os.close();
        }
    }
}
