export interface VariableValue {
  type: string;
  value: any;
  ref_id?: string;
}

export interface StackFrame {
  name: string;
  line_number: number;
  is_active: boolean;
  variables: Record<string, VariableValue>;
}

export interface HeapElement {
  index?: number;
  key?: string;
  type: string;
  value: any;
  ref_id?: string;
}

export interface HeapObject {
  id: string;
  type: 'tuple' | 'list' | 'dict' | 'set' | 'custom' | string;
  elements: HeapElement[];
  className?: string;
}

export interface ShellSegment {
  type: 'stdout' | 'input';
  text: string;
}

export interface TraceStep {
  step_index: number;
  line_number: number;
  event: 'call' | 'line' | 'return' | 'exception';
  stack_frames: StackFrame[];
  heap_objects: Record<string, HeapObject>;
  stdout: string;
  shell_segments?: ShellSegment[];
  return_value?: VariableValue;
  exception?: string;
}

export interface TraceResult {
  steps: TraceStep[];
  error: string | null;
  total_steps: number;
  stdout: string;
  waiting_input?: boolean;
  waiting_line?: number;
  waiting_prompt?: string;
  waiting_var?: string;
  shell_segments?: ShellSegment[];
}

export interface ComplexityReport {
  timeComplexity: string;
  spaceComplexity: string;
  auxiliaryStackSpace: string;
  heapAllocation: string;
  recurrenceRelation?: string;
  timeExplanation: string;
  spaceExplanation: string;
  keyOperationsCount?: string;
  optimizationTips: string[];
}

export interface PseudocodeLine {
  lineNum: number;
  text: string;
  indent: number;
  explanation?: string;
  correspondingPythonLines?: number[];
}

export interface PresetCode {
  id: string;
  title: string;
  category: 'Thuật toán Sắp xếp' | 'Thuật toán Tìm kiếm' | 'Tự do sáng tạo' | string;
  description: string;
  code: string;
  defaultStdin?: string;
  pseudocode?: PseudocodeLine[];
}
