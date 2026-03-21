export function getApiErrorMessage(error, fallbackMessage) {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }

  if (error.response?.data?.details?.length) {
    return error.response.data.details.join(', ');
  }

  if (error.message) {
    return error.message;
  }

  return fallbackMessage;
}
