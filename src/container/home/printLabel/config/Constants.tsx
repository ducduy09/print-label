import { TypePrint } from "@type";
import { Element } from "../config/Type";
import { Barcode, Calendar, ImageIcon, Type } from "lucide-react";

export const renderTypeItem = (id: string): Element['type'] => {
    const types: Record<string, Element['type']> = {
      '1': TypePrint.TEXT,
      '2': TypePrint.BARCODE,
      '3': TypePrint.DATETIME,
      '4': TypePrint.IMAGE,
    };
    return types[id] || TypePrint.TEXT;
};

export const ELEMENT_TYPES = [
  { id: TypePrint.TEXT as const, name: 'Text Input', icon: Type },
  { id: TypePrint.BARCODE as const, name: 'Barcode', icon: Barcode },
  { id: TypePrint.DATETIME as const, name: 'Date & Time', icon: Calendar },
  { id: TypePrint.IMAGE as const, name: 'Image Upload', icon: ImageIcon },
] as const;

export const DEFAULT_ELEMENT_HEIGHTS = {
  text: 5,
  datetime: 5,
  barcode: 12,
  image: 12,
} as const;

export const WIDTH_PRESETS = [25, 33, 50, 100] as const;
export const ALIGN_OPTIONS = ['left', 'center', 'right'] as const;

export const getElementName = (type: string): string => {
    const names: Record<string, string> = {
      text: 'Text Input',
      barcode: 'Barcode',
      datetime: 'Date & Time',
      image: 'Image Upload',
    };
    return names[type] || '';
};

export const getPropertyEID = (val: any) => {
    if (val?.properties?.elementId) { // dùng ? để tránh lỗi undefined, không bị crash app
        return {
        eId: val.properties.elementId,
        displayTime: val.properties.displayTime,
        fontFamily: val.properties.fontFamily,
        fontSize: val.properties.fontSize,
        };
    }
    return { eId: '', displayTime: val?.properties?.displayTime, fontFamily: val?.properties?.fontFamily, fontSize: val?.properties?.fontSize };
};