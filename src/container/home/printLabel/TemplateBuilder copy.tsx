import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Plus, Trash2, Type, Calendar, ImageIcon, Printer, Columns, ListOrdered, File, Barcode } from 'lucide-react';
import { formatIfDate, generateBarcode, isNumeric, useUnsavedChanges } from '@functions';
import ToggleButton from '@component/button/ToggleButton';
import images from '@setup_assets/image/images';
import * as XLSX from 'xlsx';
import { DataPrintField, PrinterBuilderRequest, TemplateProps, TypePrint } from '@type';
import Api from '@axios/helpers';
import { PRINT, TEMPLATE_PRINT } from '@axios/urls';
import { showSnackBar } from '@component/alert/SnackBarModal';
import { listFontPrint, MM_TO_PX_RATIO } from '@src/setup/DataInit';
import TemplateList from './TemplateList';
import BackgroundTemplate from '@container/template/BackgroundTemplate';
import i18next from 'i18next';
import DropdownButton from '@component/dropdown/DropdownButton';
import ModalChoose from '@component/modal/ModalChoose';

// 1->100
type WidthValue = number; 

interface Element {
  id: number;
  elementId: string;
  type: 'text' | 'datetime' | 'image' | 'barcode';
  name: string;
  content: string | File | null;
  widthPercent: WidthValue;
  height: number;
  fontSize?: number;
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

const TemplateBuilder: React.FC = () => {
  const [templateName, setTemplateName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [templateID, setTemplateID] = useState<string>('');
  const [elements, setElements] = useState<Element[]>([]);
  
  const [selectedElement, setSelectedElement] = useState<number | null>(null);
  const [paperWidth, setPaperWidth] = useState<number>(75); // mm
  const [paperHeight, setPaperHeight] = useState<number>(55); // mm
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

  const elementTypes = [
    { id: 'text' as const, name: 'Text Input', icon: Type },
    { id: 'barcode' as const, name: 'Barcode', icon: Barcode },
    { id: 'datetime' as const, name: 'Date & Time', icon: Calendar },
    { id: 'image' as const, name: 'Image Upload', icon: ImageIcon },
  ];

  const addElement = (type: 'text' | 'datetime' | 'image' | 'barcode') => {
    // Thay đổi: Tính tổng chiều cao của các element hiện có để đặt element mới 
    // ở vị trí dưới cùng (để không bị chồng lên nhau ngay lập tức)
    // const paperHeightPx = paperHeight * MM_TO_PX_RATIO;
    const newElementHeight = type == 'text' || type == 'datetime' ? 15 : 38; // Chiều cao mặc định của element mới

    // Tìm y lớn nhất + chiều cao của element đó
    let maxBottomY = 0;
    elements.forEach(el => {
        maxBottomY = Math.max(maxBottomY, el.y + el.height);
    });
    
    // Vị trí y mới: dưới element cuối cùng
    const newY = maxBottomY > 0 ? maxBottomY + 5 : 5; 

    // if (newY + newElementHeight > paperHeightPx) {
    //     showSnackBar('FALSE', `Cannot add more elements. Element height exceeds paper height.`);
    //     return;
    // }
    
    const newElement: Element = {
      id: Date.now(),
      type: type,
      elementId: '',
      name: getElementName(type),
      content: type === 'datetime' ? new Date().toISOString().slice(0, 16) : type === 'barcode' ? '9385241840319' : type === 'text' ? 'Sample Text' : '',
      widthPercent: type == 'datetime' ? 40 : 100, // Mặc định full width
      height: newElementHeight,
      fontSize: type != 'image' ? 10 : undefined,
      fontWeight: 'normal',
      textAlign: 'left',
      padding: 4,
      margin: 0,
      x: 0, // Vị trí X mặc định (5px từ lề trái)
      y: newY, // Vị trí Y đã tính toán (pixel)
      displayTime: type === 'datetime' ? true : undefined, //  Set default to true for datetime
    };
    // Loại bỏ calculatePositions
    setElements((prev) => [...prev, newElement]);
    setIsChangeData(true);
  };

  const getElementName = (type: string): string => {
    switch(type) {
      case 'text': return 'Text Input';
      case 'barcode': return 'Barcode';
      case 'datetime': return 'Date & Time';
      case 'image': return 'Image Upload';
      default: return '';
    }
  };

  // Hàm xử lý khi click nút chuyển tab
  const handleToggleTab = () => {
    console.log('handleToggleTab called. changeTab:', changeTab, 'isChangeData:', isChangeData);
    
    // Nếu đang ở tab chỉnh sửa và có thay đổi chưa lưu
    if (!changeTab && isChangeData) {
      modalConfirmRef.current?.openModal();
    } else {
      // Nếu không có thay đổi hoặc đang ở tab danh sách, chuyển tab trực tiếp
      switchToListTab();
    }
  };

  useEffect(() => {
    console.log('isChangeData changed:',{ isChangeData, changeTab});
    
  }, [changeTab, isChangeData]);

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

  const removeElement = (id: number) => {
    setIsChangeData(true);
    setElements(elements.filter(el => el.id !== id));
    if (selectedElement === id) setSelectedElement(null);
  };

  const updateElementContent = (id: number, content: string | File) => {
    setIsChangeData(true);
    setElements(elements.map(el => 
      el.id === id ? { ...el, content } : el
    ));
  };
  const updateElementId = (id: number, elementId: string) => {
    setElements(elements.map(el => 
      el.id === id ? { ...el, elementId } : el
    ));
  };


  const updateElementSize = (id: number, eId: string, widthPercent: WidthValue, height: number) => {
    setIsChangeData(true);
    if(eId != null && eId.includes('ABS')) {
      showSnackBar('WARNING', 'Cannot resize ABS elements.');
      return;
    }
    // Giới hạn width từ 5% đến 100%
    const safeWidth = Math.max(5, Math.min(100, widthPercent));
    // Loại bỏ calculatePositions
    setElements((prev) => 
      prev.map(el => el.id === id ? { ...el, widthPercent: safeWidth, height } : el)
    );
  };

  const updateElementStyle = (id: number, updates: Partial<Element>) => {
    setIsChangeData(true);
    setElements(elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ));
  };

  // Logic Dragging mới (dựa trên tọa độ tuyệt đối)
  const handleDragElementMouseDown = (e: React.MouseEvent, elementId: number, eId: string) => {
    if(eId != null && eId.includes('ABS')) {
      showSnackBar('WARNING', 'Cannot resize ABS elements.');
      return;
    }
    e.stopPropagation();
    const targetElement = elements.find(el => el.id === elementId);
    if (!targetElement || !printAreaRef.current) return;

    setIsChangeData(true);
    // Đặt z-index của element đang kéo lên cao nhất
    setElements(prev => {
        const otherElements = prev.filter(el => el.id !== elementId);
        return [...otherElements, targetElement];
    });

    setIsDragging(true);
    setDraggedElementId(elementId);
    setSelectedElement(elementId);
    
    // Tính toán offset giữa vị trí click và góc (x, y) của element
    const rect = printAreaRef.current.getBoundingClientRect();
    setDragStartOffset({
        x: e.clientX - rect.left - targetElement.x,
        y: e.clientY - rect.top - targetElement.y,
    });
  };

  const handleGlobalMouseMove = (e: React.MouseEvent) => {
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
        el.id === draggedElementId 
            ? { ...el, x: newX, y: newY } 
            : el
    ));
    setIsChangeData(true);
  };

  const handleGlobalMouseUp = () => {
    setIsDragging(false);
    setDraggedElementId(null);
    setDragStartOffset(null);
  };
  
  // print 1 template with current design - no import file
  const handlePrint = () => {
    if (!printAreaRef.current) return;
    
    // 1. Cấu hình thông số chuẩn cho TSC TE200 (203 DPI)
    // 1mm ~ 3.78px (Dựa trên chuẩn màn hình 96DPI, máy in sẽ tự scale qua Driver)
    const MM_TO_PX = 3.78; 
    const pWidth = 75;  // mm
    const pHeight = 55; // mm

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // 2. Clone và làm sạch Element
    const clonedArea = printAreaRef.current.cloneNode(true) as HTMLElement;
    const allElements = clonedArea.querySelectorAll('*');
    allElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      htmlEl.style.border = 'none';
      htmlEl.style.outline = 'none';
      if (htmlEl.classList.contains('resize-handle')) htmlEl.remove();
    });

    // 3. Xử lý tọa độ từng phần tử
    const children = clonedArea.children;
    Array.from(children).forEach((child) => {
      const htmlChild = child as HTMLElement;
      const element = elements.find(el => String(el.id) === htmlChild.dataset.id);
      
      if (element) {
        // Chuyển đổi tọa độ sang mm tuyệt đối
        const widthMm = (element.widthPercent / 100) * pWidth;
        const heightMm = element.height / MM_TO_PX;
        const xMm = element.x / MM_TO_PX;
        const yMm = element.y / MM_TO_PX;

        Object.assign(htmlChild.style, {
          position: 'absolute',
          left: `${xMm}mm`,
          top: `${yMm}mm`,
          width: `${widthMm}mm`,
          height: `${heightMm}mm`,
          display: 'flex',
          alignItems: 'center',
          boxSizing: 'border-box',
          overflow: 'hidden',
          lineHeight: '1.1',
          whiteSpace: 'nowrap' // Tránh nhảy dòng làm mất chữ
        });

        // Xử lý font size
        if (element.fontSize) {
          const fontSizeMm = element.fontSize / MM_TO_PX;
          const textContainer = htmlChild.querySelector('div') || htmlChild;
          (textContainer as HTMLElement).style.fontSize = `${fontSizeMm}mm`;
        }

        // Xử lý ảnh/barcode
        const img = htmlChild.querySelector('img');
        if (img) {
          Object.assign(img.style, {
            width: '100%',
            height: '100%',
            objectFit: 'contain'
          });
        }
      }
    });

    // 4. Nội dung HTML với CSS xoay để khớp DIRECTION 1
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            @page { 
              size: ${pWidth}mm ${pHeight}mm; 
              margin: 0; 
            }
            body { 
              margin: 0; 
              padding: 0; 
              width: ${pWidth}mm; 
              height: ${pHeight}mm;
              background: white;
            }
            .print-wrapper {
              width: ${pWidth}mm;
              height: ${pHeight}mm;
              position: relative;
              /* Nếu in ra bị ngược 180 độ, đổi rotate(0deg) thành rotate(180deg) */
              transform: rotate(0deg); 
              transform-origin: center;
            }
            /* Fix lỗi font chữ trên máy in nhiệt */
            * {
              font-family: Arial, sans-serif;
              -webkit-print-color-adjust: exact;
            }
          </style>
        </head>
        <body>
          <div class="print-wrapper">${clonedArea.innerHTML}</div>
          <script>
            window.onload = function() {
              setTimeout(() => {
                window.print();
                window.close();
              }, 300);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleImageUpload = (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) updateElementContent(id, file);
  };

  // ⚠️ Cập nhật logic lấy vị trí cho importFilePrint (Excel)
  // Vì không còn Flexbox, ta phải dựa vào index của header (columnIndex) để tìm element
  // và element này phải tương ứng với element thứ columnIndex trên canvas.
  // Điều này yêu cầu người dùng phải sắp xếp các element trên canvas theo thứ tự 
  // tương ứng với thứ tự các cột (trừ ID và #SL) trong Excel.
  const getPositionAndTypeByHeader = (headerName: string, columnIndex: number): { x: number, y: number, type: TypePrint } => {
    const normalizedName = headerName.trim().toUpperCase();
    let type = TypePrint.TEXT;
    let x = 0;
    let y = 0;

    // Sắp xếp elements theo vị trí trên Canvas (y trước, sau đó x) để có thứ tự tương ứng với Excel
    const sortedElements = [...elements].sort((a, b) => {
      if (a.y !== b.y) {
        return a.y - b.y;
      }
      return a.x - b.x;
    });

    // const id = elements.findIndex(el => el.name.trim().toUpperCase() === normalizedName);
    // Lấy element có eId = colName trên excel
    const targetElement = elements.find(el => el.name.trim().toUpperCase() === normalizedName);

    if (targetElement) {
      x = targetElement.x; // Tọa độ X tuyệt đối (pixels)
      y = targetElement.y; // Tọa độ Y tuyệt đối (pixels)

      switch(targetElement.type) {
        case 'barcode':
          type = TypePrint.BARCODE;
          break;
        case 'image':
          type = TypePrint.IMAGE;
          break;
        case 'datetime':
        case 'text':
        default:
          type = TypePrint.TEXT;
          break;
      }
    } else {
      console.warn(`Column index ${columnIndex} exceeds number of elements (${sortedElements.length}). Check template design/Excel columns.`);
    }

    return { x, y, type };
  };

  // function importFilePrint(file: File): Promise<PrinterBuilderRequest[]> {
  //   return new Promise((resolve, reject) => {
  //       const reader = new FileReader();

  //       reader.onload = (e) => {
  //           try {
  //               const data = e.target?.result;
  //               if (!data) {
  //                   return reject(new Error("Không thể đọc file."));
  //               }
                
  //               const workbook = XLSX.read(data, { type: 'binary' });
  //               const sheetName = workbook.SheetNames[0];
  //               const worksheet = workbook.Sheets[sheetName];

  //               if (!worksheet) {
  //                   return reject(new Error("File Excel không có sheet nào."));
  //               }

  //               const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
  //               if (jsonData.length === 0) {
  //                   return resolve([]); 
  //               }

  //               const headerRow = jsonData[0]; 
  //               const dataList: PrinterBuilderRequest[] = [];
  //               let slColumnIndex = -1;
  //               const cols: number[] = [];

  //               headerRow.forEach((header, index) => {
  //                   const headerValue = String(header).trim();
  //                   if ("#SL".toLocaleUpperCase() === headerValue.toLocaleUpperCase()) {
  //                       slColumnIndex = index;
  //                   } else {
  //                       if (index !== 0) {
  //                            cols.push(index);
  //                       }
  //                   }
  //               });
                
  //               if (slColumnIndex === -1) {
  //                   return reject(new Error("Không tìm thấy cột #SL trong file Excel"));
  //               }
                
  //               const fieldTemplateMap: { [colIndex: number]: { headerName: string, x: number, y: number, type: TypePrint } } = {};
  //               // let index = 0;
                
  //               // Lấy thông tin template vị trí (X, Y, Type) từ Header Row
  //               for (const colIndex of cols) { 
  //                   const headerName = String(headerRow[colIndex] || '').trim();
  //                   // ⚠️ Sử dụng index (0, 1, 2...) thay vì colIndex (1, 2, 3...)
  //                   const { x, y, type } = getPositionAndTypeByHeader(headerName, colIndex); 

  //                   fieldTemplateMap[colIndex] = {
  //                       headerName,
  //                       x,
  //                       y,
  //                       type,
  //                   };
  //                   // index++;
  //               }
                
  //               for (let i = 1; i < jsonData.length; i++) {
  //                   const rowData = jsonData[i]; 
                    
  //                   if (!rowData || rowData.length === 0 || rowData.every(cell => cell === undefined || cell === null || String(cell).trim() === '')) {
  //                       continue; 
  //                   }

  //                   const dto: PrinterBuilderRequest = {
  //                       id: '',
  //                       count: 0,
  //                       data: [],
  //                   };

  //                   dto.id = String(rowData[0] || '').trim(); 

  //                   dto.count = Math.floor(Number(rowData[slColumnIndex]) || 0);
                    
  //                   const dataFields: DataPrintField[] = [];
  //                   for (const colIndex of cols) {
  //                       const headerName = String(headerRow[colIndex]).trim();
  //                       const template = fieldTemplateMap[colIndex];
  //                       const cellValueRaw = rowData[colIndex];
  //                       let cellValue = '';
  //                       let fieldType: TypePrint = TypePrint.TEXT;
                        
  //                       if (typeof cellValueRaw === 'string' && cellValueRaw.startsWith("https://cloud.mkb-tech.vn")) {
  //                           fieldType = TypePrint.IMAGE;
  //                           cellValue = cellValueRaw.trim();
  //                       } else {
  //                           fieldType = TypePrint.TEXT;
                            
  //                           if (typeof cellValueRaw === 'number' && cellValueRaw > 1000) {
  //                               const excelEpoch = new Date(1899, 11, 30);
  //                               const date = new Date(excelEpoch.getTime() + cellValueRaw * 86400000);
                                
  //                               const day = String(date.getDate()).padStart(2, '0');
  //                               const month = String(date.getMonth() + 1).padStart(2, '0');
  //                               const year = date.getFullYear();
  //                               cellValue = `${day}/${month}/${year}`;
  //                           } else {
  //                               cellValue = String(cellValueRaw || '').trim();
  //                           }
  //                       }
                        
  //                       // Sử dụng x, y tuyệt đối (pixels)
  //                       dataFields.push({
  //                           name: headerName,
  //                           type: fieldType,
  //                           value: cellValue,
  //                           x: template.x, 
  //                           y: template.y,
  //                       });
  //                   }
  //                   dto.data = dataFields;
  //                   dataList.push(dto);
  //               }
                
  //               resolve(dataList);
  //           } catch (error) {
  //               reject(new Error(`Lỗi xử lý file Excel: ${error instanceof Error ? error.message : "Lỗi không xác định"}`));
  //           }
  //       };

  //       reader.onerror = (error) => {
  //           reject(new Error(`Lỗi đọc file: ${error}`));
  //       };

  //       reader.readAsBinaryString(file);
  //   });
  // }

  function importFilePrint(file: File, allElements: any[]): Promise<PrinterBuilderRequest[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                if (!data) return reject(new Error("Không thể đọc file."));
                
                const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                if (!worksheet) return reject(new Error("File Excel không có dữ liệu."));

                const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                if (jsonData.length === 0) return resolve([]);

                const headerRow = jsonData[0].map(h => String(h || '').trim().toLocaleUpperCase());
                const dataList: PrinterBuilderRequest[] = [];
                
                // 1. Tìm chỉ số cột #SL và ID (Cột 0)
                const slColumnIndex = headerRow.indexOf("#SL");
                if (slColumnIndex === -1) {
                    return reject(new Error("Không tìm thấy cột #SL trong file Excel"));
                }

                // 2. Lặp qua từng dòng dữ liệu (từ dòng 1)
                for (let i = 1; i < jsonData.length; i++) {
                    const rowData = jsonData[i];
                    if (!rowData || rowData.length === 0 || rowData.every(cell => !cell)) continue;

                    const dto: PrinterBuilderRequest = {
                        id: String(rowData[0] || '').trim(),
                        count: Math.floor(Number(rowData[slColumnIndex]) || 0),
                        data: [],
                    };

                    // 3. Xử lý từng element dựa trên quy tắc của bạn
                    const dataFields: DataPrintField[] = allElements.map(element => {
                        let cellValue = '';
                        let fieldType = element.type || TypePrint.TEXT;

                        // KIỂM TRA ĐIỀU KIỆN CỦA BẠN TẠI ĐÂY
                        if (String(element.elementId).includes("ABS")) {
                            // Trường hợp Fix cứng
                            cellValue = element.content || '';
                        } else {
                            // Trường hợp lấy theo tên cột trong Excel
                            const colIndex = headerRow.indexOf(String(element.elementId).toLocaleUpperCase());
                            const cellValueRaw = colIndex !== -1 ? rowData[colIndex] : '';

                            // Xử lý định dạng (Ngày tháng, Image) như code cũ của bạn
                            if (typeof cellValueRaw === 'string' && cellValueRaw.startsWith("https://")) {
                                fieldType = TypePrint.IMAGE;
                                cellValue = cellValueRaw.trim();
                            } else if (isNumeric(cellValueRaw)) {
                                cellValue = cellValueRaw || 0
                            } else {
                                cellValue = formatIfDate(cellValueRaw);
                            }
                        }

                        return {
                            name: element.elementId,
                            type: String(fieldType).toLocaleUpperCase() as TypePrint,
                            value: cellValue,
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
                    dataList.push(dto);
                }
                
                resolve(dataList);
            } catch (error) {
                reject(new Error(`Lỗi: ${error instanceof Error ? error.message : "Lỗi không xác định"}`));
            }
        };
        reader.readAsBinaryString(file);
    });
  }

  // print with template, data from excel file
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
        if (elements.length === 0) {
            showSnackBar('WARNING', 'Please design and save a template before importing data.');
            return;
        }
        const check = elements.find(el => el.elementId == null || el.elementId.trim() === '');
        if(check) {
          return
        }

        const result = await importFilePrint(file, elements);
        const request = {
            templates: result,
            size: { width: paperWidth, height: paperHeight, gap: 3 },
        }
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
  }

  const handlePrintTemp = async() => {
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

        // 3. Xử lý từng element dựa trên quy tắc của bạn
        const dataFields: DataPrintField[] = elements.map(element => {
            if(typeof element.content === 'object'){
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
        }
        if (!!dataFields) {
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
  }

  // Helper để hiển thị input
  const renderElementInput = (element: Element) => {
    // ... (Giữ nguyên)
    const commonStyle = {
      paddingLeft: `${element.padding || 4}px`,
      paddingRight: `${element.padding || 4}px`,
      margin: `${element.margin || 0}px`,
      // paddingTop: '0px',
      // paddingBottom: '0px',
    };

    switch(element.type) {
      case 'text':
        return (
          <div style={{ ...commonStyle, fontSize: `${element.fontSize}px`, fontWeight: element.fontWeight, textAlign: element.textAlign, height: `${element.height}px`, display: 'flex', alignItems: 'center', cursor: 'default', userSelect: 'none', width: '100%', overflow: 'hidden' }}>
            {element.content as string || 'Sample Text'}
          </div>
        );
      case 'barcode':
        return (
          <div style={{ margin: `${element.margin || 0}px`, height: `${element.height}px` }} className="flex flex-col items-center justify-center w-full overflow-hidden">
            {element.content ? <img src={generateBarcode(element.content as string, element.displayTime)} alt="Barcode" style={{ height: '95%', width: '100%'}} /> : <div className="text-gray-400 text-sm">No barcode data</div>}
          </div>
        );
      case 'datetime':
        const dateContent = element.content ? new Date(element.content as string) : null;
        let formattedDate = 'Select date/time';
        
        if (dateContent) {
            if (element.displayTime === false) {
                // Chỉ hiển thị ngày
                formattedDate = dateContent.toLocaleDateString('vi-VN');
            } else {
                // Hiển thị cả ngày và giờ
                formattedDate = dateContent.toLocaleString('vi-VN', { 
                    year: 'numeric', 
                    month: '2-digit', 
                    day: '2-digit', 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false
                });
            }
        }

        return (
          <div style={{ ...commonStyle, fontSize: `${element.fontSize}px`, height: `${element.height}px`, display: 'flex', alignItems: 'center', width: '100%', overflow: 'hidden' }}>
            {formattedDate}
          </div>
        );
      case 'image':
        let imgSrc: string | null = null;
        
        if (element.content) {
          if (typeof element.content === 'string') {
            // if (element.content.startsWith('https://cloud.mkb-tech.vn')) {
              imgSrc = element.content;
            // }
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
              <img
                src={imgSrc}
                alt="Uploaded"
                className="w-full object-cover"
                style={{ height: `${element.height}px` }}
              />
            ) : (
              <div 
                className="w-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50"
                style={{ height: `${element.height}px` }}
              >
                <ImageIcon className="mb-2 text-gray-400" size={32} />
                <p className="text-xs text-gray-500">No image</p>
              </div>
            )}
          </div>
        );
      default: return null;
    }
  };

  const handleSaveTemplate = async() => {
    try {
      if (!templateName.trim()) {
        showSnackBar('WARNING', 'Please enter a template name before saving.');
        return;
      }

      let files: File[] | null = [];

      let request = {
        templateId: templateID,
        name: templateName,
        width: paperWidth,
        height: paperHeight,
        gap: 3,
        description: description, // Lưu description
        items: elements.map((el)=>{
          let id = 1
          let imgSrc: string | File | null = el.content;
          switch(el.type) {
            case 'text': id = 1; break;
            case 'barcode': id = 2; break;
            case 'datetime': id = 3; break;
            case 'image': 
              if (el.content) {
                if (typeof el.content === 'string') {
                  if (el.content.startsWith('https://cloud.mkb-tech.vn')) {
                    imgSrc = el.content;
                  }
                } else if (typeof el.content === 'object' && el.content !== null) {
                  try {
                    files.push(el.content as File);
                    imgSrc = URL.createObjectURL(el.content as File);
                  } catch (e) {
                    console.error('Error creating object URL:', e);
                  }
                }
              }
              id = 4; 
              break;
          }
          return {
            itemId: id,
            x: el.x, // Gửi tọa độ pixel
            y: el.y, // Gửi tọa độ pixel
            width: el.widthPercent,
            height: el.height,
            content: imgSrc?.toString().includes("blob:http") ? '' : imgSrc, // Nếu là Blob URL thì gửi chuỗi rỗng
            // Cần lưu thêm các thuộc tính style khác nếu API hỗ trợ
            properties: {
                elementId: el.elementId,
                fontSize: el.fontSize,
                fontWeight: el.fontWeight,
                textAlign: el.textAlign,
                fontFamily: el.fontFamily,
                padding: el.padding,
                margin: el.margin,
                displayTime: el.displayTime ? true : false
            } 
          }
        })
      }
      if(!!templateID || templateID !== ''){
        const response = await Api.postFormDataWithJson(TEMPLATE_PRINT.update, {request, files}, true);  // update
        if (response.code == '200') {
          showSnackBar('SUCCESS', 'Template updated successfully');
          const newTemp: TemplateProps = {
            templateId: response.data.id,
            name: response.data.name,
            width: paperWidth,
            height: paperHeight,
            gap: 3,
            description: description,
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
          }
          setTemplates((prev) => prev.map(t => t.templateId === templateID ? newTemp : t));
          setIsChangeData(false);
        } else {
          showSnackBar('FALSE', `Error updating template: ${response.message || 'Unknown error'}`);
        }
      }else{
        const response = await Api.postFormDataWithJson(TEMPLATE_PRINT.create, {request, files}, true);  // create
        if (response.code == '201') {
          showSnackBar('SUCCESS', 'Template saved successfully');
          const newTemp: TemplateProps = {
            templateId: response.data.id,
            name: response.data.name,
            width: paperWidth,
            height: paperHeight,
            gap: 3,
            description: description,
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
          }
          setTemplates((prev) => [...prev, newTemp]);
          setIsChangeData(false);
        }else {
          showSnackBar('FALSE', `Error saving template: ${response.message || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.log('Error saving template:', error);      
    }
  }

  const renderCreateTemp = (els: Element[]) => {
    return (
      <div className='flex flex-1 h-full'>
        <div className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto">
          {/* ... Phần Sidebar Giữ Nguyên ... */}
          <h2 className="text-2xl font-bold text-gray-800 mb-6">{!!templateID ? i18next.t('editTemplate') : i18next.t('createTemplate')}</h2>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">{i18next.t('templateName')}</label>
            <input type="text" placeholder="E.g. Tem trở 75x55mm" value={templateName} onChange={(e) => setTemplateName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">{i18next.t('description')}</label>
            <input type="text" placeholder="E.g. In nhãn cho trở,..." value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <h3 className="font-semibold text-gray-800 mb-4">{i18next.t('addElement')}</h3>
          <div className="space-y-2">
            {elementTypes.map((type) => (
              <button key={type.id} onClick={() => addElement(type.id)} className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition group">
                <div className="flex items-center gap-3"><type.icon size={18} className="text-gray-500" /><span className="text-sm text-gray-700">{type.name}</span></div>
                <Plus size={18} className="text-gray-400 group-hover:text-teal-500" />
              </button>
            ))}
          </div>
          <h3 className="font-semibold text-gray-800 mt-8 mb-4">{i18next.t('uploadDataExcel')}</h3>
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
            <h2 className="text-xl font-semibold text-gray-800">{i18next.t('designer')}</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-6 flex gap-6">
            {/* Canvas Area */}
            <div className="flex-1">
              <div className="mb-4 flex gap-4 items-center bg-white p-3 rounded-lg border shadow-sm">
                {/* ... Controls Giữ Nguyên ... */}
                <div className="flex items-center gap-2">
                  <Columns size={16} className="text-gray-500"/>
                  <span className="text-sm font-medium">{i18next.t('paperSize')}:</span>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mr-2">W (mm)</label>
                  <input type="number" value={paperWidth} onChange={(e) => setPaperWidth(parseInt(e.target.value) || 80)} className="w-16 px-2 py-1 text-sm border rounded" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mr-2">H (mm)</label>
                  <input type="number" value={paperHeight} onChange={(e) => setPaperHeight(parseInt(e.target.value) || 50)} className="w-16 px-2 py-1 text-sm border rounded" />
                </div>
                <div className='flex items-center gap-2 ml-auto'>
                  <button onClick={() => setElements([])} className="flex items-center gap-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-500"><Trash2 size={14} /> {i18next.t('clear')}</button>
                  <button onClick={()=>handlePrintTemp()} className="flex items-center gap-2 px-3 py-1 bg-gray-800 text-white rounded text-sm hover:bg-gray-700"><Printer size={14} /> Print</button>
                  <button onClick={handleSaveTemplate} className="flex items-center gap-2 px-3 py-1 bg-teal-600 text-white rounded text-sm hover:bg-teal-500"><File size={14} /> {i18next.t('save')}</button>
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
                                ${element.type != 'image' ? selectedElement === element.id ? 'border-blue-500 bg-blue-50/10 cursor-grab' : 'border-gray-300 hover:border-gray-400 cursor-grab' : "border-white"}
                                ${draggedElementId === element.id ? 'opacity-70 cursor-grabbing' : ''}
                            `}
                          >
                              <div className="w-full h-full relative">
                                  {renderElementInput(element)}
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
                          placeholder={i18next.t('elementId')}
                          onChange={(e) => updateElementId(element.id, e.target.value)}
                          className="w-full px-3 py-2 border rounded-md text-sm"
                      />

                      {element.type === 'text' && (
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
                      {element.type === 'barcode' && (
                        <>
                          <input
                              value={element.content as string}
                              placeholder={i18next.t('barcodeData')}
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
                      {element.type === 'image' && (
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
                      {element.type === 'datetime' && (
                        <>
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
                      {element.type === 'text' || element.type === 'datetime' && (
                          <div className="grid grid-cols-2 gap-2">
                              <div>
                                  <label className="text-xs text-gray-500 mb-1 block">Font Size</label>
                                  <input type="number" value={element.fontSize} onChange={(e) => updateElementStyle(element.id, {fontSize: parseInt(e.target.value)})} className="w-full px-2 py-1 border rounded text-sm"/>
                              </div>
                              <div>
                                  <label className="text-xs text-gray-500 mb-1 block">Align</label>
                                  <div className="flex border rounded overflow-hidden">
                                      {(['left', 'center', 'right'] as const).map(a => (
                                          <button key={a} onClick={() => updateElementStyle(element.id, {textAlign: a})} className={`flex-1 py-1 hover:bg-gray-50 ${element.textAlign === a ? 'bg-blue-100 text-blue-600' : ''}`}>
                                              <div className="w-3 h-3 mx-auto bg-current opacity-50 rounded-sm" />
                                          </button>
                                      ))}
                                  </div>
                              </div>
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
          title={i18next.t('confirmNotSave')}
          message={i18next.t('confirmNotSaveDesc')}
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

  const renderTypeItem = (id: string) => {
    switch(id) {
      case "2": return 'barcode'
      case "3": return 'datetime'
      case "4": return 'image';
      case "1":
      default: return 'text';
    }
  }

  const getPropertyEID = (val: any) => {
    if (val && val.properties && val.properties.elementId) {
      return {eId: val.properties.elementId, displayTime: val.properties.displayTime, fontFamily: val.properties.fontFamily};
    }
    return {eId: '', displayTime: val.properties.displayTime, fontFamily: ''};
  }

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
          padding: 4,
          margin: 0,
          widthPercent: Number(el.width),
          height: Number(el.height),
          fontSize: getPropertyEID(el).eId ? (el.properties.fontSize || 10) : 10,
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

  const handleDeleteTemp = async(id: string) => {
    try {
      const response = await Api.postWithJson(TEMPLATE_PRINT.delete, { id }, true);
      if (response.code === "200") {
        showSnackBar('SUCCESS', 'Template deleted successfully');
        setTemplates(templates.filter(t => t.templateId !== id));
      }else{
        showSnackBar('FALSE', `Error deleting template: ${response.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.log('Error deleting template:', error);
    }
  }

  const SideBar = useMemo(()=>{
    return <>
      <nav className="flex-1 pt-4">
            <div className="px-4 py-2.5 text-sm cursor-pointer bg-blue-50 text-blue-600 border-l-4 border-blue-600">{i18next.t('template')}</div>
        </nav>
    </>
  }, []) 

  const buttomSideBar = useMemo(() => {
    return <button 
          onClick={() => {
            handleToggleTab();
          }}
          className="m-4 px-4 py-2 bg-green-800 text-white rounded hover:bg-green-700 flex items-center justify-center  w-full gap-2">
            {changeTab ? <><Printer size={16} /> {i18next.t('createTemplate')} </> : <><ListOrdered size={16} /> {i18next.t('listTemplate')}</>}
          </button>
  }, [changeTab, isChangeData])

  return (
    <BackgroundTemplate sidebar={SideBar} bottomSideBar={buttomSideBar} >
      {changeTab ? <TemplateList data={templates} onEdit={(id)=>{
        handleEditTemplate(id);
      }} onDelete={(id)=>{
        handleDeleteTemp(id)
      }}/> : renderCreateTemp(elements) }
    </BackgroundTemplate>
  );
};

export default TemplateBuilder;