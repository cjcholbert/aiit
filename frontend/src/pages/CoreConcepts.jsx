export default function CoreConcepts() {
    const concepts = [
        {
            id: 'contextAssembly',
            name: 'Context Assembly',
            color: '#3a9080',
            tagline: 'Curating the briefing that shapes AI output quality',
            description: 'The skill of gathering and presenting relevant background information to enable effective AI collaboration. This includes identifying what information is needed, organizing it coherently, and providing sufficient detail without overwhelming noise—essentially curating the "briefing" that shapes the quality of AI outputs.',
            lessons: [1, 3, 4]
        },
        {
            id: 'qualityJudgment',
            name: 'Quality Judgment',
            color: '#3a9080',
            tagline: 'Distinguishing "looks right" from "is right"',
            description: 'The ability to critically evaluate AI-generated outputs for accuracy, completeness, appropriateness, and fitness for purpose. This involves recognizing errors, identifying gaps, assessing tone and style, and determining whether the output genuinely meets the intended need rather than just appearing plausible.',
            lessons: [5, 6]
        },
        {
            id: 'taskDecomposition',
            name: 'Task Decomposition',
            color: '#3a9080',
            tagline: 'Breaking complex problems into AI-appropriate chunks',
            description: 'Breaking complex problems into smaller, manageable components that can be addressed sequentially or in parallel. This skill involves understanding which subtasks are AI-appropriate, how to sequence them effectively, and where human judgment is required between steps.',
            lessons: [7, 8]
        },
        {
            id: 'iterativeRefinement',
            name: 'Iterative Refinement',
            color: '#3a9080',
            tagline: 'Steering toward outcomes through successive approximations',
            description: 'The practice of progressively improving outputs through cycles of feedback, adjustment, and revision. Rather than expecting perfect results immediately, this involves steering toward the desired outcome through successive approximations—knowing what to ask for, how to redirect, and when "good enough" has been reached.',
            lessons: [2, 9]
        },
        {
            id: 'workflowIntegration',
            name: 'Workflow Integration',
            color: '#3a9080',
            tagline: 'Embedding AI into sustainable work patterns',
            description: 'Embedding AI collaboration into existing work processes in sustainable, practical ways. This means identifying where AI adds genuine value, designing handoffs between human and AI work, and creating repeatable patterns that enhance rather than disrupt productivity.',
            lessons: [10, 12]
        },
        {
            id: 'frontierRecognition',
            name: 'Frontier Recognition',
            color: '#3a9080',
            tagline: 'Knowing the boundaries of AI capability',
            description: 'Understanding the current boundaries of AI capability—what it can and cannot do reliably, where it excels versus struggles, and how those boundaries are shifting. This awareness prevents both underutilization and overreliance, enabling appropriate task assignment and realistic expectations.',
            lessons: [11]
        }
    ];

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">The Six Core Concepts</h1>
                <p className="page-description">
                    These six managerial skills form the foundation of effective AI collaboration.
                    Each concept represents a distinct capability that, when developed together,
                    enables productive human-AI partnership.
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {concepts.map((concept, index) => (
                    <div
                        key={concept.id}
                        style={{
                            background: 'var(--bg-secondary)',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: '1px solid var(--border-color)'
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                                padding: '16px 20px',
                                borderBottom: `3px solid ${concept.color}`,
                                background: concept.color + '15'
                            }}
                        >
                            <span
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    background: concept.color,
                                    color: '#ffffff',
                                    fontWeight: 600,
                                    fontSize: '1rem'
                                }}
                            >
                                {index + 1}
                            </span>
                            <div>
                                <h2 style={{
                                    margin: 0,
                                    fontSize: '1.1rem',
                                    fontWeight: 600,
                                    color: 'var(--text-primary)'
                                }}>
                                    {concept.name}
                                </h2>
                                <p style={{
                                    margin: '4px 0 0 0',
                                    fontSize: '0.85rem',
                                    color: concept.color,
                                    fontStyle: 'italic'
                                }}>
                                    {concept.tagline}
                                </p>
                            </div>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <p style={{
                                margin: '0 0 16px 0',
                                fontSize: '0.9rem',
                                color: 'var(--text-secondary)',
                                lineHeight: 1.6
                            }}>
                                {concept.description}
                            </p>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                paddingTop: '12px',
                                borderTop: '1px solid var(--border-color)'
                            }}>
                                <span style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--text-muted)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    Practiced in:
                                </span>
                                {concept.lessons.map(lessonNum => (
                                    <a
                                        key={lessonNum}
                                        href={`/lesson/${lessonNum}`}
                                        style={{
                                            padding: '4px 10px',
                                            background: concept.color + '25',
                                            border: `1px solid ${concept.color}50`,
                                            borderRadius: '4px',
                                            fontSize: '0.75rem',
                                            color: concept.color,
                                            textDecoration: 'none',
                                            fontWeight: 500
                                        }}
                                    >
                                        Lesson {lessonNum}
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
