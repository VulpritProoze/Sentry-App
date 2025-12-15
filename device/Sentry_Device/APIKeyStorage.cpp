#include "APIKeyStorage.h"
#include <Preferences.h>

Preferences preferences;

String getAPIKey() {
    preferences.begin("sentry", true);  // true = read-only mode
    String apiKey = preferences.getString("api_key", "");
    preferences.end();
    
    if (apiKey.length() == 0) {
        Serial.println("WARNING: API key not set! Use setAPIKey() in setup() once.");
    }
    
    return apiKey;
}

void setAPIKey(const String& apiKey) {
    preferences.begin("sentry", false);  // false = read-write mode
    preferences.putString("api_key", apiKey);
    preferences.end();
    Serial.println("API key stored successfully.");
}

bool isAPIKeySet() {
    preferences.begin("sentry", true);
    String apiKey = preferences.getString("api_key", "");
    preferences.end();
    return apiKey.length() > 0;
}