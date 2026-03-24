import i18next from "i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  setPage: (page: number) => void;
  totalResult: number;
  totalPage: number;
  limit: number;
}

export default function Pagination({
  page,
  setPage,
  totalResult,
  totalPage,
  limit,
}: PaginationProps) {
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPage) {
      setPage(newPage);
    }
  };

  const renderPageButton = (i: number) => (
    <button
      key={i}
      className={`px-4 py-2 text-sm border border-gray-300 ${
        page === i
          ? "bg-blue-600 text-white font-semibold"
          : "text-gray-700 bg-white hover:bg-gray-100"
      }`}
      onClick={() => handlePageChange(i)}
    >
      {i}
    </button>
  );

  const renderPageNumbers = () => {
    const buttons = [];

    if (totalPage <= 10) {
      for (let i = 1; i <= totalPage; i++) {
        buttons.push(renderPageButton(i));
      }
    } else {
      buttons.push(renderPageButton(1));

      const start = Math.max(2, page - 2);
      const end = Math.min(totalPage - 1, page + 2);

      if (start > 2) {
        buttons.push(
          <span key="left-dots" className="px-2">
            ...
          </span>
        );
      }

      for (let i = start; i <= end; i++) {
        buttons.push(renderPageButton(i));
      }

      if (end < totalPage - 1) {
        buttons.push(
          <span key="right-dots" className="px-2">
            ...
          </span>
        );
      }

      buttons.push(renderPageButton(totalPage));
    }

    return buttons;
  };

  const startItem = totalResult > 0 ? (page - 1) * limit + 1 : 0;
  const endItem = Math.min(page * limit, totalResult);

  return (
    <div className="flex mt-3 py-4 flex-col sm:flex-row sm:items-center sm:justify-between bg-white px-4 border-t border-gray-200">
      <p className="text-sm text-gray-700 mb-2 sm:mb-0">
        {i18next.t("showing")}{" "}
        <span className="font-semibold text-gray-900">{startItem}</span>{" "}
        {i18next.t("to")}{" "}
        <span className="font-semibold text-gray-900">{endItem}</span>{" "}
        {i18next.t("of")}{" "}
        <span className="font-semibold text-gray-900">{totalResult}</span>{" "}
        {i18next.t("results")}
      </p>

      <nav
        className="inline-flex rounded-md shadow-sm overflow-hidden"
        aria-label="Pagination"
      >
        <button
          className="flex items-center px-3 py-2 bg-white text-gray-500 hover:bg-gray-100 border border-r-0 border-gray-300 rounded-l-md"
          aria-label="Previous"
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {renderPageNumbers()}

        <button
          className="flex items-center px-3 py-2 bg-white text-gray-500 hover:bg-gray-100 border border-l-0 border-gray-300 rounded-r-md"
          aria-label="Next"
          onClick={() => handlePageChange(page + 1)}
          disabled={page === totalPage}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </nav>
    </div>
  );
}
