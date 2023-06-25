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

<video bind:this={localVideo} autoplay playsinline>
  <track kind="captions" />
</video>
<video bind:this={remoteVideo} autoplay playsinline>
  <track kind="captions" />
</video>

<div>
  {#if isConnected}
    <p>Room ID: {roomId}</p>
    <button>End Call</button>
  {:else}
    <p>Room ID: Not connected</p>
    {#if userId}
      <p>
        Personal ID: {userId} (You can share this for others to connect with you)
      </p>
    {:else}
      <p>Personal ID: Connecting</p>
    {/if}
    <input type="text" bind:value={roomId} />
    <button on:click={() => createPeerConnection(roomId)}> Join Call </button>
  {/if}
</div>

<style>
  video {
    width: 100%;
    max-width: 400px;
    height: 300px;
    border: 1px solid black;
  }
</style>
