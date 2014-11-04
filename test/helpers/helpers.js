
global.requireKalamata = function() {
    deleteFromRequireCache('kalamata/index.js');
    return require('../../index.js');
}

global.deleteFromRequireCache = function(filePath) {
    for(var n in require.cache) {
        if(n.indexOf(filePath) != -1) {
            delete require.cache[n];
        }
    }
}
