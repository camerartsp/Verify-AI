const { truncateText, formatExplanation } = require('./script.js');

describe('truncateText', () => {
    test('should not truncate text shorter than maxLength', () => {
        expect(truncateText('hello', 10)).toBe('hello');
    });

    test('should truncate text longer than maxLength and add ellipsis', () => {
        expect(truncateText('hello world', 5)).toBe('hello...');
    });

    test('should return text as is if equal to maxLength', () => {
        expect(truncateText('hello', 5)).toBe('hello');
    });

    test('should return empty string for empty input text', () => {
        expect(truncateText('', 10)).toBe('');
    });

    test('should handle zero maxLength correctly', () => {
        expect(truncateText('hello', 0)).toBe('...');
    });
});

describe('formatExplanation', () => {
    test('should return default message for null or undefined text', () => {
        expect(formatExplanation(null)).toBe('<p>Nenhuma explicação disponível.</p>');
        expect(formatExplanation(undefined)).toBe('<p>Nenhuma explicação disponível.</p>');
    });

    test('should return default message for empty text string', () => {
        expect(formatExplanation('')).toBe('<p>Nenhuma explicação disponível.</p>'); // Current behavior, might be better to return empty string or <p></p>
    });

    test('should wrap plain text in a paragraph', () => {
        expect(formatExplanation('Simple explanation.')).toBe('<p class="mb-3">Simple explanation.</p>');
    });

    test('should handle multiple plain text lines as multiple paragraphs', () => {
        expect(formatExplanation('Line 1.\nLine 2.')).toBe('<p class="mb-3">Line 1.</p><p class="mb-3">Line 2.</p>');
    });

    test('should convert "# " to h1 tag', () => {
        expect(formatExplanation('# Main Heading')).toBe('<h1 class="text-2xl font-bold mb-4">Main Heading</h1>');
    });

    test('should convert "## " to h2 tag', () => {
        expect(formatExplanation('## Sub Heading')).toBe('<h2 class="text-xl font-semibold mb-3">Sub Heading</h2>');
    });

    test('should convert "- " to list items within a ul', () => {
        const input = '- Item 1\n- Item 2\n- Item 3';
        const expectedOutput = '<ul class="list-disc pl-5 mb-3"><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>';
        expect(formatExplanation(input)).toBe(expectedOutput);
    });

    test('should handle mixed content: headings, paragraphs, and lists', () => {
        const input = '# Title\nSome introductory text.\n## Subtitle\n- Point 1\n- Point 2\nAnother paragraph.';
        const expectedOutput =
            '<h1 class="text-2xl font-bold mb-4">Title</h1>' +
            '<p class="mb-3">Some introductory text.</p>' +
            '<h2 class="text-xl font-semibold mb-3">Subtitle</h2>' +
            '<ul class="list-disc pl-5 mb-3"><li>Point 1</li><li>Point 2</li></ul>' +
            '<p class="mb-3">Another paragraph.</p>';
        expect(formatExplanation(input)).toBe(expectedOutput);
    });

    test('should correctly close ul tag if list is at the end', () => {
        const input = 'Some text\n- Final item';
        const expectedOutput = '<p class="mb-3">Some text</p><ul class="list-disc pl-5 mb-3"><li>Final item</li></ul>';
        expect(formatExplanation(input)).toBe(expectedOutput);
    });

    test('should handle lines with only whitespace correctly (treated as empty lines, not creating empty <p>)', () => {
        expect(formatExplanation('Line A\n   \nLine B')).toBe('<p class="mb-3">Line A</p><p class="mb-3">Line B</p>');
    });
});
