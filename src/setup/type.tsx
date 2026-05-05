export interface DataInfoProps {
    user: string;
    checkin: string;
    checkout: string
}
export interface KeyNameProps {
  id: string;
  name: string;
}
export interface KeyValue {
  id: number;
  value: any;
}
export interface DataField {
  name: string;
  value: string;
}
export interface KeyValueCodeProps {
  key: string;
  value: string;
  code: string;
};
export interface ModalDataType {
  value: string;
  title: string;
  details: string;
};
export interface SettingProps {
  theme: string;
  lang: string;
}

export interface RequestProps {
  requestId: string;
  employeeCode: string;
  leaveType: string;
  status: string;
  startDate: string;
  endDate: string;
  note: string;
  reviewedBy: string;
}

export enum TypePrint {
    IMAGE = 'IMAGE',
    TEXT = 'TEXT',
    DATETIME = 'DATETIME',
    BARCODE = 'BARCODE',
    QRCODE = 'QRCODE',
    /** Gửi API: geometry.rectangle */
    GEOMETRY_RECTANGLE = 'GEOMETRY_RECTANGLE',
    /** Gửi API: geometry.circle */
    GEOMETRY_CIRCLE = 'GEOMETRY_CIRCLE',
    /** Gửi API: geometry.line */
    GEOMETRY_LINE = 'GEOMETRY_LINE',
}

// Tương đương với PrinterBuilderRequest.DataPrintField
export interface DataPrintField {
    name: string;
    value: string;
    type: TypePrint | string;
    x: number; // Tọa độ X
    y: number; // Tọa độ Y
    column: number;
    width?: number;
    height?: number;
    properties?: {
        fontSize?: number;
        displayTime?: boolean;
        elementId?: string;
        fontFamily?: string;
        strokeWidthMm?: number;
    };
}

// Tương đương với PrinterBuilderRequest
export interface PrinterBuilderRequest {
    id: string;
    count: number;
    columns: number;
    data: DataPrintField[];
}

export interface TemplateProps {
    templateId: string;
    name: string;
    width: number;
    height: number;
    gap: number;
    description: string;
    status: string;
    createdAt: string;
}

export interface UseUnsavedChangesProps {
  hasUnsavedChanges: boolean;
  message?: string;
}

export interface CoordinateProps {
  x: number,
  y: number
}