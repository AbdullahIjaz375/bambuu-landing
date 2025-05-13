import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const ShowDescription = ({ description, maxHeight = 200 }) => {
  const [expanded, setExpanded] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    // Check if content height exceeds maxHeight to determine if we need the "See More" button
    if (contentRef.current && contentRef.current.scrollHeight > maxHeight) {
      setShowButton(true);
    }
  }, [description, maxHeight]);

  // Function to toggle expanded state
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  // Handle description text to properly break long words without spaces
  const formatDescription = (text) => {
    // If text is null or undefined, return empty string
    if (!text) return '';
    
    // Return the text as is, word-break CSS will handle the display
    return text;
  };

  return (
    <div className="w-full m-1">
      <div
        ref={contentRef}
        className={`text-gray-600 overflow-hidden transition-all duration-300 break-words whitespace-pre-line`}
        style={{
          maxHeight: expanded ? 'none' : `${maxHeight}px`,
          wordBreak: 'break-word',
          overflowWrap: 'break-word'
        }}
      >
        {formatDescription(description)}
      </div>
      <div 
      className='w-full flex justify-center align-middle '
      >
      {showButton && (
        <button 
          onClick={toggleExpanded} 
          className="flex justify-center items-center gap-1 text-[#042F0C] font-medium mt-2 focus:outline-none"
        >
          {expanded ? (
            <>
              See Less <ChevronUp size={16} />
            </>
          ) : (
            <>
              See More <ChevronDown size={16} />
            </>
          )}
        </button>
      )}
      </div>
     
    </div>
  );
};

export default ShowDescription;