var ITERATIONS = 1000;

PROTOCOLS = [
    "http://",
    "ftp://",
    "smtp://",
    "*://"
]

HOSTS = [
    "www.google.com",
    "*.google.com",
    "www.*.com",
    "nodejs.org",
    "www.nodejs.org",
    "*.nodejs.org",
    "*.com",
    "*.net",
    "*.org",
    "*.??",
    "www.yahoo.com",
    "*.yahoo.com",
    "yahoo.com",
    "*facebook.com",
    "*youtube.com",
    "*wikipedia.org",
    "*twitter.com",
    "*amazon.com"
]

PATHS = [
    "/index.html",
    "/robots.txt",
    "/path/to/stuff.html",
    "/*/index.html",
    "/*",
    "/docs",
    "/mail",
    "/docs/1",
    "/docs/2",
    "/docs/3",
    "/docs/4",
    "/docs/5",
    "/docs/6",
    "/docs/7",
    "/docs/8",
    "/docs/9",
    "/docs/10",
    "/docs/11",
    "/docs/12",
    "/docs/13",
    "/docs/14",
    "/docs/15",
    "/docs/16",
    "/docs/17",
    "/docs/18",
    "/docs/19",
    "/docs/20",
    "/docs/21",
    "/docs/22",
    "/docs/23",
    "/docs/*",
    "/mail/messages/1",
    "/mail/messages/2",
    "/mail/messages/3",
    "/mail/messages/4",
    "/mail/messages/5",
    "/mail/messages/6",
    "/mail/messages/7",
    "/mail/messages/8",
    "/mail/messages/9",
    "/mail/messages/10",
    "/mail/messages/11",
    "/mail/messages/*",
    "/mail/*",
    "/m*"
]

var expressions = [],
    totalExpr   = 0;

for (var a = 0, alen = PROTOCOLS.length; a < alen; a++) {
    for (var b = 0, blen = HOSTS.length; b < blen; b++) {
        for (var c = 0, clen = PATHS.length; c < clen; c++) {
            var s = PROTOCOLS[a] + HOSTS[b] + PATHS[c],
                m = s.replace(/\//g, "\\/").replace(/\./g, "\\.").replace(/\*/g, ".*").replace(/\?/g, ".");
            
            expressions.push(new RegExp("^" + m + "$"));
            totalExpr++;
        }
    }
}

STRINGS = [
    "http://www.amazon.com/docs",
    "ftp://google.com/mail",
    "smtp://facebook.com/mail/messages/10",
    "http://www.nodejs.org/sucks",
    "http://twitter.com/rbranson",
    "http://poop.to/person/index.html",
    "http://mail.yahoo.com/robots.txt",
    "http://youtube.com/terms-of-serivce/index.html",
    "http://www.ycombinator.com/paul-graham-sucks",
    "http://www.cnn.com/"
];

var totalMatches    = 0,
    totalAttempts   = 0,
    totalOps        = 0;
    
for (var i = 0; i < ITERATIONS; i++) {
    for (var x = 0, xlen = STRINGS.length; x < xlen; x++) {
        for (var n = 0, nlen = expressions.length; n < nlen; n++) {
            if (STRINGS[x].match(expressions[n])) {
                totalMatches++;
            }
            totalOps++;
        }
        totalAttempts++;
    }
}

console.log("Total Expressions: " + totalExpr);
console.log("Total Operations: " + totalAttempts);
console.log("Total Found: " + totalMatches);
console.log("Effective Operations: " + totalOps);