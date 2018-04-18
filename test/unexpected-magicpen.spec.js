var expect = require('unexpected');

expect.use(require('../lib/unexpected-magicpen'));

expect.addAssertion('<any> to inspect as <string>', function (expect, subject, value) {
    expect(expect.inspect(subject).toString(), 'to equal', value);
}).addAssertion('<any> when delayed a little bit <assertion>', function (expect, subject) {
    return expect.promise(function (run) {
        setTimeout(run(function () {
            return expect.shift();
        }), 1);
    });
});

describe('magicpen type', function () {
    describe('#inspect', function () {
        it('should inspect an empty MagicPen instance', function () {
            expect(expect.output.clone().magicPen(expect.output.clone()).toString(), 'to equal', 'magicpen()');
        });

        it('should find two pens with different formats to not to be identical', function () {
            var MagicPen = expect.output.constructor;
            expect(new MagicPen('text').text('foo'), 'not to equal', new MagicPen('ansi').text('foo'));
        });

        it('should find two format-less pens with the same contents to be identical', function () {
            var MagicPen = expect.output.constructor;
            expect(new MagicPen().text('foo'), 'to equal', new MagicPen().text('foo'));
        });

        describe('with a pen in text format', function () {
            var pen = expect.createOutput('text').green('abc').nl().text('def').block(function () {
                this.text('foo').nl().text('bar');
            });

            it('should inspect correctly', function () {
                expect(pen, 'to inspect as',
                    "magicpen('text')        // abc\n" +
                       "  .green('abc').nl()    // deffoo\n" +
                       "  .text('def')          //    bar\n" +
                       '  .block(function () {\n' +
                       '    this\n' +
                       "      .text('foo').nl()\n" +
                       "      .text('bar');\n" +
                       '  })'
                );
            });
        });

        describe('with a pen in ansi format', function () {
            var pen = expect.createOutput('ansi').green('abc').text('def').block(function () {
                this.text('foo');
            });

            it('should inspect correctly', function () {
                expect(pen, 'to inspect as',
                    "magicpen('ansi')\n" +
                       "  .green('abc')\n" +
                       "  .text('def')\n" +
                       '  .block(function () {\n' +
                       "    this.text('foo');\n" +
                       '  })'
                );
            });
        });

        describe('with a pen in ansi format', function () {
            var pen = expect.createOutput('html').green('abc').text('def').block(function () {
                this.text('foo');
            });

            it('should inspect correctly', function () {
                expect(pen, 'to inspect as',
                    "magicpen('html')\n" +
                       "  .green('abc')\n" +
                       "  .text('def')\n" +
                       '  .block(function () {\n' +
                       "    this.text('foo');\n" +
                       '  })'
                );
            });
        });
    });
});

describe('magicPen style', function () {
    it('renders a raw entry', function () {
        expect(expect.createOutput('text').raw('foo'), 'to inspect as', "magicpen('text').raw('foo') // foo");
    });

    it('renders an empty block', function () {
        expect(
            expect.createOutput('text').block(function () {}),
            'to inspect as',
            "magicpen('text').block(function () {}) // "
        );
    });

    it('renders text with an empty array of styles', function () {
        expect(expect.createOutput('text').text('foo', []), 'to inspect as', "magicpen('text').text('foo', []) // foo");
    });

    it('renders text with a single style not defined as a top-level style', function () {
        expect(expect.createOutput('text').text('foo', ['blabla']), 'to inspect as', "magicpen('text').text('foo', [ 'blabla' ]) // foo");
    });

    it('renders text with several styles', function () {
        expect(expect.createOutput('text').text('foo', ['quux', 'baz']), 'to inspect as', "magicpen('text').text('foo', [ 'quux', 'baz' ]) // foo");
    });
});
