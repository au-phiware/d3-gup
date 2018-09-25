(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.d3 = global.d3 || {})));
}(this, (function (exports) { 'use strict';

  // Introduction
  // ============
  //
  // The aim of d3-gup is to codify the [General Update Pattern][GUP-I] as
  // described by [Selection#data][selection_data].  In doing so, we create a
  // callable D3 [plugin][d3-plugin] that is intended to extend D3 rather than
  // wrap or conceal its features.  This plugin is designed to be composable with
  // other D3 plugins.
  //
  // Firstly, a quick recap of the General Update Pattern (GUP).  GUP describes
  // the order of operations that conventional follows a [data-join][d3-join].
  // Once a selection is made against the DOM the first phase of updates is
  // conducted upon the selected elements that are pre-existing and will remain in
  // the DOM.  The second phase of updates are applied to exit selection, i.e.
  // those elements that are pre-existing in the DOM but will no longer be bound
  // to data.  The third phase creates and binds elements for the enter selection,
  // i.e. those elements that don't yet exist but will be bound to data.  The
  // fourth and final phase provides an opportunity to update the final selection
  // that is bound to the data, i.e. the merged selections of enter and
  // pre-existing elements.
  //
  // The plugin exports a factory that encapsulates these four update phases, we
  // also recognise an initial phase (phase zero) that allows a plugin user to
  // modify the selection before the data-join occurs.  This initial phase is
  // important since a GUP factory is independent of a particular data array but
  // often dependent on the shape of the data, e.g. flat vs. heirarchical.  Being
  // albe to hook in before the data-join allow GUP authors to dictate the shape
  // of the selection.
  //
  // [GUP-I]: https://bl.ocks.org/mbostock/3808218 "General Update Pattern, I"
  // [selection_data]: https://github.com/d3/d3-selection#selection_data "Selection#data (d3-selection)"
  // [d3-plugin]: https://github.com/d3/d3/wiki/Plugins "Plugins"
  // [d3-join]: https://bost.ocks.org/mike/join/ "Thinking with Joins"

  // `gup` creates a factory of GUP instances that, when bound to a data array,
  // can be called on a selection.
  function gup() {
    // Internally, `null` represents an no-op for any phase.
    var pre = null
      , exit = null
      , enter = null
      , post = null
      , select = null
    ;
    // The factory accepts the same arguments as [Selection#data][selection_data]
    // but the data-join is deferred until it is called against a selection.
    //
    // [selection_data]: https://github.com/d3/d3-selection#selection_data "Selection#data (d3-selection)"
    function gup(data) {
      var more = [], len = arguments.length - 1;
      while ( len-- > 0 ) more[ len ] = arguments[ len + 1 ];

      // A GUP instance, bound to `data`, executes the five phases when called on
      // a selection.  In other words, the returned function from a GUP factory is
      // designed to be passed to the [`call`][selection_call] function of a
      // selection.
      //
      // [selection_call]: https://github.com/d3/d3-selection#selection_call "Selection#call (d3-selection)"
      function _gup() {
        var args = [], len = arguments.length;
        while ( len-- ) args[ len ] = arguments[ len ];

        // The first argument is expected to be a [Selection][selection] or a
        // [Transition][transition] instance.  The remaining arguments are the
        // optional arguments passed to the [`call`][selection_call] call, which
        // are passed through to each of the five phase functions.
        //
        // [selection]: https://github.com/d3/d3-selection#selection "Selection (d3-selection)"
        // [transition]: https://github.com/d3/d3-transition#transition "Transition (d3-transition)"
        // [selection_call]: https://github.com/d3/d3-selection#selection_call "Selection#call (d3-selection)"
        var context = args.shift();
        // We have made a conscious to not depend directly on `d3-selection` or
        // `d3-transition` for a variety of reasons.  Instead, we consider any
        // object that has a `selection` method to be a [`Transition`][transition]
        // instance.  The only requirements on this transition-like instance is
        // that this selection method returns a [`Selection`][selection] instance
        // and the object is accepted by the [`transition`][selection_transition]
        // method of a `Selection` instance.
        //
        // [transition]: https://github.com/d3/d3-transition#transition "Transition (d3-transition)"
        // [selection]: https://github.com/d3/d3-selection#selection "Selection (d3-selection)"
        // [selection_transition]: https://github.com/d3/d3-transition#selection_transition "Selection#transition (d3-transition)"
        var shouldTransition = !!context.selection;
        // `selection` will not be a [`Transition`][transition] instance, instead
        // it will be a real [`Selection`][selection] instance.  This is necessary
        // because we cannot call [`data`][selection_data] on a transition.
        // Beyond this point, `context` is assumed to be a `Transition` instance.
        //
        // [transition]: https://github.com/d3/d3-transition#transition "Transition (d3-transition)"
        // [selection]: https://github.com/d3/d3-selection#selection "Selection (d3-selection)"
        // [selection_data]: https://github.com/d3/d3-selection#selection_data "Selection#data (d3-selection)"
        var selection = shouldTransition ? context.selection() : context;

        // Phase 0: `selection` can potentially be transformed by the `select`
        // function.
        if (select && select != identity) {
          selection = select.call.apply(select, [ this, selection ].concat( args ));
        }

        // The data-join!
        // Here we now pass the data and an optional key function that was passed
        // to the GUP factory (that made this GUP instance).
        selection = selection.data(data, more[0]);

        // Phase 1: the `pre` function is applied to the pre-existing elements
        // with bound data.
        if (pre && pre != empty) {
          var $pre = selection;
          // If this GUP instance was applied to a transition then we forward the
          // transition to the `pre` function.
          if (shouldTransition && selection.transition) {
            $pre = selection.transition(context);
          }
          $pre.call.apply($pre, [ pre ].concat( args ));
        }

        // Phase 2: almost identical to phase 1, except we make a call to
        // [`exit`][selection_exit].
        //
        // [selection_exit]: https://github.com/d3/d3-selection#selection_exit "Selection#exit (d3-selection)"
        if (exit && exit != empty) {
          var $exit = selection.exit();
          // Again, the same transition is forwarded to the `exit` function.
          if (shouldTransition && $exit.transition) {
            $exit = $exit.transition(context);
          }
          $exit.call.apply($exit, [ exit ].concat( args ));
        }

        // Phase 3: unique among the update phases, like the `select` function,
        // `enter` has the opportunity to transform the selection.  The return
        // value of the `enter` function is immediately [merged][selection_merge]
        // with the data-join selection which is subsequently returned by this
        // GUP.  Furthermore, the transition is not forwarded to the `enter`
        // function because its work is typically to create the elements, meaning
        // that there is no prior state to transition to (the transition should
        // occur during the next phase).
        //
        // [selection_merge]: https://github.com/d3/d3-selection#selection_merge "Selection#merge (d3-selection)"
        var $enter = selection.enter();
        if (enter && enter != identity) {
          $enter = enter.call.apply(enter, [ this, $enter ].concat( args ));
        }

        // Phase 4: the `post` function is applied to the final set of elements
        // bound to the data.
        var $post = $enter.merge(selection);
        // The third and final time that the transition is forwarded.
        if (shouldTransition && $post.transition) {
          $post = $post.transition(context);
        }
        if (post && post != empty) {
          $post.call.apply($post, [ post ].concat( args ));
        }

        // The returned selection or potentially a transition is (as mentioned
        // above) the update selection from the data-join merged into the return
        // value of the `enter` function, which, by default, will be the newly
        // created elements.  Therefore this selection/transition should be all
        // the elements bound to the data.
        return $post;
      }

      // `data` sets the data array and optionally the key function and returns
      // the GUP instance.  If no arguments are specified, returns the current
      // data array and key function in an array.
      _gup.data = function() {
        var assign;

        var _ = [], len = arguments.length;
        while ( len-- ) _[ len ] = arguments[ len ];
        return arguments.length ? ((assign = _, data = assign[0], more = assign.slice(1), assign), this) : [data ].concat( more);
      };

      return _gup;
    }

    // `select` sets the initial phase to the specified function, passing `null`
    // resets the phase to its default (identity function), and returns the GUP
    // factory.  If no arguments are specified, returns the current `select`
    // function, which is guaranteed to be a function.
    gup.select = function(_) {
      return arguments.length ? (select = _, this) : (select || identity);
    };

    // `pre` sets the first phase to the specified function, passing `null` resets
    // the phase to its default (empty function), and returns the GUP factory.  If
    // no arguments are specified, returns the current `pre` function, which is
    // guaranteed to be a function.
    gup.pre = function(_) {
      return arguments.length ? (pre = _, this) : (pre || empty);
    };

    // `exit` sets the second phase to the specified function, passing `null`
    // resets the phase to its default (empty function), and returns the GUP
    // factory.  If no arguments are specified, returns the current `exit`
    // function, which is guaranteed to be a function.
    gup.exit = function(_) {
      return arguments.length ? (exit = _, this) : (exit || empty);
    };

    // `enter` sets the third phase to the specified function, passing `null`
    // resets the phase to its default (identity function), and returns the GUP
    // factory.  If no arguments are specified, returns the current `enter`
    // function, which is guaranteed to be a function.
    gup.enter = function(_) {
      return arguments.length ? (enter = _, this) : (enter || identity);
    };

    // `post` sets the fourth phase to the specified function, passing `null`
    // resets the phase to its default (empty function), and returns the GUP
    // factory.  If no arguments are specified, returns the current `post`
    // function, which is guaranteed to be a function.
    gup.post = function(_) {
      return arguments.length ? (post = _, this) : (post || empty);
    };

    // `update` is a shorthand for setting the four update phase functions, `pre`,
    // `exit`, `enter` and `post` in that sequence.  If no functions are specified
    // then the four functions are returned in an array in the aforementioned
    // order.
    gup.update = function() {
      var assign, assign$1, assign$2, assign$3;

      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];
      switch (arguments.length) {
        case 0: return [
          pre || empty,
          exit || empty,
          enter || identity,
          post || empty
        ];
        case 1:
          (assign = args, pre = assign[0]);
          break;
        case 2:
          (assign$1 = args, pre = assign$1[0], exit = assign$1[1]);
          break;
        case 3:
          (assign$2 = args, pre = assign$2[0], exit = assign$2[1], enter = assign$2[2]);
          break;
        default:
          (assign$3 = args, pre = assign$3[0], exit = assign$3[1], enter = assign$3[2], post = assign$3[3]);
      }
      return this;
    };

    return gup;
  }

  // `empty` is checked and considered an no-op for the `pre`, `exit` and `post`
  // functions.
  function empty() {}

  // `identity` is checked and considered an no-op for the `select` and `enter`
  // functions.
  function identity($) { return $; }

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
  var nonEnumerableProps = /^(valueOf|isPrototypeOf|to(Locale)?String|propertyIsEnumerable|hasOwnProperty|pre|exit|enter|post|update|select)$/;

  // `comp` does the bulk of the work to compose gups together for a given phase.
  function comp(gups, name) {
    // Only `enter` and `select` functions make use of the return value.
    var forward = name === "enter" || name === "select";
    // `f` is the resulting function that calls each phase function in gups in
    // turn.  `f` is designed to be passed to the [`call`][selection_call]
    // function, therefore the first argument will be a Selection.
    //
    // [selection_call]: https://github.com/d3/d3-selection#selection_call "Selection#call (d3-selection)"
    var f = function() {
      var this$1 = this;
      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];

      for (var i = 0, list = gups; i < list.length; i += 1) {
        // Extract the phase function from `g` and call it if it's not a no-op
        var g = list[i];

        if (name in g && g[name] && (g = g[name]()) && g !== empty && g !== identity) {
          // `this` and args are passed through
          var result = g.apply(this$1, args);
          // The selection may have been transformed by either `enter` or
          // `select`, therefore we must carry it forward as the first argument.
          if (forward) { args[0] = result; }
        }
      }
      // Only `enter` and `select` functions should return anything.
      if (forward) { return result; }
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
  function compose() {
    var sources = [], len = arguments.length;
    while ( len-- ) sources[ len ] = arguments[ len ];

    var g = gup();

    // Perform the extend for each property in each source, assign it to `g`.
    for (var i = 0, list = sources; i < list.length; i += 1) {
      var source = list[i];

      for (var k in source) {
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

  exports.gup = gup;
  exports.gupEmpty = empty;
  exports.gupIdentity = identity;
  exports.gupCompose = compose;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
