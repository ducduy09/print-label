import { formatIfDate, isNumeric } from "@functions";
import { DataPrintField, PrinterBuilderRequest, TypePrint } from "@type";
import * as XLSX from 'xlsx';
import { Templates } from "../config/Type";

export function importFilePrint(file: File, listTemp: Templates[], ppCount: number): Promise<PrinterBuilderRequest[]> {
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

          const slColumnIndex = headerRow.indexOf("#SL");
          if (slColumnIndex === -1) {
            return reject(new Error("Không tìm thấy cột #SL trong file Excel"));
          }

          for (let i = 1; i < jsonData.length; i++) {
            const rowData = jsonData[i];
            if (!rowData || rowData.length === 0 || rowData.every(cell => !cell)) continue;

            let listDataField: DataPrintField[] = [];

            const dto: PrinterBuilderRequest = {
              id: String(rowData[0] || '').trim(),
              count:  Math.floor(Number(rowData[slColumnIndex]) || 0),
              columns: ppCount,
              data: listDataField,
            };

            listTemp.map(temp => {
              const dataFields: DataPrintField[] = temp.elements.map(element => {
                let cellValue = '';
                let fieldType = element.type || TypePrint.TEXT;

                if (String(element.elementId).includes("ABS")) {
                  cellValue = element.content as string || '';
                } else {
                  const colIndex = headerRow.indexOf(String(element.elementId).toLocaleUpperCase());
                  const cellValueRaw = colIndex !== -1 ? rowData[colIndex] : '';

                  if (typeof cellValueRaw === 'string' && cellValueRaw.startsWith("https://")) {
                    fieldType = TypePrint.IMAGE;
                    cellValue = cellValueRaw.trim();
                  } else if (isNumeric(cellValueRaw)) {
                    cellValue = cellValueRaw || 0;
                  } else {
                    cellValue = formatIfDate(cellValueRaw);
                  }
                }
                return {
                  name: element.elementId,
                  type: element.type,
                  value: cellValue,
                  width: element.width,
                  height: element.height,
                  column: element.column,
                  x: element.x,
                  y: element.y,
                  properties: {
                    fontSize: element.fontSize,
                    displayTime: element.displayTime,
                    elementId: element.elementId,
                    fontFamily: element.fontFamily,
                    fontWeight: element.fontWeight,
                    textAlign: element.textAlign,
                    padding: element.padding,
                    margin: element.margin,
                    strokeWidthMm: element.strokeWidthMm,
                  }
                };
              })
              listDataField.push(...dataFields);
            });

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