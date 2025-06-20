// Exam Prep API Utility
// Each endpoint has a unique base URL (no shared BASE_URL)

const API_BASE_URL_PROD = "3idvfneyra-uc.a.run.app";
const API_BASE_URL_DEV = "zzpsx27htq-uc.a.run.app";

// Set to true for production, false for development
const IS_PROD = true;

const API_BASE_URL = IS_PROD ? API_BASE_URL_PROD : API_BASE_URL_DEV;

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
    `https://${
      IS_PROD
        ? "purchaseexamprepplan-3idvfneyra-uc.a.run.app"
        : "purchaseexamprepplan-zzpsx27htq-uc.a.run.app"
    }`,
    {
      method: "POST",
      body: JSON.stringify({ studentId }),
    },
    token,
  );
}

export function bookIntroductoryCall(data, token) {
  return apiRequest(
    `https://${
      IS_PROD
        ? "bookintroductorycall-3idvfneyra-uc.a.run.app"
        : "bookintroductorycall-zzpsx27htq-uc.a.run.app"
    }`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    token,
  );
}

export function markIntroCallDone(data, token) {
  return apiRequest(
    `https://${
      IS_PROD
        ? "markintrocalldone-3idvfneyra-uc.a.run.app"
        : "markintrocalldone-zzpsx27htq-uc.a.run.app"
    }`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    token,
  );
}

export function bookExamPrepClass(data, token) {
  return apiRequest(
    `https://${
      IS_PROD
        ? "bookexamprepclass-3idvfneyra-uc.a.run.app"
        : "bookexamprepclass-zzpsx27htq-uc.a.run.app"
    }`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    token,
  );
}

export function getExamPrepStatus(studentId, token) {
  return apiRequest(
    `https://${
      IS_PROD
        ? "getexamprepstatus-3idvfneyra-uc.a.run.app"
        : "getexamprepstatus-zzpsx27htq-uc.a.run.app"
    }?studentId=${encodeURIComponent(studentId)}`,
    {
      method: "GET",
    },
    token,
  );
}

export function setIntroCallSlots(data, token) {
  return apiRequest(
    `https://${
      IS_PROD
        ? "setintroductorycallslots-3idvfneyra-uc.a.run.app"
        : "setintroductorycallslots-zzpsx27htq-uc.a.run.app"
    }`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    token,
  );
}

export function setExamPrepClassSlots(data, token) {
  return apiRequest(
    `https://${
      IS_PROD
        ? "setexamprepclassslots-3idvfneyra-uc.a.run.app"
        : "setexamprepclassslots-zzpsx27htq-uc.a.run.app"
    }`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    token,
  );
}

export function getIntroCallSlots(tutorId, token) {
  return apiRequest(
    `https://${
      IS_PROD
        ? "getintroductorycallslots-3idvfneyra-uc.a.run.app"
        : "getintroductorycallslots-zzpsx27htq-uc.a.run.app"
    }?tutorId=${encodeURIComponent(tutorId)}`,
    {
      method: "GET",
    },
    token,
  );
}

export function getExamPrepClassSlots(tutorId, token) {
  return apiRequest(
    `https://${
      IS_PROD
        ? "getexamprepclassslots-3idvfneyra-uc.a.run.app"
        : "getexamprepclassslots-zzpsx27htq-uc.a.run.app"
    }?tutorId=${encodeURIComponent(tutorId)}`,
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

export function getUserChannels(userId, token) {
  return apiRequest(
    `https://getuserchannels-zzpsx27htq-uc.a.run.app?userId=${encodeURIComponent(userId)}`,
    { method: "GET" },
    token,
  ).then((res) => res.channels || []);
}

export function getTutorClasses(tutorId, token) {
  return apiRequest(
    `https://${
      IS_PROD
        ? "gettutorclasses-3idvfneyra-uc.a.run.app"
        : "gettutorclasses-zzpsx27htq-uc.a.run.app"
    }?tutorId=${encodeURIComponent(tutorId)}`,
    {
      method: "GET",
    },
    token,
  );
}

export function getStudentClasses(studentId, token) {
  return apiRequest(
    `https://${
      IS_PROD
        ? "getstudentclasses-3idvfneyra-uc.a.run.app"
        : "getstudentclasses-zzpsx27htq-uc.a.run.app"
    }?studentId=${encodeURIComponent(studentId)}`,
    {
      method: "GET",
    },
    token,
  );
}

export function getExamPrepStepStatus(studentId, tutorId, token) {
  return apiRequest(
    `https://${
      IS_PROD
        ? "getexamprepstepstatus-3idvfneyra-uc.a.run.app"
        : "getexamprepstepstatus-zzpsx27htq-uc.a.run.app"
    }?studentId=${encodeURIComponent(studentId)}&tutorId=${encodeURIComponent(
      tutorId,
    )}`,
    {
      method: "GET",
    },
    token,
  );
}

export function getExamPrepPlanTimeline(studentId, token) {
  return apiRequest(
    `https://${
      IS_PROD
        ? "getexamprepplantimeline-3idvfneyra-uc.a.run.app"
        : "getexamprepplantimeline-zzpsx27htq-uc.a.run.app"
    }?studentId=${encodeURIComponent(studentId)}`,
    {
      method: "GET",
    },
    token,
  );
}

export function getStudentExamPrepTutorialStatus(studentId, token) {
  return apiRequest(
    `https://${
      IS_PROD
        ? "getstudentexampreptutorialstatus-3idvfneyra-uc.a.run.app"
        : "getstudentexampreptutorialstatusdev-zzpsx27htq-uc.a.run.app"
    }?studentId=${encodeURIComponent(studentId)}`,
    {
      method: "GET",
    },
    token,
  );
}

export function getTutorProfile(tutorId, token) {
  return apiRequest(
    `https://${
      IS_PROD
        ? "gettutorprofile-3idvfneyra-uc.a.run.app"
        : "gettutorprofile-zzpsx27htq-uc.a.run.app"
    }?tutorId=${encodeURIComponent(tutorId)}`,
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
    `https://${
      IS_PROD
        ? "getexamprepcurrentstep-3idvfneyra-uc.a.run.app"
        : "getexamprepcurrentstep-zzpsx27htq-uc.a.run.app"
    }?studentId=${encodeURIComponent(studentId)}`,
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
