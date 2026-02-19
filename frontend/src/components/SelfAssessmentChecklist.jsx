import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';

/**
 * Reusable self-assessment checklist component.
 * Auto-checks criteria based on API data for each lesson.
 *
 * Props:
 *   lessonNumber: number (1-12)
 *   criteria: Array<{ id: string, label: string, endpoint: string, check: (data) => boolean, progressLabel?: (data) => string }>
 */
export default function SelfAssessmentChecklist({ lessonNumber, criteria, accentColor }) {
  const api = useApi();
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const checkCriteria = async () => {
      setLoading(true);
      const newResults = {};

      // Group criteria by endpoint to avoid duplicate fetches
      const endpointMap = {};
      for (const criterion of criteria) {
        if (!endpointMap[criterion.endpoint]) {
          endpointMap[criterion.endpoint] = [];
        }
        endpointMap[criterion.endpoint].push(criterion);
      }

      // Fetch each unique endpoint
      const fetches = Object.entries(endpointMap).map(async ([endpoint, linkedCriteria]) => {
        try {
          const data = await api.get(endpoint);
          for (const criterion of linkedCriteria) {
            try {
              newResults[criterion.id] = {
                met: criterion.check(data),
                progress: criterion.progressLabel ? criterion.progressLabel(data) : null,
              };
            } catch {
              newResults[criterion.id] = { met: false, progress: null };
            }
          }
        } catch {
          for (const criterion of linkedCriteria) {
            newResults[criterion.id] = { met: false, progress: null };
          }
        }
      });

      await Promise.all(fetches);

      if (!cancelled) {
        setResults(newResults);
        setLoading(false);
      }
    };

    checkCriteria();
    return () => { cancelled = true; };
  }, [lessonNumber]);

  const completedCount = Object.values(results).filter((r) => r.met).length;
  const totalCount = criteria.length;

  if (loading) {
    return (
      <div className="self-assessment-checklist">
        <div className="self-assessment-loading">Checking progress...</div>
      </div>
    );
  }

  return (
    <div className="self-assessment-checklist">
      <div className="self-assessment-header">
        <span className={`self-assessment-count ${completedCount === totalCount ? 'complete' : ''}`}>
          {completedCount}/{totalCount}
        </span>
      </div>
      <div className="self-assessment-items">
        {criteria.map((criterion) => {
          const result = results[criterion.id] || { met: false, progress: null };
          return (
            <div
              key={criterion.id}
              className={`self-assessment-item ${result.met ? 'met' : 'unmet'}`}
            >
              <span
                className={`self-assessment-check ${result.met ? 'checked' : ''}`}
                style={result.met && accentColor ? { color: accentColor } : undefined}
              >
                {result.met ? '\u2713' : ''}
              </span>
              <span className="self-assessment-label">
                {criterion.label}
                {result.progress && (
                  <span className="self-assessment-progress">{result.progress}</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
      {completedCount === totalCount && (
        <div className="self-assessment-complete-msg">
          All criteria met - great work on this lesson!
        </div>
      )}
    </div>
  );
}
