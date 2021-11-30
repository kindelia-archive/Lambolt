import * as P from "./Parser.ts";
export * from "./Parser.ts"

// Types
// =====

// Term
// ----

export type Term
  = {$: "Var", name: string}
  | {$: "Dup", nam0: string, nam1: string, expr: Term, body: Term}
  | {$: "Let", name: string, expr: Term, body: Term}
  | {$: "Lam", name: string, body: Term}
  | {$: "App", func: Term, argm: Term}
  | {$: "Ctr", name: string, args: Array<Term>}

// Rule
// ----

export type Rule
  = {$: "Rule", lhs: Term, rhs: Term}

// File
// ----

export type File
  = Array<Rule>

// Constructors
// ============

// Term
// ----

export function Var(name: string) : Term {
  return {$: "Var", name};
}

export function Dup(nam0: string, nam1: string, expr: Term, body: Term) : Term {
  return {$: "Dup", nam0, nam1, expr, body};
}

export function Let(name: string, expr: Term, body: Term) : Term {
  return {$: "Let", name, expr, body};
}

export function Lam(name: string, body: Term) : Term {
  return {$: "Lam", name, body};
}

export function App(func: Term, argm: Term) : Term {
  return {$: "App", func, argm};
}

export function Ctr(name: string, args: Array<Term>) : Term {
  return {$: "Ctr", name, args};
}

// Rule
// ----

export function Rule(lhs: Term, rhs: Term) : Rule {
  return {$: "Rule", lhs, rhs};
}

// Stringifier
// ===========

// Term
// ----

export function show_term(term: Term): string {
  switch (term.$) {
    case "Var": {
      return term.name;
    }
    case "Dup": {
      let nam0 = term.nam0;
      let nam1 = term.nam1;
      let expr = show_term(term.expr);
      let body = show_term(term.body);
      return "dup " + nam0 + " " + nam1 + " = " + expr + "; " + body;
    }
    case "Let": {
      let name = term.name;
      let expr = show_term(term.expr);
      let body = show_term(term.body);
      return "let " + name + " = " + expr + "; " + body;
    }
    case "Lam": {
      let name = term.name;
      let body = show_term(term.body);
      return "λ" + name + " " + body;
    }
    case "App": {
      let args = [];
      while (term.$ === "App") {
        args.push(show_term(term.argm));
        term = term.func;
      }
      let func = show_term(term);
      return "[" + func + " " + args.reverse().join(" ") + "]";
    }
    case "Ctr": {
      let name = term.name;
      let args = term.args.map(show_term);
      return "(" + name + args.map(x => " " + x).join("") + ")";
    }
  }
}

// Rule
// ----

export function show_rule(rule: Rule): string {
  let lhs = show_term(rule.lhs);
  let rhs = show_term(rule.rhs);
  return lhs + " = " + rhs;
}

// File
// ----

export function show_file(file: File): string {
  return file.map(show_rule).join("\n");
}

// Parser
// ======

// Term
// ----

export function parse_let() : P.Parser<Term | null> {
  return (state) => P.guard(P.match("let "), (state) => {
    var [state, skp0] = P.match("let ")(state);
    var [state, name] = P.name1(state);
    var [state, skp1] = P.consume("=")(state);
    var [state, expr] = parse_term()(state);
    var [state, skp2] = P.match(";")(state);
    var [state, body] = parse_term()(state);
    return [state, Let(name, expr, body)];
  })(state);
}

export function parse_dup() : P.Parser<Term | null> {
  return (state) => P.guard(P.match("dup "), (state) => {
    var [state, skp0] = P.match("dup ")(state);
    var [state, nam0] = P.name1(state);
    var [state, nam1] = P.name1(state);
    var [state, skp1] = P.consume("=")(state);
    var [state, expr] = parse_term()(state);
    var [state, skp2] = P.match(";")(state);
    var [state, body] = parse_term()(state);
    return [state, Dup(nam0, nam1, expr, body)];
  })(state);
}

export function parse_lam() : P.Parser<Term | null> {
  return (state) => P.guard(P.match("λ"), (state) => {
    var [state, skp0] = P.match("λ")(state);
    var [state, name] = P.name(state);
    var [state, body] = parse_term()(state);
    return [state, Lam(name, body)];
  })(state);
}

export function parse_app() : P.Parser<Term | null> {
  return (state) => P.guard(P.match("["), P.list(
    P.match("["),
    P.match(""),
    P.match("]"),
    parse_term(),
    (args) => args.reduce((a,b) => App(a,b)),
  ))(state);
}

export function parse_ctr() : P.Parser<Term | null> {
  return (state) => P.guard(P.match("("), (state) => {
    var [state, skp0] = P.match("(")(state);
    var [state, name] = P.name1(state);
    var [state, args] = P.until(P.match(")"), parse_term())(state);
    return [state, Ctr(name, args)];
  })(state);
}

export function parse_var() : P.Parser<Term | null> {
  return (state) => {
    var [state, name] = P.name(state);
    if (name.length > 0) {
      return [state, Var(name)];
    } else {
      return [state, null];
    }
  };
}

export function parse_term() : P.Parser<Term> {
  return P.grammar("Term", [
    parse_let(),
    parse_dup(),
    parse_lam(),
    parse_app(),
    parse_ctr(),
    parse_var(),
    (state) => {
      return [state, null];
    }
  ]);
}

// Rule
// ----

export function parse_rule() : P.Parser<Rule | null> {
  return (state) => {
    try {
      var [state, lhs] = parse_term()(state);
      var [state, skp0] = P.consume("=")(state);
      var [state, rhs] = parse_term()(state);
      return [state, Rule(lhs, rhs)];
    } catch (e) {
      return [state, null];
    }
  };
}

// File
// ----

export function parse_file() : P.Parser<File> {
  return (state) => {
    var [state, rule] = parse_rule()(state);
    if (rule !== null) {
      var [state, file] = parse_file()(state);
      return [state, [rule].concat(file)];
    }
    var [state, done] = P.done(state);
    if (!done) {
      P.expected_type("definition")(state);
    }
    return [state, []];
  };
}

