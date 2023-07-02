<script lang="ts">
  import { onMount } from "svelte";

  let localVideo: HTMLVideoElement;
  let remoteVideo: HTMLVideoElement;

  let localStream: MediaStream;

  let roomId: string;
  let userId: string;
  let isConnected = false;

  let peer: import("peerjs").Peer;

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
      localVideo.srcObject = localStream;
      localVideo.muted = true;

      userId = peer.id;
    } catch (err) {
      console.error("Error accessing media devices.", err);
    }
    try {
      peer.on("open", () => {
        console.log("Peer ID:", peer.id);
      });

      peer.on("call", async (call) => {
        console.log("Incoming call");

        call.answer(localStream);

        isConnected = true;
        roomId = call.peer;

        call.on("stream", (remoteStream) => {
          remoteVideo.srcObject = remoteStream;
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

  function joinCall() {
    if (!roomId) return;
    const call = peer.call(roomId, localStream);

    call.on("stream", (remoteStream) => {
      remoteVideo.srcObject = remoteStream;
    });

    isConnected = true;
  }

  function endCall() {
    if (!roomId) return;
    peer.disconnect();
    peer.destroy();
    isConnected = false;
  }
</script>

<h1>WebRTC Call</h1>

<div class="videos">
  <video bind:this={localVideo} autoplay playsinline>
    <track kind="captions" />
  </video>
  {#if isConnected}
    <video bind:this={remoteVideo} autoplay playsinline>
      <track kind="captions" />
    </video>
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
    <button on:click={joinCall}> Join Call </button>
  {/if}
</div>

<style>
  video {
    width: 100%;
    max-width: 400px;
    height: 300px;
    border: 1px solid black;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    object-fit: cover;
    transition: box-shadow 0.3s ease-in-out;
  }

  video:hover {
    box-shadow: 0 8px 12px rgba(0, 0, 0, 0.2);
  }

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
