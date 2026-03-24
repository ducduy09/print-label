import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import clsx from "clsx";
import { CSSProperties, useEffect, useRef, useState } from "react";
import SVGS from "@setup_assets/image/svgs";
import { KeyNameProps } from "@type";

// const people = [
//   { id: 1, name: "Tom Cook" },
//   { id: 2, name: "Wade Cooper" },
//   { id: 3, name: "Tanya Fox" },
//   { id: 4, name: "Arlene Mccoy" },
//   { id: 5, name: "Devon Webb" },
// ];

interface ComboBoxProps {
  listData: KeyNameProps[];
  select?: KeyNameProps;
  onSelectItem?: (val?: KeyNameProps) => void;
  style?: CSSProperties | undefined;
  inputStyle?: CSSProperties
  placeholder?: string
}

export default function ComboBoxList(props: ComboBoxProps) {
  const [query, setQuery] = useState(!!props.select ? props.select.name : "");
  const [selected, setSelected] = useState<KeyNameProps | null>(
    props.select ?? props.listData[0] ?? null
  );
  const [onFocus, setOnFocus] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputWidth, setInputWidth] = useState<number>(0);

  const filteredPeople =
    query === ""
      ? props.listData
      : props.listData.filter((item) => {
          console.log(item);

          return item.name.toLowerCase().includes(query.toLowerCase());
        });

    useEffect(() => {
      !!props.onSelectItem && props.onSelectItem(props.listData[0]);
      if (inputRef.current) {
          setInputWidth(inputRef.current.offsetWidth);
      }
      // Optional: update width on window resize
      const handleResize = () => {
          if (inputRef.current) {
          setInputWidth(inputRef.current.offsetWidth);
          }
      };
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);

  return (
    <div className="w-full border rounded -pl-0" style={props.style}>
      <Combobox
        value={selected}
        onChange={(value: any) => {
          setSelected(value);
          !!props.onSelectItem && props.onSelectItem(value);
        }}
        onClose={() => setQuery("")}
        __demoMode
      >
        <div className="relative">
          <ComboboxInput
            ref={inputRef}
            className={clsx(
              "w-full rounded py-1 pr-2 pl-2 text-sm/6",
              "focus:not-data-focus:outline-none data-focus:outline-2 data-focus:-outline-offset-2 data-focus:outline-white/25"
            )}
            style={props.inputStyle}
            placeholder={props.placeholder}
            displayValue={(item: any) => item?.name}
            onFocus={() => {
              setOnFocus(true);
            }}
            onBlur={() => {
              setOnFocus(false);
            }}
            onChange={(event) => setQuery(event.target.value)}
          />
          {/* <ComboboxButton className="group absolute inset-y-0 right-0 px-2.5">
            <img src={SVGS.}
            <ChevronDownIcon className="size-4 fill-white/60 group-data-hover:fill-white" />
          </ComboboxButton> */}
        </div>

        {
          <ComboboxOptions
            anchor="bottom"
            transition
            style={{ width: inputWidth || undefined , ...props.style}}
            className={clsx(
              "rounded-xl border  border-gray-300 bg-white shadow-md p-1 empty:invisible",
              "transition duration-100 ease-in data-leave:data-closed:opacity-1"
            )}
          >
            {onFocus && filteredPeople.map((item) => (
              <ComboboxOption
                key={item.id}
                value={item}
                className="group flex cursor-default items-center gap-2 rounded-md px-3 py-2 text-gray-800 hover:bg-blue-100 data-[focus]:bg-blue-200 select-none"
              >
                {!!selected && selected.id == item.id && (
                  <img src={SVGS.ic_check} />
                )}
                <div className="text-sm/6">{item.name}</div>
              </ComboboxOption>
            ))}
          </ComboboxOptions>
        }
      </Combobox>
    </div>
  );
}
