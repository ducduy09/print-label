import { useState } from "react";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import SVGS from "@setup_assets/image/svgs";
import i18next from "i18next";
import { KeyNameProps } from "@type";
interface DropdownButtonProps {
  list: KeyNameProps[];
  onSelect: (item: KeyNameProps) => void;
  dfChoose?: KeyNameProps | null,
  placeholder?: string;
}

export default function DropdownButton({
  list,
  onSelect,
  dfChoose = null,
  placeholder = "Chọn",
}: DropdownButtonProps) {
  const [selected, setSelected] = useState<KeyNameProps | null>(dfChoose);

  const handleSelect = (item: KeyNameProps) => {
    if (selected?.id === item.id) return;
    setSelected(item);
    onSelect(item);
  };

  return (
    <Menu
      as="div"
      className="relative inline-block text-left"
    >
      <MenuButton className="inline-flex  justify-between items-center gap-x-1.5 rounded-md bg-white px-2 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-gray-300 ring-inset hover:bg-gray-50">
        {selected ? i18next.t(selected.name) : placeholder}
        <img src={SVGS.ic_right} className="rotate-2 w-3" />
      </MenuButton>

      <MenuItems
        transition
        className="absolute right-0 z-30 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 transition focus:outline-hidden"
      >
        <div className="py-1">
          {list != null && list.length > 0 ? (
            list.map((item) => (
              <MenuItem key={item.id + item.name}>
                <button
                  type="button"
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => handleSelect(item)}
                >
                  {i18next.t(item.name)}
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
