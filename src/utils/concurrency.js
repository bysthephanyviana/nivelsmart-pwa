/**
 * Executes a list of async tasks with a concurrency limit.
 * @param {Array<any>} items - The array of items to process.
 * @param {number} limit - Max number of concurrent promises.
 * @param {Function} taskFn - Async function (item) => Promise.
 * @returns {Promise<Array>} - Resolves with all results in order.
 */
async function asyncPool(items, limit, taskFn) {
    const results = [];
    const executing = [];

    for (const item of items) {
        const p = Promise.resolve().then(() => taskFn(item));
        results.push(p);

        const e = p.then(() => executing.splice(executing.indexOf(e), 1));
        executing.push(e);

        if (executing.length >= limit) {
            await Promise.race(executing);
        }
    }

    return Promise.all(results);
}

module.exports = asyncPool;
