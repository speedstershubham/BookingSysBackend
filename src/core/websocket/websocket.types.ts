export type WebSocketClientData = {
  userId: string;
  subscribedShowtimeId?: string;
};

export type WebSocketClientMessage =
  | { type: 'subscribe'; showtimeId: string }
  | { type: 'unsubscribe' };

export type WebSocketServerMessage = {
  type: 'seats_updated';
  showtimeId: string;
  seatIds: string[];
};
