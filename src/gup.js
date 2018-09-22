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
export default function gup() {
  // Internally, `null` represents an no-op for any phase.
  let pre = null
    , exit = null
    , enter = null
    , post = null
    , select = null
  ;
  // The factory accepts the same arguments as [Selection#data][selection_data]
  // but the data-join is deferred until it is called against a selection.
  //
  // [selection_data]: https://github.com/d3/d3-selection#selection_data "Selection#data (d3-selection)"
  function gup(data, ...more) {
    // A GUP instance, bound to `data`, executes the five phases when called on
    // a selection.  In other words, the returned function from a GUP factory is
    // designed to be passed to the [`call`][selection_call] function of a
    // selection.
    //
    // [selection_call]: https://github.com/d3/d3-selection#selection_call "Selection#call (d3-selection)"
    function _gup(...args) {
      // The first argument is expected to be a [Selection][selection] or a
      // [Transition][transition] instance.  The remaining arguments are the
      // optional arguments passed to the [`call`][selection_call] call, which
      // are passed through to each of the five phase functions.
      //
      // [selection]: https://github.com/d3/d3-selection#selection "Selection (d3-selection)"
      // [transition]: https://github.com/d3/d3-transition#transition "Transition (d3-transition)"
      // [selection_call]: https://github.com/d3/d3-selection#selection_call "Selection#call (d3-selection)"
      let context = args.shift();
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
      let shouldTransition = !!context.selection;
      // `selection` will not be a [`Transition`][transition] instance, instead
      // it will be a real [`Selection`][selection] instance.  This is necessary
      // because we cannot call [`data`][selection_data] on a transition.
      // Beyond this point, `context` is assumed to be a `Transition` instance.
      //
      // [transition]: https://github.com/d3/d3-transition#transition "Transition (d3-transition)"
      // [selection]: https://github.com/d3/d3-selection#selection "Selection (d3-selection)"
      // [selection_data]: https://github.com/d3/d3-selection#selection_data "Selection#data (d3-selection)"
      let selection = shouldTransition ? context.selection() : context;

      // Phase 0: `selection` can potentially be transformed by the `select`
      // function.
      if (select && select != identity) {
        selection = select.call(this, selection, ...args);
        if (selection.selection) {
          shouldTransition = true;
          context = selection;
          selection = selection.selection();
        }
      }

      // The data-join!
      // Here we now pass the data and an optional key function that was passed
      // to the GUP factory (that made this GUP instance).
      selection = selection.data(data, more[0]);

      // Phase 1: the `pre` function is applied to the pre-existing elements
      // with bound data.
      if (pre && pre != empty) {
        let $pre = selection
        // If this GUP instance was applied to a transition then we forward the
        // transition to the `pre` function.
        if (shouldTransition && selection.transition) {
          $pre = selection.transition(context);
        }
        $pre.call(pre, ...args);
      }

      // Phase 2: almost identical to phase 1, except we make a call to
      // [`exit`][selection_exit].
      //
      // [selection_exit]: https://github.com/d3/d3-selection#selection_exit "Selection#exit (d3-selection)"
      if (exit && exit != empty) {
        let $exit = selection.exit();
        // Again, the same transition is forwarded to the `exit` function.
        if (shouldTransition && $exit.transition) {
          $exit = $exit.transition(context);
        }
        $exit.call(exit, ...args);
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
      let $enter = selection.enter();
      if (enter && enter != identity) {
        $enter = enter.call(this, $enter, ...args);
        if ($enter.selection) {
          shouldTransition = true;
          context = $enter;
          $enter = $enter.selection();
        }
      }

      // Phase 4: the `post` function is applied to the final set of elements
      // bound to the data.
      let $post = $enter.merge(selection)
      // The third and final time that the transition is forwarded.
      if (shouldTransition && $post.transition) {
        $post = $post.transition(context);
      }
      if (post && post != empty) {
        $post.call(post, ...args);
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
    _gup.data = function(..._) {
      return arguments.length ? ([data, ...more] = _, this) : [data, ...more];
    }

    return _gup;
  }

  // `select` sets the initial phase to the specified function, passing `null`
  // resets the phase to its default (identity function), and returns the GUP
  // factory.  If no arguments are specified, returns the current `select`
  // function, which is guaranteed to be a function.
  gup.select = function(_) {
    return arguments.length ? (select = _, this) : (select || identity);
  }

  // `pre` sets the first phase to the specified function, passing `null` resets
  // the phase to its default (empty function), and returns the GUP factory.  If
  // no arguments are specified, returns the current `pre` function, which is
  // guaranteed to be a function.
  gup.pre = function(_) {
    return arguments.length ? (pre = _, this) : (pre || empty);
  }

  // `exit` sets the second phase to the specified function, passing `null`
  // resets the phase to its default (empty function), and returns the GUP
  // factory.  If no arguments are specified, returns the current `exit`
  // function, which is guaranteed to be a function.
  gup.exit = function(_) {
    return arguments.length ? (exit = _, this) : (exit || empty);
  }

  // `enter` sets the third phase to the specified function, passing `null`
  // resets the phase to its default (identity function), and returns the GUP
  // factory.  If no arguments are specified, returns the current `enter`
  // function, which is guaranteed to be a function.
  gup.enter = function(_) {
    return arguments.length ? (enter = _, this) : (enter || identity);
  }

  // `post` sets the fourth phase to the specified function, passing `null`
  // resets the phase to its default (empty function), and returns the GUP
  // factory.  If no arguments are specified, returns the current `post`
  // function, which is guaranteed to be a function.
  gup.post = function(_) {
    return arguments.length ? (post = _, this) : (post || empty);
  }

  // `update` is a shorthand for setting the four update phase functions, `pre`,
  // `exit`, `enter` and `post` in that sequence.  If no functions are specified
  // then the four functions are returned in an array in the aforementioned
  // order.
  gup.update = function(...args) {
    switch (arguments.length) {
      case 0: return [
        pre || empty,
        exit || empty,
        enter || identity,
        post || empty
      ];
      case 1:
        [pre] = args;
        break;
      case 2:
        [pre, exit] = args;
        break;
      case 3:
        [pre, exit, enter] = args;
        break;
      default:
        [pre, exit, enter, post] = args;
    }
    return this;
  }

  return gup;
}

// `empty` is checked and considered an no-op for the `pre`, `exit` and `post`
// functions.
export function empty() {}

// `identity` is checked and considered an no-op for the `select` and `enter`
// functions.
export function identity($) { return $; }
