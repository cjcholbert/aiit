import { useState } from 'react';
import SearchBar from './SearchBar';
import Pagination from './Pagination';
import PasswordModal from './PasswordModal';

export default function UserTable({ api, apiRaw, showSuccess, showError }) {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const LIMIT = 20;

  const loadUsers = async (p = page, s = search, f = filterActive) => {
    try {
      const params = new URLSearchParams({ skip: (p - 1) * LIMIT, limit: LIMIT });
      if (s) params.set('search', s);
      if (f !== null) params.set('is_active', f);
      const data = await api(`/admin/users?${params}`);
      setUsers(data.users);
      setTotal(data.total);
      setPages(data.pages);
      setPage(data.page);
      setLoaded(true);
    } catch (err) {
      showError(err.message);
    }
  };

  // Load on first render
  if (!loaded) loadUsers(1);

  const handleSearch = (val) => {
    setSearch(val);
    loadUsers(1, val, filterActive);
  };

  const handleFilter = (val) => {
    setFilterActive(val);
    loadUsers(1, search, val);
  };

  const handlePageChange = (p) => {
    loadUsers(p, search, filterActive);
  };

  const toggleActive = async (userId) => {
    try {
      await api(`/admin/users/${userId}/toggle-active`, { method: 'POST' });
      showSuccess('User status updated');
      loadUsers();
    } catch (err) {
      showError(err.message);
    }
  };

  const deleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user and all their data?')) return;
    try {
      await api(`/admin/users/${userId}`, { method: 'DELETE' });
      showSuccess('User deleted');
      loadUsers();
    } catch (err) {
      showError(err.message);
    }
  };

  const resetPassword = async (userId, newPassword) => {
    if (!newPassword || newPassword.length < 8) {
      showError('Password must be at least 8 characters');
      return;
    }
    try {
      await api(`/admin/users/${userId}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ new_password: newPassword }),
      });
      showSuccess('Password reset successfully');
      setSelectedUser(null);
    } catch (err) {
      showError(err.message);
    }
  };

  const exportCsv = async () => {
    try {
      const res = await apiRaw('/admin/export/users');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'users_export.csv';
      a.click();
      URL.revokeObjectURL(url);
      showSuccess('CSV exported');
    } catch (err) {
      showError(err.message);
    }
  };

  return (
    <>
      <div className="export-bar">
        <button onClick={exportCsv} className="btn btn-secondary btn-sm">
          Export CSV
        </button>
      </div>

      <SearchBar
        search={search}
        onSearchChange={handleSearch}
        filterActive={filterActive}
        onFilterChange={handleFilter}
      />

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Status</th>
              <th>Admin</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr>
                <td colSpan="5" className="empty-state">No users found</td>
              </tr>
            )}
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.email}</td>
                <td>
                  <span className={`badge ${user.is_active ? 'badge-green' : 'badge-red'}`}>
                    {user.is_active ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td>
                  {user.is_admin && <span className="badge badge-blue">Admin</span>}
                </td>
                <td className="text-muted text-sm">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td>
                  <div className="btn-group">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="btn btn-secondary btn-sm"
                    >
                      Reset PW
                    </button>
                    <button
                      onClick={() => toggleActive(user.id)}
                      className="btn btn-secondary btn-sm"
                    >
                      {user.is_active ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => deleteUser(user.id)}
                      className="btn btn-danger btn-sm"
                    >
                      Delete
                    </button>
                  </div>
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

      {selectedUser && (
        <PasswordModal
          user={selectedUser}
          onReset={resetPassword}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </>
  );
}
