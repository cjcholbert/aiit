"""Parse AI conversation transcripts from multiple formats."""
import re
from .schemas import Turn, ParsedTranscript


# User role markers (case-insensitive)
USER_MARKERS = [
    'you', 'user', 'human', 'me', 'person', 'customer', 'client'
]

# Assistant role markers (case-insensitive)
ASSISTANT_MARKERS = [
    'claude', 'assistant', 'chatgpt', 'gpt', 'gpt-4', 'gpt-3', 'gpt4', 'gpt3',
    'ai', 'bot', 'copilot', 'gemini', 'bard', 'llama', 'mistral', 'anthropic',
    'openai', 'perplexity', 'pi', 'character', 'model', 'system'
]


def _build_marker_pattern():
    """Build regex pattern for all supported markers."""
    all_markers = USER_MARKERS + ASSISTANT_MARKERS
    escaped = [re.escape(m) for m in all_markers]
    return '|'.join(escaped)


def detect_format(text: str) -> str:
    """
    Detect the conversation format.

    Returns one of:
    - 'standalone': Markers on their own line
    - 'colon': Markers with colon
    - 'colon_newline': Markers with colon then newline
    - 'unknown': No clear format detected
    """
    marker_pattern = _build_marker_pattern()

    colon_inline = re.compile(
        rf'^({marker_pattern})\s*:\s*\S',
        re.MULTILINE | re.IGNORECASE
    )

    colon_newline = re.compile(
        rf'^({marker_pattern})\s*:\s*$',
        re.MULTILINE | re.IGNORECASE
    )

    standalone = re.compile(
        rf'^({marker_pattern})\s*$',
        re.MULTILINE | re.IGNORECASE
    )

    colon_inline_matches = len(colon_inline.findall(text))
    colon_newline_matches = len(colon_newline.findall(text))
    standalone_matches = len(standalone.findall(text))

    if colon_inline_matches >= max(colon_newline_matches, standalone_matches) and colon_inline_matches > 0:
        return 'colon'
    elif colon_newline_matches >= standalone_matches and colon_newline_matches > 0:
        return 'colon_newline'
    elif standalone_matches > 0:
        return 'standalone'
    else:
        return 'unknown'


def _classify_role(marker: str) -> str:
    """Classify a marker as 'user' or 'assistant'."""
    marker_lower = marker.lower().strip()

    if marker_lower in USER_MARKERS:
        return 'user'
    elif marker_lower in ASSISTANT_MARKERS:
        return 'assistant'
    else:
        return 'assistant'


def parse_standalone_format(text: str) -> list[Turn]:
    """Parse format where markers are on their own line."""
    marker_pattern = _build_marker_pattern()
    pattern = re.compile(
        rf'^({marker_pattern})\s*$',
        re.MULTILINE | re.IGNORECASE
    )

    markers = list(pattern.finditer(text))
    if not markers:
        return []

    turns = []
    for i, match in enumerate(markers):
        role = _classify_role(match.group(1))
        content_start = match.end()
        content_end = markers[i + 1].start() if i + 1 < len(markers) else len(text)
        content = text[content_start:content_end].strip()

        if content:
            turns.append(Turn(role=role, content=content))

    return turns


def parse_colon_format(text: str) -> list[Turn]:
    """Parse format where markers have colons."""
    marker_pattern = _build_marker_pattern()

    pattern = re.compile(
        rf'^({marker_pattern})\s*:',
        re.MULTILINE | re.IGNORECASE
    )

    markers = list(pattern.finditer(text))
    if not markers:
        return []

    turns = []
    for i, match in enumerate(markers):
        role = _classify_role(match.group(1))
        content_start = match.end()
        content_end = markers[i + 1].start() if i + 1 < len(markers) else len(text)
        content = text[content_start:content_end].strip()

        if content:
            turns.append(Turn(role=role, content=content))

    return turns


def parse_alternating_blocks(text: str) -> list[Turn]:
    """Fallback parser: Split on double newlines and alternate user/assistant."""
    blocks = re.split(r'\n\s*\n', text.strip())
    blocks = [b.strip() for b in blocks if b.strip()]

    if len(blocks) < 2:
        return []

    turns = []
    for i, block in enumerate(blocks):
        role = 'user' if i % 2 == 0 else 'assistant'
        turns.append(Turn(role=role, content=block))

    return turns


def parse_transcript(raw_text: str) -> ParsedTranscript:
    """
    Parse a conversation transcript from any supported AI chat format.
    """
    if not raw_text or not raw_text.strip():
        return ParsedTranscript(turns=[])

    text = raw_text.replace('\r\n', '\n').replace('\r', '\n')
    fmt = detect_format(text)

    if fmt == 'standalone':
        turns = parse_standalone_format(text)
    elif fmt in ('colon', 'colon_newline'):
        turns = parse_colon_format(text)
    else:
        turns = parse_colon_format(text)
        if len(turns) < 2:
            turns = parse_standalone_format(text)
        if len(turns) < 2:
            turns = parse_alternating_blocks(text)

    return ParsedTranscript(turns=turns)


def validate_transcript(parsed: ParsedTranscript) -> tuple[bool, str]:
    """Validate a parsed transcript. Returns (is_valid, error_message)."""
    if not parsed.turns:
        return False, "No conversation turns found."

    if len(parsed.turns) < 2:
        return False, "Conversation needs at least one exchange (user + assistant)."

    has_user = any(t.role == "user" for t in parsed.turns)
    has_assistant = any(t.role == "assistant" for t in parsed.turns)

    if not has_user:
        return False, "No user messages found."

    if not has_assistant:
        return False, "No assistant messages found."

    return True, ""
