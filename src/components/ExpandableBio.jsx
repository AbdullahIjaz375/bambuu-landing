import { useState } from 'react';

export const ExpandableBio = ({ bio, maxChars = 150 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Check if bio is longer than maxChars
  const isBioTooLong = bio.length > maxChars;
  
  // Create preview text and remaining text
  const previewText = isBioTooLong ? bio.substring(0, maxChars) : bio;
  const remainingText = isBioTooLong ? bio.substring(maxChars) : '';
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  return (
    <div className="px-2 mb-6 overflow-y-auto max-h-80 ">
      <p className="text-sm text-gray-600">
        {isExpanded ? bio : previewText}
        {isBioTooLong && !isExpanded && '...'}
      </p>
      
      {isBioTooLong && (
        <button 
          onClick={toggleExpand} 
          className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800 focus:outline-none"
        >
          {isExpanded ? 'See less' : 'See more'}
        </button>
      )}
    </div>
  );
};