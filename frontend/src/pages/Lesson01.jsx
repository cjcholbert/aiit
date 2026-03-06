import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useLessonStats } from '../contexts/LessonStatsContext';
import ConnectionCallout from '../components/ConnectionCallout';
import ExamplesDropdown from '../components/ExamplesDropdown';
import { AccordionSection } from '../components/Accordion';
import { copyToClipboard } from '../utils/exportUtils';
import LessonNav from '../components/LessonNav';

export default function Lesson01() {
    const [activeTab, setActiveTab] = useState('concepts');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [analysis, setAnalysis] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [stats, setStats] = useState(null);
    const [insights, setInsights] = useState(null);
    const [userEdits, setUserEdits] = useState({ topic: '', pattern_category: '', habit_to_build: '', notes: '' });


    // Converter state
    const [converterInput, setConverterInput] = useState('');
    const [converterOutput, setConverterOutput] = useState('');
    const [converterStats, setConverterStats] = useState(null);
    const [converterError, setConverterError] = useState('');

    const api = useApi();
    const { setStats: setSidebarStats } = useLessonStats();

    useEffect(() => {
        loadStats();
        loadInsights();
    }, []);

    useEffect(() => {
        if (activeTab === 'history') {
            loadConversations();
        }
    }, [activeTab]);

    useEffect(() => {
        setSidebarStats([
            { label: 'Conversations', value: stats?.total_conversations ?? '-', color: 'var(--accent-blue)' },
            { label: 'Avg Confidence', value: stats?.avg_confidence_score != null ? stats.avg_confidence_score.toFixed(1) : '-', color: 'var(--accent-green)' },
            { label: 'Recurring Gaps', value: insights?.context_gaps?.length ?? '-', color: 'var(--accent-yellow)' },
            { label: 'Context Strengths', value: insights?.context_strengths?.length ?? '-', color: 'var(--accent-purple)' },
        ]);
        return () => setSidebarStats(null);
    }, [stats, insights, setSidebarStats]);


    const loadConversations = async () => {
        try {
            const data = await api.get('/lesson1/conversations');
            setConversations(data);
        } catch (err) {
            setError('Failed to load conversations');
        }
    };

    const loadStats = async () => {
        try {
            const data = await api.get('/lesson1/patterns');
            setStats(data);
        } catch (err) {
            setError('Failed to load stats');
        }
    };

    const loadInsights = async () => {
        try {
            const data = await api.get('/lesson1/insights');
            setInsights(data);
        } catch (err) {
            setError('Failed to load insights');
        }
    };

    const saveEdits = async () => {
        if (!analysis) return;

        try {
            await api.put(`/lesson1/conversations/${analysis.id}`, { user_edits: userEdits });
            setAnalysis(null);
            setConverterInput('');
            setConverterOutput('');
            setConverterStats(null);
            setActiveTab('history');
            loadConversations();
        } catch (err) {
            setError('Failed to save');
        }
    };


    const loadConversation = async (id) => {
        try {
            const data = await api.get(`/lesson1/conversations/${id}`);
            setSelectedConversation(data);
        } catch (err) {
            setError('Failed to load conversation');
        }
    };

    const deleteConversation = async (id, e) => {
        e.stopPropagation();
        if (!confirm('Delete this conversation?')) return;

        try {
            await api.del(`/lesson1/conversations/${id}`);
            loadConversations();
            if (selectedConversation?.id === id) {
                setSelectedConversation(null);
            }
        } catch (err) {
            setError('Failed to delete');
        }
    };

    const getScoreClass = (score) => {
        if (score >= 8) return 'high';
        if (score >= 5) return 'medium';
        return 'low';
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Converter functions
    const parseWithLabels = (text, userLabel, assistantLabel) => {
        const messages = [];
        const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const userEscaped = escapeRegex(userLabel);
        const assistantEscaped = escapeRegex(assistantLabel);
        const splitPattern = new RegExp(`(${userEscaped}|${assistantEscaped})`, 'g');
        const parts = text.split(splitPattern).filter(p => p.trim());

        let currentRole = null;
        let currentContent = '';

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i].trim();
            if (part === userLabel) {
                if (currentRole && currentContent.trim()) {
                    messages.push({ role: currentRole, content: currentContent.trim() });
                }
                currentRole = 'user';
                currentContent = '';
            } else if (part === assistantLabel) {
                if (currentRole && currentContent.trim()) {
                    messages.push({ role: currentRole, content: currentContent.trim() });
                }
                currentRole = 'assistant';
                currentContent = '';
            } else if (currentRole) {
                currentContent += part;
            }
        }
        if (currentRole && currentContent.trim()) {
            messages.push({ role: currentRole, content: currentContent.trim() });
        }
        return messages;
    };

    const parseAlternating = (text) => {
        const blocks = text.split(/\n\s*\n/).filter(b => b.trim());
        return blocks.map((block, index) => ({
            role: index % 2 === 0 ? 'user' : 'assistant',
            content: block.trim()
        }));
    };

    const convertToJSON = () => {
        setConverterStats(null);
        setConverterError('');
        setConverterOutput('');

        if (!converterInput.trim()) {
            setConverterError('Please paste a conversation first.');
            return;
        }

        try {
            let messages = [];
            const labelPatterns = [
                { user: 'You:', assistant: 'AI:' },
                { user: 'Human:', assistant: 'Assistant:' },
                { user: 'User:', assistant: 'Assistant:' },
                { user: 'User:', assistant: 'Claude:' },
                { user: 'You:', assistant: 'Claude:' },
            ];

            // Auto-detect: try common label patterns first
            let parsed = false;
            for (const pattern of labelPatterns) {
                if (converterInput.includes(pattern.user) && converterInput.includes(pattern.assistant)) {
                    messages = parseWithLabels(converterInput, pattern.user, pattern.assistant);
                    parsed = true;
                    break;
                }
            }
            // Fallback to alternating paragraphs
            if (!parsed) {
                messages = parseAlternating(converterInput);
            }

            if (messages.length === 0) {
                throw new Error('No messages could be parsed. Try selecting a different format.');
            }

            const output = {
                messages: messages,
                exported_at: new Date().toISOString(),
                message_count: messages.length
            };

            setConverterOutput(JSON.stringify(output, null, 2));
            const userCount = messages.filter(m => m.role === 'user').length;
            const assistantCount = messages.filter(m => m.role === 'assistant').length;
            setConverterStats({ total: messages.length, user: userCount, assistant: assistantCount });
        } catch (err) {
            setConverterError(err.message);
        }
    };

    const downloadConverterJSON = () => {
        if (!converterOutput) return;
        const blob = new Blob([converterOutput], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `conversation-${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const copyConverterJSON = () => {
        if (!converterOutput) return;
        copyToClipboard(converterOutput);
    };

    const analyzeConverted = async () => {
        if (!converterInput.trim()) return;

        // Parse silently before analyzing
        convertToJSON();

        let formatted = '';
        try {
            let messages = [];
            const labelPatterns = [
                { user: 'You:', assistant: 'AI:' },
                { user: 'Human:', assistant: 'Assistant:' },
                { user: 'User:', assistant: 'Assistant:' },
                { user: 'User:', assistant: 'Claude:' },
                { user: 'You:', assistant: 'Claude:' },
            ];
            let parsed = false;
            for (const pattern of labelPatterns) {
                if (converterInput.includes(pattern.user) && converterInput.includes(pattern.assistant)) {
                    messages = parseWithLabels(converterInput, pattern.user, pattern.assistant);
                    parsed = true;
                    break;
                }
            }
            if (!parsed) messages = parseAlternating(converterInput);
            if (messages.length === 0) throw new Error('Could not parse conversation. Try a different format.');
            formatted = messages.map(m =>
                `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
            ).join('\n\n');
        } catch (err) {
            setError(err.message);
            return;
        }

        setLoading(true);
        setError('');
        setAnalysis(null);

        try {
            const result = await api.post('/lesson1/analyze', { raw_transcript: formatted });
            setAnalysis(result);
            setUserEdits({
                topic: result.analysis.topic,
                pattern_category: result.analysis.pattern.category,
                habit_to_build: result.analysis.coaching.habit_to_build,
                notes: ''
            });
        } catch (err) {
            setError(err.message || 'Analysis failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="lesson-header">
                <div className="lesson-header-left">
                    <h1 className="page-title">Context Pattern Tracker</h1>
                    <div className="lesson-header-problem-skill">
                        <p><strong>The Problem:</strong> AI conversations fail when critical context is missing. You waste time on back-and-forth clarifications or get unusable outputs because you forgot to mention key constraints.</p>
                        <p><strong>The Skill:</strong> Identify your personal context gaps by analyzing past conversations. Discover what information you consistently forget to provide so you can fix it upfront.</p>
                    </div>

                </div>
                <div className="lesson-header-right">
                    <LessonNav lessonNumber={1} />
                </div>
            </div>

            <div className="tabs">
                {[
                    { key: 'concepts', label: 'Concepts' },
                    { key: 'analysis', label: 'Analysis' },
                    { key: 'history', label: 'History' },
                ].map(({ key, label }) => (
                    <button
                        key={key}
                        className={`tab ${activeTab === key ? 'active' : ''}`}
                        onClick={() => {
                            setActiveTab(key);
                            if (key === 'analysis') { setAnalysis(null); setSelectedConversation(null); }
                            if (key === 'history') { setSelectedConversation(null); }
                        }}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {/* Learn Tab */}
            {activeTab === 'concepts' && (
                <div className="learn-section">
                    <AccordionSection title="🧭 How This Lesson Works" defaultOpen={false}>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                            Two practice areas to discover and track your context patterns:
                        </p>

                        <div className="learn-patterns-grid">
                            <div className="learn-pattern-card">
                                <h4 style={{ color: 'var(--accent-blue)' }}>Analyze Tab — Find Your Gaps</h4>
                                <p>Paste a real AI conversation (or upload a JSON export). The tool analyzes what context
                                you provided, what was missing, and what the AI had to guess. You'll get a specific coaching
                                suggestion and an improved version of your opening prompt.</p>
                            </div>
                            <div className="learn-pattern-card">
                                <h4 style={{ color: 'var(--accent-green)' }}>History Tab — Track Your Patterns</h4>
                                <p>See all your analyzed conversations in one place. Over time, recurring gaps and
                                strengths emerge — showing you exactly which context habits to build and which
                                ones you've already mastered.</p>
                            </div>
                        </div>
                    </AccordionSection>

                    <AccordionSection title="⚖️ Without Context vs. With Context">
                        <div className="learn-comparison">
                            <div className="learn-comparison-grid">
                                <div className="learn-comparison-col">
                                    <h4 className="poor">Missing Context (Generic Output)</h4>
                                    <div className="learn-comparison-item poor">
                                        <div className="learn-comparison-scenario">Event Planning</div>
                                        <p>"Help me plan a team offsite."</p>
                                    </div>
                                    <div className="learn-comparison-item poor">
                                        <div className="learn-comparison-scenario">Client Email</div>
                                        <p>"Write an email to my client about the project delay."</p>
                                    </div>
                                    <div className="learn-comparison-item poor">
                                        <div className="learn-comparison-scenario">Budget Review</div>
                                        <p>"Look at this spreadsheet and give me insights."</p>
                                    </div>
                                </div>
                                <div className="learn-comparison-col">
                                    <h4 className="good">Rich Context (Targeted Output)</h4>
                                    <div className="learn-comparison-item good">
                                        <div className="learn-comparison-scenario">Event Planning</div>
                                        <p>"Help me plan a 2-day team offsite for 25 people in the Denver area. Budget is
                                        $8K. The goal is team bonding after a reorg — not strategy sessions. Half the team
                                        is remote and hasn't met in person."</p>
                                    </div>
                                    <div className="learn-comparison-item good">
                                        <div className="learn-comparison-scenario">Client Email</div>
                                        <p>"Write an email to our client (VP of Marketing at Greenfield Inc.) explaining
                                        that the campaign launch is delayed 2 weeks because of vendor artwork issues. We've
                                        already sourced a backup vendor. Tone: professional, reassuring. Keep it under 150 words."</p>
                                    </div>
                                    <div className="learn-comparison-item good">
                                        <div className="learn-comparison-scenario">Budget Review</div>
                                        <p>"Analyze our Q4 department spending (attached CSV). I need to find: which cost
                                        centers exceeded budget by more than 10%, whether the new contractor line items are
                                        trending up, and a summary I can present to our CFO in 3 bullet points."</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </AccordionSection>

                    <AccordionSection title="🕳️ The Four Most Common Context Gaps">
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                            These are the patterns the Analyze tab looks for in your conversations. Learn to recognize
                            them so you can catch them before they waste your time.
                        </p>

                        <div className="learn-patterns-grid">
                            <div className="learn-pattern-card">
                                <h4 style={{ color: 'var(--accent-red)' }}>Missing Constraints</h4>
                                <p>You describe what you want but leave out the boundaries: budget, timeline,
                                word count, audience level, or format requirements.</p>
                                <div className="learn-example-bad">
                                    "Write me a marketing email."
                                </div>
                                <div className="learn-example-good">
                                    "Write a 150-word marketing email for our spring wellness program, targeting
                                    employees in the 25-40 age range. Tone: upbeat but not cheesy. Include a
                                    registration link and a deadline."
                                </div>
                            </div>

                            <div className="learn-pattern-card">
                                <h4 style={{ color: 'var(--accent-red)' }}>Assumed Knowledge</h4>
                                <p>You reference project details, acronyms, or past decisions without explaining
                                them — assuming the AI shares your memory.</p>
                                <div className="learn-example-bad">
                                    "Update the TPS reports to match the new format from last week's meeting."
                                </div>
                                <div className="learn-example-good">
                                    "Our weekly status reports need to switch from paragraph format to bullet points
                                    with three sections: Completed, In Progress, and Blocked. Each bullet should be
                                    one sentence max."
                                </div>
                            </div>

                            <div className="learn-pattern-card">
                                <h4 style={{ color: 'var(--accent-red)' }}>Vague Goals</h4>
                                <p>Your request has no clear success criteria. The AI can't tell what "good"
                                looks like because you haven't defined it.</p>
                                <div className="learn-example-bad">
                                    "Help me improve this document."
                                </div>
                                <div className="learn-example-good">
                                    "This proposal needs to convince our director to approve a $15K training budget.
                                    Strengthen the ROI section with specific time-savings estimates and add a comparison
                                    to the cost of not training."
                                </div>
                            </div>

                            <div className="learn-pattern-card">
                                <h4 style={{ color: 'var(--accent-red)' }}>Missing Audience</h4>
                                <p>You don't specify who will read or use the output, so the AI picks a generic
                                tone and complexity level that may be wrong for your situation.</p>
                                <div className="learn-example-bad">
                                    "Explain how our onboarding process works."
                                </div>
                                <div className="learn-example-good">
                                    "Explain our 90-day onboarding process for a new HR coordinator who'll be running
                                    it. They know HR basics but haven't seen our specific workflow. Include the timeline
                                    and who to contact at each stage."
                                </div>
                            </div>
                        </div>
                    </AccordionSection>

                    <AccordionSection title="🚫 Common Mistakes">
                        <div className="learn-patterns-grid" style={{ marginBottom: '24px' }}>
                            <div className="learn-pattern-card">
                                <div className="learn-pattern-label avoid">Mistake</div>
                                <p>Dumping every piece of information you have into the prompt. More context is not always
                                better — irrelevant details bury the important ones.</p>
                                <div className="learn-pattern-label better">Instead</div>
                                <div className="learn-example-good">
                                    Match context depth to task complexity. A quick question needs 1-2 sentences of
                                    background. A multi-step project needs a full briefing. Ask yourself: "Would a
                                    smart colleague need this detail to help me?"
                                </div>
                            </div>
                            <div className="learn-pattern-card">
                                <div className="learn-pattern-label avoid">Mistake</div>
                                <p>Analyzing only conversations that went badly. You learn just as much from
                                conversations that went well — those reveal context you already provide reliably.</p>
                                <div className="learn-pattern-label better">Instead</div>
                                <div className="learn-example-good">
                                    Analyze a mix of good and bad conversations. Your strengths are habits worth
                                    keeping. Your gaps are habits worth building.
                                </div>
                            </div>
                            <div className="learn-pattern-card">
                                <div className="learn-pattern-label avoid">Mistake</div>
                                <p>Treating the analysis as a one-time exercise. Context habits change as your
                                work changes — new projects bring new gaps.</p>
                                <div className="learn-pattern-label better">Instead</div>
                                <div className="learn-example-good">
                                    Analyze 2-3 conversations per week for the first month. After that, check in
                                    whenever you start a new type of work or notice AI outputs declining in quality.
                                </div>
                            </div>
                        </div>
                    </AccordionSection>

                </div>
            )}

            {activeTab === 'analysis' && !analysis && (
                <div className="card">
                    <h2 style={{marginBottom: '16px'}}>Analyze Conversation</h2>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                            Paste your AI conversation below, or load an example to try it out.
                        </p>
                        <ExamplesDropdown
                            endpoint="/lesson1/examples"
                            onSelect={(example) => setConverterInput(example.raw_transcript)}
                        />
                    </div>
                    <textarea
                        value={converterInput}
                        onChange={(e) => setConverterInput(e.target.value)}
                        placeholder={`Paste your AI conversation here — or load an example above.\n\nCommon formats are auto-detected:\nYou: ...\nAI: ...\n\nHuman: ...\nAssistant: ...`}
                        style={{ minHeight: '280px', fontFamily: 'monospace', fontSize: '12px' }}
                    />
                    <div style={{ display: 'flex', gap: '10px', marginTop: '12px', alignItems: 'center' }}>
                        <button
                            className="btn btn-primary"
                            onClick={analyzeConverted}
                            disabled={!converterInput.trim() || loading}
                        >
                            {loading ? 'Analyzing...' : 'Analyze'}
                        </button>
                        {loading && <div className="loading"><div className="spinner"></div>Analyzing with Claude...</div>}
                    </div>
                </div>
            )}

            {activeTab === 'analysis' && analysis && (
                <div>
                    <div className="badge badge-purple" style={{marginBottom: '20px', fontSize: '14px', padding: '8px 16px'}}>
                        {analysis.analysis.topic}
                    </div>

                    <div className="analysis-grid">
                        <div className="analysis-card">
                            <h3>Coaching</h3>
                            <div className="field">
                                <div className="field-label">Context That Would Have Helped</div>
                                <div className="field-value">{analysis.analysis.coaching.context_that_would_have_helped}</div>
                            </div>
                            <div className="field">
                                <div className="field-label">Habit to Build</div>
                                <div className="field-value">{analysis.analysis.coaching.habit_to_build}</div>
                            </div>
                            <div className="field">
                                <div className="field-label">Improved Prompt</div>
                                <div className="prompt-rewrite">{analysis.analysis.coaching.prompt_rewrite}</div>
                            </div>
                        </div>

                        <div className="analysis-card">
                            <h3>Pattern</h3>
                            <div className="field">
                                <div className="field-label">Category</div>
                                <div className="field-value">{analysis.analysis.pattern.category}</div>
                            </div>
                            <div className="field">
                                <div className="field-label">Insight</div>
                                <div className="field-value">{analysis.analysis.pattern.insight}</div>
                            </div>
                        </div>

                        <div className="analysis-card">
                            <h3>Context Provided</h3>
                            <div className="field">
                                <div className="field-label">Details</div>
                                <div className="field-value">{analysis.analysis.context_provided.details}</div>
                            </div>
                            <div className="field">
                                <div className="field-label">What Worked</div>
                                <div className="field-value">{analysis.analysis.context_provided.what_worked}</div>
                            </div>
                        </div>

                        <div className="analysis-card">
                            <h3>Context Added Later</h3>
                            <div className="field">
                                <div className="field-label">Details</div>
                                <div className="field-value">{analysis.analysis.context_added_later.details}</div>
                            </div>
                            <div className="field">
                                <div className="field-label">Triggers</div>
                                <div className="field-value">{analysis.analysis.context_added_later.triggers}</div>
                            </div>
                            <div className="field">
                                <div className="field-label">Could Have Been Upfront</div>
                                <div className="field-value">{analysis.analysis.context_added_later.could_have_been_upfront ? 'Yes' : 'No'}</div>
                            </div>
                        </div>

                        <div className="analysis-card">
                            <h3>Assumptions Made</h3>
                            <div className="field">
                                <div className="field-label">Details</div>
                                <div className="field-value">{analysis.analysis.assumptions_wrong.details}</div>
                            </div>
                            <div className="field">
                                <div className="field-label">Why Assumed</div>
                                <div className="field-value">{analysis.analysis.assumptions_wrong.why_assumed}</div>
                            </div>
                            <div className="field">
                                <div className="field-label">User Contributed</div>
                                <div className="field-value">{analysis.analysis.assumptions_wrong.user_contributed}</div>
                            </div>
                        </div>

                        {analysis.analysis.context_score && (
                            <div className="analysis-card">
                                <h3>Context Score</h3>
                                <div className="field">
                                    <div className="context-score-bar-wrap">
                                        <span className="context-score-fraction">{analysis.analysis.context_score.score}/8</span>
                                        <div className="context-score-bar">
                                            <div className="context-score-bar-fill" style={{ width: `${(analysis.analysis.context_score.score / 8) * 100}%` }} />
                                        </div>
                                    </div>
                                </div>
                                {analysis.analysis.context_score.elements_present.length > 0 && (
                                    <div className="field">
                                        <div className="field-label">Provided upfront ✓</div>
                                        <ul className="context-score-list context-score-list--present">
                                            {analysis.analysis.context_score.elements_present.map((el, i) => <li key={i}>{el}</li>)}
                                        </ul>
                                    </div>
                                )}
                                {analysis.analysis.context_score.elements_missing.length > 0 && (
                                    <div className="field">
                                        <div className="field-label">Missing from first message</div>
                                        <ul className="context-score-list context-score-list--missing">
                                            {analysis.analysis.context_score.elements_missing.map((el, i) => <li key={i}>{el}</li>)}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="analysis-card">
                            <h3>Confidence</h3>
                            <div className="field">
                                <span className={`score ${getScoreClass(analysis.analysis.confidence.score)}`}>
                                    {analysis.analysis.confidence.score}/10
                                </span>
                            </div>
                            <div className="field">
                                <div className="field-label">Reasoning</div>
                                <div className="field-value">{analysis.analysis.confidence.reasoning}</div>
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{marginTop: '24px'}}>
                        <h2 style={{marginBottom: '16px'}}>Your Edits (Optional)</h2>
                        <div className="form-group">
                            <label>Topic</label>
                            <input
                                type="text"
                                value={userEdits.topic}
                                onChange={(e) => setUserEdits({...userEdits, topic: e.target.value})}
                            />
                        </div>
                        <div className="form-group">
                            <label>Pattern Category</label>
                            <input
                                type="text"
                                value={userEdits.pattern_category}
                                onChange={(e) => setUserEdits({...userEdits, pattern_category: e.target.value})}
                            />
                        </div>
                        <div className="form-group">
                            <label>Habit to Build</label>
                            <input
                                type="text"
                                value={userEdits.habit_to_build}
                                onChange={(e) => setUserEdits({...userEdits, habit_to_build: e.target.value})}
                            />
                        </div>
                        <div className="form-group">
                            <label>Notes</label>
                            <textarea
                                value={userEdits.notes}
                                onChange={(e) => setUserEdits({...userEdits, notes: e.target.value})}
                                placeholder="Any additional notes..."
                                style={{minHeight: '80px'}}
                            />
                        </div>
                        <div style={{display: 'flex', gap: '12px'}}>
                            <button className="btn btn-primary" onClick={saveEdits}>Confirm & Save</button>
                            <button className="btn btn-secondary" onClick={() => { setAnalysis(null); setConverterInput(''); setConverterOutput(''); setConverterStats(null); }}>
                                Analyze Another
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'history' && (
                conversations.length === 0 ? (
                    <div className="learn-next-step">
                        <h3>No conversations analyzed yet</h3>
                        <p>Paste a real AI conversation into the Analysis tab. Your results will appear here as you build up a history, and patterns will emerge over time.</p>
                        <button
                            className="btn btn-primary"
                            onClick={() => { setActiveTab('analysis'); setAnalysis(null); }}
                        >
                            Go to Analysis
                        </button>
                    </div>
                ) : (
                    <div className="history-layout">

                        {/* Left column — list + summary */}
                        <div className="history-left">

                            <div className="history-list">
                                {conversations.map(conv => (
                                    <div
                                        key={conv.id}
                                        className={`history-list-item ${selectedConversation?.id === conv.id ? 'history-list-item--active' : ''}`}
                                        onClick={() => loadConversation(conv.id)}
                                    >
                                        <div className="history-list-item-header">
                                            <span className="history-list-item-topic">{conv.topic}</span>
                                            {conv.context_score != null
                                                ? <span className="context-score-chip">{conv.context_score}/8</span>
                                                : <span className={`score ${getScoreClass(conv.confidence_score)}`}>{conv.confidence_score}</span>
                                            }
                                        </div>
                                        <div className="history-list-item-meta">
                                            <span>{conv.pattern_category}</span>
                                            <span>{formatDate(conv.created_at)}</span>
                                        </div>
                                        <button
                                            className="history-list-item-delete"
                                            onClick={(e) => deleteConversation(conv.id, e)}
                                            title="Delete"
                                        >✕</button>
                                    </div>
                                ))}
                            </div>

                            {stats && Object.keys(stats.count_by_category).length > 0 && (
                                <div className="card" style={{ marginTop: 'var(--space-lg)' }}>
                                    <h3 style={{ marginBottom: '12px', fontSize: '13px' }}>Patterns by Category</h3>
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                        {Object.entries(stats.count_by_category)
                                            .sort((a, b) => b[1] - a[1])
                                            .map(([category, count]) => (
                                                <li key={category} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border-color)', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                                    <span>{category}</span>
                                                    <span className="badge badge-blue">{count}</span>
                                                </li>
                                            ))}
                                    </ul>
                                </div>
                            )}

                            {insights?.context_gaps?.length > 0 && (
                                <div className="card" style={{ marginTop: 'var(--space-md)' }}>
                                    <h3 style={{ color: 'var(--accent-red)', marginBottom: '10px', fontSize: '13px' }}>Recurring Gaps</h3>
                                    {insights.context_gaps.map((item, i) => (
                                        <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid var(--border-color)', fontSize: '12px' }}>
                                            <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{item.gap}</div>
                                            <div style={{ color: 'var(--text-muted)' }}>{item.count}x · {item.percentage}%</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {insights?.context_strengths?.length > 0 && (
                                <div className="card" style={{ marginTop: 'var(--space-md)' }}>
                                    <h3 style={{ color: 'var(--accent-green)', marginBottom: '10px', fontSize: '13px' }}>Recurring Strengths</h3>
                                    {insights.context_strengths.map((item, i) => (
                                        <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid var(--border-color)', fontSize: '12px' }}>
                                            <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{item.strength}</div>
                                            <div style={{ color: 'var(--text-muted)' }}>{item.count}x · {item.percentage}%</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Right column — detail */}
                        <div className="history-right">
                            {!selectedConversation ? (
                                <div className="history-empty-detail">
                                    <p>Select a conversation from the list to see its full analysis.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="badge badge-purple" style={{ marginBottom: '16px', fontSize: '13px', padding: '6px 14px' }}>
                                        {selectedConversation.analysis.topic}
                                    </div>

                                    <div className="analysis-grid">
                                        <div className="analysis-card">
                                            <h3>Coaching</h3>
                                            <div className="field">
                                                <div className="field-label">Context That Would Have Helped</div>
                                                <div className="field-value">{selectedConversation.analysis.coaching.context_that_would_have_helped}</div>
                                            </div>
                                            <div className="field">
                                                <div className="field-label">Habit to Build</div>
                                                <div className="field-value">{selectedConversation.analysis.coaching.habit_to_build}</div>
                                            </div>
                                            <div className="field">
                                                <div className="field-label">Improved Prompt</div>
                                                <div className="prompt-rewrite">{selectedConversation.analysis.coaching.prompt_rewrite}</div>
                                            </div>
                                        </div>

                                        <div className="analysis-card">
                                            <h3>Pattern</h3>
                                            <div className="field">
                                                <div className="field-label">Category</div>
                                                <div className="field-value">{selectedConversation.analysis.pattern.category}</div>
                                            </div>
                                            <div className="field">
                                                <div className="field-label">Insight</div>
                                                <div className="field-value">{selectedConversation.analysis.pattern.insight}</div>
                                            </div>
                                        </div>

                                        <div className="analysis-card">
                                            <h3>Context Provided</h3>
                                            <div className="field">
                                                <div className="field-label">Details</div>
                                                <div className="field-value">{selectedConversation.analysis.context_provided.details}</div>
                                            </div>
                                            <div className="field">
                                                <div className="field-label">What Worked</div>
                                                <div className="field-value">{selectedConversation.analysis.context_provided.what_worked}</div>
                                            </div>
                                        </div>

                                        <div className="analysis-card">
                                            <h3>Context Added Later</h3>
                                            <div className="field">
                                                <div className="field-label">Details</div>
                                                <div className="field-value">{selectedConversation.analysis.context_added_later.details}</div>
                                            </div>
                                            <div className="field">
                                                <div className="field-label">Triggers</div>
                                                <div className="field-value">{selectedConversation.analysis.context_added_later.triggers}</div>
                                            </div>
                                        </div>

                                        <div className="analysis-card">
                                            <h3>Assumptions Made</h3>
                                            <div className="field">
                                                <div className="field-label">Details</div>
                                                <div className="field-value">{selectedConversation.analysis.assumptions_wrong.details}</div>
                                            </div>
                                            <div className="field">
                                                <div className="field-label">Why Assumed</div>
                                                <div className="field-value">{selectedConversation.analysis.assumptions_wrong.why_assumed}</div>
                                            </div>
                                        </div>

                                        {selectedConversation.analysis.context_score && (
                                            <div className="analysis-card">
                                                <h3>Context Score</h3>
                                                <div className="field">
                                                    <div className="context-score-bar-wrap">
                                                        <span className="context-score-fraction">{selectedConversation.analysis.context_score.score}/8</span>
                                                        <div className="context-score-bar">
                                                            <div className="context-score-bar-fill" style={{ width: `${(selectedConversation.analysis.context_score.score / 8) * 100}%` }} />
                                                        </div>
                                                    </div>
                                                </div>
                                                {selectedConversation.analysis.context_score.elements_present.length > 0 && (
                                                    <div className="field">
                                                        <div className="field-label">Provided upfront ✓</div>
                                                        <ul className="context-score-list context-score-list--present">
                                                            {selectedConversation.analysis.context_score.elements_present.map((el, i) => <li key={i}>{el}</li>)}
                                                        </ul>
                                                    </div>
                                                )}
                                                {selectedConversation.analysis.context_score.elements_missing.length > 0 && (
                                                    <div className="field">
                                                        <div className="field-label">Missing from first message</div>
                                                        <ul className="context-score-list context-score-list--missing">
                                                            {selectedConversation.analysis.context_score.elements_missing.map((el, i) => <li key={i}>{el}</li>)}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="analysis-card">
                                            <h3>Confidence</h3>
                                            <div className="field">
                                                <span className={`score ${getScoreClass(selectedConversation.analysis.confidence.score)}`}>
                                                    {selectedConversation.analysis.confidence.score}/10
                                                </span>
                                            </div>
                                            <div className="field">
                                                <div className="field-label">Reasoning</div>
                                                <div className="field-value">{selectedConversation.analysis.confidence.reasoning}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="card" style={{ marginTop: '16px' }}>
                                        <h3 style={{ marginBottom: '12px' }}>Original Transcript</h3>
                                        <pre style={{ whiteSpace: 'pre-wrap', color: 'var(--text-muted)', fontSize: '12px', background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '6px' }}>
                                            {selectedConversation.raw_transcript}
                                        </pre>
                                    </div>
                                </>
                            )}
                        </div>

                    </div>
                )
            )}

        </div>
    );
}
