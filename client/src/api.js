/**
 * API client module for Lab Aggregator.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/+$/, '')
  : '';

/**
 * Searches lab items based on test name / package name and 6-digit pincode.
 * @param {string} searchQuery - The test or package name to search
 * @param {string} pincode - Exactly 6 digits
 * @param {AbortSignal} [signal] - Optional abort signal
 * @returns {Promise<{ query: string, pincode: string, count: number, results: Array }>}
 */
export async function searchLabItems(searchQuery, pincode, signal) {
  const queryParams = new URLSearchParams({
    search_query: searchQuery.trim(),
    pincode: pincode.trim()
  });

  const url = `${API_BASE_URL}/api/search?${queryParams.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    },
    signal
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage = data.error || `Search failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  return data;
}

/**
 * Health check endpoint.
 */
export async function checkHealth() {
  const response = await fetch(`${API_BASE_URL}/api/health`);
  return response.json();
}
