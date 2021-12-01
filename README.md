Lambolt
=======

Lambolt is the ultimate compile target for functional languages. It is a minimal
core that consists of, essentially, lambdas, machine integers and rewrite rules.
It compiles to an optimal, massively parallel runtime, [LamRT](https://github.com/Kindelia/LamRT).

Usage
-----

We will soon add an interpreter. For now, you can run Lambolt via LamRT.

Examples
--------

Despite being a low-level target that isn't meant to be written directly,
Lambolt does include a fairly readable syntax. Below are some examples:

### Constructors and functions:

```javascript
// Doubles a natural number
(Double (Zero))   = (Zero)
(Double (Ducc x)) = (Succ (Succ (Double x)))

// Computes 2 * 2
(Main) = (Double (Succ (Succ (Succ (Zero)))))
```

### Lambda encodings:

```javascript
// Doubles using Church-Encoding
(main) =
  let zero = λs λz z
  let succ = λn λs λz (s (n s z))
  let mul2 = λa (a λp (succ (succ p)) zero)
  let num2 = λsucc λzero (succ (succ zero))
  (mul2 num2)
```
