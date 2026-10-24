import { TraceResult } from '../types';
import { runLocalPythonTrace } from './localPythonTracer';

const TRACER_PYTHON_SCRIPT = `
import sys
import json
import io
import types

class _WaitingForInputException(BaseException):
    def __init__(self, line_no, prompt="", var_name=""):
        super().__init__("Waiting for input")
        self.line_no = line_no
        self.prompt = prompt
        self.var_name = var_name

class ShellCaptureIO(io.StringIO):
    def __init__(self, tracer):
        super().__init__()
        self.tracer = tracer

    def write(self, s):
        if s:
            self.tracer.shell_segments.append({"type": "stdout", "text": str(s)})
        return super().write(s)

class VisualizerTracer:
    def __init__(self, max_steps=800):
        self.steps = []
        self.max_steps = max_steps
        self.shell_segments = []
        self.paused_for_input = False
        self.stdout_capture = ShellCaptureIO(self)
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
        if self.paused_for_input or len(self.steps) >= self.max_steps:
            return None

        code_filename = frame.f_code.co_filename
        if code_filename != self.target_code_file:
            return self.trace_callback

        # Filter out comprehension internal frames
        if frame.f_code.co_name in ('<listcomp>', '<dictcomp>', '<setcomp>', '<genexpr>'):
            return None

        if event not in ('call', 'line', 'return', 'exception'):
            return self.trace_callback

        # Skip redundant initial module-level 'call' event so step 0 starts at line execution
        if event == 'call' and frame.f_code.co_name == '<module>':
            return self.trace_callback

        # Reset heap snapshot for this specific step so mutated objects reflect their live state
        self.current_step_heap = {}

        stack_frames = []
        cur = frame
        while cur:
            if cur.f_code.co_filename == self.target_code_file:
                fn_name = cur.f_code.co_name
                name = "Global frame" if fn_name == '<module>' else fn_name
                
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

        stack_frames.reverse()

        step_data = {
            "step_index": len(self.steps),
            "line_number": frame.f_lineno,
            "event": event,
            "stack_frames": stack_frames,
            "heap_objects": json.loads(json.dumps(self.current_step_heap)),
            "stdout": self.stdout_capture.getvalue(),
            "shell_segments": list(self.shell_segments)
        }

        if event == 'return':
            step_data["return_value"] = self.serialize_value(arg)
            step_data["heap_objects"] = json.loads(json.dumps(self.current_step_heap))
        elif event == 'exception':
            exc_type, exc_val, _ = arg
            step_data["exception"] = f"{getattr(exc_type, '__name__', 'Error')}: {exc_val}"

        self.steps.append(step_data)
        return self.trace_callback

def run_trace(code_str, stdin_input="", max_steps=800, interactive_mode=False, interactive_inputs=None):
    tracer = VisualizerTracer(max_steps=max_steps)
    sys.stdout = tracer.stdout_capture
    old_stdin = sys.stdin

    code_lines = (code_str or "").splitlines()
    raw_stdin = (stdin_input or "").strip()
    stdin_lines = raw_stdin.splitlines() if raw_stdin else []
    # Token queue cho trường hợp học sinh nhập nhiều số cách nhau bởi dấu cách trên 1 dòng (ví dụ: "5 10")
    stdin_tokens = raw_stdin.replace(',', ' ').split() if raw_stdin else []
    stdin_line_idx = 0
    stdin_token_idx = 0
    default_int_fallbacks = ["5", "10", "3", "8", "2", "7", "4", "6"]
    fallback_idx = 0

    interactive_list = list(interactive_inputs) if interactive_inputs is not None else []
    interactive_idx = 0

    # Đếm tổng số lệnh input( trong bài của học sinh
    total_input_calls_in_code = (code_str or "").count("input(")

    def custom_input(prompt=""):
        nonlocal stdin_line_idx, stdin_token_idx, fallback_idx, interactive_idx
        if prompt:
            tracer.stdout_capture.write(str(prompt))

        # Kiểm tra dòng code đang gọi input()
        caller_line_text = ""
        caller_lineno = 1
        try:
            caller_frame = sys._getframe(1)
            if caller_frame:
                caller_lineno = caller_frame.f_lineno
                if 1 <= caller_lineno <= len(code_lines):
                    caller_line_text = code_lines[caller_lineno - 1]
        except Exception:
            pass

        if interactive_mode:
            if interactive_idx < len(interactive_list):
                val = str(interactive_list[interactive_idx])
                interactive_idx += 1
                tracer.shell_segments.append({"type": "input", "text": val + "\\n"})
                return val
            else:
                var_name = ""
                clean_line = caller_line_text.split("#")[0].strip()
                if "=" in clean_line and not clean_line.startswith("if ") and not clean_line.startswith("while "):
                    lhs = clean_line.split("=")[0].strip()
                    if lhs.isidentifier():
                        var_name = lhs
                if tracer.steps:
                    tracer.steps[-1]["stdout"] = tracer.stdout_capture.getvalue()
                    tracer.steps[-1]["shell_segments"] = list(tracer.shell_segments)
                tracer.paused_for_input = True
                raise _WaitingForInputException(caller_lineno, str(prompt), var_name)

        expects_single_number = (
            ("int(input" in caller_line_text.replace(" ", "") or "float(input" in caller_line_text.replace(" ", ""))
            and ".split" not in caller_line_text
        )
        expects_split_line = ".split" in caller_line_text or "list(" in caller_line_text

        # Chuẩn hóa nếu học sinh nhập dấu phẩy hoặc nhập 1 xâu kí tự liền nhau (ví dụ: PYTHON) cho lệnh .split()
        def _normalize_for_split(raw_str):
            s_clean = str(raw_str).replace(",", " ").strip()
            parts = s_clean.split()
            if len(parts) == 1 and not parts[0].lstrip("-").isdigit() and len(parts[0]) > 1:
                return " ".join(list(parts[0]))
            return s_clean if "," in str(raw_str) else str(raw_str)

        has_split_in_code = ".split(" in (code_str or "")

        # Khi dữ liệu đầu vào có nhiều dòng (ví dụ: Dòng 1 là mảng/xâu, Dòng 2 là số k/kí tự cần tìm),
        # ưu tiên đọc lần lượt từng dòng theo đúng thứ tự các lệnh input()
        if len(stdin_lines) > 1 and stdin_line_idx < len(stdin_lines):
            line = stdin_lines[stdin_line_idx]
            stdin_line_idx += 1
            if (expects_split_line or (has_split_in_code and not expects_single_number)):
                return _normalize_for_split(line)
            return line

        # Nếu lệnh gọi là int(input()) hoặc float(input()) (không có .split)
        # và học sinh nhập trên 1 dòng "5 10", đọc theo từng token số!
        if expects_single_number and not expects_split_line:
            if stdin_token_idx < len(stdin_tokens):
                tok = stdin_tokens[stdin_token_idx]
                stdin_token_idx += 1
                # Đồng bộ stdin_line_idx nếu mỗi dòng chỉ có 1 số
                if stdin_line_idx < len(stdin_lines) and stdin_lines[stdin_line_idx].strip() == tok:
                    stdin_line_idx += 1
                return tok
            # Nếu học sinh chưa nhập đủ dữ liệu vào ô stdin, tự động cấp giá trị mặc định để chương trình vẫn chạy mượt
            val = default_int_fallbacks[fallback_idx % len(default_int_fallbacks)]
            fallback_idx += 1
            return val

        # Nếu có nhiều lệnh input() trong bài nhưng học sinh chỉ nhập 1 dòng có nhiều từ cách nhau bởi dấu cách
        if total_input_calls_in_code > 1 and len(stdin_lines) == 1 and len(stdin_tokens) >= total_input_calls_in_code and not expects_split_line and stdin_line_idx == 0:
            if stdin_token_idx < len(stdin_tokens):
                tok = stdin_tokens[stdin_token_idx]
                stdin_token_idx += 1
                return tok

        # Mặc định: đọc theo từng dòng (phù hợp cho input().split(), nhập xâu kí tự, hoặc nhập từng dòng)
        if stdin_line_idx < len(stdin_lines):
            line = stdin_lines[stdin_line_idx]
            stdin_line_idx += 1
            if (expects_split_line or (has_split_in_code and not expects_single_number)):
                return _normalize_for_split(line)
            return line

        if stdin_token_idx < len(stdin_tokens):
            mid_idx = len(stdin_tokens) // 2
            return stdin_tokens[mid_idx]

        return "5" if expects_single_number else "abcdefg"
    
    error_msg = None
    waiting_input = False
    waiting_line = None
    waiting_prompt = ""
    waiting_var = ""

    _builtin_int = int
    def _smart_int(val=0, *args):
        if args:
            return _builtin_int(val, *args)
        if isinstance(val, str):
            s_val = val.strip()
            if s_val.lstrip("-").isdigit():
                return _builtin_int(s_val)
            if len(s_val) > 0:
                return s_val
        return _builtin_int(val)

    try:
        sys.stdin = io.StringIO(stdin_input or "")
        compiled_code = compile(code_str, "<user_code>", "exec")
        _globals = {
            "__name__": "__main__",
            "input": custom_input,
            "int": _smart_int
        }
        sys.settrace(tracer.trace_callback)
        exec(compiled_code, _globals)
    except _WaitingForInputException as wait_exc:
        waiting_input = True
        waiting_line = wait_exc.line_no
        waiting_prompt = wait_exc.prompt
        waiting_var = wait_exc.var_name
    except Exception as e:
        error_msg = f"{type(e).__name__}: {str(e)}"
    finally:
        sys.settrace(None)
        sys.stdout = tracer.old_stdout
        sys.stdin = old_stdin

    if tracer.steps and not waiting_input:
        tracer.steps[-1]["stdout"] = tracer.stdout_capture.getvalue()
        tracer.steps[-1]["shell_segments"] = list(tracer.shell_segments)

    return json.dumps({
        "steps": tracer.steps,
        "error": error_msg,
        "total_steps": len(tracer.steps),
        "stdout": tracer.stdout_capture.getvalue(),
        "waiting_input": waiting_input,
        "waiting_line": waiting_line,
        "waiting_prompt": waiting_prompt,
        "waiting_var": waiting_var,
        "shell_segments": tracer.shell_segments
    })
`;

let pyodideInstance: any = null;
let pyodideLoadingPromise: Promise<any> | null = null;

async function ensurePyodideScriptLoaded(): Promise<any> {
  if (typeof window === 'undefined') return null;
  if (typeof (window as any).loadPyodide === 'function') {
    return (window as any).loadPyodide;
  }

  return new Promise((resolve) => {
    const existingScript = document.querySelector('script[src*="pyodide.js"]') as HTMLScriptElement | null;
    let settled = false;
    const finish = (fn: any) => {
      if (!settled) {
        settled = true;
        resolve(fn);
      }
    };

    const timer = setTimeout(() => {
      finish((window as any).loadPyodide || null);
    }, 6000);

    if (existingScript) {
      const checkInterval = setInterval(() => {
        if (typeof (window as any).loadPyodide === 'function') {
          clearInterval(checkInterval);
          clearTimeout(timer);
          finish((window as any).loadPyodide);
        }
      }, 100);
      existingScript.addEventListener('load', () => {
        clearInterval(checkInterval);
        clearTimeout(timer);
        finish((window as any).loadPyodide || null);
      });
      existingScript.addEventListener('error', () => {
        clearInterval(checkInterval);
        clearTimeout(timer);
        finish(null);
      });
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
      script.async = true;
      script.onload = () => {
        clearTimeout(timer);
        finish((window as any).loadPyodide || null);
      };
      script.onerror = () => {
        clearTimeout(timer);
        finish(null);
      };
      document.head.appendChild(script);
    }
  });
}

export async function getPyodide(): Promise<any> {
  if (pyodideInstance) return pyodideInstance;
  if (pyodideLoadingPromise) return pyodideLoadingPromise;

  pyodideLoadingPromise = (async () => {
    try {
      const loadPyodideFn = await ensurePyodideScriptLoaded();
      if (typeof loadPyodideFn === 'function') {
        const pyodide = await loadPyodideFn({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/',
        });
        await pyodide.runPythonAsync(TRACER_PYTHON_SCRIPT);
        pyodideInstance = pyodide;
        return pyodide;
      }
    } catch (e) {
      console.warn('Pyodide CDN load failed, using built-in local Python tracer:', e);
    }
    pyodideLoadingPromise = null;
    return null;
  })();

  return pyodideLoadingPromise;
}

export interface ExecuteTraceOptions {
  interactiveMode?: boolean;
  interactiveInputs?: string[];
}

export async function executeTrace(
  code: string,
  engine: 'auto' | 'pyodide' | 'backend' = 'auto',
  stdinInput: string = '',
  options?: ExecuteTraceOptions
): Promise<TraceResult> {
  const interactiveMode = options?.interactiveMode ?? false;
  const interactiveInputs = options?.interactiveInputs ?? [];

  // 1. Nếu Pyodide WebAssembly đã sẵn sàng trong bộ nhớ, ưu tiên chạy ngay
  if (engine !== 'backend' && pyodideInstance) {
    try {
      pyodideInstance.globals.set('__user_code_input__', code);
      pyodideInstance.globals.set('__user_stdin_input__', stdinInput);
      pyodideInstance.globals.set('__interactive_mode__', interactiveMode);
      pyodideInstance.globals.set('__interactive_inputs_json__', JSON.stringify(interactiveInputs));
      const jsonResultStr = await pyodideInstance.runPythonAsync(`
run_trace(__user_code_input__, __user_stdin_input__, 800, bool(__interactive_mode__), json.loads(__interactive_inputs_json__))
      `);
      return JSON.parse(jsonResultStr);
    } catch (err: any) {
      console.warn('Pyodide execution error, falling back to local Python tracer:', err);
    }
  }

  // Khởi động tải ngầm Pyodide cho các lần chạy sau (không chặn luồng hiện tại)
  if (engine !== 'backend' && !pyodideInstance) {
    getPyodide().catch(() => {});
  }

  // 2. Chạy trực tiếp bằng bộ thông dịch Python nội bộ (Local Python Tracer) ngay trên trình duyệt (0ms, không bao giờ lỗi 404)
  if (engine !== 'backend') {
    const localResult = runLocalPythonTrace(
      code,
      stdinInput,
      800,
      interactiveMode,
      interactiveInputs
    );
    if (!localResult.error || localResult.waiting_input) {
      return localResult;
    }

    // Nếu có lỗi, thử kiểm tra qua backend /api/trace (nếu có) hoặc trả về kết quả localResult
    try {
      const response = await fetch('/api/trace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          stdin: stdinInput,
          interactive_mode: interactiveMode,
          interactive_inputs: interactiveInputs,
        }),
      });
      if (response.ok) {
        return await response.json();
      }
    } catch {
      // Bỏ qua lỗi mạng/404 và trả về kết quả từ bộ thông dịch nội bộ
    }
    return localResult;
  }

  // 3. Trường hợp chọn engine === 'backend'
  try {
    const response = await fetch('/api/trace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        stdin: stdinInput,
        interactive_mode: interactiveMode,
        interactive_inputs: interactiveInputs,
      }),
    });

    if (response.ok) {
      return await response.json();
    }
  } catch {
    // Fallback sang bộ thông dịch nội bộ nếu backend không phản hồi hoặc lỗi 404
  }

  return runLocalPythonTrace(code, stdinInput, 800, interactiveMode, interactiveInputs);
}

