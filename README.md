# d3-gup

[![release](https://img.shields.io/npm/v/d3-gup.svg)](https://www.npmjs.com/package/d3-gup)
[![license](https://img.shields.io/npm/l/d3-gup.svg)](https://opensource.org/licenses/BSD-3-Clause)

d3-gup is a functional and composable D3 plugin that codifies the [General
Update Pattern][gup-1] as described by [Selection#data][selection_data]. It
does not attempt to wrap D3 or provide abstractions to replace or conceal the
existing D3 features. Instead it provides the facilities for composition of
sets of functions to aid in the construction of components. d3-gup is aware
of D3 transitions and takes the appropriate actions in response to them.

The following examples are reproductions of [Mike Bostock's][mike] General
Update Pattern examples. They are presented here so that you may compare how
d3-gup relates to the conventional approach.

The globals below are used for each example.

```javascript
var examples = [];
var alphabet = "abcdefghijklmnopqrstuvwxyz".split("");

function randomSample(data) {
  return d3.shuffle(data)
    .slice(0, Math.floor(Math.random() * data.length))
    .sort();
}
```

*This example is a reproduction of [General Update Pattern, I][gup-1].*

In this example we create a GUP factory that can be bound to data, which
produces a GUP instance. A GUP instance can be called against a D3 selection,
which preforms a data-join and executes a set of update functions.

The GUP factory is rebound to random letters of the alphabet and called at
regular intervals in a D3 timer.

```javascript
examples[0] = {
  tick() {
    examples[0].root.call(examples[0].gup(randomSample(alphabet)));
  },
  timer: d3.interval(() => examples[0].tick(), 1500),
```

The GUP instance is called on a D3 selection that contains a single `g`
element inside a `svg` element.

```javascript
  root: d3.select("svg#example-1")
    .attr("width", 450)
    .attr("height", 100)
    .append("g")
    .attr("transform", "translate(16 50)"),
```

This creates our GUP factory, ready to configure with our phase functions.

```javascript
  gup: d3.gup()
```

`select` occurs prior to the data-join; here we select old `text` elements,
if any.

```javascript
    .select($ => $.selectAll("text"))
```

`pre` is applied to old elements; `update` class colours them blue.

```javascript
    .pre($ => $.attr("class", "update"))
```

`enter` creates new elements as needed; `enter` class colours them green.

```javascript
    .enter($ => $.append("text")
      .attr("class", "enter")
      .attr("dy", ".35em")
      .attr("x", (d, i) => i * 16))
```

`post` is applied to the merged set of new and old elements; here we lay them
out in a line.

```javascript
    .post($ => $.text(d => d))
```

`exit` is applied to elements that no longer have bound data; here we simply
remove them.

The overall effect is that we see green letters when the list grows and only
blue letters when the list shrinks. The association between individual
letters and their colour is lost because no key function is specified whilst
binding the data.

```javascript
    .exit($ => $.remove())
};
```

*This example is a reproduction of [General Update Pattern, II][gup-2].*

In this example we provide the key function that was missing from the
previous example.

As before, we setup a D3 timer to a `g` element but this time the identity
function is passed as the key function when the data is bound to the GUP.

```javascript
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
```

As before, we create our GUP and configure it. No change to `select` or `pre`
either.

```javascript
  gup: d3.gup()
    .select($ => $.selectAll("text"))
    .pre($ => $.attr("class", "update"))
```

`enter` is where the `text` content is applied since it will remain constant,
by virtue of the key function.

```javascript
    .enter($ => $.append("text")
      .attr("class", "enter")
      .attr("dy", ".35em")
      .text(d => d))
```

However, the elements will change position in the list (agian, thanks to the
key function), thus `post` is where we set the horizontal position.

```javascript
    .post($ => $.attr("x", (d, i) => i * 16))
```

No change to `exit`.

```javascript
    .exit($ => $.remove())
};
```

*This example is a reproduction of [General Update Pattern, III][gup-3].*

In the previous example we provided the key function to communicate a sense
of object constancy.  This effect is completed with the addition of
transitions.

As before, we setup a D3 timer to a `g` element.

```javascript
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
```

The `g` element is created the same way but now we introduce a transition.

```javascript
    .transition()
      .duration(750),
```

As before, we create our GUP and configure it.  We must now pay closer
attention to the elements vertical and horizontal position so that it will be
animated during the transition and also to the opacity to produce fade-in and
fade-out effects.

```javascript
  gup: d3.gup()
    .select($ => $.selectAll("text"))
    .pre($ => $.attr("class", "update"))
    .enter($ => $.append("text")
      .attr("class", "enter")
      .attr("dy", ".35em")
      .text(d => d)
```

Elements will begin positioned above the list and horizontally correct.

```javascript
      .attr("y", -60)
      .attr("x", (d, i) => i * 16)
      .style("fill-opacity", 1e-6))
```

Elements final position will be in the list; existing elements will traval
horizontally.

```javascript
    .post($ => $.attr("x", (d, i) => i * 16)
      .attr("y", 0)
      .style("fill-opacity", 1))
```

Exiting elements will drop below the list and fade out and then removed when
the transition completes.

```javascript
    .exit($ => $.attr("class", "exit")
      .attr("y", 60)
      .style("fill-opacity", 1e-6)
      .remove())
};
```

[selection_data]: https://github.com/d3/d3-selection#selection_data "Selection#data (d3-selection)"
[mike]: https://bl.ocks.org/mbostock "Mike Bostock's Blocks"
[gup-1]: https://bl.ocks.org/mbostock/3808218 "Mike Bostock's Block 3808218"
[gup-2]: https://bl.ocks.org/mbostock/3808221 "Mike Bostock's Block 3808221"
[gup-3]: https://bl.ocks.org/mbostock/3808234 "Mike Bostock's Block 3808234"
