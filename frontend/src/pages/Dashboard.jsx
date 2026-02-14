import { Link } from 'react-router-dom';
import { MODULES, CONCEPTS, APP_NAME } from '../config/modules';

export default function Dashboard() {
    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">{APP_NAME}</h1>
                <p className="page-description">
                    12-lesson curriculum organized into 4 modules for mastering AI collaboration. Build systematic habits for effective AI partnership.
                </p>
            </div>

            {MODULES.map((module) => (
                <div key={module.name} style={{ marginBottom: '32px' }}>
                    <div
                        style={{
                            backgroundColor: module.color,
                            borderLeft: `4px solid ${module.borderColor}`,
                            padding: '12px 16px',
                            borderRadius: '4px',
                            marginBottom: '16px'
                        }}
                    >
                        <h2 style={{
                            margin: 0,
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            color: module.textColor,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}>
                            {module.name}
                        </h2>
                    </div>
                    <div className="module-grid">
                        {module.lessons.map((lesson) => {
                            const concept = CONCEPTS[lesson.concept];
                            return (
                                <Link
                                    key={lesson.lesson}
                                    to={lesson.status === 'active' ? `/lesson/${lesson.lesson}` : '#'}
                                    className="module-card"
                                    style={{
                                        opacity: lesson.status === 'coming' ? 0.6 : 1,
                                        cursor: lesson.status === 'coming' ? 'not-allowed' : 'pointer'
                                    }}
                                    onClick={(e) => {
                                        if (lesson.status === 'coming') e.preventDefault();
                                    }}
                                >
                                    <div className="module-card-header">
                                        <span className="module-card-number">Lesson {lesson.lesson}</span>
                                        {lesson.status === 'coming' && (
                                            <span className="badge badge-blue">Coming Soon</span>
                                        )}
                                    </div>
                                    <h3 className="module-card-title">{lesson.title}</h3>
                                    <p className="module-card-description">{lesson.description}</p>
                                    {concept && (
                                        <div style={{
                                            marginTop: '12px',
                                            padding: '4px 8px',
                                            background: concept.color + '30',
                                            borderLeft: `3px solid ${concept.color}`,
                                            borderRadius: '0 4px 4px 0',
                                            fontSize: '0.7rem',
                                            color: concept.color,
                                            fontWeight: 500
                                        }}>
                                            {concept.name}
                                        </div>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
