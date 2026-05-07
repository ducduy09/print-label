import moment from "moment";
import SVGS from "@setup_assets/image/svgs";
import JsBarcode from 'jsbarcode';
import { ModalDataType, UseUnsavedChangesProps } from "@type";
import { currencyMap } from "./DataInit";
import { useEffect } from "react";

// Lấy tổng số ngày chủ nhật của 1 tháng
export const getSundaysInMonth = (year: number, month: number) => {
  let sundays = [];
  let date = new Date(year, month, 1); // Ngày đầu tiên của tháng
  
  while (date.getMonth() === month) {
    if (date.getDay() === 0) {
      let localDate = new Date(date);
      localDate.setHours(12, 0, 0, 0); // Đảm bảo không bị lệch múi giờ
      sundays.push(localDate);
    }
    date.setDate(date.getDate() + 1); // Tăng ngày lên 1
  }

  return sundays;
};

// lấy ngày hiện tại
export const getCurrentDate = () => {
  const now = new Date();
  const day = now.getDate();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  return moment(`${day}/${month}/${year}`, "DD/MM/YYYY").format("DD/MM/YYYY");
};

// lấy số ngày trong tháng
export const getDaysInMonth = (month: number, year: number) => {
  return new Date(year, month+1, 0).getDate();
}

// lấy số ngày chủ nhật của tháng hiện tại tính đến ngày hôm nay
export const getSundaysInMonthToToday = (year: number, month: number) => {
  let sundays = [];
  let date = new Date(year, month, 1); // Ngày đầu tiên của tháng

  const toDate = new Date().getDate()
  while (date.getMonth() === month && date.getDate() < toDate) {
    if (date.getDay() === 0) {
      let localDate = new Date(date);
      localDate.setHours(12, 0, 0, 0); // Đảm bảo không bị lệch múi giờ
      sundays.push(localDate);
    }
    date.setDate(date.getDate() + 1); // Tăng ngày lên 1
  }

  return sundays;
};

// Hàm lấy ngày đầu tiên của tháng hiện tại
export const getDateFirstInMonthCurrent = () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  return moment(`01/${month}/${year}`, "DD/MM/YYYY").toDate();
};

// Hàm lấy ngày đầu tiên của tháng
export const getDateFirstInMonth = (m: number) => {
  const now = new Date();
  const year = now.getFullYear();

  return moment(`01/${m}/${year}`, "DD/MM/YYYY").toDate();
};

// Hàm lấy ngày cuối cùng của tháng
export const getDateFinalInMonth = (month: number) => {
  const now = new Date();
  const year = now.getFullYear();
  const date = new Date(year, month, 0).getDate();

  return moment(`${date}/${month}/${year}`, "DD/MM/YYYY").toDate();
};

// Hàm tính công
export function calculateWorkUnits(startDate: Date, endDate: Date): number {
  if (!startDate || !endDate || endDate <= startDate) return 0;

  const start = new Date(startDate);
  const end = new Date(endDate);

  let totalUnits = 0;

  const startDay = new Date(start);
  startDay.setHours(0, 0, 0, 0);

  const endDay = new Date(end);
  endDay.setHours(0, 0, 0, 0);

  const dayDiff = Math.floor(
    (endDay.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24)
  );

  // 👉 Nếu trong cùng 1 ngày
  if (dayDiff === 0) {
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return hours <= 4 ? 0.5 : 1;
  }

  // 👉 Ngày đầu
  const endOfStartDay = new Date(start);
  endOfStartDay.setHours(23, 59, 59, 999);
  const firstDayHours =
    (endOfStartDay.getTime() - start.getTime()) / (1000 * 60 * 60);
  totalUnits += firstDayHours <= 4 ? 0.5 : 1;

  // 👉 Ngày cuối
  const startOfEndDay = new Date(end);
  startOfEndDay.setHours(0, 0, 0, 0);
  const lastDayHours =
    (end.getTime() - startOfEndDay.getTime()) / (1000 * 60 * 60);
  totalUnits += lastDayHours <= 4 ? 0.5 : 1;

  // 👉 Các ngày giữa
  if (dayDiff > 1) {
    totalUnits += dayDiff - 1;
  }

  return totalUnits;
}

export const formatDate = (val: string) => {
  return moment(new Date(val)).format("DD/MM/YYYY");
};

export const formatDate2 = (val: string) => {
  return moment(val).format("DD-MM-YYYY");
};

export const formatDateTime = (val?: string) => {
  if(val === undefined || val === null || val === "") {
    return "--";
  }
  return moment(val).format("HH:mm:ss DD-MM-YYYY");
};

export const formatTime = (val?: string) => {
  if (val === undefined || val === null || val === "") {
    return "--";
  }
  return moment(val).format("HH:mm");
};

// Hàm check đi muộn hay không
export const checkLate = (timeString: string) => {
    const date = new Date(timeString);
    if (isNaN(date.getTime())) return true; // timestamp không hợp lệ → tính là muộn

    const hours = date.getHours();
    const minutes = date.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    
    // Nếu đến trong khoảng 08:01–12:00 → muộn
    if (totalMinutes > 8 * 60 && totalMinutes < 12 * 60) {
      return true;
    }

    // Nếu đến trong khoảng 13:01–16:00 → muộn
    if (totalMinutes > 13 * 60 && totalMinutes < 16 * 60) {
      return true;
    }

    // Còn lại → ko muộn
    return false;
};

// Hàm tính có đi muộn hay không trả về số phút muộn
export const checkLateReturnMinues = (timeString: string) => {
  const date = new Date(timeString);
  if (isNaN(date.getTime())) return true; // timestamp không hợp lệ → tính là muộn

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  // Nếu đến trong khoảng 08:01–11:00 → muộn
  if (totalMinutes > 8 * 60 && totalMinutes < 11 * 60) {
    return totalMinutes - (8 * 60); // Trả về số phút muộn
  }

  // Nếu đến trong khoảng 13:01–16:00 → muộn
  if (totalMinutes > 13 * 60 && totalMinutes < 16 * 60) {
    return totalMinutes - (13 * 60); // Trả về số phút muộn
  }

  // Còn lại → ko muộn
  return 0; // Không muộn, trả về 0 phút
};

// mapping định dạng file
export const mappingTypeFile = (type: string) => {
  switch(type){
    case 'doc':
      return SVGS.ic_doc
    case 'xls':
    case 'xlsx':
      return SVGS.ic_xls
    case 'pdf':
      return SVGS.ic_pdf
    case 'ppt':
      return SVGS.ic_ppt
    case 'txt':
      return SVGS.ic_txt
  }
}

function readGroup(group: string) {
  let readDigit = [
    " Không",
    " Một",
    " Hai",
    " Ba",
    " Bốn",
    " Năm",
    " Sáu",
    " Bảy",
    " Tám",
    " Chín",
  ];
  var temp = "";
  if (group == "000") return "";
  temp = readDigit[parseInt(group.substring(0, 1))] + " Trăm";
  if (group.substring(1, 2) == "0")
    if (group.substring(2, 3) == "0") return temp;
    else {
      temp += " Lẻ" + readDigit[parseInt(group.substring(2, 3))];
      return temp;
    }
  else temp += readDigit[parseInt(group.substring(1, 2))] + " Mươi";
  if (group.substring(2, 3) == "5") temp += " Lăm";
  else if (group.substring(2, 3) != "0")
    temp += readDigit[parseInt(group.substring(2, 3))];
  return temp;
}

export function readMoney(num: string) {
   if (num == null || num == "") return "";
   let isNegative = false;
   if (num.startsWith("-")) {
     isNegative = true;
     num = num.substring(1);
   }
   num = num.replace(/[^0-9]/g, "");
   let temp = "";
   while (num.length < 18) {
     num = "0" + num;
   }
  let g1 = num.substring(0, 3);
  let g2 = num.substring(3, 6);
  let g3 = num.substring(6, 9);
  let g4 = num.substring(9, 12);
  let g5 = num.substring(12, 15);
  let g6 = num.substring(15, 18);
  if (g1 != "000") {
    temp = readGroup(g1);
    temp += " Triệu";
  }
  if (g2 != "000") {
    temp += readGroup(g2);
    temp += " Nghìn";
  }
  if (g3 != "000") {
    temp += readGroup(g3);
    temp += " Tỷ";
  } else if ("" != temp) {
    temp += " Tỷ";
  }
  if (g4 != "000") {
    temp += readGroup(g4);
    temp += " Triệu";
  }
  if (g5 != "000") {
    temp += readGroup(g5);
    temp += " Nghìn";
  }
  temp = temp + readGroup(g6);
  temp = temp.replaceAll("Một Mươi", "Mười");
  temp = temp.trim();
  temp = temp.replaceAll("Không Trăm", "");
  temp = temp.trim();
  temp = temp.replaceAll("Mười Không", "Mười");
  temp = temp.trim();
  temp = temp.replaceAll("Mươi Không", "Mươi");
  temp = temp.trim();
  if (temp.indexOf("Lẻ") == 0) temp = temp.substring(2);
  temp = temp.trim();
  temp = temp.replaceAll("Mươi Một", "Mươi Mốt");
  temp = temp.trim();
  let result =
    temp.substring(0, 1).toUpperCase() + temp.substring(1).toLowerCase();
  return (
    (isNegative ? "Âm " : "") + (result == "" ? "Không" : result) + " đồng chẵn"
  );
}

export const formatMoney = (num: number) => {
  const value = num.toLocaleString("it-IT", {
    style: "currency",
    currency: "VND",
  });
  return value.replace("VND", "");
};

export const formatMoneyUSD = (num: number) => {
  const value = num.toLocaleString("it-IT", {
    style: "currency",
    currency: "USD",
  });
  return value.replace("USD", "");
};

export const mapListCurrencyProps = (val: string[]): ModalDataType[] => {
  return val
    .map((code) => currencyMap[code])
    .filter((item): item is ModalDataType => !!item);
};

export const mapCurrencyProps = (val: string): ModalDataType | undefined => {
  return currencyMap[val.toUpperCase()];
};

export function validateAndFormatMoney(value: string | number): string {
  let str = typeof value === "number" ? value.toString() : value;
  // Chỉ giữ số và dấu phẩy (,) và dấu chấm (.)
  str = str.replace(/[^0-9.,]/g, "");
  if (!str) return "0";
  // Nếu có nhiều dấu phẩy hoặc chấm, chỉ lấy dấu phẩy cuối cùng làm phân cách thập phân
  // Đổi tất cả dấu chấm thành rỗng (loại bỏ dấu chấm cũ)
  str = str.replace(/\./g, "");
  // Tách phần nguyên và phần thập phân theo dấu phẩy cuối cùng
  const lastComma = str.lastIndexOf(",");
  let intPart = lastComma !== -1 ? str.slice(0, lastComma) : str;
  let decPart = lastComma !== -1 ? str.slice(lastComma + 1) : undefined;
  // Loại bỏ số 0 ở đầu phần nguyên
  intPart = intPart.replace(/^0+/, "") || "0";
  // Format phần nguyên với dấu chấm ngăn cách hàng nghìn
  intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return decPart !== undefined && decPart.length > 0
    ? `${intPart},${decPart}`
    : intPart;
}

export function parseMoneyInput(value: string): number {
  // Chỉ giữ số và dấu phẩy
  let str = value.replace(/[^0-9,]/g, "");
  // Đổi dấu phẩy thành dấu chấm để parseFloat hiểu đúng
  str = str.replace(",", ".");
  return parseFloat(str) || 0;
}

export function parseMoney(value: string, type?: string): string {
  if (!value) return "0";

  // 1️⃣ Chuẩn hóa ký tự: đổi , thành . và bỏ ký tự không hợp lệ
  let str = value.replace(",", ".").replace(/[^0-9.]/g, "");

  // 2️⃣ Nếu có nhiều dấu ., chỉ giữ lại dấu đầu tiên
  const parts = str.split(".");
  if (parts.length > 2) {
    str = parts[0] + "." + parts.slice(1).join("");
  }

  // 3️⃣ Chuyển sang số thực
  const number = parseFloat(str);
  if (isNaN(number)) return "0";

  // 4️⃣ Làm tròn hoặc giữ tối đa 3 chữ số thập phân
  const rounded =
    type === "vnd"
      ? number.toFixed(0) // Việt Nam: bỏ phần thập phân
      : number.toFixed(3).replace(/\.?0+$/, ""); // bỏ 0 dư

  // 5️⃣ Tách phần nguyên / thập phân
  const [intPart, decimalPart] = rounded.split(".");

  // 6️⃣ Format phần nguyên: thêm dấu . ngăn cách nghìn
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  // 7️⃣ Nếu có phần thập phân, đổi . thành , và nối vào
  return decimalPart ? `${formattedInt},${decimalPart}` : formattedInt;
}

export function parseMoneyENToNumber(value?: string){
  if (!value) return 0;

  // 1️⃣ Loại bỏ ký tự không hợp lệ (ngoại trừ . và ,)
  let str = value.replace(/[^0-9.,]/g, "");

  // 2️⃣ Nếu có cả dấu , và . thì xác định dấu nào là thập phân:
  //    - Nếu chuỗi có "," trước "." (ví dụ "1,234.56") → dấu . là thập phân.
  //    - Nếu chuỗi có "." trước "," (ví dụ "1.234,56") → dấu , là thập phân.
  if (str.includes(",") && str.includes(".")) {
    if (str.indexOf(",") < str.indexOf(".")) {
      str = str.replace(/,/g, ""); // bỏ dấu , (ngăn cách nghìn)
    } else {
      str = str.replace(/\./g, "").replace(",", "."); // bỏ dấu ., đổi , thành .
    }
  } else if (str.includes(",")) {
    // chỉ có dấu phẩy → có thể là thập phân
    str = str.replace(",", ".");
  }

  // 3️⃣ Parse sang số
  const number = parseFloat(str);
  if (isNaN(number)) return 0;

  // 4️⃣ Làm tròn 3 chữ số thập phân
  return Math.round(number * 1000) / 1000;
}



export function sanitizeVNDecimalInput(input: string) {
  // 1. Nếu bắt đầu bằng dấu phẩy → thêm 0 phía trước
  if (input.startsWith(",")) {
    input = "0" + input;
  }

  // 2. Giữ lại chỉ số và dấu phẩy đầu tiên
  input = input.replace(/[^0-9,]/g, ""); // chỉ giữ số và dấu ,
  const parts = input.split(",");

  // 3. Chỉ giữ lại phần nguyên và tối đa 1 dấu phẩy
  const integerPart = parts[0];

  let decimalPart = parts[1] || "";
  decimalPart = decimalPart.slice(0, 3); // giới hạn 3 số sau dấu ,

  return decimalPart ? `${integerPart},${decimalPart}` : integerPart;
}

export function sanitizeVNDecimalInputLive(input: string) {
  if (!input) return "";

  if (input.startsWith(",")) input = "0" + input;

  // Giữ lại chỉ số và dấu phẩy đầu tiên
  input = input.replace(/[^0-9,]/g, "");

  const parts = input.split(",");
  const intPart = parts[0];
  let decimalPart = parts[1] ?? "";

  decimalPart = decimalPart.slice(0, 3);

  // Nếu người dùng chỉ mới nhập dấu , → giữ nguyên
  if (input.endsWith(",") && parts.length === 2 && decimalPart === "") {
    return `${intPart},`;
  }

  return decimalPart ? `${intPart},${decimalPart}` : intPart;
}

export function parseVNDecimal(input: string) {
  if (typeof input !== "string") return 0;

  // Bỏ tất cả dấu . (dù thường không có), đổi , thành .
  const normalized = input.replace(/\./g, "").replace(",", ".");

  const number = parseFloat(normalized);
  return isNaN(number) ? 0 : number;
}

export function parseDecimal2(input: string) {
  if (typeof input !== "string") return 0;

  // Bỏ khoảng trắng và đổi , thành .
  const normalized = input.trim().replace(",", ".");
  const num = parseFloat(normalized);
  if (isNaN(num)) return 0;

  // Làm tròn thường đến 2 chữ số sau dấu thập phân
  return Math.round(num * 100) / 100;
}

export const generateBarcode = (
  text: string, 
  showContent: boolean = true,
  textPosition: boolean = true // Thêm tham số này
): string => {
  const canvas = document.createElement('canvas');
  
  try {
    // Nếu hiển thị text ở trên, cần tạo canvas tạm để vẽ barcode trước
    if (showContent && textPosition === true) {
      const tempCanvas = document.createElement('canvas');
      
      // Tạo barcode không có text
      JsBarcode(tempCanvas, text, {
        format: "CODE128",
        width: 2,
        height: 50,
        displayValue: false, // Không hiển thị text
        margin: 0,
        background: "#ffffff",
        lineColor: "#000000"
      });
      
      // Tính toán kích thước canvas chính
      const textHeight = 20;
      canvas.width = tempCanvas.width;
      canvas.height = tempCanvas.height + textHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';
      
      // Vẽ nền trắng
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Vẽ text ở trên
      ctx.fillStyle = 'black';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(text, canvas.width / 2, 5);
      
      // Vẽ barcode bên dưới text
      ctx.drawImage(tempCanvas, 0, textHeight);
      
    } else {
      // Vẽ bình thường (text ở dưới hoặc không có text)
      JsBarcode(canvas, text, {
        format: "CODE128",
        width: 2,
        height: 50,
        displayValue: showContent,
        fontSize: 12,
        margin: 0,
        background: "#ffffff",
        lineColor: "#000000",
        textMargin: 2
      });
    }
    
    return canvas.toDataURL();
  } catch (error) {
    console.error('Barcode generation error:', error);
    return '';
  }
};

// Bề rộng 1 module CODE128 khi in (mm). 0.25mm = 10mil, chuẩn công nghiệp,
// tương đương `width: 2` ở máy in nhãn 203 DPI. Đổi giá trị này nếu máy in
// dùng DPI khác (300 DPI → 0.169mm với width=2).
const BARCODE_PRINT_MODULE_WIDTH_MM = 0.25;
// Số px/module mà generateBarcode/getBarcodeWidth đang dùng khi gọi JsBarcode.
const BARCODE_RENDER_MODULE_PX = 2;

export const getBarcodeWidth = (text: string): number => {
  if (!text) return 0;

  const canvas = document.createElement("canvas");

  try {
    JsBarcode(canvas, text, {
      format: "CODE128",
      width: BARCODE_RENDER_MODULE_PX,
      height: 50,
      displayValue: false,
      margin: 0,
      background: "#ffffff",
      lineColor: "#000000",
    });

    return canvas.width;
  } catch (error) {
    console.error("Barcode width calculation error:", error);
    return 0;
  }
};

/** Trả về số module của barcode (đã bao gồm start/checksum/stop). */
export const getBarcodeModuleCount = (text: string): number => {
  const widthPx = getBarcodeWidth(text);
  if (widthPx <= 0) return 0;
  return Math.round(widthPx / BARCODE_RENDER_MODULE_PX);
};

/**
 * Bề rộng barcode khi IN ra (mm), dựa trên số module thực và bề rộng module
 * vật lý của máy in — không phụ thuộc DPI màn hình.
 */
export const getBarcodeWidthMm = (text: string): number => {
  const modules = getBarcodeModuleCount(text);
  if (modules <= 0) return 0;
  return modules * BARCODE_PRINT_MODULE_WIDTH_MM;
};

export const renderImageByDataByte = (data: string) => {
  return `data:image/png;base64,${data}`;
}

export function isNumeric(val: any) {
  return !isNaN(parseFloat(val)) && isFinite(val);
}
  
export const formatIfDate = (value: any) => {
  // Chỉ xử lý Date object, ISO string, hoặc timestamp
  if (value instanceof Date) {
    return moment.utc(value).format("DD/MM/YYYY");
  }
  
  if (typeof value === 'string') {
    // Kiểm tra pattern date phổ biến
    const datePattern = /^\d{4}-\d{2}-\d{2}|^\d{2}\/\d{2}\/\d{4}|^\d{4}\/\d{2}\/\d{2}|^\d{2}-\d{2}-\d{4}/;
    if (datePattern.test(value)) {
      const checkDate = new Date(value);
      if (!isNaN(checkDate.getTime())) {
        return moment.utc(checkDate).format("DD/MM/YYYY");
      }
    }
  }
  
  return value;
}

export const useUnsavedChanges = ({
  hasUnsavedChanges,
  message = 'Bạn có thay đổi chưa được lưu. Bạn có chắc chắn muốn rời khỏi trang này?',
}: UseUnsavedChangesProps) => {
  
  useEffect(() => {
    // Cảnh báo khi đóng tab/tắt trình duyệt
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = message; // Cho Chrome
        return message; // Cho các trình duyệt khác
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, message]);
};

// Copy đoạn này, chỉ thay KEY và VALUE tùy bài toán
// export const grouped = Object.values(
//   array.reduce((acc, item) => {
//     const key = item.KEY; // 👈 thay KEY (vd: column, type, status...)
//     if (!acc[key]) acc[key] = { key, items: [] };
//     acc[key].items.push(item); // 👈 thay items tùy interface
//     return acc;
//   }, {} as Record<string | number, YourType>)
// );