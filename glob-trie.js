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
//   *    will match any character 0 to infinity times
//   ?    will match any character once
//   \    will escape a matcher
//

module.exports = GlobTrie = function() {
    this._node = new GlobTrie.Node();
};

// Adds a matcher to the trie with a payload
GlobTrie.prototype.add = function(expr, payload) {
    GlobTrie.add(this._node, expr, payload);
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

GlobTrie.prototype.print = function() {
    GlobTrie.print(this._node);
};

// Represents a single node in the trie structure
GlobTrie.Node = function(parent, sexpr) {
    this.parent     = parent || null;
    this.sexpr      = sexpr || null;
    this.children   = [];
    this.payloads   = [];
};

GlobTrie.Node.prototype.isRoot = function() {
    return (this.parent == null);
};

GlobTrie.Node.prototype.addPayload = function(payload) {
    this.payloads.push(payload);
};

GlobTrie.Node.prototype.addChild = function(child) {
    this.children.push(child);
};

// An Expression is for matching single characters. Initialized with
// a single character, it's will match exactly. There are special matchers
// such as :* which will do a greedy match, and :?, which will do a single
// character wildcard match.
GlobTrie.Expression = function(sexpr) {
    this.sexpr = sexpr;
};

// Returns the number of characters that should be matched, if it's
// -1, that means do a greedy match.
GlobTrie.Expression.prototype.match = function(sexpr) {
    if (this.sexpr == ":*") {
        return -1;
    }
    else if ((this.sexpr == ":?" && sexpr.length == 1) || this.sexpr == sexpr) {
        return 1;
    }
    else {
        return 0;
    }
};

GlobTrie.Expression.prototype.equals = function(other) {
    return (other.sexpr == this.sexpr);
};

GlobTrie.Expression.prototype.toString = function() {
    return this.sexpr;
};

// Reads the first expression off a raw expression string and returns
// an object that contains an "sexpr" Expression member and a "string" member,
// which contains the input string minus the characters removed for
// the expression that was emitted.
GlobTrie.Expression.nextExpr = function(str) {
    var first = str.charAt(0);
    
    if (first == "\\") {
        return { sexpr: new GlobTrie.Expression(str.charAt(1)), string: str.substring(2) };
    }
    else if (first == "*" || first == "?") {
        return { sexpr: new GlobTrie.Expression(":" + first), string: str.substring(1) };        
    }
    else {
        return { sexpr: new GlobTrie.Expression(first), string: str.substring(1) };
    }
};

// The recursive function that adds an expression to the tree with a payload
GlobTrie.add = function(node, expr, payload) {
    if (expr.length == 0) {
        // we've reached terminal state, so drop our payload
        node.addPayload(payload);
    }
    else {
        var x = new GlobTrie.Expression.nextExpr(expr);
        var m;
        
        // find any matching children        
        for (var i = 0, len = node.children.length; i < len; i++) {
            var child = node.children[i];
        
            if (child.sexpr.equals(x.sexpr)) {
                m = child;
                break;
            }
        }
        
        if (!m) {
            // we didn't get a match, so create it!
            m = new GlobTrie.Node(node, x.sexpr);
            node.addChild(m);
        }
        
        // now descend down, shifting the "sexpr" off the evaluation string
        GlobTrie.add(m, x.string, payload);
    }
};

// The recursive function that walks the tree, searching for s, calling f at each matching node
GlobTrie.walk = function(node, s, f) {
    function recurseChildren(rstr) {
        for (var i = 0, len = node.children.length; i < len; i++) {
		    GlobTrie.walk(node.children[i], rstr, f);
		}
    }

    // If we're at the root, don't even try to match, just go for it
    if (node.isRoot()) {
        recurseChildren(s);
    }
    else {
        var m = node.sexpr.match(s.charAt(0));
        
        if (m == -1) {
            // holy crap, we've got a match, but now we've got to really work hard to try to find
            // a child that matches ANY character in the rest of the string.
            f(node);
            
            // move forward in the string one char at a time, trying all children
            for (var i = 0, len = s.length; i < len; i++) {
                recurseChildren(s.substring(i));
            }
        }
    	else if (m == 1) {
    	    // we're actually at a terminal state, so go ahead and call the func
    	    if (s.length == 1) {                
    	        f(node);
    	    }
        	
        	// So we have matched either the single-char wildcard or the exact match, we're good, move forth
        	recurseChildren(s.substring(1));
    	}
    }
};

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
