// Canonical
// ---------

// The following examples are reproductions of [Mike Bostock's][mike] General
// Update Pattern examples. They are presented here so that you may compare how
// d3-gup relates to the conventional approach.
//
// The following global helpers are used for each example.
//
// [mike]: https://bl.ocks.org/mbostock "Mike Bostock's Blocks"
var examples = [];
var alphabet = "abcdefghijklmnopqrstuvwxyz".split("");

function randomSample(data) {
  return d3.shuffle(data)
    .slice(0, Math.floor(Math.random() * data.length))
    .sort();
}

// *This example is a reproduction of [General Update Pattern, I][gup-1].*
//
// In this example we create a GUP factory that can be bound to data, which
// produces a GUP instance. A GUP instance can be called against a D3 selection,
// which preforms a data-join and executes a set of update functions.
//
// The GUP factory is rebound to random letters of the alphabet and called at
// regular intervals in a D3 timer.
//
// [gup-1]: https://bl.ocks.org/mbostock/3808218 "Mike Bostock's Block 3808218"
examples[0] = {
  tick() {
    examples[0].root.call(examples[0].gup(randomSample(alphabet)));
  },
  timer: d3.interval(() => examples[0].tick(), 1500),

  // The GUP instance is called on a D3 selection that contains a single `g`
  // element inside a `svg` element.
  root: d3.select("svg#example-1")
    .attr("width", 450)
    .attr("height", 100)
    .append("g")
    .attr("transform", "translate(16 50)"),

  // This creates our GUP factory, ready to configure with our phase functions.
  gup: d3.gup()
    // `select` occurs prior to the data-join; here we select old `text` elements,
    // if any.
    .select($ => $.selectAll("text"))
    // `pre` is applied to old elements; `update` class colours them blue.
    .pre($ => $.attr("class", "update"))
    // `enter` creates new elements as needed; `enter` class colours them green.
    .enter($ => $.append("text")
      .attr("class", "enter")
      .attr("dy", ".35em")
      .attr("x", (d, i) => i * 16))
    // `post` is applied to the merged set of new and old elements; here we lay
    // them out in a line.
    .post($ => $.text(d => d))
    // `exit` is applied to elements that no longer have bound data; here we
    // simply remove them.
    //
    // The overall effect is that we see green letters when the list grows and
    // only blue letters when the list shrinks. The association between
    // individual letters and their colour is lost because no key function is
    // specified whilst binding the data.
    .exit($ => $.remove())
};

// *This example is a reproduction of [General Update Pattern, II][gup-2].*
//
// In this example we provide the key function that was missing from the
// previous example.
//
// [gup-2]: https://bl.ocks.org/mbostock/3808221 "Mike Bostock's Block 3808221"

// As before, we setup a D3 timer to a `g` element but this time the identity
// function is passed as the key function when the data is bound to the GUP.
examples[1] = {
  tick() {
    examples[1].root.call(examples[1].gup(randomSample(alphabet), d => d));
  },
  timer: d3.interval(() => examples[1].tick(), 1500),

  root: d3.select("#example-2")
    .attr("width", 450)
    .attr("height", 100)
    .append("g")
    .attr("transform", "translate(16 50)"),

  // As before, we create our GUP and configure it. No change to `select` or
  // `pre` either.
  gup: d3.gup()
    .select($ => $.selectAll("text"))
    .pre($ => $.attr("class", "update"))
    // `enter` is where the `text` content is applied since it will remain
    // constant, by virtue of the key function.
    .enter($ => $.append("text")
      .attr("class", "enter")
      .attr("dy", ".35em")
      .text(d => d))
    // However, the elements will change position in the list (agian, thanks to
    // the key function), thus `post` is where we set the horizontal position.
    .post($ => $.attr("x", (d, i) => i * 16))
    // No change to `exit`.
    .exit($ => $.remove())
};

// *This example is a reproduction of [General Update Pattern, III][gup-3].*
//
// In the previous example we provided the key function to communicate a sense
// of object constancy.  This effect is completed with the addition of
// transitions.
//
// [gup-3]: https://bl.ocks.org/mbostock/3808234 "Mike Bostock's Block 3808234"

// As before, we setup a D3 timer to a `g` element.
examples[2] = {
  tick() {
    examples[2].root.call(examples[2].gup(randomSample(alphabet), d => d));
  },
  timer: d3.interval(() => examples[2].tick(), 1500),

  root: d3.select("#example-3")
    .attr("width", 450)
    .attr("height", 100)
    .append("g")
    .attr("transform", "translate(16 50)")
    // The `g` element is created the same way but now we introduce a
    // transition.
    .transition()
      .duration(750),

  // As before, we create our GUP and configure it.  We must now pay closer
  // attention to the elements vertical and horizontal position so that it will
  // be animated during the transition and also to the opacity to produce
  // fade-in and fade-out effects.
  gup: d3.gup()
    .select($ => $.selectAll("text"))
    .pre($ => $.attr("class", "update"))
    .enter($ => $.append("text")
      .attr("class", "enter")
      .attr("dy", ".35em")
      .text(d => d)
      // Elements will begin positioned above the list and horizontally correct.
      .attr("y", -60)
      .attr("x", (d, i) => i * 16)
      .style("fill-opacity", 1e-6))
    // Elements final position will be in the list; existing elements will
    // traval horizontally.
    .post($ => $.attr("x", (d, i) => i * 16)
      .attr("y", 0)
      .style("fill-opacity", 1))
    // Exiting elements will drop below the list and fade out and then removed
    // when the transition completes.
    .exit($ => $.attr("class", "exit")
      .attr("y", 60)
      .style("fill-opacity", 1e-6)
      .remove())
};

// Composition
// -----------
//
// Composition allows us to separate concerns into individuals modules and then
// combined them in different ways.  Creating small modules promotes greater
// reuse of software components.
//
// In this example we reproduce the previous example by reusing the GUP created
// in the second example.
//
// The only substantial difference is in the construction of the GUP.
examples[3] = {
  tick() {
    examples[3].root.call(examples[3].gup(randomSample(alphabet), d => d));
  },
  timer: d3.interval(() => examples[3].tick(), 1500),

  root: d3.select("#example-4")
    .attr("width", 450)
    .attr("height", 100)
    .append("g")
    .attr("transform", "translate(16 50)")
    .transition()
      .duration(750),

  // Two or more GUPs can be composed together with a call to `gupCompose`.
  gup: d3.gupCompose(
    // All the additional logic is contained in its own GUP.
    //
    // The rightmost GUP will be the innermost call and hence the first to be
    // executed.  This is particularly important for the enter phase where the
    // element must be created before anything else.
    d3.gup()
      .enter($ => $
        .attr("y", -60)
        .attr("x", (d, i) => i * 16)
        .style("fill-opacity", 1e-6))
      .post($ => $
        .attr("y", 0)
        .style("fill-opacity", 1))
      // The `remove` call can occur at anytime since it is deferred until the
      // transition completes.
      .exit($ => $
        .attr("class", "exit")
        .attr("y", 60)
        .style("fill-opacity", 1e-6)),
    // The original GUP is passed untouched.
    examples[1].gup
  )
};
