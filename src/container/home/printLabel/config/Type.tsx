import { TemplateProps, TypePrint } from "@type";

// 1->100
export type WidthValue = number; 

export interface Element {
  id: number;
  elementId: string;
  type: TypePrint;
  name: string;
  content: string | File | null;
  width: WidthValue; // mm
  height: number;
  fontSize?: number;
  column: number;
  fontWeight?: 'normal' | 'bold';
  textAlign?: 'left' | 'center' | 'right';
  padding?: number;
  margin?: number;
  x: number; // Tọa độ X tuyệt đối (pixels)
  y: number; // Tọa độ Y tuyệt đối (pixels)
  displayTime?: boolean; // Tùy chọn hiển thị giờ cho datetime
  fontFamily?: string;
  // textPosition?: boolean; // Tùy chọn hiển thị position text barcode
}

export interface Templates extends TemplateProps {
  elements: Element[];
}