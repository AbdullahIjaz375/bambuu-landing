import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, X } from "lucide-react";

const CustomSelect = ({
  options = [],
  value = "",
  onChange,
  placeholder = "Select an option",
  icon,
  searchPlaceholder = "Search...",
  className = "",
  required = false,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState("bottom");
  const selectRef = useRef(null);
  const dropdownRef = useRef(null);
  const optionRefs = useRef([]);

  // Filter options based on search query
  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery("");
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Calculate dropdown position
  useEffect(() => {
    if (isOpen && selectRef.current) {
      const rect = selectRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = Math.min(filteredOptions.length * 48 + 60, 240); // Approximate height

      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        setDropdownPosition("top");
      } else {
        setDropdownPosition("bottom");
      }
    }
  }, [isOpen, filteredOptions.length]);

  // Scroll selected option into view when dropdown opens
  useEffect(() => {
    if (isOpen && value && optionRefs.current) {
      const selectedIndex = filteredOptions.findIndex(
        (option) => option === value,
      );
      if (selectedIndex !== -1 && optionRefs.current[selectedIndex]) {
        optionRefs.current[selectedIndex].scrollIntoView({ block: "nearest" });
      }
    }
  }, [isOpen, value, filteredOptions]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isOpen) return;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setHighlightedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : 0,
          );
          break;
        case "ArrowUp":
          event.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredOptions.length - 1,
          );
          break;
        case "Enter":
          event.preventDefault();
          if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
            handleOptionSelect(filteredOptions[highlightedIndex]);
          }
          break;
        case "Escape":
          setIsOpen(false);
          setSearchQuery("");
          setHighlightedIndex(-1);
          break;
        default:
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, highlightedIndex, filteredOptions]);

  const handleOptionSelect = (option) => {
    onChange(option);
    setIsOpen(false);
    setSearchQuery("");
    setHighlightedIndex(-1);
  };

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setSearchQuery("");
        setHighlightedIndex(-1);
      }
    }
  };

  const getDisplayValue = () => {
    if (value) {
      return value;
    }
    return placeholder;
  };

  const getSearchPlaceholder = () => {
    if (placeholder.includes("language")) {
      return "Search Language";
    } else if (placeholder.includes("country")) {
      return "Search Country";
    }
    return "Search...";
  };

  return (
    <div className={`relative ${className}`} ref={selectRef}>
      {/* Select Input */}
      <div
        className={`relative cursor-pointer rounded-full border border-gray-200 bg-white px-4 py-2 pl-10 transition-all duration-200 ${
          isOpen
            ? "border-green-500 ring-2 ring-green-500 ring-opacity-20"
            : "hover:border-gray-300"
        } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
        onClick={handleToggle}
      >
        {/* Icon */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {icon}
        </div>

        {/* Display Value or Search Input */}
        {isOpen ? (
          <input
            type="text"
            placeholder={getSearchPlaceholder()}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full border-0 bg-transparent text-sm focus:outline-none focus:ring-0 ${value ? "text-gray-900" : "text-gray-500"}`}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className={`block truncate ${value ? "text-gray-900" : "text-gray-500"}`}
          >
            {getDisplayValue()}
          </span>
        )}

        {/* Dropdown Arrow */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className={`absolute left-0 right-0 z-50 max-h-60 overflow-hidden rounded-2xl border border-green-500 bg-white shadow-lg ${
            dropdownPosition === "top" ? "bottom-full mb-1" : "top-full mt-1"
          }`}
        >
          {/* Options List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <div
                  key={option}
                  ref={(el) => (optionRefs.current[index] = el)}
                  className={`cursor-pointer text-sm transition-colors duration-150 ${
                    option === value
                      ? "font-medium"
                      : highlightedIndex === index
                        ? "bg-gray-50 text-gray-900"
                        : "text-gray-500 hover:bg-gray-50"
                  }`}
                  style={{
                    padding: "0 27px",
                    height: "24px",
                    display: "flex",
                    alignItems: "center",
                    backgroundColor:
                      option === value ? "#E6FDE9" : "transparent",
                    color: option === value ? "#042F0C" : undefined,
                    borderRadius: option === value ? "8px" : "0",
                    margin: "8px 8px 0 8px",
                  }}
                  onClick={() => handleOptionSelect(option)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  {option}
                </div>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-gray-500">
                No options found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
