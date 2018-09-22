import {default as gup, empty, identity} from './gup';

// Introduction
// ============
// 
// One of the key ideas of d3-gup is that GUP factories can be composed, whereby
// the functions of each phase are composed together to form a single GUP
// factory that can then be bound to data and called against a selection.
// Not only do we compose the phase functions together but we also merge the
// remaining properties of the GUP factories in the hope that they don't
// conflict with each other and the resulting GUP factory can be used as if it
// was any one of its component GUP factories.

// These properties are not to be touched during the merge.
const nonEnumerableProps = /^(valueOf|isPrototypeOf|to(Locale)?String|propertyIsEnumerable|hasOwnProperty|pre|exit|enter|post|update|select)$/;

// `comp` does the bulk of the work to compose gups together for a given phase.
function comp(gups, name) {
  // Only `enter` and `select` functions make use of the return value.
  let forward = name === "enter" || name === "select";
  // `f` is the resulting function that calls each phase function in gups in
  // turn.  `f` is designed to be passed to the [`call`][selection_call]
  // function, therefore the first argument will be a Selection.
  //
  // [selection_call]: https://github.com/d3/d3-selection#selection_call "Selection#call (d3-selection)"
  let f = function(...args) {
    for (let g of gups) {
      // Extract the phase function from `g` and call it if it's not a no-op
      if (name in g && g[name] && (g = g[name]()) && g !== empty && g !== identity) {
        // `this` and args are passed through
        var result = g.apply(this, args);
        // The selection may have been transformed by either `enter` or
        // `select`, therefore we must carry it forward as the first argument.
        if (forward) args[0] = result;
      }
    }
    // Only `enter` and `select` functions should return anything.
    if (forward) return result;
  };
  return f;
}

// `compose` acts like Underscore's [`extend`][extend] function followed by
// Underscore's [`compose`][compose] function, but returns a new GUP factory
// (none of the sources are mutated).  For the extend part the sources are read
// from left to right; properties of the rightmost source may override the
// properties of sources on the left.  For the compose part sources are read
// from right to left; the rightmost source will be the the innermost call and
// called first, passing results to the source on it left.
//
// [extend]: https://underscorejs.org/#extend "_.extend"
// [compose]: https://underscorejs.org/#compose "_.compose"
export default function compose(...sources) {
  let g = gup();

  // Perform the extend for each property in each source, assign it to `g`.
  for (let source of sources) {
    for (let k in source) {
      // Skip the pharse functions the the non-enumerble properties of `Object`.
      if (!nonEnumerableProps.test(k)) {
        g[k] = source[k];
      }
    }
  }

  // Perform the compose for each of the five phase functions.
  sources = sources.reverse();
  g.select(comp(sources, "select"));
  g.pre(comp(sources, "pre"));
  g.exit(comp(sources, "exit"));
  g.enter(comp(sources, "enter"));
  g.post(comp(sources, "post"));

  // Returns the freshly minted GUP factory.
  return g;
}
