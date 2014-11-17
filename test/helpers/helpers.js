
global.requireKalamata = function() {
    deleteFromRequireCache('kalamata/src/index.js');
    return require('../../src/index.js');
}

global.deleteFromRequireCache = function(filePath) {
    for(var n in require.cache) {
        if(n.indexOf(filePath) != -1) {
            delete require.cache[n];
        }
    }
}
