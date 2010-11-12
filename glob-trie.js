//
// Copyright (c) 2010 Rick Branson
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
//
// glob-trie.js
//
// A search tree that can efficiently match a string with a large number of
// wildcard matchers, potentially thousands or tens of thousands. Currently
// supports simple matchers:
//
//   *      will match any character 0 to infinity times
//   ?      will match any character once
//   \      will escape * and ? and [ and ]
//   [...]  will match a RegExp-compatible character class once
//   anything else gets matched at face value
//

module.exports = GlobTrie = function() {
    this._node = new GlobTrie.Node();
};

// Adds a payload to the tree for an expression
GlobTrie.prototype.add = function(expr, payload) {
    GlobTrie.add(this._node, GlobTrie.compile(expr), payload);
};

// Removes a payload from the trie for an expression
GlobTrie.prototype.remove = function(expr, payload) {
    GlobTrie.remove(this._node, GlobTrie.compile(expr), payload);
};

// Searches for matches in the trie, calling f at each node
GlobTrie.prototype.walk = function(s, f) {
    GlobTrie.walk(this._node, s, f);
};

// Collects all the payloads found when searching the trie for a string
GlobTrie.prototype.collect = function(s) {
    var ret = [];
    
    this.walk(s, function(node) {
        ret.push.apply(ret, node.payloads);
    });
    
    return ret;
};

// Dumps the trie structure to the console
GlobTrie.prototype.print = function() {
    GlobTrie.print(this._node);
};

// Returns the number of nodes in the trie
GlobTrie.prototype.nodeCount = function() {
    return GlobTrie.count(this._node);
};

// Represents a single node in the trie structure
GlobTrie.Node = function(parent, sexpr) {
    this.parent     = parent || null;
    this.sexpr      = sexpr || null;  // assumed to be immutable
    this.children   = [];
    this.payloads   = [];
};

// Is this the root node?
GlobTrie.Node.prototype.isRoot = function() {
    return (this.parent == null);
};

// Is this node prunable? (empty children and empty payloads)
GlobTrie.Node.prototype.isPrunable = function() {
    return (this.children.length == 0 && this.payloads.length == 0);
};

// Add a payload object from this node
GlobTrie.Node.prototype.addPayload = function(payload) {
    this.payloads.push(payload);
};

// Remove a payload object from this node
GlobTrie.Node.prototype.removePayload = function(payload) {
    var idx = this.payloads.indexOf(payload);
    
    if (idx != -1) {
        this.payloads.splice(idx, 1);
    }
};

// Add a child node to this node
GlobTrie.Node.prototype.addChild = function(child) {
    this.children.push(child);
};

// Remove a child node from this node
GlobTrie.Node.prototype.removeChild = function(child) {
    var idx = this.children.indexOf(child);
    
    if (idx != -1) {
        this.children.splice(idx, 1);
    }
};

// Returns a RegExp to match this node's sexpr
GlobTrie.Node.prototype.matcher = function() {
    if (!this._matcher) {
        var m = this.sexpr.match(GlobTrie.Node.matchBracketGuts);
                
        if (m) {
            // FUTURE: we have to re-escape these, cleaner way?
            var guts = m[1].replace(/([\[\]\(\)\]\*\?\.\\])/g, "\\$1"); 
            this._matcher = new RegExp("^[" + guts + "]$");
        }
    }
    
    return this._matcher;
};

GlobTrie.Node.matchBracketGuts = /^:\[(.*?)\]$/;

// Parses an expression into an array of valid sexprs
GlobTrie.compile = function(expr) {
    var out     = [],
        isobrk  = false, // in search of bracket flag
        bufrng  = false, // adding stuff to buffer flag
        buf     = "";
    
    for (var i = 0, len = expr.length; i < len; i++) {
        var c = expr.charAt(i);
        
        if (c == "\\") {
            nextc = expr.charAt(++i);
            
            if (bufrng) {
                buf += nextc;
            }
            else {
                out.push(nextc);
            }
        }
        else if (isobrk) {
            if (c == "]") {
                isobrk  =   false;
                bufrng  =   false;
                out.push(":[" + buf + "]");
            }
            else {
                buf += c;
            }
        }
        else {
            switch (c) {
                case "[":
                    isobrk = true;
                    bufrng = true;
                    break;
                case "]":
                    throw "GlobTrie.compile error: stray right bracket encountered.";
                    break;
                case "*":
                case "?":
                    out.push(":" + c);
                    break;
                default:
                    out.push(c);
                    break;
            }
        }
    }
    
    out.push(":E");
    
    return out;
};

// The recursive function that adds a parsed expression to the tree with a payload
GlobTrie.add = function(node, pexpr, payload, pos) {
    // Start at the zero position of the parsed expression
    pos = pos || 0;
    
    if (pos == pexpr.length) {
        // we've reached terminal state, so drop our payload
        node.addPayload(payload);
    }
    else {
        var sexpr   = pexpr[pos],
            nc      = node.children,
            m;
        
        // find any matching children        
        for (var i = 0, len = nc.length; i < len; i++) {
            var child = nc[i];
        
            if (child.sexpr == sexpr) {
                m = child;
                break;
            }
        }
        
        if (!m) {
            // we didn't get a match, so create it!
            m = new GlobTrie.Node(node, sexpr);
            node.addChild(m);
        }
        
        // now descend down, moving forward one position
        GlobTrie.add(m, pexpr, payload, pos + 1);
    }
};

// The recursive function that removes a payload from the tree by parsed expression
GlobTrie.remove = function(node, pexpr, payload, pos) {
    var pexprlen = pexpr.length;
    
    // Start at the zero position of the parsed expression
    pos = pos || 0;

    if (pos == pexprlen) {
        // end of expression, so remove the payload
        node.removePayload(payload);
    }
    else if (pexprlen > 0) {
        // we have some expression left, so keep goin        
        var nc      = node.children,
            sexpr   = pexpr[pos],
            prune   = [];
    
        // find any matching children and descend
        for (var i = 0, len = nc.length; i < len; i++) {
            var child = nc[i];
    
            if (child.sexpr == sexpr) {
                // We've got a match of our subexpression, so now we descend!
                GlobTrie.remove(child, pexpr, payload, pos + 1);
            }

            // Check to see if child needs to be pruned -- we have to push this off
            // onto another list for pruning later because if we prune now, we'll screw
            // up the children list we're currently iterating over.
            if (child.isPrunable()) {
                prune.push(child);
            }
        }
        
        // Go ahead and remove all the prunable children
        for (var i = 0, len = prune.length; i < len; i++) {
            node.removeChild(prune[i]);
        }
    }
};

// The recursive function that walks the tree, searching for s, calling f at each matching termination
GlobTrie.walk = function(node, s, f, pos) {
    // NOTE: the repetition of the node children iteration + recursion call seem ridiculous, but the performance
    // pay-off for not, say, wrapping these up in a function, is that the walker runs 30-40% faster. In addition,
    // there's plenty of other things in here that look silly and redundant, that contribute to another 20%+
    // boost, like length checking a string before comparison.

    // default to string position 0
    pos = pos || 0;
    
    var nc = node.children;

    // If we're at the root, don't even try to match, just go for it
    if (node.isRoot()) {
        for (var i = 0, len = nc.length; i < len; i++) {
            GlobTrie.walk(nc[i], s, f, pos);
        }
    }
    else {
        var c       = s.charAt(pos),
            sexpr   = node.sexpr;

        if (sexpr != null) {
            var sexprlen = sexpr.length; // caching this for the speeds
            
    	    if (c.length == 1 && ( // these are ordered common to least common case
    	            (sexprlen == 1 && sexpr == c)    || 
    	            (sexprlen == 2 && sexpr == ":?") || 
    	            (sexprlen > 2 && sexpr.charAt(1) == "[" && c.match(node.matcher()))
    	    )) {
        	    // So we have matched either the single-char wildcard or the exact match, we're good, move forth
                for (var i = 0, len = nc.length; i < len; i++) {
                    GlobTrie.walk(nc[i], s, f, pos + 1);
                }
            }
            else if (sexprlen == 2) { // pre-qualifying this branch shaves some time off
                if (sexpr == ":*") {
                    // holy crap, we've got a match, but now we've got to really work hard to try to find
                    // a child that matches ANY character in the rest of the string.
                    for (var si = pos, slen = s.length; si <= slen; si++) {
                        for (var i = 0, len = nc.length; i < len; i++) {
                            GlobTrie.walk(nc[i], s, f, si);
                        }
                    }
                }
                else if (sexpr == ":E" && pos == s.length) {
                    // Match the end of expression to the end of the string
                    f(node);
                }
            }
        }
    }
};

// Counts the number of nodes in a tree
GlobTrie.count = function(node) {
    var nc  = node.children,
        ncl = nc.length,
        tab = ncl;
    
    for (var i = 0, len = ncl; i < len; i++) {
        tab += GlobTrie.count(nc[i]);
    }
    
    return tab;
};


// Dumps the trie structure to the console
GlobTrie.print = function(node, depth) {
    depth = depth || 0;

    var leading = "",
        info    = "";

    for (var i = 0; i < depth; i++) {
        leading += " ";
    }
    
    leading += "-> "
    
    if (node.payloads.length > 0) {
        info += "  (payload: " + JSON.stringify(node.payloads) + ")";
    }

    console.log(leading + node.sexpr + info);

    for (var i = 0, len = node.children.length; i < len; i++) {
        GlobTrie.print(node.children[i], depth + 1);
    }    
};
