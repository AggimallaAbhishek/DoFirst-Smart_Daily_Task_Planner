export function getApiErrorMessage(error, fallbackMessage) {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }

  if (error.response?.data?.details?.length) {
    return error.response.data.details.join(', ');
  }

  if (error.message) {
    if (error.code === 'ERR_NETWORK') {
      return 'Unable to reach the server. Check your internet connection and backend URL configuration.';
    }

    if (error.code === 'ECONNABORTED') {
      return 'Server response timed out. Please try again.';
    }

    return error.message;
  }

  return fallbackMessage;
}
