import { showSnackBar } from '@component/alert/SnackBarModal';
import React, { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Element, Templates } from '../config/Type';
import { KeyValue, TypePrint } from '@type';
import { ImageIcon } from 'lucide-react';
import { generateBarcode } from '@functions';
import QRCode from 'qrcode';

const DEFAULT_GEOMETRY_STROKE_MM = 0.35;

/** Độ dày nét (mm) → strokeWidth trong viewBox 0..100 */
function geometryStrokeViewUnits(
  strokeWidthMm: number | undefined,
  wMm: number,
  hMm: number,
  kind: TypePrint,
): number {
  const mm = Math.max(0.05, Math.min(strokeWidthMm ?? DEFAULT_GEOMETRY_STROKE_MM, 3));
  if (kind === TypePrint.GEOMETRY_LINE) {
    const h = Math.max(hMm, 0.2);
    return Math.min(80, (mm / h) * 100);
  }
  const ref = Math.max(Math.min(wMm, hMm), 0.2);
  return Math.min(80, (mm / ref) * 100);
}

const QrCodePreview: React.FC<{ text: string }> = React.memo(({ text }) => {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    const t = text?.trim();
    if (!t) {
      setDataUrl(null);
      setErr(false);
      return;
    }
    let cancelled = false;
    setErr(false);
    QRCode.toDataURL(t, { width: 320, margin: 1, errorCorrectionLevel: 'M' })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) {
          setDataUrl(null);
          setErr(true);
        }
      });
    return () => { cancelled = true; };
  }, [text]);

  if (!text?.trim()) {
    return <div className="text-gray-400 text-sm flex items-center justify-center h-full">Nhập nội dung QR</div>;
  }
  if (err) return <div className="text-red-500 text-xs">Không tạo được QR</div>;
  if (!dataUrl) {
    return <div className="text-gray-400 text-xs flex items-center justify-center h-full">…</div>;
  }
  return (
    <img
      src={dataUrl}
      alt="QR"
      className="w-full h-full object-contain"
      draggable="false"
      onDragStart={e => e.preventDefault()}
    />
  );
});
QrCodePreview.displayName = 'QrCodePreview';

interface ElementRendererProps {
  element:         Element;
  objectUrlCache:  React.RefObject<Map<File, string>>;
}

const ElementRenderer: React.FC<ElementRendererProps> = React.memo(({ element, objectUrlCache }) => {
  const marginStyle = useMemo(() => ({ margin: `${element.margin || 0}mm` }), [element.margin]);

  switch (element.type) {
    case TypePrint.TEXT:
      return (
        <div style={{
          ...marginStyle,
          fontSize:   `${element.fontSize ?? 8}pt`,
          fontWeight: element.fontWeight,
          fontFamily: element.fontFamily,
          textAlign:  element.textAlign,
          height: '100%', display: 'flex', alignItems: 'center',
          cursor: 'default', userSelect: 'none', width: '100%', overflow: 'hidden',
        }}>
          {element.content as string || 'Sample Text'}
        </div>
      );

    case TypePrint.BARCODE:
      return (
        <div style={{ margin: `${element.margin || 0}mm`, height: '100%' }}
          className="flex flex-col items-center justify-center w-full overflow-hidden">
          {element.content ? (
            <img src={generateBarcode(element.content as string, element.displayTime)}
              alt="Barcode" style={{ height: '95%', width: '100%' }}
              draggable="false" onDragStart={e => e.preventDefault()} />
          ) : (
            <div className="text-gray-400 text-sm">No barcode data</div>
          )}
        </div>
      );

    case TypePrint.DATETIME: {
      const dateContent = element.content ? new Date(element.content as string) : null;
      let formattedDate = 'Select date/time';
      if (dateContent) {
        formattedDate = element.displayTime === false
          ? dateContent.toLocaleDateString('vi-VN')
          : dateContent.toLocaleString('vi-VN', {
              year: 'numeric', month: '2-digit', day: '2-digit',
              hour: '2-digit', minute: '2-digit', hour12: false,
            });
      }
      return (
        <div style={{
          ...marginStyle,
          fontSize: `${element.fontSize ?? 8}pt`, fontFamily: element.fontFamily,
          height: '100%', display: 'flex', alignItems: 'center',
          width: '100%', overflow: 'hidden',
        }}>
          {formattedDate}
        </div>
      );
    }

    case TypePrint.IMAGE: {
      let imgSrc: string | null = null;
      if (element.content) {
        if (typeof element.content === 'string') {
          imgSrc = element.content;
        } else if (element.content instanceof File) {
          // Kiểm tra cache trước — nếu đã có thì dùng lại, không tạo mới
          if (objectUrlCache.current.has(element.content)) {
            imgSrc = objectUrlCache.current.get(element.content)!;
          } else {
            try {
              const url = URL.createObjectURL(element.content);
              objectUrlCache.current.set(element.content, url); // lưu vào cache
              imgSrc = url;
            } catch (e) {
              console.error('createObjectURL error:', e);
            }
          }
        }
      }
      return (
        <div style={marginStyle} className="w-full h-full">
          {imgSrc ? (
            <img src={imgSrc} alt="Uploaded" className="w-full h-full object-cover"
              draggable="false" onDragStart={e => e.preventDefault()} />
          ) : (
            <div className="w-full h-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50">
              <ImageIcon className="mb-2 text-gray-400" size={32} />
              <p className="text-xs text-gray-500">No image</p>
            </div>
          )}
        </div>
      );
    }

    case TypePrint.QRCODE:
      return (
        <div style={{ ...marginStyle, height: '100%' }} className="flex items-center justify-center w-full overflow-hidden">
          <QrCodePreview text={(element.content as string) || ''} />
        </div>
      );

    case TypePrint.GEOMETRY_LINE: {
      const sw = geometryStrokeViewUnits(element.strokeWidthMm, element.width, element.height, TypePrint.GEOMETRY_LINE);
      return (
        <div style={marginStyle} className="w-full h-full flex items-center">
          <svg className="w-full h-full block" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            <line x1="0" y1="50" x2="100" y2="50" stroke="#111827" strokeWidth={sw} strokeLinecap="round" />
          </svg>
        </div>
      );
    }

    case TypePrint.GEOMETRY_CIRCLE: {
      const sw = geometryStrokeViewUnits(element.strokeWidthMm, element.width, element.height, TypePrint.GEOMETRY_CIRCLE);
      const r = Math.max(8, 50 - sw / 2);
      return (
        <div style={marginStyle} className="w-full h-full flex items-center justify-center">
          <svg className="w-full h-full block" viewBox="0 0 100 100" aria-hidden>
            <circle cx="50" cy="50" r={r} fill="none" stroke="#111827" strokeWidth={sw} />
          </svg>
        </div>
      );
    }

    case TypePrint.GEOMETRY_RECTANGLE: {
      const sw = geometryStrokeViewUnits(element.strokeWidthMm, element.width, element.height, TypePrint.GEOMETRY_RECTANGLE);
      const inset = sw / 2;
      return (
        <div style={marginStyle} className="w-full h-full flex items-center justify-center">
          <svg className="w-full h-full block" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            <rect
              x={inset}
              y={inset}
              width={100 - sw}
              height={100 - sw}
              fill="none"
              stroke="#111827"
              strokeWidth={sw}
            />
          </svg>
        </div>
      );
    }

    default: return null;
  }
});
ElementRenderer.displayName = 'ElementRenderer';
interface TemplateProps {
  index: number;
  elements: Element[];
  setListTemp: Dispatch<SetStateAction<Templates[]>>;
  paperWidth: number;   // mm — chiều rộng 1 tờ
  paperHeight: number;  // mm
  paperCount: number;
  columnGapMm: number;  // mm
  selectElement: KeyValue;
  setSelectElement: (val: KeyValue) => void;
  wrapperRef: React.RefObject<HTMLDivElement>;
}

// DragSession — toàn bộ lưu ref, không có state
interface DragSession {
  elementId:  number;
  // Gốc tọa độ = cạnh trái của cột 0 (px)
  // Mọi tính toán đều dùng hệ này — nhất quán xuyên suốt drag
  col0Left:   number;
  col0Top:    number;
  // Offset chuột so với góc element, tính trong hệ wrapper-mm
  offsetX:    number; // mm
  offsetY:    number; // mm
}

function TemplateComp(props: TemplateProps) {
  const { paperWidth, paperHeight, paperCount, columnGapMm, index } = props;

  const printAreaRef = useRef<HTMLDivElement>(null);
  const dragRef      = useRef<DragSession | null>(null);
  const isMovingRef  = useRef(false);

  const [draggedId, setDraggedId] = useState<number | null>(null);

  const colWidthMm = paperCount > 1
    ? Math.max(1, (paperWidth - columnGapMm * (paperCount - 1)) / paperCount)
    : paperWidth;


  const objectUrlCache = useRef<Map<File, string>>(new Map());

  // Cleanup khi unmount
  useEffect(() => {
    const cache = objectUrlCache.current;
    return () => {
      cache.forEach(url => URL.revokeObjectURL(url));
      cache.clear();
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // handleDragElementMouseDown
  //
  // Ý tưởng cốt lõi:
  //   Dùng "hệ tọa độ wrapper-mm" với gốc = cạnh trái cột 0.
  //   col0Left (px) = canvasRect.left - index * (colWidthMm + columnGapMm) * pxPerMm
  //
  //   Vị trí chuột trong hệ này:
  //     mouseX_mm = (clientX - col0Left) / pxPerMm
  //
  //   Vị trí element trong hệ này:
  //     elementX_mm = index * (colWidthMm + columnGapMm) + element.x
  //
  //   offset = mouseX_mm - elementX_mm  (tính 1 lần lúc mousedown)
  //
  //   Khi mousemove:
  //     mouseX_mm = (clientX - col0Left) / pxPerMm  (dùng col0Left đã cache)
  //     newXInWrapper = mouseX_mm - offset
  //     targetCol = floor(newXInWrapper / (colWidthMm + columnGapMm))
  //     newXInCol = newXInWrapper - targetCol * (colWidthMm + columnGapMm)
  //
  //   → Element luôn dính theo đúng vị trí chuột, mượt khi đổi cột
  // ─────────────────────────────────────────────────────────────────────────
  const handleDragElementMouseDown = useCallback((
    e: React.MouseEvent,
    elementId: number,
    eId: string,
  ) => {
    if (eId?.includes('ABS')) {
      showSnackBar('WARNING', 'Cannot move ABS elements.');
      return;
    }
    e.stopPropagation();    // Ngăn sự kiện lan ra ngoài (bubble up) theo cây DOM,  → tránh trigger nhầm các handler ở component cha
    e.preventDefault();    // ngăn text selection khi kéo

    const targetElement = props.elements.find(el => el.id === elementId);
    if (!targetElement || !printAreaRef.current) return;

    const canvasRect = printAreaRef.current.getBoundingClientRect(); // lấy giới hạn, khoảng cách canvas -> view port (px)
    const pxPerMm    = canvasRect.width / colWidthMm; // tính tỉ lệ

    // Gốc tọa độ: cạnh trái của cột 0 (px)
    const col0Left = canvasRect.left - index * (colWidthMm + columnGapMm) * pxPerMm;
    const col0Top  = canvasRect.top; // Y không thay đổi giữa các cột

    // Vị trí chuột trong hệ wrapper-mm
    const mouseX_mm = (e.clientX - col0Left) / pxPerMm;
    const mouseY_mm = (e.clientY - col0Top)  / pxPerMm;

    // Vị trí element trong hệ wrapper-mm
    const elementX_mm = index * (colWidthMm + columnGapMm) + targetElement.x;
    const elementY_mm = targetElement.y;

    // offset = khoảng cách từ chuột đến góc element (mm) — không đổi khi drag
    const offsetX = mouseX_mm - elementX_mm;
    const offsetY = mouseY_mm - elementY_mm;

    dragRef.current = { elementId, col0Left, col0Top, offsetX, offsetY }; // lưu cache các giá trị này vào ref
    isMovingRef.current = false;

    const startClientX = e.clientX;
    const startClientY = e.clientY;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const session = dragRef.current;
      if (!session) return;

      // Threshold
      if (!isMovingRef.current) {
        // check xem nếu hành động kéo element di chuyển > 5px thì tính là di chuyển, tránh nhầm vs click
        const moved =
          Math.abs(moveEvent.clientX - startClientX) > 5 ||
          Math.abs(moveEvent.clientY - startClientY) > 5;
        if (!moved) return;

        // Đưa element lên z-top
        props.setListTemp(prev => prev.map((temp, j) =>
          j === index ? {
            ...temp,
            elements: [
              ...temp.elements.filter(el => el.id !== elementId),
              targetElement,
            ],
          } : temp
        ));
        isMovingRef.current = true;
        setDraggedId(elementId);
      }

      // ── Vị trí chuột trong hệ wrapper-mm ─────────────────────────────
      const mouseX_mm = (moveEvent.clientX - session.col0Left) / pxPerMm;
      const mouseY_mm = (moveEvent.clientY - session.col0Top)  / pxPerMm;

      // ── Vị trí góc top-left element trong hệ wrapper-mm ──────────────
      // element đi theo chuột: góc element = chuột - offset (không đổi)
      const elX_wrapper = mouseX_mm - session.offsetX;
      const elY_wrapper = mouseY_mm - session.offsetY;

      // ── Xác định cột đích ─────────────────────────────────────────────
      // Lấy tâm element để xác định cột (tránh nhảy cột sớm ở biên)
      const elCenterX   = elX_wrapper + (props.elements.find(el => el.id === elementId)?.width ?? 20) / 2;
      const rawCol      = Math.floor(elCenterX / (colWidthMm + columnGapMm));
      const targetCol   = Math.max(0, Math.min(rawCol, paperCount - 1));
      const colOffset   = targetCol * (colWidthMm + columnGapMm);

      // ── Vị trí element trong cột đích (mm) ───────────────────────────
      const newXInCol = elX_wrapper - colOffset;
      const newYInCol = elY_wrapper;

      props.setListTemp(prev => {
        const next = prev.map(t => ({ ...t, elements: [...t.elements] }));

        const sourceIndex = next.findIndex(temp =>
          temp.elements.some(el => el.id === elementId)
        );
        if (sourceIndex === -1 || !next[targetCol]) return prev;

        const currentEl = next[sourceIndex].elements.find(el => el.id === elementId);
        if (!currentEl) return prev;

        const elWidthMm = currentEl.width;
        const clampedX  = Math.max(0, Math.min(newXInCol, colWidthMm  - elWidthMm));
        const clampedY  = Math.max(0, Math.min(newYInCol, paperHeight - currentEl.height));

        const updatedEl: Element = { ...currentEl, x: clampedX, y: clampedY, column: targetCol };

        if (sourceIndex !== targetCol) {
          props.setSelectElement({ id: targetCol, value: elementId });
          next[sourceIndex] = {
            ...next[sourceIndex],
            elements: next[sourceIndex].elements.filter(el => el.id !== elementId),
          };
          next[targetCol] = {
            ...next[targetCol],
            elements: [
              ...next[targetCol].elements.filter(el => el.id !== elementId),
              updatedEl,
            ],
          };
        } else {
          next[sourceIndex] = {
            ...next[sourceIndex],
            elements: next[sourceIndex].elements.map(el =>
              el.id === elementId ? updatedEl : el
            ),
          };
        }
        return next;
      });
    };

    const onMouseUp = () => {
      dragRef.current     = null;
      isMovingRef.current = false;
      setDraggedId(null);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup',   onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup',   onMouseUp);
  }, [props, colWidthMm, index, columnGapMm, paperCount, paperHeight]);

  return (
    <div
      ref={printAreaRef}
      className="bg-white shadow-lg"
      style={{
        width:      `${colWidthMm}mm`,
        height:     `${paperHeight}mm`,
        position:   'relative',
        flexShrink: 0,
      }}
    >
      {props.elements.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-300 pointer-events-none">
          <p className="text-sm">Empty Canvas</p>
        </div>
      )}

      {props.elements.map(element => (
        <div
          key={element.id}
          data-id={element.id}
          style={{
            position: 'absolute',
            left:     `${element.x}mm`,
            top:      `${element.y}mm`,
            width:    `${element.width}mm`,
            height:   `${element.height}mm`,
            zIndex:   props.selectElement.value === element.id || draggedId === element.id ? 20 : 10,
          }}
          onDoubleClick={e => {
            e.stopPropagation();
            props.setSelectElement({ id: props.index, value: element.id });
          }}
          onClick={e => e.stopPropagation()}
        >
          <div
            onMouseDown={e => handleDragElementMouseDown(e, element.id, element.elementId)}
            className={`h-full border transition-all
              ${element.type === TypePrint.IMAGE
                ? 'border-white'
                : props.selectElement.value === element.id
                  ? 'border-blue-500 bg-blue-50/10 cursor-grab'
                  : 'border-gray-300 hover:border-gray-400 cursor-grab'
              }
              ${draggedId === element.id ? 'opacity-70 cursor-grabbing' : ''}
            `}
          >
            <div className="w-full h-full relative">
              <ElementRenderer element={element} objectUrlCache={objectUrlCache} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default TemplateComp;