export default function Pagination({ page, pages, total, onPageChange }) {
  if (pages <= 1) return null;

  return (
    <div className="pagination">
      <div className="pagination-info">
        Page {page} of {pages} ({total} total)
      </div>
      <div className="pagination-controls">
        <button
          className="pagination-btn"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Prev
        </button>
        {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
          let pageNum;
          if (pages <= 5) {
            pageNum = i + 1;
          } else if (page <= 3) {
            pageNum = i + 1;
          } else if (page >= pages - 2) {
            pageNum = pages - 4 + i;
          } else {
            pageNum = page - 2 + i;
          }
          return (
            <button
              key={pageNum}
              className={`pagination-btn ${pageNum === page ? 'pagination-btn-active' : ''}`}
              onClick={() => onPageChange(pageNum)}
            >
              {pageNum}
            </button>
          );
        })}
        <button
          className="pagination-btn"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
