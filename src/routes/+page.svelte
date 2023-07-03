<script lang="ts">
  import { onMount } from "svelte";
  import Video from "./video.svelte";

  let localStream: MediaStream;

  let roomId: string;
  let userId: string;
  let isConnected = false;

  let peer: import("peerjs").Peer;
  const remoteStreams: Record<string, MediaStream> = {};

  onMount(async () => {
    await createPeer();

    if (!peer) {
      console.error("Error creating peer.");
      return;
    }

    try {
      localStream = await navigator.mediaDevices?.getUserMedia({
        video: true,
        audio: true,
      });
    } catch (err) {
      console.error("Error accessing media devices.", err);
    }
    try {
      peer.on("open", () => {
        console.log("Peer ID:", peer.id);
        userId = peer.id;
        joinRoomId(peer.id);
      });

      peer.on("call", async (call) => {
        console.log("Incoming call");

        // this is where we add a peer to the call
        await joinRoomId(call.peer, peer.id);

        call.answer(localStream);

        isConnected = true;
        roomId = call.peer;

        call.on("stream", (remoteStream) => {
          remoteStreams[call.peer] = remoteStream;
        });
      });
    } catch (err) {
      console.error("Error connecting to peer server.", err);
    }
  });

  async function createPeer() {
    if (typeof navigator === "undefined") return;
    const Peer = (await import("peerjs")).default;
    peer = new Peer();
  }

  async function joinCall(room: string) {
    if (!roomId) return;
    // although using the same endpoint, this is only to get the peers.
    // the peer is only ever added by the host
    const { peers } = (await joinRoomId(room)) ?? {};
    console.log("Peers:", peers);

    if (!peers) {
      console.error("Error joining room.");
      return;
    }

    peers.forEach(callPeer);

    isConnected = true;
  }

  function callPeer(peerId: string) {
    if (!peer) return;
    const call = peer.call(peerId, localStream);

    call.on("stream", (remoteStream) => {
      remoteStreams[peerId] = remoteStream;
    });
  }

  function endCall() {
    if (!roomId) return;
    peer.disconnect();
    peer.destroy();
    isConnected = false;
  }

  function joinRoomId(roomId: string, peerId = peer?.id) {
    if (!peer) return;

    return fetch("/api/peers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ peerId, roomId }),
    }).then(
      (res) =>
        res.json() as Promise<{
          roomId: string;
          peerId: string;
          peers: string[];
        }>
    );
  }
</script>

<h1>WebRTC Call</h1>

<div class="videos">
  <Video peerId={userId} stream={localStream} />
  {#if isConnected}
    {#each Object.keys(remoteStreams) as id}
      <Video peerId={id} stream={remoteStreams[id]} />
    {/each}
  {/if}
</div>

<div>
  {#if isConnected}
    <p>Room ID: {roomId}</p>
    <button on:click={endCall}>End Call</button>
  {:else}
    {#if userId}
      <p>
        <button on:click={() => navigator.clipboard.writeText(userId)}>
          PID: {userId}
        </button>
      </p>
    {:else}
      <p>Personal ID: Connecting</p>
    {/if}
    <input type="text" bind:value={roomId} placeholder="Room ID to join" />
    <button on:click={() => joinCall(roomId)}> Join Call </button>
  {/if}
</div>

<style>
  h1 {
    font-size: 2rem;
    font-weight: bold;
    text-align: center;
    margin-bottom: 1rem;
  }

  div {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
  }
  .videos {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  input {
    width: 100%;
    max-width: 400px;
    padding: 0.5rem;
    font-size: 1rem;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  button {
    width: 100%;
    max-width: 400px;
    padding: 0.5rem;
    font-size: 1rem;
    font-weight: bold;
    color: #fff;
    background-color: #007bff;
    border: 1px solid #007bff;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s ease-in-out, border-color 0.2s ease-in-out;
  }

  button:hover {
    background-color: #0056b3;
    border-color: #0056b3;
  }

  p {
    font-size: 1rem;
    text-align: center;
  }
</style>
