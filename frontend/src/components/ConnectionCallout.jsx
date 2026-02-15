import { Link } from 'react-router-dom';

export default function ConnectionCallout({ lessonNumber, lessonTitle, message }) {
    return (
        <div className="connection-callout">
            <div className="connection-callout-icon">&#x2194;</div>
            <div className="connection-callout-body">
                <p className="connection-callout-text">{message}</p>
                <Link to={`/lesson/${lessonNumber}`} className="connection-callout-link">
                    Review Lesson {lessonNumber}: {lessonTitle}
                </Link>
            </div>
        </div>
    );
}
