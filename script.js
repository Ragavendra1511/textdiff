// <script> tag removed for JS file context
        let comparisonData = {
            textChanges: 0,
            formatChanges: 0,
            totalChanges: 0,
            formattingDifferences: []
        };

        function formatText(command, textId) {
            const element = document.getElementById(textId);
            element.focus();
            document.execCommand(command, false, null);
        }

        function insertTable(textId) {
            const element = document.getElementById(textId);
            const tableHTML = `
                <table border="1" style="border-collapse: collapse; margin: 10px 0;">
                    <tr>
                        <th style="padding: 8px; background: #f0f0f0;">Header 1</th>
                        <th style="padding: 8px; background: #f0f0f0;">Header 2</th>
                    </tr>
                    <tr>
                        <td style="padding: 8px;">Cell 1</td>
                        <td style="padding: 8px;">Cell 2</td>
                    </tr>
                </table>
            `;
            element.focus();
            document.execCommand('insertHTML', false, tableHTML);
        }

        function clearFormatting(textId) {
            const element = document.getElementById(textId);
            element.focus();
            document.execCommand('removeFormat', false, null);
        }

        function clearAll() {
            document.getElementById('text1').innerHTML = '';
            document.getElementById('text2').innerHTML = '';
            document.getElementById('results').style.display = 'none';
            comparisonData = {
                textChanges: 0,
                formatChanges: 0,
                totalChanges: 0,
                formattingDifferences: []
            };
        }

        function extractTextAndFormatting(element) {
            const html = element.innerHTML;
            const text = element.innerText;
            
            // Extract formatting information
            const formatting = [];
            const walker = document.createTreeWalker(
                element,
                NodeFilter.SHOW_ALL,
                null,
                false
            );

            let node;
            let position = 0;
            
            while (node = walker.nextNode()) {
                if (node.nodeType === Node.TEXT_NODE) {
                    const parent = node.parentNode;
                    const textContent = node.textContent;
                    
                    if (parent && parent !== element) {
                        const styles = window.getComputedStyle(parent);
                        const tagName = parent.tagName.toLowerCase();
                        
                        formatting.push({
                            start: position,
                            end: position + textContent.length,
                            text: textContent,
                            tag: tagName,
                            bold: styles.fontWeight === 'bold' || styles.fontWeight >= 600 || tagName === 'b' || tagName === 'strong',
                            italic: styles.fontStyle === 'italic' || tagName === 'i' || tagName === 'em',
                            underline: styles.textDecoration.includes('underline') || tagName === 'u',
                            color: styles.color,
                            fontSize: styles.fontSize,
                            fontFamily: styles.fontFamily
                        });
                    }
                    
                    position += textContent.length;
                }
            }

            return {
                text: text,
                html: html,
                formatting: formatting
            };
        }

        function compareFormatting(format1, format2) {
            const differences = [];
            
            // Compare formatting arrays
            const maxLength = Math.max(format1.length, format2.length);
            
            for (let i = 0; i < maxLength; i++) {
                const f1 = format1[i] || {};
                const f2 = format2[i] || {};
                
                if (f1.bold !== f2.bold) {
                    differences.push(`Bold formatting changed: ${f1.bold ? 'removed' : 'added'} at position ${f1.start || f2.start}`);
                }
                
                if (f1.italic !== f2.italic) {
                    differences.push(`Italic formatting changed: ${f1.italic ? 'removed' : 'added'} at position ${f1.start || f2.start}`);
                }
                
                if (f1.underline !== f2.underline) {
                    differences.push(`Underline formatting changed: ${f1.underline ? 'removed' : 'added'} at position ${f1.start || f2.start}`);
                }
                
                if (f1.color !== f2.color && f1.color && f2.color) {
                    differences.push(`Color changed from ${f1.color} to ${f2.color} at position ${f1.start || f2.start}`);
                }
            }
            
            return differences;
        }

        function compareTexts() {
            const text1Element = document.getElementById('text1');
            const text2Element = document.getElementById('text2');
            
            const data1 = extractTextAndFormatting(text1Element);
            const data2 = extractTextAndFormatting(text2Element);
            
            // Simple word-based comparison that actually works
            const textDiff = simpleWordDiff(data1.text, data2.text);
            
            // Compare formatting
            const formatDiff = compareFormatting(data1.formatting, data2.formatting);
            
            // Compare HTML for table and structure changes
            const htmlDiff = data1.html !== data2.html;
            
            // Display results
            displayResults(data1, data2, textDiff, formatDiff, htmlDiff);
        }

        function simpleWordDiff(text1, text2) {
            // Split into words
            const words1 = text1.trim().split(/\s+/);
            const words2 = text2.trim().split(/\s+/);
            
            // Create a simple diff by comparing word by word
            const diff = [];
            const maxLength = Math.max(words1.length, words2.length);
            
            for (let i = 0; i < maxLength; i++) {
                const word1 = words1[i] || '';
                const word2 = words2[i] || '';
                
                if (word1 === word2) {
                    if (word1) diff.push({ type: 'unchanged', value: word1 });
                } else {
                    if (word1) diff.push({ type: 'removed', value: word1 });
                    if (word2) diff.push({ type: 'added', value: word2 });
                }
            }
            
            return diff;
        }

        function displayResults(data1, data2, textDiff, formatDiff, htmlDiff) {
            const resultsDiv = document.getElementById('results');
            resultsDiv.style.display = 'block';
            
            // Count changes
            const textChanges = textDiff.filter(d => d.type !== 'unchanged').length;
            const formatChanges = formatDiff.length;
            const totalChanges = textChanges + formatChanges + (htmlDiff ? 1 : 0);
            
            // Calculate similarity
            const totalWords = Math.max(data1.text.split(/\s+/).filter(w => w.length > 0).length, 
                                      data2.text.split(/\s+/).filter(w => w.length > 0).length);
            const unchangedWords = textDiff.filter(d => d.type === 'unchanged').length;
            const similarity = totalWords > 0 ? Math.round((unchangedWords / totalWords) * 100) : 100;
            
            // Update stats
            document.getElementById('totalChanges').textContent = totalChanges;
            document.getElementById('textChanges').textContent = textChanges;
            document.getElementById('formatChanges').textContent = formatChanges;
            document.getElementById('similarity').textContent = similarity + '%';
            

            // Helper to check formatting for a word at a given position
            function getFormattingForWord(formatArr, word, pos) {
                // Find formatting that covers this word's position
                for (let i = 0; i < formatArr.length; i++) {
                    const f = formatArr[i];
                    if (f.start <= pos && pos < f.end && f.text.includes(word)) {
                        return f;
                    }
                }
                return null;
            }

            // Build highlighted HTML for original and modified text, including formatting changes
            let originalHTML = '';
            let modifiedHTML = '';
            let pos1 = 0, pos2 = 0;
            let widx1 = 0, widx2 = 0;
            const words1 = data1.text.trim().split(/\s+/);
            const words2 = data2.text.trim().split(/\s+/);

            textDiff.forEach(part => {
                if (part.type === 'unchanged') {
                    // Check for formatting differences
                    const word1 = words1[widx1] || '';
                    const word2 = words2[widx2] || '';
                    const f1 = getFormattingForWord(data1.formatting, word1, pos1);
                    const f2 = getFormattingForWord(data2.formatting, word2, pos2);
                    let hasFormatDiff = false;
                    if (f1 && f2) {
                        if (f1.bold !== f2.bold || f1.italic !== f2.italic || f1.underline !== f2.underline) {
                            hasFormatDiff = true;
                        }
                    } else if ((f1 && !f2) || (!f1 && f2)) {
                        hasFormatDiff = true;
                    }
                    if (hasFormatDiff) {
                        // Highlight as modified in both panels
                        originalHTML += `<span class="diff-modified">${word1}</span> `;
                        modifiedHTML += `<span class="diff-modified">${word2}</span> `;
                    } else {
                        originalHTML += `${word1} `;
                        modifiedHTML += `${word2} `;
                    }
                    pos1 += word1.length + 1;
                    pos2 += word2.length + 1;
                    widx1++;
                    widx2++;
                } else if (part.type === 'removed') {
                    const word1 = words1[widx1] || '';
                    originalHTML += `<span class="diff-removed">${word1}</span> `;
                    pos1 += word1.length + 1;
                    widx1++;
                } else if (part.type === 'added') {
                    const word2 = words2[widx2] || '';
                    modifiedHTML += `<span class="diff-added">${word2}</span> `;
                    pos2 += word2.length + 1;
                    widx2++;
                }
            });

            // Display results
            const originalResult = document.getElementById('originalResult');
            const modifiedResult = document.getElementById('modifiedResult');
            originalResult.innerHTML = originalHTML.trim();
            modifiedResult.innerHTML = modifiedHTML.trim();
            
            // Display formatting changes
            const formattingList = document.getElementById('formattingList');
            formattingList.innerHTML = '';
            
            if (formatDiff.length > 0) {
                formatDiff.forEach(change => {
                    const changeDiv = document.createElement('div');
                    changeDiv.className = 'formatting-change';
                    changeDiv.textContent = change;
                    formattingList.appendChild(changeDiv);
                });
            } else if (htmlDiff) {
                const changeDiv = document.createElement('div');
                changeDiv.className = 'formatting-change';
                changeDiv.textContent = 'HTML structure or table formatting has changed';
                formattingList.appendChild(changeDiv);
            } else {
                formattingList.innerHTML = '<div style="color: #28a745; text-align: center;">No formatting changes detected</div>';
            }
            
            // Show no differences message if texts are identical
            if (totalChanges === 0) {
                resultsDiv.innerHTML = `
                    <h2>Comparison Results</h2>
                    <div class="no-differences">
                        ✅ No differences found! The texts are identical.
                    </div>
                `;
            }
        }

        // Enable paste with formatting
        document.getElementById('text1').addEventListener('paste', function(e) {
            // Allow default paste behavior to preserve formatting
        });

        document.getElementById('text2').addEventListener('paste', function(e) {
            // Allow default paste behavior to preserve formatting
        });
// </script> tag removed for JS file context
