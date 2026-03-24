import React, { useEffect, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { TemplateProps } from '@type';
import i18next from 'i18next';

interface Template {
    data: TemplateProps[];
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
}
export default function TemplateList(props: Template) {
  const [templates, setTemplates] = useState(props.data);

  useEffect(() => {
    setTemplates(props.data);
  }, [props]);

  const handleEdit = (id: string) => {
    !!props.onEdit && props.onEdit(id);
  };

  const handleDelete = (id: string) => {
    if (confirm(`Bạn có chắc muốn xóa?`)) {
        !!props.onDelete && props.onDelete(id);
        setTemplates(templates.filter(t => t.templateId !== id));
    }
  };

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'ACTIVE':
        return 'bg-green-50 text-green-600';
      case 'Waiting':
        return 'bg-gray-50 text-gray-600';
      case 'Canceled':
        return 'bg-gray-50 text-gray-600';
      case 'DELETED':
        return 'bg-red-50 text-red-600';
      default:
        return 'bg-blue-50 text-blue-600';
    }
  };

  const getStatusDot = (status: string) => {
    switch(status) {
      case 'ACTIVE':
        return 'bg-green-500';
      case 'Waiting':
        return 'bg-gray-400';
      case 'Canceled':
        return 'bg-gray-400';
      case 'DELETED':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <div className="w-full bg-gray-50 p-8">
      <div className="mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">{i18next.t('template')} ({templates.length})</h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-white border-b border-gray-200">
                <th className="px-6 py-4 text-left">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{i18next.t('id')}</span>
                </th>
                <th className="px-6 py-4 text-left">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{i18next.t('templateName')}</span>
                </th>
                <th className="px-6 py-4 text-left">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{i18next.t('description')}</span>
                </th>
                <th className="px-6 py-4 text-left">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{i18next.t('status')}</span>
                </th>
                <th className="px-6 py-4 text-right">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{i18next.t('action')}</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {templates.map((template) => (
                <tr 
                  key={template.templateId} 
                  className={`hover:bg-gray-50 transition-colors ${
                    template.status === 'REJECT' ? 'bg-red-50/30 border-l-4 border-l-red-400' : ''
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{template.templateId}</div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600 line-clamp-2">{template.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600 line-clamp-2">{template.description}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(template.status)}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(template.status)}`}></span>
                      {template.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(template.templateId)}
                        className="p-2 text-gray-400 hover:text-cyan-500 hover:bg-cyan-50 rounded-lg transition-colors"
                        title="Sửa"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(template.templateId)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Xóa"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}