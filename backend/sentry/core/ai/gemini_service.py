"""Gemini AI service for crash analysis."""

import json
import logging
from typing import Any

try:
    import google.genai as genai
except ImportError:
    genai = None  # type: ignore

from sentry.settings.config import settings as app_settings

logger = logging.getLogger(__name__)


class GeminiService:
    """Service for interacting with Google Gemini AI."""

    def __init__(self) -> None:
        """Initialize Gemini service."""
        self.client = None
        self.model_name = app_settings.gemini_model

        if genai is None:
            logger.warning("google-genai package not installed")
            return

        if not app_settings.gemini_api_key:
            logger.warning("Gemini API key not configured")
            return

        # Initialize client with API key
        try:
            self.client = genai.Client(api_key=app_settings.gemini_api_key)
            # Try to list available models to verify connection and find working model
            self._verify_model_availability()
        except Exception as e:
            logger.error("Failed to initialize Gemini client: %s", e)
            self.client = None

    def _verify_model_availability(self) -> None:
        """Verify that the configured model is available, or suggest alternatives."""
        if self.client is None:
            return
        
        try:
            # List available models
            models = list(self.client.models.list())
            available_model_names = [model.name for model in models if hasattr(model, 'name')]
            
            if available_model_names:
                logger.info(
                    "[INFO] Available Gemini models: %s",
                    ", ".join(available_model_names[:10])  # Show first 10
                )
                
                # Check if configured model is available
                # Model names might be in format like "models/gemini-1.5-flash" or just "gemini-1.5-flash"
                model_found = False
                for model_name in available_model_names:
                    if self.model_name in model_name or model_name.endswith(self.model_name):
                        model_found = True
                        # Update to use the full model name from API
                        if "/" in model_name:
                            self.model_name = model_name.split("/")[-1]  # Extract just the model part
                        break
                
                if not model_found:
                    # Try to find a suitable alternative
                    for model_name in available_model_names:
                        if "flash" in model_name.lower() or "pro" in model_name.lower():
                            suggested = model_name.split("/")[-1] if "/" in model_name else model_name
                            logger.warning(
                                "[WARN] Configured model '%s' not found. Suggested alternative: '%s'",
                                app_settings.gemini_model,
                                suggested,
                            )
                            break
        except Exception as e:
            logger.warning("Could not list available models: %s", e)

    def format_sensor_data_for_ai(
        self,
        sensor_data: list[dict[str, Any]],
        current_reading: dict[str, Any],
        include_metrics: bool = True,
    ) -> str:
        """Format sensor data for AI analysis.

        Args:
            sensor_data: List of sensor readings from database
            current_reading: Current sensor reading that triggered alert
            include_metrics: Whether to include calculated metrics

        Returns:
            Formatted string for AI prompt
        """
        lines = ["=== SENSOR DATA CONTEXT ==="]

        # Add recent sensor data
        if sensor_data:
            lines.append(f"\nRecent sensor readings ({len(sensor_data)} readings):")
            for reading in sensor_data[-10:]:  # Last 10 readings
                lines.append(
                    f"  - Time: {reading.get('timestamp', 'N/A')}, "
                    f"Accel: ({reading.get('ax', 0):.2f}, {reading.get('ay', 0):.2f}, {reading.get('az', 0):.2f}), "
                    f"Tilt: roll={reading.get('roll', 0):.1f}°, pitch={reading.get('pitch', 0):.1f}°"
                )

        # Add current reading (the one that triggered alert)
        lines.append("\n=== CURRENT READING (ALERT TRIGGER) ===")
        lines.append(
            f"Acceleration: ({current_reading.get('ax', 0):.2f}, "
            f"{current_reading.get('ay', 0):.2f}, {current_reading.get('az', 0):.2f})"
        )
        lines.append(
            f"Tilt: roll={current_reading.get('roll', 0):.1f}°, pitch={current_reading.get('pitch', 0):.1f}°"
        )
        lines.append(f"Tilt detected: {current_reading.get('tilt_detected', False)}")

        if include_metrics:
            # Calculate G-force for current reading
            ax = current_reading.get("ax", 0)
            ay = current_reading.get("ay", 0)
            az = current_reading.get("az", 0)
            g_force = (ax**2 + ay**2 + az**2) ** 0.5 / 9.81
            lines.append(f"Calculated G-force: {g_force:.2f}g")

        return "\n".join(lines)

    def analyze_crash_data(
        self,
        sensor_data: list[dict[str, Any]],
        current_reading: dict[str, Any],
        context_seconds: int = 30,
    ) -> dict[str, Any]:
        """Analyze crash data using Gemini AI.

        Args:
            sensor_data: List of sensor readings from database
            current_reading: Current sensor reading that triggered alert
            context_seconds: Number of seconds of context to analyze

        Returns:
            Dictionary containing AI analysis results:
            {
                'is_crash': bool,
                'confidence': float (0-1),
                'severity': 'low'|'medium'|'high',
                'crash_type': str,
                'reasoning': str,
                'key_indicators': list[str],
                'false_positive_risk': float (0-1)
            }
        """
        if not app_settings.gemini_api_key:
            logger.error("Gemini API key not configured")
            return self._default_response()

        try:
            # Format sensor data
            formatted_data = self.format_sensor_data_for_ai(
                sensor_data=sensor_data,
                current_reading=current_reading,
                include_metrics=True,
            )

            # Create prompt
            prompt = f"""You are analyzing sensor data from a motorcycle helmet crash detection system. 
A threshold alert was triggered (G-force or tilt exceeded limits).

{formatted_data}

Analyze this data and determine if this represents an actual crash event or a false positive (e.g., sudden braking, helmet removal, normal riding).

Respond with a JSON object containing:
{{
    "is_crash": boolean,
    "confidence": float (0.0 to 1.0),
    "severity": "low" | "medium" | "high",
    "crash_type": string (e.g., "frontal_impact", "side_impact", "fall", "false_positive"),
    "reasoning": string (brief explanation),
    "key_indicators": array of strings (e.g., ["high_g_force", "sudden_tilt", "sustained_acceleration"]),
    "false_positive_risk": float (0.0 to 1.0)
}}

Important considerations:
- High G-force alone might be sudden braking (false positive)
- Sustained tilt might indicate actual crash or helmet removal
- Look at the pattern over time, not just the current reading
- Consider motorcycle riding context (acceleration, braking, cornering)

Respond with ONLY the JSON object, no additional text."""

            # Call Gemini API
            if self.client is None:
                logger.error("Gemini client not initialized")
                return self._default_response()

            # Log comprehensive AI analysis request
            logger.info(
                "[AI] Calling Gemini AI for crash analysis | model=%s | "
                "sensor_data_points=%s | context_seconds=%s | "
                "current_reading: ax=%.2f, ay=%.2f, az=%.2f | "
                "roll=%.1f deg, pitch=%.1f deg | "
                "tilt_detected=%s | prompt_length=%s",
                self.model_name,
                len(sensor_data),
                context_seconds,
                current_reading.get('ax', 0),
                current_reading.get('ay', 0),
                current_reading.get('az', 0),
                current_reading.get('roll', 0),
                current_reading.get('pitch', 0),
                current_reading.get('tilt_detected', False),
                len(prompt),
            )

            # Generate content using the new API
            # Note: The exact API structure for google.genai may vary
            # Please refer to the official documentation: https://github.com/google-gemini/generative-ai-python
            
            # Try different model name formats and fallback models
            # v1beta API has deprecated many models, so we try multiple options
            models_to_try = [
                self.model_name,  # Try configured model first
                f"models/{self.model_name}",  # Try with models/ prefix
            ]
            
            # Add fallback models (newer models that should work)
            fallback_models = [
                "gemini-2.0-flash-exp",
                "models/gemini-2.0-flash-exp",
                "gemini-2.5-flash",
                "models/gemini-2.5-flash",
                "gemini-pro",
                "models/gemini-pro",
            ]
            
            # Only add fallbacks if they're different from configured model
            for fallback in fallback_models:
                if fallback not in models_to_try and self.model_name not in fallback:
                    models_to_try.append(fallback)
            
            response = None
            last_error = None
            for model_to_try in models_to_try:
                try:
                    logger.debug("[DEBUG] Trying model: %s", model_to_try)
                    response = self.client.models.generate_content(
                        model=model_to_try,
                        contents=prompt,
                    )
                    # Success! Update model_name for future use
                    if model_to_try != self.model_name and model_to_try != f"models/{self.model_name}":
                        logger.info(
                            "[INFO] Successfully using fallback model: %s (configured: %s)",
                            model_to_try,
                            self.model_name,
                        )
                        # Store without models/ prefix for consistency
                        self.model_name = model_to_try.split("/")[-1]
                    break
                except Exception as e:
                    last_error = e
                    error_str = str(e)
                    # If it's a 404/model not found, try next model
                    if "404" in error_str or "not found" in error_str.lower():
                        continue
                    # For other errors, re-raise immediately
                    raise
            
            if response is None:
                # All models failed
                raise last_error or Exception("All model attempts failed")

            # Parse response - access text from the response object
            # The exact structure may vary between API versions, so we handle multiple formats
            response_text = ""
            if hasattr(response, 'text'):
                response_text = response.text.strip()
            elif hasattr(response, 'candidates') and response.candidates:
                # Handle candidate-based response structure
                if hasattr(response.candidates[0], 'content'):
                    if hasattr(response.candidates[0].content, 'parts'):
                        response_text = response.candidates[0].content.parts[0].text.strip()
                    elif hasattr(response.candidates[0].content, 'text'):
                        response_text = response.candidates[0].content.text.strip()
            elif hasattr(response, 'content'):
                # Handle direct content attribute
                if hasattr(response.content, 'text'):
                    response_text = response.content.text.strip()
                elif hasattr(response.content, 'parts'):
                    response_text = response.content.parts[0].text.strip()
            
            if not response_text:
                # Fallback: try to extract text from response string representation
                logger.warning("Could not extract text from response, using string representation")
                response_text = str(response).strip()

            # Remove markdown code blocks if present
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()

            # Parse JSON
            result = json.loads(response_text)

            # Validate and sanitize response
            ai_result = {
                "is_crash": bool(result.get("is_crash", False)),
                "confidence": float(result.get("confidence", 0.5)),
                "severity": result.get("severity", "low"),
                "crash_type": str(result.get("crash_type", "unknown")),
                "reasoning": str(result.get("reasoning", "Analysis completed")),
                "key_indicators": result.get("key_indicators", []),
                "false_positive_risk": float(result.get("false_positive_risk", 0.5)),
            }

            # Log comprehensive AI analysis result
            logger.info(
                "[OK] Gemini AI analysis complete | model=%s | "
                "is_crash=%s | confidence=%.2f | "
                "severity=%s | crash_type=%s | "
                "false_positive_risk=%.2f | "
                "key_indicators=%s | "
                "reasoning_length=%s | "
                "reasoning=%s...",
                self.model_name,
                ai_result['is_crash'],
                ai_result['confidence'],
                ai_result['severity'],
                ai_result['crash_type'],
                ai_result['false_positive_risk'],
                len(ai_result['key_indicators']),
                len(ai_result['reasoning']),
                ai_result['reasoning'][:150],
            )

            return ai_result

        except json.JSONDecodeError as e:
            logger.error(
                "[ERROR] Failed to parse Gemini response as JSON | model=%s | "
                "error=%s | response_text_length=%s | response_preview=%s...",
                self.model_name,
                str(e),
                len(response_text),
                response_text[:200],
            )
            return self._default_response()
        except Exception as e:
            error_str = str(e)
            logger.error(
                "[ERROR] Error calling Gemini API | model=%s | error=%s | error_type=%s",
                self.model_name,
                error_str,
                type(e).__name__,
                exc_info=True,
            )
            
            # If model not found, suggest alternative models
            if "404" in error_str or "not found" in error_str.lower():
                logger.warning(
                    "[WARN] Model '%s' not available. Try: 'gemini-1.5-flash' or 'gemini-pro'",
                    self.model_name,
                )
            
            return self._default_response()

    def _default_response(self) -> dict[str, Any]:
        """Return default response when AI fails.

        Returns:
            Default response dictionary
        """
        return {
            "is_crash": False,
            "confidence": 0.5,
            "severity": "low",
            "crash_type": "unknown",
            "reasoning": "AI analysis unavailable - defaulting to false positive",
            "key_indicators": [],
            "false_positive_risk": 0.8,
        }

