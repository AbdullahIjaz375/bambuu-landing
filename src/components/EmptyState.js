import React from "react";
import { Info } from "lucide-react";

const EmptyState = ({ message = "No items found" }) => {
  return (
    <div className="p-4">
      <div className="flex flex-col items-center justify-center space-y-2">
        <img src="/svgs/empty-big.svg" alt="bammbuu" />
        <p className="text-lg text-gray-600">{message}</p>
      </div>
    </div>
  );
};

export default EmptyState;
