# GlobTrie

A highly optimized way to match strings against a large set of pattern matching expressions quickly. It breaks down the pattern matchers into pieces and organizes them in a Trie (prefix search tree) structure, allowing them to be searched in roughly logarithmic time, versus linear time for just an array of regular expressions, for instance.

## Installation

Using NPM:
  
    $ npm install glob-trie.js
    
Now a simple require will bring it on:

    var GlobTrie = require("glob-trie.js");

## Notes

* In some rare cases, like a match class sandwiched between asterisks, you'll get duplicate matches.
* GlobTrie.walk looks wonky because I've performance optimized it.
* There are probably some edge cases where I'm not checking things properly and syntax errors in expressions will create *odd* output.
* No captures right now, but that's on the list, if I can get it to work without impacting mainline performance.
* The expression syntax WILL change in the future as I add features, so use a specific version.

## Expression Support

Currently GlobTrie only supports a very small set of pattern matching tools, similar to what's commonly available for file path matching.

* *      will match any character 0 to infinity times
* ?      will match any character once
* \      will escape * and ? and [ and ]
* [...]  will match a RegExp-compatible character class once
* anything else gets matched at face value

## Use It

    var trie = new GlobTrie();
    
    trie.add("http://www.*.com/", "A .com website!");
    trie.add("http://www.*.net/", "A .net website!");
    trie.add("http://www.*.org/", "A .org website!");
    trie.add("http://*.??/", "A 2-character TLD website!");
    trie.add("http://*/", "A website!");
    
    trie.collect("http://www.nodejs.org/"); // => [ "A .org website", "A website!" ]
    trie.collect("ftp://ftp.cdrom.com/");   // => []
    trie.collect("http://t.co/");           // => [ "A 2-character TLD website!", "A website!" ]
    
    trie.remove("http://*/", "A website!");
    trie.collect("http://t.co/");           // => [ "A 2-character TLD website!" ]

## Performance

Using the brute-perf.js and perf.js scripts, performance can be compared.

For the GlobTrie implementation:

    $ time node perf.js
    Total Expressions: 9720
    Total Operations: 10000
    Total Found: 76000
    Effective Operations: 97200000

    real	0m0.618s

For the array of regular expressions implementation:

    $ time node brute-perf.js
    Total Expressions: 9720
    Total Operations: 10000
    Total Found: 76000
    Effective Operations: 97200000

    real	0m54.990s

Big difference! Note that because it's a logarithmic algorithm, the difference between the two will get wider and wider as the size of the expression list grows.