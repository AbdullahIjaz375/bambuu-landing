import { createContext, useContext, useState, useEffect } from "react";

export const ClassContext = createContext();

export const ClassProvider = ({ children }) => {
  const [selectedClassId, setSelectedClassId] = useState(() => {
    return JSON.parse(localStorage.getItem("selectedClassId")) ?? null;
  });

  const [selectedBreakoutRoom, setSelectedBreakoutRoom] = useState(() => {
    return JSON.parse(localStorage.getItem("selectedBreakoutRoom")) ?? null;
  });

  const [tutorSelectedClassId, setTutorSelectedClassId] = useState(() => {
    return JSON.parse(localStorage.getItem("tutorSelectedClassId")) ?? null;
  });

  const [tutorSelectedBreakoutRoom, setTutorSelectedBreakoutRoom] = useState(
    () => {
      return (
        JSON.parse(localStorage.getItem("tutorSelectedBreakoutRoom")) ?? null
      );
    }
  );

  useEffect(() => {
    localStorage.setItem("selectedClassId", JSON.stringify(selectedClassId));
  }, [selectedClassId]);

  useEffect(() => {
    localStorage.setItem(
      "selectedBreakoutRoom",
      JSON.stringify(selectedBreakoutRoom)
    );
  }, [selectedBreakoutRoom]);

  useEffect(() => {
    localStorage.setItem(
      "tutorSelectedClassId",
      JSON.stringify(tutorSelectedClassId)
    );
  }, [tutorSelectedClassId]);

  useEffect(() => {
    localStorage.setItem(
      "tutorSelectedBreakoutRoom",
      JSON.stringify(tutorSelectedBreakoutRoom)
    );
  }, [tutorSelectedBreakoutRoom]);

  return (
    <ClassContext.Provider
      value={{
        selectedClassId,
        setSelectedClassId,
        selectedBreakoutRoom,
        setSelectedBreakoutRoom,
        tutorSelectedClassId,
        setTutorSelectedClassId,
        tutorSelectedBreakoutRoom,
        setTutorSelectedBreakoutRoom,
      }}
    >
      {children}
    </ClassContext.Provider>
  );
};
