const execute = (...args) => { module.exports.calls.push(['once', ...args]); };
module.exports = { onceEvent: { name: 'clientReady', once: true, execute }, calls: [] };
