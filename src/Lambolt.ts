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
  | {$: "U32", numb: number}
  | {$: "Op2", oper: Oper, val0: Term, val1: Term}

export type Oper
  = "ADD"
  | "SUB"
  | "MUL"
  | "DIV"
  | "MOD"
  | "AND"
  | "OR"
  | "XOR"

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

export function U32(numb: number) : Term {
  return {$: "U32", numb};
}

export function Op2(oper: Oper, val0: Term, val1: Term) : Term {
  return {$: "Op2", oper, val0, val1};
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

export function show_oper(oper: Oper): string {
  switch (oper) {
    case "ADD": return "+";
    case "SUB": return "-";
    case "MUL": return "*";
    case "DIV": return "/";
    case "MOD": return "%";
    case "AND": return "&";
    case "OR" : return "|";
    case "XOR": return "^";
  }
}

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
    case "U32": {
      return "#" + term.numb.toString();
    }
    case "Op2": {
      let oper = show_oper(term.oper);
      let val0 = show_term(term.val0);
      let val1 = show_term(term.val1);
      return "{" + val0 + " " + oper + " " + val1 + "}";
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

export function parse_u32() : P.Parser<Term | null> {
  return (state) => P.guard(P.match("#"), (state) => {
    var [state, skp0] = P.match("#")(state);
    var [state, numb] = P.name1(state);
    if (numb !== null) {
      return [state, U32(Number(numb))];
    } else {
      return [state, null];
    }
  })(state);
}

export function parse_op2() : P.Parser<Term | null> {
  return (state) => P.guard(P.match("{"), (state) => {
    var [state, skp0] = P.match("{")(state);
    var [state, val0] = parse_term()(state);
    var [state, oper] = parse_oper()(state);
    var [state, val1] = parse_term()(state);
    var [state, skp1] = P.match("}")(state);
    return [state, Op2(oper || "ADD", val0, val1)];
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
    parse_u32(),
    parse_op2(),
    parse_var(),
    (state) => {
      return [state, null];
    }
  ]);
}

export function parse_oper() : P.Parser<Oper | null> {
  return P.grammar("Oper", [
    (state) => {
      var [state, done] = P.match("+")(state);
      return [state, done ? "ADD" : null];
    },
    (state) => {
      var [state, done] = P.match("-")(state);
      return [state, done ? "SUB" : null];
    },
    (state) => {
      var [state, done] = P.match("*")(state);
      return [state, done ? "MUL" : null];
    },
    (state) => {
      var [state, done] = P.match("/")(state);
      return [state, done ? "DIV" : null];
    },
    (state) => {
      var [state, done] = P.match("%")(state);
      return [state, done ? "MOD" : null];
    },
    (state) => {
      var [state, done] = P.match("&")(state);
      return [state, done ? "AND" : null];
    },
    (state) => {
      var [state, done] = P.match("|")(state);
      return [state, done ? "OR" : null];
    },
    (state) => {
      var [state, done] = P.match("^")(state);
      return [state, done ? "XOR" : null];
    },
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

