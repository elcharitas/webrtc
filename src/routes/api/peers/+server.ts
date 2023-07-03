import { json } from "@sveltejs/kit";

const rooms = new Map<string, string[]>();

export async function POST({ request, cookies }) {
  const { roomId, peerId } = await request.json();

  const roomData = rooms.get(`room-${roomId}`);

  if (!roomData) {
    rooms.set(`room-${roomId}`, [peerId]);

    return json({
      roomId,
      peerId,
      peers: roomData ?? [],
    });
  }

  const peer = !!roomData.find((peer) => peer === peerId);

  if (!peer) {
    roomData.push(peerId);
    rooms.set(`room-${roomId}`, roomData);
  }

  return json({
    roomId,
    peerId,
    peers: roomData.filter((peer) => peer !== peerId),
  });
}
