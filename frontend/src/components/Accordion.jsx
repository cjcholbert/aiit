import { useState } from 'react';
import './Accordion.css';

export function AccordionSection({ title, defaultOpen = false, children }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className={`accordion-section ${isOpen ? 'accordion-section--open' : ''}`}>
            <button
                className="accordion-section__header"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
            >
                <span className="accordion-section__title">{title}</span>
                <span className="accordion-section__icon">{isOpen ? '−' : '+'}</span>
            </button>
            <div className="accordion-section__body">
                <div className="accordion-section__content">
                    {children}
                </div>
            </div>
        </div>
    );
}
