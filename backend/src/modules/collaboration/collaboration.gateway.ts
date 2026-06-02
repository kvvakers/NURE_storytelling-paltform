import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface RoomUser {
  socketId: string;
  userId: number;
  userName: string;
  color: string;
  room: string;
}

@WebSocketGateway({
  cors: { origin: '*', credentials: false },
  namespace: '/collaboration',
})
export class CollaborationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  private readonly socketToUser = new Map<string, RoomUser>();

  handleConnection(_client: Socket) {}

  handleDisconnect(client: Socket) {
    const user = this.socketToUser.get(client.id);
    if (user) {
      client.to(user.room).emit('user-left', { userId: user.userId });
      this.socketToUser.delete(client.id);
    }
  }

  @SubscribeMessage('join')
  handleJoin(
    @MessageBody()
    data: {
      storyId: number;
      chapterIndex: number;
      userId: number;
      userName: string;
      color: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `story-${data.storyId}-chapter-${data.chapterIndex}`;
    client.join(room);

    this.socketToUser.set(client.id, {
      socketId: client.id,
      userId: data.userId,
      userName: data.userName,
      color: data.color,
      room,
    });

    client.to(room).emit('user-joined', {
      userId: data.userId,
      userName: data.userName,
      color: data.color,
    });

    const activeUsers: Array<{ userId: number; userName: string; color: string }> = [];
    for (const [, u] of this.socketToUser) {
      if (u.room === room && u.socketId !== client.id) {
        activeUsers.push({ userId: u.userId, userName: u.userName, color: u.color });
      }
    }
    client.emit('active-users', activeUsers);
  }

  @SubscribeMessage('content-update')
  handleContentUpdate(
    @MessageBody()
    data: {
      storyId: number;
      chapterIndex: number;
      content: string;
      userId: number;
      timestamp: number;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `story-${data.storyId}-chapter-${data.chapterIndex}`;
    client.to(room).emit('content-updated', data);
  }

  @SubscribeMessage('cursor-update')
  handleCursorUpdate(
    @MessageBody()
    data: {
      storyId: number;
      chapterIndex: number;
      userId: number;
      from: number;
      to: number;
      color: string;
      userName: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `story-${data.storyId}-chapter-${data.chapterIndex}`;
    client.to(room).emit('cursor-updated', data);
  }
}
