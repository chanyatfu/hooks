export { useEventListener };

import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { useEffect, useRef } from "react";

type DOMEventMapDefinitions = [
  [HTMLElement, HTMLElementEventMap],
  [HTMLBodyElement, HTMLBodyElementEventMap],
  [SVGElement, SVGElementEventMap],
  [Document, DocumentEventMap],
  [Window, WindowEventMap],
  [MediaQueryList, MediaQueryListEventMap],
  [FileReader, FileReaderEventMap],
  [XMLHttpRequest, XMLHttpRequestEventMap],
  [WebSocket, WebSocketEventMap],
  [Element, ElementEventMap],
  [Animation, AnimationEventMap],
  [EventSource, EventSourceEventMap],
  [AbortSignal, AbortSignalEventMap],
  [AbstractWorker, AbstractWorkerEventMap],
  [AudioScheduledSourceNode, AudioScheduledSourceNodeEventMap],
  [BaseAudioContext, BaseAudioContextEventMap],
  [BroadcastChannel, BroadcastChannelEventMap],
  [MessagePort, MessagePortEventMap],
  [Notification, NotificationEventMap],
  [OffscreenCanvas, OffscreenCanvasEventMap],
  [RTCPeerConnection, RTCPeerConnectionEventMap],
  [ServiceWorker, ServiceWorkerEventMap]
];
type DOMEventSubscriber = DOMEventMapDefinitions[number][0];

type MapDefinitionToEventMap<D extends { [K: number]: any[] }, T> = {
  [K in keyof D]: D[K] extends any[]
    ? T extends D[K][0]
      ? D[K][1]
      : never
    : never;
};
type GetDOMEventMaps<T extends DOMEventSubscriber> = MapDefinitionToEventMap<
  DOMEventMapDefinitions,
  T
>;

type MapEventMapsToKeys<D extends { [K: number]: any }> = {
  [K in keyof D]: D[K] extends never ? never : keyof D[K];
};
type MapEventMapsToEvent<
  D extends { [K: number]: any },
  T extends PropertyKey
> = {
  [K in keyof D]: D[K] extends never
    ? never
    : T extends keyof D[K]
    ? D[K][T]
    : never;
};

function useEventListener<
  T extends DOMEventSubscriber,
  K extends MapEventMapsToKeys<GetDOMEventMaps<T>>[number] & string
>(
  target: React.RefObject<T> | T,
  type: K | K[],
  listener: (ev: MapEventMapsToEvent<GetDOMEventMaps<T>, K>[number]) => any,
  options?: boolean | AddEventListenerOptions
) {
  const listenerRef = useRef(listener);

  useIsomorphicLayoutEffect(() => {
    listenerRef.current = listener;
  }, [listener]);

  useEffect(() => {
    const targetCurrent = "current" in target ? target.current : target;
    if (!targetCurrent) return;

    const listenerWrapper = (event: Event) => {
      listenerRef.current(
        event as MapEventMapsToEvent<GetDOMEventMaps<T>, K>[number]
      );
    };

    if (Array.isArray(type)) {
      for (const t of type) {
        targetCurrent.addEventListener(t, listenerWrapper, options);
      }
      return () => {
        for (const t of type) {
          targetCurrent.removeEventListener(t, listenerWrapper, options);
        }
      };
    } else {
      targetCurrent.addEventListener(type, listenerWrapper, options);
      return () => {
        targetCurrent.removeEventListener(type, listenerWrapper, options);
      };
    }
  }, [type, target, options]);
}
