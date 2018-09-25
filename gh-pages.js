$('[id^="example-"]').each(function() {
  var eg = $(this);
  var el = $('.content .highlight .html:empty', eg.next('.example'))
    .text(unindent(eg.html()))
    .get(0);
  if (el) hljs.highlightBlock(el);
});
$('pre code:not(.hljs)').each(function() { hljs.highlightBlock(this); });
function unindent(str) {
  var lines = str.split('\n');
  var indent = -1;
  var fixed = [];
  for (var i = 0, ii = lines.length; i < ii; i++) {
    if (lines[i] || fixed.length > 0) {
      if (indent < 0) {
        indent = lines[i].search(/\S/);
      }
      fixed.push(lines[i].substring(indent));
    }
  }
  return fixed.join('\n').replace(/\s+$/, '');
}

console.log("%cI see you've come to play! Welcome! All the elements mentioned in the examples are actually in the DOM, and jQuery is here too!", 'font:16px/24px sans-serif;color:#30404f;background-color:#fff');

if (IntersectionObserver)
  examples.forEach(eg =>
    new IntersectionObserver(
      entries => entries.forEach(
        e => {
          if (e.isIntersecting) {
            eg.timer.stop();
            eg.tick();
            eg.timer = d3.interval(eg.tick, 1500);
          } else {
            eg.timer.stop();
          }
        }
      )
    )
    .observe(eg.root.node().parentElement)
  );
