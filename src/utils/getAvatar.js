import React from "react";

// Function to generate avatar with the user's first letter
const getAvatar = (name) => {
  if (!name) return null;
  
  const firstLetter = name.charAt(0).toUpperCase();
  
  // Mapping letters to specific colors
  const letterColors = {
    A: '#FF6347', // Tomato
    B: '#6A5ACD', // SlateBlue
    C: '#32CD32', // LimeGreen
    D: '#FFD700', // Gold
    E: '#FF4500', // OrangeRed
    F: '#8A2BE2', // BlueViolet
    G: '#FF1493', // DeepPink
    H: '#00BFFF', // DeepSkyBlue
    I: '#8B0000', // DarkRed
    J: '#20B2AA', // LightSeaGreen
    K: '#D2691E', // Chocolate
    L: '#A52A2A', // Brown
    M: '#0000FF', // Blue
    N: '#228B22', // ForestGreen
    O: '#FFD700', // Gold
    P: '#D3D3D3', // LightGray
    Q: '#FF69B4', // HotPink
    R: '#A9A9A9', // DarkGray
    S: '#ADFF2F', // GreenYellow
    T: '#FF4500', // OrangeRed
    U: '#2E8B57', // SeaGreen
    V: '#8B008B', // DarkMagenta
    W: '#00FFFF', // Cyan
    X: '#FF6347', // Tomato
    Y: '#32CD32', // LimeGreen
    Z: '#FFD700', // Gold
  };

  // Default color if the letter is not mapped
  const color = letterColors[firstLetter] || '#808080'; // Gray as fallback

  return (
    <div
      style={{ backgroundColor: color }}
      className="flex items-center justify-center w-8 h-8 rounded-full md:w-9 md:h-9 text-white font-semibold"
    >
      {firstLetter}
    </div>
  );
};

const UserAvatar = ({ member }) => {
  return (
    <div>
      {/* Check if the photoUrl exists, else show the generated avatar */}
      {member.photoUrl ? (
        <img
          src={member.photoUrl}
          alt={member.name}
          className="object-cover w-8 h-8 rounded-full md:w-9 md:h-9"
        />
      ) : (
        getAvatar(member.name)
      )}
    </div>
  );
};

export default UserAvatar;
