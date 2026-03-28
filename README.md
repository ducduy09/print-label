# 🏷️ Label Template Builder

Công cụ thiết kế và in nhãn dán trực quan (WYSIWYG) cho máy in nhiệt TSC, hỗ trợ đa cột, kéo thả linh hoạt và xuất lệnh TSPL trực tiếp.

---

## ✨ Tính năng

- **WYSIWYG thực sự** — canvas render bằng đơn vị `mm` trực tiếp, 1mm trên màn hình = 1mm trên giấy in
- **Đa cột** — thiết kế 1×1, 1×2, 1×3, 1×4 trên cùng 1 hàng, mỗi cột có thể là template khác nhau
- **Kéo thả mượt** — di chuyển element tự do trong cột và xuyên cột, không nhảy, không giật
- **4 loại element**: Text, Barcode (Code 128), DateTime, Image
- **In từ Excel** — upload file `.xlsx` để in hàng loạt với dữ liệu động
- **In thử** — gửi lệnh in trực tiếp lên máy in TSC qua API
- **Lưu/Tải template** — quản lý danh sách template, chỉnh sửa lại bất kỳ lúc nào
- **Font tùy chỉnh** — hỗ trợ nhiều font chữ, font size theo đơn vị `pt`

---

## 🗂️ Cấu trúc file

```
src/
├── home/printLabel/
│   ├── TemplateBuilder.tsx       # Component cha — quản lý state, layout, properties panel
│   ├── TemplateList.tsx          # Danh sách template đã lưu
│   ├── component/
│   │   └── TemplateComp.tsx      # Canvas từng cột — render mm, xử lý drag & drop
│   ├── config/
│   │   ├── Constants.ts          # DEFAULT_ELEMENT_HEIGHTS (mm), ELEMENT_TYPES
│   │   └── Type.ts               # Interface Element, Templates, WidthValue
│   ├── hooks/
│   │   └── AxiosTemplateData.ts  # handleSaveTemplate, handleDeleteTemp
│   └── utils/
│       └── ExcelFilePrint.ts     # importFilePrint — đọc xlsx → PrinterBuilderRequest[]
```

---

## ⚙️ Yêu cầu

| Thành phần | Phiên bản |
|---|---|
| React | ≥ 18 |
| TypeScript | ≥ 5 |
| Tailwind CSS | ≥ 3 |
| lucide-react | ≥ 0.300 |
| i18next | ≥ 23 |
| Backend API | Java Spring Boot (xem phần Backend) |
| Máy in | TSC (203 DPI, giao thức TSPL) |

---

## 🚀 Cài đặt

### 1. Copy file vào project

```bash
# Copy 2 file chính vào đúng thư mục
cp TemplateBuilder.tsx  src/pages/template/
cp TemplateComp.tsx     src/pages/template/component/
```

### 2. Cài dependencies (nếu chưa có)

```bash
npm install lucide-react
npm install i18next react-i18next
```

### 3. Cấu hình `Constants.ts`

```ts
// src/pages/template/config/Constants.ts

// Chiều cao mặc định khi thêm element mới — đơn vị mm
export const DEFAULT_ELEMENT_HEIGHTS = {
  text:     5,   // mm
  barcode:  15,  // mm
  datetime: 5,   // mm
  image:    20,  // mm
};

export const ELEMENT_TYPES = [
  { id: TypePrint.TEXT,     name: 'Text',     icon: Type },
  { id: TypePrint.BARCODE,  name: 'Barcode',  icon: QrCode },
  { id: TypePrint.DATETIME, name: 'DateTime', icon: Calendar },
  { id: TypePrint.IMAGE,    name: 'Image',    icon: ImageIcon },
];
```

### 4. Cấu hình `Type.ts`

```ts
// src/pages/template/config/Type.ts

export interface Element {
  id:           number;
  type:         TypePrint;
  elementId:    string;
  name:         string;
  content:      string | File;
  widthPercent: number;   // % chiều rộng cột
  height:       number;   // mm
  fontSize?:    number;   // pt
  fontWeight?:  string;
  fontFamily?:  string;
  textAlign?:   CanvasTextAlign;
  padding:      number;   // mm
  margin:       number;   // mm
  x:            number;   // mm — vị trí trong cột
  y:            number;   // mm — vị trí trong cột
  column:       number;   // 0-based index của cột
  displayTime?: boolean;
}

export interface Templates {
  elements:    Element[];
  templateId:  string;
  name:        string;
  description: string;
  height:      number;  // mm
  width:       number;  // mm
  gap:         number;  // mm
  status:      string;
  createdAt:   string;
}

export type WidthValue = number; // 5–100 (%)
```

### 5. Cấu hình API URLs

```ts
// src/axios/urls.ts
export const PRINT = {
  customizeBuilder: '/api/print/customize-builder',
};

export const TEMPLATE_PRINT = {
  getAll:     '/api/template-print',
  getDetails: '/api/template-print/details',
};
```

### 6. i18n keys cần thiết

```json
{
  "createTemplate":    "Tạo mẫu in",
  "editTemplate":      "Chỉnh sửa mẫu",
  "templateName":      "Tên mẫu",
  "description":       "Mô tả",
  "addElement":        "Thêm thành phần",
  "uploadDataExcel":   "Tải dữ liệu Excel",
  "paperSize":         "Kích thước giấy",
  "designer":          "Thiết kế",
  "clear":             "Xóa tất cả",
  "save":              "Lưu",
  "listTemplate":      "Danh sách mẫu",
  "template":          "Mẫu in",
  "elementId":         "Element ID",
  "barcodeData":       "Dữ liệu barcode",
  "confirmNotSave":    "Chưa lưu thay đổi",
  "confirmNotSaveDesc":"Bạn có chắc muốn thoát không?"
}
```

---

## 🖨️ Cấu hình Backend (Java)

### DTO nhận request in

```java
// x, y, height nhận đơn vị mm — không cần convert từ px
@Data
public class DataPrintField {
    private String    name;
    private String    value;
    private TypePrint type;
    private double    x;       // mm
    private double    y;       // mm
    private double    width;   // % (0–100)
    private double    height;  // mm
    private Properties properties;
}
```

### Convert mm → dots (TSPL)

```java
// Máy in 203 DPI = 8 dots/mm
private static final double DOTS_PER_MM = 8.0;

// Dùng trực tiếp, không cần pxToDot nữa
int x          = (int) Math.round(field.getX()      * DOTS_PER_MM) + 10;
int y          = (int) Math.round(field.getY()       * DOTS_PER_MM);
int heightDots = (int) Math.round(field.getHeight()  * DOTS_PER_MM);
int widthDots  = (int) Math.round((field.getWidth() / 100.0) * templateWidthMm * DOTS_PER_MM);
```

### Lệnh TSPL cho in đa cột

```java
// Mỗi hàng (paperCount cột) dùng 1 CLS + 1 PRINT
// X của cột k = x_element + k * (colWidthDots + gapDots)
int gapDots       = (int)(gapMm * DOTS_PER_MM);
int colWidthDots  = (int)(colWidthMm * DOTS_PER_MM);

for (int col = 0; col < paperCount; col++) {
    int offsetDots = col * (colWidthDots + gapDots);
    // ... add fields với x += offsetDots
}
builder.print(1, 1);
```

---

## 📐 Quy ước đơn vị

| Lớp | Đơn vị | Ghi chú |
|---|---|---|
| Frontend state (x, y, height) | `mm` | Lưu DB, gửi API |
| Frontend render (CSS) | `mm` | `left: 5mm`, `height: 15mm` |
| Frontend font size | `pt` | Chuẩn in ấn |
| Backend nhận | `mm` | Từ frontend |
| Backend → TSPL | `dots` | `mm × 8` (203 DPI) |
| UI controls (button, padding...) | `px` | Chỉ giao diện, không liên quan in |

---

## 🧩 Props của `TemplateComp`

| Prop | Kiểu | Mô tả |
|---|---|---|
| `index` | `number` | Vị trí cột (0-based) |
| `elements` | `Element[]` | Danh sách element của cột này |
| `paperWidth` | `number` | Chiều rộng 1 tờ (mm) |
| `paperHeight` | `number` | Chiều cao (mm) |
| `paperCount` | `number` | Tổng số cột trong hàng |
| `columnGapMm` | `number` | Gap giữa các cột (mm) |
| `selectElement` | `KeyValue` | Element đang được chọn `{id: colIndex, value: elementId}` |
| `setSelectElement` | `fn` | Callback cập nhật selection |
| `wrapperRef` | `RefObject` | Ref của div bao ngoài tất cả cột |
| `setListTemp` | `Dispatch` | Cập nhật toàn bộ listTemp |

---

## 🐛 Lưu ý khi mở rộng

- **Thêm loại element mới**: thêm vào `TypePrint` enum, `ELEMENT_TYPES`, `ElementRenderer` switch, và `DEFAULT_ELEMENT_HEIGHTS`
- **Thay đổi gap**: sửa `COLUMN_GAP_MM` trong `TemplateBuilder.tsx` — CSS `gap` và tính toán drag sẽ tự đồng bộ
- **Máy in khác DPI**: sửa `DOTS_PER_MM` trong backend (300 DPI = 11.81 dots/mm)
- **Không dùng `MM_TO_PX_RATIO`**: đã loại bỏ hoàn toàn — canvas dùng CSS `mm` trực tiếp