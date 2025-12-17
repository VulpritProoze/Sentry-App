# Two-Tier Crash Detection Approach

## Implementation Checklist

> **Status**: Phase 1 Partially Complete | **Last Updated**: 2025
> 
> This checklist tracks all implementation tasks for the two-tier crash detection system. The implementation is divided into two phases:
> - **Phase 1**: Tier 1 - Client-Side Fast Threshold Detection (immediate alerts)
> - **Phase 2**: Tier 2 - Backend AI Analysis (intelligent confirmation)
> 
> Complete Phase 1 first to get basic crash detection working, then implement Phase 2 for AI-powered confirmation.

### Recent Updates & Notes

**GPS Implementation Status**:
- ✅ GPS data reception from ESP32 via BLE is **fully implemented** (Phase 1)
- ✅ GPS data parsing in `bleManager.ts` is **complete** (Phase 1)
- ✅ GPS data storage in `DeviceContext` is **working** (Phase 1)
- ✅ GPS data is **NOW included** in crash alert requests (Phase 2 - ✅ COMPLETED)

**BLE Library**:
- ✅ Using `react-native-ble-plx` (not `react-native-ble-manager` or `expo-bluetooth`)
- ✅ Requires native build: `npx expo prebuild && npx expo run:android`

**Phase 2 Implementation Status** (✅ COMPLETED):
- ✅ GPS fields added to `CrashEvent` model
- ✅ GPS schema (`GPSDataSchema`) added to backend
- ✅ `CrashAlertRequest` updated to include GPS data (backend & frontend)
- ✅ `useCrashDetection` hook updated to send GPS to backend
- ✅ Crash controller stores GPS in CrashEvent
- ✅ FCM service includes GPS in crash notifications
- ✅ Loved ones notification utility created (`notify_loved_ones_with_gps()`)
- ✅ **Migration completed**: GPS fields migration has been run
- ✅ **UI Updates completed**: CrashAlert component now displays AI analysis results
- ✅ **Rate limiting implemented**: Client-side throttling prevents excessive API calls (configurable interval, default 15 seconds)
- ✅ **Field name mapping fixed**: Threshold result transformed from camelCase to snake_case for backend compatibility
- ✅ **API key authentication**: Frontend configured to use `X-API-Key` header with `EXPO_PUBLIC_DEVICE_API_KEY`
- ✅ **Configurable settings**: User can configure crash alert interval in Settings page (1-300 seconds)

---

## Phase 1: Tier 1 - Client-Side Threshold Detection

> **Goal**: Implement fast, local crash detection that provides immediate alerts (<100ms) without backend dependency.

### Frontend Setup

#### Project Setup & Structure
- [x] Create folder structure (`services`, `hooks`, `context`, `lib`, `types`, `utils`, `components`)
- [x] Setup TypeScript path aliases (`@/` for root directory)

#### React Context (Local State)
- [x] Create `context/DeviceContext.tsx`
  - [x] BLE connection state management
  - [x] Current sensor reading state
  - [x] Connect/disconnect functions
  - [x] Start/stop receiving data functions
- [x] Create `context/CrashContext.tsx`
  - [x] Last crash alert state
  - [x] Processing state
  - [x] Setter functions

#### Bluetooth Low Energy (BLE)
- [x] Choose BLE library (✅ Using `react-native-ble-plx` - already implemented)
- [x] Create `services/bluetooth/bleManager.ts` (✅ Implemented with GPS support)
  - [x] BLE manager initialization (placeholder)
  - [x] Device scanning functionality (placeholder)
  - [x] Device connection/disconnection (placeholder)
  - [x] Characteristic subscription (placeholder)
  - [x] Listener cleanup (prevent memory leaks) (placeholder)
  - [x] Sensor data parsing with error handling (placeholder)
- [x] Create `services/bluetooth/deviceScanner.ts` (⚠️ Placeholder - needs implementation)
  - [x] Device scanning logic (placeholder)
  - [x] Device pairing/connection flow (placeholder)
- [ ] Test BLE connection with ESP32 device
- [ ] Handle BLE disconnection scenarios
- [ ] Implement reconnection logic

#### GPS Integration (Phase 1)
- [x] Parse GPS data from BLE in `services/bluetooth/bleManager.ts`
  - [x] Subscribe to GPS data characteristic (`CHAR_GPS_DATA_UUID`)
  - [x] Parse GPS JSON packets from ESP32 (format: `{type: "gps_data", gps: {fix, satellites, latitude, longitude, altitude}}`)
  - [x] Handle GPS data parsing errors gracefully
  - [x] Store GPS data callback similar to sensor data callback
- [x] Update `context/DeviceContext.tsx` to store GPS data
  - [x] Add `currentGPSData` state (stores latest GPS reading)
  - [x] Add GPS data callback to BLE manager
  - [x] Update GPS data state when received from BLE
  - [x] **Note**: GPS data stored locally only in Tier 1 (not sent to backend until crash detected)
- [x] Update `types/device.ts` to include GPS data types
  - [x] Create `GPSData` interface (fix, satellites, latitude, longitude, altitude, timestamp)
  - [ ] Add GPS data to `SensorReading` interface (optional, for combined data)

#### Crash Detection Logic
- [x] Create `services/crash/threshold.ts`
  - [x] `ThresholdDetector` class
  - [x] Threshold configuration (G-force, tilt, consecutive triggers)
  - [x] Consecutive trigger detection logic (fixed version)
  - [x] Severity calculation
  - [x] Trigger type determination
- [x] Create `services/crash/calculator.ts`
  - [x] `calculateGForce()` function (with proper unit conversion)
  - [x] `calculateTilt()` function (roll and pitch)
  - [x] `isTiltExceeded()` helper function

#### Crash Detection Hook (Tier 1 Only)
- [x] Create `hooks/useCrashDetection.ts`
  - [x] Integrate `ThresholdDetector`
  - [x] Process sensor data from BLE
  - [x] Race condition protection (useRef for processing state)
  - [x] **Console log** threshold exceeded events (no notifications yet)
    - [x] Log threshold result details (severity, trigger type, G-force, tilt)
    - [x] Log timestamp and sensor data
  - [x] Store threshold alerts locally (in state/context)
  - [x] Reset detector after processing
  - [x] **Note**: Backend API calls and notifications will be added in Phase 2

#### TypeScript Types
- [x] Create `types/device.ts`
  - [x] `SensorReading` interface
  - [x] `BLEDevice` interface
  - [x] `GPSData` interface (fix, satellites, latitude, longitude, altitude, timestamp)
- [x] Create `types/crash.ts`
  - [x] `ThresholdResult` interface
  - [x] `ThresholdConfig` interface
  - [x] `CrashEvent` interface (for future use)
- [x] Create `types/api.ts` (Phase 2 types prepared)
  - [ ] Add GPS data to `CrashAlertRequest` interface (Phase 2)

#### UI Components (Tier 1)
- [x] Create `components/crash/CrashAlert.tsx`
  - [x] Display crash alert UI
  - [x] Show threshold detection results
  - [x] Display severity and trigger type
  - [x] **Note**: AI analysis results will be added in Phase 2 (structure ready)
- [x] Create `components/crash/CrashIndicator.tsx`
  - [x] Visual indicator for crash detection status
  - [x] Show when threshold is exceeded
- [x] Create `components/device/SensorDisplay.tsx`
  - [x] Display real-time sensor data
  - [x] Show BLE connection status
  - [x] Display G-force and tilt values
  - [ ] Display GPS data (latitude, longitude, fix status, satellites) (optional)

#### Integration (Tier 1)
- [x] Integrate BLE data flow with crash detection hook (✅ Integrated - ready when BLE is implemented)
- [x] Connect DeviceContext to BLE manager (✅ Connected in app layout)
- [x] Connect CrashContext to crash detection (✅ Connected in app layout)
- [x] Integrate with existing app navigation (✅ Added providers to app layout)
- [x] Add crash detection to appropriate screens (✅ Integrated into home screen)
- [ ] Test Tier 1 flow: BLE → Threshold → Console Log (⚠️ Requires BLE implementation)

#### Utilities & Constants
- [x] Create `utils/math.ts` (not needed - calculator.ts covers it)
- [x] Create `utils/validation.ts` (data validation utilities) (✅ Implemented)
- [x] Create `utils/constants.ts`
  - [x] `CRASH_DETECTION_CONFIG` constants
  - [x] BLE UUIDs (make configurable)
  - [x] Threshold values
  - [x] **Crash alert interval** (✅ Default: 15 seconds, configurable via settings)

### ESP32 Device Configuration (Phase 1)

- [x] Setup ESP32 development environment (✅ GPS already implemented)
- [x] Install MPU6050 library
- [x] Configure BLE
  - [x] Set BLE service UUID
  - [x] Set sensor data characteristic UUID
  - [x] Set GPS data characteristic UUID (`CHAR_GPS_DATA_UUID`)
  - [x] Configure device name (e.g., "Sentry Device")
- [x] Implement sensor reading
  - [x] Read MPU6050 accelerometer data
  - [x] Calculate roll, pitch, tilt_detected
  - [x] Format data as JSON
- [x] Implement GPS reading (✅ Already implemented)
  - [x] Initialize GPS module (Neo 6M)
  - [x] Read GPS data (latitude, longitude, altitude, satellites, fix status)
  - [x] Update GPS data continuously
- [x] Implement BLE transmission
  - [x] Send sensor data every 2 seconds
  - [x] Send GPS data every 2 seconds (along with sensor data)
  - [x] Handle BLE connection/disconnection
  - [x] Error handling for sensor read failures
- [ ] Test BLE communication with mobile app (including GPS data)
- [ ] Optimize battery usage

### Phase 1 Testing

- [ ] Unit tests for threshold detection logic
- [ ] Unit tests for G-force and tilt calculations
- [ ] Unit tests for consecutive trigger logic
- [ ] Integration tests for BLE connection (requires physical device)
- [ ] Integration tests for crash detection hook
- [ ] Test Tier 1 end-to-end: BLE → Threshold → Console Log
- [ ] Test with various sensor data scenarios
- [ ] Test BLE disconnection handling
- [ ] Verify console logs show threshold events correctly

### Phase 1 Completion Criteria

- [ ] ESP32 device sends sensor data via BLE every 2 seconds
- [x] ESP32 device sends GPS data via BLE every 2 seconds (✅ Already implemented)
- [ ] Mobile app receives and parses BLE sensor data
- [x] Mobile app receives and parses BLE GPS data (stored locally only)
- [ ] Threshold detection works correctly (G-force and tilt)
- [ ] Console logs show threshold exceeded events with details
- [ ] UI displays crash alerts and sensor data
- [x] GPS data stored in DeviceContext (local storage only in Tier 1)
- [ ] Basic error handling in place
- [ ] Tier 1 testing completed
- [ ] **Note**: Notifications will be implemented in Phase 2
- [ ] **Note**: GPS data sent to backend only when crash detected (Phase 2)

### Phase 2 Completion Criteria

- [x] Backend receives crash alerts from mobile app (with GPS data) (✅ Schema and controller updated)
- [x] Gemini AI analyzes crash data and provides confirmation (✅ Already implemented)
- [x] CrashEvent records created in database (with GPS location) (✅ GPS fields added, migration needed)
- [x] FCM push notifications sent on confirmed crashes (with GPS location) (✅ GPS added to notification payload)
- [x] GPS location sent to loved ones when crash confirmed (✅ `notify_loved_ones_with_gps()` created)
- [x] Frontend displays AI analysis results (✅ CrashAlert component enhanced with AI display)
- [ ] User feedback mechanism working (⚠️ Not yet implemented)
- [ ] Complete end-to-end flow tested (⚠️ Testing needed)
- [ ] False positive reduction verified (⚠️ Testing needed)

---

## Phase 2: Tier 2 - Backend AI Analysis

> **Goal**: Add intelligent AI-powered crash confirmation to reduce false positives and provide detailed crash analysis.

### Backend Setup

#### Dependencies
- [x] Add `httpx` dependency (✅ Added to `pyproject.toml`)
  - [x] Used for Expo Push Notification API HTTP requests
  - [x] Version: `httpx>=0.27.0,<1.0.0`

#### Models
- [ ] Create `device/models/sensor_data.py` (if not exists)
  - [ ] `SensorData` model for storing sensor readings
  - [ ] Timestamp indexing for efficient queries
  - [ ] Device relationship
  - [ ] Fields: device_id, ax, ay, az, roll, pitch, tilt_detected, timestamp
  - [ ] Add GPS fields: latitude, longitude, altitude, gps_fix, satellites (optional - store GPS with sensor data)
- [x] Create `device/models/crash_event.py` (✅ Already exists)
  - [x] `CrashEvent` model with all required fields
  - [x] Database indexes for frequently queried fields
  - [x] Model Meta configuration
  - [x] Fields: device_id, user, crash_timestamp, is_confirmed_crash, confidence_score, severity, etc.
  - [x] Add GPS fields: crash_latitude, crash_longitude, crash_altitude, gps_fix_at_crash, satellites_at_crash (✅ Added)
- [x] Create `device/models/device_token.py` (for FCM tokens) (✅ Already exists)
  - [x] `DeviceToken` model
  - [x] User/device relationship
  - [x] Token refresh mechanism
  - [x] Platform field (iOS/Android)
- [ ] Create and run migrations (⚠️ Run: `python manage.py makemigrations device --name add_gps_fields_to_crash_event`)

#### Schemas
- [x] Create `device/schemas/crash_schema.py` (✅ Already exists)
  - [x] `CrashAlertRequest` schema
    - [x] Add GPS data fields (latitude, longitude, altitude, gps_fix, satellites) (✅ Added GPSDataSchema)
    - [x] GPS data optional (may not have fix at crash time) (✅ Added as optional)
  - [x] `CrashAlertResponse` schema (✅ Already exists)
  - [x] Field validators (✅ Already implemented)
- [x] Create `device/schemas/fcm_schema.py` (✅ Implemented)
  - [x] `FCMTokenRequest` schema - For token registration
  - [x] `FCMTokenResponse` schema - Token registration response
  - [x] `TestNotificationRequest` schema - For test notifications
  - [x] `TestNotificationResponse` schema - Test notification response
- [ ] Create `device/schemas/device_schema.py` (if needed)
  - [ ] Device token registration schema

#### Controllers
- [x] Create `device/controllers/crash_controller.py` (✅ Already exists)
  - [x] `process_crash_alert()` function (✅ Already implemented)
  - [x] Follow backend guide conventions (import order, type hints, docstrings) (✅ Follows conventions)
  - [x] Error handling with proper HTTP errors (✅ Already implemented)
  - [x] Transaction management for multi-step operations (✅ Already implemented)
  - [x] Store GPS location in CrashEvent when crash confirmed (✅ Added GPS field storage)
  - [x] Send GPS location to loved ones when crash confirmed (via FCM notification) (✅ Added loved ones notification)
- [ ] Create `device/controllers/device_controller.py` (if not exists)
  - [ ] Device data reception endpoint
- [x] Create `device/controllers/fcm_controller.py` (✅ Implemented)
  - [x] `register_fcm_token()` function - Register Expo Push Token
  - [x] `send_test_notification()` function - Send test push notification
  - [x] Error handling with proper HTTP errors
  - [x] Uses JWT authentication (via mobile router)

#### Services
- [ ] Create `device/services/crash_detector.py` (or use utils)
  - [ ] `get_recent_sensor_data()` function
  - [ ] Query last N seconds of sensor data from database
  - [ ] Format data for AI analysis
  - [ ] Include GPS data in sensor data queries (if stored with sensor data)
- [ ] Create `core/ai/gemini_service.py` (or in appropriate location)
  - [ ] `GeminiService` class
  - [ ] `format_sensor_data_for_ai()` method
  - [ ] `analyze_crash_data()` method
  - [ ] Prompt engineering for crash detection
  - [ ] JSON response parsing
  - [ ] Error handling and retry logic
- [x] Create `device/services/fcm_service.py` (✅ Implemented - using Expo Push API)
  - [x] `FCMService` class
  - [x] Expo Push Notification API implementation (using `httpx`)
  - [x] `send_crash_notification()` method
  - [x] `send_test_notification()` method
  - [x] `_get_expo_push_token()` method (retrieves Expo Push Token from DeviceToken model)
  - [x] `_send_expo_notification()` method (handles Expo API response parsing)
  - [x] Error handling and logging
  - [x] Support for nested response format: `{"data": {"status": "ok"}}`
  - [x] Update `send_crash_notification()` to include GPS location in notification payload (✅ Added GPS to notification data)
  - [x] Add method to send notifications to loved ones with GPS location (✅ Created `notify_loved_ones_with_gps()` in crash_utils.py)

#### Routers
- [x] Create `device/router/crash_router.py` (✅ Already exists)
  - [x] `crash_router` with proper auth (DeviceAPIKeyAuth) (✅ Already configured)
  - [x] `/alert` endpoint (✅ Already implemented)
  - [x] Follow backend guide conventions (✅ Follows conventions)
- [x] Update `device/router/device_router.py` (✅ Already registered)
  - [x] Register `crash_router` in device router (✅ Already registered)
- [x] Verify router registration in `api/v1/router.py` (✅ Already registered)
- [x] Mobile router endpoints (✅ Implemented for push notifications)
  - [x] `POST /api/v1/device/mobile/fcm/token` - Register Expo Push Token
  - [x] `POST /api/v1/device/mobile/fcm/test` - Send test push notification
  - [x] Both use JWT authentication (require logged-in user)

#### Utilities
- [x] Create `device/utils/crash_utils.py` (if complex logic needed) (✅ Created with `notify_loved_ones_with_gps()`)
- [ ] Create `device/utils/sensor_data_utils.py` (if complex logic needed)

#### Storage & Configuration
- [x] Create storage functions for crash alert interval (✅ `lib/storage.ts`)
  - [x] `storeCrashAlertInterval()` - Store interval setting in SecureStore
  - [x] `getStoredCrashAlertInterval()` - Retrieve interval setting from SecureStore
  - [x] Default value: 15 seconds (from `CRASH_DETECTION_CONFIG`)

#### Settings & Configuration
- [x] Add Gemini API settings to `sentry/settings/config.py` (✅ Already implemented)
  - [x] `gemini_api_key` field (✅ Already exists)
  - [x] `gemini_model` field (✅ Already exists)
  - [x] `gemini_analysis_lookback_seconds` field (✅ Already exists)
- [x] Add Push Notification settings to `sentry/settings/config.py` (✅ Implemented)
  - [x] `expo_push_api_url` field (default: "https://exp.host/--/api/v2/push/send")
  - [x] `fcm_credentials_path` field (deprecated - kept for backward compatibility)
- [x] Add crash detection settings (✅ Implemented)
  - [x] `crash_confidence_threshold` field
  - [x] `crash_high_severity_g_force` field
  - [x] `crash_medium_severity_g_force` field

### ESP32 Device Configuration

- [ ] Setup ESP32 development environment
- [ ] Install MPU6050 library
- [ ] Configure BLE
  - [ ] Set BLE service UUID
  - [ ] Set sensor data characteristic UUID
  - [ ] Configure device name (e.g., "Sentry Device")
- [ ] Implement sensor reading
  - [ ] Read MPU6050 accelerometer data
  - [ ] Calculate roll, pitch, tilt_detected
  - [ ] Format data as JSON
- [ ] Implement BLE transmission
  - [ ] Send sensor data every 2 seconds
  - [ ] Handle BLE connection/disconnection
  - [ ] Error handling for sensor read failures
- [ ] Test BLE communication with mobile app
- [ ] Optimize battery usage

### Frontend Updates (Phase 2)

#### API Services
- [x] Create `lib/api.ts` (✅ Axios instances configured)
  - [x] Core API instance (for auth and user endpoints)
  - [x] Device API instance (for device endpoints)
  - [x] Request interceptors (JWT for core/mobile, API key for device endpoints)
  - [x] Response interceptors (401 handling, token refresh)
  - [x] **API key authentication** (✅ `X-API-Key` header added for device endpoints using `EXPO_PUBLIC_DEVICE_API_KEY`)
- [x] Create `services/api/crash.ts`
  - [x] `sendCrashAlert()` function
  - [x] Request/response type definitions
  - [x] Error handling
  - [x] **Update `CrashAlertRequest` interface in `types/api.ts` to include GPS data** (✅ Added `gps_data` field)
  - [x] **Update `sendCrashAlert()` to accept GPS data parameter** (✅ Already accepts full request object with GPS)

#### State Management (TanStack Query)
- [x] Setup TanStack Query (if not done in Phase 1)
  - [x] Install `@tanstack/react-query`
  - [x] Create `lib/queryClient.ts` with proper configuration (gcTime, staleTime)
  - [x] Setup `QueryClientProvider` in `app/_layout.tsx`
- [x] Create mutation hooks in `hooks/mutations/`
  - [x] `useSendCrashAlert.ts` - Mutation for sending crash alert to backend
  - [x] Handle AI response
  - [x] Update local state based on AI confirmation
- [ ] Create query hooks in `hooks/queries/`
  - [ ] `useCrashEvents.ts` - Query crash events from API
  - [ ] `useCrashHistory.ts` - Query crash history with date filters

#### Update Crash Detection Hook
- [x] Update `hooks/useCrashDetection.ts`
  - [x] Add mutation call to send alert to backend (✅ Enabled `useSendCrashAlert` mutation)
  - [x] **Import `useDevice` hook to access `currentGPSData`** (✅ Added)
  - [x] Include GPS data from DeviceContext in crash alert request (✅ Added `gps_data: currentGPSData`)
  - [x] Handle AI confirmation response (✅ Added onSuccess/onError handlers)
  - [x] Update UI based on AI analysis (✅ CrashAlert component updated)
  - [x] Show AI reasoning and confidence (✅ Enhanced display with color coding)
  - [x] **Rate limiting/throttling implemented** (✅ Prevents multiple API calls within configurable interval)
  - [x] **Field name transformation** (✅ Transforms camelCase `threshold_result` to snake_case for backend)
  - [x] **Configurable interval** (✅ Loads crash alert interval from storage, refreshes every 5 seconds)

#### Push Notifications (Expo Push Notification Service)
- [x] Choose approach (✅ Expo Push Notifications - chosen)
- [x] Create `services/notifications/notificationService.ts` (✅ Implemented)
  - [x] `NotificationService` class
  - [x] `requestPermissions()` function
  - [x] `getPushToken()` function (gets Expo Push Token)
  - [x] `sendLocalNotification()` function (for testing)
  - [x] `startPeriodicNotifications()` function (for testing)
  - [x] `stopPeriodicNotifications()` function (for testing)
  - [x] `setupNotificationListeners()` function
  - [x] Handle foreground/background notifications
  - [x] Error handling for missing FCM configuration (Android)
- [x] Create `hooks/useFCM.ts` (✅ Implemented)
  - [x] FCM token management hook
  - [x] Token registration with backend (`/mobile/fcm/token`)
  - [x] Notification handling hook
  - [x] Test notification functions (local and backend)
  - [x] Periodic notification testing support
- [x] Register FCM token on app startup (✅ Implemented in useFCM hook)
- [x] Handle notification tap actions (✅ Implemented in notification listeners)

#### Update UI Components
- [x] Update `components/crash/CrashAlert.tsx`
  - [x] Display AI analysis results (✅ Enhanced display with status cards)
  - [x] Show confidence score and reasoning (✅ Added confidence display with color coding)
  - [x] Display key indicators (✅ Added formatted list of indicators)
  - [x] Show processing state (✅ Added loading spinner during AI analysis)
  - [x] Show crash confirmation status (✅ Added prominent crash confirmed/false alarm display)
  - [ ] Add user feedback buttons (true/false positive) (⚠️ Optional - can be added later)
- [x] Update `app/(tabs)/settings.tsx`
  - [x] **Crash Detection settings section** (✅ Added configurable crash alert interval)
  - [x] Number input for interval configuration (1-300 seconds)
  - [x] Real-time interval updates (stored in SecureStore)
  - [x] Visual feedback (current value display, range validation)
- [ ] Create `components/crash/CrashHistory.tsx` (optional)
  - [ ] Display crash event history
  - [ ] Filter by date range

#### TypeScript Types (Update)
- [x] Update `types/api.ts`
  - [x] `CrashAlertRequest` interface
  - [x] `CrashAlertResponse` interface
  - [x] API response types
  - [x] **Field name compatibility** (✅ Frontend uses camelCase, transforms to snake_case for backend)

### Expo Push Notifications Setup

- [x] Setup Expo Push Notifications (✅ Chosen approach)
  - [x] Configure `app.json` with Expo project ID
  - [x] Install `expo-notifications` package
  - [x] Implement notification service using Expo Push Notification Service
  - [x] Configure backend to use Expo Push API (using `httpx`)
  - [x] Add `expo_push_api_url` to backend config
  - [x] Test push notification delivery (✅ Test endpoint implemented)
- [ ] Configure FCM credentials for Android (optional - only if using EAS Build or manual setup)
  - [ ] Use EAS Build (recommended - handles FCM automatically): `npx eas build --platform android`
  - [ ] Or configure FCM credentials manually: https://docs.expo.dev/push-notifications/fcm-credentials/
  - [ ] Note: Local notifications work without FCM configuration, but push notifications require it

### Integration (Phase 2)

- [ ] Integrate Tier 1 with Tier 2
  - [ ] Connect threshold detection to backend API
  - [ ] Handle AI response in frontend
  - [ ] Update notifications based on AI confirmation
- [ ] Test complete flow: BLE → Threshold → API → AI → FCM
- [ ] Test false positive handling
- [ ] Test offline queue (if implemented)

### Phase 2 Testing

#### Backend Testing
- [ ] Unit tests for Gemini service
- [ ] Unit tests for FCM service
- [ ] Unit tests for crash controller
- [ ] Integration tests for crash alert endpoint
- [ ] Integration tests with mock Gemini responses
- [ ] Test FCM token management
- [ ] Test sensor data retrieval
- [ ] Test GPS data storage in CrashEvent
- [ ] Test GPS location in FCM notifications
- [ ] Test loved ones notification with GPS location

#### Frontend Testing (Phase 2)
- [ ] Integration tests for API calls
- [ ] Integration tests for crash detection hook with backend
- [ ] Test AI response handling
- [ ] Test FCM token registration
- [ ] Test push notification handling

#### End-to-End Testing (Phase 2)
- [ ] Test complete flow: BLE → Threshold → API → AI → FCM
- [ ] Test GPS data flow: ESP32 → BLE → Client (stored) → Backend (on crash) → Loved Ones
- [ ] Test false positive scenarios (AI correctly identifies false alarms)
- [ ] Test offline handling (queue alerts when offline)
- [ ] Test BLE disconnection during crash
- [ ] Test GPS data availability (with fix and without fix scenarios)
- [ ] Performance testing (response times)
- [ ] Load testing (multiple simultaneous alerts)
- [ ] Test AI confirmation accuracy
- [ ] Test loved ones receive GPS location in notifications

### Documentation

- [ ] Document BLE UUIDs and configuration
- [ ] Document threshold values and tuning
- [ ] Document API endpoints
- [ ] Document environment variables
- [ ] Document ESP32 setup and configuration
- [ ] Create user guide for mobile app
- [ ] Create developer guide for extending the system

### Security & Privacy

- [x] **Implement API rate limiting for crash alert endpoint** (✅ Client-side throttling with configurable interval)
  - [x] Rate limiting prevents multiple API calls within configured interval (default: 15 seconds)
  - [x] Configurable via Settings page (1-300 seconds range)
  - [x] Stored in SecureStore for persistence
  - [x] Automatically refreshes interval setting every 5 seconds
- [ ] Secure FCM token storage
- [ ] Implement token refresh mechanism
- [ ] Encrypt sensitive sensor data (if required)
- [ ] Review GDPR/privacy compliance
- [ ] Secure BLE communication (if needed)
- [ ] Validate all API inputs
- [x] **API key authentication** (✅ Device endpoints use `X-API-Key` header with `EXPO_PUBLIC_DEVICE_API_KEY`)

### Deployment

- [ ] Configure production environment variables
- [ ] Setup production Firebase project
- [ ] Configure production FCM credentials
- [ ] Setup database indexes
- [ ] Configure logging
- [ ] Setup monitoring and alerts
- [ ] Performance optimization
- [ ] Load testing in production-like environment

---

## Overview

This document outlines the two-tier crash detection system that combines fast client-side threshold detection with intelligent backend AI analysis using Gemini API. This approach balances speed (immediate alerts) with accuracy (AI confirmation).

---

## Architecture Overview

```
┌─────────────────┐
│  ESP32 Device   │
│  (MPU6050)      │
│                 │
│  Sends sensor   │
│  data every 2s  │
│  via Bluetooth  │
│  Low Energy     │
└────────┬────────┘
         │
         │ BLE (Bluetooth Low Energy)
         │ Sensor Data (every 2 seconds)
         ▼
┌─────────────────┐
│  React Native   │
│  Mobile App     │
│                 │
│  Tier 1:        │
│  - BLE Receive  │
│  - Threshold    │
│    Detection    │
│  - Fast Alert   │
└────────┬────────┘
         │
         │ If threshold exceeded
         │ + Sensor data
         ▼
┌─────────────────┐
│  Django Backend │
│                 │
│  Tier 2:        │
│  - Gemini AI    │
│    Analysis     │
│  - Confirmation │
└────────┬────────┘
         │
         │ Push Notification
         ▼
┌─────────────────┐
│  Firebase Cloud │
│  Messaging      │
│  (FCM)          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Mobile App     │
│  (User)         │
└─────────────────┘
```

---

## Tier 1: Client-Side Fast Threshold Detection

### Purpose
Perform immediate crash detection on the mobile app using simple threshold calculations. This provides instant alerts (<100ms) without waiting for server response.

### Implementation Location
**Frontend**: `frontend/`

### Folder Structure (Industry Standard for React Native)

```
frontend/
├── app/                          # Expo Router pages (existing)
│   ├── (tabs)/
│   └── ...
├── services/                     # Business logic & API calls
│   ├── api/
│   │   └── crash.ts              # Crash analysis endpoints
│   ├── bluetooth/                # Bluetooth Low Energy (BLE) service
│   │   ├── bleManager.ts         # BLE connection management
│   │   └── deviceScanner.ts      # Device scanning & pairing
│   ├── crash/
│   │   ├── threshold.ts          # Threshold detection logic
│   │   └── calculator.ts         # G-force, tilt calculations
│   ├── auth.service.ts           # Authentication service
│   ├── device.service.ts         # Device service
│   └── ...                       # Other services
├── hooks/                        # Custom React hooks
│   ├── mutations/                # TanStack Query mutations
│   │   └── useSendCrashAlert.ts  # Mutation for sending crash alert
│   ├── useCrashDetection.ts      # Crash detection logic hook
│   ├── useAuth.ts                # Auth hook
│   └── ...                       # Other hooks
├── utils/                        # Utility functions
│   ├── validation.ts             # Data validation
│   └── constants.ts              # App constants
├── types/                        # TypeScript types
│   ├── device.ts                 # Device data types
│   ├── crash.ts                  # Crash detection types
│   └── api.ts                    # API response types
├── context/                      # React Context for local/client state
│   ├── DeviceContext.tsx         # Device BLE connection state (local)
│   ├── CrashContext.tsx          # Crash alert UI state (local)
│   ├── AuthContext.tsx           # Auth context
│   └── ...                       # Other contexts
├── lib/                          # Library setup & configuration
│   └── queryClient.ts            # TanStack Query client setup
├── components/                   # Reusable components
│   ├── crash/
│   │   ├── CrashAlert.tsx        # Crash alert component
│   │   └── CrashIndicator.tsx    # Crash indicator component
│   ├── device/
│   │   └── SensorDisplay.tsx     # Sensor display component
│   └── ToastContainer.tsx        # Toast component
├── constants/                    # App constants (existing)
├── assets/                       # Assets (existing)
└── package.json
```

### Bluetooth Low Energy (BLE) Communication

#### Purpose
The embedded ESP32 device communicates with the mobile app via Bluetooth Low Energy (BLE). The device sends MPU6050 sensor data every 2 seconds to the client app.

#### Why BLE?
- **Low Power**: BLE is designed for battery-efficient communication
- **Range**: Suitable for helmet-to-phone communication (typically 10-30 meters)
- **ESP32 Support**: ESP32 has built-in BLE support
- **Real-time**: 2-second intervals provide near real-time monitoring without excessive battery drain

#### Implementation

**Dependencies**:
```bash
npm install react-native-ble-plx
# Note: Requires native build (npx expo prebuild && npx expo run:android)
```

**File**: `frontend/services/bluetooth/bleManager.ts`

**Note**: The BLE manager is already fully implemented using `react-native-ble-plx`. Key features:
- GPS data subscription via `GPS_DATA_CHARACTERISTIC_UUID`
- Base64 decoding for BLE data packets
- Buffer management for chunked JSON messages
- Separate callbacks for sensor data and GPS data
- Proper cleanup and subscription management

See `frontend/services/bluetooth/bleManager.ts` for the complete implementation.

**Note**: Device scanning is handled directly in `BLEManager.scanForDevices()` and connection is managed via `DeviceContext`. No separate `DeviceScanner` class is needed.

#### ESP32 BLE Configuration

The ESP32 device should be configured to:
- Advertise as "Sentry Device" or similar name
- Send sensor data every 2 seconds via BLE characteristic
- Use a consistent service UUID and characteristic UUID
- Format data as JSON: `{"ax": 0.1, "ay": 0.2, "az": 0.98, "roll": 2.3, "pitch": 1.1, "tilt_detected": false}`

**Note**: 2-second intervals provide a good balance between:
- **Real-time monitoring**: Fast enough to detect crashes quickly
- **Battery efficiency**: Not too frequent to drain device battery
- **Data volume**: Manageable amount of data to process

### State Management (Hybrid Approach)

#### Purpose
Use a hybrid approach: **TanStack Query** for server state (API data) and **React Context** for local/client state (BLE connection, UI state).

#### Why This Approach?

**TanStack Query for Server State:**
- **Automatic caching**: Reduces unnecessary API calls
- **Background refetching**: Keeps data fresh automatically
- **Optimistic updates**: Better UX for mutations
- **Error handling**: Built-in retry and error states
- **Loading states**: Automatic loading state management

**React Context for Local State:**
- **Simple**: Perfect for BLE connection status, UI state
- **No dependencies**: Built into React
- **Lightweight**: No overhead for simple state

#### Setup TanStack Query

**Installation**:
```bash
npm install @tanstack/react-query
```

**File**: `frontend/lib/queryClient.ts`

```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (garbage collection time)
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});
```

**File**: `frontend/app/_layout.tsx` (Update)

```typescript
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { DeviceProvider } from '@/context/DeviceContext';
import { CrashProvider } from '@/context/CrashContext';

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <DeviceProvider>
        <CrashProvider>
          {/* Your app content */}
        </CrashProvider>
      </DeviceProvider>
    </QueryClientProvider>
  );
}
```

#### TanStack Query Hooks for Server State

**File**: `frontend/hooks/queries/useCrashEvents.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api/client';
import { CrashEvent } from '@/types/crash';

export function useCrashEvents(deviceId: string) {
  return useQuery({
    queryKey: ['crashEvents', deviceId],
    queryFn: async () => {
      const response = await apiClient.get<CrashEvent[]>(
        `/api/v1/device/${deviceId}/crash-events`
      );
      return response.data;
    },
    enabled: !!deviceId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}
```

**File**: `frontend/hooks/queries/useCrashHistory.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api/client';
import { CrashEvent } from '@/types/crash';

interface UseCrashHistoryOptions {
  deviceId: string;
  startDate?: string;
  endDate?: string;
}

export function useCrashHistory(options: UseCrashHistoryOptions) {
  const { deviceId, startDate, endDate } = options;

  return useQuery({
    queryKey: ['crashHistory', deviceId, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await apiClient.get<CrashEvent[]>(
        `/api/v1/device/${deviceId}/crash-history?${params.toString()}`
      );
      return response.data;
    },
    enabled: !!deviceId,
  });
}
```

#### TanStack Query Mutations

> **Note**: This is Phase 2 implementation. Not needed in Phase 1.

**File**: `frontend/hooks/mutations/useSendCrashAlert.ts` (Phase 2)

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sendCrashAlert, CrashAlertRequest, CrashAlertResponse } from '@/services/api/crash';
import { showLocalNotification } from '@/services/fcm/notifications';

export function useSendCrashAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CrashAlertRequest) => sendCrashAlert(data),
    onSuccess: (response: CrashAlertResponse) => {
      // Invalidate crash events query to refetch
      queryClient.invalidateQueries({ queryKey: ['crashEvents'] });

      // Show notification based on AI response
      if (response.is_crash) {
        showLocalNotification({
          title: '🚨 CRASH CONFIRMED',
          body: `Severity: ${response.severity} | ${response.reasoning}`,
          data: { type: 'crash_confirmed', ...response },
        });
      } else {
        showLocalNotification({
          title: '✅ False Alarm',
          body: 'AI analysis indicates no crash occurred.',
          data: { type: 'false_positive' },
        });
      }
    },
    onError: (error) => {
      console.error('Error sending crash alert:', error);
      // Keep threshold alert active if API fails
    },
  });
}
```

**File**: `frontend/hooks/mutations/useCrashFeedback.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api/client';

interface CrashFeedbackRequest {
  crashEventId: string;
  isCrash: boolean;
  falsePositive: boolean;
  comments?: string;
}

export function useCrashFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CrashFeedbackRequest) => {
      const response = await apiClient.post(
        `/api/v1/device/events/${data.crashEventId}/feedback`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['crashEvents'] });
      queryClient.invalidateQueries({ queryKey: ['crashHistory'] });
    },
  });
}
```

#### React Context for Local State

**File**: `frontend/context/DeviceContext.tsx`

```typescript
import React, { createContext, useContext, useState, useCallback } from 'react';
import { SensorReading } from '@/types/device';
import { BLEManager } from '@/services/bluetooth/bleManager';

interface DeviceContextType {
  isConnected: boolean;
  currentReading: SensorReading | null;
  connect: (deviceId: string) => Promise<boolean>;
  disconnect: () => Promise<void>;
  startReceiving: () => void;
  stopReceiving: () => void;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export function DeviceProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [currentReading, setCurrentReading] = useState<SensorReading | null>(null);
  const [bleManager] = useState(() => new BLEManager());

  const connect = useCallback(async (deviceId: string) => {
    const connected = await bleManager.connect(deviceId);
    setIsConnected(connected);
    return connected;
  }, [bleManager]);

  const disconnect = useCallback(async () => {
    await bleManager.disconnect();
    setIsConnected(false);
    setCurrentReading(null);
  }, [bleManager]);

  const startReceiving = useCallback(() => {
    bleManager.setDataCallback((data: SensorReading) => {
      setCurrentReading(data);
    });
  }, [bleManager]);

  const stopReceiving = useCallback(() => {
    bleManager.setDataCallback(() => {});
  }, [bleManager]);

  return (
    <DeviceContext.Provider
      value={{
        isConnected,
        currentReading,
        connect,
        disconnect,
        startReceiving,
        stopReceiving,
      }}
    >
      {children}
    </DeviceContext.Provider>
  );
}

export function useDevice() {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error('useDevice must be used within DeviceProvider');
  }
  return context;
}
```

**File**: `frontend/context/CrashContext.tsx`

```typescript
import React, { createContext, useContext, useState, useCallback } from 'react';
import { ThresholdResult } from '@/types/crash';

interface CrashContextType {
  lastCrashAlert: ThresholdResult | null;
  isProcessing: boolean;
  setLastCrashAlert: (alert: ThresholdResult | null) => void;
  setProcessing: (processing: boolean) => void;
}

const CrashContext = createContext<CrashContextType | undefined>(undefined);

export function CrashProvider({ children }: { children: React.ReactNode }) {
  const [lastCrashAlert, setLastCrashAlert] = useState<ThresholdResult | null>(null);
  const [isProcessing, setProcessing] = useState(false);

  return (
    <CrashContext.Provider
      value={{
        lastCrashAlert,
        isProcessing,
        setLastCrashAlert,
        setProcessing,
      }}
    >
      {children}
    </CrashContext.Provider>
  );
}

export function useCrash() {
  const context = useContext(CrashContext);
  if (!context) {
    throw new Error('useCrash must be used within CrashProvider');
  }
  return context;
}
```

**Usage Example**:

```typescript
// In any component - Using TanStack Query for server state
import { useCrashEvents } from '@/hooks/queries/useCrashEvents';
import { useSendCrashAlert } from '@/hooks/mutations/useSendCrashAlert';
import { useDevice } from '@/context/DeviceContext'; // Local state

function CrashHistoryScreen() {
  const { isConnected } = useDevice(); // Local state from Context
  const { data: crashEvents, isLoading, error } = useCrashEvents('device-123'); // Server state from Query
  const sendCrashAlert = useSendCrashAlert();

  if (isLoading) return <Text>Loading...</Text>;
  if (error) return <Text>Error loading crash events</Text>;

  return (
    <View>
      <Text>Connected: {isConnected ? 'Yes' : 'No'}</Text>
      {crashEvents?.map((event) => (
        <CrashEventCard key={event.id} event={event} />
      ))}
    </View>
  );
}
```

#### Summary

- **TanStack Query**: Use for all API calls (GET requests, mutations)
  - Crash events, crash history, device data from server
  - Automatic caching, refetching, error handling
  
- **React Context**: Use for local/client-side state
  - BLE connection status
  - Current sensor reading from BLE
  - UI state (modals, alerts)
  - Temporary state that doesn't need persistence

### Threshold Detection Logic

**File**: `frontend/services/crash/threshold.ts`

```typescript
import { SensorReading } from '@/types/device';
import { calculateGForce, calculateTilt } from './calculator';

export interface ThresholdConfig {
  gForceThreshold: number;      // Default: 8g
  tiltThreshold: number;          // Default: 90 degrees
  consecutiveTriggers: number;     // Default: 2 (reduce false positives)
}

export interface ThresholdResult {
  isTriggered: boolean;
  triggerType: 'g_force' | 'tilt' | 'both' | null;
  severity: 'low' | 'medium' | 'high';
  gForce: number;
  tilt: { roll: number; pitch: number };
  timestamp: number;
}

const DEFAULT_CONFIG: ThresholdConfig = {
  gForceThreshold: 8.0,
  tiltThreshold: 90.0,
  consecutiveTriggers: 2,
};

export class ThresholdDetector {
  private config: ThresholdConfig;
  private triggerHistory: boolean[] = [];

  constructor(config: Partial<ThresholdConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Check if sensor reading exceeds thresholds
   */
  checkThreshold(reading: SensorReading): ThresholdResult {
    const gForce = calculateGForce(reading.ax, reading.ay, reading.az);
    const tilt = calculateTilt(reading.ax, reading.ay, reading.az);
    
    const gForceExceeded = gForce >= this.config.gForceThreshold;
    const tiltExceeded = Math.abs(tilt.roll) >= this.config.tiltThreshold || 
                        Math.abs(tilt.pitch) >= this.config.tiltThreshold;

    // Track trigger history to reduce false positives
    const isTriggered = gForceExceeded || tiltExceeded;
    this.triggerHistory.push(isTriggered);
    
    // Keep only last N triggers
    if (this.triggerHistory.length > this.config.consecutiveTriggers) {
      this.triggerHistory.shift();
    }

    // Require consecutive triggers at the end of history
    const recentTriggers = this.triggerHistory.slice(-this.config.consecutiveTriggers);
    const confirmed = recentTriggers.length === this.config.consecutiveTriggers && 
                      recentTriggers.every(Boolean);

    // Determine severity
    let severity: 'low' | 'medium' | 'high' = 'low';
    if (gForce >= 15 || (gForceExceeded && tiltExceeded)) {
      severity = 'high';
    } else if (gForce >= 12 || gForceExceeded || tiltExceeded) {
      severity = 'medium';
    }

    // Determine trigger type
    let triggerType: 'g_force' | 'tilt' | 'both' | null = null;
    if (gForceExceeded && tiltExceeded) {
      triggerType = 'both';
    } else if (gForceExceeded) {
      triggerType = 'g_force';
    } else if (tiltExceeded) {
      triggerType = 'tilt';
    }

    return {
      isTriggered: confirmed,
      triggerType,
      severity,
      gForce,
      tilt,
      timestamp: Date.now(),
    };
  }

  /**
   * Reset trigger history (call after alert sent)
   */
  reset(): void {
    this.triggerHistory = [];
  }
}
```

### Calculator Utilities

**File**: `frontend/services/crash/calculator.ts`

```typescript
/**
 * Calculate total G-force from acceleration components
 * Formula: sqrt(ax² + ay² + az²)
 * 
 * Note: This assumes ESP32 sends acceleration data in m/s².
 * If ESP32 already compensates for gravity, use the result directly.
 * Otherwise, you may need to subtract gravity (9.81 m/s²) from the vertical component.
 */
export function calculateGForce(ax: number, ay: number, az: number): number {
  const totalAccel = Math.sqrt(ax * ax + ay * ay + az * az);
  // Convert to G-force (divide by 9.81 m/s²)
  return totalAccel / 9.81;
}

/**
 * Calculate tilt angles (roll and pitch) from acceleration
 */
export function calculateTilt(
  ax: number,
  ay: number,
  az: number
): { roll: number; pitch: number } {
  // Roll: rotation around X-axis
  const roll = Math.atan2(ay, az) * (180 / Math.PI);
  
  // Pitch: rotation around Y-axis
  const pitch = Math.atan2(-ax, Math.sqrt(ay * ay + az * az)) * (180 / Math.PI);
  
  return { roll, pitch };
}

/**
 * Check if tilt exceeds threshold
 */
export function isTiltExceeded(
  roll: number,
  pitch: number,
  threshold: number = 90
): boolean {
  return Math.abs(roll) >= threshold || Math.abs(pitch) >= threshold;
}
```

### React Hook for Crash Detection

**File**: `frontend/hooks/useCrashDetection.ts`

**Note**: The implementation includes:
- Rate limiting/throttling to prevent excessive API calls
- Field name transformation (camelCase → snake_case) for backend compatibility
- Configurable interval loaded from SecureStore
- GPS data inclusion from DeviceContext

```typescript
import { useEffect, useRef, useState } from 'react';
import { ThresholdDetector } from '@/services/crash/threshold';
import { ThresholdResult } from '@/types/crash';
import { SensorReading } from '@/types/device';
import { useDevice } from '@/context/DeviceContext';
import { useCrash } from '@/context/CrashContext';
import { useSendCrashAlert } from '@/hooks/mutations/useSendCrashAlert';
import { CRASH_DETECTION_CONFIG } from '@/utils/constants';
import { getStoredCrashAlertInterval } from '@/lib/storage';

interface UseCrashDetectionOptions {
  enabled?: boolean;
  onThresholdExceeded?: (result: ThresholdResult) => void;
  onAIConfirmation?: (confirmed: boolean) => void;
}

/**
 * Hook for crash detection using threshold analysis.
 * 
 * Phase 1: Receives sensor data from BLE connection (every 2 seconds from ESP32 device).
 * Performs fast threshold detection (Tier 1) and logs to console.
 * 
 * Phase 2: Will send to backend for AI analysis (Tier 2) using TanStack Query mutation.
 * 
 * @param sensorData - Sensor reading from BLE (received every 2 seconds)
 * @param options - Configuration options
 */
export function useCrashDetection(
  sensorData: SensorReading | null, // Received via BLE from ESP32 (every 2 seconds)
  options: UseCrashDetectionOptions = {}
) {
  const { enabled = true, onThresholdExceeded, onAIConfirmation } = options;
  const detectorRef = useRef(new ThresholdDetector());
  const [lastResult, setLastResult] = useState<ThresholdResult | null>(null);
  const isProcessingRef = useRef(false);
  const lastAlertTimeRef = useRef<number>(0);
  const alertIntervalRef = useRef<number>(CRASH_DETECTION_CONFIG.crashAlertIntervalSeconds * 1000);
  
  // Get GPS data from DeviceContext
  const { currentGPSData } = useDevice();
  
  // Get CrashContext to store AI response
  const { setAIResponse, setProcessing } = useCrash();
  
  // Phase 2: Use TanStack Query mutation for sending crash alert
  const sendCrashAlertMutation = useSendCrashAlert();

  // Load crash alert interval from storage on mount and periodically refresh
  useEffect(() => {
    const loadInterval = async () => {
      const storedInterval = await getStoredCrashAlertInterval();
      if (storedInterval) {
        alertIntervalRef.current = storedInterval * 1000; // Convert to milliseconds
      } else {
        // Use default if no stored value
        alertIntervalRef.current = CRASH_DETECTION_CONFIG.crashAlertIntervalSeconds * 1000;
      }
    };
    loadInterval();
    
    // Refresh interval every 5 seconds to pick up changes from settings
    const intervalId = setInterval(loadInterval, 5000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    // Process each sensor reading received via BLE (every 2 seconds)
    if (!enabled || !sensorData || isProcessingRef.current) return;

    const result = detectorRef.current.checkThreshold(sensorData);

    if (result.isTriggered && !isProcessingRef.current) {
      // Rate limiting: Check if enough time has passed since last alert
      const now = Date.now();
      const timeSinceLastAlert = now - lastAlertTimeRef.current;
      
      if (timeSinceLastAlert < alertIntervalRef.current) {
        // Too soon since last alert - skip this one
        const remainingSeconds = Math.ceil((alertIntervalRef.current - timeSinceLastAlert) / 1000);
        console.log(`⏱️ Rate limited: Skipping crash alert (wait ${remainingSeconds}s more)`);
        return;
      }

      isProcessingRef.current = true;
      lastAlertTimeRef.current = now; // Update last alert time
      setLastResult(result);
      setProcessing(true);
      setAIResponse(null); // Clear previous AI response

      // Phase 1: Console log threshold exceeded
      console.log('⚠️ THRESHOLD EXCEEDED - Potential Crash Detected', {
        timestamp: new Date().toISOString(),
        severity: result.severity,
        triggerType: result.triggerType,
        gForce: result.gForce,
        tilt: result.tilt,
        sensorData: sensorData,
        gpsData: currentGPSData,
      });

      // Phase 2: Send to backend for AI analysis using TanStack Query mutation
      // Transform camelCase to snake_case for backend compatibility
      sendCrashAlertMutation.mutate(
        {
          device_id: sensorData.device_id,
          sensor_reading: sensorData,
          threshold_result: {
            is_triggered: result.isTriggered,
            trigger_type: result.triggerType,
            severity: result.severity,
            g_force: result.gForce,
            tilt: result.tilt,
            timestamp: result.timestamp,
          },
          timestamp: new Date().toISOString(),
          gps_data: currentGPSData, // Include GPS data (may be null if no fix)
        },
        {
          onSuccess: (aiResponse) => {
            // AI confirmation received
            console.log('✅ AI Analysis Complete:', {
              is_crash: aiResponse.is_crash,
              confidence: aiResponse.confidence,
              severity: aiResponse.severity,
              reasoning: aiResponse.reasoning,
            });
            // Store AI response in context
            setAIResponse(aiResponse);
            setProcessing(false);
            onAIConfirmation?.(aiResponse.is_crash);
            // Reset detector after processing
            detectorRef.current.reset();
            isProcessingRef.current = false;
          },
          onError: (error) => {
            console.error('❌ Error sending crash alert:', error);
            setProcessing(false);
            setAIResponse(null);
            // Reset detector even on error to allow future detections
            detectorRef.current.reset();
            isProcessingRef.current = false;
          },
        }
      );

      onThresholdExceeded?.(result);
    }
  }, [sensorData, enabled, onThresholdExceeded, onAIConfirmation, currentGPSData, sendCrashAlertMutation, setAIResponse, setProcessing]);

  return {
    lastResult,
    isProcessing: sendCrashAlertMutation.isPending,
    reset: () => detectorRef.current.reset(),
  };
}
```

### API Service

**File**: `frontend/services/api/crash.ts`

```typescript
import { apiClient } from './client';
import { SensorReading } from '@/types/device';
import { ThresholdResult } from '@/types/crash';

export interface CrashAlertRequest {
  device_id: string;
  sensor_reading: SensorReading;
  threshold_result: ThresholdResult;
  timestamp: string;
}

export interface CrashAlertResponse {
  is_crash: boolean;
  confidence: number;
  severity: 'low' | 'medium' | 'high';
  crash_type: string;
  reasoning: string;
  key_indicators: string[];
  false_positive_risk: number;
}

export async function sendCrashAlert(
  data: CrashAlertRequest
): Promise<CrashAlertResponse> {
  const response = await apiClient.post<CrashAlertResponse>(
    '/api/v1/device/crash/alert',
    data
  );
  return response.data;
}
```

---

## GPS Integration

### Overview

GPS location data is integrated throughout the two-tier crash detection system to provide location information when crashes are detected. The GPS data flow is designed to:

1. **Tier 1 (Client)**: Store GPS data locally, only sending to backend when crash is detected
2. **Tier 2 (Backend)**: Store GPS location with crash events and send to loved ones when crash confirmed

### GPS Data Flow

```
ESP32 Device (GPS Module)
    │
    │ Every 2 seconds
    ▼
BLE Transmission (GPS Data)
    │
    │ {type: "gps_data", gps: {fix, satellites, latitude, longitude, altitude}}
    ▼
Mobile App (Tier 1 - Client)
    │
    │ Parse GPS data from BLE
    │ Store in DeviceContext (local only)
    │
    │ When crash detected (threshold exceeded)
    ▼
Backend API (Tier 2)
    │
    │ Store GPS in CrashEvent
    │ If crash confirmed by AI
    ▼
Loved Ones Notification
    │
    │ FCM Push Notification with GPS location
    │ (latitude, longitude, map link)
    ▼
Loved Ones (Emergency Contacts)
```

### Phase 1: GPS Data Reception and Storage (Client-Side Only)

#### ESP32 Device (Already Implemented ✅)

The ESP32 device already sends GPS data via BLE every 2 seconds:

**Format**: JSON packet
```json
{
  "type": "gps_data",
  "sequence": 123,
  "timestamp": 1234567890,
  "gps": {
    "fix": true,
    "satellites": 8,
    "latitude": 37.7749,
    "longitude": -122.4194,
    "altitude": 100.5
  },
  "crc": 12345
}
```

**BLE Characteristic**: `CHAR_GPS_DATA_UUID` = `"0000ff02-0000-1000-8000-00805f9b34fb"`

#### Frontend Implementation (Phase 1)

**1. Parse GPS Data in BLE Manager**

File: `frontend/services/bluetooth/bleManager.ts`

**Note**: GPS parsing is already fully implemented. The BLE manager:
- Subscribes to `GPS_DATA_CHARACTERISTIC_UUID` characteristic
- Parses base64-encoded JSON packets from ESP32
- Handles chunked data with buffer management
- Validates GPS data structure: `{type: "gps_data", gps: {fix, satellites, latitude, longitude, altitude}}`
- Provides `setGPSDataCallback()` method for receiving GPS updates

See `frontend/services/bluetooth/bleManager.ts` lines 550-692 for the complete GPS implementation.

**2. Store GPS Data in DeviceContext**

File: `frontend/context/DeviceContext.tsx`

**Note**: GPS data storage is already fully implemented. The DeviceContext:
- Stores `currentGPSData` state (type: `GPSData | null`)
- Sets GPS callback in `startReceiving()` method
- Updates GPS state when data is received from BLE
- Clears GPS data on disconnect

See `frontend/context/DeviceContext.tsx` lines 10, 35, 113-126, 189, 234 for the complete implementation.

**3. TypeScript Types**

File: `frontend/types/device.ts`

```typescript
export interface GPSData {
  fix: boolean;
  satellites: number;
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  timestamp: string;
}
```

**Note**: In Phase 1, GPS data is stored locally only. It is NOT sent to the backend until a crash is detected (Phase 2).

### Phase 2: GPS Data Transmission and Notification

#### Frontend: Include GPS in Crash Alert

**Update Crash Detection Hook**

File: `frontend/hooks/useCrashDetection.ts`

**Status**: ⚠️ **Not yet implemented** - This needs to be added in Phase 2.

```typescript
import { useDevice } from '@/context/DeviceContext';

export function useCrashDetection(
  sensorData: SensorReading | null,
  options: UseCrashDetectionOptions = {}
) {
  const { currentGPSData } = useDevice(); // Get GPS data from context
  const sendCrashAlertMutation = useSendCrashAlert();
  
  // ... existing code
  
  if (result.isTriggered) {
    // Include GPS data in crash alert
    sendCrashAlertMutation.mutate({
      device_id: sensorData.device_id,
      sensor_reading: sensorData,
      threshold_result: result,
      timestamp: new Date().toISOString(),
      gps_data: currentGPSData, // Add GPS data (may be null if no fix)
    });
  }
}
```

**Note**: Currently, `useCrashDetection` doesn't access GPS data. This needs to be updated when implementing Phase 2.

**Update API Types**

File: `frontend/types/api.ts`

**Status**: ⚠️ **Not yet implemented** - This needs to be added in Phase 2.

```typescript
import { GPSData } from './device';

export interface CrashAlertRequest {
  device_id: string;
  sensor_reading: SensorReading;
  threshold_result: ThresholdResult;
  timestamp: string;
  gps_data: GPSData | null; // GPS data (may be null if no fix)
}
```

**Note**: Currently, `CrashAlertRequest` doesn't include GPS data. This needs to be updated when implementing Phase 2.

#### Backend: Store GPS in CrashEvent

**1. Update CrashEvent Model**

File: `backend/sentry/device/models/crash_event.py`

**Status**: ⚠️ **Not yet implemented** - This needs to be added in Phase 2.

```python
class CrashEvent(models.Model):
    # ... existing fields
    
    # GPS Location at Crash Time
    crash_latitude = models.FloatField(null=True, blank=True)
    crash_longitude = models.FloatField(null=True, blank=True)
    crash_altitude = models.FloatField(null=True, blank=True)
    gps_fix_at_crash = models.BooleanField(default=False)
    satellites_at_crash = models.IntegerField(null=True, blank=True)
    
    # ... rest of model
```

**Note**: Currently, `CrashEvent` model doesn't have GPS fields. These need to be added via migration in Phase 2.

**2. Update Crash Alert Schema**

File: `backend/sentry/device/schemas/crash_schema.py`

**Status**: ⚠️ **Not yet implemented** - This needs to be added in Phase 2.

```python
"""Crash detection schemas."""

from ninja import Schema

class GPSDataSchema(Schema):
    """GPS data schema."""

    fix: bool
    satellites: int
    latitude: float | None
    longitude: float | None
    altitude: float | None
    timestamp: str

class CrashAlertRequest(Schema):
    """Crash alert request schema."""

    device_id: str
    sensor_reading: SensorReadingSchema
    threshold_result: ThresholdResultSchema
    timestamp: str
    gps_data: GPSDataSchema | None = None  # Optional GPS data
```

**Note**: Currently, `CrashAlertRequest` schema doesn't include GPS data. This needs to be added in Phase 2.

**3. Update Crash Controller**

File: `backend/sentry/device/controllers/crash_controller.py`

**Status**: ⚠️ **Partially implemented** - GPS fields need to be added when GPS schema is updated.

```python
"""Crash controller."""

import logging

from core.ai.gemini_service import GeminiService
from django.db import transaction
from django.http import HttpRequest
from ninja.errors import HttpError

from device.models import CrashEvent
from device.schemas.crash_schema import CrashAlertRequest, CrashAlertResponse
from device.services.crash_detector import CrashDetectorService
from device.services.fcm_service import FCMService

logger = logging.getLogger("device")

def process_crash_alert(
    request: HttpRequest,
    data: CrashAlertRequest,
) -> CrashAlertResponse:
    """Process crash alert from mobile app (Tier 1 trigger).

    Args:
        request: The HTTP request object
        data: The crash alert request data

    Returns:
        CrashAlertResponse containing AI analysis results

    Raises:
        HttpError: If processing fails
    """
    try:
        # Initialize services
        gemini_service = GeminiService()
        crash_detector = CrashDetectorService()
        fcm_service = FCMService()
        
        # ... existing AI analysis code (retrieve sensor data, call Gemini AI)
        
        if ai_analysis["is_crash"]:
            with transaction.atomic():
                crash_event = CrashEvent.objects.create(
                    # ... existing fields
                    # TODO: Add GPS fields when GPS schema is implemented:
                    # crash_latitude=data.gps_data.latitude if data.gps_data and data.gps_data.fix else None,
                    # crash_longitude=data.gps_data.longitude if data.gps_data and data.gps_data.fix else None,
                    # crash_altitude=data.gps_data.altitude if data.gps_data and data.gps_data.fix else None,
                    # gps_fix_at_crash=data.gps_data.fix if data.gps_data else False,
                    # satellites_at_crash=data.gps_data.satellites if data.gps_data else None,
                )
                
                # Send notifications to loved ones with GPS location
                if ai_analysis["severity"] in ["high", "medium"]:
                    fcm_service.send_crash_notification(
                        device_id=data.device_id,
                        crash_event=crash_event,
                        ai_analysis=ai_analysis,
                    )
                    # TODO: Send GPS location to loved ones when GPS is implemented
                    # notify_loved_ones_with_gps(device_id=data.device_id, crash_event=crash_event)
        
        return CrashAlertResponse(...)
        
    except Exception as e:
        logger.error(f"Error processing crash alert: {e}", exc_info=True)
        raise HttpError(status_code=500, message="Failed to process crash alert")
```

**Note**: The controller exists but needs GPS field updates when GPS schema is added in Phase 2.

#### Backend: Notify Loved Ones with GPS Location

**1. Update FCM Service**

File: `backend/sentry/device/services/fcm_service.py`

```python
def send_crash_notification(
    self,
    device_id: str,
    crash_event: CrashEvent,
    ai_analysis: dict,
) -> None:
    """Send crash notification with GPS location."""
    
    # Get GPS location
    gps_location = None
    if crash_event.crash_latitude and crash_event.crash_longitude:
        gps_location = {
            "latitude": crash_event.crash_latitude,
            "longitude": crash_event.crash_longitude,
            "altitude": crash_event.crash_altitude,
        }
        # Create map link (Google Maps)
        map_link = f"https://www.google.com/maps?q={crash_event.crash_latitude},{crash_event.crash_longitude}"
    else:
        map_link = None
    
    # Build notification message
    message = {
        "title": f"🚨 Crash Detected - {ai_analysis['severity'].upper()}",
        "body": f"{ai_analysis['crash_type']} - {ai_analysis['reasoning'][:100]}...",
        "data": {
            "type": "crash_confirmed",
            "crash_event_id": str(crash_event.id),
            "severity": ai_analysis["severity"],
            "gps_location": gps_location,
            "map_link": map_link,
        },
    }
    
    # Send to device owner
    # ... existing notification code
    
**Note**: The `notify_loved_ones_with_gps()` function should be placed in a utility file, not in the controller or service. Create `device/utils/crash_utils.py`:

File: `backend/sentry/device/utils/crash_utils.py`

**Status**: ⚠️ **Not yet implemented** - This needs to be created in Phase 2.

```python
"""Crash utilities."""

import logging

from device.models.crash_event import CrashEvent
from device.models.device_token import DeviceToken
from device.services.fcm_service import FCMService

logger = logging.getLogger("device")

def notify_loved_ones_with_gps(
    device_id: str,
    crash_event: CrashEvent,
) -> None:
    """Send GPS location to all active loved ones for the device owner.

    Args:
        device_id: The device ID
        crash_event: The crash event with GPS location
    """
    from core.models import LovedOne
    
    # Get device owner (user)
    user = crash_event.user
    if not user:
        logger.warning(f"No user associated with crash event {crash_event.id}")
        return
    
    # Get all active loved ones (use select_related to avoid N+1 queries)
    loved_ones = LovedOne.objects.filter(
        user=user,
        is_active=True
    ).select_related("loved_one")
    
    # Get GPS location
    if not (crash_event.crash_latitude and crash_event.crash_longitude):
        logger.warning(f"No GPS location for crash event {crash_event.id}")
        return
    
    map_link = f"https://www.google.com/maps?q={crash_event.crash_latitude},{crash_event.crash_longitude}"
    
    # Initialize FCM service
    fcm_service = FCMService()
    
    # Send notification to each loved one
    for loved_one_rel in loved_ones:
        loved_one_user = loved_one_rel.loved_one
        
        # Get loved one's device tokens
        device_tokens = DeviceToken.objects.filter(
            user=loved_one_user,
            is_active=True
        )
        
        for device_token in device_tokens:
            message = {
                "title": f"🚨 Emergency: {user.email} - Crash Detected",
                "body": f"Location: {map_link}",
                "data": {
                    "type": "loved_one_crash_alert",
                    "crash_event_id": str(crash_event.id),
                    "user_email": user.email,
                    "gps_location": {
                        "latitude": crash_event.crash_latitude,
                        "longitude": crash_event.crash_longitude,
                        "altitude": crash_event.crash_altitude,
                    },
                    "map_link": map_link,
                },
            }
            
            fcm_service._send_expo_notification(
                expo_push_token=device_token.fcm_token,
                message=message,
            )
```

**Note**: This utility function needs to be created in Phase 2. Follow BACKEND_GUIDE.md conventions:
- Place in `device/utils/crash_utils.py`
- Use `logging.getLogger("device")` for logger
- Use Google-style docstrings with Args, Returns, Raises sections

### GPS Data Storage Strategy

**Option 1: Store GPS with Sensor Data (Recommended)**
- Store GPS data in `SensorData` model alongside sensor readings
- Allows historical GPS tracking
- Useful for AI analysis context

**Option 2: Store GPS Only in CrashEvent**
- Store GPS only when crash detected
- Simpler, less storage
- Sufficient for crash notifications

**Recommendation**: Use Option 1 for comprehensive tracking, but ensure GPS is always included in CrashEvent for emergency notifications.

### Testing GPS Integration

1. **Test GPS Data Reception (Phase 1)**
   - Verify GPS data parsed from BLE
   - Verify GPS data stored in DeviceContext
   - Test with GPS fix and without fix

2. **Test GPS in Crash Alert (Phase 2)**
   - Verify GPS included in crash alert request
   - Verify GPS stored in CrashEvent
   - Test with null GPS data (no fix)

3. **Test Loved Ones Notification**
   - Verify loved ones receive GPS location
   - Verify map link works correctly
   - Test with multiple loved ones

---

## Tier 2: Backend AI Analysis with Gemini

### Purpose
Perform intelligent crash analysis using Gemini AI API to confirm or deny threshold triggers, reducing false positives and providing detailed crash insights.

### Implementation Location
**Backend**: `backend/sentry/`

### Flow

1. **Receive Threshold Alert from Mobile App**
   - Endpoint: `POST /api/v1/device/crash/alert`
   - Receives sensor data + threshold result

2. **Retrieve Recent Context**
   - Fetch last 30 seconds of sensor data from database
   - Format for Gemini AI analysis

3. **Call Gemini AI**
   - Create optimized prompt
   - Send to Gemini API
   - Parse JSON response

4. **Process AI Response**
   - If confirmed crash → Create CrashEvent, send FCM push notification
   - If false positive → Log for learning, optionally notify user

5. **Send Push Notification via FCM**
   - High severity → Immediate notification
   - Medium severity → Delayed notification
   - Low severity → Log only

### Backend Endpoint

**Note**: Following the backend guide conventions:
- Controllers contain business logic
- Services (like `FCMService`, `GeminiService`) are used for external integrations
- Complex model-specific logic should go in `utils/{model_name}_utils.py`
- Import organization: standard library → third-party → Django → local imports
- Use `Schema` from `ninja` (not `BaseModel` from `pydantic` directly)
- Use Google-style docstrings with Args, Returns, Raises sections
- Use `transaction.atomic()` for multi-step database operations
- Use `logging.getLogger("device")` for logger naming (app name, not `__name__`)
- Place utility functions in `utils/{model_name}_utils.py` files

**File**: `backend/sentry/device/controllers/crash_controller.py`

**Note**: Following BACKEND_GUIDE.md conventions:
- Import order: standard library → third-party → Django → local imports
- Use `logging.getLogger("device")` (app name, not `__name__`)
- Use Google-style docstrings with Args, Returns, Raises sections
- Use `transaction.atomic()` for multi-step database operations

```python
"""Crash controller."""

import logging

from django.db import transaction
from django.http import HttpRequest
from ninja.errors import HttpError

from core.ai.gemini_service import GeminiService
from device.models import CrashEvent
from device.schemas.crash_schema import CrashAlertRequest, CrashAlertResponse
from device.services.crash_detector import CrashDetectorService
from device.services.fcm_service import FCMService

logger = logging.getLogger("device")

def process_crash_alert(
    request: HttpRequest,
    data: CrashAlertRequest,
) -> CrashAlertResponse:
    """Process crash alert from mobile app (Tier 1 trigger).

    Args:
        request: The HTTP request object
        data: The crash alert request data

    Returns:
        CrashAlertResponse containing AI analysis results

    Raises:
        HttpError: If processing fails
    """
    try:
        # Initialize services
        gemini_service = GeminiService()
        crash_detector = CrashDetectorService()
        fcm_service = FCMService()
        
        # Retrieve recent sensor data (last 30 seconds)
        recent_data = crash_detector.get_recent_sensor_data(
            device_id=data.device_id,
            lookback_seconds=30
        )
        
        # Format data for Gemini AI
        formatted_data = gemini_service.format_sensor_data_for_ai(
            sensor_data=recent_data,
            current_reading=data.sensor_reading,
            include_metrics=True
        )
        
        # Call Gemini AI for analysis
        ai_analysis = gemini_service.analyze_crash_data(
            sensor_data=recent_data,
            current_reading=data.sensor_reading,
            context_seconds=30
        )
        
        # Create CrashEvent if confirmed (use transaction for multi-step operations)
        crash_event = None
        if ai_analysis['is_crash']:
            with transaction.atomic():
                crash_event = CrashEvent.objects.create(
                    device_id=data.device_id,
                    user=request.user if hasattr(request, 'user') and request.user.is_authenticated else None,
                    crash_timestamp=data.timestamp,
                    is_confirmed_crash=True,
                    confidence_score=ai_analysis['confidence'],
                    severity=ai_analysis['severity'],
                    crash_type=ai_analysis['crash_type'],
                    ai_reasoning=ai_analysis['reasoning'],
                    key_indicators=ai_analysis['key_indicators'],
                    false_positive_risk=ai_analysis['false_positive_risk'],
                    max_g_force=data.threshold_result.g_force,
                    impact_acceleration={
                        'ax': data.sensor_reading.ax,
                        'ay': data.sensor_reading.ay,
                        'az': data.sensor_reading.az,
                    },
                    final_tilt={
                        'roll': data.sensor_reading.roll,
                        'pitch': data.sensor_reading.pitch,
                    },
                    # GPS fields
                    crash_latitude=data.gps_data.latitude if data.gps_data and data.gps_data.fix else None,
                    crash_longitude=data.gps_data.longitude if data.gps_data and data.gps_data.fix else None,
                    crash_altitude=data.gps_data.altitude if data.gps_data and data.gps_data.fix else None,
                    gps_fix_at_crash=data.gps_data.fix if data.gps_data else False,
                    satellites_at_crash=data.gps_data.satellites if data.gps_data else None,
                )
                
                # Send FCM push notification
                if ai_analysis['severity'] in ['high', 'medium']:
                    fcm_service.send_crash_notification(
                        device_id=data.device_id,
                        crash_event=crash_event,
                        ai_analysis=ai_analysis
                    )
        
        return CrashAlertResponse(
            is_crash=ai_analysis['is_crash'],
            confidence=ai_analysis['confidence'],
            severity=ai_analysis['severity'],
            crash_type=ai_analysis['crash_type'],
            reasoning=ai_analysis['reasoning'],
            key_indicators=ai_analysis['key_indicators'],
            false_positive_risk=ai_analysis['false_positive_risk'],
        )
        
    except Exception as e:
        logger.error(f"Error processing crash alert: {e}", exc_info=True)
        raise HttpError(status_code=500, message="Failed to process crash alert")
```

### Router

**File**: `backend/sentry/device/router/crash_router.py`

```python
"""Crash router."""

from typing import Any

from django.http import HttpRequest
from ninja import Router

from core.auth.api_key import DeviceAPIKeyAuth
from device.controllers.crash_controller import process_crash_alert
from device.schemas.crash_schema import CrashAlertRequest, CrashAlertResponse

crash_router = Router(tags=["crash"], auth=DeviceAPIKeyAuth())

@crash_router.post("/alert", response=CrashAlertResponse)
def crash_alert_endpoint(
    request: HttpRequest,
    payload: CrashAlertRequest,
) -> CrashAlertResponse:
    """Endpoint for mobile app to send threshold-triggered crash alerts.

    This is called when Tier 1 (client-side) detects threshold exceeded.
    Backend performs Tier 2 (AI analysis) and responds with confirmation.

    Args:
        request: The HTTP request object
        payload: The crash alert request payload

    Returns:
        CrashAlertResponse containing AI analysis results
    """
    return process_crash_alert(request, payload)
```

**Note**: The `crash_router` should be registered in the device router:

**File**: `backend/sentry/device/router/device_router.py` (update)

```python
"""Device router."""

from typing import Any

from django.http import HttpRequest
from ninja import Router

from core.auth.api_key import DeviceAPIKeyAuth
from device.controllers.device_controller import receive_device_data
from device.schemas import DeviceDataRequest, DeviceDataResponse
from .crash_router import crash_router

device_router = Router(tags=["device"], auth=DeviceAPIKeyAuth())

# Existing endpoint
@device_router.post("/data", response=DeviceDataResponse)
def receive_device_data_endpoint(
    request: HttpRequest,
    payload: DeviceDataRequest,
) -> DeviceDataResponse:
    """Endpoint the embedded device can POST MPU6050 data to.

    Args:
        request: The HTTP request object
        payload: The device data request payload

    Returns:
        DeviceDataResponse containing processing result
    """
    return receive_device_data(request, payload)

# Register crash router
device_router.add_router("crash", crash_router)
```

The `device_router` is already registered in `api/v1/router.py`, so the crash endpoint will be available at `/api/v1/device/crash/alert`.

---

## Firebase Cloud Messaging (FCM) Integration

### Purpose
Send push notifications to mobile app users when crashes are detected and confirmed by AI.

### Backend Setup

#### 1. Install Dependencies

```bash
pip install httpx>=0.27.0
```

#### 2. FCM Service (Using Expo Push Notification API)

**File**: `backend/sentry/device/services/fcm_service.py`

**Note**: The implementation uses Expo Push Notification Service API instead of Firebase Admin SDK directly. This approach:
- Works with Expo Push Tokens (returned by `expo-notifications` library)
- No need for Firebase Admin SDK or service account credentials
- Simpler setup for Expo-based apps
- Uses `httpx` library to make HTTP POST requests to Expo's API

Key implementation details:
- `send_crash_notification()`: Sends crash notification via Expo Push API
- `send_test_notification()`: Sends test notification for testing purposes
- `_get_expo_push_token()`: Retrieves Expo Push Token from `DeviceToken` model
- `_send_expo_notification()`: Handles HTTP POST to Expo API with proper response parsing
- Supports nested response format: `{"data": {"status": "ok", "id": "..."}}`
- Error handling with proper logging

**Dependencies**:
- `httpx` library for HTTP requests
- `DeviceToken` model (stores Expo Push Tokens in `fcm_token` field)

#### 3. Configuration

**File**: `backend/sentry/sentry/settings/config.py`

Add to the `Settings` class:
```python
# Push notification settings (Expo)
expo_push_api_url: str = Field(
    default="https://exp.host/--/api/v2/push/send",
    description="Expo Push Notification API endpoint URL",
)
# FCM settings (deprecated - using Expo Push API now)
fcm_credentials_path: str | None = Field(
    default=None,
    description="Path to Firebase service account JSON file (deprecated - not used with Expo Push API)",
)
```

**Note**: `fcm_credentials_path` is kept for backward compatibility but is not used with Expo Push API implementation.

### Frontend Setup

#### 1. Install Dependencies

```bash
cd frontend
npx expo install expo-notifications expo-device expo-constants
```

**Note**: No need for `@react-native-firebase/app` or `@react-native-firebase/messaging` when using Expo Push Notification Service.

#### 2. Notification Service

**File**: `frontend/services/notifications/notificationService.ts`

**Note**: This is implemented using `expo-notifications` library and Expo Push Notification Service.

**Implementation Notes**:
- Uses `expo-notifications` for Expo Push Token generation
- Token is sent to backend endpoint: `/api/v1/device/mobile/fcm/token`
- Backend uses Expo Push API to send notifications using the Expo Push Token
- Handles both local notifications and push notifications
- Supports periodic notifications for testing
- Error handling for missing FCM configuration on Android

**Key Methods**:
- `getPushToken()`: Gets Expo Push Token (format: `ExponentPushToken[...]`)
- `sendLocalNotification()`: Sends immediate local notification
- `startPeriodicNotifications()`: Starts periodic test notifications
- `setupNotificationListeners()`: Sets up foreground/background notification handlers

#### 3. useFCM Hook

**File**: `frontend/hooks/useFCM.ts`

**Implementation Notes**:
- Automatically registers for push notifications on mount
- Sends Expo Push Token to backend on registration
- Provides test notification functions (local and backend)
- Manages notification state (token, registration status, periodic notifications)
- Handles notification listeners setup and cleanup

#### 4. Backend Test Notification Endpoint

**File**: `backend/sentry/device/router/mobile_router.py`

**Endpoints**:
- `POST /api/v1/device/mobile/fcm/token` - Register Expo Push Token
- `POST /api/v1/device/mobile/fcm/test` - Send test push notification

**Note**: Both endpoints require JWT authentication.

#### 5. Notification Component

> **Note**: This is Phase 2 implementation. In Phase 1, use `console.log()` instead of notifications.

**Note**: Local notification functionality is implemented in `notificationService.ts` via `sendLocalNotification()` method. The `useFCM` hook provides convenient wrapper functions for testing.

#### 6. App Initialization

**File**: `frontend/app/(tabs)/home.tsx` (update)

**Note**: Push notification registration happens automatically in the `useFCM` hook when components mount. The hook:
- Registers for push notifications
- Sends token to backend
- Sets up notification listeners
- Provides test notification functions

Example usage:
```typescript
const { 
  pushToken, 
  isRegistered, 
  sendTestNotification,
  sendBackendTestNotification,
} = useFCM();
```

---

## Data Flow Summary

### Complete Flow

1. **ESP32 Device (Embedded)**
   - Reads MPU6050 sensor data (accelerometer + gyroscope)
   - Calculates roll, pitch, and tilt detection
   - Reads GPS data (latitude, longitude, altitude, satellites, fix status)
   - Sends sensor data via **Bluetooth Low Energy (BLE)** to mobile app
   - Sends GPS data via **BLE** to mobile app (same interval)
   - **Transmission interval: Every 2 seconds** (good balance between real-time monitoring and battery efficiency)
   - Sensor data format: `{ax, ay, az, roll, pitch, tilt_detected, timestamp}`
   - GPS data format: `{type: "gps_data", gps: {fix, satellites, latitude, longitude, altitude}}`

2. **Mobile App (Tier 1 - Client-Side)**
   - Receives sensor data via BLE connection
   - Receives GPS data via BLE connection (stored locally in DeviceContext)
   - Calculates G-force: `sqrt(ax² + ay² + az²)`
   - Checks thresholds:
     - G-force ≥ 8g (configurable)
     - Tilt ≥ 90° (configurable)
   - If threshold exceeded:
     - **Phase 1**: Logs to console with threshold details (<100ms)
     - **Phase 2**: Sends alert to backend API with sensor data + GPS location
   - GPS data stored locally only (not sent to backend until crash detected)
   - Continues receiving data every 2 seconds

3. **Backend (Tier 2 - AI Analysis)**
   - Receives threshold alert from mobile app (with GPS location if available)
   - Retrieves recent sensor data context (last 30 seconds from database)
   - Formats data for Gemini AI
   - Calls Gemini AI API for intelligent analysis
   - Processes AI response (is_crash, confidence, severity, reasoning)
   - If confirmed crash:
     - Creates CrashEvent in database (with GPS location)
     - Sends FCM push notification to mobile app (with GPS location)
     - Sends GPS location to all active loved ones (emergency contacts)
   - If false positive:
     - Logs for learning/improvement
     - Optionally notifies user of false alarm

4. **Firebase Cloud Messaging (FCM)**
   - Delivers push notification to mobile app (device owner)
   - Delivers push notification to loved ones (emergency contacts)
   - App receives notification (foreground/background/quit state)
   - Notification includes: severity, crash type, AI reasoning, GPS location, map link

5. **Mobile App (User Notification)**
   - Receives FCM push notification
   - Shows enhanced alert with AI analysis details
   - User can:
     - View crash details
     - Dismiss alert
     - Send emergency SOS
     - Provide feedback (true crash / false positive)

### Timing Breakdown

- **BLE Data Transmission**: Every 2 seconds (from ESP32 to mobile app)
- **Tier 1 (Client Threshold Check)**: <100ms (immediate, on-device calculation)
- **Rate Limiting Check**: <1ms (client-side throttling prevents excessive calls)
- **Tier 2 (Backend AI Analysis)**: 1-3 seconds (Gemini API call + processing)
- **FCM Delivery**: <1 second (push notification delivery)
- **Total Alert Time**: ~2-4 seconds from threshold trigger to user notification
- **Maximum Detection Latency**: ~4-6 seconds (2s data interval + 2-4s processing)
- **Minimum Interval Between Alerts**: Configurable (default: 15 seconds) - prevents API spam

**Note**: The 2-second data transmission interval is a good balance:
- **Fast enough** to detect crashes quickly (within 2-4 seconds)
- **Battery efficient** for ESP32 device (BLE is low power)
- **Manageable data volume** for processing and storage

---

## Configuration

### Threshold Configuration

**File**: `frontend/utils/constants.ts`

```typescript
export const CRASH_DETECTION_CONFIG = {
  gForceThreshold: 8.0,        // G-force threshold (8g)
  tiltThreshold: 90.0,         // Tilt threshold (90 degrees)
  consecutiveTriggers: 2,      // Require 2 consecutive triggers
  lookbackSeconds: 30,         // Context window for AI (30 seconds)
  crashAlertIntervalSeconds: 15, // Minimum interval between crash alert API calls (configurable)
} as const;
```

### Rate Limiting Configuration

**File**: `frontend/lib/storage.ts`

The crash alert interval is stored in SecureStore and can be configured via the Settings page:
- **Default**: 15 seconds
- **Range**: 1-300 seconds
- **Storage Key**: `sentry_crash_alert_interval`
- **Auto-refresh**: Interval setting is reloaded every 5 seconds to pick up changes

**File**: `frontend/app/(tabs)/settings.tsx`

Users can configure the crash alert interval in the Settings page under "Crash Detection" section.

### API Authentication Configuration

**File**: `frontend/lib/api.ts`

Device API endpoints use API key authentication:
- **Header**: `X-API-Key`
- **Environment Variable**: `EXPO_PUBLIC_DEVICE_API_KEY`
- **Scope**: Applied to all device endpoints except `/mobile/*` (which use JWT)
- **Warning**: Shows console warning if API key is not configured

### Backend Configuration

**File**: `backend/sentry/sentry/settings/config.py`

```python
# Gemini AI
gemini_api_key: str | None = None
gemini_model: str = "gemini-pro"
gemini_analysis_lookback_seconds: int = 30

# FCM
fcm_credentials_path: str | None = None

# Crash Detection
crash_confidence_threshold: float = 0.7  # Minimum confidence for alert
crash_high_severity_g_force: float = 15.0
crash_medium_severity_g_force: float = 12.0
```

---

## Testing Strategy

### Tier 1 Testing (Client)

1. **Unit Tests**
   - Test threshold calculations
   - Test G-force and tilt calculations
   - Test consecutive trigger logic

2. **Integration Tests**
   - Test API calls to backend (Phase 2)
   - Test console logging on threshold (Phase 1)
   - Test hook behavior

### Tier 2 Testing (Backend)

1. **Unit Tests**
   - Test Gemini service
   - Test FCM service
   - Test crash event creation

2. **Integration Tests**
   - Test full flow: alert → AI → notification
   - Test with mock Gemini responses
   - Test FCM token management

### End-to-End Testing

1. **Simulate Crash**
   - Send high G-force data from mobile app
   - **Phase 1**: Verify console log shows threshold exceeded
   - **Phase 2**: Verify backend AI analysis
   - **Phase 2**: Verify FCM push notification

2. **False Positive Testing**
   - Send normal sensor data
   - Verify no alerts triggered
   - Verify AI correctly identifies false positive

---

## Performance Considerations

### Client-Side (Tier 1)

- **CPU Usage**: Minimal (simple math calculations)
- **Battery Impact**: Low (no network calls for threshold check)
- **Memory**: Minimal (only stores recent trigger history)

### Backend (Tier 2)

- **Response Time**: 1-3 seconds (Gemini API latency)
- **Cost**: Only calls Gemini when threshold triggered (cost optimization)
- **Scalability**: Use async task queue (Celery) for high volume

### Optimization Strategies

1. **Client-Side**
   - Debounce threshold checks (check every N readings, not every reading)
   - Use Web Workers for calculations if needed
   - Cache threshold config

2. **Backend**
   - Cache recent sensor data queries
   - Use connection pooling for database
   - Batch FCM notifications if multiple devices

---

## Security Considerations

1. **API Authentication**
   - Use device API key for device endpoints
   - Use JWT for user endpoints

2. **FCM Token Security**
   - Store tokens securely in database
   - Validate tokens before sending notifications
   - Implement token refresh mechanism

3. **Data Privacy**
   - Encrypt sensitive sensor data
   - Anonymize data for AI analysis if needed
   - Comply with GDPR/privacy regulations

---

## Future Enhancements

1. **Offline Support**
   - Queue threshold alerts when offline
   - Sync when connection restored

2. **Machine Learning**
   - Train custom model on collected data
   - Improve threshold accuracy

3. **Multi-Device Support**
   - Aggregate analysis across multiple devices
   - Fleet-level insights

4. **Emergency Services Integration**
   - Auto-dial emergency services for high-severity crashes
   - Include location data

---

## Conclusion

This two-tier approach provides:
- **Speed**: Immediate alerts via client-side threshold detection
- **Accuracy**: AI confirmation reduces false positives
- **User Experience**: Fast response with intelligent analysis
- **Cost Efficiency**: Only calls Gemini API when needed

The hybrid system balances the need for immediate alerts with intelligent analysis, providing the best of both worlds.

