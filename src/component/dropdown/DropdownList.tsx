import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ChevronDown, Plus } from "lucide-react";
import i18next from "i18next";
import { KeyNameIconProps } from "@type";

interface DropdownListProps {
  list: KeyNameIconProps[];
  onSelect: (item: KeyNameIconProps) => void;
  label?: string;
}

export default function DropdownList({
  list,
  onSelect,
  label = "Menu",
}: DropdownListProps) {
  const handleSelect = (item: KeyNameIconProps) => {
    onSelect(item);
  };

  return (
    <Menu as="div" className="relative">
      <MenuButton className="flex items-center justify-between min-w-14 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition">
        <span>{label}</span>
        <ChevronDown size={16} className="text-gray-500" />
      </MenuButton>
      <MenuItems
        anchor="bottom start"
        className=" min-w-14 mt-1 origin-top-left z-50 rounded-lg bg-white shadow-lg ring-1 ring-black/5 transition"
      >
        <div className="py-1">
          {list != null && list.length > 0 ? (
            list.map((item) => (
              <MenuItem key={item.id}>
                <button key={item.id}
                  onClick={() => handleSelect(item)}
                  className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition group">
                  <div className="flex items-center gap-3">
                    <item.icon size={18} className="text-gray-500" />
                    <span className="text-sm text-gray-700">{item.name}</span>
                  </div>
                  <Plus size={18} className="text-gray-400 group-hover:text-teal-500" />
                </button>
              </MenuItem>
            ))
          ) : (
            <div className="px-4 py-2 text-sm text-gray-500">
              {i18next.t("noData")}
            </div>
          )}
        </div>
      </MenuItems>
    </Menu>
  );
}
