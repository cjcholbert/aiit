/**
 * Export utilities for templates and data
 * Supports Markdown (for Notion/Obsidian) and JSON formats
 */

// Download helper
const downloadFile = (content, filename, contentType) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

// Sanitize filename
const sanitizeFilename = (name) => {
    return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
};

// Get current date string
const getDateString = () => {
    return new Date().toISOString().split('T')[0];
};

/**
 * Export a single template to Markdown
 */
export const exportTemplateToMarkdown = (template) => {
    const variables = template.variables || [];
    const tags = template.tags || [];

    let md = `# ${template.name}\n\n`;
    md += `**Category:** ${template.category}\n`;
    md += `**Created:** ${new Date(template.created_at).toLocaleDateString()}\n`;

    if (template.description) {
        md += `\n## Description\n\n${template.description}\n`;
    }

    md += `\n## Template Content\n\n\`\`\`\n${template.content}\n\`\`\`\n`;

    if (variables.length > 0) {
        md += `\n## Variables\n\n`;
        md += `| Name | Description | Default | Required |\n`;
        md += `|------|-------------|---------|----------|\n`;
        variables.forEach(v => {
            md += `| \`{{${v.name}}}\` | ${v.description || '-'} | ${v.default || '-'} | ${v.required ? 'Yes' : 'No'} |\n`;
        });
    }

    if (tags.length > 0) {
        md += `\n## Tags\n\n${tags.map(t => `\`${t}\``).join(' ')}\n`;
    }

    md += `\n---\n*Exported from The AI Collaborator on ${getDateString()}*\n`;

    const filename = `template_${sanitizeFilename(template.name)}_${getDateString()}.md`;
    downloadFile(md, filename, 'text/markdown');
};

/**
 * Export a single template to JSON
 */
export const exportTemplateToJSON = (template) => {
    const exportData = {
        name: template.name,
        category: template.category,
        description: template.description,
        content: template.content,
        variables: template.variables || [],
        tags: template.tags || [],
        exported_at: new Date().toISOString(),
        source: 'The AI Collaborator'
    };

    const filename = `template_${sanitizeFilename(template.name)}_${getDateString()}.json`;
    downloadFile(JSON.stringify(exportData, null, 2), filename, 'application/json');
};

/**
 * Export multiple templates to a single Markdown file
 */
export const exportAllTemplatesToMarkdown = (templates) => {
    let md = `# AI Collaboration Templates\n\n`;
    md += `*Exported from The AI Collaborator on ${getDateString()}*\n\n`;
    md += `---\n\n`;

    // Group by category
    const byCategory = templates.reduce((acc, t) => {
        const cat = t.category || 'Uncategorized';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(t);
        return acc;
    }, {});

    Object.entries(byCategory).forEach(([category, categoryTemplates]) => {
        md += `## ${category}\n\n`;

        categoryTemplates.forEach(template => {
            md += `### ${template.name}\n\n`;

            if (template.description) {
                md += `${template.description}\n\n`;
            }

            md += `\`\`\`\n${template.content}\n\`\`\`\n\n`;

            const variables = template.variables || [];
            if (variables.length > 0) {
                md += `**Variables:** ${variables.map(v => `\`{{${v.name}}}\``).join(', ')}\n\n`;
            }

            md += `---\n\n`;
        });
    });

    const filename = `all_templates_${getDateString()}.md`;
    downloadFile(md, filename, 'text/markdown');
};

/**
 * Export multiple templates to JSON
 */
export const exportAllTemplatesToJSON = (templates) => {
    const exportData = {
        templates: templates.map(t => ({
            name: t.name,
            category: t.category,
            description: t.description,
            content: t.content,
            variables: t.variables || [],
            tags: t.tags || []
        })),
        exported_at: new Date().toISOString(),
        count: templates.length,
        source: 'The AI Collaborator'
    };

    const filename = `all_templates_${getDateString()}.json`;
    downloadFile(JSON.stringify(exportData, null, 2), filename, 'application/json');
};

/**
 * Export reference card to Markdown (for Obsidian/Notion)
 */
export const exportReferenceCardToMarkdown = (card) => {
    let md = `# ${card.name || 'My AI Reference Card'}\n\n`;
    md += `*Personal AI collaboration guide - Exported ${getDateString()}*\n\n`;

    if (card.top_templates?.length > 0) {
        md += `## Top Templates\n\n`;
        card.top_templates.forEach((t, i) => {
            md += `${i + 1}. **${t.name}** - ${t.description || t.category}\n`;
        });
        md += `\n`;
    }

    if (card.trust_zones?.length > 0) {
        md += `## Trust Zones\n\n`;
        card.trust_zones.forEach(zone => {
            const emoji = zone.trust === 'high' ? '[OK]' : zone.trust === 'low' ? '[!!]' : '[?]';
            md += `- ${emoji} **${zone.name}**: ${zone.trust} trust\n`;
        });
        md += `\n`;
    }

    if (card.verification_shortcuts?.length > 0) {
        md += `## Verification Shortcuts\n\n`;
        card.verification_shortcuts.forEach(v => {
            md += `- [ ] ${v}\n`;
        });
        md += `\n`;
    }

    if (card.personal_rules?.length > 0) {
        md += `## Personal Rules\n\n`;
        card.personal_rules.forEach((rule, i) => {
            md += `${i + 1}. ${rule}\n`;
        });
        md += `\n`;
    }

    if (card.quick_prompts?.length > 0) {
        md += `## Quick Prompts\n\n`;
        card.quick_prompts.forEach(p => {
            md += `### ${p.name}\n\`\`\`\n${p.prompt}\n\`\`\`\n\n`;
        });
    }

    md += `---\n*Generated by The AI Collaborator*\n`;

    const filename = `reference_card_${getDateString()}.md`;
    downloadFile(md, filename, 'text/markdown');
};

/**
 * Export frontier zones to Markdown
 */
export const exportFrontierMapToMarkdown = (zones, encounters) => {
    let md = `# AI Frontier Map\n\n`;
    md += `*My personal map of AI capabilities - ${getDateString()}*\n\n`;

    const byReliability = {
        reliable: zones.filter(z => z.reliability === 'reliable'),
        mixed: zones.filter(z => z.reliability === 'mixed'),
        unreliable: zones.filter(z => z.reliability === 'unreliable')
    };

    if (byReliability.reliable.length > 0) {
        md += `## [OK] Reliable Zones\n\n`;
        byReliability.reliable.forEach(z => {
            md += `### ${z.name}\n`;
            md += `*Category: ${z.category}*\n\n`;
            if (z.strengths?.length > 0) {
                md += `**Strengths:** ${z.strengths.join(', ')}\n\n`;
            }
        });
    }

    if (byReliability.mixed.length > 0) {
        md += `## [?] Mixed Zones\n\n`;
        byReliability.mixed.forEach(z => {
            md += `### ${z.name}\n`;
            md += `*Category: ${z.category}*\n\n`;
            if (z.verification_needs) {
                md += `**Verify:** ${z.verification_needs}\n\n`;
            }
        });
    }

    if (byReliability.unreliable.length > 0) {
        md += `## [!!] Unreliable Zones\n\n`;
        byReliability.unreliable.forEach(z => {
            md += `### ${z.name}\n`;
            md += `*Category: ${z.category}*\n\n`;
            if (z.weaknesses?.length > 0) {
                md += `**Weaknesses:** ${z.weaknesses.join(', ')}\n\n`;
            }
        });
    }

    md += `---\n*Exported from The AI Collaborator*\n`;

    const filename = `frontier_map_${getDateString()}.md`;
    downloadFile(md, filename, 'text/markdown');
};
