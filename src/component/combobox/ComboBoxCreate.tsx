import i18next from "i18next";
import { useState, useEffect } from "react";

interface ComboBoxListProps<T extends { name: string }> {
  listData: T[];
  select?: T;
  onSelectItem: (item: T) => void;
  onSearch?: (val: string) => void;
}

export default function ComboBoxCreate<T extends {
    name: string; isNew?: any
}>({
  listData,
  select,
  onSelectItem,
  onSearch,
}: ComboBoxListProps<T>) {
  const [search, setSearch] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    onSearch?.(search);
  }, [search]);

  return (
    <div className="relative w-64">
      <input
        className="w-full border rounded px-2 py-1"
        value={select?.name || search}
        onChange={(e) => {
          onSelectItem({} as T);
          setSearch(e.target.value);
        }}
        onFocus={() => setShowCreateModal(true)}
        onBlur={() => setShowCreateModal(false)}
        placeholder={i18next.t("findOrCreate") + " ..."}
      />
      {showCreateModal && (
        <ul className="absolute bg-white  rounded  w-full max-h-60 z-10">
          {listData.map((item, index) => (
            <li
              key={(item as any).id ?? index}
              className="px-2 py-1 hover:bg-gray-100 border cursor-pointer"
              onMouseDown={() => {
                onSelectItem(item);
              }}
            >
              {item.name}{" "}
              {item.isNew && <span className="text-blue-500">(Tạo mới)</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
