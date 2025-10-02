/**
 * Advanced Pagination Component
 * Follows industry best practices with page size selector and page navigation
 */
import { h } from 'preact';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalElements: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
}

export function Pagination({
  currentPage,
  totalPages,
  pageSize,
  totalElements,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100]
}: PaginationProps) {
  
  // Calculate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 7;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Smart pagination with ellipsis
      if (currentPage < 3) {
        // Near the beginning
        pages.push(0, 1, 2, 3, '...', totalPages - 1);
      } else if (currentPage > totalPages - 4) {
        // Near the end
        pages.push(0, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1);
      } else {
        // In the middle
        pages.push(0, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages - 1);
      }
    }
    
    return pages;
  };

  const startItem = currentPage * pageSize + 1;
  const endItem = Math.min((currentPage + 1) * pageSize, totalElements);

  const paginationStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    borderTop: '1px solid #e0e0e0',
    backgroundColor: '#fafafa',
    gap: '16px',
    flexWrap: 'wrap' as const
  };

  const leftSectionStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '14px',
    color: '#666'
  };

  const centerSectionStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  };

  const rightSectionStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#666'
  };

  const buttonStyle = (active = false, disabled = false) => ({
    padding: '6px 12px',
    minWidth: '36px',
    border: active ? '2px solid #000' : '1px solid #ddd',
    backgroundColor: active ? '#000' : disabled ? '#f5f5f5' : '#fff',
    color: active ? '#fff' : disabled ? '#999' : '#333',
    cursor: disabled ? 'not-allowed' : 'pointer',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: active ? '600' : '400',
    transition: 'all 0.2s ease',
    opacity: disabled ? 0.5 : 1
  });

  const ellipsisStyle = {
    padding: '6px 12px',
    color: '#999',
    fontSize: '14px'
  };

  const selectStyle = {
    padding: '6px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: '#fff',
    fontSize: '14px',
    cursor: 'pointer',
    outline: 'none'
  };

  return (
    <div style={paginationStyle}>
      {/* Left: Page Size Selector */}
      <div style={leftSectionStyle}>
        <span>Show</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(parseInt((e.target as HTMLSelectElement).value))}
          style={selectStyle}
        >
          {pageSizeOptions.map(size => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
        <span>items per page</span>
      </div>

      {/* Center: Page Navigation */}
      <div style={centerSectionStyle}>
        {/* First Page */}
        <button
          onClick={() => onPageChange(0)}
          disabled={currentPage === 0}
          style={buttonStyle(false, currentPage === 0)}
          title="First Page"
        >
          ««
        </button>

        {/* Previous Page */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
          style={buttonStyle(false, currentPage === 0)}
          title="Previous Page"
        >
          ‹
        </button>

        {/* Page Numbers */}
        {getPageNumbers().map((page, index) => {
          if (page === '...') {
            return (
              <span key={`ellipsis-${index}`} style={ellipsisStyle}>
                ...
              </span>
            );
          }
          
          const pageNum = page as number;
          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              style={buttonStyle(currentPage === pageNum)}
              title={`Page ${pageNum + 1}`}
            >
              {pageNum + 1}
            </button>
          );
        })}

        {/* Next Page */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
          style={buttonStyle(false, currentPage >= totalPages - 1)}
          title="Next Page"
        >
          ›
        </button>

        {/* Last Page */}
        <button
          onClick={() => onPageChange(totalPages - 1)}
          disabled={currentPage >= totalPages - 1}
          style={buttonStyle(false, currentPage >= totalPages - 1)}
          title="Last Page"
        >
          »»
        </button>
      </div>

      {/* Right: Info */}
      <div style={rightSectionStyle}>
        <span>
          Showing {totalElements > 0 ? startItem : 0} - {endItem} of {totalElements}
        </span>
      </div>
    </div>
  );
}
