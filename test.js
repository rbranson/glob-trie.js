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
assert.ok(urlTrie.nodeCount() == beforeCount); // no prune, we still have *://example.com/

beforeCount = urlTrie.nodeCount();
assert.ok(urlTrie.collect("http://example.com/bar").indexOf("http://example.com/*") != -1);
assert.ok(urlTrie.collect("http://example.com/foo").indexOf("http://example.com/*") != -1);
assert.ok(urlTrie.collect("http://example.com/").indexOf("http://example.com/*") != -1);
urlTrie.remove("http://example.com/*", "http://example.com/*");
assert.ok(urlTrie.collect("http://example.com/bar").indexOf("http://example.com/*") == -1);
assert.ok(urlTrie.collect("http://example.com/foo").indexOf("http://example.com/*") == -1);
assert.ok(urlTrie.collect("http://example.com/").indexOf("http://example.com/*") == -1);
assert.ok(urlTrie.nodeCount() == beforeCount); // doesn't prune

beforeCount = urlTrie.nodeCount();
urlTrie.remove("http://example.com/*/foo", "http://example.com/*/foo");
assert.ok(urlTrie.nodeCount() == (beforeCount - 3)); // should prune off "foo"

beforeCount = urlTrie.nodeCount();
urlTrie.remove("http://example.com/*/bar", "http://example.com/*/bar");
assert.ok(urlTrie.nodeCount() == (beforeCount - 5)); // should prune off "*/bar"

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

console.log("");
console.log("All tests passed!");