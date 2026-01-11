// TestCase.js
// Minimal test runner for Node.js and browser

class TestCase {
    constructor() {
        this.tests = [];
        this.results = [];
    }

    test(name, testFn, expected) {
        this.tests.push({ name, testFn, expected });
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
        try {
            const actual = test.testFn();
            const passed = this.compareValues(actual, test.expected);
            const result = { name: test.name, passed, actual, expected: test.expected, error: null };
            this.logResult(index, result);
            return result;
        } catch (error) {
            const result = { name: test.name, passed: false, actual: null, expected: test.expected, error: error.message };
            this.logResult(index, result);
            return result;
        }
    }

    compareValues(actual, expected) {
        if (actual === expected) return true;
        if (typeof actual !== typeof expected) return false;
        if (typeof actual === 'number' && typeof expected === 'number') {
            const epsilon = 1e-10;
            return Math.abs(actual - expected) < epsilon;
        }
        if (actual && expected && typeof actual === 'object') {
            return JSON.stringify(actual) === JSON.stringify(expected);
        }
        return false;
    }

    logResult(index, result) {
        const icon = result.passed ? '✓' : '✗';
        const style = result.passed ? '\x1b[32m' : '\x1b[31m';
        console.log(`${style}${icon} Test ${index}: ${result.name}\x1b[0m`);
        if (!result.passed) {
            if (result.error) {
                console.log(`  Error: ${result.error}`);
            } else {
                console.log(`  Expected:`, result.expected);
                console.log(`  Actual:`, result.actual);
            }
        }
    }

    displaySummary() {
        const passed = this.results.filter(r => r.passed).length;
        const failed = this.results.length - passed;
        console.log('\n=== Test Summary ===');
        console.log(`\x1b[32mPassed: ${passed}\x1b[0m`);
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

module.exports = { TestCase };
