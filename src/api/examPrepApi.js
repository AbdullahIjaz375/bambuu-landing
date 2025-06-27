// Exam Prep API Utility
// Each endpoint has a unique base URL (no shared BASE_URL)

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

/**
 * Helper to make API requests
 * @param {string} url - Full endpoint URL
 * @param {object} options
 * @param {string} [token] - Optional auth token
 */
async function apiRequest(url, options = {}, token) {
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
      console.error("[ExamPrep][API ERROR]", {
        url,
        status: res.status,
        statusText: res.statusText,
        response: data,
      });
      throw new Error((data && data.message) || res.statusText);
    }

    return data;
  } catch (err) {
    console.error("[ExamPrep][API FETCH ERROR]", {
      url,
      error: err,
    });
    throw err;
  }
}

// --- API Endpoints ---

export function purchaseExamPrepPlan(studentId, token) {
  return apiRequest(
    `https://purchaseexamprepplan-${API_BASE_URL}`,
    {
      method: "POST",
      body: JSON.stringify({ studentId }),
    },
    token,
  );
}

export function bookIntroductoryCall(data, token) {
  return apiRequest(
    `https://bookintroductorycall-${API_BASE_URL}`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    token,
  );
}

export function markIntroCallDone(data, token) {
  return apiRequest(
    `https://markintrocalldone-${API_BASE_URL}`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    token,
  );
}

export function bookExamPrepClass(data, token) {
  return apiRequest(
    `https://bookexamprepclass-${API_BASE_URL}`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    token,
  );
}

export function getExamPrepStatus(studentId, token) {
  return apiRequest(
    `https://getexamprepstatus-${API_BASE_URL}?studentId=${encodeURIComponent(
      studentId,
    )}`,
    {
      method: "GET",
    },
    token,
  );
}

export function setIntroCallSlots(data, token) {
  return apiRequest(
    `https://setintroductorycallslots-${API_BASE_URL}`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    token,
  );
}

export function setExamPrepClassSlots(data, token) {
  return apiRequest(
    `https://setexamprepclassslots-${API_BASE_URL}`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    token,
  );
}

export function getIntroCallSlots(tutorId, token) {
  return apiRequest(
    `https://getintroductorycallslots-${API_BASE_URL}?tutorId=${encodeURIComponent(
      tutorId,
    )}`,
    {
      method: "GET",
    },
    token,
  );
}

export function getExamPrepClassSlots(tutorId, token) {
  return apiRequest(
    `https://getexamprepclassslots-${API_BASE_URL}?tutorId=${encodeURIComponent(
      tutorId,
    )}`,
    {
      method: "GET",
    },
    token,
  );
}

export function testGrantExamPrepPlan(studentId, tutorId, token) {
  return apiRequest(
    `https://testgrantexamprepplan-${API_BASE_URL}`,
    {
      method: "POST",
      body: JSON.stringify({ studentId, tutorId }),
    },
    token,
  );
}

export function getUserChannels(userId, token) {
  return apiRequest(
    `https://getuserchannels-${API_BASE_URL}?userId=${encodeURIComponent(userId)}`,
    { method: "GET" },
    token,
  ).then((res) => res.channels || []);
}

export function getTutorClasses(tutorId, token) {
  return apiRequest(
    `https://gettutorclasses-${API_BASE_URL}?tutorId=${encodeURIComponent(
      tutorId,
    )}`,
    {
      method: "GET",
    },
    token,
  );
}

export function getStudentClasses(studentId, token) {
  return apiRequest(
    `https://getstudentclasses-${API_BASE_URL}?studentId=${encodeURIComponent(
      studentId,
    )}`,
    {
      method: "GET",
    },
    token,
  );
}

export function getExamPrepStepStatus(studentId, tutorId, token) {
  return apiRequest(
    `https://getexamprepstepstatus-${API_BASE_URL}?studentId=${encodeURIComponent(
      studentId,
    )}&tutorId=${encodeURIComponent(tutorId)}`,
    {
      method: "GET",
    },
    token,
  );
}

export function getExamPrepPlanTimeline(studentId, token) {
  return apiRequest(
    `https://getexamprepplantimeline-${API_BASE_URL}?studentId=${encodeURIComponent(
      studentId,
    )}`,
    {
      method: "GET",
    },
    token,
  );
}

export function getStudentExamPrepTutorialStatus(studentId, token) {
  const functionName =
    process.env.NODE_ENV === "production"
      ? "getstudentexampreptutorialstatus"
      : "getstudentexampreptutorialstatusdev";
  return apiRequest(
    `https://${functionName}-${API_BASE_URL}?studentId=${encodeURIComponent(
      studentId,
    )}`,
    {
      method: "GET",
    },
    token,
  );
}

export function getTutorProfile(tutorId, token) {
  return apiRequest(
    `https://gettutorprofile-${API_BASE_URL}?tutorId=${encodeURIComponent(
      tutorId,
    )}`,
    {
      method: "GET",
    },
    token,
  );
}

export function updateTutorProfile(data, token) {
  return apiRequest(
    `https://updatetutorprofile-${API_BASE_URL}`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    token,
  );
}

export function getExamPrepCurrentStep(studentId, token) {
  return apiRequest(
    `https://getexamprepcurrentstep-${API_BASE_URL}?studentId=${encodeURIComponent(
      studentId,
    )}`,
    {
      method: "GET",
    },
    token,
  );
}

//dummy just to check if the api is working
export function getExamPrepStepStatusMock(studentId, tutorId, token) {
  return apiRequest(
    `https://getexamprepstepstatusdev-${API_BASE_URL}?studentId=${encodeURIComponent(
      studentId,
    )}&tutorId=${encodeURIComponent(tutorId)}`,
    {
      method: "GET",
    },
    token,
  );
}

// Add more as needed for new endpoints
