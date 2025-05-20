import ast
import sys
import json

class GreenCodeVisitor(ast.NodeVisitor):
    def __init__(self):
        self.nested_loops = 0
        self.unused_vars = set()
        self.declared_vars = set()
        self.used_vars = set()
        self.inefficient_string_concat = False
        self.inefficient_list_append = False
        self.magic_numbers = set()
        self.unreachable_code = False

    def visit_For(self, node):
        # Check for nested loops
        for child in ast.iter_child_nodes(node):
            if isinstance(child, ast.For):
                self.nested_loops += 1
        self.generic_visit(node)

    def visit_Assign(self, node):
        # Track declared variables
        for target in node.targets:
            if isinstance(target, ast.Name):
                self.declared_vars.add(target.id)
        self.generic_visit(node)

    def visit_Name(self, node):
        # Track used variables
        if isinstance(node.ctx, ast.Load):
            self.used_vars.add(node.id)
        self.generic_visit(node)

    def visit_AugAssign(self, node):
        # Detect string concatenation in loops
        if isinstance(node.op, ast.Add) and isinstance(node.target, ast.Name):
            if hasattr(node.value, 's'):
                self.inefficient_string_concat = True
        self.generic_visit(node)

    def visit_Call(self, node):
        # Detect list.append in loops
        if isinstance(node.func, ast.Attribute) and node.func.attr == 'append':
            parent = getattr(node, 'parent', None)
            while parent:
                if isinstance(parent, ast.For):
                    self.inefficient_list_append = True
                    break
                parent = getattr(parent, 'parent', None)
        self.generic_visit(node)

    def visit_Num(self, node):
        if node.n not in (0, 1):  # Ignore common values
            self.magic_numbers.add(node.n)
        self.generic_visit(node)

    def visit_FunctionDef(self, node):
        for idx, stmt in enumerate(node.body[:-1]):
            if isinstance(stmt, (ast.Return, ast.Break, ast.Continue)):
                self.unreachable_code = True
                break
        self.generic_visit(node)

def set_parents(node, parent=None):
    for child in ast.iter_child_nodes(node):
        child.parent = node
        set_parents(child, node)

def analyze_code(code):
    tree = ast.parse(code)
    set_parents(tree)
    visitor = GreenCodeVisitor()
    visitor.visit(tree)
    unused = list(visitor.declared_vars - visitor.used_vars)
    return {
        "nested_loops": visitor.nested_loops,
        "unused_variables": unused,
        "inefficient_string_concat": visitor.inefficient_string_concat,
        "inefficient_list_append": visitor.inefficient_list_append,
        "magic_numbers": list(visitor.magic_numbers),
        "unreachable_code": visitor.unreachable_code
    }

if __name__ == "__main__":
    code = sys.stdin.read()
    result = analyze_code(code)
    print(json.dumps(result))