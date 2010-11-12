var GlobTrie    = require("./glob-trie"),
    assert      = require("assert");


urlTrie = new GlobTrie();

urlTrie.add("*",                          "*");
urlTrie.add("*://example.com/",           "*://example.com/");
urlTrie.add("http://*",                   "http://*");
urlTrie.add("http://*.example.com/",      "http://*.example.com/");
urlTrie.add("http://*example.com/",       "http://*example.com/");
urlTrie.add("http://example.com/*",       "http://example.com/*");
urlTrie.add("http://example.com/*/foo",   "http://example.com/*/foo");
urlTrie.add("http://example.com/*/bar",   "http://example.com/*/bar");
urlTrie.add("http://?x?mple.com/*",       "http://?x?mple.com/*");
urlTrie.add("http://*example.????*",      "http://*example.????*");
urlTrie.add("http://*example.???*",       "http://*example.???*");
urlTrie.add("http://*example.??*",        "http://*example.??*");
urlTrie.add("http://example.com/\\?q=*",  "http://example.com/\\?q=*");
urlTrie.add("http://example.com/\\q",     "http://example.com/\\q");
urlTrie.add("http://example.com/\\",      "http://example.com/\\");

assert.equal(JSON.stringify(urlTrie.collect("http://").sort()), JSON.stringify([
    "*",
    "http://*"
].sort()));

assert.equal(JSON.stringify(urlTrie.collect("http://www.example.com/").sort()), JSON.stringify([
    "*",
    "http://*",
    "http://*.example.com/",
    "http://*example.com/",
    "http://*example.????*",
    "http://*example.???*",
    "http://*example.??*"
].sort()));

assert.equal(JSON.stringify(urlTrie.collect("http://example.com/").sort()), JSON.stringify([
    "*",
    "*://example.com/",
    "http://*",
    "http://*example.com/",
    "http://?x?mple.com/*",
    "http://example.com/*",
    "http://*example.????*",
    "http://*example.???*",
    "http://*example.??*"
].sort()));

assert.equal(JSON.stringify(urlTrie.collect("http://example.com/page.html").sort()), JSON.stringify([
    "*",
    "http://*",
    "http://example.com/*",
    "http://?x?mple.com/*",
    "http://*example.????*",
    "http://*example.???*",
    "http://*example.??*"
].sort()));

assert.equal(JSON.stringify(urlTrie.collect("http://www.nodejs.org/").sort()), JSON.stringify([
    "*",
    "http://*"
].sort()));

assert.equal(JSON.stringify(urlTrie.collect("ftp://example.com/").sort()), JSON.stringify([
    "*",
    "*://example.com/"
].sort()));

assert.equal(JSON.stringify(urlTrie.collect("http://example.com/?q=books").sort()), JSON.stringify([
    "*",
    "http://*",
    "http://?x?mple.com/*",
    "http://example.com/*",
    "http://example.com/\\?q=*",
    "http://*example.????*",
    "http://*example.???*",
    "http://*example.??*"
].sort()));

assert.equal(JSON.stringify(urlTrie.collect("http://example.com/?q=books").sort()), JSON.stringify([
    "*",
    "http://*",
    "http://?x?mple.com/*",
    "http://example.com/*",
    "http://example.com/\\?q=*",
    "http://*example.????*",
    "http://*example.???*",
    "http://*example.??*"
].sort()));

assert.equal(JSON.stringify(urlTrie.collect("http://example.com/bar/foo").sort()), JSON.stringify([
    "*",
    "http://*",
    "http://?x?mple.com/*",
    "http://example.com/*",
    "http://example.com/*/foo",
    "http://*example.????*",
    "http://*example.???*",
    "http://*example.??*"
].sort()));

assert.equal(JSON.stringify(urlTrie.collect("http://example.com/bar").sort()), JSON.stringify([
    "*",
    "http://*",
    "http://?x?mple.com/*",
    "http://example.com/*",
    "http://*example.????*",
    "http://*example.???*",
    "http://*example.??*"
].sort()));

///////////////////////////////////////

var beforeCount;

beforeCount = urlTrie.nodeCount();
assert.ok(urlTrie.collect("http://example.com/bar").indexOf("*") != -1);
assert.ok(urlTrie.collect("anything").indexOf("*") != -1);
urlTrie.remove("*", "*");
assert.ok(urlTrie.collect("http://example.com/bar").indexOf("*") == -1);
assert.ok(urlTrie.collect("anything").indexOf("*") == -1);
assert.ok(urlTrie.nodeCount() == (beforeCount - 1)); // just prune $ as we still have *://example.com/

beforeCount = urlTrie.nodeCount();
assert.ok(urlTrie.collect("http://example.com/bar").indexOf("http://example.com/*") != -1);
assert.ok(urlTrie.collect("http://example.com/foo").indexOf("http://example.com/*") != -1);
assert.ok(urlTrie.collect("http://example.com/").indexOf("http://example.com/*") != -1);
urlTrie.remove("http://example.com/*", "http://example.com/*");
assert.ok(urlTrie.collect("http://example.com/bar").indexOf("http://example.com/*") == -1);
assert.ok(urlTrie.collect("http://example.com/foo").indexOf("http://example.com/*") == -1);
assert.ok(urlTrie.collect("http://example.com/").indexOf("http://example.com/*") == -1);
assert.ok(urlTrie.nodeCount() == (beforeCount - 1)); // just prune $

beforeCount = urlTrie.nodeCount();
urlTrie.remove("http://example.com/*/foo", "http://example.com/*/foo");
assert.ok(urlTrie.nodeCount() == (beforeCount - 4)); // should prune off "foo$"

beforeCount = urlTrie.nodeCount();
urlTrie.remove("http://example.com/*/bar", "http://example.com/*/bar");
assert.ok(urlTrie.nodeCount() == (beforeCount - 6)); // should prune off "*/bar$"

beforeCount = urlTrie.nodeCount();
assert.ok(urlTrie.collect("http://example.com/?q=books").indexOf("http://*example.????*") != -1);
assert.ok(urlTrie.collect("http://www.example.info/").indexOf("http://*example.????*") != -1);
assert.ok(urlTrie.collect("http://example.com/").indexOf("http://*example.????*") != -1);
urlTrie.remove("http://*example.????*", "http://*example.????*");
assert.ok(urlTrie.collect("http://example.com/?q=books").indexOf("http://*example.????*") == -1);
assert.ok(urlTrie.collect("http://www.example.info/").indexOf("http://*example.????*") == -1);
assert.ok(urlTrie.collect("http://example.com/").indexOf("http://*example.????*") == -1);
assert.ok(urlTrie.nodeCount() < beforeCount); // should prune some stuff

///////////////////////////////////////

var classTrie = new GlobTrie();

classTrie.add("[a-zA-Z0-9]", "[a-zA-Z0-9]");
classTrie.add("[0-9]*", "[0-9]*");
classTrie.add("*[0-9]", "*[0-9]");
classTrie.add("*[0-9]*", "*[0-9]*");
classTrie.add("[\\[\\]\\?\\(\\)\\.\\*\\\\]", "[\\[\\]\\?\\(\\)\\.\\*\\\\]");
classTrie.add("[^0-9]", "[^0-9]");

assert.ok(classTrie.collect("This won't match anything").length == 0);

assert.equal(JSON.stringify(classTrie.collect("0").sort()), JSON.stringify([
    "[a-zA-Z0-9]",
    "[0-9]*",
    "*[0-9]",
    "*[0-9]*"
].sort()));

assert.equal(JSON.stringify(classTrie.collect("1").sort()), JSON.stringify([
    "[a-zA-Z0-9]",
    "[0-9]*",
    "*[0-9]",
    "*[0-9]*"
].sort()));

assert.equal(JSON.stringify(classTrie.collect("100").sort()), JSON.stringify([
    "[0-9]*",
    "*[0-9]",
    "*[0-9]*",
    "*[0-9]*",
    "*[0-9]*" // TODO: We get this once per char, is that necessary?
].sort()));

assert.equal(JSON.stringify(classTrie.collect("abc1").sort()), JSON.stringify([
    "*[0-9]",
    "*[0-9]*"
].sort()));

assert.equal(JSON.stringify(classTrie.collect("1abc").sort()), JSON.stringify([
    "[0-9]*",
    "*[0-9]*"
].sort()));

assert.equal(JSON.stringify(classTrie.collect("a").sort()), JSON.stringify([
    "[a-zA-Z0-9]",
    "[^0-9]"
].sort()));

// Test all of our escape patterns now
assert.equal(JSON.stringify(classTrie.collect("[").sort()), JSON.stringify([
    "[\\[\\]\\?\\(\\)\\.\\*\\\\]",
    "[^0-9]"
].sort()));

assert.equal(JSON.stringify(classTrie.collect("]").sort()), JSON.stringify([
    "[\\[\\]\\?\\(\\)\\.\\*\\\\]",
    "[^0-9]"
].sort()));

assert.equal(JSON.stringify(classTrie.collect("(").sort()), JSON.stringify([
    "[\\[\\]\\?\\(\\)\\.\\*\\\\]",
    "[^0-9]"
].sort()));

assert.equal(JSON.stringify(classTrie.collect(")").sort()), JSON.stringify([
    "[\\[\\]\\?\\(\\)\\.\\*\\\\]",
    "[^0-9]"
].sort()));

assert.equal(JSON.stringify(classTrie.collect(".").sort()), JSON.stringify([
    "[\\[\\]\\?\\(\\)\\.\\*\\\\]",
    "[^0-9]"
].sort()));

assert.equal(JSON.stringify(classTrie.collect("?").sort()), JSON.stringify([
    "[\\[\\]\\?\\(\\)\\.\\*\\\\]",
    "[^0-9]"
].sort()));

assert.equal(JSON.stringify(classTrie.collect("\\").sort()), JSON.stringify([
    "[\\[\\]\\?\\(\\)\\.\\*\\\\]",
    "[^0-9]"
].sort()));

///////////////////////////////////////

var stupidBugTrie = new GlobTrie();
stupidBugTrie.add("[0-9][a-z]", "[0-9][a-z]");
assert.ok(stupidBugTrie.collect("00")[0] != "[0-9][a-z]");

///////////////////////////////////////

console.log("");
console.log("All tests passed!");