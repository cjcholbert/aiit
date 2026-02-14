export default function SkipLink({ targetId = 'main-content', children = 'Skip to main content' }) {
    const handleClick = (e) => {
        e.preventDefault();
        const target = document.getElementById(targetId);
        if (target) {
            target.focus();
            target.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <a
            href={`#${targetId}`}
            className="skip-link"
            onClick={handleClick}
        >
            {children}
        </a>
    );
}
