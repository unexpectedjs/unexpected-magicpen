module.exports = {
    name: 'unexpected-magicpen',
    version: require('../package.json').version,
    installInto: function unexpectedMagicPen(expect) {
        expect.addType({
            name: 'magicpen',
            identify: function (obj) {
                return obj && obj.isMagicPen;
            },
            inspect: function (pen, depth, output) {
                output.magicPen(pen);
            },
            equal: function (a, b) {
                if (a.format !== b.format) {
                    return false;
                }
                if (a.format) {
                    // Both have the same format
                    return a.toString() === b.toString();
                } else {
                    // Neither have a format, test all serializations
                    return a.toString() === b.toString() &&
                        a.toString('ansi') === b.toString('ansi') &&
                        a.toString('html') === b.toString('html');
                }
            }
        });

        expect.addStyle('magicPenLine', function (line, pen) {
            line.forEach(function (lineEntry, j) {
                if (j > 0) {
                    this.nl();
                }
                if (lineEntry.style === 'text') {
                    var styles = lineEntry.args.styles;
                    if (pen && styles.length === 1 && typeof pen[styles[0]] === 'function') {
                        // Text with a single style also available as a method on the pen being inspected:
                        this
                            .text('.')
                            .jsFunctionName(styles[0])
                            .text('(')
                            .singleQuotedString(lineEntry.args.content)
                            .text(')');
                    } else {
                        this
                            .text('.')
                            .jsFunctionName('text')
                            .text('(')
                            .singleQuotedString(lineEntry.args.content);
                        if (styles.length > 0) {
                            this
                                .text(', ')
                                .appendInspected(styles.length === 1 && Array.isArray(styles[0]) ? styles[0] : styles);
                        }
                        this.text(')');
                    }
                } else if (lineEntry.style === 'raw') {
                    this
                        .text('.')
                        .jsFunctionName('raw')
                        .text('(')
                        .appendInspected(lineEntry.args.content())
                        .text(')');
                } else {
                    // lineEntry.style === 'block'
                    this
                        .text('.')
                        .jsFunctionName('block').text('(').jsKeyword('function').text(' () {');
                    if (lineEntry.args && lineEntry.args.length > 0 && lineEntry.args[0] && lineEntry.args[0].length > 0) {
                        this
                            .nl()
                            .indentLines()
                            .i()
                            .magicPen(pen, lineEntry.args)
                            .outdentLines()
                            .nl();
                    }
                    this.text('})');
                }
            }, this);
        });

        expect.addStyle('magicPen', function (pen, lines) {
            var isTopLevel = !lines;
            lines = lines || pen.output;
            this.block(function () {
                if (isTopLevel) {
                    this.jsFunctionName('magicpen').text('(');
                    if (pen.format) {
                        this.singleQuotedString(pen.format);
                    }
                    this.text(')');
                } else {
                    this.jsKeyword('this');
                }
                if (!pen.isEmpty()) {
                    var inspectOnMultipleLines = lines.length > 1 || lines[0].length > 1;
                    if (inspectOnMultipleLines) {
                        this
                            .nl()
                            .indentLines()
                            .i();
                    }
                    this.block(function () {
                        lines.forEach(function (line, i) {
                            if (i > 0) {
                                this.text('.').jsFunctionName('nl').text('()').nl();
                            }
                            this.magicPenLine(line, pen);
                        }, this);
                        if (!isTopLevel) {
                            this.text(';');
                        }
                    });
                    if (inspectOnMultipleLines) {
                        this.outdentLines();
                    }
                }
            });

            // If we're at the top level of a non-empty pen compatible with the current output,
            // render the output of the pen in a comment:
            if (isTopLevel && !pen.isEmpty() && (pen.format === this.format || !pen.format)) {
                this.sp().commentBlock(pen);
            }
        });

        expect.addAssertion('<Error> to have (ansi|html|text|) (message|diff) <any>', function (expect, subject, value) {
            expect.errorMode = 'nested';
            var format = expect.alternations[0] || 'text';
            var useDiff = expect.alternations[1] === 'diff';
            if (subject.isUnexpected) {
                var subjectPen;
                if (useDiff) {
                    var diff = subject.getDiff({ format: format });
                    if (diff) {
                        subjectPen = diff;
                    } else {
                        expect.fail('The UnexpectedError instance does not have a diff');
                    }
                } else {
                    subjectPen = subject.getErrorMessage({ format: format });
                }
                var valueType = expect.argTypes[0];
                if (valueType.is('magicpen')) {
                    expect(subjectPen, 'to equal', value);
                } else if (valueType.is('function') && !valueType.is('expect.it')) {
                    var expectedOutput = expect.createOutput(format);
                    var returnValue = value.call(expectedOutput, subjectPen.toString());
                    if (!expectedOutput.isEmpty()) {
                        // If the function didn't generate any expected output, assume that it ran assertions based on the serialized message
                        expect(subjectPen, 'to equal', expectedOutput);
                    }
                    return returnValue;
                } else {
                    return expect(subjectPen.toString(), 'to satisfy', value);
                }
            } else {
                if (useDiff) {
                    expect.fail('Cannot get the diff from a non-Unexpected error');
                }
                if (format !== 'text') {
                    expect.fail('Cannot get the ' + format + ' representation of non-Unexpected error');
                } else {
                    return expect(subject.message, 'to satisfy', value);
                }
            }
        });
    }
};
