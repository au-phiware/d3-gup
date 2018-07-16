import { selection } from 'd3-selection';
import { transition } from 'd3-transition';

export function empty() {}

export default function gup() {
  let pre = null
    , exit = null
    , enter = null
    , post = null
  ;
  function gup(data, ...more) {
    if (data instanceof selection || data instanceof transition) {
      return gup.apply(this, more)(data);
    }
    function _gup(...args) {
      let context = args.shift();
      let shouldTransition = !!context.selection;
      let selection = shouldTransition ? context.selection() : context;

      let $pre = selection.data(data, more[0]);
      if (pre && pre != empty) {
        let preT = $pre
        if (shouldTransition && $pre.transition) {
          preT = $pre.transition(context);
        }
        preT.call(pre, ...args);
      }

      if (exit && exit != empty) {
        let $exit = $pre.exit();
        if (shouldTransition && $exit.transition) {
          $exit = $exit.transition(context);
        }
        $exit.call(exit, ...args);
      }

      let $enter = $pre.enter();
      if (enter && enter != empty) {
        $enter = enter.call(this, $enter, ...args);
      }

      if (post && post != empty) {
        let $post = $enter.merge($pre)
        if (shouldTransition && $post.transition) {
          $post = $post.transition(context);
        }
        $post.call(post, ...args);
      }
    }

    _gup.data = function(..._) {
      return arguments.length ? ([data, ...more] = _, this) : [data, ...more];
    }

    return _gup;
  }

  gup.pre = function(_) {
    return arguments.length ? (pre = _, this) : (pre || empty);
  }

  gup.exit = function(_) {
    return arguments.length ? (exit = _, this) : (exit || empty);
  }

  gup.enter = function(_) {
    return arguments.length ? (enter = _, this) : (enter || empty);
  }

  gup.post = function(_) {
    return arguments.length ? (post = _, this) : (post || empty);
  }

  gup.update = function(...args) {
    switch (arguments.length) {
      case 0: return [
        pre || empty,
        exit || empty,
        enter || empty,
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
