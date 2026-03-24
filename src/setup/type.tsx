export interface DataInfoProps {
    user: string;
    checkin: string;
    checkout: string
}
export interface DataUser {
    id: string,
    fullname: string;
    username: string;
    phone: string;
    avatar: string;
    totalNotify: string;
    userType: string;
    hireDate: string;
    mail: string;
    note: string;
    listRole: string;
    code: number;
}
export interface LoginState{
    isLogin: boolean;
    password: string;
    errorStatusLoginFail: string;
    enableQuickAction: boolean;
    listOfficer: {};
    branchs: any[];
}
export interface BgImageProps {
  image: string;
}
export interface DataNotificaton{
  message?: string,
  title: string,
  type: string,
  idAny: number
}
export interface EmployeeProps {
  department: string;
  email: string;
  employeeId: string;
  hireDate: string;
  name: string;
  note: string;
  phone: string;
  code: string;
  position: string;
  status: boolean;
}
export interface SupplierProps {
  supplierId: string;
  avatar: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  mst: string;
  contactPersion: string;
  updateAt: string;
  createAt: string;
}
export interface WarehouseProps {
  warehouseId: string;
  name: string;
  address: string;
  createdAt: string;
  updatedAt: string | null;
}
export interface KeyNameProps {
  id: string;
  name: string;
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
export interface ComponentAttributeDTF {
  attributeId: string;
  componentId: string;
  name: string;
  value: string;
}
export interface ListComponentProps {
  mkbPart: string;
  mfrPart: string;
  partName: string;
  unit: string;
  price: number;
  quantity: number;
  warehouseId: string;
  componentCategoryCode: string;
  // warehouseName: string;
  attributes: ComponentAttributeDTF[];
}
export interface ComponentProps {
  componentId: string;
  internalCode: string;
  name: string;
  description: string;
  unit: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface WarehouseComponentProps {
  mkbPart: string;
  mfrPart: string;
  partName: string;
  unit: string;
  price: number;
  supplierId: string;
  supplierName: string;
  batches: BatchProps[]
}

interface BatchProps {
  id: string;
  name: string;
  quantity: number;
}
export interface TransactionProps {
  transactionId: string;
  transactionCode: string;
  quantity: number;
  note: string;
  warehouseId: string;
  warehouseName: string;
  createdAt: string;
}

export interface AttributeProps {
  id: string;
  name: string;
  dataType: string;
  value: any;
  unit: string;
  isDelete?: boolean;
}

export interface ExchangeRateProps {
  from: string;
  to: string;
  rate: number;
  date: string;
}

export interface ModalDataType {
  value: string;
  title: string;
  details: string;
};
export interface SettingProps {
  theme: string;
  lang: string;
}
export interface LocationProps {
  code: string;
  description: string;
  warehouseId: string;
  warehouseName: string;
  updatedAt?: string;
}
export interface LocationComponentProps {
  code: string;
  description: string;
  warehouseId: string;
  warehouseName: string;
  quantity?: number;
}
export interface CategoryProps{
  categoryId: string;
  code: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceProps {
  id: number;
  name: string;
  date: string;
  checkin: string;
  checkout: string;
  total: number;
  hour: number;
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
}

// Tương đương với PrinterBuilderRequest.DataPrintField
export interface DataPrintField {
    name: string;
    value: string;
    type: TypePrint;
    x: number; // Tọa độ X
    y: number; // Tọa độ Y
}

// Tương đương với PrinterBuilderRequest
export interface PrinterBuilderRequest {
    id: string;
    count: number;
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