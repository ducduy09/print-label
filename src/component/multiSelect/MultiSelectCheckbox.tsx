import { KeyNameProps } from "@type";

interface MultiSelectCheckboxProps {
  options: KeyNameProps[];
  selected?: KeyNameProps[];
  onChange: (newSelected: KeyNameProps[]) => void;
}

export default function MultiSelectCheckbox({
  options = [],
  selected = [],
  onChange,
}: MultiSelectCheckboxProps) {
  const toggleSelect = (key: KeyNameProps) => {
    if (selected.includes(key)) {
      onChange(selected.filter((item) => item !== key));
    } else {
      onChange([...selected, key]);
    }
  };

  return (
    <div className="grid gap-2 p-2 border rounded-md bg-white shadow-sm">
      {options.map((item, index) => (
        <label
          key={item.id}
          className="flex items-center space-x-2 text-sm text-gray-700"
        >
          <input
            type="checkbox"
            checked={selected.includes(item)}
            onChange={() => toggleSelect(item)}
            className="accent-blue-600"
          />
          <span>{item.name}</span>
        </label>
      ))}
    </div>
  );
}
