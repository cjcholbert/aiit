import { useState } from 'react';

export default function PasswordModal({ user, onReset, onClose }) {
  const [newPassword, setNewPassword] = useState('');

  const handleReset = () => {
    if (!newPassword || newPassword.length < 8) return;
    onReset(user.id, newPassword);
    setNewPassword('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Reset Password</h3>
        <p className="modal-description">
          Reset password for: {user.email}
        </p>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="New password (min 8 chars)"
          className="input"
          onKeyDown={(e) => e.key === 'Enter' && handleReset()}
        />
        <div className="btn-group">
          <button onClick={handleReset} className="btn btn-primary">
            Reset
          </button>
          <button
            onClick={() => { onClose(); setNewPassword(''); }}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
