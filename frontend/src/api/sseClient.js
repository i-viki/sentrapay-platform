// Resilient Server-Sent Events (SSE) Client with support for named events, keepalive, and lifecycle listeners

const KNOWN_EVENT_TYPES = [
  'payment.initiated',
  'fraud.evaluated',
  'payment.settled',
  'recon.matched',
  'stream.event',
  'message',
];

class SseClient {
  constructor() {
    this.eventSource = null;
    this.listeners = new Set();
    this.statusListeners = new Set();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 20;
    this.reconnectDelay = 2000;
    this.isConnected = false;
    this.isManualClosed = false;
  }

  connect(url = '/api/events/stream') {
    if (this.eventSource) {
      this.close();
    }

    this.isManualClosed = false;
    this.updateStatus('CONNECTING');

    try {
      this.eventSource = new EventSource(url);

      this.eventSource.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.updateStatus('CONNECTED');
      };

      const handleIncoming = (eventName, rawData) => {
        try {
          const parsed = JSON.parse(rawData);
          const eventType = parsed.eventType || eventName.toUpperCase().replace('.', '_');
          const payload = {
            ...parsed,
            eventType,
            eventName,
            receivedAt: new Date().toISOString(),
          };
          this.notifyListeners(payload);
        } catch (err) {
          this.notifyListeners({
            eventType: eventName.toUpperCase().replace('.', '_'),
            eventName,
            data: rawData,
            receivedAt: new Date().toISOString(),
          });
        }
      };

      // 1. Default message listener (for untyped SSE)
      this.eventSource.onmessage = (event) => {
        handleIncoming('message', event.data);
      };

      // 2. Named event listeners for Spring WebFlux ServerSentEvent<String> events
      KNOWN_EVENT_TYPES.forEach((type) => {
        this.eventSource.addEventListener(type, (event) => {
          handleIncoming(type, event.data);
        });
      });

      // 3. Heartbeat / ping listener
      this.eventSource.addEventListener('ping', () => {
        // Keepalive pulse from server
        this.updateStatus('CONNECTED');
      });

      this.eventSource.onerror = (err) => {
        this.isConnected = false;
        this.updateStatus('DISCONNECTED');
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }

        if (!this.isManualClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = Math.min(this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1), 30000);
          this.updateStatus(`RECONNECTING (${this.reconnectAttempts})`);
          setTimeout(() => {
            if (!this.isManualClosed) {
              this.connect(url);
            }
          }, delay);
        }
      };
    } catch (err) {
      console.error('Failed to initialize EventSource:', err);
      this.updateStatus('ERROR');
    }
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  onStatusChange(callback) {
    this.statusListeners.add(callback);
    callback(this.isConnected ? 'CONNECTED' : 'DISCONNECTED');
    return () => this.statusListeners.delete(callback);
  }

  notifyListeners(data) {
    for (const listener of this.listeners) {
      try {
        listener(data);
      } catch (err) {
        console.error('Error in SSE listener callback:', err);
      }
    }
  }

  updateStatus(status) {
    for (const callback of this.statusListeners) {
      try {
        callback(status);
      } catch (err) {
        console.error('Error in status callback:', err);
      }
    }
  }

  close() {
    this.isManualClosed = true;
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isConnected = false;
    this.updateStatus('DISCONNECTED');
  }
}

export const sseClient = new SseClient();
