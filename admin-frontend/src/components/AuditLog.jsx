import { useState, useEffect } from 'react';
import Pagination from './Pagination';

const ACTION_CLASSES = {
  'reset-password': 'audit-action-reset-password',
  'toggle-active': 'audit-action-toggle-active',
  'delete-user': 'audit-action-delete-user',
};

export default function AuditLog({ api, showError }) {
  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const LIMIT = 20;

  useEffect(() => {
    loadLog();
  }, []);

  const loadLog = async (p = 1, action = actionFilter, from = dateFrom, to = dateTo) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ skip: (p - 1) * LIMIT, limit: LIMIT });
      if (action) params.set('action', action);
      if (from) params.set('date_from', from);
      if (to) params.set('date_to', to);
      const data = await api(`/admin/audit-log?${params}`);
      setEntries(data.entries);
      setTotal(data.total);
      setPages(data.pages);
      setPage(data.page);
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleActionFilter = (val) => {
    setActionFilter(val);
    loadLog(1, val, dateFrom, dateTo);
  };

  const handleDateFrom = (val) => {
    setDateFrom(val);
    loadLog(1, actionFilter, val, dateTo);
  };

  const handleDateTo = (val) => {
    setDateTo(val);
    loadLog(1, actionFilter, dateFrom, val);
  };

  const handlePageChange = (p) => {
    loadLog(p, actionFilter, dateFrom, dateTo);
  };

  if (loading && entries.length === 0) {
    return <div className="loading-spinner">Loading audit log...</div>;
  }

  return (
    <>
      <div className="audit-filters">
        <select
          value={actionFilter}
          onChange={(e) => handleActionFilter(e.target.value)}
          className="search-select"
        >
          <option value="">All Actions</option>
          <option value="reset-password">Reset Password</option>
          <option value="toggle-active">Toggle Active</option>
          <option value="delete-user">Delete User</option>
        </select>

        <span className="audit-date-label">From:</span>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => handleDateFrom(e.target.value)}
          className="search-input input-inline"
        />

        <span className="audit-date-label">To:</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => handleDateTo(e.target.value)}
          className="search-input input-inline"
        />
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Details</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && (
              <tr>
                <td colSpan="3" className="empty-state">No audit entries found</td>
              </tr>
            )}
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td>
                  <span className={`audit-action ${ACTION_CLASSES[entry.action] || ''}`}>
                    {entry.action}
                  </span>
                </td>
                <td className="audit-details">
                  {entry.details?.email && <span>{entry.details.email}</span>}
                  {entry.details?.new_status && <span> — {entry.details.new_status}</span>}
                </td>
                <td className="audit-timestamp">
                  {new Date(entry.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <Pagination
          page={page}
          pages={pages}
          total={total}
          onPageChange={handlePageChange}
        />
      </div>
    </>
  );
}
