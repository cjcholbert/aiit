import { useState, useRef, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import './ExamplesDropdown.css';

export default function ExamplesDropdown({ endpoint, onSelect, buttonLabel = 'Examples' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [examples, setExamples] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);
  const api = useApi();

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const fetchExamples = async () => {
    if (examples) return; // Cache: don't re-fetch
    setLoading(true);
    setError(null);
    try {
      const data = await api.get(endpoint);
      setExamples(Array.isArray(data) ? data : data.examples || []);
    } catch (err) {
      setError(err.message || 'Failed to load examples');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    const opening = !isOpen;
    setIsOpen(opening);
    if (opening) {
      fetchExamples();
    }
  };

  const handleSelect = (example) => {
    onSelect(example);
    setIsOpen(false);
  };

  return (
    <div className="examples-dropdown" ref={dropdownRef}>
      <button
        type="button"
        className="examples-dropdown__trigger"
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {buttonLabel}
        <span className={`examples-dropdown__arrow${isOpen ? ' examples-dropdown__arrow--open' : ''}`}>
          &#9660;
        </span>
      </button>

      {isOpen && (
        <div className="examples-dropdown__menu" role="menu">
          {loading && (
            <div className="examples-dropdown__loading">Loading examples...</div>
          )}
          {error && (
            <div className="examples-dropdown__error">{error}</div>
          )}
          {!loading && !error && examples && examples.length === 0 && (
            <div className="examples-dropdown__empty">No examples available</div>
          )}
          {!loading && !error && examples && examples.map((example, index) => (
            <button
              key={index}
              className="examples-dropdown__item"
              onClick={() => handleSelect(example)}
              role="menuitem"
            >
              <span className="examples-dropdown__item-category">
                {example.category_name || example.name || example.category || `Example ${index + 1}`}
              </span>
              {(example.description || example.title) && (
                <span className="examples-dropdown__item-description">
                  {example.description || example.title}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
