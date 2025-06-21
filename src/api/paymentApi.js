const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

async function apiRequest(url, options = {}) {
  const headers = {
    "Content-Type": "application/json",
  };
  const requestOptions = {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  };

  try {
    const res = await fetch(url, requestOptions);
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (jsonErr) {
      data = text;
    }
    if (!res.ok) {
      console.error("[PaymentAPI][API ERROR]", {
        url,
        status: res.status,
        statusText: res.statusText,
        response: data,
      });
      throw new Error((data && data.message) || res.statusText);
    }

    return data;
  } catch (err) {
    console.error("[PaymentAPI][API FETCH ERROR]", {
      url,
      error: err,
    });
    throw err;
  }
}

export function createCheckoutSession(data) {
  const functionName = "createcheckoutsession";
  return apiRequest(`https://${functionName}-${API_BASE_URL}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}
