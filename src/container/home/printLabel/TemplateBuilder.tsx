import Api from '@axios/helpers';
import { PRINT, TEMPLATE_PRINT } from '@axios/urls';
import { showSnackBar } from '@component/alert/SnackBarModal';
import ToggleButton from '@component/button/ToggleButton';
import DropdownButton from '@component/dropdown/DropdownButton';
import ModalChoose from '@component/modal/ModalChoose';
import BackgroundTemplate from '@container/template/BackgroundTemplate';
import { generateBarcode, useUnsavedChanges } from '@functions';
import { listFontPrint, MM_TO_PX_RATIO } from '@src/setup/DataInit';
import { DataPrintField, PrinterBuilderRequest, TemplateProps, TypePrint } from '@type';
import i18next from 'i18next';
import { Columns, File, ImageIcon, ListOrdered, Plus, Printer, Trash2 } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_ELEMENT_HEIGHTS, ELEMENT_TYPES, getElementName, getPropertyEID, renderTypeItem } from './config/Constants';
import { Element, WidthValue } from "./config/Type";
import { handleDeleteTemp, handleSaveTemplate } from './hooks/AxiosTemplateData';
import TemplateList from './TemplateList';
import { importFilePrint } from './utils/ExcelFilePrint';
import { useTranslation } from 'react-i18next';


const TemplateBuilder: React.FC = () => {
  const [templateName, setTemplateName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [templateID, setTemplateID] = useState<string>('');
  const [elements, setElements] = useState<Element[]>([]);
  const { t } = useTranslation();
  
  const [selectedElement, setSelectedElement] = useState<number | null>(null);
  const [paperWidth, setPaperWidth] = useState<number>(75); // mm
  const [paperHeight, setPaperHeight] = useState<number>(55); // mm
  const [paperCount, setPaperCount] = useState<number>(1); // mm
  const printAreaRef = useRef<HTMLDivElement>(null);
  const excelRef = useRef(null);
  const modalConfirmRef: any = useRef(null);
  const [tempImageUrl, setTempImageUrl] = useState<string>(''); 
  const [changeTab, setChangeTab] = useState<boolean>(true); 
  const [isChangeData, setIsChangeData] = useState<boolean>(false);
  const [templates, setTemplates] = useState<TemplateProps[]>([])
  
  // State mới cho Kéo thả tuyệt đối
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [draggedElementId, setDraggedElementId] = useState<number | null>(null);
  // Offset của chuột so với góc (x, y) của element khi bắt đầu kéo
  const [dragStartOffset, setDragStartOffset] = useState<{ x: number, y: number } | null>(null);

  const addElement = useCallback((type: TypePrint) => {
    const newElementHeight = DEFAULT_ELEMENT_HEIGHTS[type.toLocaleLowerCase() as keyof typeof DEFAULT_ELEMENT_HEIGHTS] || 15;

    let maxBottomY = 0;
    elements.forEach(el => {
      maxBottomY = Math.max(maxBottomY, el.y + el.height);
    });

    const newY = maxBottomY > 0 ? maxBottomY + 5 : 5;

    const newElement: Element = {
      id: Date.now(),
      type,
      elementId: '',
      name: getElementName(type),
      content: type === TypePrint.DATETIME ? new Date().toISOString().slice(0, 16)
        : type === TypePrint.BARCODE ? '9385241840319'
          : type === TypePrint.TEXT ? 'Sample Text'
            : '',
      widthPercent: type === TypePrint.DATETIME ? 40 : 100,
      height: newElementHeight,
      fontSize: type !== TypePrint.IMAGE ? 10 : undefined,
      fontWeight: 'normal',
      textAlign: 'left',
      padding: 0,
      margin: 0,
      x: 0,
      y: newY,
      displayTime: type === TypePrint.DATETIME ? true : undefined,
    };

    setElements(prev => [...prev, newElement]);
    setIsChangeData(true);
  }, [elements]);

  // Hàm xử lý khi click nút chuyển tab
  const handleToggleTab = () => {
    // Nếu đang ở tab chỉnh sửa và có thay đổi chưa lưu
    if (!changeTab && isChangeData) {
      modalConfirmRef.current?.openModal();
    } else {
      // Nếu không có thay đổi hoặc đang ở tab danh sách, chuyển tab trực tiếp
      switchToListTab();
    }
  };

  // Hàm chuyển sang tab danh sách và reset form
  const switchToListTab = () => {
    setChangeTab(!changeTab);
    setPaperWidth(75);
    setPaperHeight(55);
    setTemplateName("");
    setDescription("");
    setElements([]);
    setSelectedElement(null);
    setTemplateID("");
    setIsChangeData(false);
  };

  // Sử dụng hook cảnh báo
  useUnsavedChanges({
    hasUnsavedChanges: isChangeData,
    message: 'Bạn có thay đổi chưa được lưu. Bạn có chắc chắn muốn thoát?',
  });

  const removeElement = useCallback((id: number) => {
    setIsChangeData(true);
    setElements(prev => prev.filter(el => el.id !== id));
    setSelectedElement(prev => prev === id ? null : prev);
  }, []);

  const updateElementContent = useCallback((id: number, content: string | File) => {
    setIsChangeData(true);
    setElements(prev => prev.map(el =>
      el.id === id ? { ...el, content } : el
    ));
  }, []);

  const updateElementId = useCallback((id: number, elementId: string) => {
    setElements(prev => prev.map(el =>
      el.id === id ? { ...el, elementId } : el
    ));
  }, []);


  const updateElementSize = useCallback((id: number, eId: string, widthPercent: WidthValue, height: number) => {
    if (eId && eId.includes('ABS')) {
      showSnackBar('WARNING', 'Cannot resize ABS elements.');
      return;
    }

    setIsChangeData(true);
    const safeWidth = Math.max(5, Math.min(100, widthPercent));
    setElements(prev =>
      prev.map(el => el.id === id ? { ...el, widthPercent: safeWidth, height } : el)
    );
  }, []);

  const updateElementStyle = useCallback((id: number, updates: Partial<Element>) => {
    setIsChangeData(true);
    setElements(prev => prev.map(el =>
      el.id === id ? { ...el, ...updates } : el
    ));
  }, []);

  // Logic Dragging mới (dựa trên tọa độ tuyệt đối)
  const handleDragElementMouseDown = useCallback((
    e: React.MouseEvent,
    elementId: number,
    eId: string
  ) => {
    if (eId && eId.includes('ABS')) {
      showSnackBar('WARNING', 'Cannot resize ABS elements.');
      return;
    }

    e.stopPropagation();
    const targetElement = elements.find(el => el.id === elementId);
    if (!targetElement || !printAreaRef.current) return;

    setIsChangeData(true);
    setElements(prev => {
      const otherElements = prev.filter(el => el.id !== elementId);
      return [...otherElements, targetElement];
    });

    setIsDragging(true);
    setDraggedElementId(elementId);
    setSelectedElement(elementId);

    const rect = printAreaRef.current.getBoundingClientRect();
    setDragStartOffset({
      x: e.clientX - rect.left - targetElement.x,
      y: e.clientY - rect.top - targetElement.y,
    });
  }, [elements]);

  const handleGlobalMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || draggedElementId === null || !dragStartOffset || !printAreaRef.current) return;

    const containerRect = printAreaRef.current.getBoundingClientRect();

    // Tính toán vị trí mới của element
    let newX = e.clientX - containerRect.left - dragStartOffset.x;
    let newY = e.clientY - containerRect.top - dragStartOffset.y;

    const currentElement = elements.find(el => el.id === draggedElementId);
    if (!currentElement) return;

    // Kích thước element (tính bằng px)
    const elementWidthPx = (currentElement.widthPercent / 100) * containerRect.width;
    const elementHeightPx = currentElement.height;

    // Giới hạn kéo trong container
    newX = Math.max(0, Math.min(newX, containerRect.width - elementWidthPx));
    newY = Math.max(0, Math.min(newY, containerRect.height - elementHeightPx));

    setElements(prev => prev.map(el =>
      el.id === draggedElementId ? { ...el, x: newX, y: newY } : el
    ));
    setIsChangeData(true);
  }, [isDragging, draggedElementId, dragStartOffset, elements]);

  const handleGlobalMouseUp = useCallback(() => {
    setIsDragging(false);
    setDraggedElementId(null);
    setDragStartOffset(null);
  }, []);
  
  const handleImageUpload = useCallback((id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) updateElementContent(id, file);
  }, [updateElementContent]);

  // print with template, data from excel file
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
        if (elements.length === 0) {
          showSnackBar('WARNING', 'Please design and save a template before importing data.');
          return;
        }

        const check = elements.find(el => !el.elementId || el.elementId.trim() === '');
        if (check) return;

        const result = await importFilePrint(file, elements);
        const request = {
          templates: result,
          size: { width: paperWidth, height: paperHeight, gap: 3 },
        };

        if (result && result.length > 0) {
          const response = await Api.postWithJson(PRINT.customizeBuilder, request, true);
          if (response.code === "200") {
            showSnackBar('SUCCESS', "Print job submitted successfully.");
          } else {
            showSnackBar('FALSE', `Error submitting print job: ${response.message || 'Unknown error'}`);
          }
        } else if (result.length === 0) {
          showSnackBar('WARNING', 'Excel file is empty or contains no data rows.');
        }
      } catch (e) {
        showSnackBar('FALSE', `Error submitting print job: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      e.target.value = "";
    }
  }, [elements, paperWidth, paperHeight]);

  const handlePrintTemp = useCallback(async () => {
    try {
      if (elements.length === 0) {
        showSnackBar('WARNING', 'Please design and save a template before importing data.');
        return;
      }

      const dto: PrinterBuilderRequest = {
        id: "1",
        count: 1,
        data: [],
      };

      const dataFields: DataPrintField[] = elements.map(element => {
        if (typeof element.content === 'object') {
          showSnackBar('FALSE', 'Cannot print template with local image files. Please save template and reopen template to print.');
          throw new Error('Cannot print template with local image files.');
        }
        return {
          name: element.elementId,
          type: element.type.toLocaleUpperCase() as TypePrint,
          value: typeof element.content === 'string' ? element.content as string : '',
          width: element.widthPercent,
          height: element.height,
          x: element.x,
          y: element.y,
          properties: {
            fontSize: element.fontSize,
            displayTime: element.displayTime,
            elementId: element.elementId,
            fontFamily: element.fontFamily,
          }
        };
      });

      dto.data = dataFields;

      const request = {
        templates: [dto],
        size: { width: paperWidth, height: paperHeight, gap: 3 },
      };

      if (dataFields) {
        const response = await Api.postWithJson(PRINT.customizeBuilder, request, true);
        if (response.code === "200") {
          showSnackBar('SUCCESS', "Print job submitted successfully.");
        } else {
          showSnackBar('FALSE', `Error submitting print job: ${response.data || 'Unknown error'}`);
        }
      } else {
        showSnackBar('WARNING', 'No data rows.');
      }
    } catch (e) {
      showSnackBar('FALSE', `Error submitting print job: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  }, [elements, paperWidth, paperHeight]);

  const ElementRenderer: React.FC<{ element: Element }> = React.memo(({ element }) => {
    const commonStyle = useMemo(() => ({
      margin: `${element.margin || 0}px`,
    }), [element.padding, element.margin]);

    switch (element.type) {
      case TypePrint.TEXT:
        return (
          <div style={{
            ...commonStyle,
            fontSize: `${element.fontSize}px`,
            fontWeight: element.fontWeight,
            textAlign: element.textAlign,
            height: `${element.height}px`,
            display: 'flex',
            alignItems: 'center',
            cursor: 'default',
            userSelect: 'none',
            width: '100%',
            overflow: 'hidden'
          }}>
            {element.content as string || 'Sample Text'}
          </div>
        );

      case TypePrint.BARCODE:
        return (
          <div style={{ margin: `${element.margin || 0}px`, height: `${element.height}px` }}
            className="flex flex-col items-center justify-center w-full overflow-hidden">
            {element.content ? (
              <img src={generateBarcode(element.content as string, element.displayTime)}
                alt="Barcode" style={{ height: '95%', width: '100%' }} />
            ) : (
              <div className="text-gray-400 text-sm">No barcode data</div>
            )}
          </div>
        );

      case TypePrint.DATETIME:
        const dateContent = element.content ? new Date(element.content as string) : null;
        let formattedDate = 'Select date/time';

        if (dateContent) {
          formattedDate = element.displayTime === false
            ? dateContent.toLocaleDateString('vi-VN')
            : dateContent.toLocaleString('vi-VN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            });
        }

        return (
          <div style={{
            ...commonStyle,
            fontSize: `${element.fontSize}px`,
            height: `${element.height}px`,
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            overflow: 'hidden'
          }}>
            {formattedDate}
          </div>
        );

      case TypePrint.IMAGE:
        let imgSrc: string | null = null;

        if (element.content) {
          if (typeof element.content === 'string') {
            imgSrc = element.content;
          } else if (typeof element.content === 'object' && element.content !== null) {
            try {
              imgSrc = URL.createObjectURL(element.content as File);
            } catch (e) {
              console.error('Error creating object URL:', e);
            }
          }
        }

        return (
          <div style={commonStyle}>
            {imgSrc ? (
              <img src={imgSrc} alt="Uploaded" className="w-full object-cover"
                style={{ height: `${element.height}px` }} />
            ) : (
              <div className="w-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50"
                style={{ height: `${element.height}px` }}>
                <ImageIcon className="mb-2 text-gray-400" size={32} />
                <p className="text-xs text-gray-500">No image</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  });

  ElementRenderer.displayName = 'ElementRenderer';

  const renderCreateTemp = (els: Element[]) => {
    return (
      <div className='flex flex-1 h-full'>
        <div className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto">
          {/* ... Phần Sidebar Giữ Nguyên ... */}
          <h2 className="text-2xl font-bold text-gray-800 mb-6">{!!templateID ? t('editTemplate') : t('createTemplate')}</h2>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('templateName')}</label>
            <input type="text" placeholder="E.g. Tem trở 75x55mm" value={templateName} onChange={(e) => setTemplateName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('description')}</label>
            <input type="text" placeholder="E.g. In nhãn cho trở,..." value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <h3 className="font-semibold text-gray-800 mb-4">{t('addElement')}</h3>
          <div className="space-y-2">
            {ELEMENT_TYPES.map((type) => (
              <button key={type.id} onClick={() => addElement(type.id)} className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition group">
                <div className="flex items-center gap-3"><type.icon size={18} className="text-gray-500" /><span className="text-sm text-gray-700">{type.name}</span></div>
                <Plus size={18} className="text-gray-400 group-hover:text-teal-500" />
              </button>
            ))}
          </div>
          <h3 className="font-semibold text-gray-800 mt-8 mb-4">{t('uploadDataExcel')}</h3>
          <button 
          onClick={() => {
            if(elements.length === 0) {
                showSnackBar('WARNING', "Vui lòng thiết kế và lưu mẫu trước khi nhập dữ liệu.")
                return;
            }
            const check = elements.find(el => el.elementId == null || el.elementId.trim() === '');
            if(check) {
                showSnackBar('WARNING', `Vui lòng điền Element ID cho tất cả các thành phần trước khi nhập dữ liệu.`);
                return;
            }
            if (excelRef.current) {
              (excelRef.current as HTMLInputElement).click();
            }
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-500">
            <File size={18} />
            <span className="text-sm">Upload Data</span>
          </button>
          <input 
            ref={excelRef}
            onChange={(e) => handleFileChange(e)}
            type="file" 
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            className="mt-4 w-full text-sm text-gray-500 hidden" 
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-800">{t('designer')}</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-6 flex gap-6">
            {/* Canvas Area */}
            <div className="flex-1">
              <div className="mb-4 flex gap-4 items-center bg-white p-3 rounded-lg border shadow-sm">
                {/* ... Controls Giữ Nguyên ... */}
                <div className="flex items-center gap-2">
                  <Columns size={16} className="text-gray-500"/>
                  <span className="text-sm font-medium">{t('paperSize')}:</span>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mr-2">W (mm)</label>
                  <input type="number" value={paperWidth} onChange={(e) => setPaperWidth(parseInt(e.target.value) || 80)} className="w-16 px-2 py-1 text-sm border rounded" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mr-2">H (mm)</label>
                  <input type="number" value={paperHeight} onChange={(e) => setPaperHeight(parseInt(e.target.value) || 50)} className="w-16 px-2 py-1 text-sm border rounded" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mr-2">Số lượng tem / hàng (tấm)</label>
                  <input type="number" value={paperCount} onChange={(e) => setPaperCount(parseInt(e.target.value) || 1)} className="w-16 px-2 py-1 text-sm border rounded" />
                </div>
                <div className='flex items-center gap-2 ml-auto'>
                  <button onClick={() => setElements([])} className="flex items-center gap-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-500"><Trash2 size={14} /> {t('clear')}</button>
                  <button onClick={()=>handlePrintTemp()} className="flex items-center gap-2 px-3 py-1 bg-gray-800 text-white rounded text-sm hover:bg-gray-700"><Printer size={14} /> Print</button>
                  <button onClick={async () => {
                     const dataRequest = {
                      templateID,
                      templateName,
                      description,
                      paperWidth,
                      paperHeight,
                      column: paperCount
                     }
                     const response = await handleSaveTemplate(elements, dataRequest)
                     if(!response) return;

                     setIsChangeData(response.isChangeData)
                     if(response.case == 1){
                      setTemplates((prev) => prev.map(t => t.templateId === templateID ? response.template : t));
                     }else{
                      setTemplates((prev) => [...prev, response.template]);
                     }

                  }} className="flex items-center gap-2 px-3 py-1 bg-teal-600 text-white rounded text-sm hover:bg-teal-500"><File size={14} /> {t('save')}</button>
                </div>
              </div>
              <div className="overflow-auto bg-gray-200 p-8 rounded-xl flex justify-center min-h-[500px]">
                  <div 
                  ref={printAreaRef}
                  className="bg-white shadow-lg transition-all duration-300"
                  // Cập nhật style cho Absolute Positioning
                  style={{
                      width: `${paperWidth * MM_TO_PX_RATIO}px`, 
                      height: `${paperHeight * MM_TO_PX_RATIO}px`,
                      position: 'relative',
                      // Loại bỏ flexbox properties
                  }}
                  // Gán sự kiện cho container để bắt Global MouseMove/MouseUp
                  onMouseMove={handleGlobalMouseMove}
                  onMouseUp={handleGlobalMouseUp}
                  onMouseLeave={handleGlobalMouseUp}
                  >
                  {els.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-300 pointer-events-none">
                          <p>Empty Canvas</p>
                      </div>
                  )}
                  {els.map((element) => (
                      <div
                          key={element.id}
                          data-id={element.id} // Thêm data-id để tìm element khi in
                          className={`group box-border ${selectedElement === element.id ? 'z-10' : 'z-0'}`}
                          // Sử dụng x, y tuyệt đối và position: absolute
                          style={{ 
                              position: 'absolute',
                              left: `${element.x}px`,
                              top: `${element.y}px`,
                              width: `${element.widthPercent}%`, // Width theo %
                              height: `${element.height}px`,
                              zIndex: selectedElement === element.id || draggedElementId === element.id ? 20 : 10, // Đưa element đang thao tác lên trên
                          }}
                          // Ngừng propagation để click không bị lọt ra ngoài canvas
                          onClick={(e) => { e.stopPropagation(); setSelectedElement(element.id); }}
                      >
                          {/* Container nội dung */}
                          <div
                              // Thay thế draggable bằng onMouseDown để kéo
                              onMouseDown={(e) => handleDragElementMouseDown(e, element.id, element.elementId)}
                              className={`h-full border transition-all 
                                ${element.type != TypePrint.IMAGE ? selectedElement === element.id ? 'border-blue-500 bg-blue-50/10 cursor-grab' : 'border-gray-300 hover:border-gray-400 cursor-grab' : "border-white"}
                                ${draggedElementId === element.id ? 'opacity-70 cursor-grabbing' : ''}
                            `}
                          >
                              <div className="w-full h-full relative">
                                  <ElementRenderer element={element} />
                              </div>
                          </div>
                          
                          {/* Resize Handle (Right side) */}
                          {/* <div
                              className="resize-handle absolute top-0 right-0 bottom-0 w-2 cursor-col-resize z-30 hover:bg-blue-400/50 group-hover:bg-blue-200/30 transition"
                              onMouseDown={(e) => handleResizeMouseDown(e, element.id)}
                          /> */}
                      </div>
                  ))}
                  </div>
              </div>
            </div>

            {/* Right Panel - Properties (Giữ nguyên) */}
            {selectedElement !== null && els.find(el => el.id === selectedElement) && (
              <div className="w-80 bg-white rounded-lg shadow-sm border border-gray-200 p-6 overflow-y-auto h-full">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-gray-800">Properties</h3>
                  <button onClick={() => removeElement(selectedElement)} className="text-gray-400 hover:text-red-500 transition"><Trash2 size={18} /></button>
                </div>

                {(() => {
                  const element = els.find(el => el.id === selectedElement)!;
                  return (
                    <div className="space-y-4">
                      {/* Content Editors (Giữ nguyên) */}
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded inline-block">{element.name}</div>
                      </div>
                      <input
                          value={element.elementId as string}
                          placeholder={t('elementId')}
                          onChange={(e) => updateElementId(element.id, e.target.value)}
                          className="w-full px-3 py-2 border rounded-md text-sm"
                      />

                      {element.type === TypePrint.TEXT && (
                        <>
                          <div className="block text-sm font-medium text-gray-700">
                            Content:
                          </div>
                          <textarea
                              value={element.content as string}
                              onChange={(e) => updateElementContent(element.id, e.target.value)}
                              className="w-full px-3 py-2 border rounded-md text-sm"
                              rows={2}
                          />
                          <div>
                              <label className="text-xs text-gray-500 mb-1 block">Font Size</label>
                              <input
                                  type="number"
                                  value={element.fontSize}
                                  onChange={(e) => updateElementStyle(element.id, { fontSize: parseInt(e.target.value) || 0 })}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                              />
                          </div>
                          <div>
                              <label className="text-xs text-gray-500 mb-1 block">Font Family</label>
                              <div className='float-end'>
                                <DropdownButton list={listFontPrint} onSelect={(font) => updateElementStyle(element.id, { fontFamily: font.name })} dfChoose={!!element.fontFamily ? {id: element.fontFamily, name: element.fontFamily} : listFontPrint[0]} />
                              </div>
                          </div>
                        </>
                      )}
                      {element.type === TypePrint.BARCODE && (
                        <>
                          <input
                              value={element.content as string}
                              placeholder={t('barcodeData')}
                              onChange={(e) => updateElementContent(element.id, e.target.value)}
                              className="w-full px-3 py-2 border rounded-md text-sm"
                          />
                          <div className="flex items-center justify-between mt-2">
                            Display content:
                            <ToggleButton defaultValue={element.displayTime !== false} 
                                    onChange={(displayTime) => updateElementStyle(element.id, { displayTime })} />
                          </div>
                          {/* <div className="flex items-center justify-between mt-2">
                            Position:
                            <ToggleButton defaultValue={element.textPosition !== false} 
                                    onChange={(textPosition) => updateElementStyle(element.id, { textPosition })} />
                          </div> */}
                        </>
                      )}
                      {element.type === TypePrint.IMAGE && (
                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Image Source
                            </label>

                            {/* 1. INPUT URL */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                    Paste Image URL
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        value={tempImageUrl || (typeof element.content === 'string' ? element.content : '')}
                                        onChange={(e) => setTempImageUrl(e.target.value)}
                                        placeholder="E.g. https://cloud.mkb-tech.vn/logo.png"
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                    <button
                                        onClick={() => {
                                            if (tempImageUrl) {
                                                updateElementContent(element.id, tempImageUrl);
                                                setTempImageUrl(''); 
                                            }
                                        }}
                                        disabled={!tempImageUrl}
                                        className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition disabled:bg-gray-400"
                                    >
                                        Apply
                                    </button>
                                </div>
                                {(typeof element.content === 'string' && element.content) && (
                                    <p className="text-xs text-gray-500 mt-1 truncate">Current: {element.content}</p>
                                )}
                            </div>

                            <div className="flex items-center">
                                <hr className="flex-1 border-gray-200" />
                                <span className="text-xs text-gray-400 px-2">OR</span>
                                <hr className="flex-1 border-gray-200" />
                            </div>

                            {/* 2. UPLOAD FILE */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                    Upload Image File
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(element.id, e)}
                                    onClick={(e) => {
                                        updateElementContent(element.id, ''); 
                                        setTempImageUrl('');
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                            </div>
                        </div>
                      )}
                      {element.type === TypePrint.DATETIME && (
                        <>
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Font Size</label>
                                <input
                                    type="number"
                                    value={element.fontSize}
                                    onChange={(e) => updateElementStyle(element.id, { fontSize: parseInt(e.target.value) || 0 })}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className='grid grid-cols-2 items-center'>
                                <label className="text-xs items-center text-gray-500 block">Font Family:</label>
                                <DropdownButton list={listFontPrint} onSelect={(font) => updateElementStyle(element.id, { fontFamily: font.name })} dfChoose={!!element.fontFamily ? {id: element.fontFamily, name: element.fontFamily} : listFontPrint[0]} />
                            </div>
                            <input
                                type="datetime-local"
                                value={element.content as string}
                                onChange={(e) => updateElementContent(element.id, e.target.value)}
                                className="w-full px-3 py-2 border rounded-md text-sm"
                            />
                            {/*  Tùy chọn hiển thị giờ */}
                            <div className="flex items-center justify-between mt-2">
                                <label className="text-sm font-medium text-gray-700">Display Time</label>
                                <ToggleButton 
                                    // True nếu displayTime là true hoặc undefined
                                    defaultValue={element.displayTime !== false} 
                                    onChange={(displayTime) => updateElementStyle(element.id, { displayTime })} 
                                />
                            </div>
                        </>
                      )}

                      <hr className="border-gray-100" />

                      {/* Controls cho Position (X, Y) */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-sm font-medium text-gray-700">Position (px)</label>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div>
                              <label className="text-xs text-gray-500 mb-1 block">X (Left)</label>
                              <input
                                  type="number"
                                  value={Math.round(element.x)}
                                  onChange={(e) => updateElementStyle(element.id, { x: parseInt(e.target.value) || 0 })}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                              />
                          </div>
                          <div>
                              <label className="text-xs text-gray-500 mb-1 block">Y (Top)</label>
                              <input
                                  type="number"
                                  value={Math.round(element.y)}
                                  onChange={(e) => updateElementStyle(element.id, { y: parseInt(e.target.value) || 0 })}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                              />
                          </div>
                        </div>
                      </div>

                      <hr className="border-gray-100" />

                      {/* Controls cho Width/Height */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-sm font-medium text-gray-700">Dimensions</label>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div>
                              <label className="text-xs text-gray-500 mb-1 block">Width (mm)</label>
                              <input
                                  type="number"
                                  value={Math.round((element.widthPercent / 100) * MM_TO_PX_RATIO)}
                                  onChange={(e) => {
                                      const mm = parseInt(e.target.value) || 0;
                                      const newPercent = (mm / paperWidth) * 100;
                                      updateElementSize(element.id, element.elementId, newPercent, element.height);
                                  }}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                              />
                          </div>
                          <div>
                              <label className="text-xs text-gray-500 mb-1 block">Width (%)</label>
                              <div className="relative">
                                  <input
                                      type="number"
                                      value={Math.round(element.widthPercent)}
                                      onChange={(e) => updateElementSize(element.id, element.elementId, parseInt(e.target.value), element.height)}
                                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                  />
                                  <span className="absolute right-2 top-1 text-xs text-gray-400">%</span>
                              </div>
                          </div>
                        </div>

                        {/* Slider cho Width */}
                        <input
                          type="range"
                          min="5" max="100"
                          value={element.widthPercent}
                          onChange={(e) => updateElementSize(element.id, element.elementId, parseInt(e.target.value), element.height)}
                          className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer mb-4"
                        />

                        {/* Các preset nhanh */}
                        <div className="flex gap-1 mb-4">
                          {[25, 33, 50, 100].map(w => (
                              <button
                                  key={w}
                                  onClick={() => updateElementSize(element.id, element.elementId, w, element.height)}
                                  className={`flex-1 text-xs py-1 border rounded hover:bg-gray-50 ${Math.round(element.widthPercent) === w ? 'bg-blue-50 border-blue-500 text-blue-600' : 'text-gray-600'}`}
                              >
                                  {w === 33 ? '1/3' : `${w}%`}
                              </button>
                          ))}
                        </div>

                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Height (px)</label>
                          <input
                            type="range"
                            value={element.height}
                            min="10" max="300"
                            onChange={(e) => updateElementSize(element.id, element.elementId, element.widthPercent, parseInt(e.target.value))}
                            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="text-right text-xs text-gray-400 mt-1">{element.height}px</div>
                        </div>
                      </div>

                      <hr className="border-gray-100" />
                      {/* Styling Controls (Padding, Align...) */}
                      {element.type === TypePrint.TEXT || element.type === TypePrint.DATETIME && (
                          <div className="grid grid-cols-2 gap-2">
                              <div>
                                  <label className="text-xs text-gray-500 mb-1 block">Font Size</label>
                                  <input type="number" value={element.fontSize} onChange={(e) => updateElementStyle(element.id, {fontSize: parseInt(e.target.value)})} className="w-full px-2 py-1 border rounded text-sm"/>
                              </div>
                              {/* <div>
                                  <label className="text-xs text-gray-500 mb-1 block">Align</label>
                                  <div className="flex border rounded overflow-hidden">
                                      {(['left', 'center', 'right'] as const).map(a => (
                                          <button key={a} onClick={() => updateElementStyle(element.id, {textAlign: a})} className={`flex-1 py-1 hover:bg-gray-50 ${element.textAlign === a ? 'bg-blue-100 text-blue-600' : ''}`}>
                                              <div className="w-3 h-3 mx-auto bg-current opacity-50 rounded-sm" />
                                          </button>
                                      ))}
                                  </div>
                              </div> */}
                          </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
        <ModalChoose
          title={t('confirmNotSave')}
          message={t('confirmNotSaveDesc')}
          txtBtn2='OK'
          ref={modalConfirmRef}
          onConfirm2={() => {
            switchToListTab();
          }}
        />
      </div>
    )
  }

  useEffect(() => {
    (async() => {
      try {
        const response = await Api.getData(TEMPLATE_PRINT.getAll, {}, true);
        if (response.code === "200") {
          setTemplates(response.data);
        }else{
          setTemplates([]);
          showSnackBar('WARNING', `Error fetching templates: ${response.message || 'Unknown error'}`);
        }
      }catch (error) {
        console.log('Error fetching templates:', error);
      }
    })()
  }, []);

  const handleEditTemplate = async(id: string) => {
    try {
      const response = await Api.getData(`${TEMPLATE_PRINT.getDetails}/${id}`, {}, true);
      if (response.code === "200") {
        const temp = response.data;
        setPaperWidth(Number(temp.width));
        setPaperHeight(Number(temp.height));
        setTemplateName(temp.name);
        setDescription(temp.description);
        setTemplateID(id);
        
        // Load elements
        const loadedElements: Element[] = temp.elements.map((el: any) => ({
          id: el.id,
          name: getElementName(renderTypeItem(el.itemId)),
          type: renderTypeItem(el.itemId),
          content: el.content,
          x: Number(el.x), // Lấy tọa độ pixel từ API
          y: Number(el.y), // Lấy tọa độ pixel từ API
          padding: 0,
          margin: 0,
          widthPercent: Number(el.width),
          height: Number(el.height),
          fontSize: getPropertyEID(el).fontSize,
          displayTime: getPropertyEID(el).displayTime, //  Mặc định hiển thị giờ khi load template
          elementId: getPropertyEID(el).eId,
          fontFamily: getPropertyEID(el).fontFamily
          // Cần load thêm style properties nếu API có lưu
        }));
        setElements(loadedElements);
        setChangeTab(false); // Chuyển sang tab edit
      }else{
        showSnackBar('WARNING', `Error loading template: ${response.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.log('Error loading template:', error);
    }
  }

  const SideBar = useMemo(()=>{
    return <>
      <nav className="flex-1 pt-4">
            <div className="px-4 py-2.5 text-sm cursor-pointer bg-blue-50 text-blue-600 border-l-4 border-blue-600">{t('template')}</div>
        </nav>
      </>
  }, []) 

  const buttomSideBar = useMemo(() => {
    return <button 
          onClick={() => {
            handleToggleTab();
          }}
          className="m-4 px-4 py-2 bg-green-800 text-white rounded hover:bg-green-700 flex items-center justify-center  w-full gap-2">
            {changeTab ? <><Printer size={16} /> {t('createTemplate')} </> : <><ListOrdered size={16} /> {t('listTemplate')}</>}
          </button>
  }, [changeTab, isChangeData])

  return (
    <BackgroundTemplate sidebar={SideBar} bottomSideBar={buttomSideBar} >
      {changeTab ? (
        <TemplateList
          data={templates}
          onEdit={handleEditTemplate}
          onDelete={async(id)=>{
            const check = await handleDeleteTemp(id)
            if(check){
              setTemplates(prev => prev.filter(t => t.templateId !== id));
            }
          }}
        />
      ) : (
        renderCreateTemp(elements)
      )}
    </BackgroundTemplate>
  );
};

export default TemplateBuilder;