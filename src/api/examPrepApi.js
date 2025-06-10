// Exam Prep API Utility
// Each endpoint has a unique base URL (no shared BASE_URL)

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
    "https://purchaseexamprepplan-zzpsx27htq-uc.a.run.app",
    {
      method: "POST",
      body: JSON.stringify({ studentId }),
    },
    token,
  );
}

export function bookIntroductoryCall(data, token) {
  return apiRequest(
    "https://bookintroductorycall-zzpsx27htq-uc.a.run.app",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    token,
  );
}

export function markIntroCallDone(data, token) {
  return apiRequest(
    "https://markintrocalldone-zzpsx27htq-uc.a.run.app",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    token,
  );
}

export function bookExamPrepClass(data, token) {
  return apiRequest(
    "https://bookexamprepclass-zzpsx27htq-uc.a.run.app",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    token,
  );
}

export function getExamPrepStatus(studentId, token) {
  return apiRequest(
    `https://getexamprepstatus-zzpsx27htq-uc.a.run.app?studentId=${encodeURIComponent(studentId)}`,
    {
      method: "GET",
    },
    token,
  );
}

export function setIntroCallSlots(data, token) {
  return apiRequest(
    "https://setintroductorycallslots-zzpsx27htq-uc.a.run.app",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    token,
  );
}

export function setExamPrepClassSlots(data, token) {
  return apiRequest(
    "https://setexamprepclassslots-zzpsx27htq-uc.a.run.app",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    token,
  );
}

export function getIntroCallSlots(tutorId, token) {
  return apiRequest(
    `https://getintroductorycallslots-zzpsx27htq-uc.a.run.app?tutorId=${encodeURIComponent(tutorId)}`,
    {
      method: "GET",
    },
    token,
  );
}

export function getExamPrepClassSlots(tutorId, token) {
  return apiRequest(
    `https://getexamprepclassslots-zzpsx27htq-uc.a.run.app?tutorId=${encodeURIComponent(tutorId)}`,
    {
      method: "GET",
    },
    token,
  );
}

export function testGrantExamPrepPlan(studentId, tutorId, token) {
  return apiRequest(
    "https://testgrantexamprepplan-zzpsx27htq-uc.a.run.app",
    {
      method: "POST",
      body: JSON.stringify({ studentId, tutorId }),
    },
    token,
  );
}

export function getUserChannels(data, token) {
  return apiRequest(
    "https://getuserchannels-zzpsx27htq-uc.a.run.app",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    token,
  );
}

export function getTutorClasses(tutorId, token) {
  return apiRequest(
    `https://gettutorclasses-zzpsx27htq-uc.a.run.app?tutorId=${encodeURIComponent(tutorId)}`,
    {
      method: "GET",
    },
    token,
  );
}

export function getStudentClasses(studentId, token) {
  return apiRequest(
    `https://getstudentclasses-zzpsx27htq-uc.a.run.app?studentId=${encodeURIComponent(studentId)}`,
    {
      method: "GET",
    },
    token,
  );
}

export function getExamPrepStepStatus(studentId, tutorId, token) {
  return apiRequest(
    `https://getexamprepstepstatus-zzpsx27htq-uc.a.run.app?studentId=${encodeURIComponent(studentId)}&tutorId=${encodeURIComponent(tutorId)}`,
    {
      method: "GET",
    },
    token,
  );
}

export function getExamPrepPlanTimeline(studentId, token) {
  return apiRequest(
    `https://getexamprepplantimeline-zzpsx27htq-uc.a.run.app?studentId=${encodeURIComponent(studentId)}`,
    {
      method: "GET",
    },
    token,
  );
}

export function getStudentExamPrepTutorialStatus(studentId, token) {
  return apiRequest(
    `https://getstudentexampreptutorialstatus-zzpsx27htq-uc.a.run.app?studentId=${encodeURIComponent(studentId)}`,
    {
      method: "GET",
    },
    token,
  );
}

export function getTutorProfile(tutorId, token) {
  return apiRequest(
    `https://gettutorprofile-zzpsx27htq-uc.a.run.app?tutorId=${encodeURIComponent(tutorId)}`,
    {
      method: "GET",
    },
    token,
  );
}

export function updateTutorProfile(data, token) {
  return apiRequest(
    "https://updatetutorprofile-zzpsx27htq-uc.a.run.app",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    token,
  );
}

export function getExamPrepCurrentStep(studentId, token) {
  return apiRequest(
    `https://getexamprepcurrentstep-zzpsx27htq-uc.a.run.app?studentId=${encodeURIComponent(studentId)}`,
    {
      method: "GET",
    },
    token,
  );
}

//dummy just to check if the api is working
export function getExamPrepStepStatusMock(studentId, tutorId, token) {
  return apiRequest(
    `https://getexamprepstepstatusdev-zzpsx27htq-uc.a.run.app?studentId=${encodeURIComponent(studentId)}&tutorId=${encodeURIComponent(tutorId)}`,
    {
      method: "GET",
    },
    token,
  );
}

// Add more as needed for new endpoints
