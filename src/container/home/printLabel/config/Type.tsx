import { TemplateProps, TypePrint } from "@type";
import { SerializedElement } from "../utils/TemplateDesignJson";
import { TEMPLATE_DESIGN_EXPORT_VERSION } from "./Constants";

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
  /** Độ dày nét (mm) — đường kẻ, hình tròn, hình chữ nhật */
  strokeWidthMm?: number;
  // textPosition?: boolean; // Tùy chọn hiển thị position text barcode
}

export interface Templates extends TemplateProps {
  elements: Element[];
}

export interface TemplateDesignExportMeta {
  templateName: string;
  description: string;
  /** Giữ để tham chiếu; khi import có thể đặt rỗng để tránh ghi đè server. */
  templateId: string;
  paperWidth: number;
  paperHeight: number;
  paperCount: number;
  columnGap: number;
}

export interface TemplateDesignSerializedColumn
  extends Omit<Templates, 'elements'> {
  elements: SerializedElement[];
}

export interface TemplateDesignExportV1 {
  version: typeof TEMPLATE_DESIGN_EXPORT_VERSION;
  exportedAt: string;
  meta: TemplateDesignExportMeta;
  columns: TemplateDesignSerializedColumn[];
}