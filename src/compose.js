import gup from './gup';

const nonEnumerableProps = /^(valueOf|isPrototypeOf|to(Locale)?String|propertyIsEnumerable|hasOwnProperty|pre|exit|enter|post|update)$/;

function comp(fns, name) {
  let forward = name === "enter";
  let f = function(...args) {
    for (let f of fns) {
      if (name in f && f[name] && (f = f[name]())) {
        var result = f.apply(this, args);
        if (forward) args[0] = result;
      }
    }
    if (forward) return result;
  };
  return f;
}

export default function compose(...fns) {
  let f = gup();

  for (let source of fns) {
    for (let k in source) {
      if (!nonEnumerableProps.test(k)) {
        f[k] = source[k];
      }
    }
  }

  fns = fns.reverse();
  f.pre(comp(fns, "pre"));
  f.exit(comp(fns, "exit"));
  f.enter(comp(fns, "enter"));
  f.post(comp(fns, "post"));

  return f;
}
