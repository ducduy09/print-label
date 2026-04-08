import { TemplateProps, TypePrint } from "@type";
import { Templates } from "../config/Type";
import { showSnackBar } from "@component/alert/SnackBarModal";
import { TEMPLATE_PRINT } from "@axios/urls";
import Api from "@axios/helpers";

export const handleSaveTemplate = async (elements: Templates[], data: any ) => {
    try {
      if (!data.templateName.trim()) {
        showSnackBar('WARNING', 'Please enter a template name before saving.');
        return;
      }

      let files: File[] | null = [];

      let request = {
        templateId: data.templateID,
        name: data.templateName,
        width: data.paperWidth,
        height: data.paperHeight,
        columns: data.column,
        gap: 3,
        description: data.description, // Lưu description
        items: elements.map((temp) => {
          return temp.elements.map((el) => {
            let id = 1
            let imgSrc: string | File | null = el.content;
            switch(el.type) {
              case TypePrint.TEXT: id = 1; break;
              case TypePrint.BARCODE: id = 2; break;
              case TypePrint.DATETIME: id = 3; break;
              case TypePrint.IMAGE: 
                if (el.content) {
                  if (typeof el.content === 'string' && el.content.startsWith('https://')) {
                      imgSrc = el.content;
                  } else if (typeof el.content === 'object' && el.content !== null) {
                    try {
                      const ext        = el.content.name.split('.').pop() ?? 'png';
                      const renamedFile = new File(
                        [el.content],
                        `${el.elementId}.${ext}`,  // ← tên mới = elementId.ext
                        { type: el.content.type }
                      );
                      files.push(renamedFile);
                      imgSrc = '';
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
              width: el.width,
              height: el.height,
              column: el.column,
              content: imgSrc ?? '', // Nếu là Blob URL thì gửi chuỗi rỗng
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
        })
      }
      if(!!data.templateID || data.templateID !== ''){
        const response = await Api.postFormDataWithJson(TEMPLATE_PRINT.update, {request, files}, true);  // update
        if (response.code == '200') {
          showSnackBar('SUCCESS', 'Template updated successfully');
          const newTemp: TemplateProps = {
            templateId: response.data.id,
            name: response.data.name,
            width: data.paperWidth,
            height: data.paperHeight,
            gap: 3,
            description: data.description,
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
          }
          return {
            case: 1,
            template: newTemp,
            isChangeData: false
          }
        } else {
          showSnackBar('FALSE', `Error updating template: ${response.message || 'Unknown error'}`);
          return;
        }
      }else{
        const response = await Api.postFormDataWithJson(TEMPLATE_PRINT.create, {request, files}, true);  // create
        if (response.code == '201') {
          showSnackBar('SUCCESS', 'Template saved successfully');
          const newTemp: TemplateProps = {
            templateId: response.data.id,
            name: response.data.name,
            width: data.paperWidth,
            height: data.paperHeight,
            gap: 3,
            description: data.description,
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
          }
          return {
            case: 2,
            template: newTemp,
            isChangeData: false
          }
        }else {
          showSnackBar('FALSE', `Error saving template: ${response.message || 'Unknown error'}`);
          return;
        }
      }
    } catch (error) {
      console.log('Error saving template:', error);      
      return;
    }
}

export const handleDeleteTemp = async (id: string) => {
    try {
      const response = await Api.postWithJson(TEMPLATE_PRINT.delete, { id }, true);
      if (response.code === "200") {
        showSnackBar('SUCCESS', 'Template deleted successfully');
        return true
      } else {
        showSnackBar('FALSE', `Error deleting template: ${response.message || 'Unknown error'}`);
        return false
      }
    } catch (error) {
      console.log('Error deleting template:', error);
      return false
    }
};