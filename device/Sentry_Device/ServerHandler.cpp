#include "ServerHandler.h"
#include "APIKeyStorage.h"
#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>

WebServer server(80);

// ------------------ Base URL ------------------
String baseUrl = "";

// Setter for base URL
void setBaseUrl(const String& url) {
    baseUrl = url;
    // Remove trailing '/' if present
    if (baseUrl.endsWith("/")) baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
}

// ------------------ Internal Helpers ------------------

void sendJsonResponse(int code, const JsonDocument& doc) {
    String response;
    serializeJson(doc, response);
    server.send(code, "application/json", response);
}

// ------------------ Route Builders ------------------

void registerPostJson(const char* path, JsonHandler handler) {
    // Build full path
    String fullPath = String(path);
    if (!fullPath.startsWith("/")) fullPath = "/" + fullPath;

    server.on(fullPath.c_str(), HTTP_POST, [handler]() {
        if (server.header("Content-Type") != "application/json") {
            server.send(415, "application/json", "{\"error\":\"Invalid Content-Type\"}");
            return;
        }

        StaticJsonDocument<512> request;
        DeserializationError err = deserializeJson(request, server.arg("plain"));

        if (err) {
            server.send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
            return;
        }

        StaticJsonDocument<256> response;
        handler(request, response);
        sendJsonResponse(200, response);
    });
}

// ----------------- POST JSON client -----------------

bool postJson(const String& path, const String& jsonPayload) {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("WiFi not connected, POST aborted");
        return false;
    }

    if (baseUrl.length() == 0) {
        Serial.println("Error: baseUrl not set!");
        return false;
    }

    // Ensure path starts with '/'
    String route = path;
    if (!route.startsWith("/")) route = "/" + route;

    // Build full URL
    String fullUrl = baseUrl + route;
    Serial.println("POSTing JSON to: " + fullUrl);

    // Get API key
    String apiKey = getAPIKey();
    if (apiKey.length() == 0) {
        Serial.println("ERROR: API key not configured!");
        return false;
    }

    HTTPClient http;
    http.begin(fullUrl);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-API-Key", apiKey);

    int code = http.POST(jsonPayload);
    
    if (code == 401) {
        Serial.println("ERROR: Authentication failed - check API key!");
    }
    
    http.end();

    if (code > 0) {
        Serial.println("POST success, HTTP code: " + String(code));
        return true;
    } else {
        Serial.println("POST failed: " + http.errorToString(code));
        return false;
    }
}

// ------------------ Server Lifecycle ------------------

void startHttpServer() {
    server.begin();
    Serial.println("HTTP server started");
}

void handleHttpClient() {
    server.handleClient();
}
