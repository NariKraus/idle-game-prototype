// TestCase.js
// Minimal test runner for Node.js and browser

class TestCase {
    constructor() {
        this.tests = [];
        this.results = [];
    }

    /**
     * shouldFail: false | 'error' | 'mismatch'
     *   false: normal test (should pass)
     *   'error': test should throw
     *   'mismatch': test should NOT equal expected
     */
    /**
     * @param {string} name
     * @param {function} testFn
     * @param {*} expected
     * @param {false|'error'|'mismatch'} shouldFail
     * @param {function} [comparator] Optional custom comparator: (actual, expected) => boolean
     */
    test(name, testFn, expected, shouldFail = false, comparator = null) {
        this.tests.push({name, testFn, expected, shouldFail, comparator});
    }

    runAll() {
        console.log('=== Running Tests ===');
        this.results = [];
        this.tests.forEach((test, i) => {
            const result = this.runTest(test, i + 1);
            this.results.push(result);
        });
        this.displaySummary();
        return this.results;
    }

    runTest(test, index) {
        let actual = null;
        let error = null;
        let passed = false;
        try {
            actual = test.testFn();
            const comparator = test.comparator || this.compareValues.bind(this);
            if (test.shouldFail === 'error') {
                // Should have thrown, but didn't
                passed = false;
            } else if (test.shouldFail === 'mismatch') {
                // Should NOT match expected
                passed = !comparator(actual, test.expected);
            } else {
                // Normal: should match expected
                passed = comparator(actual, test.expected);
            }
        } catch (err) {
            error = err.message;
            if (test.shouldFail === 'error') {
                passed = true; // Error was expected
            } else {
                passed = false;
            }
        }
        const result = {name: test.name, passed, actual, expected: test.expected, error, shouldFail: test.shouldFail};
        this.logResult(index, result);
        return result;
    }

    compareValues(actual, expected) {
        if (actual === expected) return true;
        if (typeof actual !== typeof expected) return false;
        if (typeof actual === 'number' && typeof expected === 'number') {
            const epsilon = 1e-10;
            return Math.abs(actual - expected) < epsilon;
        }
        // Partial object match: only compare keys in expected
        if (
            actual && expected &&
            typeof actual === 'object' &&
            !Array.isArray(actual) &&
            !Array.isArray(expected)
        ) {
            for (const key of Object.keys(expected)) {
                if (!(key in actual)) return false;
                if (!this.compareValues(actual[key], expected[key])) return false;
            }
            return true;
        }
        // Arrays: require deep equality
        if (Array.isArray(actual) && Array.isArray(expected)) {
            return JSON.stringify(actual) === JSON.stringify(expected);
        }
        return false;
    }

    logResult(index, result) {
        let icon = result.passed ? '✓' : '✗';
        let style = result.passed ? '\x1b[32m' : '\x1b[31m';
        let statusMsg = '';
        if (result.shouldFail && result.passed) {
            statusMsg = ' (failed as expected)';
            style = '\x1b[33m';
            icon = '!';
        }
        let line = `${style}${icon} Test ${index}: ${result.name}${statusMsg}`;
        if (result.passed && !result.shouldFail) {
            let displayActual = result.actual;
            if (typeof displayActual === 'object' && displayActual !== null) {
                try {
                    displayActual = JSON.stringify(displayActual);
                } catch (e) {
                    displayActual = '[object Object]';
                }
            }
            line += ` [${displayActual}]`;
        }
        line += '\x1b[0m';
        console.log(line);
        // Only show details for failures or error cases
        if (!result.passed || result.shouldFail) {
            if (result.error) {
                console.log(`  Error: ${result.error}`);
            }
            console.log(`  Expected:`, result.expected);
            console.log(`  Actual:`, result.actual);
        }
    }

    displaySummary() {
        const passed = this.results.filter((r) => r.passed && !r.shouldFail).length;
        const failedAsExpected = this.results.filter((r) => r.shouldFail && r.passed).length;
        const failed = this.results.length - passed - failedAsExpected;
        console.log('\n=== Test Summary ===');
        console.log(`\x1b[32mPassed: ${passed}\x1b[0m`);
        if (failedAsExpected > 0) {
            console.log(`\x1b[33mFailed as Expected: ${failedAsExpected}\x1b[0m`);
        }
        console.log(`\x1b[31mFailed: ${failed}\x1b[0m`);
        console.log(`Total: ${this.results.length}`);
        if (failed === 0) {
            console.log('\x1b[32m\n🎉 All tests passed!\x1b[0m');
        }
    }

    clear() {
        this.tests = [];
        this.results = [];
    }
}

module.exports = {TestCase};
