export function empty() {}

export default function gup() {
  let pre = null
    , exit = null
    , enter = null
    , post = null
  ;
  function gup(data, _) {
    if (arguments.length > 1) {
      return gup.call(this, _)(data);
    }
    return function(context) {
      let shouldTransition = !!context.selection;
      let selection = shouldTransition ? context.selection() : context;

      let $pre = selection.data(data);
      if (pre && pre != empty) {
        let preT = $pre
        if (shouldTransition && $pre.transition) {
          preT = $pre.transition(context);
        }
        preT.call(pre);
      }

      if (exit && exit != empty) {
        let $exit = $pre.exit();
        if (shouldTransition && $exit.transition) {
          $exit = $exit.transition(context);
        }
        $exit.call(exit);
      }

      let $enter = $pre.enter();
      if (enter && enter != empty) {
        $enter = enter.call(this, $enter);
      }

      if (post && post != empty) {
        let $post = $enter.merge($pre)
        if (shouldTransition && $post.transition) {
          $post = $post.transition(context);
        }
        $post.call(post);
      }
    }
  }

  gup.pre = function(_) {
    return arguments.length ? (pre = _, gup) : (pre || empty);
  }

  gup.exit = function(_) {
    return arguments.length ? (exit = _, gup) : (exit || empty);
  }

  gup.enter = function(_) {
    return arguments.length ? (enter = _, gup) : (enter || empty);
  }

  gup.post = function(_) {
    return arguments.length ? (post = _, gup) : (post || empty);
  }

  gup.update = function(...args) {
    switch (arguments.length) {
      case 0: return [pre || empty, exit || empty, enter || empty, post || empty];
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
    return gup;
  }

  return gup;
}
