#ifndef APIKEYSTORAGE_H
#define APIKEYSTORAGE_H

#include <Arduino.h>

// Function to get the API key from storage
String getAPIKey();

// Function to set/store the API key (call this once during initial setup)
void setAPIKey(const String& apiKey);

// Function to check if API key is set
bool isAPIKeySet();

#endif