export default function ConnectionCallout({ lessonNumber, lessonTitle, message }) {
    return (
        <p className="connection-callout">
            Builds on Lesson {lessonNumber}: {lessonTitle} &mdash; {message}
        </p>
    );
}
