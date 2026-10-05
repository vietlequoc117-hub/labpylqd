"""
PyViz Lab - Python Tracing Engine
Executes Python code and generates frame & heap visualization traces
"""
import sys
import json
import io
import types
import traceback

class VisualizerTracer:
    def __init__(self, max_steps=800):
        self.steps = []
        self.max_steps = max_steps
        self.stdout_capture = io.StringIO()
        self.old_stdout = sys.stdout
        self.id_map = {}
        self.next_heap_id = 1
        self.target_code_file = "<user_code>"
        self.current_step_heap = {}

    def get_ref_id(self, obj):
        py_id = id(obj)
        if py_id not in self.id_map:
            type_name = type(obj).__name__
            self.id_map[py_id] = f"{type_name}_{self.next_heap_id}"
            self.next_heap_id += 1
        return self.id_map[py_id]

    def serialize_value(self, val, depth=0):
        if depth > 8:
            return {"type": "primitive", "value": "..."}
        
        # Primitives
        if val is None:
            return {"type": "NoneType", "value": "None"}
        if isinstance(val, bool):
            return {"type": "bool", "value": val}
        if isinstance(val, (int, float)):
            return {"type": type(val).__name__, "value": val}
        if isinstance(val, str):
            return {"type": "str", "value": val}
        
        # Functions / Modules / Types
        if isinstance(val, (types.FunctionType, types.BuiltinFunctionType, types.MethodType)):
            return {"type": "function", "value": f"func {getattr(val, '__name__', 'anonymous')}()"}
        if isinstance(val, type):
            return {"type": "type", "value": f"class {val.__name__}"}
        if isinstance(val, types.ModuleType):
            return {"type": "module", "value": f"module {getattr(val, '__name__', '')}"}

        # Heap Objects
        ref_id = self.get_ref_id(val)

        if isinstance(val, (list, tuple)):
            obj_type = "tuple" if isinstance(val, tuple) else "list"
            if ref_id not in self.current_step_heap:
                # Add placeholder to break potential self-referential cycles
                self.current_step_heap[ref_id] = {
                    "id": ref_id,
                    "type": obj_type,
                    "elements": []
                }
                elements = []
                for idx, item in enumerate(val):
                    ser = self.serialize_value(item, depth + 1)
                    el = {
                        "index": idx,
                        "type": ser["type"],
                        "value": ser.get("value")
                    }
                    if "ref_id" in ser:
                        el["ref_id"] = ser["ref_id"]
                    elements.append(el)
                self.current_step_heap[ref_id]["elements"] = elements
            return {"type": "ref", "ref_id": ref_id, "value": f"[{ref_id}]"}

        elif isinstance(val, dict):
            if ref_id not in self.current_step_heap:
                self.current_step_heap[ref_id] = {
                    "id": ref_id,
                    "type": "dict",
                    "elements": []
                }
                elements = []
                for k, v in val.items():
                    ser_val = self.serialize_value(v, depth + 1)
                    el = {
                        "key": str(k),
                        "type": ser_val["type"],
                        "value": ser_val.get("value")
                    }
                    if "ref_id" in ser_val:
                        el["ref_id"] = ser_val["ref_id"]
                    elements.append(el)
                self.current_step_heap[ref_id]["elements"] = elements
            return {"type": "ref", "ref_id": ref_id, "value": f"[{ref_id}]"}

        elif isinstance(val, set):
            if ref_id not in self.current_step_heap:
                self.current_step_heap[ref_id] = {
                    "id": ref_id,
                    "type": "set",
                    "elements": []
                }
                elements = []
                for idx, item in enumerate(val):
                    ser = self.serialize_value(item, depth + 1)
                    el = {"index": idx, "type": ser["type"], "value": ser.get("value")}
                    if "ref_id" in ser:
                        el["ref_id"] = ser["ref_id"]
                    elements.append(el)
                self.current_step_heap[ref_id]["elements"] = elements
            return {"type": "ref", "ref_id": ref_id, "value": f"[{ref_id}]"}

        # Custom class instance or custom object
        if hasattr(val, '__dict__'):
            cls_name = val.__class__.__name__
            if ref_id not in self.current_step_heap:
                self.current_step_heap[ref_id] = {
                    "id": ref_id,
                    "type": "custom",
                    "className": cls_name,
                    "elements": []
                }
                elements = []
                attrs = val.__dict__
                for attr_name, attr_val in attrs.items():
                    if attr_name.startswith('__'):
                        continue
                    ser_attr = self.serialize_value(attr_val, depth + 1)
                    el = {
                        "key": attr_name,
                        "type": ser_attr["type"],
                        "value": ser_attr.get("value")
                    }
                    if "ref_id" in ser_attr:
                        el["ref_id"] = ser_attr["ref_id"]
                    elements.append(el)
                self.current_step_heap[ref_id]["elements"] = elements
            return {"type": "ref", "ref_id": ref_id, "value": f"<{cls_name}>"}

        return {"type": "primitive", "value": repr(val)}

    def trace_callback(self, frame, event, arg):
        if len(self.steps) >= self.max_steps:
            return None

        # Filter out tracer internal frames or standard libraries
        code_filename = frame.f_code.co_filename
        if code_filename != self.target_code_file:
            return self.trace_callback

        if event not in ('call', 'line', 'return', 'exception'):
            return self.trace_callback

        # Reset heap snapshot for this specific step so mutated objects reflect their live state
        self.current_step_heap = {}

        # Reconstruct call stack
        stack_frames = []
        cur = frame
        while cur:
            if cur.f_code.co_filename == self.target_code_file:
                fn_name = cur.f_code.co_name
                name = "Global frame" if fn_name == '<module>' else fn_name
                
                # Filter locals
                clean_vars = {}
                for k, v in cur.f_locals.items():
                    if k.startswith('__') and k.endswith('__'):
                        continue
                    if k in ('_viz_tracer', '_code_str', '_globals_dict'):
                        continue
                    if k == 'input' and getattr(v, '__name__', '') == 'custom_input':
                        continue
                    clean_vars[k] = self.serialize_value(v)

                stack_frames.append({
                    "name": name,
                    "line_number": cur.f_lineno,
                    "is_active": (cur == frame),
                    "variables": clean_vars
                })
            cur = cur.f_back

        # Top of stack is currently executing frame; reverse so Global frame is at index 0
        stack_frames.reverse()

        step_data = {
            "step_index": len(self.steps),
            "line_number": frame.f_lineno,
            "event": event,
            "stack_frames": stack_frames,
            # Current step's fresh heap objects
            "heap_objects": json.loads(json.dumps(self.current_step_heap)),
            "stdout": self.stdout_capture.getvalue()
        }

        if event == 'return':
            step_data["return_value"] = self.serialize_value(arg)
            # Re-snapshot heap in case return value introduced newly serialized elements
            step_data["heap_objects"] = json.loads(json.dumps(self.current_step_heap))
        elif event == 'exception':
            exc_type, exc_val, _ = arg
            step_data["exception"] = f"{getattr(exc_type, '__name__', 'Error')}: {exc_val}"

        self.steps.append(step_data)
        return self.trace_callback

def run_trace(code_str, stdin_input="", max_steps=800):
    tracer = VisualizerTracer(max_steps=max_steps)
    sys.stdout = tracer.stdout_capture
    old_stdin = sys.stdin

    # Mock input handler that safely reads from provided stdin lines
    stdin_lines = (stdin_input or "").splitlines()
    stdin_idx = 0
    def custom_input(prompt=""):
        nonlocal stdin_idx
        if prompt:
            tracer.stdout_capture.write(str(prompt))
        if stdin_idx < len(stdin_lines):
            line = stdin_lines[stdin_idx]
            stdin_idx += 1
            return line
        return ""
    
    error_msg = None
    try:
        sys.stdin = io.StringIO(stdin_input or "")
        compiled_code = compile(code_str, "<user_code>", "exec")
        _globals = {
            "__name__": "__main__",
            "input": custom_input,
        }
        sys.settrace(tracer.trace_callback)
        exec(compiled_code, _globals)
    except Exception as e:
        error_msg = f"{type(e).__name__}: {str(e)}"
    finally:
        sys.settrace(None)
        sys.stdout = tracer.old_stdout
        sys.stdin = old_stdin

    return {
        "steps": tracer.steps,
        "error": error_msg,
        "total_steps": len(tracer.steps),
        "stdout": tracer.stdout_capture.getvalue()
    }

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--json":
        input_data = sys.stdin.read()
        code_str = input_data
        stdin_input = ""
        max_steps = 800
        try:
            parsed_json = json.loads(input_data)
            if isinstance(parsed_json, dict) and "code" in parsed_json:
                code_str = parsed_json["code"]
                stdin_input = parsed_json.get("stdin", "")
                max_steps = parsed_json.get("max_steps", 800)
        except Exception:
            pass
        res = run_trace(code_str, stdin_input=stdin_input, max_steps=max_steps)
        print(json.dumps(res))
    else:
        sample = """
def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr

numbers = [5, 2, 8, 1, 3]
sorted_arr = bubble_sort(numbers)
"""
        res = run_trace(sample)
        print(f"Total steps: {len(res['steps'])}, Error: {res['error']}")
        if res['steps']:
            first_step = res['steps'][2] # after numbers defined
            last_step = res['steps'][-1]
            print("Initial heap list_1:", [e['value'] for e in first_step['heap_objects']['list_1']['elements']])
            print("Sorted heap list_1:", [e['value'] for e in last_step['heap_objects']['list_1']['elements']])
