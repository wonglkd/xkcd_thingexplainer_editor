define("ace/mode/upwriter_highlight_rules",["require","exports","module","ace/lib/oop","ace/mode/text_highlight_rules"], function(require, exports, module) {
  "use strict";

var oop = require("../lib/oop");
var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

var UpwriterHighlightRules = function() {

    // regexp must not have capturing parentheses. Use (?:) instead.
    // regexps are ordered -> the first match is used

    this.$rules =
        {
    "start": [
        {
            "token" : "suffix",
            "regex" : "['’][a-zA-Z]+"
        },
        {
            "token" : "allowed",
            "regex" : "\\b(?:" + window.__WORDS + ")\\b",
            "caseInsensitive": true
        },
        {
            "token" : "disallowed",
            "regex" : "[a-zA-Z]+"
        }
    ]
}

};

oop.inherits(UpwriterHighlightRules, TextHighlightRules);

exports.UpwriterHighlightRules = UpwriterHighlightRules;
});


define("ace/mode/upwriter",["require","exports","module","ace/lib/oop","ace/mode/text","ace/mode/upwriter_highlight_rules"], function(require, exports, module) {
"use strict";

var oop = require("../lib/oop");
var TextMode = require("./text").Mode;
var UpwriterHighlightRules = require("./upwriter_highlight_rules").UpwriterHighlightRules;

var Mode = function() {
    this.HighlightRules = UpwriterHighlightRules;
};
oop.inherits(Mode, TextMode);

Mode.prototype.$id = "ace/mode/upwriter";

// // optimized, hence ugly for loops
// Mode.prototype.getFirstDisallowed = function(editor) {
//   var session = editor.getSession();
//   var i, j, line, first, lines = session.doc.getAllLines();
//   outer: for (i = 0; i < lines.length; i++) {
//     line = session.getTokens(i);
//     for (j = 0; j < line.length; j++) {
//       if (line[j].type === "disallowed") {
//         first = line[j].value;
//         break outer;
//       }
//     }
//   }
//   return first;
// };

Mode.prototype.getStats = function(editor) {
  let session = editor.getSession();

  var valid_words = window.__WORDS.split("|");

  var lines = session.doc.getAllLines();
  var tokens = [];
  function isNotSpace(obj) {
    return obj.value.trim() != "";
  }
  for (var i = 0; i < lines.length; i++) {
    tokens = tokens.concat(session.getTokens(i).filter(isNotSpace));
  }

  function isWord(tk) {
    return tk.type == "allowed" || tk.type == "disallowed";
  }
  var only_words = tokens.filter(isWord);

  // Get sentences.
  var sentences_with_punc = [[]];
  var sentences_wout_punc = [[]];
  var end_of_sentence = ['.', '?'];
  for (var i = 0; i < tokens.length; i++) {
    if (end_of_sentence.some(function (a) { return tokens[i].value.indexOf(a) > -1; })) {
      sentences_with_punc.push([]);
      sentences_wout_punc.push([]);
    } else {
      if (isWord(tokens[i])) {
        sentences_wout_punc[sentences_wout_punc.length-1].push(tokens[i].value);
      }
      sentences_with_punc[sentences_with_punc.length-1].push(tokens[i].value);
    }
  }
  sentences_wout_punc.pop();
  sentences_with_punc.pop();

  // Full text.
  var full_text = editor.getValue().toLowerCase();

  //////////////////////////////////
  // Do processing on tokens here. /
  //////////////////////////////////

  // Products of lengths of sentences in story.
  var products_of_sentence_lengths = 1;
  for (var i = 0; i < sentences_wout_punc.length; i++) {
    products_of_sentence_lengths *= sentences_wout_punc[i].length;
  }
  var max_fac_div = 1;
  var max_fac_n = 1;
  for (max_fac_n = 1; ; max_fac_n++) {
    max_fac_div *= max_fac_n;
    if (max_fac_div > products_of_sentence_lengths) {
      break;
    }
  }
  while (products_of_sentence_lengths % max_fac_div != 0) {
    max_fac_div /= max_fac_n;
    max_fac_n--;
  }

  // Longest increasing sequence.
  var longest_run = [];
  var current_run = [];
  if (only_words.length > 0) {
    current_run.push(only_words[0].value);
  }
  for (var i = 1; i < only_words.length; i++) {
    if (only_words[i-1].value.toLowerCase() < only_words[i].value.toLowerCase()) {
      current_run.push(only_words[i].value);
    } else {
      current_run = [only_words[i].value];
    }
    if (longest_run.length < current_run.length) {
      longest_run = current_run;
    }
  }

  // Elements.
  // var filtered_elements = window.__ELEMENTS.split("|");
  var filtered_elements = __FILTERED_ELEMENTS.toLowerCase().split("|");
  var max_element_run = [];
  var curr_element_run = [];
  for (var i = 0; i < only_words.length; i++) {
    if (filtered_elements.indexOf(only_words[i].value.toLowerCase()) > -1) {
      curr_element_run.push(only_words[i].value);
    } else {
      curr_element_run = [];
    }
    if (max_element_run.length < curr_element_run.length) {
      max_element_run = curr_element_run;
    }
  }

  // n-letter words.
  var bucket_words = [];
  for (var i = 1; i <= 14; i++) {
    bucket_words[i] = 0;
  }
  for (var i = 0; i < only_words.length; i++) {
    bucket_words[only_words[i].value.length]++;
  }
  for (var sc_n_letter_words = 14; sc_n_letter_words > 0; sc_n_letter_words--) {
    if (bucket_words[sc_n_letter_words] == sc_n_letter_words) break;
  }


  // Letters of alphabet.
  var buckets = [];
  for (var i = 65; i < 91; i++) {
    buckets[String.fromCharCode(i)] = 0;
  }
  for (var i = 1; i < only_words.length; i++) {
    var word = only_words[i].value.toUpperCase();
    for (var j = 0; j < word.length; j++) {
      var ch = word.charAt(j)
      buckets[ch]++;
    }
  }
  var odd_cnt = 0;
  Object.keys(buckets).forEach(function(key, idx) {
    if (this[key] % 2 == 1) {
      odd_cnt++;
    }
  }, buckets);

  // Oscars.
  var oscars = window.__DESIRED_OSCARS.split("|");
  var oscars_count = 0;
  for (var i = 0; i < oscars.length; i++) {
    if (full_text.indexOf(oscars[i].toLowerCase()) > -1) {
      oscars_count++;
    }
  }

  // END.
  // console.log(tokens);
  // console.log(sentences);

  return {
    "words": only_words.length,
    "sentences": sentences_wout_punc.length,
    "scores": {
      "max_fac_n": {
        "raw": max_fac_n,
        "score": max_fac_n,
        "extra_info": {
          "sen_product": products_of_sentence_lengths,
          "max_fac_div": max_fac_div,
        },
      },
      "longest_increasing_run": {
        "raw": longest_run.length,
        "score": 3 * Math.sqrt(longest_run.length),
        "max": 3 * Math.sqrt(250),
        "extra_info": longest_run.join(" "),
      },
      "element_run": {
        "raw": max_element_run.length,
        "score": Math.log(118) * Math.sqrt(max_element_run.length),
        "max": Math.log(118) * Math.sqrt(__FILTERED_ELEMENTS.length),
        "extra_info": max_element_run.join(" "),
      },
      "odd_cnt": {
        "raw": odd_cnt,
        "score": Math.pow(odd_cnt-13, 2)/13,
        "max": 13,
      },
      "n_letter_words": {
        "raw": sc_n_letter_words,
        "score": sc_n_letter_words,
        "max": 11,
        "extra_info": bucket_words,
      },
      "oscars": {
        "raw": oscars_count,
        "score": Math.log(87) * Math.min(5, oscars_count),
        "max": 22.33,
      },
    }
  };
};

Mode.prototype.onScoringAllowed = function(editor, cb) {
  let self = this;
  editor.getSession().on('change', debounce(function() {
    cb(self.getStats(editor));
  }, 500));
};

Mode.prototype.getDisallowed = function (editor) {
  var session = editor.getSession();
  return Object.keys(Array.apply(this, Array(session.doc.getAllLines().length)).reduce(function(m, _nil, i) {
    session.getTokens(i).forEach(function(token) {
      if (token.type === "disallowed") m[token.value] = true;
    });
    return m;
  }, {}));
}


Mode.prototype.onRecalculateAllowed = function(editor, cb) {
  var self = this;
  editor.getSession().on('change', debounce(function() {
    cb(self.getDisallowed(editor));
  }, 500));
};

exports.Mode = Mode;

function debounce(fn, delay) {
  return function() {
    fn.args = arguments;
    fn.timeout_id && clearTimeout(fn.timeout_id);
    fn.timeout_id = setTimeout(function() { return fn.apply(fn, fn.args); }, delay);
  };
}

});