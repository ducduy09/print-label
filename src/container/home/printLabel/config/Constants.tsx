import { KeyNameIconProps, KeyValueProps, TypePrint } from "@type";
import { Element } from "../config/Type";
import { Barcode, Calendar, Circle, ImageIcon, Minus, QrCode, RectangleHorizontal, Type } from "lucide-react";

export const renderTypeItem = (id: string | number): Element['type'] => {
    const types: Record<string, Element['type']> = {
      '1': TypePrint.TEXT,
      '2': TypePrint.BARCODE,
      '3': TypePrint.DATETIME,
      '4': TypePrint.IMAGE,
      '5': TypePrint.QRCODE,
      '6': TypePrint.GEOMETRY_RECTANGLE,
      '7': TypePrint.GEOMETRY_CIRCLE,
      '8': TypePrint.GEOMETRY_LINE,
    };
    return types[String(id)] || TypePrint.TEXT;
};

export const ELEMENT_TYPES: KeyNameIconProps[] = [
  { id: TypePrint.TEXT as const, name: 'Text Input', icon: Type },
  { id: TypePrint.BARCODE as const, name: 'Barcode', icon: Barcode },
  { id: TypePrint.DATETIME as const, name: 'Date & Time', icon: Calendar },
  { id: TypePrint.IMAGE as const, name: 'Image Upload', icon: ImageIcon },
  { id: TypePrint.QRCODE as const, name: 'QR Code', icon: QrCode },
  { id: TypePrint.GEOMETRY_LINE as const, name: 'Đường thẳng', icon: Minus },
  { id: TypePrint.GEOMETRY_CIRCLE as const, name: 'Hình tròn', icon: Circle },
  { id: TypePrint.GEOMETRY_RECTANGLE as const, name: 'Hình chữ nhật', icon: RectangleHorizontal },
];

export const ELEMENT_GROUPS: KeyValueProps[] = [
  { id: "1", value: [
      { id: TypePrint.TEXT as const, name: 'Text Input', icon: Type },
      { id: TypePrint.DATETIME as const, name: 'Date & Time', icon: Calendar },
      { id: TypePrint.IMAGE as const, name: 'Image Upload', icon: ImageIcon },
    ]
  },
  { id: "2", value: [
      { id: TypePrint.BARCODE as const, name: 'Barcode', icon: Barcode },
      { id: TypePrint.QRCODE as const, name: 'QR Code', icon: QrCode },
    ] },
  { id: "3", value: [
      { id: TypePrint.GEOMETRY_LINE as const, name: 'Đường thẳng', icon: Minus },
      { id: TypePrint.GEOMETRY_CIRCLE as const, name: 'Hình tròn', icon: Circle },
      { id: TypePrint.GEOMETRY_RECTANGLE as const, name: 'Hình chữ nhật', icon: RectangleHorizontal },
    ] },
];

export const DEFAULT_ELEMENT_HEIGHTS: Record<string, number> = {
  text: 5,
  datetime: 5,
  barcode: 12,
  image: 12,
  qrcode: 18,
  geometry_line: 3,
  geometry_circle: 16,
  geometry_rectangle: 12,
};

export const WIDTH_PRESETS = [25, 33, 50, 100] as const;
export const ALIGN_OPTIONS = ['left', 'center', 'right'] as const;

export const getElementName = (type: string): string => {
    const names: Record<string, string> = {
      text: 'Text Input',
      barcode: 'Barcode',
      datetime: 'Date & Time',
      image: 'Image Upload',
      qrcode: 'QR Code',
      geometry_line: 'Đường thẳng',
      geometry_circle: 'Hình tròn',
      geometry_rectangle: 'Hình chữ nhật',
    };
    return names[type.toLowerCase()] || '';
};

export const getPropertyEID = (val: any) => {
    const p = val?.properties;
    const strokeRaw = p?.strokeWidthMm;
    const strokeWidthMm =
      typeof strokeRaw === 'number' && Number.isFinite(strokeRaw) ? strokeRaw : undefined;
    if (p?.elementId) {
        return {
        eId: p.elementId,
        displayTime: p.displayTime,
        fontFamily: p.fontFamily,
        fontSize: p.fontSize,
        strokeWidthMm,
        };
    }
    return {
      eId: '',
      displayTime: p?.displayTime,
      fontFamily: p?.fontFamily,
      fontSize: p?.fontSize,
      strokeWidthMm,
    };
};