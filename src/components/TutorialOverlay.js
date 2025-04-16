import React, { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

const TutorialOverlay = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [showTutorial, setShowTutorial] = useState(false);
  const { user, setUser } = useAuth();
  
  useEffect(() => {
    // Check if user is coming from ProfileSetup by looking for URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const fromSetup = urlParams.get('fromSetup');
    
    // Check if tutorial was already completed
    const checkTutorialStatus = async () => {
      if (user?.uid) {
        const userDoc = await getDoc(doc(db, "students", user.uid));
        const userData = userDoc.data();
        
        if (fromSetup === 'true' || (userData && !userData.hasCompletedTutorial)) {
          setShowTutorial(true);
        }
      }
    };
    
    checkTutorialStatus();
  }, [user]);

  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTutorial();
    }
  };

  const handleSkip = async () => {
    completeTutorial();
  };

  const completeTutorial = async () => {
    setShowTutorial(false);
    
    // Update user record in Firestore to mark tutorial as completed
    if (user?.uid) {
      try {
        await updateDoc(doc(db, "students", user.uid), {
          hasCompletedTutorial: true
        });
        
        // Update local user state
        setUser(prev => ({
          ...prev,
          hasCompletedTutorial: true
        }));
      } catch (error) {
        console.error("Error updating tutorial status:", error);
      }
    }
    
    // Remove the URL parameter
    const url = new URL(window.location);
    url.searchParams.delete('fromSetup');
    window.history.replaceState({}, '', url);
  };

  if (!showTutorial) return null;

  let tooltipPosition = {};
  let tooltipContent = {};

  // Position and content based on current step
  if (currentStep === 1) {
    tooltipPosition = {
      top: '195px',
    left: '420px',
    transform: 'translateX(-50%)'
  };
    tooltipContent = {
      title: "Explore Certified Instructors ",
      description: "Book live 1:1 language classes with certified instructors to bring your language learning to the next level."
    };
  } else if (currentStep === 2) {
    tooltipPosition = {
      top: '120px',
      left: '370px',
    transform: 'translateX(-50%)'
  };
    tooltipContent = {
      title: "AI Tutor",
      description: "Practice 24/7 with our AI language SuperTutor. Ask SuperTutor for language translations and grammar questions. You can also have a practice conversation in the language you are learning!"
    };
  }

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div 
        className="absolute z-50 pointer-events-auto"
        style={tooltipPosition}
      >
        <div className="p-5 bg-[#042F0C] text-white rounded-2xl w-96">
          <h3 className="mb-2 text-sm font-medium">{tooltipContent.title}</h3>
          <p className="mb-4 text-sm">{tooltipContent.description}</p>
          <div className="flex items-center justify-between">
            <button 
              onClick={handleSkip} 
              className="text-white hover:underline"
            >
              Skip
            </button>
            <button
              onClick={handleNext}
              className="px-4 py-1 bg-white text-[#043D11] rounded-full hover:bg-opacity-90"
            >
              {currentStep === 2 ? "Done (4/4)" : "Next (3/4)"}
            </button>
          </div>
        </div>
        {/* Moved the notch to the left side of the popup */}
        <div className="absolute top-1/2 -left-2 transform -translate-y-1/2">
          <div className="w-0 h-0 border-t-8 border-b-8 border-r-8 border-transparent border-r-[#042F0C]" />
        </div>
      </div>
    </div>
  );
};

export default TutorialOverlay;