Lambolt
=======

Lambolt is the ultimate compile target for functional languages. It is a minimal
core that consists of, essentially, the untyped λ-calculus, plus constructors,
pattern-matching and machine integers. It compiles to an optimal, massively
parallel runtime, LamCrusher.

Usage
-----

We will soon add an interpreter. For now, you can run Lambolt by compiling it to
LamCrusher. Check its repository for instructions.

Examples
--------

Despite being a low-level target that isn't meant to be written directly,
Lambolt does include a fairly readable syntax. Below are some examples:

### Constructors and functions:

```javascript
// Doubles a natural number
(double (zero))   = (zero)
(double (succ x)) = (succ (succ (double x)))

// Computes 2 * 2
(main) = (double (succ (succ (succ (zero)))))
```

### Lambda encodings:

```javascript
// Doubles using Church-Encoding
(main) =
  let zero = λs λz z
  let succ = λn λs λz [s [n s z]]
  let mul2 = λa [a λp [succ [succ p]] zero]
  let num2 = λsucc λzero [succ [succ zero]]
  [mul2 num2]
```




