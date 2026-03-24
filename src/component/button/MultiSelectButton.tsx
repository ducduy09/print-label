import i18next from "i18next";
import React from "react";

interface Option {
  key: string;
  name: string;
}

interface MultiSelectButtonProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export default function MultiSelectButton({
  options,
  selected,
  onChange,
}: MultiSelectButtonProps) {
  
  const toggleOption = (key: string) => {
    if (selected.includes(key)) {
      onChange(selected.filter((item) => item !== key));
    } else {
      onChange([...selected, key]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isSelected = selected.includes(opt.key);
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => toggleOption(opt.key)}
            className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors
              ${isSelected 
                ? "border-orange-500 text-orange-500 bg-orange-50" 
                : "border-gray-400 text-gray-800 bg-white"
              }
            `}
          >
            {i18next.t(opt.name)}
          </button>
        );
      })}
    </div>
  );
}
