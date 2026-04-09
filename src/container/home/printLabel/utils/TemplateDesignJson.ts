import { TypePrint } from '@type';
import { Element, Templates } from '../config/Type';

export const TEMPLATE_DESIGN_EXPORT_VERSION = 1 as const;

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

/** Element lưu JSON: không có File trong content */
export type SerializedElement = Omit<Element, 'content'> & { content: string };

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

const TYPE_PRINT_VALUES = new Set<string>(Object.values(TypePrint));

function serializeElement(el: Element): SerializedElement {
  const content =
    typeof el.content === 'string'
      ? el.content
      : el.content instanceof File
        ? ''
        : '';
  return { ...el, content };
}

export function buildTemplateDesignExport(params: {
  templateName: string;
  description: string;
  templateId: string;
  paperWidth: number;
  paperHeight: number;
  paperCount: number;
  columnGap: number;
  listTemp: Templates[];
}): TemplateDesignExportV1 {
  const {
    templateName,
    description,
    templateId,
    paperWidth,
    paperHeight,
    paperCount,
    columnGap,
    listTemp,
  } = params;

  return {
    version: TEMPLATE_DESIGN_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    meta: {
      templateName,
      description,
      templateId,
      paperWidth,
      paperHeight,
      paperCount,
      columnGap,
    },
    columns: listTemp.map((t) => ({
      templateId: t.templateId,
      name: t.name,
      gap: t.gap,
      description: t.description,
      status: t.status,
      width: t.width,
      height: t.height,
      createdAt: t.createdAt,
      elements: t.elements.map(serializeElement),
    })),
  };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function parseSerializedElement(raw: unknown, rowIndex: number): SerializedElement {
  if (!isRecord(raw)) {
    throw new Error(`Element tại vị trí ${rowIndex} không hợp lệ`);
  }
  const type = raw.type as string;
  if (!TYPE_PRINT_VALUES.has(type)) {
    throw new Error(`Element ${rowIndex}: type không hợp lệ`);
  }
  const id = Number(raw.id);
  const width = Number(raw.width);
  const height = Number(raw.height);
  if (!Number.isFinite(id) || !Number.isFinite(width) || !Number.isFinite(height)) {
    throw new Error(`Element ${rowIndex}: id/width/height không hợp lệ`);
  }
  return {
    id,
    elementId: String(raw.elementId ?? ''),
    name: String(raw.name ?? ''),
    type: type as TypePrint,
    content:
      typeof raw.content === 'string'
        ? raw.content
        : raw.content == null
          ? ''
          : String(raw.content),
    width,
    height,
    fontSize: raw.fontSize != null ? Number(raw.fontSize) : undefined,
    column: Number(raw.column) || 0,
    fontWeight:
      raw.fontWeight === 'bold' || raw.fontWeight === 'normal'
        ? raw.fontWeight
        : undefined,
    textAlign:
      raw.textAlign === 'left' ||
      raw.textAlign === 'center' ||
      raw.textAlign === 'right'
        ? raw.textAlign
        : undefined,
    padding: raw.padding != null ? Number(raw.padding) : undefined,
    margin: raw.margin != null ? Number(raw.margin) : undefined,
    x: Number(raw.x) || 0,
    y: Number(raw.y) || 0,
    displayTime:
      raw.displayTime === true || raw.displayTime === false
        ? raw.displayTime
        : undefined,
    fontFamily:
      typeof raw.fontFamily === 'string' ? raw.fontFamily : undefined,
  };
}

export function parseTemplateDesignJson(data: unknown): TemplateDesignExportV1 {
  if (!isRecord(data)) {
    throw new Error('File JSON không phải object');
  }
  if (data.version !== TEMPLATE_DESIGN_EXPORT_VERSION) {
    throw new Error(`Phiên bản export không hỗ trợ: ${String(data.version)}`);
  }
  const meta = data.meta;
  if (!isRecord(meta)) {
    throw new Error('Thiếu hoặc sai meta');
  }
  const paperWidth = Number(meta.paperWidth);
  const paperHeight = Number(meta.paperHeight);
  const paperCount = Number(meta.paperCount);
  const columnGap = Number(meta.columnGap);
  if (
    !Number.isFinite(paperWidth) ||
    !Number.isFinite(paperHeight) ||
    !Number.isFinite(paperCount) ||
    !Number.isFinite(columnGap) ||
    paperCount < 1 ||
    paperCount > 4
  ) {
    throw new Error('meta.paperWidth / paperHeight / paperCount / columnGap không hợp lệ');
  }

  const columnsRaw = data.columns;
  if (!Array.isArray(columnsRaw)) {
    throw new Error('Thiếu mảng columns');
  }

  const columns: TemplateDesignSerializedColumn[] = columnsRaw.map(
    (col, colIndex) => {
      if (!isRecord(col)) {
        throw new Error(`Cột ${colIndex} không hợp lệ`);
      }
      const els = col.elements;
      if (!Array.isArray(els)) {
        throw new Error(`Cột ${colIndex}: thiếu elements`);
      }
      return {
        templateId: String(col.templateId ?? String(Date.now())),
        name: String(col.name ?? ''),
        gap: Number(col.gap) || columnGap,
        description: String(col.description ?? ''),
        status: String(col.status ?? 'ACTIVE'),
        width: Number(col.width) || paperWidth,
        height: Number(col.height) || paperHeight,
        createdAt: String(col.createdAt ?? new Date().toISOString()),
        elements: els.map((el, i) => parseSerializedElement(el, colIndex * 1000 + i)),
      };
    },
  );

  return {
    version: TEMPLATE_DESIGN_EXPORT_VERSION,
    exportedAt: String(data.exportedAt ?? new Date().toISOString()),
    meta: {
      templateName: String(meta.templateName ?? ''),
      description: String(meta.description ?? ''),
      templateId: String(meta.templateId ?? ''),
      paperWidth,
      paperHeight,
      paperCount,
      columnGap,
    },
    columns,
  };
}

export function importTemplateDesignFromFile(file: File): Promise<TemplateDesignExportV1> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result;
        if (typeof text !== 'string') {
          reject(new Error('Không đọc được nội dung file'));
          return;
        }
        const parsed = JSON.parse(text) as unknown;
        resolve(parseTemplateDesignJson(parsed));
      } catch (e) {
        reject(
          e instanceof Error ? e : new Error('Lỗi phân tích JSON'),
        );
      }
    };
    reader.onerror = () => reject(new Error('Không thể đọc file'));
    reader.readAsText(file, 'UTF-8');
  });
}

export function downloadJsonFile(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  a.click();
  URL.revokeObjectURL(url);
}
