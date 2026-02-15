import { useState, useEffect, useRef } from 'react';
import { useApi } from '../hooks/useApi';
import SelfAssessmentChecklist from '../components/SelfAssessmentChecklist';
import { LESSON_CRITERIA } from '../config/assessmentCriteria';
import LessonNav from '../components/LessonNav';
import StatsPanel from '../components/StatsPanel';

export default function Lesson01() {
    const [activeTab, setActiveTab] = useState('learn');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [analysis, setAnalysis] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [stats, setStats] = useState(null);
    const [insights, setInsights] = useState(null);
    const [userEdits, setUserEdits] = useState({ topic: '', pattern_category: '', habit_to_build: '', notes: '' });
    const [inputMethod, setInputMethod] = useState('paste'); // 'paste' or 'upload'
    const fileInputRef = useRef(null);

    // Converter state
    const [converterInput, setConverterInput] = useState('');
    const [converterOutput, setConverterOutput] = useState('');
    const [converterStats, setConverterStats] = useState(null);
    const [converterError, setConverterError] = useState('');

    const api = useApi();

    useEffect(() => {
        loadStats();
        loadInsights();
    }, []);

    useEffect(() => {
        if (activeTab === 'history') {
            loadConversations();
        }
    }, [activeTab]);

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

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setLoading(true);
        setError('');
        setAnalysis(null);

        try {
            const data = await api.uploadFile('/lesson1/upload', file);
            setAnalysis(data);
            setUserEdits({
                topic: data.analysis.topic,
                pattern_category: data.analysis.pattern.category,
                habit_to_build: data.analysis.coaching.habit_to_build,
                notes: ''
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
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
        navigator.clipboard.writeText(converterOutput);
    };

    const analyzeConverted = async () => {
        if (!converterOutput) return;

        setLoading(true);
        setError('');
        setAnalysis(null);

        try {
            const data = JSON.parse(converterOutput);
            const formatted = data.messages.map(m =>
                `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
            ).join('\n\n');

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
            <div className="page-header">
                <h1 className="page-title">Context Pattern Tracker</h1>
                <p className="page-description">
                    <strong>The Problem:</strong> AI conversations fail when critical context is missing. You waste time
                    on back-and-forth clarifications or get unusable outputs because you forgot to mention key constraints.
                </p>
                <p className="page-description" style={{ marginTop: '8px' }}>
                    <strong>The Skill:</strong> Identify your personal context gaps by analyzing past conversations.
                    Discover what information you consistently forget to provide so you can fix it upfront.
                </p>
                <SelfAssessmentChecklist lessonNumber={1} criteria={LESSON_CRITERIA[1]} />
            </div>

            <StatsPanel lessonId={1} stats={[
                { label: 'Conversations', value: stats?.total_conversations ?? '-', color: 'var(--accent-blue)' },
                { label: 'Avg Confidence', value: stats?.avg_confidence_score != null ? stats.avg_confidence_score.toFixed(1) : '-', color: 'var(--accent-green)' },
                { label: 'Recurring Gaps', value: insights?.context_gaps?.length ?? '-', color: 'var(--accent-yellow)' },
                { label: 'Context Strengths', value: insights?.context_strengths?.length ?? '-', color: 'var(--accent-purple)' },
            ]} />

            <div className="tabs">
                {['learn', 'analyze', 'history'].map((tab) => (
                    <button
                        key={tab}
                        className={`tab ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => {
                            setActiveTab(tab);
                            if (tab === 'analyze') { setAnalysis(null); setSelectedConversation(null); }
                            if (tab === 'history') { setSelectedConversation(null); }
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {/* Learn Tab */}
            {activeTab === 'learn' && (
                <div className="learn-section">
                    <h2>What Is Context in AI Interactions?</h2>
                    <div className="learn-intro">
                        <p>
                            Every time you talk to an AI, it starts with a blank slate. Unlike a coworker who
                            knows your project history, your preferences, and your constraints, AI has zero
                            implicit knowledge about your situation. <strong>Context</strong> is the background
                            information you provide that bridges this gap.
                        </p>
                        <p>
                            Context includes things like: what you're working on, who the audience is, what
                            constraints exist, what you've already tried, and what format you need. Without
                            these details, AI falls back on generic, one-size-fits-all responses.
                        </p>
                    </div>

                    <div className="learn-key-insight">
                        <p>
                            <strong>Key insight:</strong> The quality of AI output is directly proportional to the
                            quality of context you provide. Generic input produces generic output. Specific context
                            produces specific, useful results.
                        </p>
                    </div>

                    <h2>Common Context Gaps</h2>
                    <p className="page-description">
                        These are the patterns the Analyze tab identifies in your conversations. Learn to
                        spot them before they cost you iteration cycles.
                    </p>

                    <div className="learn-patterns-grid">
                        <div className="learn-pattern-card">
                            <h3>Missing Constraints</h3>
                            <p>
                                You describe what you want but leave out the boundaries: budget, timeline,
                                technical stack, word count, audience level, or platform requirements.
                            </p>
                            <div className="learn-pattern-label avoid">Example (Avoid)</div>
                            <div className="learn-example-bad">
                                "Write me a marketing email."
                            </div>
                            <div className="learn-pattern-label better">Better</div>
                            <div className="learn-example-good">
                                "Write a marketing email for our B2B SaaS product targeting IT managers. Keep it
                                under 200 words. Tone should be professional but not stiff."
                            </div>
                        </div>

                        <div className="learn-pattern-card">
                            <h3>Assumed Knowledge</h3>
                            <p>
                                You reference project details, acronyms, or prior decisions without explaining
                                them, assuming the AI knows what you know.
                            </p>
                            <div className="learn-pattern-label avoid">Example (Avoid)</div>
                            <div className="learn-example-bad">
                                "Update the TPS reports to match the new format from last week's meeting."
                            </div>
                            <div className="learn-pattern-label better">Better</div>
                            <div className="learn-example-good">
                                "Our weekly status reports need to change from paragraph format to bullet points
                                with three sections: Completed, In Progress, and Blocked. Each bullet should be
                                one sentence max."
                            </div>
                        </div>

                        <div className="learn-pattern-card">
                            <h3>Vague Goals</h3>
                            <p>
                                Your request lacks a clear success criteria. The AI can't tell what "good" looks
                                like because you haven't defined it.
                            </p>
                            <div className="learn-pattern-label avoid">Example (Avoid)</div>
                            <div className="learn-example-bad">
                                "Help me improve this document."
                            </div>
                            <div className="learn-pattern-label better">Better</div>
                            <div className="learn-example-good">
                                "This project proposal needs to convince our VP to approve $50K in budget. Strengthen
                                the ROI section with specific numbers and add a risk mitigation plan."
                            </div>
                        </div>

                        <div className="learn-pattern-card">
                            <h3>Missing Role / Audience</h3>
                            <p>
                                You don't specify who will read or use the output, so the AI picks a generic
                                tone and complexity level.
                            </p>
                            <div className="learn-pattern-label avoid">Example (Avoid)</div>
                            <div className="learn-example-bad">
                                "Explain how our API authentication works."
                            </div>
                            <div className="learn-pattern-label better">Better</div>
                            <div className="learn-example-good">
                                "Explain our OAuth2 API authentication flow for a junior developer who just joined
                                the team. They know HTTP basics but haven't worked with tokens before. Include a
                                step-by-step example."
                            </div>
                        </div>
                    </div>

                    {/* Before/After Comparisons */}
                    <div className="learn-comparison">
                        <h3>Before & After: Context in Action</h3>
                        <div className="learn-comparison-grid">
                            <div className="learn-comparison-col">
                                <h4 className="poor">Without Context (Generic Output)</h4>

                                <div className="learn-comparison-scenario">Scenario 1: Code Review</div>
                                <div className="learn-comparison-item poor">
                                    <p>"Review this code and tell me if it's good."</p>
                                </div>

                                <div className="learn-comparison-scenario">Scenario 2: Email Drafting</div>
                                <div className="learn-comparison-item poor">
                                    <p>"Write an email to my client about the project delay."</p>
                                </div>

                                <div className="learn-comparison-scenario">Scenario 3: Data Analysis</div>
                                <div className="learn-comparison-item poor">
                                    <p>"Look at this spreadsheet and give me insights."</p>
                                </div>
                            </div>

                            <div className="learn-comparison-col">
                                <h4 className="good">With Context (Targeted Output)</h4>

                                <div className="learn-comparison-scenario">Scenario 1: Code Review</div>
                                <div className="learn-comparison-item good">
                                    <p>
                                        "Review this Python function for SQL injection vulnerabilities. It handles
                                        user-submitted search queries in a Flask app connected to PostgreSQL. We use
                                        SQLAlchemy but this function uses raw SQL."
                                    </p>
                                </div>

                                <div className="learn-comparison-scenario">Scenario 2: Email Drafting</div>
                                <div className="learn-comparison-item good">
                                    <p>
                                        "Write an email to our client (the CFO of Acme Corp) explaining that the
                                        dashboard project is delayed 2 weeks because of an API vendor outage. We've
                                        already found a workaround. Tone: professional, reassuring, and brief. Include
                                        a revised timeline."
                                    </p>
                                </div>

                                <div className="learn-comparison-scenario">Scenario 3: Data Analysis</div>
                                <div className="learn-comparison-item good">
                                    <p>
                                        "Analyze Q4 sales data (attached CSV) for our SaaS product. I need to know:
                                        which region grew fastest, whether the enterprise tier is cannibalizing
                                        mid-market, and if our December promotion actually lifted revenue or just
                                        pulled forward January deals."
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CTA to Analyze tab */}
                    <div className="learn-next-step">
                        <h3>Ready to Find Your Context Gaps?</h3>
                        <p>
                            Paste a real AI conversation into the Analyze tab. The tool will identify which context
                            was missing and suggest specific improvements for next time.
                        </p>
                        <button
                            className="btn btn-primary"
                            onClick={() => { setActiveTab('analyze'); setAnalysis(null); }}
                        >
                            Go to Analyze
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'analyze' && !analysis && (
                <div className="card">
                    <h2 style={{marginBottom: '16px'}}>Analyze Conversation</h2>

                    {/* Input method toggle */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                        <button
                            className={`btn ${inputMethod === 'paste' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setInputMethod('paste')}
                            style={{ padding: '6px 16px', fontSize: '13px' }}
                        >
                            Paste Text
                        </button>
                        <button
                            className={`btn ${inputMethod === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setInputMethod('upload')}
                            style={{ padding: '6px 16px', fontSize: '13px' }}
                        >
                            Upload JSON
                        </button>
                    </div>

                    {inputMethod === 'paste' && (
                        <>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                                Paste your AI conversation below. Common formats like You:/AI:, Human:/Assistant: are auto-detected.
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Paste Conversation</label>
                                    <textarea
                                        value={converterInput}
                                        onChange={(e) => setConverterInput(e.target.value)}
                                        placeholder={`Paste your AI chat here...\n\nExample:\nYou: What is the capital of France?\nAI: The capital of France is Paris.`}
                                        style={{ minHeight: '250px', fontFamily: 'monospace', fontSize: '12px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Parsed Preview</label>
                                    <textarea
                                        value={converterOutput}
                                        readOnly
                                        placeholder="Parsed JSON will appear here..."
                                        style={{ minHeight: '250px', fontFamily: 'monospace', fontSize: '12px', background: 'var(--bg-tertiary)' }}
                                    />
                                </div>
                            </div>

                            {converterStats && (
                                <div style={{ marginTop: '8px', padding: '8px 12px', background: 'var(--success-bg)', borderRadius: '4px', fontSize: '12px', color: 'var(--accent-green)' }}>
                                    Parsed {converterStats.total} messages ({converterStats.user} user, {converterStats.assistant} assistant)
                                </div>
                            )}
                            {converterError && (
                                <div style={{ marginTop: '8px', padding: '8px 12px', background: 'var(--error-bg)', borderRadius: '4px', fontSize: '12px', color: 'var(--accent-red)' }}>
                                    {converterError}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '10px', marginTop: '16px', alignItems: 'center' }}>
                                <button className="btn btn-secondary" onClick={convertToJSON} disabled={!converterInput.trim()}>
                                    Parse
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={analyzeConverted}
                                    disabled={!converterOutput || loading}
                                >
                                    {loading ? 'Analyzing...' : 'Analyze'}
                                </button>
                                {loading && <div className="loading"><div className="spinner"></div>Analyzing with Claude...</div>}
                            </div>
                        </>
                    )}

                    {inputMethod === 'upload' && (
                        <>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                                Upload a JSON file with conversation messages. Expected format: <code style={{ background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '3px' }}>{"{ messages: [{role, content}, ...] }"}</code>
                            </p>

                            <div style={{ border: '2px dashed var(--border-color)', borderRadius: '8px', padding: '32px', textAlign: 'center' }}>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    accept=".json"
                                    style={{ display: 'none' }}
                                />
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={loading}
                                    style={{ padding: '12px 24px' }}
                                >
                                    {loading ? 'Uploading...' : 'Choose JSON File'}
                                </button>
                                <p style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                                    or drag and drop a .json file here
                                </p>
                            </div>

                            {loading && (
                                <div className="loading" style={{ marginTop: '16px' }}>
                                    <div className="spinner"></div>Uploading and analyzing with Claude...
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {activeTab === 'analyze' && analysis && (
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
                            <h3>Assumptions Wrong</h3>
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

            {activeTab === 'history' && !selectedConversation && (
                <div>
                    {/* Conversation History table */}
                    <div className="card" style={{ marginBottom: '24px' }}>
                        <h2 style={{marginBottom: '16px'}}>Conversation History</h2>
                        {conversations.length === 0 ? (
                            <p style={{color: 'var(--text-muted)'}}>No conversations yet. Analyze a transcript to get started.</p>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Topic</th>
                                        <th>Date</th>
                                        <th>Pattern</th>
                                        <th>Confidence</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {conversations.map(conv => (
                                        <tr key={conv.id} onClick={() => loadConversation(conv.id)} style={{cursor: 'pointer'}}>
                                            <td>{conv.topic}</td>
                                            <td>{formatDate(conv.created_at)}</td>
                                            <td>{conv.pattern_category}</td>
                                            <td><span className={`score ${getScoreClass(conv.confidence_score)}`}>{conv.confidence_score}</span></td>
                                            <td>
                                                <button className="btn btn-danger" onClick={(e) => deleteConversation(conv.id, e)}>
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Two-column grid: Patterns (left) + Insights (right) */}
                    <div className="analysis-grid" style={{ marginBottom: '24px' }}>
                        <div>
                            <div className="card" style={{ marginBottom: '16px' }}>
                                <h3 style={{marginBottom: '12px'}}>Patterns by Category</h3>
                                {!stats || Object.keys(stats.count_by_category).length === 0 ? (
                                    <p style={{color: 'var(--text-muted)'}}>No patterns recorded yet.</p>
                                ) : (
                                    <div>
                                        {Object.entries(stats.count_by_category)
                                            .sort((a, b) => b[1] - a[1])
                                            .map(([category, count]) => (
                                                <div key={category} style={{display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)'}}>
                                                    <span>{category}</span>
                                                    <span className="badge badge-blue">{count}</span>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>

                            <div className="card">
                                <h3 style={{marginBottom: '12px'}}>Common Habits to Build</h3>
                                {!stats || stats.common_habits.length === 0 ? (
                                    <p style={{color: 'var(--text-muted)'}}>No habits recorded yet.</p>
                                ) : (
                                    stats.common_habits.map((item, i) => (
                                        <div key={i} style={{display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)'}}>
                                            <span>{item.habit}</span>
                                            <span className="badge badge-green">{item.count}x</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div>
                            <div className="card" style={{ marginBottom: '16px' }}>
                                <h3 style={{ color: 'var(--accent-red)', marginBottom: '12px' }}>Context Gaps</h3>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '13px' }}>
                                    Things you frequently forget to mention upfront.
                                </p>
                                {!insights || insights.context_gaps?.length === 0 ? (
                                    <p style={{ color: 'var(--text-muted)' }}>No recurring gaps identified yet.</p>
                                ) : (
                                    insights.context_gaps?.map((item, i) => (
                                        <div
                                            key={i}
                                            style={{
                                                padding: '12px',
                                                background: 'var(--bg-tertiary)',
                                                borderRadius: '6px',
                                                marginBottom: '8px',
                                                borderLeft: '3px solid var(--accent-red)',
                                            }}
                                        >
                                            <div style={{ fontWeight: '500', marginBottom: '4px' }}>{item.gap}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                {item.count}x ({item.percentage}%)
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="card">
                                <h3 style={{ color: 'var(--accent-green)', marginBottom: '12px' }}>Context Strengths</h3>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '13px' }}>
                                    Things you consistently provide well.
                                </p>
                                {!insights || insights.context_strengths?.length === 0 ? (
                                    <p style={{ color: 'var(--text-muted)' }}>No recurring strengths identified yet.</p>
                                ) : (
                                    insights.context_strengths?.map((item, i) => (
                                        <div
                                            key={i}
                                            style={{
                                                padding: '12px',
                                                background: 'var(--bg-tertiary)',
                                                borderRadius: '6px',
                                                marginBottom: '8px',
                                                borderLeft: '3px solid var(--accent-green)',
                                            }}
                                        >
                                            <div style={{ fontWeight: '500', marginBottom: '4px' }}>{item.strength}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                {item.count}x ({item.percentage}%)
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Audit Summary table */}
                    <div className="card">
                        <h3 style={{ marginBottom: '16px' }}>Recent Audit Summary</h3>
                        {!insights || insights.audit_summary?.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)' }}>No conversations analyzed yet.</p>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Topic</th>
                                        <th>Pattern</th>
                                        <th>Gap Found</th>
                                        <th>Strength Found</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {insights.audit_summary?.map((entry) => (
                                        <tr key={entry.id}>
                                            <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {entry.topic}
                                            </td>
                                            <td>{entry.pattern}</td>
                                            <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--accent-red)' }}>
                                                {entry.gap || '-'}
                                            </td>
                                            <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--accent-green)' }}>
                                                {entry.strength || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'history' && selectedConversation && (
                <div>
                    <button className="btn btn-secondary" onClick={() => setSelectedConversation(null)} style={{marginBottom: '16px'}}>
                        Back to History
                    </button>
                    <div className="badge badge-purple" style={{marginBottom: '20px', fontSize: '14px', padding: '8px 16px'}}>
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
                            <h3>Assumptions Wrong</h3>
                            <div className="field">
                                <div className="field-label">Details</div>
                                <div className="field-value">{selectedConversation.analysis.assumptions_wrong.details}</div>
                            </div>
                            <div className="field">
                                <div className="field-label">Why Assumed</div>
                                <div className="field-value">{selectedConversation.analysis.assumptions_wrong.why_assumed}</div>
                            </div>
                        </div>

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

                    <div className="card" style={{marginTop: '24px'}}>
                        <h3 style={{marginBottom: '12px'}}>Original Transcript</h3>
                        <pre style={{whiteSpace: 'pre-wrap', color: 'var(--text-muted)', fontSize: '12px', background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '6px'}}>
                            {selectedConversation.raw_transcript}
                        </pre>
                    </div>
                </div>
            )}

            <LessonNav currentLesson={1} />
        </div>
    );
}
