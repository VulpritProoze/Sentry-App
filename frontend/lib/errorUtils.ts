/**
 * Helper function to extract error message from various error formats.
 * Handles Django Ninja ValidationError, standard API errors, and axios errors.
 * 
 * @param error - The error object from axios or API calls
 * @returns A user-friendly error message string
 */
export const extractErrorMessage = (error: any): string => {
  // Check for message field first (most common)
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  // Check for detail field (may be string or object)
  if (error?.response?.data?.detail) {
    const detail = error.response.data.detail;
    if (typeof detail === 'string') {
      return detail;
    }
    if (typeof detail === 'object') {
      // If detail is an object, try to extract meaningful message
      if (detail.message) {
        return detail.message;
      }
      if (detail.msg) {
        return detail.msg;
      }
      // If it's an array of errors, join them
      if (Array.isArray(detail)) {
        return detail.join(', ');
      }
      // Otherwise stringify the object
      return JSON.stringify(detail);
    }
  }

  // Check for Django Ninja ValidationError format (errors array)
  if (error?.response?.data?.errors && Array.isArray(error.response.data.errors)) {
    const errors = error.response.data.errors;
    const messages = errors.map((err: any) => {
      if (typeof err === 'string') return err;
      if (err?.message) return err.message;
      if (err?.field && err?.message) return `${err.field}: ${err.message}`;
      return JSON.stringify(err);
    });
    return messages.join(', ');
  }

  // Check for error field
  if (error?.response?.data?.error) {
    return error.response.data.error;
  }

  // Check for axios error message
  if (error?.message) {
    return error.message;
  }

  // Fallback
  return 'An unexpected error occurred';
};

