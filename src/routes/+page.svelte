<script lang="ts">
  import { onMount } from "svelte";
  import io from "socket.io-client";

  let localVideo: HTMLVideoElement;
  let remoteVideo: HTMLVideoElement;

  let localStream: MediaStream;

  let roomId: string;
  let userId: string;
  let isConnected = false;

  const socket = io();

  onMount(async () => {
    try {
      localStream = await navigator.mediaDevices?.getUserMedia({
        video: true,
        audio: true,
      });
      localVideo.srcObject = localStream;
      localVideo.muted = true;

      userId = socket.id;
    } catch (err) {
      console.error("Error accessing media devices.", err);
    }
  });

  // WebRTC connection setup and handling
  let peerConnection: RTCPeerConnection;
  const configuration: RTCConfiguration = {
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302",
      },
    ],
  };

  socket.on("register", async (candidate, sender, room) => {
    if (!peerConnection) {
      await createPeerConnection(room, false);
    }

    try {
      await peerConnection.addIceCandidate(candidate);
    } catch (err) {
      console.error("Error adding received ice candidate.", err);
    }
  });

  socket.on("offer", async (offer, sender, room) => {
    if (!peerConnection) {
      await createPeerConnection(room, false);
    }

    console.log("new user joined room", room);
    await peerConnection.setRemoteDescription(offer);

    console.log("received offer", offer, room);

    roomId = room;

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    socket.emit("answer", answer, sender);
  });

  socket.on("answer", async (answer, room) => {
    console.log("received answer", answer);
    await peerConnection.setRemoteDescription(answer);

    console.log("connected", room);
  });

  async function createPeerConnection(roomId: string, withOffer = true) {
    peerConnection = new RTCPeerConnection(configuration);

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && roomId) {
        console.log("which user", roomId);
        socket.emit("register", event.candidate, socket.id, roomId);
      }
    };

    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      remoteVideo.srcObject = remoteStream;
    };

    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });

    isConnected = true;

    if (withOffer) {
      try {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        socket.emit("offer", offer, socket.id, roomId);
        console.log("sent offer", offer);
      } catch (err) {
        console.error("Error creating peer connection.", err);
      }
    }
  }
</script>

<h1>WebRTC Call</h1>

<div class="videos">
  <video bind:this={localVideo} autoplay playsinline>
    <track kind="captions" />
  </video>
  <video bind:this={remoteVideo} autoplay playsinline>
    <track kind="captions" />
  </video>
</div>

<div>
  {#if isConnected}
    <p>Room ID: {roomId}</p>
    <button>End Call</button>
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
    <button on:click={() => createPeerConnection(roomId)}> Join Call </button>
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
