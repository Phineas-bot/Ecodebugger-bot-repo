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
        self.unused_imports = set()
        self.imported_names = set()
        self.used_imports = set()
        self.infinite_loops = False
        self.shadowed_vars = set()
        self.assigned_vars = set()
        self.used_before_assign = set()
        self.deprecated_functions = set()
        self.deprecated_function_list = {'apply', 'buffer', 'coerce', 'intern', 'reload', 'reduce'}  # Example
        self.scope_stack = [{}]  # For shadowed vars

    def visit_Import(self, node):
        for alias in node.names:
            self.imported_names.add(alias.asname or alias.name)
        self.generic_visit(node)

    def visit_ImportFrom(self, node):
        for alias in node.names:
            self.imported_names.add(alias.asname or alias.name)
        self.generic_visit(node)

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
            if node.id in self.imported_names:
                self.used_imports.add(node.id)
            # Used before assignment
            if node.id not in self.assigned_vars and node.id not in self.declared_vars:
                self.used_before_assign.add(node.id)
        elif isinstance(node.ctx, ast.Store):
            # Shadowed variable detection
            if node.id in self.scope_stack[-1]:
                self.shadowed_vars.add(node.id)
            self.scope_stack[-1][node.id] = True
            self.assigned_vars.add(node.id)
        self.generic_visit(node)

    def visit_AugAssign(self, node):
        # Detect string concatenation in loops
        if isinstance(node.op, ast.Add) and isinstance(node.target, ast.Name):
            if hasattr(node.value, 's'):
                self.inefficient_string_concat = True
        self.generic_visit(node)

    def visit_While(self, node):
        # Infinite loop detection
        if isinstance(node.test, ast.Constant) and node.test.value is True:
            self.infinite_loops = True
        self.generic_visit(node)

    def visit_FunctionDef(self, node):
        self.scope_stack.append({})
        for idx, stmt in enumerate(node.body[:-1]):
            if isinstance(stmt, (ast.Return, ast.Break, ast.Continue)):
                self.unreachable_code = True
                break
        self.generic_visit(node)
        self.scope_stack.pop()

    def visit_Call(self, node):
        # Detect list.append in loops
        if isinstance(node.func, ast.Attribute) and node.func.attr == 'append':
            parent = getattr(node, 'parent', None)
            while parent:
                if isinstance(parent, ast.For):
                    self.inefficient_list_append = True
                    break
                parent = getattr(parent, 'parent', None)
        if isinstance(node.func, ast.Name):
            if node.func.id in self.deprecated_function_list:
                self.deprecated_functions.add(node.func.id)
        self.generic_visit(node)

    def visit_Num(self, node):
        if node.n not in (0, 1):  # Ignore common values
            self.magic_numbers.add(node.n)
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
    unused_imports = list(visitor.imported_names - visitor.used_imports)
    return {
        "nested_loops": visitor.nested_loops,
        "unused_variables": unused,
        "inefficient_string_concat": visitor.inefficient_string_concat,
        "inefficient_list_append": visitor.inefficient_list_append,
        "magic_numbers": list(visitor.magic_numbers),
        "unreachable_code": visitor.unreachable_code,
        "unused_imports": unused_imports,
        "infinite_loops": visitor.infinite_loops,
        "shadowed_variables": list(visitor.shadowed_vars),
        "used_before_assignment": list(visitor.used_before_assign),
        "deprecated_functions": list(visitor.deprecated_functions)
    }

if __name__ == "__main__":
    code = sys.stdin.read()
    result = analyze_code(code)
    print(json.dumps(result))