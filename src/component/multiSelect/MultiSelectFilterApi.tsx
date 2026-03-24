import React, { useState, useRef, useEffect } from "react";
import { KeyNameProps } from "@type";
import colors from "@setup_assets/color/colors";
import TextBaseTranslate from "@component/text/TextbaseTranslate";
import i18next from "i18next";

interface MultiSelectFilterApiProps {
  listData: KeyNameProps[];
  onChange?: (val: KeyNameProps[])=>void
}

export default function MultiSelectFilterApi(props: MultiSelectFilterApiProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selected, setSelected] = useState<KeyNameProps[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredOptions = props.listData.filter(
    (opt) =>
      opt.name.toLowerCase().includes(searchText.toLowerCase()) &&
      !selected.find((sel) => sel.id === opt.id)
  );

  const toggleOption = (option: KeyNameProps) => {
    setSelected((prev) => [...prev, option]);
    setSearchText("");
  };

  const removeOption = (id: string) => {
    setSelected((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  useEffect(()=>{
    !!props.onChange && props.onChange(selected);
  }, [selected])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="w-96 relative" ref={dropdownRef}>
      {/* Selected tags */}
      <div
        className="p-2 border rounded-md bg-white flex flex-wrap gap-2 min-h-[44px] cursor-pointer"
        onClick={toggleDropdown}
      >
        {selected.length === 0 ? (
          <TextBaseTranslate text="selectOption" IStyles={{color: colors.white}}/>
        ) : (
          selected.map((opt) => (
            <span
              key={opt.id}
              className="bg-blue-100 text-blue-700 px-2 py-1 rounded flex items-center"
            >
              {opt.name}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeOption(opt.id);
                }}
                className="ml-1 text-red-500 hover:text-red-700"
              >
                &times;
              </button>
            </span>
          ))
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full bg-white border border-gray-300 rounded shadow mt-1 z-10">
          <input
            type="text"
            placeholder="Search..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full p-2 border-b outline-none"
          />
          <ul className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <li className="p-2 text-gray-400">
                {i18next.t("noOptionFound")}
              </li>
            ) : (
              filteredOptions.map((opt) => (
                <li
                  key={opt.id}
                  onClick={() => toggleOption(opt)}
                  className="p-2 hover:bg-blue-100 cursor-pointer"
                >
                  {opt.name}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
