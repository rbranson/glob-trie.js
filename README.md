# GlobTrie

A way to match strings against a large set of pattern matching expressions quickly. It breaks down the pattern matchers into pieces and organizes them in a Trie (prefix search tree) structure, allowing them to be searched in roughly logarithmic time, versus linear time for just an array of regular expressions, for instance.

## Notes

* This is very much a work in progress.
* Doesn't support removal of expressions yet.
* Has very limit expression set.

## Expression Support

Currently GlobTrie only supports a very small set of pattern matching tools, similar to what's commonly available for file path matching.

* "*" will match any character 0 to infinity times
* "?" will match any character once
* "\" will escape * and ?
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

## Performance

Using the brute-perf.js and perf.js scripts, performance can be compared.

For the GlobTrie implementation:

    $ time node perf.js
    Total Expressions: 3240
    Total Operations: 10000
    Total Found: 76000
    Effective Operations: 32400000

    real	0m0.956s

For the array of regular expressions implementation:

    $ time node brute-perf.js
    Total Expressions: 3240
    Total Operations: 10000
    Total Found: 81000
    Effective Operations: 32400000

    real	0m46.223s
    user	0m45.810s

Big difference! Note that because it's a logarithmic algorithm, the difference between the two will get wider and wider as the size of the expression list grows.