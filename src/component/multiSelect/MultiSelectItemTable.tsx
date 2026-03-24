import i18next from "i18next";
import React, { useState, useRef, useEffect } from "react";

type KeyNameProps = {
  id: string;
  name: string;
};

const optionsList: KeyNameProps[] = [
  { id: "1", name: "Mainboard ASUS" },
  { id: "2", name: "CPU Intel i7" },
  { id: "3", name: "RAM 16GB" },
  { id: "4", name: "SSD 1TB" },
  { id: "5", name: "GPU RTX 4070" },
  { id: "6", name: "PSU 750W" },
  { id: "7", name: "Case RGB" },
  { id: "8", name: "Cooler Liquid" },
];

export default function MultiSelectWithTable() {
  const [selected, setSelected] = useState<KeyNameProps[]>([]);
  const [searchText, setSearchText] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredOptions = optionsList.filter(
    (opt) =>
      opt.name.toLowerCase().includes(searchText.toLowerCase()) &&
      !selected.some((s) => s.id === opt.id)
  );

  const handleSelect = (item: KeyNameProps) => {
    setSelected((prev) => [...prev, item]);
    setSearchText("");
  };

  const handleRemove = (id: string) => {
    setSelected((prev) => prev.filter((item) => item.id !== id));
  };

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
    <div className="w-full max-w-2xl mx-auto mt-10">
      {/* Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <div
          className="p-2 border rounded bg-white cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="text-gray-600">
            {i18next.t("selectComponent")}...
          </span>
        </div>

        {isOpen && (
          <div className="absolute w-full bg-white border rounded shadow mt-1 z-10">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder={`${i18next.t("findComponent")}...`}
              className="w-full p-2 border-b outline-none"
            />
            <ul className="max-h-60 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <li className="p-2 text-gray-400">
                  {i18next.t("componentNotFound")}
                </li>
              ) : (
                filteredOptions.map((item) => (
                  <li
                    key={item.id}
                    className="p-2 hover:bg-blue-100 cursor-pointer"
                    onClick={() => handleSelect(item)}
                  >
                    {item.name}
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Table display */}
      <table className="mt-6 w-full border border-gray-300 text-sm">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-2 border">#</th>
            <th className="p-2 border">Tên linh kiện</th>
            <th className="p-2 border text-center">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {selected.map((item, index) => (
            <tr key={item.id} className="border-t">
              <td className="p-2 border">{index + 1}</td>
              <td className="p-2 border">{item.name}</td>
              <td className="p-2 border text-center">
                <button
                  onClick={() => handleRemove(item.id)}
                  className="text-red-500 hover:underline"
                >
                  Xoá
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
