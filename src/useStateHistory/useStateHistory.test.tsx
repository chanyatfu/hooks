import { renderHook, act } from "@testing-library/react";
import { useStateHistory } from "./useStateHistory";

describe("useStateHistory", () => {
  it("initializes with the specified initial value", () => {
    const { result } = renderHook(() => useStateHistory(10));
    expect(result.current.getValue()).toBe(10);
  });

  it("updates and retains new values in history", () => {
    const { result } = renderHook(() => useStateHistory(0));
    expect(result.current.getValue()).toBe(0);
    act(() => result.current.setValue(1));
    expect(result.current.getValue()).toBe(1);
    act(() => result.current.setValue(2));
    expect(result.current.getValue()).toBe(2);
  });

  it("remains at initial value when undoing beyond history start", () => {
    const { result } = renderHook(() => useStateHistory(0));
    act(() => result.current.setValue(1));
    act(() => result.current.undo());
    expect(result.current.getValue()).toBe(0);
    act(() => result.current.undo());
    expect(result.current.getValue()).toBe(0);
  });

  it("retains last value when redoing beyond history end", () => {
    const { result } = renderHook(() => useStateHistory(0));
    act(() => result.current.setValue(1));
    act(() => result.current.undo());
    act(() => result.current.redo());
    expect(result.current.getValue()).toBe(1);
    act(() => result.current.redo());
    expect(result.current.getValue()).toBe(1);
  });

  it("throws error on undo with negative times", () => {
    const { result } = renderHook(() => useStateHistory(0));
    act(() => result.current.setValue(1));
    expect(() => result.current.undo(-1)).toThrow(
      "Undo times must be a positive number"
    );
  });

  it("throws error on redo with negative times", () => {
    const { result } = renderHook(() => useStateHistory(0));
    act(() => result.current.setValue(1));
    act(() => result.current.undo());
    expect(() => result.current.redo(-1)).toThrow(
      "Redo times must be a positive number"
    );
  });

  it("ignores navigate call with zero magnitude", () => {
    const { result } = renderHook(() => useStateHistory(0));
    act(() => result.current.setValue(1));
    act(() => result.current.navigate(0));
    expect(result.current.getValue()).toBe(1);
  });

  it("accurately handles multiple sequential undos and redos", () => {
    const { result } = renderHook(() => useStateHistory("a"));
    act(() => {
      result.current.setValue("b");
      result.current.setValue("c");
      result.current.setValue("d");
    });
    act(() => result.current.setValue("e"));
    act(() => {
      result.current.setValue("f");
      result.current.setValue("g");
      result.current.setValue("i");
    });
    act(() => result.current.undo(2));
    expect(result.current.getValue()).toBe("d");
    act(() => result.current.redo(1));
    expect(result.current.getValue()).toBe("e");
    act(() => result.current.redo(1));
    expect(result.current.getValue()).toBe("i");
    act(() => result.current.undo(3));
    expect(result.current.getValue()).toBe("a");
  });

  it("excludes bailed out state from history", () => {
    const { result } = renderHook(() => useStateHistory(0));
    act(() => result.current.setValue(1));
    act(() => result.current.setValue(2));
    act(() => result.current.setValue(2));
    act(() => result.current.setValue(2));
    act(() => result.current.setValue(3));
    expect(result.current.getValue()).toBe(3);
    act(() => result.current.undo());
    expect(result.current.getValue()).toBe(2);
    act(() => result.current.undo());
    expect(result.current.getValue()).toBe(1);
    act(() => result.current.undo());
    expect(result.current.getValue()).toBe(0);
  });

  it("discards future history when setting new values after undo", () => {
    const { result } = renderHook(() => useStateHistory(0));
    act(() => result.current.setValue(1));
    act(() => result.current.setValue(2));
    act(() => result.current.setValue(3));
    act(() => result.current.undo());
    act(() => result.current.undo());
    act(() => result.current.setValue(4));
    act(() => result.current.setValue(5));
    act(() => result.current.undo());
    expect(result.current.getValue()).toBe(4);
    expect(result.current.getValue(1)).toBe(5);
    expect(result.current.getValue(2)).toBe(5);
    expect(result.current.getValue(-1)).toBe(1);
    expect(result.current.getValue(-2)).toBe(0);
    expect(result.current.getValue(-3)).toBe(0);
  });
});
