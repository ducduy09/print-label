import Api from '@axios/helpers';
import { PRINT, TEMPLATE_PRINT } from '@axios/urls';
import SnackBarManager from '@component/alert/SnackBarManager';
import SnackBarModal, { showSnackBar } from '@component/alert/SnackBarModal';
import ToggleButton from '@component/button/ToggleButton';
import DropdownButton from '@component/dropdown/DropdownButton';
import DropdownList from '@component/dropdown/DropdownList';
import LoadingManager from '@component/loading/LoadingManager';
import LoadingModal from '@component/loading/LoadingModal';
import ModalChoose from '@component/modal/ModalChoose';
import NetworkErrorModal from '@component/modal/NetworkErrorModal';
import NetworkErrorManager from '@component/network/NetworkErrorManager';
import BackgroundTemplate from '@container/template/BackgroundTemplate';
import { getBarcodeWidthMm, useUnsavedChanges } from '@functions';
import { listFontPrint } from '@src/setup/DataInit';
import { DataPrintField, KeyValue, PrinterBuilderRequest, TemplateProps, TypePrint } from '@type';
import { Columns, Download, File, ListOrdered, Printer, Trash2 } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import TemplateComp from './component/TemplateComp';
import { DEFAULT_ELEMENT_HEIGHTS, ELEMENT_GROUPS, getElementName, getPropertyEID, renderTypeItem } from './config/Constants';
import { Element, TemplateDesignExportV1, Templates, WidthValue } from './config/Type';
import { handleDeleteTemp, handleSaveTemplate } from './hooks/AxiosTemplateData';
import TemplateList from './TemplateList';
import { importFilePrint } from './utils/ExcelFilePrint';
import {
  buildTemplateDesignExport,
  downloadJsonFile,
  importTemplateDesignFromFile
} from './utils/TemplateDesignJson';

// ─── Hằng số ────────────────────────────────────────────────────────────────
// Gap giữa các cột — đơn vị mm, dùng trực tiếp trong CSS và tính toán drag
const COLUMN_GAP_MM = 3;

// Khoảng GAP cảm biến giữa các tem (trục Y) — thuộc tính giấy, không phải column gap thiết kế
const SENSOR_GAP_MM = 2;

const getColumnWidth = (paperWidth: number, paperCount: number, gap: number) => {
  if (paperCount <= 1) return paperWidth;
  const totalGap = gap * (paperCount - 1);
  const available = Math.max(1, paperWidth - totalGap);
  return available / paperCount;
};

const emptyTemplate = (width: number, paperHeight: number, gap: number = COLUMN_GAP_MM): Templates => ({
  elements: [],
  templateId: String(Date.now()),
  name: '',
  gap,
  description: '',
  status: 'ACTIVE',
  height: paperHeight,
  width,
  createdAt: new Date().toISOString(),
});

// ─── Component ───────────────────────────────────────────────────────────────
const TemplateBuilder: React.FC = () => {
  const { t } = useTranslation();
  const snackBarRef: any    = useRef(null);
  const networkErrorRef     = useRef<NetworkErrorModal>(null);
  const loadingRef          = useRef<any>(null);
  const canvasWrapperRef    = useRef<HTMLDivElement>(null) as React.MutableRefObject<HTMLDivElement>;

  const [templateName,    setTemplateName]    = useState<string>('');
  const [description,     setDescription]     = useState<string>('');
  const [templateID,      setTemplateID]      = useState<string>('');
  const [selectedElement, setSelectedElement] = useState<KeyValue>({ id: -1, value: 0 });
  const [paperWidth,      setPaperWidth]      = useState<number>(75);   // mm (full page width)
  const [paperHeight,     setPaperHeight]     = useState<number>(55);   // mm
  const [paperCount,      setPaperCount]      = useState<number>(1);
  const [columnGap,       setColumnGap]       = useState<number>(COLUMN_GAP_MM);
  const columnWidth = useMemo(
    () => getColumnWidth(paperWidth, paperCount, columnGap),
    [paperWidth, paperCount, columnGap]
  );
  const [listTemp,        setListTemp]        = useState<Templates[]>([emptyTemplate(columnWidth, 55)]);
  const [tempImageUrl,    setTempImageUrl]    = useState<string>('');
  const [changeTab,       setChangeTab]       = useState<boolean>(true);
  const [isChangeData,    setIsChangeData]    = useState<boolean>(false);
  const [templates,       setTemplates]       = useState<TemplateProps[]>([]);

  const excelRef        = useRef(null);
  const importRef       = useRef(null);
  const modalConfirmRef = useRef<any>(null);

  // ── paperCount thay đổi: đồng bộ listTemp ─────────────────────────────────
  useEffect(() => {
    if (paperCount > 4) {
      showSnackBar('WARNING', 'Số lượng thiết kế tối đa trên 1 hàng là 4');
      setPaperCount(4);
      return;
    }
    if (paperCount < 1) return;

    setListTemp(prev => {
      const next = [...prev];
      while (next.length < paperCount) next.push(emptyTemplate(columnWidth, paperHeight, columnGap));
      return next.slice(0, paperCount);
    });
  }, [paperCount, paperHeight, paperWidth, columnGap, columnWidth]);

  // ── Thêm element vào cột ──────────────────────────────────────────────────
  const addElement = useCallback((index: number, type: TypePrint) => {
    if (!listTemp[index]) return;

    const typeKey = type.toLowerCase();
    const newElementHeight = DEFAULT_ELEMENT_HEIGHTS[typeKey] ?? 5;

    let elWidth = columnWidth;
    let elHeight = newElementHeight;
    if (type === TypePrint.QRCODE) {
      // QR code là hình vuông
      const qrSize = Math.min(18, columnWidth);
      elWidth = qrSize;
      elHeight = qrSize;
    } else if (type === TypePrint.GEOMETRY_LINE) {
      elWidth = Math.min(35, columnWidth);
      elHeight = 3;
    } else if (type === TypePrint.GEOMETRY_CIRCLE) {
      elWidth = Math.min(16, columnWidth);
      elHeight = 16;
    } else if (type === TypePrint.GEOMETRY_RECTANGLE) {
      elWidth = Math.min(28, columnWidth);
      elHeight = 12;
    }

    let maxBottomMm = 0;
    listTemp[index].elements.forEach(el => {
      maxBottomMm = Math.max(maxBottomMm, el.y + el.height);
    });

    const needsFontSize =
      type === TypePrint.TEXT ||
      type === TypePrint.DATETIME ||
      type === TypePrint.BARCODE;

    const newElement: Element = {
      id: Date.now(),
      type,
      elementId: '',
      name: getElementName(type),
      content:
        type === TypePrint.DATETIME ? new Date().toISOString().slice(0, 16)
        : type === TypePrint.BARCODE ? '9385241840319'
        : type === TypePrint.TEXT ? 'Sample Text'
        : type === TypePrint.QRCODE ? 'https://example.com'
        : '',
      width: elWidth,
      height: elHeight,   // mm
      fontSize: needsFontSize ? 8 : undefined, // pt
      fontWeight: 'normal',
      column: index,
      textAlign: 'left',
      padding: 0,
      margin: 0,
      x: 0,                       // mm
      y: maxBottomMm > 0 ? maxBottomMm : 0.5, // mm
      displayTime: type === TypePrint.DATETIME ? true : undefined,
      strokeWidthMm:
        type === TypePrint.GEOMETRY_LINE ||
        type === TypePrint.GEOMETRY_CIRCLE ||
        type === TypePrint.GEOMETRY_RECTANGLE
          ? 0.35
          : undefined,
    };

    setListTemp(prev => prev.map((temp, i) =>
      i === index ? { ...temp, elements: [...temp.elements, newElement] } : temp
    ));
    setIsChangeData(true);
  }, [listTemp, columnWidth]);

  // ── Tab switching ─────────────────────────────────────────────────────────
  const switchToListTab = useCallback(() => {
    setPaperWidth(75);
    setPaperHeight(55);
    setPaperCount(1);
    setColumnGap(COLUMN_GAP_MM);
    setTemplateName('');
    setDescription('');
    setListTemp([emptyTemplate(75, 55, COLUMN_GAP_MM)]);
    setSelectedElement({ id: -1, value: 0 });
    setTemplateID('');
    setIsChangeData(false);
  }, []);

  const handleToggleTab = useCallback(() => {
    if (!changeTab && isChangeData) {
      modalConfirmRef.current?.openModal();
    } else {
      setChangeTab(!changeTab);
      switchToListTab()
    }
  }, [changeTab, isChangeData, switchToListTab]);

  useUnsavedChanges({
    hasUnsavedChanges: isChangeData,
    message: 'Bạn có thay đổi chưa được lưu. Bạn có chắc chắn muốn thoát?',
  });

  // ── CRUD element ──────────────────────────────────────────────────────────
  const removeElement = useCallback((val: KeyValue) => {
    setIsChangeData(true);
    setListTemp(prev => prev.map((temp, i) =>
      i === val.id
        ? { ...temp, elements: temp.elements.filter(el => el.id !== val.value) }
        : temp
    ));
    setSelectedElement(prev => prev.value === val.value ? { id: -1, value: 0 } : prev);
  }, []);

  const updateElementContent = useCallback((index: number, id: number, content: string | File) => {
    setIsChangeData(true);
    setListTemp(prev => prev.map((temp, i) =>
      i === index
        ? { ...temp, elements: temp.elements.map(el => el.id === id ? { ...el, content } : el) }
        : temp
    ));
  }, []);

  const updateElementId = useCallback((index: number, id: number, elementId: string) => {
    setListTemp(prev => prev.map((temp, i) =>
      i === index
        ? { ...temp, elements: temp.elements.map(el => el.id === id ? { ...el, elementId } : el) }
        : temp
    ));
  }, []);

  const updateElementSize = useCallback((
    index: number, id: number, eId: string,
    width: WidthValue, height: number, // width/height = mm
  ) => {
    if (eId && eId.includes('ABS')) {
      showSnackBar('WARNING', 'Cannot resize ABS elements.');
      return;
    }
    setIsChangeData(true);
    const safeWidth = Math.max(1, Math.min(columnWidth, width));
    setListTemp(prev => prev.map((temp, i) =>
      i === index
        ? { ...temp, elements: temp.elements.map(el => el.id === id ? { ...el, width: safeWidth, height } : el) }
        : temp
    ));
  }, [columnWidth]);

  const updateElementStyle = useCallback((index: number, id: number, updates: Partial<Element>) => {
    setIsChangeData(true);
    setListTemp(prev => prev.map((temp, i) =>
      i === index
        ? { ...temp, elements: temp.elements.map(el => el.id === id ? { ...el, ...updates } : el) }
        : temp
    ));
  }, []);

  const handleImageUpload = useCallback((
    index: number, id: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) updateElementContent(index, id, file);
  }, [updateElementContent]);

  // ── In từ Excel ───────────────────────────────────────────────────────────
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (listTemp.find(temp => temp.elements.length === 0)) {
        showSnackBar('WARNING', 'Please design and save a template before importing data.');
        return;
      }
      if (listTemp.find(temp => temp.elements.find(el => !el.elementId?.trim()))) return;

      const result = await importFilePrint(file, listTemp, paperCount);
      const request = {
        templates: result,
        size: {
          width: paperWidth,
          height: paperHeight,
          gap: SENSOR_GAP_MM,
          columnGap,
          columns: paperCount,
        },
      };

      if (result?.length > 0) {
        const response = await Api.postWithJson(PRINT.customizeBuilder, request, true);
        if (response.code === '200') showSnackBar('SUCCESS', 'Print job submitted successfully.');
        else showSnackBar('FALSE', `Error: ${response.message || 'Unknown error'}`);
      } else {
        showSnackBar('WARNING', 'Excel file is empty or contains no data rows.');
      }
    } catch (err) {
      showSnackBar('FALSE', `Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      e.target.value = '';
    }
  }, [listTemp, paperWidth, paperHeight, paperCount, columnGap]);

  const applyImportedDesign = useCallback((data: TemplateDesignExportV1) => {
    const { meta } = data;
    const count = Math.min(4, Math.max(1, Math.floor(meta.paperCount)));
    const gap = Math.max(0, Number(meta.columnGap) || COLUMN_GAP_MM);
    const cw = getColumnWidth(meta.paperWidth, count, gap);

    const importBatchBase = Date.now();
    const normalized: Templates[] = [];
    for (let i = 0; i < count; i++) {
      const src = data.columns[i];
      if (!src) {
        normalized.push(emptyTemplate(cw, meta.paperHeight, gap));
        continue;
      }
      normalized.push({
        templateId: String(src.templateId || Date.now()),
        name: src.name,
        gap,
        description: src.description,
        status: src.status || 'ACTIVE',
        width: cw,
        height: meta.paperHeight,
        createdAt: src.createdAt || new Date().toISOString(),
        elements: src.elements.map((el, j) => {
          // Đảm bảo strokeWidthMm có giá trị default cho geometry types
          const isGeometry = 
            el.type === TypePrint.GEOMETRY_LINE ||
            el.type === TypePrint.GEOMETRY_CIRCLE ||
            el.type === TypePrint.GEOMETRY_RECTANGLE;
          // QR code là hình vuông
          const isQrCode = el.type === TypePrint.QRCODE;
          const finalWidth = isQrCode ? Math.min(el.width, el.height) : el.width;
          const finalHeight = isQrCode ? finalWidth : el.height;
          
          return {
            ...el,
            id: importBatchBase + i * 100000 + j,
            column: i,
            width: Math.max(1, Math.min(cw, finalWidth)),
            height: finalHeight,
            content: el.content,
            strokeWidthMm: isGeometry && (el.strokeWidthMm === undefined || el.strokeWidthMm === 0) ? 0.35 : el.strokeWidthMm,
          };
        }),
      });
    }

    setTemplateName(meta.templateName);
    setDescription(meta.description);
    setTemplateID('');
    setPaperWidth(meta.paperWidth);
    setPaperHeight(meta.paperHeight);
    setPaperCount(count);
    setColumnGap(gap);
    setListTemp(normalized);
    setSelectedElement({ id: -1, value: 0 });
    setIsChangeData(true);
    showSnackBar('SUCCESS', 'Đã import mẫu từ JSON.');
  }, []);

  const handleExportTemplate = useCallback(() => {
    const payload = buildTemplateDesignExport({
      templateName,
      description,
      templateId: templateID,
      paperWidth,
      paperHeight,
      paperCount,
      columnGap,
      listTemp,
    });
    const base =
      (templateName || 'template').replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 80) || 'template';
    downloadJsonFile(`${base}-${Date.now()}.json`, payload);
  }, [
    templateName,
    description,
    templateID,
    paperWidth,
    paperHeight,
    paperCount,
    columnGap,
    listTemp,
  ]);

  const handleImportTemplate = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const data = await importTemplateDesignFromFile(file);
        applyImportedDesign(data);
      } catch (err) {
        showSnackBar(
          'FALSE',
          `Import JSON: ${err instanceof Error ? err.message : 'Lỗi không xác định'}`,
        );
      } finally {
        e.target.value = '';
      }
    },
    [applyImportedDesign],
  );

  // ── In thử template ───────────────────────────────────────────────────────
  const handlePrintTemp = useCallback(async () => {
    try {
      if (listTemp.find(temp => temp.elements.length === 0)) {
        showSnackBar('WARNING', 'Please design and save a template before printing.');
        return;
      }

      const listDataField: DataPrintField[] = [];

      listTemp.forEach(temp => {
        const dataFields: DataPrintField[] = temp.elements.map(element => {
          if (typeof element.content === 'object') {
            throw new Error('Cannot print template with local image files.');
          }
          return {
            name:   element.elementId,
            type:   element.type.toLocaleUpperCase() as TypePrint,
            value:  typeof element.content === 'string' ? element.content : '',
            width:  element.width,
            height: element.height,
            column: element.column,
            x: element.x,
            y: element.y,
            properties: {
              fontSize:    element.fontSize,
              displayTime: element.displayTime,
              elementId:   element.elementId,
              fontFamily:  element.fontFamily,
              strokeWidthMm: element.strokeWidthMm,
            },
          };
        });
        listDataField.push(...dataFields);
      });

      const dto: PrinterBuilderRequest = {
        id: '1', count: 1, columns: paperCount, data: listDataField,
      };
      const request = {
        templates: [dto],
        size: {
          width: paperWidth,
          height: paperHeight,
          gap: SENSOR_GAP_MM,
          columnGap,
          columns: paperCount,
        },
      };

      const response = await Api.postWithJson(PRINT.customizeBuilder, request, true);
      if (response.code === '200') showSnackBar('SUCCESS', 'Print job submitted successfully.');
      else showSnackBar('FALSE', `Error: ${response.data || 'Unknown error'}`);
    } catch (err) {
      showSnackBar('FALSE', `Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [listTemp, paperWidth, paperHeight, paperCount, columnGap]);

  // ── Render Properties Panel ───────────────────────────────────────────────
  const renderPropertiesPanel = () => {
    if (selectedElement.value === 0 || selectedElement.id === -1) return null;

    const tempData = listTemp[selectedElement.id];
    if (!tempData) return null;

    const element = tempData.elements.find(el => el.id === selectedElement.value);
    if (!element) return null;
    const barcodeRequiredWidthMm =
      element.type === TypePrint.BARCODE &&
      typeof element.content === 'string' &&
      element.content.trim() !== ''
        ? getBarcodeWidthMm(element.content)
        : 0;
    const isBarcodeTooNarrow =
      element.type === TypePrint.BARCODE &&
      barcodeRequiredWidthMm > element.width;
    const isElementTooWide = element.width > columnWidth;

    return (
      <div className="w-80 bg-white rounded-lg shadow-sm border border-gray-200 p-6 overflow-y-auto h-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-gray-800">Properties</h3>
          <button onClick={() => removeElement(selectedElement)} className="text-gray-400 hover:text-red-500 transition">
            <Trash2 size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded inline-block">{element.name}</div>
          </div>
          <input
            value={element.elementId as string}
            placeholder={t('elementId')}
            onChange={(e) => updateElementId(selectedElement.id, element.id, e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm"
          />

          {element.type === TypePrint.TEXT && (
            <>
              <div className="block text-sm font-medium text-gray-700">Content:</div>
              <textarea
                value={element.content as string}
                onChange={(e) => updateElementContent(selectedElement.id, element.id, e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
                rows={2}
              />
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Font Size (pt)</label>
                <input type="number" value={element.fontSize} step={0.5}
                  onChange={(e) => updateElementStyle(selectedElement.id, element.id, { fontSize: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Font Family</label>
                <div className="float-end">
                  <DropdownButton list={listFontPrint}
                    onSelect={(font) => updateElementStyle(selectedElement.id, element.id, { fontFamily: font.name })}
                    dfChoose={element.fontFamily ? { id: element.fontFamily, name: element.fontFamily } : listFontPrint[0]} />
                </div>
              </div>
            </>
          )}

          {element.type === TypePrint.BARCODE && (
            <>
              <input value={element.content as string} placeholder={t('barcodeData')}
                onChange={(e) => updateElementContent(selectedElement.id, element.id, e.target.value)}
                className={`w-full px-3 py-2 border rounded-md text-sm ${isBarcodeTooNarrow ? 'border-red-500' : 'border-gray-300'}`} />
              {barcodeRequiredWidthMm > 0 && (
                <div className={`mt-2 text-xs rounded-md px-2 py-1.5 ${isBarcodeTooNarrow ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-gray-50 text-gray-600 border border-gray-200'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span>
                      In: <b>{barcodeRequiredWidthMm.toFixed(1)}mm</b> · Hiện tại: <b>{element.width.toFixed(1)}mm</b>
                    </span>
                    {isBarcodeTooNarrow && (
                      <button
                        type="button"
                        onClick={() => updateElementSize(
                          selectedElement.id, element.id, element.elementId,
                          Math.min(columnWidth, barcodeRequiredWidthMm),
                          element.height,
                        )}
                        className="px-2 py-0.5 text-[11px] bg-red-600 text-white rounded hover:bg-red-500 whitespace-nowrap"
                      >
                        Khớp chiều rộng
                      </button>
                    )}
                  </div>
                  {isBarcodeTooNarrow && (
                    <div className="mt-1 text-[11px] opacity-90">
                      Khi in, mã sẽ bị cắt vì kích thước render ({element.width.toFixed(1)}mm) nhỏ hơn kích thước in ({barcodeRequiredWidthMm.toFixed(1)}mm).
                    </div>
                  )}
                  {!isBarcodeTooNarrow && barcodeRequiredWidthMm < element.width - 0.5 && (
                    <div className="mt-1 text-[11px] opacity-90">
                      Render đang lớn hơn kích thước in — bản in sẽ ngắn hơn preview.
                    </div>
                  )}
                </div>
              )}
              <div className="flex items-center justify-between mt-2">
                Display content:
                <ToggleButton defaultValue={element.displayTime !== false}
                  onChange={(displayTime) => updateElementStyle(selectedElement.id, element.id, { displayTime })} />
              </div>
            </>
          )}

          {element.type === TypePrint.IMAGE && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Image Source</label>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Paste Image URL</label>
                <div className="flex gap-2">
                  <input type="url"
                    value={tempImageUrl || (typeof element.content === 'string' ? element.content : '')}
                    onChange={(e) => setTempImageUrl(e.target.value)}
                    placeholder="E.g. https://cloud.mkb-tech.vn/logo.png"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  <button
                    onClick={() => { if (tempImageUrl) { updateElementContent(selectedElement.id, element.id, tempImageUrl); setTempImageUrl(''); } }}
                    disabled={!tempImageUrl}
                    className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:bg-gray-400">
                    Apply
                  </button>
                </div>
                {typeof element.content === 'string' && element.content && (
                  <p className="text-xs text-gray-500 mt-1 truncate">Current: {element.content}</p>
                )}
              </div>
              <div className="flex items-center">
                <hr className="flex-1 border-gray-200" /><span className="text-xs text-gray-400 px-2">OR</span><hr className="flex-1 border-gray-200" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Upload Image File</label>
                <input type="file" accept="image/*"
                  onChange={(e) => handleImageUpload(selectedElement.id, element.id, e)}
                  onClick={() => { updateElementContent(selectedElement.id, element.id, ''); setTempImageUrl(''); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
            </div>
          )}

          {element.type === TypePrint.DATETIME && (
            <>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Font Size (pt)</label>
                <input type="number" value={element.fontSize} step={1}
                  onChange={(e) => updateElementStyle(selectedElement.id, element.id, { fontSize: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 items-center">
                <label className="text-xs text-gray-500">Font Family:</label>
                <DropdownButton list={listFontPrint}
                  onSelect={(font) => updateElementStyle(selectedElement.id, element.id, { fontFamily: font.name })}
                  dfChoose={element.fontFamily ? { id: element.fontFamily, name: element.fontFamily } : listFontPrint[0]} />
              </div>
              <input type="datetime-local" value={element.content as string}
                onChange={(e) => updateElementContent(selectedElement.id, element.id, e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm" />
              <div className="flex items-center justify-between mt-2">
                <label className="text-sm font-medium text-gray-700">Display Time</label>
                <ToggleButton defaultValue={element.displayTime !== false}
                  onChange={(displayTime) => updateElementStyle(selectedElement.id, element.id, { displayTime })} />
              </div>
            </>
          )}

          {element.type === TypePrint.QRCODE && (
            <>
              <div className="block text-sm font-medium text-gray-700">Nội dung QR</div>
              <textarea
                value={(element.content as string) || ''}
                onChange={(e) => updateElementContent(selectedElement.id, element.id, e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
                rows={3}
                placeholder="URL hoặc chuỗi cần mã hóa"
              />
            </>
          )}

          {(element.type === TypePrint.GEOMETRY_LINE ||
            element.type === TypePrint.GEOMETRY_CIRCLE ||
            element.type === TypePrint.GEOMETRY_RECTANGLE) && (
            <>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Độ dày nét (mm)</label>
                <input
                  type="number"
                  min={0.05}
                  max={3}
                  step={0.05}
                  value={+(element.strokeWidthMm ?? 0.35).toFixed(2)}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (!Number.isFinite(v)) return;
                    updateElementStyle(selectedElement.id, element.id, {
                      strokeWidthMm: Math.max(0.05, Math.min(3, v)),
                    });
                  }}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          <hr className="border-gray-100" />

          {/* Position — đơn vị mm */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Position (mm)</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">X (Left)</label>
                <input type="number" value={+element.x.toFixed(1)} step={1}
                  onChange={(e) => updateElementStyle(selectedElement.id, element.id, { x: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Y (Top)</label>
                <input type="number" value={+element.y.toFixed(1)} step={1}
                  onChange={(e) => updateElementStyle(selectedElement.id, element.id, { y: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Dimensions — width/height mm */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Dimensions</label>
            
            {/* QR Code: vuông nên chỉ chỉnh 1 cạnh */}
            {element.type === TypePrint.QRCODE ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Kích thước (mm)</label>
                  <input type="number" value={+element.width.toFixed(1)} step={1}
                    onChange={(e) => {
                      const mm = parseFloat(e.target.value) || 0;
                      // QR code là vuông, nên width = height
                      updateElementSize(selectedElement.id, element.id, element.elementId, mm, mm);
                    }}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" />
                </div>
                <input type="range" min="1" max={columnWidth} value={element.width}
                  onChange={(e) => {
                    const mm = parseFloat(e.target.value);
                    updateElementSize(selectedElement.id, element.id, element.elementId, mm, mm);
                  }}
                  className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                <div className="flex gap-1">
                  {[10, 15, 20, 25].map(w => (
                    <button key={w}
                      onClick={() => updateElementSize(selectedElement.id, element.id, element.elementId, w, w)}
                      className={`flex-1 text-xs py-1 border rounded hover:bg-gray-50 ${Math.round(element.width) === w ? 'bg-blue-50 border-blue-500 text-blue-600' : 'text-gray-600'}`}>
                      {`${w}mm`}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Các element khác: riêng width và height */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Width (mm)</label>
                    <input type="number" value={+element.width.toFixed(1)} step={1}
                      onChange={(e) => {
                        const mm = parseFloat(e.target.value) || 0;
                        updateElementSize(selectedElement.id, element.id, element.elementId, mm, element.height);
                      }}
                      className={`w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500 ${isBarcodeTooNarrow ? 'border-red-500' : 'border-gray-300'}`} />
                  </div>
                  <div />
                </div>
                <input type="range" min="1" max={columnWidth} value={element.width}
                  onChange={(e) => updateElementSize(selectedElement.id, element.id, element.elementId, parseFloat(e.target.value), element.height)}
                  className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer mb-4" />
                {isElementTooWide && (
                  <div className="text-xs text-red-600 mb-2">
                    Element width exceeds current column width of {columnWidth.toFixed(1)}mm.
                  </div>
                )}
                {element.type === TypePrint.BARCODE && isBarcodeTooNarrow && (
                  <div className="text-xs text-red-600 mb-2">
                    Width hiện tại nhỏ hơn kích thước in ({barcodeRequiredWidthMm.toFixed(1)}mm) — barcode sẽ bị méo/cắt khi in.
                  </div>
                )}
                <div className="flex gap-1 mb-4">
                  {[20, 30, 40, 50].map(w => (
                    <button key={w}
                      onClick={() => updateElementSize(selectedElement.id, element.id, element.elementId, w, element.height)}
                      className={`flex-1 text-xs py-1 border rounded hover:bg-gray-50 ${Math.round(element.width) === w ? 'bg-blue-50 border-blue-500 text-blue-600' : 'text-gray-600'}`}>
                      {`${w}mm`}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Height (mm)</label>
                  <input type="range" value={element.height} min="2" max="55" step={1}
                    onChange={(e) => updateElementSize(selectedElement.id, element.id, element.elementId, element.width, parseFloat(e.target.value))}
                    className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                  <div className="text-right text-xs text-gray-400 mt-1">{element.height.toFixed(1)} mm</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ── Render editor ─────────────────────────────────────────────────────────
  const renderCreateTemp = () => (
    <div className="flex flex-1 h-full">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {templateID ? t('editTemplate') : t('createTemplate')}
        </h2>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('templateName')}</label>
          <input type="text" placeholder="E.g. Tem trở 75x55mm" value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('description')}</label>
          <input type="text" placeholder="E.g. In nhãn cho trở,..." value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <h3 className="font-semibold text-gray-800 mb-4">{t('addElement')}</h3>
        <div className="space-y-2">
          {/* {ELEMENT_TYPES.map((type) => (
            <button key={type.id}
              onClick={() => addElement(selectedElement.id >= 0 ? selectedElement.id : 0, type.id)}
              className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition group">
              <div className="flex items-center gap-3">
                <type.icon size={18} className="text-gray-500" />
                <span className="text-sm text-gray-700">{type.name}</span>
              </div>
              <Plus size={18} className="text-gray-400 group-hover:text-teal-500" />
            </button>
          ))} */}
          {ELEMENT_GROUPS.map((type) => {
            const groupLabels: Record<string, string> = {
              "1": "Văn bản & Hình ảnh",
              "2": "Mã vạch",
              "3": "Hình học",
            };
            return (
              <DropdownList 
                key={type.id}
                label={groupLabels[type.id] || "Thêm phần tử"}
                list={type.value} 
                onSelect={(item) => addElement(selectedElement.id >= 0 ? selectedElement.id : 0, item.id as unknown as TypePrint)}
              />
            );
          })}
        </div>

        <h3 className="font-semibold text-gray-800 mt-8 mb-4">{t('uploadDataExcel')}</h3>
        <button
          onClick={() => {
            if (listTemp.find(item => item.elements.length === 0)) {
              showSnackBar('WARNING', 'Vui lòng thiết kế và lưu mẫu trước khi nhập dữ liệu.');
              return;
            }
            if (listTemp.find(item => item.elements.find(el => !el.elementId?.trim()))) {
              showSnackBar('WARNING', 'Vui lòng điền Element ID cho tất cả các thành phần.');
              return;
            }
            (excelRef.current as any)?.click();
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-500">
          <File size={18} /><span className="text-sm">Upload Data</span>
        </button>
        <input ref={excelRef} type="file"
          accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          onChange={handleFileChange} className="hidden" />
        <h3 className="font-semibold text-gray-800 mt-8 mb-4">{t('importTemplate')}</h3>
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleExportTemplate}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-teal-300 rounded-lg hover:bg-teal-50 transition text-teal-800">
            <Download size={18} /><span className="text-sm">{t('exportTemplate')} (JSON)</span>
          </button>
          <button
            type="button"
            onClick={() => (importRef.current as HTMLInputElement | null)?.click()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-500">
            <File size={18} /><span className="text-sm">{t('importTemplate')} (JSON)</span>
          </button>
          <input
            ref={importRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImportTemplate}
            className="hidden"
          />
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-800">{t('designer')}</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex gap-6">
          <div className="flex-1">
            {/* Toolbar — các nút và input giữ px (UI thuần) */}
            <div className="mb-4 flex gap-4 items-center bg-white p-3 rounded-lg border shadow-sm">
              <div className="flex items-center gap-2">
                <Columns size={16} className="text-gray-500" />
                <span className="text-sm font-medium">{t('paperSize')}:</span>
              </div>
              <div>
                <label className="text-xs text-gray-500 mr-2">W (mm)</label>
                <input type="number" value={paperWidth}
                  min={paperCount > 1 ? paperCount + columnGap * (paperCount - 1) : 1}
                  max={300}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    const minWidth = paperCount > 1 ? paperCount + columnGap * (paperCount - 1) : 1;
                    setPaperWidth(Math.max(minWidth, Math.min(300, value)));
                  }}
                  className="w-16 px-2 py-1 text-sm border rounded" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mr-2">H (mm)</label>
                <input type="number" value={paperHeight}
                  min={1}
                  max={200}
                  onChange={(e) => setPaperHeight(parseInt(e.target.value) || 50)}
                  className="w-16 px-2 py-1 text-sm border rounded" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mr-2">Số lượng tem / hàng</label>
                <input type="number" value={paperCount}
                  min={1}
                  max={4}
                  onChange={(e) => {
                    const next = Math.max(1, Math.min(4, parseInt(e.target.value) || 1));
                    const minWidth = next > 1 ? next + columnGap * (next - 1) : 1;
                    setPaperCount(next);
                    if (paperWidth < minWidth) setPaperWidth(minWidth);
                  }}
                  className="w-16 px-2 py-1 text-sm border rounded" />
              </div>
              {paperCount > 1 && (
                <div>
                  <label className="text-xs text-gray-500 mr-2">Gap (mm)</label>
                  <input type="number" value={columnGap}
                    min={0}
                    max={Math.max(0, paperWidth - paperCount)}
                    onChange={(e) => {
                      const nextGap = Math.max(0, parseInt(e.target.value) || 0);
                      const minWidth = paperCount > 1 ? paperCount + nextGap * (paperCount - 1) : 1;
                      setColumnGap(nextGap);
                      if (paperWidth < minWidth) setPaperWidth(minWidth);
                    }}
                    className="w-16 px-2 py-1 text-sm border rounded" />
                </div>
              )}
              <div className="flex items-center gap-2 ml-auto">
                <button onClick={() => setListTemp(prev => prev.map(t => ({ ...t, elements: [] })))}
                  className="flex items-center gap-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-500">
                  <Trash2 size={14} /> {t('clear')}
                </button>
                <button onClick={handlePrintTemp}
                  className="flex items-center gap-2 px-3 py-1 bg-gray-800 text-white rounded text-sm hover:bg-gray-700">
                  <Printer size={14} /> Print
                </button>
                <button onClick={async () => {
                  const response = await handleSaveTemplate(listTemp, {
                    templateID, templateName, description, paperWidth, paperHeight, column: paperCount,
                  });
                  if (!response) return;
                  setIsChangeData(response.isChangeData);
                  if (response.case === 1) {
                    setTemplates(prev => prev.map(t => t.templateId === templateID ? response.template : t));
                  } else {
                    setTemplates(prev => [...prev, response.template]);
                  }
                }} className="flex items-center gap-2 px-3 py-1 bg-teal-600 text-white rounded text-sm hover:bg-teal-500">
                  <File size={14} /> {t('save')}
                </button>
              </div>
            </div>

            {/* Canvas wrapper — gap dùng mm */}
            <div className="overflow-auto bg-gray-200 p-8 rounded-xl min-h-[500px]">
              <div
                ref={canvasWrapperRef}
                className="flex justify-center"
                style={{ gap: `${columnGap}mm` }}
              >
                {Array.from({ length: paperCount }, (_, i) => (
                  <TemplateComp
                    key={i}
                    index={i}
                    elements={listTemp[i]?.elements ?? []}
                    paperHeight={paperHeight}
                    paperWidth={paperWidth}
                    paperCount={paperCount}
                    columnGapMm={columnGap}
                    selectElement={selectedElement}
                    setListTemp={setListTemp}
                    setSelectElement={setSelectedElement}
                    wrapperRef={canvasWrapperRef}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Properties Panel */}
          {renderPropertiesPanel()}
        </div>
      </div>

      <ModalChoose
        title={t('confirmNotSave')}
        message={t('confirmNotSaveDesc')}
        txtBtn2="OK"
        ref={modalConfirmRef}
        onConfirm2={()=> {
          switchToListTab()
          setChangeTab(true)
        }}
      />
    </div>
  );

  // ── Load danh sách template ───────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const response = await Api.getData(TEMPLATE_PRINT.getAll, {}, true);
        if (response.code === '200') setTemplates(response.data);
        else { setTemplates([]); showSnackBar('WARNING', `Error: ${response.data || 'Unknown error'}`); }
      } catch (err) { console.error('Error fetching templates:', err); }
    })();
  }, []);

  // ── Register managers ─────────────────────────────────────────────────────
  useEffect(() => {
    loadingRef      && LoadingManager.register(loadingRef);
    networkErrorRef && NetworkErrorManager.register(networkErrorRef);
    snackBarRef     && SnackBarManager.register(snackBarRef);
    return () => {
      LoadingManager.unregister(loadingRef);
      NetworkErrorManager.unregister(networkErrorRef);
      SnackBarManager.unregister(snackBarRef);
    };
  }, []);

  // ── Load chi tiết template để edit ───────────────────────────────────────
  const handleEditTemplate = async (id: string) => {
    try {
      const response = await Api.getData(`${TEMPLATE_PRINT.getDetails}/${id}`, {}, true);
      if (response.code !== '200') {
        showSnackBar('WARNING', `Error: ${response.message || 'Unknown error'}`);
        return;
      }

      const temp = response.data;
      setPaperWidth(Number(temp.width));
      setPaperHeight(Number(temp.height));
      setColumnGap(Number(temp.gap ?? COLUMN_GAP_MM));
      setTemplateName(temp.name);
      setPaperCount(temp.columns);
      setDescription(temp.description);
      setTemplateID(id);

      const loadedElements: Element[] = temp.elements.map((el: any) => ({
        id:           el.id,
        name:         getElementName(renderTypeItem(el.itemId)),
        type:         renderTypeItem(el.itemId),
        content:      el.content,
        x:            Number(el.x),           // mm
        y:            Number(el.y),           // mm
        padding:      el.properties?.padding ?? 0,
        margin:       el.properties?.margin ?? 0,
        column:       Number(el.column),
        width: Number(el.width),
        height:       Number(el.height),      // mm
        fontSize:     getPropertyEID(el).fontSize,   // pt
        fontWeight:   el.properties?.fontWeight ?? 'normal',
        textAlign:    el.properties?.textAlign ?? 'left',
        displayTime:  getPropertyEID(el).displayTime,
        elementId:    getPropertyEID(el).eId,
        fontFamily:   getPropertyEID(el).fontFamily,
        strokeWidthMm: getPropertyEID(el).strokeWidthMm,
      }));

      const grouped: Templates[] = Object.values(
        loadedElements.reduce((acc, el) => {
          const col = el.column;
          if (!acc[col]) {
            acc[col] = {
              elements: [], templateId: id, name: temp.name,
              description: temp.description, height: Number(temp.height),
              width: Number(temp.width), gap: COLUMN_GAP_MM,
              status: 'ACTIVE', createdAt: new Date().toISOString(),
            };
          }
          acc[col].elements.push(el);
          return acc;
        }, {} as Record<number, Templates>)
      );

      const fullList: Templates[] = Array.from({ length: temp.columns }, (_, i) =>
        grouped[i] ?? emptyTemplate(Number(temp.width), Number(temp.height))
      );

      setListTemp(fullList);
      setChangeTab(false);
    } catch (err) {
      console.error('Error loading template:', err);
    }
  };

  const buttomSideBar = useMemo(() => (
    <button onClick={handleToggleTab}
      className="m-4 px-4 py-2 bg-green-800 text-white rounded hover:bg-green-700 flex items-center justify-center w-full gap-2">
      {changeTab
        ? <><Printer size={16} /> {t('createTemplate')}</>
        : <><ListOrdered size={16} /> {t('listTemplate')}</>}
    </button>
  ), [changeTab, handleToggleTab, t]);

  return (
    <BackgroundTemplate bottomSideBar={buttomSideBar}>
      <SnackBarModal    ref={snackBarRef} />
      <LoadingModal     ref={loadingRef} />
      <NetworkErrorModal ref={networkErrorRef} />

      {changeTab ? (
        <TemplateList
          data={templates}
          onEdit={handleEditTemplate}
          onDelete={async (id) => {
            const ok = await handleDeleteTemp(id);
            if (ok) setTemplates(prev => prev.filter(t => t.templateId !== id));
          }}
        />
      ) : (
        renderCreateTemp()
      )}
    </BackgroundTemplate>
  );
};

export default TemplateBuilder;